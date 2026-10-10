'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track once per browser session to prevent unnecessary duplicate requests
    const alreadyTrackedInSession = sessionStorage.getItem('visitor_session_logged');
    if (alreadyTrackedInSession) return;

    // Skip admin dashboard visits
    if (pathname.startsWith('/admin-dashboard')) return;

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
        isNewStudent,
      }),
    })
      .then(() => {
        sessionStorage.setItem('visitor_session_logged', 'true');
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
