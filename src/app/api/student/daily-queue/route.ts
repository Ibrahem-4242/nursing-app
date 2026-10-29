import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { getCairoDateString } from '@/lib/spaced-repetition';
import { DailyReviewQueueItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!sessionVal) {
      // Guest mode: fetch sample queue from free lectures
      const allLectures = await CmsService.getAllLectures();
      const guestCards: DailyReviewQueueItem[] = [];
      const todayStr = getCairoDateString();

      for (const lec of allLectures) {
        if (guestCards.length >= 10) break;
        if (lec.isFree && lec.flashcards && lec.flashcards.length > 0) {
          for (const card of lec.flashcards) {
            if (guestCards.length >= 10) break;
            guestCards.push({
              cardId: card.id,
              front: card.front,
              back: card.back,
              clinicalPearl: card.clinicalPearl,
              lectureId: lec.id,
              lectureTitle: lec.title,
              subjectId: lec.subjectId,
              subjectTitle: lec.subjectTitle,
              intervalDays: 1,
              repetitions: 0,
              easeFactor: 2.5,
              nextReviewDate: todayStr,
              isDue: true,
              isNewCard: true,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        guest: true,
        dueCards: guestCards,
        totalDue: guestCards.length,
        subjectsCount: new Set(guestCards.map((c) => c.subjectId)).size,
        subjectsBreakdown: [],
        streak: { currentStreak: 0, longestStreak: 0 },
        isCompletedToday: false,
        message: 'سجل دخولك لحفظ تكرارات SM-2 وعداد الاستمرارية اليومية!',
      });
    }

    const [studentId] = sessionVal.split(':::');
    const queueData = await CmsService.getStudentDailyReviewQueue(studentId);

    return NextResponse.json(queueData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[DailyQueueAPI] Error fetching queue:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحميل جرعة المراجعة اليومية' },
      { status: 500 }
    );
  }
}
