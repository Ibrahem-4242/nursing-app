const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8098726389';

export interface VisitorInfo {
  deviceType?: string;
  userAgent?: string;
  page?: string;
  ip?: string;
  time?: string;
  isFirstTime?: boolean;
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
  targetChatId?: string | number
): Promise<boolean> {
  const chatId = targetChatId ? String(targetChatId) : TELEGRAM_CHAT_ID;
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.warn('[Telegram] Missing BOT_TOKEN or CHAT_ID');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
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
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export async function notifyNewVisitor(info: VisitorInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const device = info.deviceType || 'غير محدد';
  const page = info.page || '/';

  const text = `🎓 <b>طالب جديد دخل المنصة لأول مرة!</b>
━━━━━━━━━━━━━━━━━━━━
📱 <b>نوع الجهاز:</b> ${device}
🌐 <b>صفحة البداية:</b> <code>${page}</code>
⏰ <b>التوقيت:</b> ${time}
💻 <b>المتصفح:</b> <i>${(info.userAgent || '').slice(0, 120)}</i>`;

  return sendTelegramMessage(text);
}

export async function notifyDownload(info: DownloadInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();

  const text = `📥 <b>قام طالب بتحميل: [${info.lectureTitle}] - [${info.subjectTitle}]</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${info.lectureTitle}
📚 <b>المادة:</b> ${info.subjectTitle}
📄 <b>نوع المورد:</b> ${info.fileType}
⏰ <b>التوقيت:</b> ${time}`;

  return sendTelegramMessage(text);
}

export async function notifyBrokenLink(info: BrokenLinkInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const phoneLine = info.userPhone ? `\n📞 <b>رقم هاتف الطالب:</b> <code>${info.userPhone}</code>` : '';

  const text = `⚠️ <b>بلاغ: طالب أبلغ عن عطل في رابط: [${info.lectureTitle}]</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${info.lectureTitle}
📚 <b>المادة:</b> ${info.subjectTitle}
🔗 <b>الرابط المتأثر:</b> <code>${info.linkUrl}</code>${phoneLine}
📝 <b>ملاحظة الطالب:</b> ${info.userNote ? `<i>${info.userNote}</i>` : 'لم يتم تقديم ملاحظة'}
⏰ <b>التوقيت:</b> ${time}`;

  return sendTelegramMessage(text);
}

export async function notifyComplaint(info: ComplaintInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const typeTag = info.type || 'شكوى أو استفسار';

  const text = `🚨 <b>وصلتك شكوى جديدة من طالب عبر الموقع!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>اسم الطالب:</b> ${info.name || 'طالب تمريض'}
📞 <b>رقم الهاتف / الواتساب:</b> <code>${info.phone}</code>
🎓 <b>السنة الدراسية:</b> ${info.year || 'السنة الأولى'}
🏷️ <b>التصنيف:</b> ${typeTag}
📝 <b>نص الشكوى / الرسالة:</b>
<i>${info.message}</i>
⏰ <b>التوقيت:</b> ${time}
━━━━━━━━━━━━━━━━━━━━
<i>منصة ملخصات تمريض - خدمة الطلاب والشكاوى 🩺</i>`;

  return sendTelegramMessage(text);
}

export async function notifyFlashcardSession(info: FlashcardSessionInfo): Promise<boolean> {
  const time = info.time || getArabicFormattedDate();
  const countText = info.cardsCount ? `\n🃏 <b>عدد البطاقات:</b> ${info.cardsCount} بطاقة` : '';

  const text = `🧠 <b>طالب بدأ جلسة استذكار فلاش كاردز!</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${info.lectureTitle}
📚 <b>المادة:</b> ${info.subjectTitle}${countText}
⏰ <b>التوقيت:</b> ${time}
━━━━━━━━━━━━━━━━━━━━
<i>تفاعل مباشر مع نظام الفلاش كاردز ثلاثي الأبعاد 🩺</i>`;

  return sendTelegramMessage(text);
}

export async function sendDailySummary(info: DailySummaryInfo, targetChatId?: string | number): Promise<boolean> {
  let breakdownLines = '';

  if (info.breakdown && info.breakdown.length > 0) {
    const grouped: Record<string, Array<{ lecture: string; count: number }>> = {};
    for (const item of info.breakdown) {
      if (!grouped[item.subjectTitle]) grouped[item.subjectTitle] = [];
      grouped[item.subjectTitle].push({ lecture: item.lectureTitle, count: item.downloads });
    }

    for (const [subject, items] of Object.entries(grouped)) {
      const subjectTotal = items.reduce((acc, i) => acc + i.count, 0);
      breakdownLines += `\n📚 <b>${subject}</b> (${subjectTotal} تحميل):\n`;
      for (const it of items) {
        breakdownLines += `  • ${it.lecture}: <b>${it.count}</b> تحميل\n`;
      }
    }
  } else {
    breakdownLines = '\n<i>لا توجد تحميلات مسجلة اليوم بعد.</i>\n';
  }

  const pageViewsLine = info.pageViews !== undefined ? `\n👁️ <b>مشاهدات الصفحات اليوم:</b> ${info.pageViews} مشاهدة` : '';
  const yesterdayVisitorsLine = info.yesterdayVisitors !== undefined ? `\n👥 <b>زوار الأمس:</b> ${info.yesterdayVisitors} زائر` : '';
  const allTimeVisitorsLine = info.allTimeVisitors !== undefined ? `\n🌐 <b>إجمالي الزوار الكلي:</b> ${info.allTimeVisitors} زائر` : '';
  const yesterdayDownloadsLine = info.yesterdayDownloads !== undefined ? `\n📥 <b>تحميلات الأمس:</b> ${info.yesterdayDownloads} تحميل` : '';
  const allTimeDownloadsLine = info.allTimeDownloads !== undefined ? `\n📦 <b>إجمالي التحميلات الكلي:</b> ${info.allTimeDownloads} تحميل` : '';

  const text = `📊 <b>التقرير اليومي التلقائي (Daily Analytics Summary)</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>تاريخ التقرير:</b> ${info.date} (توقيت مصر)
👥 <b>إجمالي الزوار اليوم:</b> ${info.totalVisitors} زائر${pageViewsLine}${yesterdayVisitorsLine}${allTimeVisitorsLine}
📥 <b>إجمالي عدد التحميلات اليومية:</b> ${info.totalDownloads} تحميل${yesterdayDownloadsLine}${allTimeDownloadsLine}
━━━━━━━━━━━━━━━━━━━━
<b>تفصيل التحميلات لكل مادة ومحاضرة:</b>${breakdownLines}
━━━━━━━━━━━━━━━━━━━━
<i>منصة ملخصات تمريض - الرعاية التعليمية المعتمدة 🩺</i>`;

  return sendTelegramMessage(text, 'HTML', targetChatId);
}
