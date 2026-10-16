import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

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
    const students = await CmsService.getStudents();
    return NextResponse.json({ success: true, students }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
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
    const { action, studentId, newPassword, lectureId, grant } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'معرف الطالب مطلوب' }, { status: 400 });
    }

    // 1. UPDATE PASSWORD
    if (action === 'update_password') {
      if (!newPassword || String(newPassword).trim().length < 4) {
        return NextResponse.json({ success: false, message: 'يجب أن يكون الباسورد الجديد 4 أحرف أو أرقام على الأقل' }, { status: 400 });
      }

      const updated = await CmsService.updateStudentPassword(studentId, String(newPassword).trim());
      return NextResponse.json({
        success: updated,
        message: updated ? 'تم تغيير باسورد الطالب بنجاح! 🔑' : 'فشل تغيير الباسورد، يرجى المحاولة مرة أخرى',
      });
    }

    // 2. TOGGLE LECTURE ACCESS (GRANT OR REVOKE)
    if (action === 'toggle_lecture') {
      if (!lectureId) {
        return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
      }

      const updated = await CmsService.toggleStudentLectureAccess(studentId, lectureId, Boolean(grant));
      return NextResponse.json({
        success: updated,
        message: updated
          ? Boolean(grant)
            ? 'تم فتح وتفعيل المحاضرة للطالب بنجاح! 🔓'
            : 'تم قفل وسحب صلاحية المحاضرة من الطالب بنجاح! 🔒'
          : 'فشل تعديل صلاحية المحاضرة',
      });
    }

    // 3. DELETE STUDENT
    if (action === 'delete') {
      const deleted = await CmsService.deleteStudent(studentId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'تم حذف حساب الطالب بنجاح' : 'فشل حذف الحساب',
      });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خطأ في السيرفر' }, { status: 500 });
  }
}
