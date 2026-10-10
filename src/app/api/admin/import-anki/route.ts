import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseAnkiPackage } from '@/lib/anki-parser';
import { CmsService } from '@/lib/cms-db';
import { sendTelegramMessage, getArabicFormattedDate } from '@/lib/telegram';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Check Admin Auth
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME);
    if (token?.value !== AUTH_SECRET_VALUE) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const lectureId = formData.get('lectureId') as string;
    const ankiFile = formData.get('ankiFile') as File | null;

    if (!lectureId || !ankiFile) {
      return NextResponse.json(
        { success: false, message: 'يرجى تحديد المحاضرة واختيار ملف حزمة Anki (.apkg)' },
        { status: 400 }
      );
    }

    // 2. Parse Anki Package in-memory
    const buffer = await ankiFile.arrayBuffer();
    const cards = await parseAnkiPackage(buffer);

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لم يتم العثور على أي بطاقات داخل ملف Anki' },
        { status: 400 }
      );
    }

    // 3. Find Lecture and Update
    const lecture = await CmsService.getLectureById(lectureId);
    if (!lecture) {
      return NextResponse.json(
        { success: false, message: 'المحاضرة غير موجودة' },
        { status: 404 }
      );
    }

    lecture.flashcards = cards;
    await CmsService.addOrUpdateLecture(lecture);

    // 4. Send Telegram Notification
    const alert = `🎴 <b>تم استيراد بطاقات Anki (.apkg) بنجاح!</b>
━━━━━━━━━━━━━━━━━━━━
📖 <b>المحاضرة:</b> ${lecture.title}
📚 <b>المادة:</b> ${lecture.subjectTitle}
🃏 <b>عدد البطاقات المستخرجة:</b> ${cards.length} بطاقة
⏰ <b>التوقيت:</b> ${getArabicFormattedDate()}
━━━━━━━━━━━━━━━━━━━━
<i>البطاقات تعمل الآن حصرياً داخل مستعرض الفلاش كاردز التفاعلي للطلاب (بدون زر تحميل) 🩺</i>`;

    sendTelegramMessage(alert).catch((e) =>
      console.warn('Telegram notice error:', e)
    );

    return NextResponse.json({
      success: true,
      cardsCount: cards.length,
      message: `تم استخراج ${cards.length} بطاقة بنجاح وربطها بالمحاضرة!`,
      cards,
    });
  } catch (err: any) {
    console.error('[ImportAnki] Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'حدث خطأ أثناء قراءة ملف Anki' },
      { status: 500 }
    );
  }
}
