import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!sessionVal) {
      return NextResponse.json({
        success: true,
        guest: true,
        streak: { currentStreak: 1, longestStreak: 1 },
        isNewStreakDay: true,
        message: 'أبطال التمريض لا يكلّون! أنهيت مراجعة اليوم كاملة بنجاح 🩺✨، سجّل دخولك لتثبيت الاستمرارية سحابياً!',
      });
    }

    const [studentId] = sessionVal.split(':::');
    const result = await CmsService.completeDailyReviewSession(studentId);

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[DailyQueueCompleteAPI] Error completing daily session:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل إتمام الجلسة اليومية' },
      { status: 500 }
    );
  }
}
