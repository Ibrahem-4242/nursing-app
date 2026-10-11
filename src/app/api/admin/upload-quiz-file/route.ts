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
    const questionsCount = Number(formData.get('questionsCount')) || 150;
    const shouldWatermark = formData.get('watermark') !== 'false';

    if (!file && !externalDriveUrl) {
      return NextResponse.json(
        { success: false, message: 'يرجى اختيار ملف PDF لأسئلة الكويزات أو إدخال رابط Google Drive' },
        { status: 400 }
      );
    }

    const subjectObj = MOCK_SUBJECTS.find((s) => s.id === subjectId) || {
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

    // 4. Save to CMS
    const quizFile = await CmsService.saveSubjectQuizFile({
      subjectId,
      subjectTitle: subjectObj.title,
      title: `بنك أسئلة الكويزات المجمعة - ${subjectObj.title}`,
      description: `ملف PDF شامل ومحدث يحتوي على بنك أسئلة الكويزات الدورية، امتحانات الميدتيرم، وأسئلة الاختيار من متعدد (MCQ) المحلولة لمقرر ${subjectObj.title}.`,
      fileSize: savedPdf.sizeFormatted,
      downloadUrl: savedPdf.url,
      questionsCount,
      updatedAt: `تم التحديث في ${getArabicFormattedDate()}`,
    }, customToken);

    try {
      revalidatePath('/', 'layout');
    } catch {}

    // 5. Send Telegram notification
    const time = getArabicFormattedDate();
    const fileNameDisplay = file ? `<code>${file.name}</code>` : 'رابط Google Drive خارجي 🌐';
    const watermarkDisplay = file && shouldWatermark ? 'تم التطبيق بنجاح ✅' : file ? 'بدون علامة' : 'ملف سحابي خارجي';

    const telegramMsg = `📝 <b>تم رفع وتحديث ملف أسئلة الكويزات المجمعة!</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>المادة:</b> ${subjectObj.title}
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
      message: `تم رفع ملف أسئلة الكويزات لمادة "${subjectObj.title}" بنجاح! 🚀`,
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
      const quiz = await CmsService.getSubjectQuizFile(subjectId);
      return NextResponse.json({ success: true, quiz });
    }

    const allQuizzes = await CmsService.getAllSubjectQuizFiles();
    return NextResponse.json(
      { success: true, quizzes: allQuizzes },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
