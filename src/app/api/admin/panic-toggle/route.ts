import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';
const VALID_PIN = process.env.ADMIN_PIN || '5143545638';

function checkAdminAuth(req: NextRequest): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value === AUTH_SECRET_VALUE) return true;

  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.replace('Bearer ', '').trim() === AUTH_SECRET_VALUE) return true;

  return false;
}

export async function GET() {
  try {
    const panicMode = await CmsService.getPanicMode();
    return NextResponse.json(
      { success: true, panicMode },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'فشل في تحميل حالة وضع التمويه: ' + err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const isAuthed = checkAdminAuth(req) || (body.pin && String(body.pin).trim() === VALID_PIN);
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك بالتحكم في وضع التمويه والطوارئ' },
        { status: 401 }
      );
    }

    const currentMode = await CmsService.getPanicMode();
    const newIsEnabled = typeof body.isEnabled === 'boolean' ? body.isEnabled : !currentMode.isEnabled;

    const cookieStore = cookies();
    const customToken =
      req.headers.get('x-cloud-token')?.trim() ||
      cookieStore.get('nursing_cloud_token')?.value?.trim() ||
      undefined;

    const result = await CmsService.setPanicMode(newIsEnabled, customToken);

    try {
      revalidatePath('/', 'layout');
    } catch {}

    const response = NextResponse.json({
      success: true,
      isEnabled: result.isEnabled,
      activatedAt: result.activatedAt,
      message: result.isEnabled
        ? '🚨 تم تفعيل وضع التمويه بنجاح! تحولت المنصة الآن فوراً لمتجر حليب الخير 🥛🇸🇦'
        : '🟢 تم إيقاف وضع التمويه! عادت المنصة لطبيعتها كمنصة ملخصات تمريض 🩺',
    });

    response.cookies.set('nursing_panic_mode', result.isEnabled ? 'true' : 'false', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم: ' + (err?.message || 'خطأ غير معروف') },
      { status: 500 }
    );
  }
}
