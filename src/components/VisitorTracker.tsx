'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip tracking inside admin dashboard
    if (pathname?.startsWith('/admin-dashboard')) return;

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

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const ref = typeof document !== 'undefined' ? document.referrer : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const href = typeof window !== 'undefined' ? window.location.href : '';

    // Extract potential visitor name or campaign source from URL parameters
    let queryName = '';
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        queryName =
          params.get('name') ||
          params.get('visitor') ||
          params.get('user') ||
          params.get('utm_source') ||
          params.get('source') ||
          '';
      }
    } catch {
      queryName = '';
    }

    // Google presence detection on client
    const isGoogle =
      /google/i.test(ua) ||
      /google/i.test(ref) ||
      /google/i.test(search) ||
      /google/i.test(href) ||
      /google/i.test(queryName);

    // Prevent duplicate firing on component re-render for the identical path in same session (unless Google)
    if (lastPathRef.current === pathname && !isGoogle) return;
    lastPathRef.current = pathname;

    const dailySessionKey = `nursing_visitor_logged_${todayStr}`;
    const isDailyUnique = typeof sessionStorage !== 'undefined' ? !sessionStorage.getItem(dailySessionKey) : true;

    // Check if this student has visited the website before (persisted in localStorage)
    const hasVisitedBefore =
      typeof localStorage !== 'undefined' ? !!localStorage.getItem('nursing_has_visited_before') : false;
    const isNewStudent = !hasVisitedBefore;

    let deviceType = 'كمبيوتر / لابتوب (Desktop)';
    if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'تابلت (Tablet)';
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      if (/iPhone/i.test(ua)) deviceType = 'موبايل آيفون (iPhone)';
      else if (/Android/i.test(ua)) deviceType = 'موبايل أندرويد (Android)';
      else deviceType = 'هاتف ذكي (Mobile)';
    }

    // Immediately mark localStorage to avoid multiple rapid navigations triggering new student
    if (isNewStudent && typeof localStorage !== 'undefined') {
      localStorage.setItem('nursing_has_visited_before', 'true');
      localStorage.setItem('nursing_first_visit_at', new Date().toISOString());
    }

    fetch('/api/track-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType,
        page: pathname || '/',
        userAgent: ua,
        referrer: ref,
        search,
        visitorName: queryName,
        isNewStudent: isNewStudent && isDailyUnique,
        isDailyUnique,
        clientDetectedGoogle: isGoogle,
      }),
    })
      .then(() => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(dailySessionKey, 'true');
        }
      })
      .catch((err) => {
        console.warn('[VisitorTracker] Non-blocking tracking notice:', err);
      });
  }, [pathname]);

  return null;
}
