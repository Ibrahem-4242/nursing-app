import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function GET() {
  try {
    const announcement = await CmsService.getAnnouncement();
    return NextResponse.json(
      { success: true, announcement },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to load announcement' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME);
    if (token?.value !== AUTH_SECRET_VALUE) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل الإعلان' }, { status: 401 });
    }

    const body = await req.json();
    const { text, isActive, linkText, linkUrl } = body;

    const customToken =
      req.headers.get('x-github-token') ||
      cookieStore.get('nursing_sync_token')?.value ||
      body.token ||
      '';

    const updated = await CmsService.updateAnnouncement(
      text,
      !!isActive,
      linkText,
      linkUrl,
      customToken
    );

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json(
      { success: true, announcement: updated },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: 'فشل حفظ الإعلان' }, { status: 500 });
  }
}
