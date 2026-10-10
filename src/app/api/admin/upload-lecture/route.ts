import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { applyWatermarkToPdf } from '@/lib/pdf-watermark';
import { saveUploadedPdf } from '@/lib/file-storage';
import { CmsService } from '@/lib/cms-db';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';
import { Lecture } from '@/lib/types';

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
    const subjectId = (formData.get('subjectId') as string) || 'anatomy';
    const lectureTitle = (formData.get('lectureTitle') as string) || '';
    const lectureNumber = Number(formData.get('lectureNumber')) || 1;
    const adminNote = (formData.get('adminNote') as string) || '';
    const overview = (formData.get('overview') as string) || '';
    const shouldWatermark = formData.get('watermark') !== 'false';

    if (!file || !lectureTitle.trim()) {
      return NextResponse.json(
        { success: false, message: 'يرجى اختيار ملف PDF وكتابة اسم المحاضرة' },
        { status: 400 }
      );
    }

    const subjectObj = MOCK_SUBJECTS.find((s) => s.id === subjectId) || {
      id: subjectId,
      title: 'مقرر تمريض',
    };

    // 2. Read File Bytes
    const originalBuffer = await file.arrayBuffer();
    let processedBytes = new Uint8Array(originalBuffer);

    // 3. Apply Professional Watermark if requested
    if (shouldWatermark) {
      processedBytes = await applyWatermarkToPdf(originalBuffer);
    }

    // 4. Save to Persistent Storage
    const saved = saveUploadedPdf(processedBytes, file.name);

    // 5. Construct New Lecture
    const lectureId = `lec-${Date.now()}`;
    const newLecture: Lecture = {
      id: lectureId,
      subjectId,
      yearId: '1',
      subjectTitle: subjectObj.title,
      yearTitle: 'السنة الأولى',
      slug: lectureId,
      lectureNumber,
      title: lectureTitle.trim(),
      subtitle: `شرح وملخص معتمد لمادة ${subjectObj.title}`,
      isFree: true,
      price: 0,
      viewCount: 1,
      readingMinutes: 10,
      threeDModelType: 'heart',
      overview:
        overview.trim() ||
        `ملخص وتلخيص شامل لمحاضرة ${lectureTitle.trim()} في مادة ${subjectObj.title}، مجهزة للطباعة والمذاكرة السريعة مع الرسوم التوضيحية للامتحانات.`,
      concepts: [],
      terminology: [],
      interventions: [],
      clinicalPearls: [],
      flashcards: [
        {
          id: 1,
          front: `ما هو المفهوم الأساسي في ${lectureTitle.trim()}؟`,
          back: `مراجعة النقاط الأساسية والتعريفات التمريضية الواردة في ملخص المحاضرة.`,
          category: 'مفاهيم هامة',
        },
      ],
      quiz: [],
      files: [
        {
          type: 'pdf',
          title: lectureTitle.trim(),
          fileSize: saved.sizeFormatted,
          downloadUrl: saved.url,
          pageCount: 'ملف PDF معتمد',
          updatedAt: getArabicFormattedDate(),
          customNote: 'ملف رسمي بعلامة مائية معتمدة جاهز للتنزيل والطباعة',
        },
      ],
      adminNote: adminNote.trim() || 'تأكد من قراءة التلخيص وحل أسئلة الامتحانات السابقة لتثبيت المعلومة.',
    };

    // 6. Save in CMS Database (Instant live updates!)
    await CmsService.addOrUpdateLecture(newLecture);

    // 7. Send Immediate Telegram Notification to Admin
    const telegramAlert = `🚀 <b>تم رفع ونشر محاضرة جديدة بنجاح في المنصة!</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>اسم المحاضرة:</b> ${lectureTitle.trim()}
📚 <b>المادة:</b> ${subjectObj.title}
🔢 <b>رقم المحاضرة:</b> ${lectureNumber}
📄 <b>الملف:</b> PDF (${saved.sizeFormatted}) ${shouldWatermark ? '🛡️ مع العلامة المائية' : ''}
⏰ <b>التوقيت:</b> ${getArabicFormattedDate()}
━━━━━━━━━━━━━━━━━━━━
<i>المحاضرة متاحة للطلاب الآن وتسمّع في الموقع فوراً! 🩺</i>`;

    sendTelegramMessage(telegramAlert).catch((e) =>
      console.warn('Telegram notification error:', e)
    );

    return NextResponse.json({
      success: true,
      lecture: newLecture,
      message: 'تم رفع المحاضرة والعلامة المائية بنجاح! نُشرت فوراً لجميع الطلاب 🚀',
    });
  } catch (err) {
    console.error('[UploadLecture] Failed:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الملف' },
      { status: 500 }
    );
  }
}
