'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DailyReviewQueueResponse, DailyReviewQueueItem, StudentStudyStreak } from '@/lib/types';
import DailyReviewSessionModal from '@/components/DailyReviewSessionModal';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  Brain,
  Flame,
  Sparkles,
  Play,
  Clock,
  X,
  BookOpen,
} from 'lucide-react';

const POPUP_TRACKER_KEY = 'nursing_daily_review_popup_v1';
const POPUP_SESSION_DISMISS_KEY = 'nursing_daily_review_popup_dismissed_session';

/**
 * Returns today's date string in Cairo timezone (YYYY-MM-DD)
 */
function getCairoDateStringClient(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Reads the daily popup impression counter for today
 */
function getPopupTracker(): { date: string; count: number } {
  try {
    if (typeof window === 'undefined') return { date: '', count: 0 };
    const raw = localStorage.getItem(POPUP_TRACKER_KEY);
    if (!raw) return { date: '', count: 0 };
    const parsed = JSON.parse(raw);
    const today = getCairoDateStringClient();
    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }
    return { date: today, count: Number(parsed.count) || 0 };
  } catch {
    return { date: '', count: 0 };
  }
}

/**
 * Increments the daily impression counter (up to 2 times a day)
 */
function recordPopupAppearance(): number {
  try {
    if (typeof window === 'undefined') return 1;
    const today = getCairoDateStringClient();
    const current = getPopupTracker();
    const newCount = (current.date === today ? current.count : 0) + 1;
    localStorage.setItem(
      POPUP_TRACKER_KEY,
      JSON.stringify({ date: today, count: newCount, updatedAt: Date.now() })
    );
    return newCount;
  } catch {
    return 1;
  }
}

