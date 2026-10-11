'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip admin dashboard visits
    if (pathname.startsWith('/admin-dashboard')) return;

    // Daily visit key based on current date (Egypt local time)
    let todayStr: string;
    try {
      todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      todayStr = new Date().toISOString().split('T')[0];
    }

    const dailySessionKey = `nursing_visitor_logged_${todayStr}`;
    const isDailyUnique = !sessionStorage.getItem(dailySessionKey);

    // Prevent duplicate firing on component re-render for the identical path
    if (lastPathRef.current === pathname && !isDailyUnique) return;
    lastPathRef.current = pathname;

    // Check if this student has visited the website before (persisted in localStorage)
    const hasVisitedBefore = !!localStorage.getItem('nursing_has_visited_before');
    const isNewStudent = !hasVisitedBefore;

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
        isNewStudent: isNewStudent && isDailyUnique,
        isDailyUnique,
      }),
    })
      .then(() => {
        sessionStorage.setItem(dailySessionKey, 'true');
        // Once recorded, mark student permanently in localStorage as having visited
        if (isNewStudent) {
          localStorage.setItem('nursing_has_visited_before', 'true');
          localStorage.setItem('nursing_first_visit_at', new Date().toISOString());
        }
      })
      .catch((err) => {
        console.warn('[VisitorTracker] Non-blocking tracking notice:', err);
      });
  }, [pathname]);

  return null;
}
