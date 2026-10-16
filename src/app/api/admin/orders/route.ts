import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { sendTelegramMessage } from '@/lib/telegram';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const orders = await CmsService.getOrders();
    return NextResponse.json({ success: true, orders }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'معرف الطلب مطلوب' }, { status: 400 });
    }

    if (action === 'approve') {
      const res = await CmsService.approveOrder(orderId);
      if (res.success && res.order) {
        sendTelegramMessage(
          `✅ <b>تمت الموافقة على طلب الدفع من لوحة التحكم!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 الطالب: <b>${res.order.studentName}</b>\n📱 الهاتف: <code>${res.order.studentPhone}</code>\n📚 المحاضرة: <b>${res.order.lectureTitle}</b>\n🔓 <i>المحاضرة مفتوحة الآن في حساب الطالب!</i>`
        ).catch(() => {});
      }
      return NextResponse.json({
        success: res.success,
        message: res.success ? 'تم اعتماد الدفع وتفعيل المحاضرة للطالب فوراً ✅' : res.message,
        order: res.order,
      });
    }

    if (action === 'reject') {
      const rejectionReason = (reason && String(reason).trim()) || 'لم يتم استلام المبلغ على فودافون كاش - يرجى التأكد من الرقم والإشعار';
      const res = await CmsService.rejectOrder(orderId, rejectionReason);
      if (res.success && res.order) {
        sendTelegramMessage(
          `❌ <b>تم رفض طلب الدفع من لوحة التحكم!</b>\n━━━━━━━━━━━━━━━━━━━━\n👤 الطالب: <b>${res.order.studentName}</b>\n📱 الهاتف: <code>${res.order.studentPhone}</code>\n📚 المحاضرة: <b>${res.order.lectureTitle}</b>\n⚠️ <b>السبب الموضح للطالب:</b> ${rejectionReason}`
        ).catch(() => {});
      }
      return NextResponse.json({
        success: res.success,
        message: res.success ? 'تم تسجيل رفض الطلب وإبلاغ الطالب بالسبب ✅' : res.message,
        order: res.order,
      });
    }

    if (action === 'delete') {
      const deleted = await CmsService.deleteOrder(orderId);
      return NextResponse.json({ success: deleted, message: deleted ? 'تم حذف الطلب' : 'فشل حذف الطلب' });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خطأ في السيرفر' }, { status: 500 });
  }
}
