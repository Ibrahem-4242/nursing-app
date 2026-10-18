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
    const features = await CmsService.getPlatformFeatures();
    return NextResponse.json(
      { success: true, features },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'فشل في جلب إعدادات الميزات: ' + err?.message },
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
        { success: false, message: 'غير مصرح لك بالتحكم في إعدادات المنصة' },
        { status: 401 }
      );
    }

    const cookieStore = cookies();
    const customToken =
      req.headers.get('x-cloud-token')?.trim() ||
      cookieStore.get('nursing_cloud_token')?.value?.trim() ||
      undefined;

    const updated = await CmsService.updatePlatformFeatures(body.features || {}, customToken);

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({
      success: true,
      features: updated,
      message: 'تم تحديث وحفظ إعدادات ظهور الميزات بنجاح! 🎛️',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'فشل في تحديث إعدادات الميزات: ' + (err?.message || 'خطأ غير معروف') },
      { status: 500 }
    );
  }
}
