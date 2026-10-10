import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const reports = await CmsService.getBrokenLinkReports();
  const complaints = await CmsService.getComplaints();
  return NextResponse.json({ success: true, reports, complaints });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const body = await req.json();
  const { id, type } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف الطلب مطلوب' }, { status: 400 });
  }

  if (type === 'complaint') {
    const resolved = await CmsService.resolveComplaint(id);
    return NextResponse.json({
      success: resolved,
      message: resolved ? 'تم تحديد الشكوى كمحلولة' : 'لم يتم العثور على الشكوى',
    });
  }

  const resolved = await CmsService.resolveBrokenLinkReport(id);
  return NextResponse.json({
    success: resolved,
    message: resolved ? 'تم تحديد البلاغ كمكتمل ومصلح' : 'لم يتم العثور على البلاغ',
  });
}
