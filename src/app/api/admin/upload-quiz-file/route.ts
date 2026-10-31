import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { applyWatermarkToPdf } from '@/lib/pdf-watermark';
import { saveUploadedFile } from '@/lib/file-storage';
import { CmsService } from '@/lib/cms-db';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';
import { parseAnkiPackage } from '@/lib/anki-parser';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Authentication
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME);
    if (token?.value !== AUTH_SECRET_VALUE) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك برفع الملفات' },
        { status: 401 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    let formData: FormData | null = null;
    let jsonBody: any = null;

    if (isMultipart) {
      formData = await req.formData();
    } else {
      jsonBody = await req.json().catch(() => ({}));
    }

    const getString = (key: string): string => {
      if (formData) return ((formData.get(key) as string) || '').trim();
      return jsonBody?.[key] !== undefined ? String(jsonBody[key]).trim() : '';
    };

    const file = formData ? (formData.get('file') as File | null) : null;
    const externalDriveUrl = getString('externalDriveUrl');
    const explanationFile = formData ? (formData.get('explanationFile') as File | null) : null;
    const externalExplanationUrl = getString('externalExplanationUrl');
    const explanationTitle = getString('explanationTitle');

    // Multimedia attachments
    const pptFile = formData ? (formData.get('pptFile') as File | null) : null;
    const externalPptUrl = getString('externalPptUrl');
    const pptTitle = getString('pptTitle');

    const audioFile = formData ? (formData.get('audioFile') as File | null) : null;
    const externalAudioUrl = getString('externalAudioUrl');
    const audioTitle = getString('audioTitle');

    const videoFile = formData ? (formData.get('videoFile') as File | null) : null;
    const externalVideoUrl = getString('externalVideoUrl');
    const videoTitle = getString('videoTitle');
    const videoDuration = getString('videoDuration');

    const mindmapFile = formData ? (formData.get('mindmapFile') as File | null) : null;
    const externalMindmapUrl = getString('externalMindmapUrl');
    const mindmapTitle = getString('mindmapTitle');

    const ankiFile = formData ? (formData.get('ankiFile') as File | null) : null;
    const flashcardsJson = formData ? ((formData.get('flashcardsJson') as string) || '').trim() : (jsonBody?.flashcardsJson ? JSON.stringify(jsonBody.flashcardsJson) : '');

    const subjectId = getString('subjectId') || 'anatomy';
    const rawSemester = getString('semester');
    const semester: '1' | '2' = rawSemester === '2' ? '2' : '1';
    const customQuizTitle = getString('quizTitle');
    const questionsCount = Number(getString('questionsCount')) || 150;
    const shouldWatermark = formData ? formData.get('watermark') !== 'false' : jsonBody?.watermark !== false;
    const isFree = formData ? formData.get('isFree') !== 'false' : jsonBody?.isFree !== false;
    const isLive = formData ? formData.get('isLive') !== 'false' : jsonBody?.isLive !== false;

    if (!file && !externalDriveUrl) {
      return NextResponse.json(
        { success: false, message: 'يرجى اختيار ملف PDF لأسئلة الكويزات أو إدخال رابط Google Drive' },
        { status: 400 }
      );
    }

    const allSubjects = await CmsService.getAllSubjects();
    const subjectObj =
      allSubjects.find((s) => s.id === subjectId) ||
      MOCK_SUBJECTS.find((s) => s.id === subjectId) || {
        id: subjectId,
        title: 'مقرر تمريض',
      };

    const customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      getString('githubToken');

    let savedPdf = {
      url: externalDriveUrl,
      sizeFormatted: 'رابط Google Drive 🌐',
    };

    if (file) {
      // 2. Process & Apply Watermark
      const originalBuffer = await file.arrayBuffer();
      let processedBytes = new Uint8Array(originalBuffer);

      if (shouldWatermark) {
        try {
          processedBytes = await applyWatermarkToPdf(originalBuffer);
        } catch (watermarkErr) {
          console.warn('[UploadQuizFile] Watermark fallback to original:', watermarkErr);
        }
      }

      // 3. Save File
      savedPdf = await saveUploadedFile(processedBytes, file.name, customToken);
    }

    // Process Explanation File / URL (ملف الشرح وتوضيح الإجابات)
    let savedExplanation: { url: string; sizeFormatted: string } | null = null;
    if (explanationFile) {
      const expBuffer = await explanationFile.arrayBuffer();
      let processedExpBytes = new Uint8Array(expBuffer);
      if (shouldWatermark && (explanationFile.type === 'application/pdf' || explanationFile.name.endsWith('.pdf'))) {
        try {
          processedExpBytes = await applyWatermarkToPdf(expBuffer);
        } catch (expWmErr) {
          console.warn('[UploadQuizFile] Explanation watermark fallback:', expWmErr);
        }
      }
      const savedExp = await saveUploadedFile(processedExpBytes, explanationFile.name, customToken);
      savedExplanation = { url: savedExp.url, sizeFormatted: savedExp.sizeFormatted };
    } else if (externalExplanationUrl) {
      savedExplanation = { url: externalExplanationUrl, sizeFormatted: 'رابط خارجي 🌐' };
    }

    // Process PowerPoint File / URL (عرض تقديمي بوربوينت)
    let savedPpt: { url: string; sizeFormatted: string } | null = null;
    if (pptFile) {
      const pptBuffer = await pptFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(pptBuffer), pptFile.name, customToken);
      savedPpt = { url: saved.url, sizeFormatted: saved.sizeFormatted };
    } else if (externalPptUrl) {
      savedPpt = { url: externalPptUrl, sizeFormatted: 'عرض بوربوينت 📊' };
    }

    // Process Audio File / URL (تسجيل وملخص صوتي)
    let savedAudio: { url: string; sizeFormatted: string } | null = null;
    if (audioFile) {
      const audioBuffer = await audioFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(audioBuffer), audioFile.name, customToken);
      savedAudio = { url: saved.url, sizeFormatted: saved.sizeFormatted };
    } else if (externalAudioUrl) {
      savedAudio = { url: externalAudioUrl, sizeFormatted: 'تسجيل صوتي 🎧' };
    }

    // Process Video File / URL (فيديو شرح وحل أسئلة الكويز)
    let savedVideo: { url: string; sizeFormatted: string } | null = null;
    if (videoFile) {
      const videoBuffer = await videoFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(videoBuffer), videoFile.name, customToken);
      savedVideo = { url: saved.url, sizeFormatted: saved.sizeFormatted };
    } else if (externalVideoUrl) {
      savedVideo = { url: externalVideoUrl, sizeFormatted: 'فيديو شرح 🎬' };
    }

    // Process Mindmap File / URL (خريطة ذهنية)
    let savedMindmap: { url: string; sizeFormatted: string } | null = null;
    if (mindmapFile) {
      const mindmapBuffer = await mindmapFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(mindmapBuffer), mindmapFile.name, customToken);
      savedMindmap = { url: saved.url, sizeFormatted: saved.sizeFormatted };
    } else if (externalMindmapUrl) {
      savedMindmap = { url: externalMindmapUrl, sizeFormatted: 'خريطة ذهنية 🧠' };
    }

    // Process Flashcards (بطاقات استذكار - JSON جاهز أو حزمة Anki .apkg)
    let parsedFlashcards: any[] | null = null;
    if (flashcardsJson) {
      try {
        const parsed = JSON.parse(flashcardsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedFlashcards = parsed;
        }
      } catch (err) {
        console.warn('[UploadQuizFile] flashcardsJson parse error:', err);
      }
    }
    if (!parsedFlashcards && ankiFile) {
      try {
        const ankiBuffer = await ankiFile.arrayBuffer();
        const cards = await parseAnkiPackage(ankiBuffer);
        if (cards && cards.length > 0) {
          parsedFlashcards = cards;
        }
      } catch (ankiErr) {
        console.warn('[UploadQuizFile] Anki parse error:', ankiErr);
      }
    }

    // Check existing quizzes for this subject to auto-number if no custom title provided
    const existingForSub = await CmsService.getSubjectQuizFiles(subjectId);
    const defaultTitle =
      existingForSub.length === 0
        ? `بنك أسئلة الكويزات المجمعة - ${subjectObj.title}`
        : `ملف أسئلة الكويزات (${existingForSub.length + 1}) - ${subjectObj.title}`;

    const finalTitle = customQuizTitle || defaultTitle;

    // 4. Save to CMS (adds as a new quiz file without overwriting previous ones!)
    const quizFile = await CmsService.saveSubjectQuizFile(
      {
        subjectId,
        subjectTitle: subjectObj.title,
        semester,
        title: finalTitle,
        description: `ملف PDF شامل ومحدث يحتوي على بنك أسئلة الكويزات الدورية، امتحانات الميدتيرم، وأسئلة الاختيار من متعدد (MCQ) المحلولة لمقرر ${subjectObj.title} (سمستر ${semester}).`,
        fileSize: savedPdf.sizeFormatted,
        downloadUrl: savedPdf.url,
        questionsCount,
        updatedAt: `تم التحديث في ${getArabicFormattedDate()}`,
        explanationUrl: savedExplanation?.url || undefined,
        explanationTitle: explanationTitle || (savedExplanation?.url ? 'ملف الشرح وتوضيح الإجابات' : undefined),
        explanationFileSize: savedExplanation?.sizeFormatted || undefined,
        pptUrl: savedPpt?.url || undefined,
        pptTitle: pptTitle || (savedPpt ? 'العرض التقديمي (PowerPoint)' : undefined),
        pptFileSize: savedPpt?.sizeFormatted || undefined,
        audioUrl: savedAudio?.url || undefined,
        audioTitle: audioTitle || (savedAudio ? 'شرح وتسجيل صوتي للكويز' : undefined),
        audioFileSize: savedAudio?.sizeFormatted || undefined,
        videoUrl: savedVideo?.url || undefined,
        videoTitle: videoTitle || (savedVideo ? 'فيديو شرح وحل أسئلة الكويز' : undefined),
        videoFileSize: savedVideo?.sizeFormatted || undefined,
        videoDuration: videoDuration || undefined,
        mindmapUrl: savedMindmap?.url || undefined,
        mindmapTitle: mindmapTitle || (savedMindmap ? 'خريطة ذهنية للأسئلة والمراجعة' : undefined),
        mindmapFileSize: savedMindmap?.sizeFormatted || undefined,
        flashcards: parsedFlashcards && parsedFlashcards.length > 0 ? parsedFlashcards : undefined,
        flashcardsCount: parsedFlashcards && parsedFlashcards.length > 0 ? parsedFlashcards.length : undefined,
        isFree,
        isLive,
      },
      customToken
    );

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
      revalidatePath(`/subject/${subjectId}`, 'page');
    } catch {}

    // 5. Send Telegram notification
    const time = getArabicFormattedDate();
    const fileNameDisplay = file ? `<code>${file.name}</code>` : 'رابط Google Drive خارجي 🌐';
    const watermarkDisplay = file && shouldWatermark ? 'تم التطبيق بنجاح ✅' : file ? 'بدون علامة' : 'ملف سحابي خارجي';
    const explanationDisplay = savedExplanation?.url ? 'مرفق ملف شرح 📖' : 'بدون ملف شرح';
    const pptDisplay = savedPpt?.url ? 'مرفق باوربوينت 📊' : '';
    const audioDisplay = savedAudio?.url ? 'مرفق ريكورد صوتي 🎧' : '';
    const videoDisplay = savedVideo?.url ? 'مرفق فيديو شرح وحل 🎬' : '';
    const cardsDisplay = parsedFlashcards?.length ? `مرفق بطاقات استذكار 🎴 (+${parsedFlashcards.length} كارت)` : '';
    const mindmapDisplay = savedMindmap?.url ? 'مرفق خريطة ذهنية 🧠' : '';
    const freeDisplay = isFree ? 'متاح مجاناً للجميع 🎁' : 'مقفول باشتراك 🔒';
    const liveDisplay = isLive ? 'منشور وظاهر للطلاب 👁️' : 'مسودة مخفية 🙈';

    const extraMedia = [explanationDisplay, pptDisplay, audioDisplay, videoDisplay, cardsDisplay, mindmapDisplay].filter(Boolean).join(' | ');

    const telegramMsg = `📝 <b>تم إضافة ملف أسئلة كويزات جديد مع مرفقات شاملة!</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>المادة:</b> ${subjectObj.title}
📅 <b>الفصل الدراسي:</b> سمستر ${semester} (${semester === '2' ? 'الترم الثاني' : 'الترم الأول'})
🏷️ <b>العنوان:</b> ${finalTitle}
📄 <b>الملف:</b> ${fileNameDisplay}
💾 <b>الحجم / المصدر:</b> ${savedPdf.sizeFormatted}
📦 <b>المرفقات:</b> ${extraMedia || 'ملف الأسئلة فقط'}
🔓 <b>حالة الإتاحة:</b> ${freeDisplay}
👁️ <b>حالة الظهور:</b> ${liveDisplay}
❓ <b>عدد الأسئلة:</b> +${questionsCount} سؤال
⏰ <b>التوقيت:</b> ${time}
🛡️ <b>العلامة المائية:</b> ${watermarkDisplay}`;

    sendTelegramMessage(telegramMsg).catch((err) =>
      console.warn('[Telegram] Quiz file alert notice:', err)
    );

    return NextResponse.json({
      success: true,
      message: `تم إضافة ملف الكويز "${finalTitle}" لمادة "${subjectObj.title}" (سمستر ${semester}) بنجاح! 🚀`,
      quizFile,
    });
  } catch (err: any) {
    console.error('[UploadQuizFile] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل رفع ملف أسئلة الكويزات' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (subjectId) {
      const quizzesList = await CmsService.getSubjectQuizFiles(subjectId);
      return NextResponse.json(
        { success: true, quiz: quizzesList[0] || null, quizzesList },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const allQuizzes = await CmsService.getAllSubjectQuizFiles();
    const quizzesList = await CmsService.getAllSubjectQuizFilesList();
    return NextResponse.json(
      { success: true, quizzes: allQuizzes, quizzesList },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let id = '';
    let semester: '1' | '2' | undefined;
    let title: string | undefined;
    let subjectId: string | undefined;
    let questionsCount: number | undefined;
    let downloadUrl: string | undefined;
    let fileSize: string | undefined;
    let isFree: boolean | undefined;
    let isLive: boolean | undefined;
    let file: File | null = null;
    let explanationFile: File | null = null;
    let externalExplanationUrl: string | undefined;
    let explanationTitle: string | undefined;
    let removeExplanation = false;

    // Multimedia in PATCH
    let pptFile: File | null = null;
    let externalPptUrl: string | undefined;
    let pptTitle: string | undefined;
    let removePpt = false;

    let audioFile: File | null = null;
    let externalAudioUrl: string | undefined;
    let audioTitle: string | undefined;
    let removeAudio = false;

    let videoFile: File | null = null;
    let externalVideoUrl: string | undefined;
    let videoTitle: string | undefined;
    let videoDuration: string | undefined;
    let removeVideo = false;

    let mindmapFile: File | null = null;
    let externalMindmapUrl: string | undefined;
    let mindmapTitle: string | undefined;
    let removeMindmap = false;

    let ankiFile: File | null = null;
    let flashcardsJson: string | undefined;
    let removeFlashcards = false;

    let shouldWatermark = true;
    let customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      id = ((formData.get('id') as string) || '').trim();
      const rawSem = formData.get('semester') as string | null;
      if (rawSem === '1' || rawSem === '2') semester = rawSem;
      if (formData.get('title') !== null) title = ((formData.get('title') as string) || '').trim();
      if (formData.get('subjectId') !== null) subjectId = ((formData.get('subjectId') as string) || '').trim();
      if (formData.get('questionsCount') !== null) {
        questionsCount = Number(formData.get('questionsCount')) || 100;
      }
      if (formData.get('downloadUrl') !== null) {
        downloadUrl = ((formData.get('downloadUrl') as string) || '').trim();
      }
      if (formData.get('isFree') !== null) {
        isFree = formData.get('isFree') !== 'false';
      }
      if (formData.get('isLive') !== null) {
        isLive = formData.get('isLive') !== 'false';
      }
      file = formData.get('file') as File | null;
      explanationFile = formData.get('explanationFile') as File | null;
      if (formData.get('externalExplanationUrl') !== null) {
        externalExplanationUrl = ((formData.get('externalExplanationUrl') as string) || '').trim();
      }
      if (formData.get('explanationTitle') !== null) {
        explanationTitle = ((formData.get('explanationTitle') as string) || '').trim();
      }
      removeExplanation = formData.get('removeExplanation') === 'true';

      // Multimedia
      pptFile = formData.get('pptFile') as File | null;
      if (formData.get('externalPptUrl') !== null) {
        externalPptUrl = ((formData.get('externalPptUrl') as string) || '').trim();
      }
      if (formData.get('pptTitle') !== null) {
        pptTitle = ((formData.get('pptTitle') as string) || '').trim();
      }
      removePpt = formData.get('removePpt') === 'true';

      audioFile = formData.get('audioFile') as File | null;
      if (formData.get('externalAudioUrl') !== null) {
        externalAudioUrl = ((formData.get('externalAudioUrl') as string) || '').trim();
      }
      if (formData.get('audioTitle') !== null) {
        audioTitle = ((formData.get('audioTitle') as string) || '').trim();
      }
      removeAudio = formData.get('removeAudio') === 'true';

      videoFile = formData.get('videoFile') as File | null;
      if (formData.get('externalVideoUrl') !== null) {
        externalVideoUrl = ((formData.get('externalVideoUrl') as string) || '').trim();
      }
      if (formData.get('videoTitle') !== null) {
        videoTitle = ((formData.get('videoTitle') as string) || '').trim();
      }
      if (formData.get('videoDuration') !== null) {
        videoDuration = ((formData.get('videoDuration') as string) || '').trim();
      }
      removeVideo = formData.get('removeVideo') === 'true';

      mindmapFile = formData.get('mindmapFile') as File | null;
      if (formData.get('externalMindmapUrl') !== null) {
        externalMindmapUrl = ((formData.get('externalMindmapUrl') as string) || '').trim();
      }
      if (formData.get('mindmapTitle') !== null) {
        mindmapTitle = ((formData.get('mindmapTitle') as string) || '').trim();
      }
      removeMindmap = formData.get('removeMindmap') === 'true';

      ankiFile = formData.get('ankiFile') as File | null;
      if (formData.get('flashcardsJson') !== null) {
        flashcardsJson = ((formData.get('flashcardsJson') as string) || '').trim();
      }
      removeFlashcards = formData.get('removeFlashcards') === 'true';

      shouldWatermark = formData.get('watermark') !== 'false';
      const fToken = ((formData.get('githubToken') as string) || '').trim();
      if (fToken) customToken = fToken;
    } else {
      const body = await req.json();
      id = body.id;
      if (body.semester === '1' || body.semester === '2') semester = body.semester;
      if (body.title !== undefined) title = String(body.title).trim();
      if (body.subjectId !== undefined) subjectId = String(body.subjectId).trim();
      if (body.questionsCount !== undefined) questionsCount = Number(body.questionsCount);
      if (body.downloadUrl !== undefined) downloadUrl = String(body.downloadUrl).trim();
      if (body.externalExplanationUrl !== undefined) externalExplanationUrl = String(body.externalExplanationUrl).trim();
      if (body.explanationTitle !== undefined) explanationTitle = String(body.explanationTitle).trim();
      if (body.isFree !== undefined) isFree = Boolean(body.isFree);
      if (body.isLive !== undefined) isLive = Boolean(body.isLive);
      removeExplanation = Boolean(body.removeExplanation);

      if (body.externalPptUrl !== undefined) externalPptUrl = String(body.externalPptUrl).trim();
      if (body.pptTitle !== undefined) pptTitle = String(body.pptTitle).trim();
      removePpt = Boolean(body.removePpt);

      if (body.externalAudioUrl !== undefined) externalAudioUrl = String(body.externalAudioUrl).trim();
      if (body.audioTitle !== undefined) audioTitle = String(body.audioTitle).trim();
      removeAudio = Boolean(body.removeAudio);

      if (body.externalVideoUrl !== undefined) externalVideoUrl = String(body.externalVideoUrl).trim();
      if (body.videoTitle !== undefined) videoTitle = String(body.videoTitle).trim();
      if (body.videoDuration !== undefined) videoDuration = String(body.videoDuration).trim();
      removeVideo = Boolean(body.removeVideo);

      if (body.externalMindmapUrl !== undefined) externalMindmapUrl = String(body.externalMindmapUrl).trim();
      if (body.mindmapTitle !== undefined) mindmapTitle = String(body.mindmapTitle).trim();
      removeMindmap = Boolean(body.removeMindmap);

      if (body.flashcardsJson !== undefined) flashcardsJson = String(body.flashcardsJson).trim();
      removeFlashcards = Boolean(body.removeFlashcards);

      if (body.token) customToken = body.token;
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف الكويز مطلوب' }, { status: 400 });
    }

    if (file) {
      const originalBuffer = await file.arrayBuffer();
      let processedBytes = new Uint8Array(originalBuffer);
      if (shouldWatermark) {
        try {
          processedBytes = await applyWatermarkToPdf(originalBuffer);
        } catch (watermarkErr) {
          console.warn('[EditQuizFile] Watermark fallback:', watermarkErr);
        }
      }
      const savedPdf = await saveUploadedFile(processedBytes, file.name, customToken);
      downloadUrl = savedPdf.url;
      fileSize = savedPdf.sizeFormatted;
    } else if (downloadUrl && downloadUrl.startsWith('http')) {
      fileSize = 'رابط Google Drive 🌐';
    }

    let updatedExplanationUrl: string | undefined = undefined;
    let updatedExplanationSize: string | undefined = undefined;
    let updatedExplanationTitle: string | undefined = undefined;

    if (removeExplanation) {
      updatedExplanationUrl = '';
      updatedExplanationSize = '';
      updatedExplanationTitle = '';
    } else if (explanationFile) {
      const expBuffer = await explanationFile.arrayBuffer();
      let processedExpBytes = new Uint8Array(expBuffer);
      if (shouldWatermark && (explanationFile.type === 'application/pdf' || explanationFile.name.endsWith('.pdf'))) {
        try {
          processedExpBytes = await applyWatermarkToPdf(expBuffer);
        } catch (expWmErr) {
          console.warn('[EditQuizFile] Explanation watermark fallback:', expWmErr);
        }
      }
      const savedExp = await saveUploadedFile(processedExpBytes, explanationFile.name, customToken);
      updatedExplanationUrl = savedExp.url;
      updatedExplanationSize = savedExp.sizeFormatted;
      updatedExplanationTitle = explanationTitle || 'ملف الشرح وتوضيح الإجابات';
    } else if (externalExplanationUrl !== undefined) {
      if (externalExplanationUrl) {
        updatedExplanationUrl = externalExplanationUrl;
        updatedExplanationSize = 'رابط خارجي 🌐';
        updatedExplanationTitle = explanationTitle || 'ملف الشرح وتوضيح الإجابات';
      } else {
        updatedExplanationUrl = '';
        updatedExplanationSize = '';
        updatedExplanationTitle = '';
      }
    } else if (explanationTitle !== undefined) {
      updatedExplanationTitle = explanationTitle;
    }

    // Process PPT updates
    let updatedPptUrl: string | undefined = undefined;
    let updatedPptSize: string | undefined = undefined;
    let updatedPptTitle: string | undefined = undefined;
    if (removePpt) {
      updatedPptUrl = '';
      updatedPptSize = '';
      updatedPptTitle = '';
    } else if (pptFile) {
      const pptBuf = await pptFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(pptBuf), pptFile.name, customToken);
      updatedPptUrl = saved.url;
      updatedPptSize = saved.sizeFormatted;
      updatedPptTitle = pptTitle || 'العرض التقديمي (PowerPoint)';
    } else if (externalPptUrl !== undefined) {
      if (externalPptUrl) {
        updatedPptUrl = externalPptUrl;
        updatedPptSize = 'عرض بوربوينت 📊';
        updatedPptTitle = pptTitle || 'العرض التقديمي (PowerPoint)';
      } else {
        updatedPptUrl = '';
        updatedPptSize = '';
        updatedPptTitle = '';
      }
    } else if (pptTitle !== undefined) {
      updatedPptTitle = pptTitle;
    }

    // Process Audio updates
    let updatedAudioUrl: string | undefined = undefined;
    let updatedAudioSize: string | undefined = undefined;
    let updatedAudioTitle: string | undefined = undefined;
    if (removeAudio) {
      updatedAudioUrl = '';
      updatedAudioSize = '';
      updatedAudioTitle = '';
    } else if (audioFile) {
      const audioBuf = await audioFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(audioBuf), audioFile.name, customToken);
      updatedAudioUrl = saved.url;
      updatedAudioSize = saved.sizeFormatted;
      updatedAudioTitle = audioTitle || 'تسجيل وملخص صوتي';
    } else if (externalAudioUrl !== undefined) {
      if (externalAudioUrl) {
        updatedAudioUrl = externalAudioUrl;
        updatedAudioSize = 'تسجيل صوتي 🎧';
        updatedAudioTitle = audioTitle || 'تسجيل وملخص صوتي';
      } else {
        updatedAudioUrl = '';
        updatedAudioSize = '';
        updatedAudioTitle = '';
      }
    } else if (audioTitle !== undefined) {
      updatedAudioTitle = audioTitle;
    }

    // Process Video updates
    let updatedVideoUrl: string | undefined = undefined;
    let updatedVideoSize: string | undefined = undefined;
    let updatedVideoTitle: string | undefined = undefined;
    let updatedVideoDuration: string | undefined = undefined;
    if (removeVideo) {
      updatedVideoUrl = '';
      updatedVideoSize = '';
      updatedVideoTitle = '';
      updatedVideoDuration = '';
    } else if (videoFile) {
      const vidBuf = await videoFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(vidBuf), videoFile.name, customToken);
      updatedVideoUrl = saved.url;
      updatedVideoSize = saved.sizeFormatted;
      updatedVideoTitle = videoTitle || 'فيديو شرح وحل أسئلة الكويز';
      updatedVideoDuration = videoDuration || undefined;
    } else if (externalVideoUrl !== undefined) {
      if (externalVideoUrl) {
        updatedVideoUrl = externalVideoUrl;
        updatedVideoSize = 'فيديو شرح 🎬';
        updatedVideoTitle = videoTitle || 'فيديو شرح وحل أسئلة الكويز';
        updatedVideoDuration = videoDuration || undefined;
      } else {
        updatedVideoUrl = '';
        updatedVideoSize = '';
        updatedVideoTitle = '';
        updatedVideoDuration = '';
      }
    } else if (videoTitle !== undefined) {
      updatedVideoTitle = videoTitle;
    }

    // Process Mindmap updates
    let updatedMindmapUrl: string | undefined = undefined;
    let updatedMindmapSize: string | undefined = undefined;
    let updatedMindmapTitle: string | undefined = undefined;
    if (removeMindmap) {
      updatedMindmapUrl = '';
      updatedMindmapSize = '';
      updatedMindmapTitle = '';
    } else if (mindmapFile) {
      const mindBuf = await mindmapFile.arrayBuffer();
      const saved = await saveUploadedFile(new Uint8Array(mindBuf), mindmapFile.name, customToken);
      updatedMindmapUrl = saved.url;
      updatedMindmapSize = saved.sizeFormatted;
      updatedMindmapTitle = mindmapTitle || 'خريطة ذهنية للمراجعة';
    } else if (externalMindmapUrl !== undefined) {
      if (externalMindmapUrl) {
        updatedMindmapUrl = externalMindmapUrl;
        updatedMindmapSize = 'خريطة ذهنية 🧠';
        updatedMindmapTitle = mindmapTitle || 'خريطة ذهنية للمراجعة';
      } else {
        updatedMindmapUrl = '';
        updatedMindmapSize = '';
        updatedMindmapTitle = '';
      }
    } else if (mindmapTitle !== undefined) {
      updatedMindmapTitle = mindmapTitle;
    }

    // Process Flashcards updates
    let updatedFlashcards: any[] | null | undefined = undefined;
    if (removeFlashcards) {
      updatedFlashcards = null;
    } else if (flashcardsJson) {
      try {
        const parsed = JSON.parse(flashcardsJson);
        if (Array.isArray(parsed)) {
          updatedFlashcards = parsed;
        }
      } catch (err) {
        console.warn('[EditQuizFile] flashcardsJson parse error:', err);
      }
    } else if (ankiFile) {
      try {
        const ankiBuf = await ankiFile.arrayBuffer();
        const cards = await parseAnkiPackage(ankiBuf);
        if (cards && cards.length > 0) {
          updatedFlashcards = cards;
        }
      } catch (err) {
        console.warn('[EditQuizFile] Anki parse error:', err);
      }
    }

    let subjectTitle: string | undefined;
    if (subjectId) {
      const allSubjects = await CmsService.getAllSubjects();
      const subObj =
        allSubjects.find((s) => s.id === subjectId) ||
        MOCK_SUBJECTS.find((s) => s.id === subjectId);
      if (subObj) {
        subjectTitle = subObj.title;
      }
    }

    const isRemovingExplanation =
      removeExplanation ||
      (externalExplanationUrl !== undefined && !externalExplanationUrl.trim() && !explanationFile);

    const isRemovingPpt = removePpt || (externalPptUrl !== undefined && !externalPptUrl.trim() && !pptFile);
    const isRemovingAudio = removeAudio || (externalAudioUrl !== undefined && !externalAudioUrl.trim() && !audioFile);
    const isRemovingVideo = removeVideo || (externalVideoUrl !== undefined && !externalVideoUrl.trim() && !videoFile);
    const isRemovingMindmap = removeMindmap || (externalMindmapUrl !== undefined && !externalMindmapUrl.trim() && !mindmapFile);

    const updated = await CmsService.updateSubjectQuizFile(
      id,
      {
        ...(semester ? { semester } : {}),
        ...(title ? { title } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(subjectTitle ? { subjectTitle } : {}),
        ...(questionsCount !== undefined ? { questionsCount } : {}),
        ...(downloadUrl ? { downloadUrl } : {}),
        ...(fileSize ? { fileSize } : {}),
        ...(isFree !== undefined ? { isFree } : {}),
        ...(isLive !== undefined ? { isLive } : {}),
        ...(isRemovingExplanation
          ? { removeExplanation: true, explanationUrl: '' }
          : {
              ...(updatedExplanationUrl !== undefined ? { explanationUrl: updatedExplanationUrl || undefined } : {}),
              ...(updatedExplanationSize !== undefined ? { explanationFileSize: updatedExplanationSize || undefined } : {}),
              ...(updatedExplanationTitle !== undefined ? { explanationTitle: updatedExplanationTitle || undefined } : {}),
            }),
        ...(isRemovingPpt
          ? { removePpt: true, pptUrl: '' }
          : {
              ...(updatedPptUrl !== undefined ? { pptUrl: updatedPptUrl || undefined } : {}),
              ...(updatedPptSize !== undefined ? { pptFileSize: updatedPptSize || undefined } : {}),
              ...(updatedPptTitle !== undefined ? { pptTitle: updatedPptTitle || undefined } : {}),
            }),
        ...(isRemovingAudio
          ? { removeAudio: true, audioUrl: '' }
          : {
              ...(updatedAudioUrl !== undefined ? { audioUrl: updatedAudioUrl || undefined } : {}),
              ...(updatedAudioSize !== undefined ? { audioFileSize: updatedAudioSize || undefined } : {}),
              ...(updatedAudioTitle !== undefined ? { audioTitle: updatedAudioTitle || undefined } : {}),
            }),
        ...(isRemovingVideo
          ? { removeVideo: true, videoUrl: '' }
          : {
              ...(updatedVideoUrl !== undefined ? { videoUrl: updatedVideoUrl || undefined } : {}),
              ...(updatedVideoSize !== undefined ? { videoFileSize: updatedVideoSize || undefined } : {}),
              ...(updatedVideoTitle !== undefined ? { videoTitle: updatedVideoTitle || undefined } : {}),
              ...(updatedVideoDuration !== undefined ? { videoDuration: updatedVideoDuration || undefined } : {}),
            }),
        ...(isRemovingMindmap
          ? { removeMindmap: true, mindmapUrl: '' }
          : {
              ...(updatedMindmapUrl !== undefined ? { mindmapUrl: updatedMindmapUrl || undefined } : {}),
              ...(updatedMindmapSize !== undefined ? { mindmapFileSize: updatedMindmapSize || undefined } : {}),
              ...(updatedMindmapTitle !== undefined ? { mindmapTitle: updatedMindmapTitle || undefined } : {}),
            }),
        ...(removeFlashcards || updatedFlashcards === null
          ? { removeFlashcards: true, flashcards: [] }
          : updatedFlashcards && updatedFlashcards.length > 0
          ? { flashcards: updatedFlashcards, flashcardsCount: updatedFlashcards.length }
          : {}),
        updatedAt: `تم التحديث في ${getArabicFormattedDate()}`,
      },
      customToken
    );

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
      if (subjectId) {
        revalidatePath(`/subject/${subjectId}`, 'page');
      }
    } catch {}

    return NextResponse.json({
      success: !!updated,
      quizFile: updated,
      message: updated ? 'تم تحديث بيانات وملف الكويز بنجاح ✅' : 'لم يتم العثور على ملف الكويز',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف الكويز مطلوب' }, { status: 400 });
    }

    const customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      '';

    await CmsService.deleteSubjectQuizFile(id, customToken);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'تم حذف ملف الكويز بنجاح',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
