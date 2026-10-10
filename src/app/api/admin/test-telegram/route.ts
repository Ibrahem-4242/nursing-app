import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const ok = await sendTelegramMessage(
    `🔔 <b>رسالة اختبارية من لوحة تحكم منصة ملخصات تمريض</b>\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>التوقيت:</b> ${getArabicFormattedDate()}\n✅ اتصال البوت بنجاح 100%! الإشعارات الفورية مفعلة وشغالة تمام.`
  );

  return NextResponse.json({
    success: ok,
    message: ok ? 'تم إرسال الرسالة التجريبية لتيليجرام بنجاح!' : 'فشل الإرسال، تحقق من بيانات البوت',
  });
}
