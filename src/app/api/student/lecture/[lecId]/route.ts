import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { StudentUser } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_COOKIE_NAME = 'nursing_student_session';
const ADMIN_COOKIE_NAME = 'nursing_admin_token';
const ADMIN_SECRET_VALUE = 'secret_session_5143545638_verified';

export async function GET(
  req: NextRequest,
  { params }: { params: { lecId: string } }
) {
  try {
    const lecture = await CmsService.getLectureById(params.lecId);
    if (!lecture || (lecture as any).isLive === false) {
      return NextResponse.json(
        { success: false, message: 'المحاضرة غير موجودة' },
        { status: 404 }
      );
    }

    const cookieStore = cookies();

    // 1. Admin Access Check
    const isAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_SECRET_VALUE;

    // 2. Camouflage Security Check
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'المحاضرة غير موجودة' },
        { status: 404 }
      );
    }

    // 3. Student Access Check
    let student: StudentUser | null = null;
    const rawStudentVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (rawStudentVal) {
      const [studentId] = rawStudentVal.split(':::');
      if (studentId) {
        student = await CmsService.getStudentById(studentId);
        if (student && student.isSuspended) {
          return NextResponse.json(
            {
              success: false,
              isSuspended: true,
              contactPhone: '01148283443',
              message:
                '⚠️ تم تعليق وتجميد حسابك من قبل إدارة المنصة بسبب نشاط غير مصرح به.\nيرجى التواصل فوراً مع التيم لحل المشكلة على الرقم التالي:\n📞 01148283443',
            },
            { status: 403 }
          );
        }
      }
    }

    const hasAccess =
      lecture.isFree ||
      isAdmin ||
      CmsService.hasAccessToLecture(student, lecture.id, lecture.yearId);

    // If student has full authorized access, return full lecture
    if (hasAccess) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        lecture,
      });
    }

    // 🛡️ SECURITY SAFEGUARD: If NOT authorized, sanitize response completely!
    // Strip sensitive files (PDF, PPT, Audio, Questions) and detailed quiz & questions
    const sanitizedFiles = (lecture.files || []).filter(
      (f: any) => f.type === 'mindmap' || f.fileType === 'mindmap'
    );

    // Only minimal conceptual overview nodes for free mindmap preview
    const minimalConceptNodes = (lecture.concepts || []).map((c) => ({
      heading: c.heading,
      summary: c.summary,
      points: c.points?.slice(0, 3) || [],
      clinicalWarning: c.clinicalWarning,
    }));

    const sanitizedLecture = {
      id: lecture.id,
      title: lecture.title,
      subtitle: lecture.subtitle,
      subjectId: lecture.subjectId,
      subjectTitle: lecture.subjectTitle,
      yearId: lecture.yearId,
      yearTitle: lecture.yearTitle,
      isFree: false,
      price: lecture.price || 50,
      readingMinutes: lecture.readingMinutes,
      viewCount: lecture.viewCount,
      overview: lecture.overview,
      files: sanitizedFiles,
      concepts: minimalConceptNodes,
      // Strictly OMITTED:
      // terminology, interventions, clinicalPearls, quiz, flashcards, and all other file URLs!
    };

    return NextResponse.json({
      success: true,
      hasAccess: false,
      lecture: sanitizedLecture,
      message: 'المحاضرة مدفوعة - متاح استعراض الخريطة الذهنية فقط مجاناً 🗺️',
    });
  } catch (err: any) {
    console.error('[StudentLectureAPI] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'خطأ في تحميل بيانات المحاضرة' },
      { status: 500 }
    );
  }
}
