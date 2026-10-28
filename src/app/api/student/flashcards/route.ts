import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { FlashcardReviewState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';
const ADMIN_COOKIE_NAME = 'nursing_admin_token';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const requestedStudentId = url.searchParams.get('studentId');

    const cookieStore = cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    let targetStudentId = requestedStudentId;

    if (!targetStudentId) {
      if (!sessionVal) {
        return NextResponse.json({
          success: true,
          guest: true,
          memory: {
            totalReviewed: 0,
            masteredCount: 0,
            needsPracticeCount: 0,
            masteryPercentage: 0,
            byLecture: [],
            forgottenCards: [],
          },
        });
      }
      const [studentId] = sessionVal.split(':::');
      targetStudentId = studentId;
    } else {
      // If requesting a specific studentId, verify either admin or own session
      if (!adminToken) {
        const [studentId] = sessionVal ? sessionVal.split(':::') : [''];
        if (studentId !== targetStudentId) {
          return NextResponse.json(
            { success: false, message: 'غير مصرح بالوصول إلى بيانات هذا الطالب' },
            { status: 403 }
          );
        }
      }
    }

    const memory = await CmsService.getStudentFlashcardMemory(targetStudentId);

    return NextResponse.json({
      success: true,
      studentId: targetStudentId,
      memory: memory || {
        totalReviewed: 0,
        masteredCount: 0,
        needsPracticeCount: 0,
        masteryPercentage: 0,
        byLecture: [],
        forgottenCards: [],
      },
    });
  } catch (err: any) {
    console.error('[FlashcardsAPI] Error fetching memory:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحميل سجل استذكار الكروت' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieStore = cookies();
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!sessionVal && !body.studentId) {
      return NextResponse.json({
        success: true,
        guest: true,
        message: 'تم الحفظ محلياً في المتصفح. سجّل دخولك لحفظها دائماً في الداشبورد سحابياً!',
      });
    }

    const currentStudentId = sessionVal ? sessionVal.split(':::')[0] : body.studentId;
    const student = await CmsService.getStudentById(currentStudentId);

    if (!student) {
      return NextResponse.json({
        success: true,
        guest: true,
        message: 'تم الحفظ محلياً في المتصفح',
      });
    }

    // Check if batch
    if (Array.isArray(body.reviews)) {
      const validReviews = body.reviews.filter(
        (r: any) => r && r.cardId !== undefined && r.lectureId && r.state
      );

      const result = await CmsService.recordBatchFlashcardReviews(student.id, validReviews);
      return NextResponse.json({
        success: true,
        count: result.count,
        message: 'تمت مزامنة تقدم الكروت بنجاح 🎴',
      });
    }

    // Single review
    const { cardId, cardFront, cardBack, lectureId, lectureTitle, subjectId, subjectTitle, state } = body;

    if (cardId === undefined || !lectureId || !state) {
      return NextResponse.json(
        { success: false, message: 'بيانات تقييم الكارت غير مكتملة' },
        { status: 400 }
      );
    }

    const result = await CmsService.recordFlashcardReview(student.id, {
      cardId,
      cardFront,
      cardBack,
      lectureId,
      lectureTitle,
      subjectId,
      subjectTitle,
      state: state as FlashcardReviewState,
    });

    return NextResponse.json({
      success: true,
      progress: result.progress,
      message: 'تم حفظ تقييم الكارت بنجاح ✅',
    });
  } catch (err: any) {
    console.error('[FlashcardsAPI] Error recording flashcard review:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'حدث خطأ أثناء حفظ تقييم الكارت' },
      { status: 500 }
    );
  }
}
