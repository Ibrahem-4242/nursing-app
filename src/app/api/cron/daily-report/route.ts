import { NextRequest, NextResponse } from 'next/server';
import { sendDailySummary } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function GET(req: NextRequest) {
  try {
    const stats = await CmsService.getTodayAnalytics();

    const ok = await sendDailySummary({
      date: stats.date,
      totalVisitors: stats.visitors,
      totalDownloads: stats.downloads,
      breakdown: stats.breakdown,
    });

    return NextResponse.json({
      success: ok,
      message: ok
        ? 'تم إرسال التقرير اليومي بنجاح إلى تيليجرام 📊'
        : 'فشل إرسال التقرير، يرجى مراجعة إعدادات البوت',
      stats,
    });
  } catch (err) {
    console.error('[DailyReport] Error:', err);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء إرسال التقرير' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
