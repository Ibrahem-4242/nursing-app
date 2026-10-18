import { NextRequest, NextResponse } from 'next/server';
import { notifyBrokenLink, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ success: true, message: 'تم استلام بلاغك' });
    }

    const body = await req.json();
    const { lectureTitle, subjectTitle, linkUrl, userNote, userPhone, lectureId } = body;

    const time = getArabicFormattedDate();

    // 1. Save in CMS broken link reports
    const report = await CmsService.addBrokenLinkReport({
      lectureId,
      lectureTitle: lectureTitle || 'محاضرة غير محددة',
      subjectTitle: subjectTitle || 'مادة غير محددة',
      linkUrl: linkUrl || '#',
      userNote: userNote || '',
      userPhone: userPhone || '',
    });

    // 2. Send Realtime Telegram Alert
    await notifyBrokenLink({
      lectureTitle: lectureTitle || 'محاضرة غير محددة',
      subjectTitle: subjectTitle || 'مادة غير محددة',
      linkUrl: linkUrl || '#',
      userNote: userNote || '',
      userPhone: userPhone || '',
      time,
    });

    return NextResponse.json({
      success: true,
      report,
      message: 'تم استلام البلاغ بنجاح! سيتم فحص الرابط وإصلاحه بأسرع وقت، شكراً لمساعدتك 🩺',
    });
  } catch (err) {
    console.error('[ReportBrokenLink] Error:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إرسال البلاغ' },
      { status: 500 }
    );
  }
}
