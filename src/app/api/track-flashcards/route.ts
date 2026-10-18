import { NextRequest, NextResponse } from 'next/server';
import { notifyFlashcardSession, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { lectureTitle, subjectTitle, cardsCount } = body;

    const time = getArabicFormattedDate();
    await notifyFlashcardSession({
      lectureTitle: lectureTitle || 'محاضرة تمريض',
      subjectTitle: subjectTitle || 'مقرر دراسي',
      cardsCount: Number(cardsCount) || 0,
      time,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn('[TrackFlashcards] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
