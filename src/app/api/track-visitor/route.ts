import { NextRequest, NextResponse } from 'next/server';
import { notifyNewVisitor, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceType, page, userAgent, isNewStudent } = body;

    const time = getArabicFormattedDate();
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 1. Always record in CMS Database for background analytics and daily stats
    await CmsService.trackVisitor({
      deviceType: deviceType || 'غير محدد',
      page: page || '/',
      userAgent: userAgent || req.headers.get('user-agent') || '',
    });

    // 2. ONLY send Telegram alert if this is the student's FIRST TIME EVER (طالب جديد)
    // If the student has entered before (دخل قبل كدا), DO NOT send any entrance alert,
    // only activity alerts (تحميل، فلاش كاردز، بلاغات) will be sent.
    if (isNewStudent) {
      await notifyNewVisitor({
        deviceType: deviceType || 'غير محدد',
        page: page || '/',
        userAgent: userAgent || req.headers.get('user-agent') || '',
        ip,
        time,
        isFirstTime: true,
      });
    }

    return NextResponse.json({ success: true, notified: !!isNewStudent });
  } catch (err) {
    console.error('[TrackVisitor] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
