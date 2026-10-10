import { NextRequest, NextResponse } from 'next/server';
import { notifyNewVisitor, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceType, page, userAgent } = body;

    const time = getArabicFormattedDate();
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Track in CMS Database
    await CmsService.trackVisitor({
      deviceType: deviceType || 'غير محدد',
      page: page || '/',
      userAgent: userAgent || req.headers.get('user-agent') || '',
    });

    // Send immediate Telegram alert (async, fire-and-forget or awaited)
    await notifyNewVisitor({
      deviceType: deviceType || 'غير محدد',
      page: page || '/',
      userAgent: userAgent || req.headers.get('user-agent') || '',
      ip,
      time,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[TrackVisitor] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
