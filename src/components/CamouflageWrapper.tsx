'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  // Initialize strictly with authoritative server prop
  const [currentPanicMode, setCurrentPanicMode] = useState<PanicModeConfig>(panicMode);

  const applyPanicState = useCallback(
    (isEnabled: boolean, activatedAt?: string) => {
      const isAdminPath =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/admin-dashboard') ||
          window.location.pathname.startsWith('/admin-login'));

      if (isEnabled) {
        const nowIso = activatedAt || new Date().toISOString();
        try {
          localStorage.setItem('nursing_panic_mode_active', 'true');
          localStorage.setItem('nursing_panic_mode_activated_at', nowIso);
          document.cookie = 'nursing_panic_mode=true; path=/; max-age=31536000; SameSite=Lax';
          document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';

          // Stop any audio/video playback immediately
          document.querySelectorAll('audio, video').forEach((el) => {
            try {
              (el as HTMLMediaElement).pause();
              (el as HTMLMediaElement).currentTime = 0;
            } catch {}
          });

          // Seamlessly mask URL in address bar to /store without page reload
          if (
            typeof window !== 'undefined' &&
            !isAdminPath &&
            !window.location.pathname.startsWith('/store') &&
            !window.location.pathname.startsWith('/product')
          ) {
            window.history.replaceState({ page: 'store' }, '', '/store');
          }
        } catch {}

        setCurrentPanicMode((prev) => {
          if (!prev.isEnabled) {
            return { isEnabled: true, activatedAt: nowIso };
          }
          return prev;
        });
      } else {
        // Deactivation requested:
        try {
          localStorage.removeItem('nursing_panic_mode_active');
          localStorage.removeItem('nursing_panic_mode_activated_at');
          document.cookie = 'nursing_panic_mode=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          document.title = 'ملخصات تمريض | المنصة الشاملة لكويزات ومواد التمريض التفاعلية';

          // Silently restore URL in address bar to / without page reload
          if (typeof window !== 'undefined') {
            if (window.location.pathname === '/store' || window.location.pathname.startsWith('/product')) {
              window.history.replaceState(null, '', '/');
            }
          }
        } catch {}

        setCurrentPanicMode((prev) => {
          if (prev.isEnabled) {
            return { isEnabled: false };
          }
          return prev;
        });
      }
    },
    []
  );

  // Sync when initial server prop changes
  useEffect(() => {
    if (panicMode?.isEnabled) {
      applyPanicState(true, panicMode.activatedAt);
    } else if (panicMode && !panicMode.isEnabled) {
      applyPanicState(false);
    }
  }, [panicMode, applyPanicState]);

  // Live real-time polling pulse (1.2s) + BroadcastChannel + storage sync
  useEffect(() => {
    let isMounted = true;
    let isChecking = false;

    const checkPanicStatus = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch(`/api/panic-status?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data && typeof data.isEnabled === 'boolean') {
          const isServerEnabled = Boolean(data.isEnabled);

          setCurrentPanicMode((prev) => {
            if (prev.isEnabled !== isServerEnabled) {
              applyPanicState(isServerEnabled, data.panicMode?.activatedAt);
              return { isEnabled: isServerEnabled, activatedAt: data.panicMode?.activatedAt };
            }
            return prev;
          });
        }
      } catch {
        // Ignore network glitches silently
      } finally {
        isChecking = false;
      }
    };

    // 1. Check immediately on mount
    checkPanicStatus();

    // 2. Check on tab visibility change (instant reaction when returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPanicStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Storage event for instant sync across tabs in the same browser
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nursing_panic_mode_active') {
        applyPanicState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Ultra-fast BroadcastChannel for 0ms instant trigger across all browser tabs
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('nursing_panic_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'PANIC_TOGGLED') {
            applyPanicState(Boolean(event.data.isEnabled), event.data.activatedAt);
          }
        };
      } catch {}
    }

    // 5. Fast 1.2-second pulse interval for external remote changes
    const interval = setInterval(checkPanicStatus, 1200);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      clearInterval(interval);
    };
  }, [applyPanicState]);

  // NEVER block admin routes so admin can always manage the platform
  const isAdminPath =
    pathname?.startsWith('/admin-dashboard') ||
    pathname?.startsWith('/admin-login') ||
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
