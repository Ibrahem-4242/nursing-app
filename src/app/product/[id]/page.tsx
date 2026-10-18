import React from 'react';
import AlKhairDairyStore from '@/components/AlKhairDairyStore';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const isAdmin =
    cookies().get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';
  return <AlKhairDairyStore isAdmin={isAdmin} initialProductId={params.id} />;
}
