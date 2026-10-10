import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const lectures = await CmsService.getAllLectures();
  return NextResponse.json({ success: true, lectures });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const deleted = await CmsService.deleteLecture(id);
  return NextResponse.json({ success: deleted, message: deleted ? 'تم حذف المحاضرة بنجاح' : 'لم يتم العثور على المحاضرة' });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const body = await req.json();
  const { id, isLive } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const updated = await CmsService.toggleLectureLive(id, !!isLive);
  return NextResponse.json({ success: !!updated, lecture: updated });
}
