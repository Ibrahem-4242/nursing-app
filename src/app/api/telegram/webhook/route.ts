import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { sendDailySummary, sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.channel_post;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const rawText = (message.text || '').trim();
    const command = rawText.toLowerCase();

    // Respond to /احصائيات or احصائيات or /stats or stats
    if (
      rawText === '/احصائيات' ||
      rawText === 'احصائيات' ||
      rawText.startsWith('/احصائيات') ||
      rawText.startsWith('احصائيات') ||
      command === '/stats' ||
      command === 'stats' ||
      command.startsWith('/stats')
    ) {
      const stats = await CmsService.getTodayAnalytics();
      await sendDailySummary(
        {
          date: stats.date,
          totalVisitors: stats.visitors,
          pageViews: stats.pageViews,
          yesterdayVisitors: stats.yesterdayVisitors,
          allTimeVisitors: stats.allTimeVisitors,
          totalDownloads: stats.downloads,
          yesterdayDownloads: stats.yesterdayDownloads,
          allTimeDownloads: stats.allTimeDownloads,
          breakdown: stats.breakdown,
        },
        chatId
      );
      return NextResponse.json({ ok: true });
    }

    // Respond to /start or /help
    if (command === '/start' || command === 'start' || command === '/help' || command === 'help') {
      const welcome = `👋 <b>أهلاً بك في بوت منصة ملخصات تمريض!</b> 🩺
━━━━━━━━━━━━━━━━━━━━
📊 لمعرفة إحصائيات المنصة المباشرة في أي لحظة، أرسل الأمر:
👉 <code>/احصائيات</code>

سيصلك التقرير اليومي الشامل المحدث للزوار والتحميلات وتفصيل كل مادة ومحاضرة فوراً! 🚀`;
      await sendTelegramMessage(welcome, 'HTML', chatId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Telegram Webhook] Error processing update:', err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Telegram Webhook Endpoint is active. Send POST updates from Telegram.',
  });
}
