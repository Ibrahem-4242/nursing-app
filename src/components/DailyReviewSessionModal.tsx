'use client';

import React, { useState, useEffect } from 'react';
import {
  DailyReviewQueueItem,
  FlashcardReviewState,
  StudentStudyStreak,
} from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';
import { getMedicalTier } from '@/lib/medical-encouragement';
import CircularProgressRing from '@/components/CircularProgressRing';
import CelebratoryConfetti from '@/components/CelebratoryConfetti';
import {
  X,
  RotateCw,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Stethoscope,
  BookOpen,
  ArrowRight,
  Brain,
} from 'lucide-react';

interface DailyReviewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: DailyReviewQueueItem[];
  currentStreak: number;
  onSessionCompleted?: (newStreak: StudentStudyStreak) => void;
}

export default function DailyReviewSessionModal({
  isOpen,
  onClose,
  cards,
  currentStreak,
  onSessionCompleted,
}: DailyReviewSessionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [ratedStates, setRatedStates] = useState<Record<string, FlashcardReviewState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState<FlashcardReviewState | null>(null);
  const [updatedStreak, setUpdatedStreak] = useState<StudentStudyStreak>({
    currentStreak: currentStreak || 0,
  });

  // Reset state when opened with new cards
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSessionFinished(false);
      setRatedStates({});
      setIsSubmitting(false);
      setButtonFeedback(null);
      setUpdatedStreak({ currentStreak: currentStreak || 0 });
    }
  }, [isOpen, cards, currentStreak]);

  if (!isOpen || !cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  // Statistics calculation for completion screen
  const totalCards = cards.length;
  const evaluationsList = Object.values(ratedStates);
  const knewCount = evaluationsList.filter((s) => s === 'knew').length;
  const rememberedThenForgotCount = evaluationsList.filter((s) => s === 'remembered_then_forgot').length;
  const misunderstoodCount = evaluationsList.filter((s) => s === 'misunderstood').length;
  const forgotCount = evaluationsList.filter((s) => s === 'forgot').length;
  const masteryPercentage = totalCards > 0 ? Math.round((knewCount / totalCards) * 100) : 100;
  const medicalTier = getMedicalTier(masteryPercentage);

  const handleRateCard = async (rating: FlashcardReviewState) => {
    if (!currentCard || isSubmitting) return;

    setButtonFeedback(rating);
    setIsSubmitting(true);

    const cardKey = `${currentCard.lectureId}_${currentCard.cardId}`;
    setRatedStates((prev) => ({ ...prev, [cardKey]: rating }));

    // Send rating to backend in background (SM-2 persistent update)
    try {
      fetch('/api/student/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: currentCard.cardId,
          cardFront: currentCard.front,
          cardBack: currentCard.back,
          clinicalPearl: currentCard.clinicalPearl,
          lectureId: currentCard.lectureId,
          lectureTitle: currentCard.lectureTitle,
          subjectId: currentCard.subjectId,
          subjectTitle: currentCard.subjectTitle,
          state: rating,
        }),
      }).catch((e) => console.warn('[DailySession] rating error:', e));
    } catch {
      // safe fallback
    }

    // Brief haptic/visual animation before transitioning
    setTimeout(async () => {
      setButtonFeedback(null);
      setIsSubmitting(false);

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Last card evaluated! Complete daily review session
        setIsSessionFinished(true);
        try {
          const res = await fetch('/api/student/daily-queue/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (data && data.streak) {
            setUpdatedStreak(data.streak);
            if (onSessionCompleted) {
              onSessionCompleted(data.streak);
            }
          }
        } catch (e) {
          console.warn('[DailySession] complete session error:', e);
        }
      }
    }, 280);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Confetti for top scores / finished session */}
      {isSessionFinished && masteryPercentage >= 70 && <CelebratoryConfetti />}

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  جرعة المراجعة اليومية الذكية 🧠
                </h3>
                {updatedStreak.currentStreak > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{updatedStreak.currentStreak} يوم</span>
                  </span>
                )}
              </div>
              {!isSessionFinished && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  خوارزمية التكرار المتباعد (Spaced Repetition) لترسيخ الذاكرة
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SESSION IN PROGRESS */}
        {/* ========================================================================= */}
        {!isSessionFinished ? (
          <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between overflow-y-auto space-y-6">
            {/* Progress Bar & Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    الكارت {currentIndex + 1} من أصل {cards.length}
                  </span>
                </span>
                <span className="font-mono text-slate-400">
                  {Math.round(((currentIndex + 1) / cards.length) * 100)}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>

              {/* Subject & Lecture Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                  📚 {currentCard.subjectTitle}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  🩺 {currentCard.lectureTitle}
                </span>
                {currentCard.repetitions > 0 ? (
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                    تكرار متتالي: {currentCard.repetitions} مرات 🔁
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    ✨ كارت جديد
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Flashcard 3D Card Area */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer group relative min-h-[260px] sm:min-h-[290px] rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 shadow-lg flex flex-col justify-between bg-gradient-to-br from-slate-50 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 select-none"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                  {isFlipped ? 'الإجابة والملخص السريري 💡' : 'السؤال والمفهوم الطبي ❓'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 group-hover:underline">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>اضغط لقلب الكارت</span>
                </span>
              </div>

              {/* Card Main Body */}
              <div className="py-4 my-auto text-center">
                {!isFlipped ? (
                  <h4 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                    {cleanLatexMath(currentCard.front)}
                  </h4>
                ) : (
                  <div className="space-y-3">
                    <p className="text-base sm:text-lg md:text-xl font-bold text-teal-900 dark:text-teal-100 leading-relaxed whitespace-pre-line">
                      {cleanLatexMath(currentCard.back)}
                    </p>
                    {currentCard.clinicalPearl && (
                      <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium text-right flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-amber-950 dark:text-amber-100 text-xs">لؤلؤة سريرية تمريضية:</strong>
                          <span>{currentCard.clinicalPearl}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-slate-400">
                {!isFlipped ? '👆 اضغط في أي مكان لرؤية الإجابة' : '👇 قيّم مدى تذكرك للكارت بالأسفل للمتابعة'}
              </div>
            </div>

            {/* 4 Clinical Rating Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block text-center">
                {isFlipped ? 'ما مدى تذكرك لهذه المعلومة الطبية الآن؟' : 'اقلب الكارت أولاً لتقييم الحفظ بدقة'}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. متقنها وفاكرها كويس */}
                <button
                  type="button"
                  disabled={!isFlipped || isSubmitting}
                  onClick={() => handleRateCard('knew')}
                  className={`p-3 rounded-2xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    !isFlipped
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      : buttonFeedback === 'knew'
                      ? 'bg-emerald-600 text-white border-emerald-600 scale-95 ring-4 ring-emerald-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 shadow-sm'
                  }`}
                >
                  <span className="text-base">✅</span>
                  <span>متقنها كويس</span>
                  <span className="text-[9px] font-normal opacity-80">(يتضاعف الفاصل)</span>
                </button>

                {/* 2. كنت فاكرها بس نسيتها */}
                <button
                  type="button"
                  disabled={!isFlipped || isSubmitting}
                  onClick={() => handleRateCard('remembered_then_forgot')}
                  className={`p-3 rounded-2xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    !isFlipped
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      : buttonFeedback === 'remembered_then_forgot'
                      ? 'bg-sky-600 text-white border-sky-600 scale-95 ring-4 ring-sky-300'
                      : 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 shadow-sm'
                  }`}
                >
                  <span className="text-base">🤔</span>
                  <span>كنت فاكرها بس نسيتها</span>
                  <span className="text-[9px] font-normal opacity-80">(بعد يومين)</span>
                </button>

                {/* 3. المعلومة وصلتلي غلط */}
                <button
                  type="button"
                  disabled={!isFlipped || isSubmitting}
                  onClick={() => handleRateCard('misunderstood')}
                  className={`p-3 rounded-2xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    !isFlipped
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      : buttonFeedback === 'misunderstood'
                      ? 'bg-amber-600 text-white border-amber-600 scale-95 ring-4 ring-amber-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 shadow-sm'
                  }`}
                >
                  <span className="text-base">⚠️</span>
                  <span>المعلومة وصلتني غلط</span>
                  <span className="text-[9px] font-normal opacity-80">(غداً لتصحيح المفهوم)</span>
                </button>

                {/* 4. مش فاكرها خالص / صعبة */}
                <button
                  type="button"
                  disabled={!isFlipped || isSubmitting}
                  onClick={() => handleRateCard('forgot')}
                  className={`p-3 rounded-2xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    !isFlipped
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      : buttonFeedback === 'forgot'
                      ? 'bg-rose-600 text-white border-rose-600 scale-95 ring-4 ring-rose-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 shadow-sm'
                  }`}
                >
                  <span className="text-base">❌</span>
                  <span>مش فاكرها خالص</span>
                  <span className="text-[9px] font-normal opacity-80">(تصفير وإعادة غداً)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* SESSION COMPLETED SCREEN */
          /* ========================================================================= */
          <div className="p-6 sm:p-10 text-center space-y-6 overflow-y-auto">
            {/* Circular Progress Gauge */}
            <div className="flex justify-center pt-2">
              <CircularProgressRing
                percentage={masteryPercentage}
                size={140}
                strokeWidth={10}
                gradientColors={medicalTier.theme.strokeGradient}
                glowColor={medicalTier.theme.glowColor}
                subLabel={medicalTier.headline}
                uniqueId="daily-session-done"
              />
            </div>

            {/* Streak & Celebration Banner */}
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {medicalTier.badge}
                </span>
                {updatedStreak.currentStreak > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/80 text-amber-900 dark:text-amber-200 text-xs font-black shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
                    <span>{updatedStreak.currentStreak} أيام متتالية 🔥</span>
                  </div>
                )}
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {medicalTier.headline}
              </h4>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {medicalTier.subtext}
              </p>
            </div>

            {/* 4 Results Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  ✅ متقنة اليوم
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {knewCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 block mb-0.5">
                  🤔 كنت فاكرها
                </span>
                <span className="text-xl font-black text-sky-700 dark:text-sky-400">
                  {rememberedThenForgotCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  ⚠️ فهم خاطئ
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                  {misunderstoodCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                  ❌ بحاجة إعادة
                </span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-400">
                  {forgotCount}
                </span>
              </div>
            </div>

            {/* Done Action Button */}
            <div className="pt-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-teal-600/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>تم، العودة للمنصة 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
