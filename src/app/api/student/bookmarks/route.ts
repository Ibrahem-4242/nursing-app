import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';

export async function GET(req: NextRequest) {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({
        success: true,
        guest: true,
        bookmarks: { lectureIds: [], questionIds: [], conceptIds: [] },
      });
    }

    const cookieStore = cookies();
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!sessionVal) {
      return NextResponse.json({
        success: true,
        guest: true,
        bookmarks: { lectureIds: [], questionIds: [], conceptIds: [] },
      });
    }

    const [studentId] = sessionVal.split(':::');
    const student = await CmsService.getStudentById(studentId);

    if (!student) {
      return NextResponse.json({
        success: true,
        guest: true,
        bookmarks: { lectureIds: [], questionIds: [], conceptIds: [] },
      });
    }

    const bookmarks = await CmsService.getStudentBookmarks(student.id);

    return NextResponse.json({
      success: true,
      studentId: student.id,
      bookmarks,
    });
  } catch (err: any) {
    console.error('[BookmarksAPI] Error fetching bookmarks:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحميل المحفوظات' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, targetId } = body;

    if (!type || !['lecture', 'question', 'concept'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'نوع الإشارة المرجعية غير صالح' },
        { status: 400 }
      );
    }

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'معرف الهدف غير صالح' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!sessionVal) {
      // Guest student: respond so client can handle local optimistic storage
      return NextResponse.json({
        success: true,
        guest: true,
        message: 'تم الحفظ في متصفحك بنجاح (سجل دخولك لمزامنتها سحابياً)',
      });
    }

    const [studentId] = sessionVal.split(':::');
    const student = await CmsService.getStudentById(studentId);

    if (!student) {
      return NextResponse.json({
        success: true,
        guest: true,
        message: 'تم الحفظ في متصفحك بنجاح',
      });
    }

    const result = await CmsService.toggleStudentBookmark(student.id, type, targetId);

    return NextResponse.json({
      success: true,
      isBookmarked: result.isBookmarked,
      bookmarks: result.bookmarks,
      message: result.isBookmarked
        ? 'تمت الإضافة لمحفوظات ليلة الامتحان 🔖'
        : 'تمت الإزالة من المحفوظات 🗑️',
    });
  } catch (err: any) {
    console.error('[BookmarksAPI] Error toggling bookmark:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'حدث خطأ أثناء حفظ الإشارة المرجعية' },
      { status: 500 }
    );
  }
}
