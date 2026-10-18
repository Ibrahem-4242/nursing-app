import React from 'react';
import AlKhairDairyStore from '@/components/AlKhairDairyStore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const cookieStore = cookies();
  const isAdmin =
    cookieStore.get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';
  const hasPanicCookie = cookieStore.get('nursing_panic_mode')?.value === 'true';

  const panicMode = await CmsService.getPanicMode();
  if (!panicMode.isEnabled) {
    redirect('/');
  }

  return <AlKhairDairyStore isAdmin={isAdmin} />;
}
