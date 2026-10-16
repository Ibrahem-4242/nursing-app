import { PurchaseOrder } from './types';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8098726389';
export const SITE_URL = 'https://www.nursingsum.live';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface VisitorInfo {
  deviceType?: string;
  userAgent?: string;
  page?: string;
  ip?: string;
  time?: string;
  referrer?: string;
  isFirstTime?: boolean;
  isGoogle?: boolean;
  googleReason?: string;
  visitorName?: string;
}

export interface DownloadInfo {
  lectureTitle: string;
  subjectTitle: string;
  fileType: string;
  fileName?: string;
  time?: string;
}

export interface BrokenLinkInfo {
  lectureTitle: string;
  subjectTitle: string;
  linkUrl: string;
  userNote?: string;
  userPhone?: string;
  time?: string;
}

export interface ComplaintInfo {
  name: string;
  phone: string;
  year?: string;
  type?: string;
  message: string;
  time?: string;
}

export interface FlashcardSessionInfo {
  lectureTitle: string;
  subjectTitle: string;
  cardsCount?: number;
  time?: string;
}

export interface DailySummaryInfo {
  date: string;
  totalVisitors: number;
  pageViews?: number;
  yesterdayVisitors?: number;
  allTimeVisitors?: number;
  totalDownloads: number;
  yesterdayDownloads?: number;
  allTimeDownloads?: number;
  breakdown: Array<{
    subjectTitle: string;
    lectureTitle: string;
    downloads: number;
  }>;
}

export async function sendTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  targetChatId?: string | number,
  replyMarkup?: any
): Promise<boolean> {
  const chatId = targetChatId ? String(targetChatId) : TELEGRAM_CHAT_ID;
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.warn('[Telegram] Missing BOT_TOKEN or CHAT_ID');
    return false;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] API error:', data);
    }
    return !!data.ok;
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err);
    return false;
  }
}

