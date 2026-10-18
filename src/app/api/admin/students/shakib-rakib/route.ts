import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { ShakibRakibSubscription } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value === 'secret_session_5143545638_verified';

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await req.json();
    const studentId = String(body.studentId || '').trim();
    const action = String(body.action || 'grant'); // 'grant' | 'revoke'
    const days = Number(body.days) || 30;
    const yearId = String(body.yearId || '1').trim();
    const monthLabel = String(body.monthLabel || 'اشتراك الشهر الحالي 🚀').trim();

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'معرف الطالب مطلوب' }, { status: 400 });
    }

    if (action === 'revoke') {
      const ok = await CmsService.updateStudentShakibRakib(studentId, null);
      if (!ok) {
        return NextResponse.json({ success: false, message: 'تعذر إلغاء اشتراك الطالب' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'تم إلغاء باقة شاكب راكب للطالب بنجاح ✅' });
    }

    // Grant or extend
    const now = new Date();
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const sub: ShakibRakibSubscription = {
      isActive: true,
      yearId,
      startDate: now.toISOString(),
      expiresAt: expires.toISOString(),
      monthLabel,
    };

    const ok = await CmsService.updateStudentShakibRakib(studentId, sub);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'تعذر تفعيل الاشتراك للطالب' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `تم تفعيل باقة شاكب راكب للطالب بنجاح لمدة ${days} يوماً! 🚀`,
      subscription: sub,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
