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
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json(
        { success: false, message: 'الخدمة غير متوفرة حالياً' },
        { status: 503 }
      );
    }

    const cookieStore = cookies();
    let currentStudentId = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (currentStudentId && currentStudentId.includes(':::')) {
      currentStudentId = currentStudentId.split(':::')[0];
    }

    const contentType = req.headers.get('content-type') || '';
    let studentId = '';
    let lectureId = '';
    let lectureTitle = '';
    let subjectTitle = '';
    let orderType: 'lecture' | 'shakib_rakib' = 'lecture';
    let yearId = '1';
    let monthLabel = '';
    let price = 50;
    let originalPrice = 50;
    let couponCode = '';
    let discountAmount = 0;
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
      orderType = (formData.get('orderType') as any) === 'shakib_rakib' ? 'shakib_rakib' : 'lecture';
      yearId = ((formData.get('yearId') as string) || '1').trim();
      monthLabel = ((formData.get('monthLabel') as string) || '').trim();
      price = Number(formData.get('price')) || (orderType === 'shakib_rakib' ? 10 : 50);
      originalPrice = Number(formData.get('originalPrice')) || price;
      couponCode = ((formData.get('couponCode') as string) || '').trim().toUpperCase();
      discountAmount = Number(formData.get('discountAmount')) || 0;
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
      orderType = body.orderType === 'shakib_rakib' ? 'shakib_rakib' : 'lecture';
      yearId = String(body.yearId || '1').trim();
      monthLabel = String(body.monthLabel || '').trim();
      price = Number(body.price) || (orderType === 'shakib_rakib' ? 10 : 50);
      originalPrice = Number(body.originalPrice) || price;
      couponCode = String(body.couponCode || '').trim().toUpperCase();
      discountAmount = Number(body.discountAmount) || 0;
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

    const effectiveLectureId = lectureId || (orderType === 'shakib_rakib' ? `shakib-rakib-${yearId}` : '');
    if (!effectiveLectureId) {
      return NextResponse.json(
        { success: false, message: 'معرف المحاضرة أو الباقة مطلوب' },
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

    // Process & Validate Coupon if provided
    let appliedCouponCode: string | undefined = undefined;
    let finalPrice = price;
    let computedDiscount = 0;
    const basePrice = originalPrice || price;

    if (couponCode) {
      const valRes = await CmsService.validateCoupon({
        code: couponCode,
        studentPhone: student.phone,
        lectureId: effectiveLectureId,
        originalPrice: basePrice,
      });

      if (!valRes.valid) {
        return NextResponse.json(
          { success: false, message: valRes.message || 'كود الخصم المدخل غير صالح أو منتهي' },
          { status: 400 }
        );
      }

      appliedCouponCode = valRes.coupon?.code || couponCode;
      computedDiscount = valRes.discountAmount || 0;
      finalPrice = valRes.finalPrice !== undefined ? valRes.finalPrice : Math.max(0, basePrice - computedDiscount);

      // Record coupon usage right away
      await CmsService.recordCouponUsage(appliedCouponCode, student.phone).catch((err) =>
        console.warn('[Purchase] Error recording coupon usage:', err)
      );
    }

    // Create Order in CMS
    const order = await CmsService.createOrder({
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      studentUniversity: student.university,
      lectureId: effectiveLectureId,
      lectureTitle:
        lectureTitle || (orderType === 'shakib_rakib' ? 'باقة شاكب راكب الشهرية 🚀' : 'محاضرة تمريض'),
      subjectTitle:
        subjectTitle || (orderType === 'shakib_rakib' ? 'جميع مواد السنة الدراسية' : 'مقرر تمريض'),
      orderType,
      yearId,
      monthLabel: monthLabel || undefined,
      price: finalPrice,
      originalPrice: basePrice,
      couponCode: appliedCouponCode,
      discountAmount: computedDiscount,
      senderPhone,
      contactPhone: contactPhone || student.phone,
      userMessage: userMessage || undefined,
      screenshotUrl: savedScreenshotUrl || undefined,
    });

    // Notify Telegram with interactive Inline Buttons
    notifyNewPurchaseOrder(order).catch((telErr) =>
      console.warn('[Telegram] Purchase order alert notice:', telErr)
    );

    const successMessage =
      orderType === 'shakib_rakib'
        ? 'تم إرسال طلب اشتراك باقة شاكب راكب الشهرية بنجاح! سيتم مراجعة الطلب وتفعيل جميع مواد ومحاضرات الشهر في حسابك فوراً بإذن الله 🚀'
        : 'تم إرسال طلب الشراء وتفاصيل التحويل بنجاح! سيتم مراجعة الطلب وفتح المحاضرة في حسابك فوراً بإذن الله 🚀';

    return NextResponse.json({
      success: true,
      message: successMessage,
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
    let studentId = searchParams.get('studentId') || cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (studentId && studentId.includes(':::')) {
      studentId = studentId.split(':::')[0];
    }

    if (!studentId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await CmsService.getOrdersByStudent(studentId);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
