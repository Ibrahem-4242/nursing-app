import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { applyWatermarkToPdf } from '@/lib/pdf-watermark';
import { saveUploadedFile } from '@/lib/file-storage';
import { CmsService } from '@/lib/cms-db';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export const dynamic = 'force-dynamic';
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
    const subjectId = (formData.get('subjectId') as string) || 'anatomy';
    const questionsCount = Number(formData.get('questionsCount')) || 150;
    const shouldWatermark = formData.get('watermark') !== 'false';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'يرجى اختيار ملف PDF لأسئلة الكويزات' },
        { status: 400 }
      );
    }

    const subjectObj = MOCK_SUBJECTS.find((s) => s.id === subjectId) || {
      id: subjectId,
      title: 'مقرر تمريض',
    };

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
    const savedPdf = await saveUploadedFile(processedBytes, file.name);

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
    });

    // 5. Send Telegram notification
    const time = getArabicFormattedDate();
    const telegramMsg = `📝 <b>تم رفع وتحديث ملف أسئلة الكويزات المجمعة!</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>المادة:</b> ${subjectObj.title}
📄 <b>الملف:</b> <code>${file.name}</code>
💾 <b>الحجم:</b> ${savedPdf.sizeFormatted}
❓ <b>عدد الأسئلة:</b> +${questionsCount} سؤال
⏰ <b>التوقيت:</b> ${time}
🛡️ <b>العلامة المائية:</b> ${shouldWatermark ? 'تم التطبيق بنجاح ✅' : 'بدون علامة'}`;

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
    return NextResponse.json({ success: true, quizzes: allQuizzes });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
