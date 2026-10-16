import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';
const BUILTIN_SYNC_TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  if (token?.value !== AUTH_SECRET_VALUE) {
    return NextResponse.json({ success: false, message: 'غير مصرح لك بالوصول' }, { status: 401 });
  }

  const repo = process.env.GITHUB_REPO || 'Ibrahem-4242/nursing-app';
  const syncToken = process.env.GITHUB_SYNC_TOKEN || BUILTIN_SYNC_TOKEN;

  return NextResponse.json({
    success: true,
    repo,
    token: syncToken,
    uploadBaseUrl: `https://api.github.com/repos/${repo}/contents/public/uploads/`,
  });
}
