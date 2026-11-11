import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME);
    const authHeader = req.headers.get('authorization');
    const isHeaderAuth = authHeader === `Bearer ${AUTH_SECRET_VALUE}`;
    const isCookieAuth = token?.value === AUTH_SECRET_VALUE;

    if (!isCookieAuth && !isHeaderAuth) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك بتغيير رمز الدخول، يرجى تسجيل الدخول كأدمن أولاً' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPin, newPin, confirmPin, customToken } = body;

    const existingPin = await CmsService.getAdminPin();
    const cleanCurrentPin = String(currentPin || '').trim();
    const cleanNewPin = String(newPin || '').trim();
    const cleanConfirmPin = String(confirmPin || '').trim();

    // 1. Verify current PIN
    if (cleanCurrentPin !== existingPin) {
      return NextResponse.json(
        { success: false, message: 'رمز الدخول الحالي غير صحيح، يرجى التأكد وإعادة المحاولة ⚠️' },
        { status: 400 }
      );
    }

    // 2. Validate new PIN
    if (!cleanNewPin || cleanNewPin.length < 4) {
      return NextResponse.json(
        { success: false, message: 'رمز الدخول الجديد يجب أن يحتوي على 4 خانات على الأقل 🔒' },
        { status: 400 }
      );
    }

    // 3. Prevent setting same PIN
    if (cleanNewPin === existingPin) {
      return NextResponse.json(
        { success: false, message: 'رمز الدخول الجديد مطابق للرمز الحالي، يرجى اختيار رمز مختلف 💡' },
        { status: 400 }
      );
    }

    // 4. Verify confirmation
    if (cleanNewPin !== cleanConfirmPin) {
      return NextResponse.json(
        { success: false, message: 'تأكيد الرمز الجديد غير مطابق للرمز المدخل ❌' },
        { status: 400 }
      );
    }

    // 5. Update PIN permanently in cloud store
    const updateRes = await CmsService.updateAdminPin(cleanNewPin, customToken);
    if (!updateRes.success) {
      return NextResponse.json(
        { success: false, message: updateRes.message },
        { status: 500 }
      );
    }

    // 6. Refresh admin cookie
    cookieStore.set(AUTH_COOKIE_NAME, AUTH_SECRET_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير رمز الدخول بنجاح وحفظه سحابياً! 🔐 احرص على حفظ الرمز الجديد.',
      updatedAt: updateRes.updatedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم أثناء تحديث الرمز: ' + (err?.message || '') },
      { status: 500 }
    );
  }
}
