import { NextRequest, NextResponse } from 'next/server';
import { notifyNewVisitor, notifyGoogleVisitor, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      deviceType,
      page,
      userAgent,
      referrer,
      search,
      visitorName,
      name,
      isNewStudent,
      isDailyUnique,
      clientDetectedGoogle,
    } = body;

    const time = getArabicFormattedDate();
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const headerUA = req.headers.get('user-agent') || '';
    const headerReferer = req.headers.get('referer') || '';

    // 1. Comprehensive Google Detection (case-insensitive across user-agent, referrer, name, and URL)
    const googleReasons: string[] = [];
    const uaCombined = `${userAgent || ''} ${headerUA}`.trim();
    const refCombined = `${referrer || ''} ${headerReferer}`.trim();
    const nameCombined = `${visitorName || ''} ${name || ''}`.trim();
    const urlCombined = `${page || ''} ${search || ''} ${req.nextUrl.search || ''} ${req.nextUrl.href || ''}`.trim();

    if (/googlebot/i.test(uaCombined)) {
      googleReasons.push('عنكبوت أرشفة وفهرسة (Googlebot)');
    } else if (/google/i.test(uaCombined)) {
      googleReasons.push('متصفح / عميل يحتوي على كلمة Google');
    }

    if (/google/i.test(refCombined)) {
      googleReasons.push('زائر محول من محرك بحث Google (Referrer)');
    }

    if (/google/i.test(nameCombined)) {
      googleReasons.push(`اسم الزائر يتضمن كلمة Google (${nameCombined})`);
    }

    if (/google/i.test(urlCombined)) {
      googleReasons.push('رابط الوصول يتضمن وسوم Google (UTM / Campaign)');
    }

    if (clientDetectedGoogle && googleReasons.length === 0) {
      googleReasons.push('دخول مرتبط بمصدر Google');
    }

    const isGoogle = googleReasons.length > 0;

    // 2. Always record in CMS Database for background analytics and daily stats
    await CmsService.trackVisitor({
      deviceType: deviceType || 'غير محدد',
      page: page || '/',
      userAgent: userAgent || headerUA || '',
      isDailyUnique: isDailyUnique !== false,
    });

    let notificationSent = false;

    // 3. Notification dispatch according to user requirements:
    // A. If the visit contains "google" in ANY form -> notify EVERY SINGLE TIME
    if (isGoogle) {
      await notifyGoogleVisitor({
        deviceType: deviceType || 'غير محدد',
        page: page || '/',
        userAgent: userAgent || headerUA || '',
        referrer: refCombined || 'محرك بحث Google',
        visitorName: nameCombined,
        googleReason: googleReasons.join(' + '),
        ip,
        time,
        isGoogle: true,
      });
      notificationSent = true;
    }
    // B. If NOT Google: ONLY send alert if this is the student's FIRST TIME EVER (طالب جديد)
    // If not first time: skip silently (لو مش اول مره خلاص)
    else if (isNewStudent && isDailyUnique !== false) {
      await notifyNewVisitor({
        deviceType: deviceType || 'غير محدد',
        page: page || '/',
        userAgent: userAgent || headerUA || '',
        referrer: referrer || headerReferer || 'دخول مباشر',
        ip,
        time,
        isFirstTime: true,
      });
      notificationSent = true;
    }

    return NextResponse.json({
      success: true,
      notified: notificationSent,
      isGoogle,
      isNewStudent: !!isNewStudent,
    });
  } catch (err) {
    console.error('[TrackVisitor] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
