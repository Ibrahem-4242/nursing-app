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
      return NextResponse.json(
        { success: true, notifications: [], yearId: '1' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    let yearId = searchParams.get('yearId') || undefined;
    let studentId = searchParams.get('studentId') || undefined;

    // Check cookie session if studentId not provided
    const cookieStore = cookies();
    const rawVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (rawVal) {
      const [cookieStudentId] = rawVal.split(':::');
      if (cookieStudentId) {
        studentId = studentId || cookieStudentId;
        const student = await CmsService.getStudentById(cookieStudentId);
        if (student) {
          if (!yearId) {
            yearId = student.yearId || student.shakibRakibSubscription?.yearId || '1';
          }
        }
      }
    }

    // Default yearId to '1' if still not found
    yearId = yearId || '1';

    const notifications = await CmsService.getNotifications(yearId, studentId);

    return NextResponse.json(
      {
        success: true,
        notifications,
        yearId,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, notificationId, notificationIds, studentId } = body;

    let targetStudentId = studentId;
    const cookieStore = cookies();
    const rawVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (rawVal && !targetStudentId) {
      const [cookieStudentId] = rawVal.split(':::');
      if (cookieStudentId) targetStudentId = cookieStudentId;
    }

    if (action === 'mark_read') {
      if (!notificationId) {
        return NextResponse.json({ success: false, message: 'معرف الإشعار مطلوب' }, { status: 400 });
      }
      await CmsService.markNotificationRead(notificationId, targetStudentId);
      return NextResponse.json({ success: true, message: 'تم تحديد الإشعار كمقروء' });
    }

    if (action === 'mark_all_read') {
      await CmsService.markAllNotificationsRead(targetStudentId, notificationIds);
      return NextResponse.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
