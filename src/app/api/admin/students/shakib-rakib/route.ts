import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { PackagePermissions } from '@/lib/types';

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
    const days = body.days !== undefined && body.days !== null ? Number(body.days) : 30;
    const expiresAt = body.expiresAt ? String(body.expiresAt).trim() : undefined;
    const calculationMode = body.calculationMode
      ? String(body.calculationMode).trim()
      : expiresAt
      ? 'exact_date'
      : 'set_from_now';
    const packageId = String(body.packageId || 'shakib-rakib').trim();
    const packageName = String(body.packageName || body.monthLabel || 'باقة شاكب راكب الشاملة 🚀').trim();
    const yearId = String(body.yearId || '1').trim();
    const notes = body.notes ? String(body.notes).trim() : undefined;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'معرف الطالب مطلوب' }, { status: 400 });
    }

    if (action === 'revoke') {
      await CmsService.revokeStudentPackage(studentId);
      return NextResponse.json({
        success: true,
        message: 'تم إيقاف الاشتراك والباقة للطالب بنجاح ⏹️',
      });
    }

    // Default permissions if not passed
    const rawPermissions = body.permissions || {};
    const permissions: PackagePermissions = {
      allSubjects: rawPermissions.allSubjects !== undefined ? Boolean(rawPermissions.allSubjects) : true,
      subjectIds: Array.isArray(rawPermissions.subjectIds) ? rawPermissions.subjectIds : [],
      yearId: rawPermissions.yearId || yearId || 'all',
      semesters: rawPermissions.semesters || 'all',
      contentTypes: Array.isArray(rawPermissions.contentTypes) && rawPermissions.contentTypes.length > 0
        ? rawPermissions.contentTypes
        : ['all'],
    };

    const grantRes = await CmsService.grantPackageToStudent(studentId, {
      packageId,
      packageName,
      days: calculationMode === 'exact_date' && expiresAt ? undefined : days,
      expiresAt,
      calculationMode: calculationMode as any,
      permissions,
      notes,
      yearId,
      monthLabel: packageName,
    });

    if (!grantRes.success) {
      return NextResponse.json({ success: false, message: grantRes.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: grantRes.message,
      student: grantRes.student,
      subscription: grantRes.student?.shakibRakibSubscription,
      activePackage: grantRes.student?.activePackage,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
