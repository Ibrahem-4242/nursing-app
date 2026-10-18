'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface StudentWatermarkProps {
  isFree?: boolean;
  lectureId?: string;
  yearId?: string;
  studentName?: string;
  studentPhone?: string;
}

export default function StudentWatermark({
  isFree = true,
  lectureId,
  yearId,
  studentName,
  studentPhone,
}: StudentWatermarkProps) {
  const { student, isLecturePurchased } = useStudentAuth();
  const [isTampered, setIsTampered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeName = studentName || student?.name;
  const activePhone = studentPhone || student?.phone;

  // Only show watermark on PAID lectures for authenticated students who unlocked it
  const isPaid = !isFree;
  const hasAccess = Boolean(student && (!lectureId || isLecturePurchased(lectureId, yearId)));
  const shouldRender = isPaid && Boolean(student && activeName && activePhone && hasAccess);

  const watermarkText = `${activeName} • ${activePhone} • منصة ملخصات تمريض`;

  useEffect(() => {
    if (!shouldRender) return;

    // 🛡️ ANTI-TAMPER SHIELD 1: MutationObserver
    // Watches for attempts to remove, hide, or manipulate the watermark DOM node
    const target = containerRef.current;
    if (!target) return;

    const observer = new MutationObserver(() => {
      if (!target) return;
      const computed = window.getComputedStyle(target);
      if (
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        parseFloat(computed.opacity || '1') < 0.05 ||
        !document.body.contains(target)
      ) {
        setIsTampered(true);
      }
    });

    observer.observe(target, {
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    if (target.parentElement) {
      observer.observe(target.parentElement, {
        childList: true,
      });
    }

    // 🛡️ ANTI-TAMPER SHIELD 2: Periodic Heartbeat
    // Periodic check every 1.5 seconds ensuring watermark element remains present in DOM
    const interval = setInterval(() => {
      const el = document.getElementById('nursing-anti-leak-watermark');
      if (!el || !document.body.contains(el)) {
        setIsTampered(true);
        return;
      }
      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity || '1') < 0.05
      ) {
        setIsTampered(true);
      }
    }, 1500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [shouldRender]);

  // If tamper is detected, shut down content view with emergency block screen
  if (isTampered) {
    return (
      <div
        className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white selection:bg-none"
        dir="rtl"
      >
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/50 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-rose-400">
            ⚠️ تنبيه أمني عاجل
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            تم رصد محاولة تلاعب أمني بحماية المحتوى أو إخفاء العلامة المائية. تم إيقاف عرض المحاضرة فوراً لحماية حقوق المنصة.
          </p>
          <div className="p-3 rounded-xl bg-slate-800/80 text-[11px] text-slate-400 border border-slate-700 font-mono">
            Error Code: SEC_TAMPER_DETECTED_{Date.now().toString(36)}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="nursing-anti-leak-watermark"
      className="fixed inset-0 pointer-events-none select-none z-30 overflow-hidden"
      aria-hidden="true"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <style jsx>{`
        @keyframes subtleDrift {
          0% {
            transform: translate(0px, 0px);
          }
          25% {
            transform: translate(8px, -6px);
          }
          50% {
            transform: translate(-6px, 8px);
          }
          75% {
            transform: translate(6px, 6px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
        .watermark-drift {
          animation: subtleDrift 15s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Tile Pattern with rotation -25deg */}
      <svg
        className="w-full h-full watermark-drift opacity-[0.14] dark:opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="student-watermark-pattern"
            width="420"
            height="220"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            {/* Primary line */}
            <text
              x="20"
              y="60"
              fill="currentColor"
              className="text-slate-900 dark:text-slate-100 font-bold"
              style={{
                fontSize: '13px',
                letterSpacing: '0.04em',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {watermarkText}
            </text>

            {/* Alternating offset line for dense, unbreakable protection */}
            <text
              x="210"
              y="170"
              fill="currentColor"
              className="text-slate-800 dark:text-slate-200 font-bold"
              style={{
                fontSize: '13px',
                letterSpacing: '0.04em',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {watermarkText}
            </text>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#student-watermark-pattern)" />
      </svg>
    </div>
  );
}
