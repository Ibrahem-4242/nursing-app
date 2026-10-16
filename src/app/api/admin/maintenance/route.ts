import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { notifyMaintenanceChanged } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';
const VALID_PIN = process.env.ADMIN_PIN || '5143545638';

function checkAdminAuth(req: NextRequest): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value === AUTH_SECRET_VALUE) return true;

  // Header fallback
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.replace('Bearer ', '').trim() === AUTH_SECRET_VALUE) return true;

  return false;
}

export async function GET() {
  try {
    const maintenance = await CmsService.getMaintenanceConfig();
    return NextResponse.json(
      { success: true, maintenance },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'فشل في تحميل حالة الصيانة' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check auth either via cookie/header or via explicit pin in body
    const isAuthed = checkAdminAuth(req) || (body.pin && String(body.pin).trim() === VALID_PIN);
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك بتعديل حالة قفل المنصة' },
        { status: 401 }
      );
    }

    const { isEnabled, title, message, estimatedReturn, contactWhatsapp } = body;

    const cookieStore = cookies();
    const customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      body.token ||
      '';

    const previousConfig = await CmsService.getMaintenanceConfig();

    const updated = await CmsService.updateMaintenanceConfig(
      {
        isEnabled: Boolean(isEnabled),
        title: title !== undefined ? String(title).trim() : previousConfig.title,
        message: message !== undefined ? String(message).trim() : previousConfig.message,
        estimatedReturn:
          estimatedReturn !== undefined ? String(estimatedReturn).trim() : previousConfig.estimatedReturn,
        contactWhatsapp:
          contactWhatsapp !== undefined ? String(contactWhatsapp).trim() : previousConfig.contactWhatsapp,
      },
      customToken
    );

    // Revalidate all pages layout immediately
    try {
      revalidatePath('/', 'layout');
    } catch (rErr) {
      console.warn('[Maintenance Route] Revalidation notice:', rErr);
    }

    // Send Telegram Notification
    try {
      await notifyMaintenanceChanged(
        updated.isEnabled,
        updated.title,
        updated.message,
        updated.estimatedReturn
      );
    } catch (tErr) {
      console.warn('[Maintenance Route] Telegram alert error:', tErr);
    }

    return NextResponse.json({
      success: true,
      maintenance: updated,
      message: updated.isEnabled
        ? 'تم تفعيل وضع قفل المنصة بنجاح 🔒'
        : 'تم فتح المنصة للجميع واستئناف العمل بنجاح 🌟',
    });
  } catch (err) {
    console.error('[Maintenance Route] Error updating maintenance:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في تحديث إعدادات الصيانة' },
      { status: 500 }
    );
  }
}
