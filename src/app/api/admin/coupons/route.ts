import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { PromoCoupon } from '@/lib/types';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function checkAdminAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const coupons = await CmsService.getCoupons();
    return NextResponse.json(
      { success: true, coupons },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const cleanCode = String(body.code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      return NextResponse.json({ success: false, message: 'كود الخصم مطلوب' }, { status: 400 });
    }

    const discountValue = Number(body.discountValue);
    if (!discountValue || discountValue <= 0) {
      return NextResponse.json(
        { success: false, message: 'قيمة الخصم يجب أن تكون أكبر من صفر' },
        { status: 400 }
      );
    }

    const couponData: PromoCoupon = {
      code: cleanCode,
      discountType: body.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue,
      maxUses: body.maxUses ? Number(body.maxUses) : undefined,
      usedCount: Number(body.usedCount) || 0,
      usedByStudents: Array.isArray(body.usedByStudents) ? body.usedByStudents : [],
      expiresAt: body.expiresAt || undefined,
      isActive: body.isActive ?? true,
      applicableLectureIds: Array.isArray(body.applicableLectureIds) ? body.applicableLectureIds : [],
      notes: body.notes || undefined,
    };

    const saved = await CmsService.saveCoupon(couponData);
    return NextResponse.json({
      success: true,
      message: 'تم حفظ كود الخصم بنجاح ✅',
      coupon: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'فشل حفظ الكود' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let code = searchParams.get('code');
    if (!code) {
      const body = await req.json().catch(() => ({}));
      code = body.code;
    }

    if (!code) {
      return NextResponse.json({ success: false, message: 'كود الخصم مطلوب للحذف' }, { status: 400 });
    }

    const deleted = await CmsService.deleteCoupon(code);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'تم حذف كود الخصم بنجاح ✅' : 'فشل حذف كود الخصم',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, isActive } = body;
    if (!code) {
      return NextResponse.json({ success: false, message: 'كود الخصم مطلوب' }, { status: 400 });
    }

    const updated = await CmsService.toggleCouponActive(code, Boolean(isActive));
    return NextResponse.json({
      success: updated,
      message: updated ? 'تم تحديث حالة كود الخصم بنجاح ✅' : 'لم يتم العثور على الكود',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
