import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    const studentPhone = String(body.studentPhone || '').trim();
    const lectureId = String(body.lectureId || '').trim();
    const originalPrice = Number(body.originalPrice) || 50;

    if (!code) {
      return NextResponse.json(
        { success: false, valid: false, message: 'يرجى إدخال كود الخصم' },
        { status: 400 }
      );
    }

    const result = await CmsService.validateCoupon({
      code,
      studentPhone,
      lectureId: lectureId || undefined,
      originalPrice,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: result.message || 'كود الخصم غير صالح أو منتهي',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: result.message,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      coupon: {
        code: result.coupon?.code,
        discountType: result.coupon?.discountType,
        discountValue: result.coupon?.discountValue,
      },
    });
  } catch (err: any) {
    console.error('[ValidateCoupon API] Error:', err);
    return NextResponse.json(
      { success: false, valid: false, message: err?.message || 'حدث خطأ أثناء فحص الكود' },
      { status: 500 }
    );
  }
}
