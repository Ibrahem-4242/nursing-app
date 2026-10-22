'use client';

import { useEffect, useRef } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';

interface StudentActivityTrackerProps {
  targetType: 'lecture' | 'video' | 'audio' | 'pdf' | 'ppt' | 'mindmap' | 'quiz' | 'flashcards' | 'subject' | 'general';
  targetId: string;
  targetTitle: string;
  subjectTitle?: string;
  resourceTitle?: string;
  details?: Record<string, any>;
  active?: boolean;
}

export default function StudentActivityTracker({
  targetType,
  targetId,
  targetTitle,
  subjectTitle,
  resourceTitle,
  details,
  active = true,
}: StudentActivityTrackerProps) {
  const { student, isLoggedIn } = useStudentAuth();

  // Stable session ID for this specific component instance and resource
  const sessionIdRef = useRef<string>(
    `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  const unsentSecondsRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const detailsRef = useRef<Record<string, any> | undefined>(details);
  detailsRef.current = details;

  const targetTypeRef = useRef(targetType);
  targetTypeRef.current = targetType;
  const targetIdRef = useRef(targetId);
  targetIdRef.current = targetId;
  const targetTitleRef = useRef(targetTitle);
  targetTitleRef.current = targetTitle;
  const subjectTitleRef = useRef(subjectTitle);
  subjectTitleRef.current = subjectTitle;
  const resourceTitleRef = useRef(resourceTitle);
  resourceTitleRef.current = resourceTitle;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Send activity beacon or fetch
  const flushActivity = (useBeacon: boolean = false) => {
    if (!isLoggedIn || !student) return;
    const increment = unsentSecondsRef.current;
    if (increment <= 0) return;

    // Reset unsent seconds immediately to prevent duplicate sends
    unsentSecondsRef.current = 0;

    const deviceId =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('nursing_device_id') || undefined
        : undefined;

    const payload = JSON.stringify({
      sessionActivityId: sessionIdRef.current,
      studentId: student.id,
      studentPhone: student.phone,
      targetType: targetTypeRef.current,
      targetId: targetIdRef.current,
      targetTitle: targetTitleRef.current,
      subjectTitle: subjectTitleRef.current,
      resourceTitle: resourceTitleRef.current,
      incrementSeconds: increment,
      details: detailsRef.current,
      deviceId,
    });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/student/activity', blob);
        return;
      } catch (e) {
        console.warn('[Activity Tracker] sendBeacon notice:', e);
      }
    }

    fetch('/api/student/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn || !student) return;

    // 1-second ticker to count active dwell seconds
    const tickInterval = setInterval(() => {
      if (isVisibleRef.current && activeRef.current) {
        unsentSecondsRef.current += 1;

        // When 15 seconds accumulate, send a heartbeat
        if (unsentSecondsRef.current >= 15) {
          flushActivity(false);
        }
      }
    }, 1000);

    // Visibility change handler: pause ticking if hidden, flush on hide
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        isVisibleRef.current = false;
        flushActivity(true);
      } else {
        isVisibleRef.current = true;
      }
    };

    // Pagehide / beforeunload handlers for reliable exit tracking
    const handlePageHide = () => {
      flushActivity(true);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('beforeunload', handlePageHide);
    }

    return () => {
      clearInterval(tickInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('beforeunload', handlePageHide);
      }
      flushActivity(true);
    };
  }, [isLoggedIn, student?.id]);

  return null;
}
