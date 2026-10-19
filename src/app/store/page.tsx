import React from 'react';
import AlKhairDairyStore from '@/components/AlKhairDairyStore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PanicEngine } from '@/lib/panic-engine';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const cookieStore = cookies();
  const isAdmin =
    cookieStore.get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  const panicMode = await PanicEngine.getPanicMode();
  if (!panicMode.isEnabled) {
    redirect('/');
  }

  return <AlKhairDairyStore isAdmin={isAdmin} />;
}
