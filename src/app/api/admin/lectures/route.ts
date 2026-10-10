import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

function getCustomToken(req: NextRequest): string {
  const cookieStore = cookies();
  return (
    req.headers.get('x-github-token') ||
    cookieStore.get('nursing_sync_token')?.value ||
    ''
  );
}

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const lectures = await CmsService.getAllLectures();
  return NextResponse.json(
    { success: true, lectures },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
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

  const customToken = getCustomToken(req);
  const deleted = await CmsService.deleteLecture(id, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json({
    success: deleted,
    message: deleted ? 'تم حذف المحاضرة بنجاح' : 'لم يتم العثور على المحاضرة',
  });
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

  const customToken = getCustomToken(req) || body.token || '';
  const updated = await CmsService.toggleLectureLive(id, !!isLive, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json({ success: !!updated, lecture: updated });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, lectureNumber, adminNote, overview, isFree } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const existing = await CmsService.getLectureById(id);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'المحاضرة غير موجودة' }, { status: 404 });
  }

  const updated = {
    ...existing,
    ...(title ? { title: title.trim() } : {}),
    ...(lectureNumber ? { lectureNumber: Number(lectureNumber) } : {}),
    ...(adminNote !== undefined ? { adminNote: adminNote.trim() } : {}),
    ...(overview !== undefined ? { overview: overview.trim() } : {}),
    ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
  };

  const customToken = getCustomToken(req) || body.token || '';
  await CmsService.addOrUpdateLecture(updated, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json({ success: true, lecture: updated });
}
