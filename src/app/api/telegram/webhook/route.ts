import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { sendDailySummary, sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';

function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics / tashkeel
    .replace(/[أإآٱ]/g, 'ا') // unify Alef
    .replace(/ة/g, 'ه') // unify Ta Marbuta
    .replace(/[ىئ]/g, 'ي') // unify Ya
    .replace(/[^a-zA-Z0-9\u0621-\u064A]/g, ' ') // replace symbols/punct with space
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle Callback Query (e.g., clicking "تحديث الإحصائيات" button)
    if (body.callback_query) {
      const cb = body.callback_query;
      const cbId = cb.id;
      const cbData = cb.data;
      const targetChatId = cb.message?.chat?.id || cb.from?.id;

      // Acknowledge callback immediately to dismiss Telegram's loading spinner
      if (cbId && TELEGRAM_BOT_TOKEN) {
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cbId,
            text: '🔄 جاري تحديث الإحصائيات بأحدث الأرقام...',
            show_alert: false,
          }),
        }).catch((e) => console.warn('[Telegram Webhook] answerCallbackQuery notice:', e));
      }

      if (cbData === 'refresh_stats' && targetChatId) {
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
          targetChatId
        );
        return NextResponse.json({ ok: true });
      }

      if (cbData && cbData.startsWith('approve_order_')) {
        const orderId = cbData.replace('approve_order_', '').trim();
        const res = await CmsService.approveOrder(orderId);
        if (cbId && TELEGRAM_BOT_TOKEN) {
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: cbId,
              text: res.success ? '✅ تم اعتماد الدفع وفتح المحاضرة للطالب فوراً!' : 'تعذر إتمام العملية',
              show_alert: true,
            }),
          }).catch(() => {});
        }
        if (res.success && targetChatId) {
          await sendTelegramMessage(
            `✅ <b>تمت الموافقة على الدفع بنجاح!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>الطالب:</b> ${res.order?.studentName}\n📱 <b>الهاتف:</b> <code>${res.order?.studentPhone}</code>\n🏛️ <b>الجامعة:</b> ${res.order?.studentUniversity}\n📚 <b>المحاضرة:</b> ${res.order?.lectureTitle}\n💰 <b>المبلغ:</b> ${res.order?.price} ج.م\n🔓 <i>المحاضرة مفعلة الآن بحساب الطالب وأصبح بإمكانه فتحها وتحميلها فوراً!</i>`,
            'HTML',
            targetChatId
          );
        }
        return NextResponse.json({ ok: true });
      }

      if (cbData && cbData.startsWith('reject_order_')) {
        const orderId = cbData.replace('reject_order_', '').trim();
        const defaultReason = 'لم يتم استلام المبلغ على فودافون كاش - يرجى التأكد من الرقم والإشعار';
        const res = await CmsService.rejectOrder(orderId, defaultReason);
        if (cbId && TELEGRAM_BOT_TOKEN) {
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: cbId,
              text: '❌ تم رفض طلب الدفع!',
              show_alert: true,
            }),
          }).catch(() => {});
        }
        if (res.success && targetChatId) {
          await sendTelegramMessage(
            `❌ <b>تم رفض طلب الدفع!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>الطالب:</b> ${res.order?.studentName}\n📱 <b>الهاتف:</b> <code>${res.order?.studentPhone}</code>\n📚 <b>المحاضرة:</b> ${res.order?.lectureTitle}\n⚠️ <b>السبب:</b> ${defaultReason}\n<i>يمكنك تعديل السبب الموضح للطالب من لوحة التحكم في أي وقت.</i>`,
            'HTML',
            targetChatId
          );
        }
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Handle Normal Messages or Channel Posts
    const message = body.message || body.channel_post || body.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id || message.from?.id;
    const rawText = String(message.text || message.caption || '').trim();
    const normalized = normalizeArabicText(rawText);
    const lowerRaw = rawText.toLowerCase();

    // Check if the user is asking for statistics with any variation
    const isStatsRequest =
      normalized.includes('احصائ') || // Matches: احصائيات, الاحصائيات, إحصائيات, الإحصائيات, احصائية, احصاء
      normalized.includes('تقرير') || // Matches: تقرير, التقرير, التقارير
      normalized.includes('تحليلات') ||
      normalized.includes('ارقام') ||
      normalized.includes('زوار') ||
      lowerRaw.includes('stats') ||
      lowerRaw.includes('stat') ||
      lowerRaw.includes('analytics') ||
      lowerRaw.startsWith('/stats') ||
      lowerRaw.startsWith('/احصائيات') ||
      lowerRaw.startsWith('/report');

    if (isStatsRequest) {
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

    // Check if the user sent /start or greeting
    const isStart =
      normalized === 'ابدأ' ||
      normalized === 'مرحبا' ||
      normalized === 'اهلا' ||
      normalized === 'سلام' ||
      lowerRaw === '/start' ||
      lowerRaw === 'start' ||
      lowerRaw === '/help' ||
      lowerRaw === 'help';

    if (isStart) {
      const welcome = `👋 <b>أهلاً بك في بوت منصة ملخصات تمريض الرسمي!</b> 🩺
━━━━━━━━━━━━━━━━━━━━
📊 لمعرفة إحصائيات المنصة المحدثة واللحظية في أي وقت:
👉 أرسل كلمة: <b>احصائيات</b>
أو اضغط مباشرة على الزر أدناه:`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '📊 عرض الإحصائيات الآن', callback_data: 'refresh_stats' },
            { text: '🌐 زيارة المنصة المعتمدة', url: 'https://www.nursingsum.live/' },
          ],
        ],
      };

      await sendTelegramMessage(welcome, 'HTML', chatId, inlineKeyboard);
      return NextResponse.json({ ok: true });
    }

    // Default polite response for any other incoming message
    const defaultResponse = `👋 <b>مرحباً بك!</b>
أرسل كلمة <b>احصائيات</b> في أي لحظة لمعرفة عدد الزوار والتحميلات ونشاط المنصة المباشر 📊✨`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '📊 طلب الإحصائيات الفورية', callback_data: 'refresh_stats' },
          { text: '🌐 فتح المنصة', url: 'https://www.nursingsum.live/' },
        ],
      ],
    };

    await sendTelegramMessage(defaultResponse, 'HTML', chatId, inlineKeyboard);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Telegram Webhook] Error processing update:', err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    domain: 'https://www.nursingsum.live',
    message: 'Telegram Webhook Endpoint is active. Send POST updates from Telegram.',
  });
}
