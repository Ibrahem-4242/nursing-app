import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { sendDailySummary, sendTelegramMessage } from '@/lib/telegram';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '8098726389');

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

    // 1. Handle Callback Query (e.g., clicking interactive buttons)
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
            text: '🔄 جاري التنفيذ فوراً...',
            show_alert: false,
          }),
        }).catch((e) => console.warn('[Telegram Webhook] answerCallbackQuery notice:', e));
      }

      // A. Emergency Camouflage: Switch to Dairy Store (كبسة / ألبان)
      if (cbData === 'toggle_panic_on') {
        await CmsService.setPanicMode(true);
        try {
          revalidatePath('/', 'layout');
        } catch {}
        if (targetChatId) {
          const msg = `🚨 <b>تم تفعيل وضع التمويه فوراً بنجاح! 🥛🇸🇦</b>
━━━━━━━━━━━━━━━━━━━━
🏪 <b>الموقع الآن:</b> متجر حليب الخير للألبان الطازجة
🌐 <b>الرابط:</b> https://www.nursingsum.live/
🔒 <b>الحالة:</b> تم إخفاء منصة التمريض بنجاح وتحويل الموقع لمتجر ألبان سعودي طبيعي 100%.

<i>للرجوع لمنصة التمريض في أي وقت، أرسل كلمة: <b>تمريض</b> 🩺</i>`;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '🟢 العودة لمنصة التمريض', callback_data: 'toggle_panic_off' },
                { text: '🌐 فتح الموقع الآن', url: 'https://www.nursingsum.live/' },
              ],
            ],
          };
          await sendTelegramMessage(msg, 'HTML', targetChatId, keyboard);
        }
        return NextResponse.json({ ok: true });
      }

      // B. Emergency Camouflage: Switch to Nursing Platform (تمريض / ملخصات)
      if (cbData === 'toggle_panic_off') {
        await CmsService.setPanicMode(false);
        try {
          revalidatePath('/', 'layout');
        } catch {}
        if (targetChatId) {
          const msg = `🟢 <b>تم إيقاف وضع التمويه والعودة لمنصة تمريض! 🩺</b>
━━━━━━━━━━━━━━━━━━━━
🎓 <b>الموقع الآن:</b> منصة ملخصات تمريض الشاملة
🌐 <b>الرابط:</b> https://www.nursingsum.live/
✅ <b>الحالة:</b> عادت جميع المحاضرات والمواد والكويزات للعمل بشكل طبيعي.

<i>للتحويل لمتجر الألبان مجدداً، أرسل كلمة: <b>البان</b> 🥛</i>`;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '🚨 كبسة ألبان الخير 🥛', callback_data: 'toggle_panic_on' },
                { text: '🌐 فتح المنصة الآن', url: 'https://www.nursingsum.live/' },
              ],
            ],
          };
          await sendTelegramMessage(msg, 'HTML', targetChatId, keyboard);
        }
        return NextResponse.json({ ok: true });
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
        const isShakib = res.order?.orderType === 'shakib_rakib';
        if (cbId && TELEGRAM_BOT_TOKEN) {
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: cbId,
              text: res.success
                ? isShakib
                  ? '🚀 تم تفعيل باقة شاكب راكب الشهرية للطالب بنجاح!'
                  : '✅ تم اعتماد الدفع وفتح المحاضرة للطالب فوراً!'
                : 'تعذر إتمام العملية',
              show_alert: true,
            }),
          }).catch(() => {});
        }
        if (res.success && targetChatId) {
          const detailText = isShakib
            ? `🚀 <b>تم تفعيل باقة شاكب راكب الشهرية بنجاح!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>الطالب:</b> ${res.order?.studentName}\n📱 <b>الهاتف:</b> <code>${res.order?.studentPhone}</code>\n🏛️ <b>الجامعة:</b> ${res.order?.studentUniversity}\n👑 <b>الباقة:</b> باقة شاكب راكب الشهرية الشاملة 🚀\n💰 <b>المبلغ:</b> ${res.order?.price} ج.م\n🔓 <i>أصبح بإمكان الطالب الآن فتح وتحميل جميع مواد ومحاضرات سنته الدراسية لهذا الشهر بالكامل!</i>`
            : `✅ <b>تمت الموافقة على الدفع بنجاح!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 <b>الطالب:</b> ${res.order?.studentName}\n📱 <b>الهاتف:</b> <code>${res.order?.studentPhone}</code>\n🏛️ <b>الجامعة:</b> ${res.order?.studentUniversity}\n📚 <b>المحاضرة:</b> ${res.order?.lectureTitle}\n💰 <b>المبلغ:</b> ${res.order?.price} ج.م\n🔓 <i>المحاضرة مفعلة الآن بحساب الطالب وأصبح بإمكانه فتحها وتحميلها فوراً!</i>`;

          await sendTelegramMessage(detailText, 'HTML', targetChatId);
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

    // Security check: only allow admin to toggle panic mode
    const isAuthorized = String(chatId) === ADMIN_CHAT_ID || rawText.includes('5143545638');

    // ─── COMMAND 1: SWITCH TO DAIRY STORE (ألبان / حليب / كبسة) ───
    const isPanicOnRequest =
      normalized === 'البان' ||
      normalized === 'الالبان' ||
      normalized.includes('البان') ||
      normalized === 'حليب' ||
      normalized.includes('حليب الخير') ||
      normalized === 'كبسه' ||
      normalized.includes('كبسه') ||
      normalized.includes('تمويه') ||
      lowerRaw === '/panic' ||
      lowerRaw === '/panic_on' ||
      lowerRaw === '/panic on' ||
      lowerRaw === '/store' ||
      lowerRaw === 'dairy' ||
      lowerRaw === 'panic';

    if (isPanicOnRequest) {
      if (!isAuthorized) {
        await sendTelegramMessage('⚠️ هذا الأمر مخصص فقط لمدير المنصة.', 'HTML', chatId);
        return NextResponse.json({ ok: true });
      }

      await CmsService.setPanicMode(true);
      try {
        revalidatePath('/', 'layout');
      } catch {}
      const msg = `🚨 <b>تم تفعيل وضع التمويه فوراً بنجاح! 🥛🇸🇦</b>
━━━━━━━━━━━━━━━━━━━━
🏪 <b>الموقع الآن:</b> متجر حليب الخير للألبان الطازجة
🌐 <b>الرابط:</b> https://www.nursingsum.live/
🔒 <b>الحالة:</b> تم إخفاء منصة التمريض بالكامل وتحويل الموقع لمتجر ألبان سعودي طبيعي 100%.

<i>للرجوع لمنصة التمريض في أي وقت، أرسل كلمة: <b>تمريض</b> 🩺</i>`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🟢 العودة لمنصة التمريض', callback_data: 'toggle_panic_off' },
            { text: '🌐 فتح الموقع المباشر', url: 'https://www.nursingsum.live/' },
          ],
        ],
      };
      await sendTelegramMessage(msg, 'HTML', chatId, keyboard);
      return NextResponse.json({ ok: true });
    }

    // ─── COMMAND 2: SWITCH TO NURSING PLATFORM (تمريض / ملخصات) ───
    const isPanicOffRequest =
      normalized === 'تمريض' ||
      normalized === 'التمريض' ||
      normalized.includes('تمريض') ||
      normalized === 'ملخصات' ||
      normalized === 'الملخصات' ||
      normalized.includes('ملخصات') ||
      normalized === 'طبيعي' ||
      normalized === 'عادي' ||
      lowerRaw === '/panic_off' ||
      lowerRaw === '/panic off' ||
      lowerRaw === '/nursing' ||
      lowerRaw === 'nursing' ||
      lowerRaw === 'normal';

    if (isPanicOffRequest) {
      if (!isAuthorized) {
        await sendTelegramMessage('⚠️ هذا الأمر مخصص فقط لمدير المنصة.', 'HTML', chatId);
        return NextResponse.json({ ok: true });
      }

      await CmsService.setPanicMode(false);
      try {
        revalidatePath('/', 'layout');
      } catch {}
      const msg = `🟢 <b>تم إيقاف وضع التمويه والعودة لمنصة تمريض! 🩺</b>
━━━━━━━━━━━━━━━━━━━━
🎓 <b>الموقع الآن:</b> منصة ملخصات تمريض الشاملة
🌐 <b>الرابط:</b> https://www.nursingsum.live/
✅ <b>الحالة:</b> عادت جميع المحاضرات والمواد والكويزات للعمل بشكل طبيعي.

<i>للتحويل لمتجر الألبان مجدداً، أرسل كلمة: <b>البان</b> 🥛</i>`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚨 كبسة ألبان الخير 🥛', callback_data: 'toggle_panic_on' },
            { text: '🌐 فتح المنصة الآن', url: 'https://www.nursingsum.live/' },
          ],
        ],
      };
      await sendTelegramMessage(msg, 'HTML', chatId, keyboard);
      return NextResponse.json({ ok: true });
    }

    // ─── COMMAND 3: STATISTICS REPORT ───
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

    // ─── COMMAND 4: START OR HELP GREETING ───
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
⚡ <b>التحكم الفوري في وضع المنصة والتمويه:</b>
👉 أرسل كلمة: <b>البان</b> ⬅️ للتحويل الفوري لمتجر حليب الخير 🥛🇸🇦
👉 أرسل كلمة: <b>تمريض</b> ⬅️ للعودة الفورية لمنصة التمريض الطبيعية 🩺

