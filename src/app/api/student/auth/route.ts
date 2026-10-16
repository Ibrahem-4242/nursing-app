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
      const { phone, name, university, password, deviceId } = body;

      if (!phone || !name || !university || !password) {
        return NextResponse.json(
          { success: false, message: 'يرجى إكمال جميع الحقول المطلوبة (الرقم، الاسم، جامعتك، الباسورد)' },
          { status: 400 }
        );
      }

      // STRICT VALIDATION: Name CANNOT contain any numbers
      if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(String(name))) {
        return NextResponse.json(
          { success: false, message: 'الاسم بالكامل يجب أن يحتوي على حروف فقط وبدون أي أرقام' },
          { status: 400 }
        );
      }

      // STRICT VALIDATION: Phone CANNOT contain any letters
      let cleanPhone = String(phone).trim();
      cleanPhone = cleanPhone.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
      cleanPhone = cleanPhone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
      cleanPhone = cleanPhone.replace(/\s+/g, '');

      if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, message: 'رقم الهاتف يجب أن يحتوي على أرقام فقط وبدون أي حروف (مثال: 01xxxxxxxxx)' },
          { status: 400 }
        );
      }

      if (String(password).trim().length < 4) {
        return NextResponse.json(
          { success: false, message: 'يجب ألا يقل الباسورد عن 4 أحرف أو أرقام' },
          { status: 400 }
        );
      }

      const sessionId = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      const cleanDeviceId = (deviceId || '').trim();

      const result = await CmsService.registerStudent({
        phone: cleanPhone,
        name: String(name).trim(),
        university: String(university).trim(),
        password: String(password).trim(),
        deviceId: cleanDeviceId,
        sessionId,
      });

      if (!result.success || !result.student) {
        return NextResponse.json(
          { success: false, message: result.message || 'فشل إنشاء الحساب' },
          { status: 400 }
        );
      }

      // Set cookie session with studentId:::sessionId (lasts 1 year)
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

      res.cookies.set(STUDENT_COOKIE_NAME, `${result.student.id}:::${sessionId}`, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return res;
    }

    // 2. LOGIN STUDENT
    if (action === 'login') {
      const { phone, password, deviceId } = body;

      if (!phone || !password) {
        return NextResponse.json(
          { success: false, message: 'يرجى إدخال رقم الهاتف والباسورد' },
          { status: 400 }
        );
      }

      let cleanPhone = String(phone).trim();
      cleanPhone = cleanPhone.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
      cleanPhone = cleanPhone.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
      cleanPhone = cleanPhone.replace(/[^0-9]/g, '');

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

      const sessionId = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      const cleanDeviceId = (deviceId || '').trim();

      // Check 5 devices lifetime limit and set single active session ID
      const record = await CmsService.recordStudentLogin(student.id, cleanDeviceId, sessionId);
      if (!record.success) {
        return NextResponse.json(
          {
            success: false,
            code: record.code || 'DEVICE_ERROR',
            message: record.message || 'فشل تسجيل الدخول',
          },
          { status: 403 }
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

      res.cookies.set(STUDENT_COOKIE_NAME, `${student.id}:::${sessionId}`, {
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
    const rawVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!rawVal) {
      return NextResponse.json({ success: true, loggedIn: false, student: null });
    }

    // Split studentId and sessionId
    const [studentId, sessionId] = rawVal.split(':::');
    if (!studentId) {
      return NextResponse.json({ success: true, loggedIn: false, student: null });
    }

    const student = await CmsService.getStudentById(studentId);
    if (!student) {
      const res = NextResponse.json({ success: true, loggedIn: false, student: null });
      res.cookies.delete(STUDENT_COOKIE_NAME);
      return res;
    }

    // SINGLE ACTIVE DEVICE CONCURRENT SESSION CHECK:
    // If student has a currentSessionId and our session doesn't match it,
    // another device has logged in! Immediately terminate this session!
    if (student.currentSessionId && sessionId && student.currentSessionId !== sessionId) {
      const res = NextResponse.json({
        success: false,
        loggedIn: false,
        sessionTerminated: true,
        message: 'تم فتح حسابك من جهاز آخر، وتم إنهاء هذه الجلسة تلقائياً للحفاظ على خصوصيتك وأمان حسابك 🔒',
      });
      res.cookies.delete(STUDENT_COOKIE_NAME);
      return res;
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
        knownDevicesCount: student.knownDevices?.length || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, loggedIn: false, student: null });
  }
}
