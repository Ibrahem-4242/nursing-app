import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { applyWatermarkToPdf } from '@/lib/pdf-watermark';
import { saveUploadedFile } from '@/lib/file-storage';
import { CmsService } from '@/lib/cms-db';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const externalDriveUrl = ((formData.get('externalDriveUrl') as string) || '').trim();
    const explanationFile = formData.get('explanationFile') as File | null;
    const externalExplanationUrl = ((formData.get('externalExplanationUrl') as string) || '').trim();
    const explanationTitle = ((formData.get('explanationTitle') as string) || '').trim();
    const subjectId = (formData.get('subjectId') as string) || 'anatomy';
    const rawSemester = ((formData.get('semester') as string) || '').trim();
    const semester: '1' | '2' = rawSemester === '2' ? '2' : '1';
    const customQuizTitle = ((formData.get('quizTitle') as string) || '').trim();
    const questionsCount = Number(formData.get('questionsCount')) || 150;
    const shouldWatermark = formData.get('watermark') !== 'false';
    const isFree = formData.get('isFree') !== 'false';
    const isLive = formData.get('isLive') !== 'false';

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
      ((formData.get('githubToken') as string) || '').trim();

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
    const freeDisplay = isFree ? 'متاح مجاناً للجميع 🎁' : 'مقفول باشتراك 🔒';
    const liveDisplay = isLive ? 'منشور وظاهر للطلاب 👁️' : 'مسودة مخفية 🙈';

    const telegramMsg = `📝 <b>تم إضافة ملف أسئلة كويزات جديد!</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>المادة:</b> ${subjectObj.title}
📅 <b>الفصل الدراسي:</b> سمستر ${semester} (${semester === '2' ? 'الترم الثاني' : 'الترم الأول'})
🏷️ <b>العنوان:</b> ${finalTitle}
📄 <b>الملف:</b> ${fileNameDisplay}
💾 <b>الحجم / المصدر:</b> ${savedPdf.sizeFormatted}
📖 <b>الشرح:</b> ${explanationDisplay}
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
