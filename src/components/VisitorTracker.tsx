'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track once per browser session to prevent Telegram notification flooding
    const alreadyTracked = sessionStorage.getItem('visitor_session_logged');
    if (alreadyTracked) return;

    // Skip admin dashboard visits from general visitor counter if logged in as admin
    if (pathname.startsWith('/admin-dashboard')) return;

    let deviceType = 'كمبيوتر / لابتوب (Desktop)';
    const ua = navigator.userAgent;

    if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'تابلت (Tablet)';
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      if (/iPhone/i.test(ua)) deviceType = 'موبايل آيفون (iPhone)';
      else if (/Android/i.test(ua)) deviceType = 'موبايل أندرويد (Android)';
      else deviceType = 'هاتف ذكي (Mobile)';
    }

    fetch('/api/track-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType,
        page: pathname || '/',
        userAgent: ua,
      }),
    })
      .then(() => {
        sessionStorage.setItem('visitor_session_logged', 'true');
      })
      .catch((err) => {
        console.warn('[VisitorTracker] Non-blocking tracking notice:', err);
      });
  }, [pathname]);

  return null;
}
