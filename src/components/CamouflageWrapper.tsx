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

  // Instant hydration-safe local memory initialization
  const [currentPanicMode, setCurrentPanicMode] = useState<PanicModeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nursing_panic_mode_active');
        const hasCookie = document.cookie.includes('nursing_panic_mode=true');
        if (cached === 'true' || hasCookie) {
          return { isEnabled: true };
        }
      } catch {}
    }
    return panicMode;
  });

  const applyPanicState = useCallback((isEnabled: boolean, activatedAt?: string) => {
    setCurrentPanicMode((prev) => {
      if (prev.isEnabled !== isEnabled) {
        if (!isEnabled && prev.isEnabled) {
          // Mode was just deactivated by admin! Reload to restore fresh nursing platform
          try {
            localStorage.removeItem('nursing_panic_mode_active');
            document.cookie = 'nursing_panic_mode=; path=/; max-age=0; SameSite=Lax';
          } catch {}
          window.location.href = '/';
          return { isEnabled: false };
        }
        return { isEnabled, activatedAt };
      }
      return prev;
    });

    if (isEnabled) {
      try {
        localStorage.setItem('nursing_panic_mode_active', 'true');
        document.cookie = 'nursing_panic_mode=true; path=/; max-age=31536000; SameSite=Lax';
        document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
        // Stop any audio/video playback immediately
        document.querySelectorAll('audio, video').forEach((el) => {
          try {
            (el as HTMLMediaElement).pause();
            (el as HTMLMediaElement).currentTime = 0;
          } catch {}
        });
        // Seamlessly mask URL to /store if on any nursing route
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/admin-dashboard') &&
          !window.location.pathname.startsWith('/admin-login') &&
          !window.location.pathname.startsWith('/store') &&
          !window.location.pathname.startsWith('/product')
        ) {
          window.history.replaceState({ page: 'store' }, '', '/store');
        }
      } catch {}
    } else {
      try {
        localStorage.removeItem('nursing_panic_mode_active');
        document.cookie = 'nursing_panic_mode=; path=/; max-age=0; SameSite=Lax';
      } catch {}
    }
  }, []);

  // Sync prop changes safely
  useEffect(() => {
    if (panicMode?.isEnabled) {
      applyPanicState(true, panicMode.activatedAt);
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

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            const isEnabled = Boolean(data.isEnabled);
            applyPanicState(isEnabled, data.panicMode?.activatedAt);
          }
        }
      } catch {
        // network error / ignore
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
        applyPanicState(e.newValue === 'true');
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
            applyPanicState(Boolean(event.data.isEnabled));
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
