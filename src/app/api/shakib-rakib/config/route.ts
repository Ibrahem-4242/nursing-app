import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const config = await CmsService.getShakibRakibConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value === 'secret_session_5143545638_verified';

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك بتعديل الإعدادات' }, { status: 403 });
    }

    const body = await req.json();
    const updates: any = {};
    if (typeof body.price === 'number') updates.price = Math.max(1, body.price);
    if (typeof body.isEnabled === 'boolean') updates.isEnabled = body.isEnabled;
    if (typeof body.monthLabel === 'string') updates.monthLabel = body.monthLabel.trim();

    const config = await CmsService.updateShakibRakibConfig(updates);
    return NextResponse.json({ success: true, message: 'تم تحديث إعدادات باقة شاكب راكب بنجاح ✅', config });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
