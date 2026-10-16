import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { saveUploadedFile } from '@/lib/file-storage';
import { notifyNewPurchaseOrder } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const STUDENT_COOKIE_NAME = 'nursing_student_session';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    let currentStudentId = cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    const contentType = req.headers.get('content-type') || '';
    let studentId = '';
    let lectureId = '';
    let lectureTitle = '';
    let subjectTitle = '';
    let price = 50;
    let senderPhone = '';
    let contactPhone = '';
    let userMessage = '';
    let externalScreenshotUrl = '';
    let screenshotFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      studentId = ((formData.get('studentId') as string) || '').trim();
      lectureId = ((formData.get('lectureId') as string) || '').trim();
      lectureTitle = ((formData.get('lectureTitle') as string) || '').trim();
      subjectTitle = ((formData.get('subjectTitle') as string) || '').trim();
      price = Number(formData.get('price')) || 50;
      senderPhone = ((formData.get('senderPhone') as string) || '').trim();
      contactPhone = ((formData.get('contactPhone') as string) || '').trim();
      userMessage = ((formData.get('userMessage') as string) || '').trim();
      externalScreenshotUrl = ((formData.get('externalScreenshotUrl') as string) || '').trim();
      screenshotFile = formData.get('screenshot') as File | null;
    } else {
      const body = await req.json();
      studentId = String(body.studentId || '').trim();
      lectureId = String(body.lectureId || '').trim();
      lectureTitle = String(body.lectureTitle || '').trim();
      subjectTitle = String(body.subjectTitle || '').trim();
      price = Number(body.price) || 50;
      senderPhone = String(body.senderPhone || '').trim();
      contactPhone = String(body.contactPhone || '').trim();
      userMessage = String(body.userMessage || '').trim();
      externalScreenshotUrl = String(body.externalScreenshotUrl || '').trim();
    }

    const effectiveStudentId = studentId || currentStudentId;
    if (!effectiveStudentId) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أو إنشاء حساب طالب أولاً للمتابعة' },
        { status: 401 }
      );
    }

    const student = await CmsService.getStudentById(effectiveStudentId);
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'لم يتم العثور على حساب الطالب. يرجى إعادة تسجيل الدخول.' },
        { status: 404 }
      );
    }

    if (!senderPhone) {
      return NextResponse.json(
        { success: false, message: 'يرجى كتابة رقم المحفظة الذي قمت بالتحويل منه' },
        { status: 400 }
      );
    }

    if (!lectureId) {
      return NextResponse.json(
        { success: false, message: 'معرف المحاضرة مطلوب' },
        { status: 400 }
      );
    }

    // Save screenshot if provided
    let savedScreenshotUrl = externalScreenshotUrl;
    if (screenshotFile && screenshotFile.size > 0) {
      try {
        const fileBytes = new Uint8Array(await screenshotFile.arrayBuffer());
        const saved = await saveUploadedFile(fileBytes, screenshotFile.name);
        savedScreenshotUrl = saved.url;
      } catch (uploadErr) {
        console.warn('[PurchaseOrder] Screenshot upload error:', uploadErr);
      }
    }

    // Create Order in CMS
    const order = await CmsService.createOrder({
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      studentUniversity: student.university,
      lectureId,
      lectureTitle: lectureTitle || 'محاضرة تمريض',
      subjectTitle: subjectTitle || 'مقرر تمريض',
      price,
      senderPhone,
      contactPhone: contactPhone || student.phone,
      userMessage: userMessage || undefined,
      screenshotUrl: savedScreenshotUrl || undefined,
    });

    // Notify Telegram with interactive Inline Buttons
    notifyNewPurchaseOrder(order).catch((telErr) =>
      console.warn('[Telegram] Purchase order alert notice:', telErr)
    );

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الشراء وتفاصيل التحويل بنجاح! سيتم مراجعة الطلب وفتح المحاضرة في حسابك فوراً بإذن الله 🚀',
      order,
    });
  } catch (err: any) {
    console.error('[PurchaseOrder] Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'فشل إرسال طلب الشراء' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = cookies();
    const studentId = searchParams.get('studentId') || cookieStore.get(STUDENT_COOKIE_NAME)?.value;

    if (!studentId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await CmsService.getOrdersByStudent(studentId);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