export default function DailyReviewQueueCard({
  yearId,
}: {
  yearId?: string;
  className?: string;
}) {
  const { student, isLoggedIn, openAuthModal } = useStudentAuth();
  const [queueData, setQueueData] = useState<DailyReviewQueueResponse | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const hasRecordedAppearanceRef = useRef(false);

  // Determine effective academic year
  const effectiveYearId = yearId || student?.yearId || '1';

  const fetchQueue = async () => {
    try {
      const url = `/api/student/daily-queue?yearId=${encodeURIComponent(effectiveYearId)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data: DailyReviewQueueResponse = await res.json();
        setQueueData(data);

        // Check if disabled by admin
        if ((data as any)?.disabled) {
          setIsPopupOpen(false);
          return;
        }

        const dueList = data?.dueCards || [];
        const isDone = data?.isCompletedToday || false;

        // If no cards due or already completed today, do not pop up
        if (dueList.length === 0 || isDone) {
          setIsPopupOpen(false);
          return;
        }

        // Check session dismissal (if student dismissed in this current browser tab session)
        try {
          if (typeof window !== 'undefined' && sessionStorage.getItem(POPUP_SESSION_DISMISS_KEY) === 'true') {
            setIsPopupOpen(false);
            return;
          }
        } catch {}

        // Check frequency cap: Strictly maximum 2 times a day
        const tracker = getPopupTracker();
        if (tracker.count >= 2) {
          // Reached daily limit of 2 impressions -> do not pop up
          setIsPopupOpen(false);
          return;
        }

        // Trigger Pop-up in the middle of the screen!
        setIsPopupOpen(true);

        // Record this appearance (only once per mount)
        if (!hasRecordedAppearanceRef.current) {
          hasRecordedAppearanceRef.current = true;
          recordPopupAppearance();
        }
      }
    } catch (e) {
      console.warn('[DailyQueueCard] fetch error:', e);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [student?.id, student?.yearId, effectiveYearId]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isPopupOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopupOpen]);

  // When student says "مش فاضي دلوقتي ⏳" or clicks 'X', wipe it completely from view
  const handleDismiss = () => {
    setIsPopupOpen(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(POPUP_SESSION_DISMISS_KEY, 'true');
      }
    } catch {}
  };

  // When student clicks "اشطا، يلا بينا 🚀"
  const handleAcceptReview = () => {
    setIsPopupOpen(false);
    setIsSessionModalOpen(true);
  };

  const handleSessionCompleted = (newStreak: StudentStudyStreak) => {
    setIsSessionModalOpen(false);
    setQueueData((prev) =>
      prev
        ? {
            ...prev,
            dueCards: [],
            totalDue: 0,
            isCompletedToday: true,
            streak: newStreak,
          }
        : null
    );
  };

  const streak = queueData?.streak || student?.studyStreak || { currentStreak: 0 };
  const dueCards = queueData?.dueCards || [];
  const totalDue = queueData?.totalDue ?? dueCards.length;
  const subjectsCount = queueData?.subjectsCount || 1;

  return (
    <>
      {/* 🧠 Centered Pop-up Modal (بوب اب في نص الشاشة) */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          dir="rtl"
          onClick={(e) => {
            // Dismiss if clicked on outer backdrop
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          {/* Modal Container */}
          <div className="relative w-full max-w-lg sm:max-w-xl bg-gradient-to-br from-teal-950/95 via-slate-900/98 to-slate-950 border-2 border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Subtle decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

            {/* 'X' Close Button on Top (علامة غلط من فوق) */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition border border-white/15 shadow-sm active:scale-95 z-20"
              title="إغلاق ومسح الكارت"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pr-1">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>جرعة المراجعة اليومية 🧠</span>
              </span>

              {/* Academic Year Badge */}
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 text-[11px] font-bold border border-slate-700">
                {effectiveYearId === '1'
                  ? 'السنة الأولى 🩺'
                  : effectiveYearId === '2'
                  ? 'السنة الثانية 🩺'
                  : effectiveYearId === '3'
                  ? 'السنة الثالثة 🩺'
                  : `السنة ${effectiveYearId} 🩺`}
              </span>

              {/* Study Streak Badge */}
              {streak.currentStreak > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>مستمر لـ {streak.currentStreak} أيام! 🔥</span>
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25 ring-4 ring-teal-900/50">
                <Brain className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-1.5 flex-1">
                <h3 className="text-lg sm:text-xl font-black leading-tight text-white">
                  عندك{' '}
                  <strong className="text-teal-400 font-mono text-2xl sm:text-3xl">
                    {totalDue}
                  </strong>{' '}
                  كارت مستنيينك تراجعهم النهاردة من{' '}
                  <strong className="text-white font-bold">
                    {subjectsCount}
                  </strong>{' '}
                  {subjectsCount === 1 ? 'مادة دراسية' : 'مواد دراسية'} 📚
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  5 دقائق بس كافية تثبت أصعب المصطلحات الطبية واللآلئ السريرية في الذاكرة الدائمة! تحب تراجعهم سوا دلوقتي؟ 😉🩺
                </p>
              </div>
            </div>

            {/* Subject Breakdown Pills if available */}
            {queueData?.subjectsBreakdown && queueData.subjectsBreakdown.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-6 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pl-1">
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>المواد:</span>
                </div>
                {queueData.subjectsBreakdown.map((sb) => (
                  <span
                    key={sb.subjectId}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-200 border border-slate-700"
                  >
                    {sb.subjectTitle} ({sb.count})
                  </span>
                ))}
              </div>
            )}

            {/* Two Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {/* خيار 2: مش فاضي دلوقتي -> مسح فوري من قدام الطالب */}
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>مش فاضي دلوقتي ⏳</span>
              </button>

              {/* خيار 1: اشطا، يلا بينا */}
              <button
                type="button"
                onClick={handleAcceptReview}
                className="flex-[1.3] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <Play className="w-4 h-4 text-white fill-white transition group-hover:scale-110" />
                <span>اشطا، يلا بينا 🚀</span>
              </button>
            </div>

            {/* Guest note if not logged in */}
            {!isLoggedIn && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    openAuthModal('login');
                  }}
                  className="text-[11px] text-teal-400 hover:underline font-bold"
                >
                  سجّل حسابك لحفظ تكرارات SM-2 واستمراريتك سحابياً 🔐
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Session Modal */}
      <DailyReviewSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        cards={dueCards}
        currentStreak={streak.currentStreak}
        onSessionCompleted={handleSessionCompleted}
      />
    </>
  );
}