export function getArabicFormattedDate(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export async function notifyGoogleVisitor(info: VisitorInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const device = escapeHtml(info.deviceType || 'غير محدد');
  const page = escapeHtml(info.page || '/');
  const referrer = escapeHtml(info.referrer || 'محرك بحث Google');
  const reason = escapeHtml(info.googleReason || 'محرك بحث Google / أرشفة Googlebot');
  const ua = escapeHtml((info.userAgent || '').slice(0, 160));
  const visitorName = info.visitorName ? escapeHtml(info.visitorName) : '';

  const nameLine = visitorName ? `\n👤 <b>الاسم / المعرّف:</b> <code>${visitorName}</code>` : '';

  const text = `🔍 <b>تنبيه فوري: رصد دخول مرتبط بـ Google!</b> 🌐
━━━━━━━━━━━━━━━━━━━━
🎯 <b>طبيعة الزيارة:</b> <b>${reason}</b>${nameLine}
📄 <b>الصفحة:</b> <code>${page}</code>
🔗 <b>المصدر (Referrer):</b> <code>${referrer}</code>
📱 <b>نوع الجهاز:</b> ${device}
⏰ <b>التوقيت:</b> ${time}
💻 <b>المتصفح / المعرف:</b>
<i>${ua}</i>
━━━━━━━━━━━━━━━━━━━━
<i>منصة ملخصات تمريض - الرصد اللحظي للزوار ومحركات البحث 🩺</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🌐 فتح المنصة', url: 'https://www.nursingsum.live/' },
        { text: '📊 طلب الإحصائيات', callback_data: 'refresh_stats' },
      ],
    ],
  };

  return sendTelegramMessage(text, 'HTML', undefined, inlineKeyboard);
}

export async function notifyNewVisitor(info: VisitorInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const device = escapeHtml(info.deviceType || 'غير محدد');
  const page = escapeHtml(info.page || '/');
  const referrer = escapeHtml(info.referrer || 'دخول مباشر');
  const ua = escapeHtml((info.userAgent || '').slice(0, 160));

  const text = `🎓 <b>طالب جديد دخل المنصة لأول مرة!</b> ✨
━━━━━━━━━━━━━━━━━━━━
📱 <b>نوع الجهاز:</b> ${device}
🌐 <b>صفحة البداية:</b> <code>${page}</code>
🔗 <b>المصدر (Referrer):</b> <code>${referrer}</code>
⏰ <b>التوقيت:</b> ${time}
💻 <b>المتصفح:</b> <i>${ua}</i>
━━━━━━━━━━━━━━━━━━━━
<i>منصة ملخصات تمريض - الرعاية التعليمية المعتمدة 🩺</i>`;

  return sendTelegramMessage(text, 'HTML');
}

export async function notifyDownload(info: DownloadInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const lec = escapeHtml(info.lectureTitle);
  const sub = escapeHtml(info.subjectTitle);
  const type = escapeHtml(info.fileType);

  const text = `📥 <b>قام طالب بتحميل: [${lec}] - [${sub}]</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${lec}
📚 <b>المادة:</b> ${sub}
📄 <b>نوع المورد:</b> ${type}
⏰ <b>التوقيت:</b> ${time}`;

  return sendTelegramMessage(text, 'HTML');
}

export async function notifyBrokenLink(info: BrokenLinkInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const phoneLine = info.userPhone ? `\n📞 <b>رقم هاتف الطالب:</b> <code>${escapeHtml(info.userPhone)}</code>` : '';
  const lec = escapeHtml(info.lectureTitle);
  const sub = escapeHtml(info.subjectTitle);
  const link = escapeHtml(info.linkUrl);
  const note = escapeHtml(info.userNote || 'لم يتم تقديم ملاحظة');

  const text = `⚠️ <b>بلاغ: طالب أبلغ عن عطل في رابط: [${lec}]</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${lec}
📚 <b>المادة:</b> ${sub}
🔗 <b>الرابط المتأثر:</b> <code>${link}</code>${phoneLine}
📝 <b>ملاحظة الطالب:</b> <i>${note}</i>
⏰ <b>التوقيت:</b> ${time}`;

  return sendTelegramMessage(text, 'HTML');
}

export async function notifyComplaint(info: ComplaintInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const typeTag = escapeHtml(info.type || 'شكوى أو استفسار');
  const name = escapeHtml(info.name || 'طالب تمريض');
  const phone = escapeHtml(info.phone);
  const year = escapeHtml(info.year || 'السنة الأولى');
  const msg = escapeHtml(info.message);

  const text = `🚨 <b>وصلتك رسالة / استفسار جديد من طالب!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم الطالب:</b> ${name}
📞 <b>رقم الهاتف / الواتساب:</b> <code>${phone}</code>
🎓 <b>السنة الدراسية:</b> ${year}
🏷️ <b>التصنيف:</b> ${typeTag}
📝 <b>نص الرسالة:</b>
<i>${msg}</i>
⏰ <b>التوقيت:</b> ${time}
━━━━━━━━━━━━━━━━━━━━
<i>منصة ملخصات تمريض - خدمة الطلاب والشكاوى 🩺</i>`;

  return sendTelegramMessage(text, 'HTML');
}

export async function notifyFlashcardSession(info: FlashcardSessionInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const countText = info.cardsCount ? `\n🃏 <b>عدد البطاقات:</b> ${info.cardsCount} بطاقة` : '';
  const lec = escapeHtml(info.lectureTitle);
  const sub = escapeHtml(info.subjectTitle);

  const text = `🧠 <b>طالب بدأ جلسة استذكار فلاش كاردز!</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${lec}
📚 <b>المادة:</b> ${sub}${countText}
⏰ <b>التوقيت:</b> ${time}
━━━━━━━━━━━━━━━━━━━━
<i>تفاعل مباشر مع نظام الفلاش كاردز ثلاثي الأبعاد 🩺</i>`;

  return sendTelegramMessage(text, 'HTML');
}

export async function sendDailySummary(
  info: DailySummaryInfo,
  targetChatId?: string | number
): Promise<boolean> {
  const time = getArabicFormattedDate();
  const dateStr = escapeHtml(info.date || 'اليوم');

  // Format concise breakdown
  let breakdownFormatted = '';
  if (info.breakdown && info.breakdown.length > 0) {
    const grouped: Record<string, number> = {};
    for (const item of info.breakdown) {
      grouped[item.subjectTitle] = (grouped[item.subjectTitle] || 0) + item.downloads;
    }
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
    breakdownFormatted = sorted
      .map(([subj, count]) => `• ${escapeHtml(subj)}: <b>${count}</b> تحميل`)
      .join('\n');
  } else {
    breakdownFormatted = '• لا توجد تحميلات مسجلة اليوم حتى الآن';
  }

  const todayVis = info.totalVisitors || 0;
  const yestVis = info.yesterdayVisitors ?? 0;
  let visTrend = '';
  if (yestVis > 0) {
    const diff = todayVis - yestVis;
    if (diff > 0) visTrend = ` (📈 +${diff})`;
    else if (diff < 0) visTrend = ` (📉 ${diff})`;
  }

  const todayDl = info.totalDownloads || 0;
  const yestDl = info.yesterdayDownloads ?? 0;
  let dlTrend = '';
  if (yestDl > 0) {
    const diff = todayDl - yestDl;
    if (diff > 0) dlTrend = ` (📈 +${diff})`;
    else if (diff < 0) dlTrend = ` (📉 ${diff})`;
  }

  const text = `📊 <b>إحصائيات منصة ملخصات تمريض</b> 🩺

📅 <b>التاريخ:</b> ${dateStr}
⏰ <b>الوقت:</b> ${time}

👥 <b>الزوار:</b>
• زوار اليوم: <b>${todayVis}</b> زائر${visTrend}
• زوار الأمس: <b>${yestVis}</b> زائر
• إجمالي الزوار التراكمي: <b>${info.allTimeVisitors ?? todayVis}</b>

📥 <b>التحميلات:</b>
• تحميلات اليوم: <b>${todayDl}</b> ملف${dlTrend}
• تحميلات الأمس: <b>${yestDl}</b> ملف
• إجمالي التحميلات التراكمي: <b>${info.allTimeDownloads ?? todayDl}</b>

📚 <b>أبرز المواد تحميلاً اليوم:</b>
${breakdownFormatted}`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🔄 تحديث الإحصائيات', callback_data: 'refresh_stats' },
        { text: '🌐 فتح المنصة', url: 'https://www.nursingsum.live/' },
      ],
    ],
  };

  return sendTelegramMessage(text, 'HTML', targetChatId, inlineKeyboard);
}

export async function notifyMaintenanceChanged(
  isEnabled: boolean,
  title: string,
  message: string,
  estimatedReturn?: string
): Promise<boolean> {
  const time = getArabicFormattedDate();
  const statusEmoji = isEnabled ? '🔒🚨' : '🎉🔓';
  const statusHeading = isEnabled
    ? '<b>تم قفل المنصة وتفعيل وضع الصيانة 🛠️</b>'
    : '<b>تم فتح المنصة واستئناف العمل بشكل طبيعي 🌟</b>';

  const lines = [
    `${statusEmoji} <b>تنبيه إدارة المنصة | وضع الصيانة</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    statusHeading,
    `⏰ <b>التوقيت:</b> <code>${escapeHtml(time)}</code>`,
  ];

  if (isEnabled) {
    if (title) lines.push(`📌 <b>عنوان التنبيه:</b> <code>${escapeHtml(title)}</code>`);
    if (message) lines.push(`💬 <b>الرسالة المعروضة للطلاب:</b>\n<i>${escapeHtml(message)}</i>`);
    if (estimatedReturn) lines.push(`⏳ <b>موعد العودة المتوقع:</b> <code>${escapeHtml(estimatedReturn)}</code>`);
    lines.push(`\n⚠️ <i>ملاحظة: يمكنك كأدمن معاينة وتصفح المنصة بشكل طبيعي أثناء القفل طالما أنك مسجل الدخول.</i>`);
  } else {
    lines.push(`\n✅ <i>المنصة متاحة الآن لجميع الطلاب والزوار بدون قيود.</i>`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🌐 <b>رابط المنصة:</b> <a href="${SITE_URL}">${SITE_URL}</a>`);

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '⚙️ لوحة التحكم', url: `${SITE_URL}/admin-dashboard` },
        { text: '🌐 معاينة المنصة', url: `${SITE_URL}/` },
      ],
    ],
  };

  return sendTelegramMessage(lines.join('\n'), 'HTML', undefined, inlineKeyboard);
}

export async function notifyNewPurchaseOrder(order: PurchaseOrder): Promise<boolean> {
  const time = getArabicFormattedDate();
  const lines = [
    `💳 <b>طلب شراء واشتراك في محاضرة جديد!</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>اسم الطالب:</b> ${escapeHtml(order.studentName)}`,
    `📱 <b>رقم هاتف الحساب:</b> <code>${escapeHtml(order.studentPhone)}</code>`,
    `🏛️ <b>الجامعة:</b> ${escapeHtml(order.studentUniversity)}`,
    `📚 <b>المحاضرة المطلوبة:</b> <b>${escapeHtml(order.lectureTitle)}</b>`,
    `🏷️ <b>المادة:</b> ${escapeHtml(order.subjectTitle)}`,
    `💰 <b>السعر المطلوب:</b> <b>${order.price} ج.م</b>`,
    `💸 <b>الرقم المحول منه (المحفظة):</b> <code>${escapeHtml(order.senderPhone)}</code>`,
    `📞 <b>رقم التواصل عند الحاجة:</b> <code>${escapeHtml(order.contactPhone)}</code>`,
  ];

  if (order.userMessage) {
    lines.push(`📝 <b>رسالة الطالب وتفاصيل الطلب:</b>\n<i>${escapeHtml(order.userMessage)}</i>`);
  }

  if (order.screenshotUrl) {
    lines.push(`🖼️ <b>إيصال التحويل:</b> <a href="${order.screenshotUrl}">اضغط هنا لعرض سكرين التحويل 📸</a>`);
  }

  lines.push(`⏰ <b>وقت الطلب:</b> ${time}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`👇 <b>إجراء فوري بضغطة زر:</b>`);

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ موافقة وافتحله المحاضرة', callback_data: `approve_order_${order.id}` },
        { text: '❌ رفض الدفع', callback_data: `reject_order_${order.id}` },
      ],
      [
        { text: '⚙️ إدارة الطلبات في لوحة التحكم', url: `${SITE_URL}/admin-dashboard` },
      ],
    ],
  };

  return sendTelegramMessage(lines.join('\n'), 'HTML', undefined, inlineKeyboard);
}

