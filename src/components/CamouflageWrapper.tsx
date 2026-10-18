'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const consecutiveFalseCount = useRef(0);

  // Instant hydration-safe local memory initialization
  const [currentPanicMode, setCurrentPanicMode] = useState<PanicModeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nursing_panic_mode_active');
        const hasCookie = document.cookie.includes('nursing_panic_mode=true');
        if (cached === 'true' || hasCookie) {
          const actAt = localStorage.getItem('nursing_panic_mode_activated_at') || undefined;
          return { isEnabled: true, activatedAt: actAt };
        }
      } catch {}
    }
    return panicMode;
  });

  const applyPanicState = useCallback(
    (isEnabled: boolean, activatedAt?: string, isConfirmedAction = false) => {
      const isAdminPath =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/admin-dashboard') ||
          window.location.pathname.startsWith('/admin-login'));

      if (isEnabled) {
        consecutiveFalseCount.current = 0;
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

          // Seamlessly mask URL to /store if on any nursing route (never mask admin pages)
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
          document.cookie = 'nursing_panic_mode=; path=/; max-age=0; SameSite=Lax';
          document.title = 'ملخصات تمريض | المنصة الشاملة لكويزات ومواد التمريض التفاعلية';

          // Smoothly restore URL without page reload if on masked /store route
          if (typeof window !== 'undefined') {
            if (window.location.pathname === '/store' || window.location.pathname.startsWith('/product')) {
              window.history.replaceState(null, '', '/');
            }
          }
        } catch {}

        consecutiveFalseCount.current = 0;

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

  // Sync initial server prop changes safely
  useEffect(() => {
    if (panicMode?.isEnabled) {
      applyPanicState(true, panicMode.activatedAt);
    } else if (panicMode && !panicMode.isEnabled) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('nursing_panic_mode_active');
        if (cached !== 'true') {
          applyPanicState(false, undefined, true);
        }
      }
    }
  }, [panicMode, applyPanicState]);

  // Live real-time instant switch: 1-second pulse interval + BroadcastChannel + storage event
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

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (isMounted && data) {
          const isServerEnabled = Boolean(data.isEnabled);
          if (isServerEnabled) {
            consecutiveFalseCount.current = 0;
            applyPanicState(true, data.panicMode?.activatedAt);
          } else {
            // Server returned isServerEnabled: false.
            // Check if this client is currently active in panic mode.
            const isCurrentlyActive =
              currentPanicMode?.isEnabled ||
              (typeof window !== 'undefined' &&
                localStorage.getItem('nursing_panic_mode_active') === 'true');

            if (!isCurrentlyActive) {
              // Not active anyway, nothing to do
              return;
            }

            // CRITICAL DEFENSE AGAINST 1-SECOND REVERT:
            // A deactivation is ONLY valid if the server provides an explicit deactivatedAt
            // timestamp that occurred STRICTLY AFTER this client was activated!
            const clientActIso =
              (typeof window !== 'undefined' &&
                localStorage.getItem('nursing_panic_mode_activated_at')) ||
              currentPanicMode?.activatedAt;
            const clientActTime = clientActIso ? new Date(clientActIso).getTime() : 0;

            const serverDeactIso = data.panicMode?.deactivatedAt;
            const serverDeactTime = serverDeactIso ? new Date(serverDeactIso).getTime() : 0;

            // Strict mathematical verification:
            // serverDeactTime must be strictly newer than clientActTime
            const isConfirmedDeactivation =
              serverDeactTime > 0 &&
              (!clientActTime || serverDeactTime > clientActTime);

            if (isConfirmedDeactivation) {
              applyPanicState(false, undefined, true);
            }
            // If NOT confirmed, WE KEEP PANIC MODE LOCKED IN!
            // Never revert an emergency camouflage session due to stale responses, rate limits, or network drops!
          }
        }
      } catch {
        // network error / ignore - never revert on network blips
      } finally {
        isChecking = false;
      }
    };

    // 1. Check immediately on mount
    checkPanicStatus();

    // 2. Check on visibility change (when tab gains focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPanicStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Storage event for 0ms cross-tab synchronization on the same browser
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nursing_panic_mode_active') {
        applyPanicState(e.newValue === 'true', undefined, true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Ultra-fast BroadcastChannel for 0ms instant trigger across tabs
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('nursing_panic_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'PANIC_TOGGLED') {
            applyPanicState(Boolean(event.data.isEnabled), event.data.activatedAt, true);
          }
        };
      } catch {}
    }

    // 5. Fast 1-second pulse interval for all devices and external users
    const interval = setInterval(checkPanicStatus, 1000);

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

  // NEVER block admin-dashboard or admin APIs so the admin can always turn it off
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
