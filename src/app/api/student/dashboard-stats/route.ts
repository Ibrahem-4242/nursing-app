import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';
const ADMIN_COOKIE_NAME = 'nursing_admin_token';
const ADMIN_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_SECRET_VALUE;

    let sessionStudentId: string | null = null;
    const rawStudentVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (rawStudentVal) {
      const [id] = rawStudentVal.split(':::');
      if (id) sessionStudentId = id;
    }

    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get('studentId') || sessionStudentId;

    if (!isAdmin) {
      studentId = sessionStudentId || studentId;
    }

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'غير مسجل دخول أو الجلسة منتهية' },
        { status: 401 }
      );
    }

    const summary = await CmsService.getStudentStudySummary(studentId);
    if (!summary) {
      return NextResponse.json(
        { success: false, message: 'الطالب غير موجود في قاعدة البيانات' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, summary },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('[Dashboard Stats API] GET Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'حدث خطأ في جلب بيانات النشاط' },
      { status: 500 }
    );
  }
}
