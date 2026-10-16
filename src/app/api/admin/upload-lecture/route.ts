import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { applyWatermarkToPdf } from '@/lib/pdf-watermark';
import { saveUploadedFile } from '@/lib/file-storage';
import { parseAnkiPackage } from '@/lib/anki-parser';
import { CmsService } from '@/lib/cms-db';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';
import { Lecture, LectureFile, Flashcard } from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Authentication
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME);
    if (token?.value !== AUTH_SECRET_VALUE) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك برفع المحاضرات' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const ankiFile = formData.get('ankiFile') as File | null;
    const pptFile = formData.get('pptFile') as File | null;
    const mindmapFile = formData.get('mindmapFile') as File | null;
    const audioFile = formData.get('audioFile') as File | null;
    const questionsFile = formData.get('questionsFile') as File | null;

    const customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      ((formData.get('githubToken') as string) || '').trim();

    const externalPdfUrl = ((formData.get('externalPdfUrl') as string) || '').trim();
    const externalPptUrl = ((formData.get('externalPptUrl') as string) || '').trim();
    const externalMindmapUrl = ((formData.get('externalMindmapUrl') as string) || '').trim();
    const externalAudioUrl = ((formData.get('externalAudioUrl') as string) || '').trim();
    const audioFileSize = ((formData.get('audioFileSize') as string) || '').trim();
    const externalQuestionsUrl = ((formData.get('externalQuestionsUrl') as string) || '').trim();

    const subjectId = (formData.get('subjectId') as string) || 'anatomy';
    const yearId = (formData.get('yearId') as string) || '1';
    const rawSemester = ((formData.get('semester') as string) || '').trim();
    const semester: '1' | '2' = rawSemester === '2' ? '2' : '1';
    const lectureTitle = (formData.get('lectureTitle') as string) || '';
    const lectureNumber = Number(formData.get('lectureNumber')) || 1;
    const adminNote = (formData.get('adminNote') as string) || '';
    const overview = (formData.get('overview') as string) || '';
    const shouldWatermark = formData.get('watermark') !== 'false';
    const isFree = formData.get('isFree') !== 'false';
    const rawPrice = formData.get('price');
    const price = !isFree ? (rawPrice ? Number(rawPrice) : 50) : 0;

    const hasPdf = Boolean(file || externalPdfUrl);
    const hasPpt = Boolean(pptFile || externalPptUrl);
    const hasMindmap = Boolean(mindmapFile || externalMindmapUrl);
    const hasAudio = Boolean(audioFile || externalAudioUrl);
    const hasQuestions = Boolean(questionsFile || externalQuestionsUrl);
    const flashcardsJsonRaw = (formData.get('flashcardsJson') as string | null) || '';
    const hasAnki = Boolean(ankiFile || (flashcardsJsonRaw && flashcardsJsonRaw !== '[]'));

    if (!lectureTitle.trim() || (!hasPdf && !hasPpt && !hasMindmap && !hasAudio && !hasAnki && !hasQuestions)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'يرجى كتابة اسم المحاضرة ورفع محتوى واحد على الأقل (ملف PDF أو ريكورد صوتي أو بوربوينت أو خريطة ذهنية أو كروت Anki أو ملف أسئلة)',
        },
        { status: 400 }
      );
    }

    const allSubjects = await CmsService.getAllSubjects();
    const subjectObj = allSubjects.find((s) => s.id === subjectId) ||
      MOCK_SUBJECTS.find((s) => s.id === subjectId) || {
        id: subjectId,
        title: 'مقرر تمريض',
      };

    // 2. Process & Watermark Primary PDF (only if provided!)
    let savedPdf = { url: externalPdfUrl, sizeFormatted: 'رابط سحابي 🌐' };

    if (file) {
      const originalBuffer = await file.arrayBuffer();
      let processedBytes = new Uint8Array(originalBuffer);

      if (shouldWatermark) {
        try {
          processedBytes = await applyWatermarkToPdf(originalBuffer);
        } catch (watermarkErr) {
          console.warn('[UploadLecture] Watermark fallback to original buffer:', watermarkErr);
        }
      }

      savedPdf = await saveUploadedFile(processedBytes, file.name, customToken);
    }

    // 3. Process Flashcards (Anki .apkg / JSON / TXT extraction strictly from user file)
    let flashcards: Flashcard[] = [];
    const flashcardsJson = formData.get('flashcardsJson') as string | null;
    if (flashcardsJson) {
      try {
        const parsed = JSON.parse(flashcardsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          flashcards = parsed;
        }
      } catch (jsonErr) {
        console.warn('[UploadLecture] Failed to parse flashcardsJson:', jsonErr);
      }
    }

    if (flashcards.length === 0 && ankiFile) {
      try {
        const ankiBuffer = await ankiFile.arrayBuffer();
        flashcards = await parseAnkiPackage(ankiBuffer);
      } catch (err: any) {
        console.warn('[UploadLecture] Anki parsing error:', err.message);
      }
    }

    // Clean any raw LaTeX, math symbols, and ugly brackets from card texts
    if (flashcards.length > 0) {
      flashcards = flashcards.map((c) => ({
        ...c,
        front: cleanLatexMath(c.front),
        back: cleanLatexMath(c.back),
        clinicalPearl: c.clinicalPearl ? cleanLatexMath(c.clinicalPearl) : undefined,
      }));
    }
    // Zero fake cards - strictly uses what the user uploaded!

    // 4. Construct Files Array (PDF, PPT, Mindmap, Audio) - Only push resources that actually have content!
    const filesList: LectureFile[] = [];

    if (hasPdf && savedPdf.url) {
      filesList.push({
        type: 'pdf',
        title: lectureTitle.trim(),
        fileSize: savedPdf.sizeFormatted,
        downloadUrl: savedPdf.url,
        pageCount: 'ملف PDF معتمد',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف رسمي بعلامة مائية معتمدة جاهز للتنزيل والطباعة',
      });
    }

    if (pptFile) {
      const pptBuffer = new Uint8Array(await pptFile.arrayBuffer());
      const savedPpt = await saveUploadedFile(pptBuffer, pptFile.name, customToken);
      filesList.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${lectureTitle.trim()}`,
        fileSize: savedPpt.sizeFormatted,
        downloadUrl: savedPpt.url,
        pageCount: 'سلايدات PowerPoint',
        updatedAt: getArabicFormattedDate(),
        customNote: 'عروض تقديمية وسلايدات الشرح الجامعي الرسمية',
      });
    } else if (externalPptUrl) {
      filesList.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${lectureTitle.trim()}`,
        fileSize: 'رابط درايف 🌐',
        downloadUrl: externalPptUrl,
        pageCount: 'سلايدات PowerPoint',
        updatedAt: getArabicFormattedDate(),
        customNote: 'عروض تقديمية وسلايدات الشرح الجامعي عبر رابط مباشر',
      });
    }

    if (mindmapFile) {
      const mmBuffer = new Uint8Array(await mindmapFile.arrayBuffer());
      const savedMm = await saveUploadedFile(mmBuffer, mindmapFile.name, customToken);
      filesList.push({
        type: 'mindmap',
        title: `الخريطة الذهنية الشاملة - ${lectureTitle.trim()}`,
        fileSize: savedMm.sizeFormatted,
        downloadUrl: savedMm.url,
        pageCount: 'خريطة ذهنية عالية الدقة',
        updatedAt: getArabicFormattedDate(),
        customNote: 'رسم تخطيطي وهيكلي لربط محاور المحاضرة وسرعة الاستذكار',
      });
    } else if (externalMindmapUrl) {
      filesList.push({
        type: 'mindmap',
        title: `الخريطة الذهنية الشاملة - ${lectureTitle.trim()}`,
        fileSize: 'رابط درايف 🌐',
        downloadUrl: externalMindmapUrl,
        pageCount: 'خريطة ذهنية عالية الدقة',
        updatedAt: getArabicFormattedDate(),
        customNote: 'رسم تخطيطي وهيكلي لربط محاور المحاضرة عبر رابط مباشر',
      });
    }

    if (audioFile) {
      const audioBuffer = new Uint8Array(await audioFile.arrayBuffer());
      const savedAudio = await saveUploadedFile(audioBuffer, audioFile.name, customToken);
      filesList.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${lectureTitle.trim()}`,
        fileSize: savedAudio.sizeFormatted,
        downloadUrl: savedAudio.url,
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    } else if (externalAudioUrl) {
      filesList.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${lectureTitle.trim()}`,
        fileSize: audioFileSize || 'ملف صوتي سحابي 🎧',
        downloadUrl: externalAudioUrl,
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    }

    if (questionsFile) {
      const qBuffer = await questionsFile.arrayBuffer();
      let processedQBytes = new Uint8Array(qBuffer);
      if (shouldWatermark && (questionsFile.type === 'application/pdf' || questionsFile.name.endsWith('.pdf'))) {
        try {
          processedQBytes = await applyWatermarkToPdf(qBuffer);
        } catch (qWmErr) {
          console.warn('[UploadLecture] Questions watermark fallback:', qWmErr);
        }
      }
      const savedQ = await saveUploadedFile(processedQBytes, questionsFile.name, customToken);
      filesList.push({
        type: 'questions',
        title: `أسئلة وتمارين المحاضرة - ${lectureTitle.trim()}`,
        fileSize: savedQ.sizeFormatted,
        downloadUrl: savedQ.url,
        pageCount: 'بنك أسئلة وتدريبات PDF',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف أسئلة وتدريبات واختبارات لتقييم فهم المحاضرة',
      });
    } else if (externalQuestionsUrl) {
      filesList.push({
        type: 'questions',
        title: `أسئلة وتمارين المحاضرة - ${lectureTitle.trim()}`,
        fileSize: 'رابط درايف 🌐',
        downloadUrl: externalQuestionsUrl,
        pageCount: 'بنك أسئلة وتدريبات PDF',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف أسئلة وتدريبات واختبارات لتقييم فهم المحاضرة عبر رابط مباشر',
      });
    }

    // 5. Construct New Lecture Record
    const lectureId = `lec-${Date.now()}`;
    const newLecture: Lecture = {
      id: lectureId,
      subjectId,
      yearId,
      semester,
      subjectTitle: subjectObj.title,
      yearTitle: yearId === '1' ? 'السنة الأولى' : yearId === '2' ? 'السنة الثانية' : yearId === '3' ? 'السنة الثالثة' : 'السنة الرابعة',
      slug: lectureId,
      lectureNumber,
      title: lectureTitle.trim(),
      subtitle: `شرح وملخص معتمد لمادة ${subjectObj.title}`,
      isFree,
      price,
      viewCount: 1,
      readingMinutes: 10,
      threeDModelType: 'heart',
      overview: overview.trim(),
      concepts: [],
      terminology: [],
      interventions: [],
      clinicalPearls: [],
      flashcards,
      quiz: [],
      files: filesList,
      adminNote: adminNote.trim() || 'تأكد من قراءة التلخيص وحل أسئلة الامتحانات السابقة لتثبيت المعلومة.',
    };

    // 6. Save in CMS Database (Instant live updates!)
    await CmsService.addOrUpdateLecture(newLecture, customToken);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
      revalidatePath(`/subject/${subjectId}`, 'page');
    } catch {}

    // 7. Send Immediate Telegram Notification to Admin
    const telegramAlert = `🚀 <b>تم رفع ونشر محاضرة جديدة متكاملة في المنصة!</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>اسم المحاضرة:</b> ${lectureTitle.trim()}
📚 <b>المادة:</b> ${subjectObj.title}
📅 <b>الفصل الدراسي:</b> سمستر ${semester} (${semester === '2' ? 'الترم الثاني' : 'الترم الأول'})
🔢 <b>رقم المحاضرة:</b> ${lectureNumber}
📄 <b>ملف الـ PDF:</b> (${savedPdf.sizeFormatted}) ${shouldWatermark ? '🛡️ مع العلامة المائية' : ''}
🖥️ <b>ملف البوربوينت:</b> ${pptFile || externalPptUrl ? 'مرفوع جاهز ✅' : 'غير مرفق'}
🗺️ <b>الخريطة الذهنية:</b> ${mindmapFile || externalMindmapUrl ? 'مرفوعة جاهزة ✅' : 'غير مرفقة'}
🎧 <b>الملف الصوتي (الريكورد):</b> ${audioFile || externalAudioUrl ? 'مرفوع جاهز للاستماع 🎵✅' : 'غير مرفق'}
❓ <b>ملف الأسئلة:</b> ${questionsFile || externalQuestionsUrl ? 'مرفوع جاهز ❓✅' : 'غير مرفق'}
🃏 <b>كروت الفلاش كاردز:</b> ${flashcards.length} بطاقة استذكار داخلية تفاعلية ${ankiFile ? '(مستخرجة من Anki .apkg 🎴)' : ''}
⏰ <b>التوقيت:</b> ${getArabicFormattedDate()}
━━━━━━━━━━━━━━━━━━━━
<i>المحاضرة متاحة للطلاب الآن وتسمّع في الموقع فوراً! 🩺</i>`;

    sendTelegramMessage(telegramAlert).catch((e) =>
      console.warn('Telegram notification error:', e)
    );

    return NextResponse.json({
      success: true,
      lecture: newLecture,
      message: `تم رفع المحاضرة و${flashcards.length} كارت فلاش كاردز بنجاح! نُشرت فوراً لجميع الطلاب 🚀`,
    });
  } catch (err: any) {
    console.error('[UploadLecture] Failed:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'حدث خطأ أثناء معالجة الملفات' },
      { status: 500 }
    );
  }
}
