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
  const subjects = await CmsService.getAllSubjects();
  return NextResponse.json(
    { success: true, subjects },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, yearId, semester, description, englishTitle } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'اسم المادة مطلوب' },
        { status: 400 }
      );
    }

    const customToken = getCustomToken(req) || body.token || '';
    const newSub = await CmsService.addSubject(
      {
        title: title.trim(),
        yearId: yearId || '1',
        semester: semester === '2' ? '2' : semester === 'both' ? 'both' : '1',
        description: description?.trim(),
        englishTitle: englishTitle?.trim(),
      },
      customToken
    );

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      subject: newSub,
      message: `تمت إضافة مادة "${newSub.title}" بنجاح!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'حدث خطأ أثناء إضافة المادة' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, yearId, semester, syncItemsSemester, description, englishTitle } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف المادة مطلوب' },
        { status: 400 }
      );
    }

    const customToken = getCustomToken(req) || body.token || '';
    const updated = await CmsService.updateSubject(
      {
        id,
        ...(title ? { title: title.trim() } : {}),
        ...(yearId ? { yearId } : {}),
        ...(semester ? { semester } : {}),
        ...(syncItemsSemester !== undefined ? { syncItemsSemester: Boolean(syncItemsSemester) } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(englishTitle !== undefined ? { englishTitle: englishTitle.trim() } : {}),
      },
      customToken
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'لم يتم العثور على المادة' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin-dashboard', 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      subject: updated,
      message: 'تم تحديث المادة بنجاح',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'خطأ أثناء تعديل المادة' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المادة مطلوب' }, { status: 400 });
  }

  const customToken = getCustomToken(req);
  await CmsService.deleteSubject(id, customToken);

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/admin-dashboard', 'page');
  } catch {}

  return NextResponse.json({
    success: true,
    message: 'تم حذف المادة بنجاح',
  });
}
