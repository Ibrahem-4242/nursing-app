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

    // 2. UPDATE FULL STUDENT DATA (NAME, PHONE, UNIVERSITY, PASSWORD)
    if (action === 'update_student') {
      const { name, phone, university, password, yearId } = body;

      if (name && /[0-9\u0660-\u0669\u06F0-\u06F9]/.test(String(name))) {
        return NextResponse.json(
          { success: false, message: 'اسم الطالب يجب أن يحتوي على حروف فقط وبدون أي أرقام' },
          { status: 400 }
        );
      }

      let cleanPhone = phone ? String(phone).trim() : undefined;
      if (cleanPhone) {
        cleanPhone = cleanPhone.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
        cleanPhone = cleanPhone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
        cleanPhone = cleanPhone.replace(/\s+/g, '');
        if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
          return NextResponse.json(
            { success: false, message: 'رقم الهاتف يجب أن يحتوي على أرقام فقط وبدون أي حروف (مثال: 01xxxxxxxxx)' },
            { status: 400 }
          );
        }
      }

      if (password && String(password).trim().length < 4) {
        return NextResponse.json(
          { success: false, message: 'يجب ألا يقل الباسورد عن 4 أحرف أو أرقام' },
          { status: 400 }
        );
      }

      const res = await CmsService.updateStudentData(studentId, {
        name: name ? String(name).trim() : undefined,
        phone: cleanPhone,
        university: university ? String(university).trim() : undefined,
        password: password ? String(password).trim() : undefined,
        yearId: yearId ? String(yearId).trim() : undefined,
      });

      return NextResponse.json({
        success: res.success,
        message: res.success ? 'تم تحديث بيانات الطالب بنجاح! ✅' : (res.message || 'فشل تحديث البيانات'),
        student: res.student,
      });
    }

    // 3. RESET DEVICES
    if (action === 'reset_devices') {
      const res = await CmsService.resetStudentDevices(studentId);
      return NextResponse.json(res);
    }

    // 4. UNLOCK STUDENT ACCOUNT (BRUTE-FORCE RESET)
    if (action === 'unlock') {
      const res = await CmsService.unlockStudent(studentId);
      return NextResponse.json(res);
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
