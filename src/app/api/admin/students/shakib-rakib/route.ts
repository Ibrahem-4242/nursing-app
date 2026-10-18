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
      const student = await CmsService.getStudentById(studentId);
      if (student?.shakibRakibSubscription) {
        const updatedSub: ShakibRakibSubscription = {
          ...student.shakibRakibSubscription,
          isActive: false,
        };
        await CmsService.updateStudentShakibRakib(studentId, updatedSub);
      } else {
        await CmsService.updateStudentShakibRakib(studentId, null);
      }
      return NextResponse.json({ success: true, message: 'تم إيقاف باقة شاكب راكب للطالب بنجاح ⏹️' });
    }

    // Grant or extend (تمديد أو تفعيل بدون إضاعة الأيام المتبقية)
    const existingStudent = await CmsService.getStudentById(studentId);
    const now = new Date();
    let baseTime = now.getTime();
    let originalStartDate = now.toISOString();

    if (existingStudent?.shakibRakibSubscription?.isActive && existingStudent.shakibRakibSubscription.expiresAt) {
      const currentExpiry = new Date(existingStudent.shakibRakibSubscription.expiresAt).getTime();
      // If currently active and expiry is in future, stack new days onto the remaining time
      if (currentExpiry > now.getTime()) {
        baseTime = currentExpiry;
        if (existingStudent.shakibRakibSubscription.startDate) {
          originalStartDate = existingStudent.shakibRakibSubscription.startDate;
        }
      }
    }

    const expires = new Date(baseTime + days * 24 * 60 * 60 * 1000);
    const sub: ShakibRakibSubscription = {
      isActive: true,
      yearId: yearId || existingStudent?.yearId || '1',
      startDate: originalStartDate,
      expiresAt: expires.toISOString(),
      monthLabel: monthLabel || existingStudent?.shakibRakibSubscription?.monthLabel || 'اشتراك الشهر الحالي 🚀',
    };

    const ok = await CmsService.updateStudentShakibRakib(studentId, sub);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'تعذر تفعيل الاشتراك للطالب' }, { status: 400 });
    }

    const isExtended = baseTime > now.getTime();
    return NextResponse.json({
      success: true,
      message: isExtended
        ? `تم تمديد اشتراك باقة شاكب راكب للطالب بنجاح لمدة ${days} يوماً إضافية دون إضاعة رصيده المتبقي! 🚀`
        : `تم تفعيل باقة شاكب راكب للطالب بنجاح لمدة ${days} يوماً! 🚀`,
      subscription: sub,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
