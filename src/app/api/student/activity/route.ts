import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { PanicEngine } from '@/lib/panic-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';
const ADMIN_COOKIE_NAME = 'nursing_admin_token';
const ADMIN_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function POST(req: NextRequest) {
  try {
    // 1. Panic / Camouflage check: completely suppress all logging
    const panicMode = await PanicEngine.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ success: true, panic: true });
    }

    // 2. Identify registered student from cookie or body
    const cookieStore = cookies();
    let studentId: string | null = null;
    const rawStudentVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (rawStudentVal) {
      const [id] = rawStudentVal.split(':::');
      if (id) studentId = id;
    }

    // 3. Parse payload (supports standard JSON fetch and navigator.sendBeacon text)
    let payload: any = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = {};
      }
    }

    // Fallback to studentId in payload if cookie wasn't read
    if (!studentId && payload.studentId) {
      studentId = String(payload.studentId).trim();
    }

    // We only track registered student accounts per requirements
    if (!studentId) {
      return NextResponse.json({ success: true, guest: true });
    }

    const {
      sessionActivityId,
      targetType = 'lecture',
      targetId = 'general',
      targetTitle = 'صفحة بدون عنوان',
      subjectTitle,
      resourceTitle,
      incrementSeconds = 15,
      details,
      deviceId,
    } = payload;

    const result = await CmsService.recordStudentActivityHeartbeat({
      sessionActivityId: sessionActivityId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      studentPhone: payload.studentPhone,
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle),
      subjectTitle: subjectTitle ? String(subjectTitle) : undefined,
      resourceTitle: resourceTitle ? String(resourceTitle) : undefined,
      incrementSeconds: Number(incrementSeconds) || 15,
      details,
      deviceId,
    });

    if (result.isSuspended) {
      return NextResponse.json(
        { success: false, isSuspended: true, message: 'الحساب معلق ومجمد' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      totalStudySeconds: result.totalStudySeconds,
    });
  } catch (error) {
    console.warn('[Student Activity API] POST Notice:', error);
    return NextResponse.json({ success: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_SECRET_VALUE;

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const isSummary = searchParams.get('summary') === 'true';
    const isLive = searchParams.get('live') === 'true';
    const isStats = searchParams.get('stats') === 'true';
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    if (isStats) {
      const stats = await CmsService.getPlatformStudyStats();
      return NextResponse.json({ success: true, stats });
    }

    if (isLive) {
      const liveStudents = await CmsService.getLiveActiveStudents(15);
      return NextResponse.json({ success: true, students: liveStudents });
    }

    if (studentId && isSummary) {
      const summary = await CmsService.getStudentStudySummary(studentId);
      if (!summary) {
        return NextResponse.json({ success: false, message: 'الطالب غير موجود' }, { status: 404 });
      }
      return NextResponse.json({ success: true, summary });
    }

    const logs = await CmsService.getStudentActivityLogs(studentId || undefined, limit);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('[Student Activity API] GET Error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في جلب بيانات النشاط' }, { status: 500 });
  }
}
