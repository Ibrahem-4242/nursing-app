import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // 1. REGISTER NEW STUDENT
    if (action === 'register') {
      const { phone, name, university, password } = body;

      if (!phone || !name || !university || !password) {
        return NextResponse.json(
          { success: false, message: 'يرجى إكمال جميع الحقول المطلوبة (الرقم، الاسم، جامعتك، الباسورد)' },
          { status: 400 }
        );
      }

      const cleanPhone = String(phone).trim().replace(/\s+/g, '');
      if (cleanPhone.length < 8) {
        return NextResponse.json(
          { success: false, message: 'يرجى إدخال رقم هاتف صحيح' },
          { status: 400 }
        );
      }

      if (String(password).trim().length < 4) {
        return NextResponse.json(
          { success: false, message: 'يجب ألا يقل الباسورد عن 4 أحرف أو أرقام' },
          { status: 400 }
        );
      }

      const result = await CmsService.registerStudent({
        phone: cleanPhone,
        name: String(name).trim(),
        university: String(university).trim(),
        password: String(password).trim(),
      });

      if (!result.success || !result.student) {
        return NextResponse.json(
          { success: false, message: result.message || 'فشل إنشاء الحساب' },
          { status: 400 }
        );
      }

      // Set cookie session (lasts 1 year)
      const res = NextResponse.json({
        success: true,
        message: 'تم إنشاء حسابك بنجاح! مرحباً بك في منصة ملخصات تمريض 🩺',
        student: {
          id: result.student.id,
          phone: result.student.phone,
          name: result.student.name,
          university: result.student.university,
          purchasedLectureIds: result.student.purchasedLectureIds || [],
        },
      });

      res.cookies.set(STUDENT_COOKIE_NAME, result.student.id, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return res;
    }

    // 2. LOGIN STUDENT
    if (action === 'login') {
      const { phone, password } = body;

      if (!phone || !password) {
        return NextResponse.json(
          { success: false, message: 'يرجى إدخال رقم الهاتف والباسورد' },
          { status: 400 }
        );
      }

      const cleanPhone = String(phone).trim().replace(/\s+/g, '');
      const student = await CmsService.getStudentByPhone(cleanPhone);

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'رقم الهاتف غير مسجل! اضغط على "إنشاء حساب جديد" للتسجيل.' },
          { status: 404 }
        );
      }

      if (student.password.trim() !== String(password).trim()) {
        return NextResponse.json(
          { success: false, message: 'الباسورد غير صحيح! يرجى التأكد من كتابة كلمة المرور بدقة.' },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        success: true,
        message: `أهلاً بك يا ${student.name}! تم تسجيل الدخول بنجاح 🎓`,
        student: {
          id: student.id,
          phone: student.phone,
          name: student.name,
          university: student.university,
          purchasedLectureIds: student.purchasedLectureIds || [],
        },
      });

      res.cookies.set(STUDENT_COOKIE_NAME, student.id, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return res;
    }

    // 3. LOGOUT
    if (action === 'logout') {
      const res = NextResponse.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      });
      res.cookies.delete(STUDENT_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error('[StudentAuth] Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'خطأ في السيرفر' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const studentId = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!studentId) {
      return NextResponse.json({ success: true, loggedIn: false, student: null });
    }

    const student = await CmsService.getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ success: true, loggedIn: false, student: null });
    }

    return NextResponse.json({
      success: true,
      loggedIn: true,
      student: {
        id: student.id,
        phone: student.phone,
        name: student.name,
        university: student.university,
        purchasedLectureIds: student.purchasedLectureIds || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, loggedIn: false, student: null });
  }
}