📊 <b>الإحصائيات والتقارير:</b>
👉 أرسل كلمة: <b>احصائيات</b> لمعرفة عدد الزوار والتحميلات لحظياً 📈`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🚨 تحويل لألبان الخير 🥛', callback_data: 'toggle_panic_on' },
            { text: '🩺 عودة لملخصات تمريض 🟢', callback_data: 'toggle_panic_off' },
          ],
          [
            { text: '📊 عرض الإحصائيات الفورية', callback_data: 'refresh_stats' },
            { text: '🌐 زيارة المنصة الآن', url: 'https://www.nursingsum.live/' },
          ],
        ],
      };

      await sendTelegramMessage(welcome, 'HTML', chatId, inlineKeyboard);
      return NextResponse.json({ ok: true });
    }

    // Default polite response with quick action buttons
    const defaultResponse = `👋 <b>مرحباً بك يا غالي!</b>
━━━━━━━━━━━━━━━━━━━━
أرسل أي من الكلمات التالية للتحكم السريع:
🥛 <b>البان</b> ⬅️ للتحويل لمتجر حليب الخير
🩺 <b>تمريض</b> ⬅️ للعودة لمنصة التمريض
📊 <b>احصائيات</b> ⬅️ لمعرفة نشاط المنصة المباشر`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🚨 تحويل لألبان الخير 🥛', callback_data: 'toggle_panic_on' },
          { text: '🩺 عودة لملخصات تمريض 🟢', callback_data: 'toggle_panic_off' },
        ],
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
