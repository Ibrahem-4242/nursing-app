import { NextRequest, NextResponse } from 'next/server';
import { notifyDownload, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { lectureTitle, subjectTitle, fileType, fileName } = body;

    const time = getArabicFormattedDate();

    // 1. Record in CMS Analytics
    await CmsService.trackDownload({
      lectureTitle: lectureTitle || 'محاضرة غير محددة',
      subjectTitle: subjectTitle || 'مادة غير محددة',
      fileType: fileType || 'ملف PDF',
      fileName: fileName || '',
    });

    // 2. Send Realtime Telegram Alert
    await notifyDownload({
      lectureTitle: lectureTitle || 'محاضرة غير محددة',
      subjectTitle: subjectTitle || 'مادة غير محددة',
      fileType: fileType || 'ملف PDF',
      fileName: fileName || '',
      time,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[TrackDownload] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
