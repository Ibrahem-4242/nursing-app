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

const POPUP_TRACKER_KEY = 'nursing_daily_review_popup_v2';
const POPUP_SESSION_DISMISS_KEY = 'nursing_daily_review_popup_dismissed_session_v2';

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
      {/* 🧠 Lightbox Modal Pop-up centered in screen (نفس فكرة البوب اب بالظبط) */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
          onClick={(e) => {
            // Dismiss if clicked on outer dimmed backdrop
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          {/* Centered Modal Card Box */}
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#111827] via-[#0B0F19] to-[#070A12] border border-teal-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white text-center overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Subtle radial ambient light */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none -mt-24" />

            {/* 'X' Close Button on Top Corner (علامة غلط من فوق) */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition border border-white/10 active:scale-95 z-20 shadow-sm"
              title="إغلاق ومسح الكارت"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>جرعة المراجعة اليومية 🧠</span>
              </span>

              {streak.currentStreak > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-500/40 flex items-center gap-1 shadow-xs">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>{streak.currentStreak} أيام! 🔥</span>
                </span>
              )}
            </div>

            {/* Big Catchy Title */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight mb-1">
              جاهز لتنشيط ذاكرتك الطبية؟ 🩺
            </h2>

            {/* Academic Year Tag */}
            <div className="text-xs font-bold text-slate-400 mb-4">
              {effectiveYearId === '1'
                ? 'مقررات السنة الأولى 📚'
                : effectiveYearId === '2'
                ? 'مقررات السنة الثانية 📚'
                : effectiveYearId === '3'
                ? 'مقررات السنة الثالثة 📚'
                : `مقررات السنة ${effectiveYearId} 📚`}
            </div>

            {/* Visual 3-Column Slot/Counter Box (نفس التقسيمة في الصورة المعروضة) */}
            <div className="my-4 py-3.5 px-2 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-around text-center shadow-inner">
              {/* Box 1: Due Cards */}
              <div className="flex-1 px-1">
                <div className="text-3xl sm:text-4xl font-black text-teal-400 font-mono tracking-tight">
                  {totalDue}
                </div>
                <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                  كروت مستحقة 🎴
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-white/10" />

              {/* Box 2: Subjects */}
              <div className="flex-1 px-1">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  {subjectsCount}
                </div>
                <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                  {subjectsCount === 1 ? 'مادة دراسية' : 'مواد دراسية'} 📚
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-white/10" />

              {/* Box 3: Time */}
              <div className="flex-1 px-1">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  ~5
                </div>
                <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                  دقائق بس ⏱️
                </div>
              </div>
            </div>

            {/* Egyptian Prompt Text */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6 px-1">
              5 دقائق بس كافية تثبت أصعب المصطلحات الطبية واللآلئ السريرية في الذاكرة الدائمة! تحب تراجعهم سوا دلوقتي؟ 😉🩺
            </p>

            {/* Action Buttons: Primary prominent button + dismiss button */}
            <div className="space-y-2">
              {/* خيار 1: اشطا يلا بينا (Prominent Action Button) */}
              <button
                type="button"
                onClick={handleAcceptReview}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <Play className="w-4 h-4 text-white fill-white transition group-hover:scale-110" />
                <span>اشطا، يلا بينا 🚀</span>
              </button>

              {/* خيار 2: مش فاضي دلوقتي (مسح فوري من الشاشة) */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 hover:bg-white/5 active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>مش فاضي دلوقتي ⏳</span>
              </button>
            </div>

            {/* Guest note if not logged in */}
            {!isLoggedIn && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    openAuthModal('login');
                  }}
                  className="text-[11px] text-teal-400/80 hover:text-teal-300 hover:underline font-bold"
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
