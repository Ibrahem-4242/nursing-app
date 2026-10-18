'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PanicModeConfig } from '@/lib/types';
import AlKhairDairyStore from './AlKhairDairyStore';

interface CamouflageWrapperProps {
  panicMode: PanicModeConfig;
  isAdmin: boolean;
  children: React.ReactNode;
}

export default function CamouflageWrapper({
  panicMode,
  isAdmin,
  children,
}: CamouflageWrapperProps) {
  const pathname = usePathname();
  const [currentPanicMode, setCurrentPanicMode] = useState<PanicModeConfig>(panicMode);

  useEffect(() => {
    setCurrentPanicMode(panicMode);
  }, [panicMode]);

  // Periodic poll or check to ensure zero-downtime instant switch
  useEffect(() => {
    let isMounted = true;
    const checkPanicStatus = async () => {
      try {
        const res = await fetch('/api/admin/panic-toggle', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.panicMode) {
            setCurrentPanicMode(data.panicMode);
          }
        }
      } catch {}
    };

    const interval = setInterval(checkPanicStatus, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // NEVER block admin-dashboard or admin APIs so the admin can turn it off
  const isAdminPath =
    pathname?.startsWith('/admin-dashboard') ||
    pathname?.startsWith('/api/admin');

  if (isAdminPath) {
    return <>{children}</>;
  }

  // If Emergency Camouflage Mode is active, render Al-Khair Dairy Store
  if (currentPanicMode?.isEnabled) {
    return <AlKhairDairyStore isAdmin={isAdmin} />;
  }

  // Otherwise render normal nursing platform
  return <>{children}</>;
}
