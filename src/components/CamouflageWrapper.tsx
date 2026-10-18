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

  // Instant hydration-safe local memory initialization
  const [currentPanicMode, setCurrentPanicMode] = useState<PanicModeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nursing_panic_mode_active');
        if (cached === 'true') {
          return { isEnabled: true };
        }
      } catch {}
    }
    return panicMode;
  });

  useEffect(() => {
    setCurrentPanicMode(panicMode);
  }, [panicMode]);

  // Live real-time instant switch: poll every 2.5 seconds with zero-cache
  useEffect(() => {
    let isMounted = true;

    const checkPanicStatus = async () => {
      try {
        const res = await fetch(`/api/panic-status?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            const isEnabled = Boolean(data.isEnabled);
            setCurrentPanicMode((prev) => {
              if (prev.isEnabled !== isEnabled) {
                if (!isEnabled && prev.isEnabled) {
                  // Mode was just deactivated by admin! Reload to restore fresh nursing platform
                  try {
                    localStorage.removeItem('nursing_panic_mode_active');
                  } catch {}
                  window.location.reload();
                }
                return { isEnabled, activatedAt: data.panicMode?.activatedAt };
              }
              return prev;
            });

            if (isEnabled) {
              try {
                localStorage.setItem('nursing_panic_mode_active', 'true');
                document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
                // Stop any audio playback immediately
                document.querySelectorAll('audio').forEach((el) => {
                  try {
                    el.pause();
                    el.currentTime = 0;
                  } catch {}
                });
                // Seamlessly clean address bar if on any nursing route to /store
                if (
                  typeof window !== 'undefined' &&
                  !window.location.pathname.startsWith('/admin-dashboard')
                ) {
                  window.history.replaceState({ page: 'store' }, '', '/store');
                }
              } catch {}
            } else {
              try {
                localStorage.removeItem('nursing_panic_mode_active');
              } catch {}
            }
          }
        }
      } catch {}
    };

    // Check immediately on mount and on visibility change
    checkPanicStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPanicStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Fast pulse interval: 2.5 seconds
    const interval = setInterval(checkPanicStatus, 2500);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // NEVER block admin-dashboard or admin APIs so the admin can always turn it off
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
