import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const stats = await CmsService.getSummaryStats();
  const todayAnalytics = await CmsService.getTodayAnalytics();
  const flashcardsAnalytics = await CmsService.getPlatformFlashcardsAnalytics();

  return NextResponse.json({
    success: true,
    stats,
    todayAnalytics,
    flashcardsAnalytics,
  });
}
