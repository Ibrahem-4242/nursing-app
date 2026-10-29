'use client';

import React, { useState, useEffect } from 'react';
import { DailyReviewQueueResponse, DailyReviewQueueItem, StudentStudyStreak } from '@/lib/types';
import DailyReviewSessionModal from '@/components/DailyReviewSessionModal';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  Brain,
  Flame,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
} from 'lucide-react';

export default function DailyReviewQueueCard({
  yearId,
  className = '',
}: {
  yearId?: string;
  className?: string;
}) {
  const { student, isLoggedIn, openAuthModal } = useStudentAuth();
  const [queueData, setQueueData] = useState<DailyReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if previously dismissed in this browser session
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('daily_queue_dismissed') === 'true') {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  // Determine effective academic year
  const effectiveYearId = yearId || student?.yearId || '1';

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const url = `/api/student/daily-queue?yearId=${encodeURIComponent(effectiveYearId)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data: DailyReviewQueueResponse = await res.json();
        setQueueData(data);
      }
    } catch (e) {
      console.warn('[DailyQueueCard] fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [student?.id, student?.yearId, effectiveYearId]);

  const streak = queueData?.streak || student?.studyStreak || { currentStreak: 0 };
  const dueCards = queueData?.dueCards || [];
  const totalDue = queueData?.totalDue ?? dueCards.length;
  const subjectsCount = queueData?.subjectsCount || 1;
  const isCompletedToday = queueData?.isCompletedToday || (totalDue === 0 && streak.currentStreak > 0);

  const handleStartReview = () => {
    if (dueCards.length > 0) {
      setIsModalOpen(true);
    }
  };

  // When student says "مش فاضي دلوقتي", wipe it completely from in front of them
  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('daily_queue_dismissed', 'true');
      }
    } catch {}
  };

  const handleSessionCompleted = (newStreak: StudentStudyStreak) => {
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

  // If dismissed by user, wiped from page completely
  if (isDismissed) {
    return null;
  }

  if (loading) {
    return (
      <div
        className={`w-full max-w-4xl mx-auto p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-teal-500/5 border border-slate-200/80 dark:border-slate-800 animate-pulse my-6 ${className}`}
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if ((queueData as any)?.disabled) {
    return null;
  }

  // If there are no due cards and not completed today, hide silently
  if (!isCompletedToday && dueCards.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`w-full max-w-4xl mx-auto relative overflow-hidden rounded-3xl border transition-all duration-300 my-6 sm:my-8 shadow-2xl ${
          isCompletedToday
            ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 border-emerald-300/80 dark:border-emerald-800/60 shadow-emerald-600/10'
            : 'bg-gradient-to-br from-teal-950/50 via-slate-900/95 to-slate-950 border-teal-500/40 dark:border-teal-600/40 shadow-teal-950/30 text-white'
        } ${className}`}
        dir="rtl"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Right info section */}
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                isCompletedToday
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-100 dark:ring-emerald-950'
                  : 'bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 text-white shadow-teal-500/25 ring-4 ring-teal-900/50'
              }`}
            >
              {isCompletedToday ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <Brain className="w-8 h-8 text-white" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>جرعة المراجعة اليومية 🧠</span>
                </span>

                {/* Academic Year Badge */}
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-[11px] font-bold border border-slate-700">
                  {effectiveYearId === '1'
                    ? 'السنة الأولى 🩺'
                    : effectiveYearId === '2'
                    ? 'السنة الثانية 🩺'
                    : effectiveYearId === '3'
                    ? 'السنة الثالثة 🩺'
                    : `السنة ${effectiveYearId} 🩺`}
                </span>

                {/* Study Streak Badge */}
                {streak.currentStreak > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>راجع لـ {streak.currentStreak} أيام متتالية! 🔥</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs font-bold border border-slate-700">
                    🔥 ابدأ سلسلة استمرارية مذاكرتك اليوم
                  </span>
                )}
              </div>

              {isCompletedToday ? (
                <>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight pt-1">
                    أبطال التمريض لا يكلّون! أنهيت مراجعة اليوم كاملة بنجاح 🩺✨
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    استرح الآن وموعدنا غداً لتنشيط الذاكرة قصيرة وطويلة المدى وفق خوارزمية SM-2.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-black leading-tight pt-1 text-white">
                    عندك{' '}
                    <strong className="text-teal-400 font-mono text-xl sm:text-2xl">
                      {totalDue}
                    </strong>{' '}
                    كارت مستنيينك تراجعهم النهاردة من{' '}
                    <strong className="text-white font-bold">
                      {subjectsCount}
                    </strong>{' '}
                    مواد دراسية 📚
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    5 دقائق بس كافية تثبت أصعب المصطلحات الطبية واللآلئ السريرية في الذاكرة الدائمة! تحب تراجعهم سوا دلوقتي؟ 😉🩺
                  </p>
                </>
              )}

              {/* Subject Breakdown Pills if cards available */}
              {!isCompletedToday && queueData?.subjectsBreakdown && queueData.subjectsBreakdown.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {queueData.subjectsBreakdown.map((sb) => (
                    <span
                      key={sb.subjectId}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-[11px] font-bold text-slate-300 border border-slate-700"
                    >
                      {sb.subjectTitle} ({sb.count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Left action button section: 2 Choices */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-stretch gap-2.5 flex-shrink-0">
            {!isCompletedToday ? (
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                {/* الخيار الأول: اشطا، يلا بينا */}
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
                >
                  <Play className="w-4 h-4 text-white fill-white transition group-hover:scale-110" />
                  <span>اشطا، يلا بينا 🚀</span>
                </button>

                {/* الخيار الثاني: مش فاضي دلوقتي -> مسح كامل فوري */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-3 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                  title="إغلاق ومسح الكارت فوراً"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>مش فاضي دلوقتي ⏳</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartReview}
                className="py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-black text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>مراجعة إضافية اختيارية 🔁</span>
              </button>
            )}

            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-[11px] text-teal-400 hover:underline text-center font-bold pt-1"
              >
                سجّل دخولك لحفظ الاستمرارية سحابياً 🔐
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Session Modal */}
      <DailyReviewSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cards={dueCards}
        currentStreak={streak.currentStreak}
        onSessionCompleted={handleSessionCompleted}
      />
    </>
  );
}
