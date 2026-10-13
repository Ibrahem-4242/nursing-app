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
    const subjectId = (formData.get('subjectId') as string) || 'anatomy';
    const rawSemester = ((formData.get('semester') as string) || '').trim();
    const semester: '1' | '2' = rawSemester === '2' ? '2' : '1';
    const customQuizTitle = ((formData.get('quizTitle') as string) || '').trim();
    const questionsCount = Number(formData.get('questionsCount')) || 150;
    const shouldWatermark = formData.get('watermark') !== 'false';

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
      },
      customToken
    );

    try {
      revalidatePath('/', 'layout');
    } catch {}

    // 5. Send Telegram notification
    const time = getArabicFormattedDate();
    const fileNameDisplay = file ? `<code>${file.name}</code>` : 'رابط Google Drive خارجي 🌐';
    const watermarkDisplay = file && shouldWatermark ? 'تم التطبيق بنجاح ✅' : file ? 'بدون علامة' : 'ملف سحابي خارجي';

    const telegramMsg = `📝 <b>تم إضافة ملف أسئلة كويزات جديد!</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>المادة:</b> ${subjectObj.title}
📅 <b>الفصل الدراسي:</b> سمستر ${semester} (${semester === '2' ? 'الترم الثاني' : 'الترم الأول'})
🏷️ <b>العنوان:</b> ${finalTitle}
📄 <b>الملف:</b> ${fileNameDisplay}
💾 <b>الحجم / المصدر:</b> ${savedPdf.sizeFormatted}
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
    let file: File | null = null;
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
      file = formData.get('file') as File | null;
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
        updatedAt: `تم التحديث في ${getArabicFormattedDate()}`,
      },
      customToken
    );

    try {
      revalidatePath('/', 'layout');
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
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'تم حذف ملف الكويز بنجاح',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
