import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import { PlatformPackage } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAdminAuth(req: NextRequest): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token === AUTH_SECRET_VALUE;
}

export async function GET(req: NextRequest) {
  try {
    const packages = await CmsService.getPlatformPackages();
    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل جلب الباقات' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await req.json();
    const { package: pkgData, action, id, isActive } = body;

    // Handle toggle active status
    if (action === 'toggle' && id) {
      const all = await CmsService.getPlatformPackages();
      const existing = all.find((p) => p.id === id);
      if (existing) {
        existing.isActive = isActive !== undefined ? Boolean(isActive) : !existing.isActive;
        await CmsService.savePlatformPackage(existing);
        return NextResponse.json({
          success: true,
          message: existing.isActive ? 'تم تفعيل الباقة بنجاح ✅' : 'تم تعطيل الباقة بنجاح 🔒',
          package: existing,
        });
      }
      return NextResponse.json({ success: false, message: 'الباقة غير موجودة' }, { status: 404 });
    }

    if (!pkgData || !pkgData.name?.trim()) {
      return NextResponse.json({ success: false, message: 'اسم الباقة مطلوب' }, { status: 400 });
    }

    const saved = await CmsService.savePlatformPackage(pkgData);
    return NextResponse.json({
      success: true,
      message: `تم حفظ باقة "${saved.name}" بنجاح! 🚀`,
      package: saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل حفظ الباقة' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف الباقة مطلوب' }, { status: 400 });
    }

    const ok = await CmsService.deletePlatformPackage(id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'تعذر حذف الباقة' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الباقة بنجاح 🗑️',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل حذف الباقة' },
      { status: 500 }
    );
  }
}
