import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function GET() {
  try {
    const announcement = await CmsService.getAnnouncement();
    return NextResponse.json({ success: true, announcement });
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

    const updated = await CmsService.updateAnnouncement(
      text,
      !!isActive,
      linkText,
      linkUrl
    );

    return NextResponse.json({ success: true, announcement: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'فشل حفظ الإعلان' }, { status: 500 });
  }
}
