'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Flashcard, FlashcardReviewState } from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Shuffle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Award,
  Layers,
  XCircle,
  RotateCw,
  Clock,
  Target,
  ArrowRight,
  BookmarkCheck,
  Check,
  X,
  Flame,
  Brain,
  AlertTriangle,
  Lightbulb,
  Stethoscope,
  CheckCheck,
  Lock,
} from 'lucide-react';
import { getMedicalTier, MedicalTier } from '@/lib/medical-encouragement';
import CircularProgressRing from '@/components/CircularProgressRing';
import CelebratoryConfetti from '@/components/CelebratoryConfetti';

export function getFlashcardEncouragingMessage(percent: number): {
  title: string;
  subtitle: string;
  emoji: string;
  tier: MedicalTier;
} {
  const tier = getMedicalTier(percent);
  return {
    title: tier.headline,
    subtitle: tier.subtext,
    emoji: tier.emoji,
    tier,
  };
}

interface Flashcards3DProps {
  cards: Flashcard[];
  subjectTitle?: string;
  lectureTitle?: string;
  lectureId?: string;
}

interface StoredProgress {
  lastReviewedAt: string;
  totalCards: number;
  masteredIds: number[];
  needsPracticeIds: number[];
  lastScorePercent: number;
}

export default function Flashcards3D({
  cards,
  subjectTitle = 'مقرر التمريض',
  lectureTitle,
  lectureId,
}: Flashcards3DProps) {
  const { student } = useStudentAuth();

  // Storage key scoped to lectureId or subjectTitle + student phone (or guest)
  const storageKey = useMemo(() => {
    const scope = lectureId || subjectTitle.replace(/\s+/g, '_');
    const userScope = student?.phone || 'guest';
    return `nursing_flashcards_progress_${scope}_${userScope}`;
  }, [lectureId, subjectTitle, student?.phone]);

  // Deck states
  const [activeDeck, setActiveDeck] = useState<Flashcard[]>(cards);
  const [isFilterMode, setIsFilterMode] = useState(false); // true if reviewing only difficult cards
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Card evaluations: card.id -> FlashcardReviewState
  const [evaluations, setEvaluations] = useState<Record<number, FlashcardReviewState>>({});
  const [needsEvaluationWarning, setNeedsEvaluationWarning] = useState(false);
  const [shakeButtons, setShakeButtons] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<{
    cardId: number | string;
    rating: FlashcardReviewState;
    text: string;
  } | null>(null);
  const [isSlidingNext, setIsSlidingNext] = useState(false);

  // Summary screen tab: 'forgot' | 'knew'
  const [summaryTab, setSummaryTab] = useState<'forgot' | 'knew'>('forgot');

  // Stored historical progress from localStorage
  const [savedHistory, setSavedHistory] = useState<StoredProgress | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProgress;
        if (parsed && Array.isArray(parsed.needsPracticeIds)) {
          setSavedHistory(parsed);
        }
      }
    } catch {}
  }, [storageKey]);

  // Reset when cards prop changes
  useEffect(() => {
    setActiveDeck(cards);
    setIsFilterMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    setEvaluations({});
    setNeedsEvaluationWarning(false);
  }, [cards]);

  const currentCard = activeDeck[currentIndex];

  // Calculated counts
  const totalInSession = activeDeck.length;
  const cardsAnswered = Object.keys(evaluations).length;
  const knewCount = Object.values(evaluations).filter((v) => v === 'knew').length;
  const rememberedThenForgotCount = Object.values(evaluations).filter((v) => v === 'remembered_then_forgot').length;
  const misunderstoodCount = Object.values(evaluations).filter((v) => v === 'misunderstood').length;
  const strictlyForgotCount = Object.values(evaluations).filter((v) => v === 'forgot').length;
  const needsPracticeCount = totalInSession - knewCount;
  const remainingInSession = Math.max(0, totalInSession - (currentIndex + 1));
  const sessionProgressPercent = totalInSession > 0 ? Math.round(((currentIndex + 1) / totalInSession) * 100) : 0;

  // Persist progress to localStorage and cloud API when session completes
  const saveSessionProgress = useCallback(
    (evalsMap: Record<number, FlashcardReviewState>) => {
      if (typeof window === 'undefined') return;
      try {
        const mastered = activeDeck.filter((c) => evalsMap[c.id] === 'knew').map((c) => c.id);
        const needsPractice = activeDeck.filter((c) => evalsMap[c.id] && evalsMap[c.id] !== 'knew').map((c) => c.id);
        const score = totalInSession > 0 ? Math.round((mastered.length / totalInSession) * 100) : 0;

        const payload: StoredProgress = {
          lastReviewedAt: new Date().toISOString(),
          totalCards: totalInSession,
          masteredIds: mastered,
          needsPracticeIds: needsPractice,
          lastScorePercent: score,
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));
        setSavedHistory(payload);

        // Batch sync all evaluated cards to the cloud API for student & admin dashboards
        const reviewsBatch = activeDeck
          .filter((c) => evalsMap[c.id])
          .map((c) => ({
            cardId: c.id,
            cardFront: c.front,
            cardBack: c.back,
            lectureId: lectureId || 'general_lecture',
            lectureTitle: lectureTitle || '',
            subjectTitle: subjectTitle || '',
            state: evalsMap[c.id],
          }));

        if (reviewsBatch.length > 0) {
          fetch('/api/student/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: reviewsBatch }),
          }).catch(() => {});
        }
      } catch {}
    },
    [activeDeck, totalInSession, storageKey, lectureId, lectureTitle, subjectTitle]
  );

  // Flip card
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Evaluate card: any of the 4 states with haptic feedback & micro-animation
  const handleEvaluate = useCallback(
    (rating: FlashcardReviewState) => {
      if (!currentCard || feedbackState) return;

      // Haptic vibration feedback for mobile & supported browsers
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(45);
        } catch {}
      }

      setNeedsEvaluationWarning(false);
      const updatedEvals = { ...evaluations, [currentCard.id]: rating };
      setEvaluations(updatedEvals);

      let feedbackText = '✅ تم تسجيل الإجابة بنجاح';
      if (rating === 'knew') {
        feedbackText = '✨ متقنها وفاكرها كويس! أداء بطولي 🌟';
      } else if (rating === 'remembered_then_forgot') {
        feedbackText = '💡 تم حفظ الكارت للتذكير والتثبيت السريع';
      } else if (rating === 'misunderstood') {
        feedbackText = '🩺 تم التسجيل لإعادة تصحيح المفهوم الطبي';
      } else if (rating === 'forgot') {
        feedbackText = '🔄 تم التسجيل للتكرار والمراجعة المركزة';
      }

      setFeedbackState({
        cardId: currentCard.id,
        rating,
        text: feedbackText,
      });

      // Async single card sync to API immediately
      try {
        fetch('/api/student/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: currentCard.id,
            cardFront: currentCard.front,
            cardBack: currentCard.back,
            lectureId: lectureId || 'general_lecture',
            lectureTitle: lectureTitle || '',
            subjectTitle: subjectTitle || '',
            state: rating,
          }),
        }).catch(() => {});
      } catch {}

      // Micro-animation sequence:
      // 1. Show feedback badge & button glow for 260ms
      // 2. Smoothly transition card for 120ms
      // 3. Move to next card or complete session
      setTimeout(() => {
        setIsSlidingNext(true);

        setTimeout(() => {
          if (currentIndex >= activeDeck.length - 1) {
            setIsFlipped(false);
            saveSessionProgress(updatedEvals);
            const hasNeedsPractice = Object.values(updatedEvals).some((v) => v !== 'knew');
            setSummaryTab(hasNeedsPractice ? 'forgot' : 'knew');
            setIsSessionFinished(true);
            setFeedbackState(null);
            setIsSlidingNext(false);
          } else {
            setIsFlipped(false);
            setCurrentIndex((prev) => prev + 1);
            setFeedbackState(null);
            setIsSlidingNext(false);
          }
        }, 120);
      }, 260);
    },
    [currentCard, evaluations, currentIndex, activeDeck.length, saveSessionProgress, lectureId, lectureTitle, subjectTitle, feedbackState]
  );

  // Gentle prompt when user attempts to skip without evaluating
  const triggerEvaluationPrompt = useCallback(() => {
    setNeedsEvaluationWarning(true);
    setShakeButtons(true);

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {}
    }

    setTimeout(() => {
      setShakeButtons(false);
    }, 550);

    setTimeout(() => {
      setNeedsEvaluationWarning(false);
    }, 4500);
  }, []);

  // Next and Previous manual navigation (with strict evaluation requirement on Next)
  const handleNext = useCallback(() => {
    if (!currentCard) return;

    // Strict constraint: Do not allow advancing without evaluating current card
    if (!evaluations[currentCard.id]) {
      if (!isFlipped) {
        setIsFlipped(true);
      }
      triggerEvaluationPrompt();
      return;
    }

    setNeedsEvaluationWarning(false);
    if (currentIndex >= activeDeck.length - 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 150);
  }, [currentIndex, activeDeck.length, currentCard, evaluations, isFlipped, triggerEvaluationPrompt]);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setNeedsEvaluationWarning(false);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
    }, 150);
  }, [currentIndex]);

  // Touch & Swipe navigation handling (with navigation lock for swiping forward)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Horizontal swipe threshold: 45px
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      // In RTL: swiping Left (diffX < 0) advances to Next Card
      if (diffX < 0) {
        if (currentCard && !evaluations[currentCard.id]) {
          if (!isFlipped) setIsFlipped(true);
          triggerEvaluationPrompt();
        } else {
          handleNext();
        }
      } else {
        // Swiping Right goes back to Previous Card
        handlePrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Restart only non-mastered cards (forgot / remembered_then_forgot / misunderstood)
  const handleRestartForgottenOnly = () => {
    const forgottenCards = activeDeck.filter((c) => evaluations[c.id] && evaluations[c.id] !== 'knew');
    if (forgottenCards.length === 0) return;

    setActiveDeck(forgottenCards);
    setIsFilterMode(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    setEvaluations({});
    setNeedsEvaluationWarning(false);
    setFeedbackState(null);
    setIsSlidingNext(false);
  };

  // Launch review session directly from previously saved history
  const handleReviewSavedDifficultCards = () => {
    if (!savedHistory || savedHistory.needsPracticeIds.length === 0) return;
    const diffSet = new Set(savedHistory.needsPracticeIds);
    const targetCards = cards.filter((c) => diffSet.has(c.id));
    if (targetCards.length === 0) return;

    setActiveDeck(targetCards);
    setIsFilterMode(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    setEvaluations({});
    setNeedsEvaluationWarning(false);
    setFeedbackState(null);
    setIsSlidingNext(false);
  };

  // Full Reset to all cards
  const handleResetFull = () => {
    setActiveDeck(cards);
    setIsFilterMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    setEvaluations({});
    setNeedsEvaluationWarning(false);
    setFeedbackState(null);
    setIsSlidingNext(false);
  };

  // Shuffle deck
  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...activeDeck].sort(() => Math.random() - 0.5);
    setActiveDeck(shuffled);
    setCurrentIndex(0);
    setEvaluations({});
    setNeedsEvaluationWarning(false);
    setFeedbackState(null);
    setIsSlidingNext(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionFinished) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // In RTL: ArrowLeft attempts to advance to Next card
        if (currentCard && !evaluations[currentCard.id]) {
          if (!isFlipped) setIsFlipped(true);
          triggerEvaluationPrompt();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleEvaluate('knew');
      } else if (e.key === '2') {
        e.preventDefault();
        handleEvaluate('remembered_then_forgot');
      } else if (e.key === '3') {
        e.preventDefault();
        handleEvaluate('misunderstood');
      } else if (e.key === '4') {
        e.preventDefault();
        handleEvaluate('forgot');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionFinished, currentCard, evaluations, isFlipped, handleNext, handlePrev, handleEvaluate, triggerEvaluationPrompt]);

  // If no cards exist
  if (!cards || cards.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8" dir="rtl">
        <Layers className="w-10 h-10 text-teal-500 mx-auto mb-2 opacity-50" />
        <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد بطاقات فلاش كاردز مضافة لهذه المحاضرة بعد.</p>
        <p className="text-xs mt-1 text-slate-500">سيتم رفع حزمة البطاقات قريباً عبر الإدارة الأكاديمية.</p>
      </div>
    );
  }

  // Final retention score percentage
  const finalScore = totalInSession > 0 ? Math.round((knewCount / totalInSession) * 100) : 0;
  const encouragingMessage = getFlashcardEncouragingMessage(finalScore);
  const forgottenCardsList = activeDeck.filter((c) => evaluations[c.id] && evaluations[c.id] !== 'knew');
  const knownCardsList = activeDeck.filter((c) => evaluations[c.id] === 'knew');

  const getStateBadge = (state?: FlashcardReviewState) => {
    switch (state) {
      case 'knew':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">✅ كنت عارفها</span>;
      case 'remembered_then_forgot':
        return <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold">🤔 كنت فاكرها بس نسيتها</span>;
      case 'misunderstood':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-bold">⚠️ المعلومة وصلتني غلط</span>;
      case 'forgot':
      default:
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">❌ مش فاكرها خالص</span>;
    }
  };

  return (
    <div className="w-full my-8 space-y-6" dir="rtl">
      {/* 1. Historical Review Badge (Persistence Banner) */}
      {savedHistory && !isSessionFinished && savedHistory.needsPracticeIds.length > 0 && !isFilterMode && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-rose-50/60 to-amber-100/50 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-900/30 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/25">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                  تمت مراجعة هذا الدرس سابقاً 🎯
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                  لديك {savedHistory.needsPracticeIds.length} كروت تحتاج مراجعة وتثبيت
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                آخر جلسة كانت بنسبة إتقان {savedHistory.lastScorePercent}% • تاريخ:{' '}
                {new Date(savedHistory.lastReviewedAt).toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReviewSavedDifficultCards}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>مراجعة الكروت الصعبة الآن ({savedHistory.needsPracticeIds.length})</span>
          </button>
        </div>
      )}

      {/* FILTER MODE NOTIFICATION BADGE */}
      {isFilterMode && !isSessionFinished && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>أنت الآن في وضع: <strong>مراجعة وتثبيت الكروت الصعبة فقط ({totalInSession} كارت)</strong></span>
          </div>
          <button
            type="button"
            onClick={handleResetFull}
            className="text-teal-700 dark:text-teal-300 hover:underline text-[11px] font-bold"
          >
            الرجوع لكل الكروت ({cards.length})
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUMMARY & RESULTS SCREEN (عند انتهاء المجموعة) */}
      {/* ========================================================================= */}
      {isSessionFinished ? (
        <>
          {encouragingMessage.tier.confetti && <CelebratoryConfetti />}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Score Gauge & 10 Dynamic Encouraging Levels */}
            <div className="text-center space-y-4 max-w-xl mx-auto">
              {/* Smooth Circular Progress Indicator */}
              <div className="flex justify-center py-2">
                <CircularProgressRing
                  percentage={finalScore}
                  size={135}
                  strokeWidth={10}
                  gradientColors={encouragingMessage.tier.theme.strokeGradient}
                  glowColor={encouragingMessage.tier.theme.glowColor}
                  subLabel={encouragingMessage.tier.emoji}
                  uniqueId={`flashcard-${lectureId || 'general'}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-black shadow-sm ${encouragingMessage.tier.theme.pillBg} ${encouragingMessage.tier.theme.pillText}`}
                  >
                    {encouragingMessage.tier.badge}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {encouragingMessage.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl mx-auto">
                  {encouragingMessage.subtitle}
                </p>
                <div className="text-xs text-slate-400 pt-1">
                  أتقنت <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{knewCount}</strong> من أصل{' '}
                  <strong>{totalInSession}</strong> كارت • نسبة الحفظ الكلية: <strong className="font-mono">{finalScore}%</strong>
                </div>
              </div>

              {/* 4 Detailed Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {/* Knew */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  ✅ متقنة
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {knewCount}
                </span>
              </div>

              {/* Remembered then forgot */}
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-center">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 block mb-0.5">
                  🤔 كنت فاكرها
                </span>
                <span className="text-xl font-black text-sky-700 dark:text-sky-400">
                  {rememberedThenForgotCount}
                </span>
              </div>

              {/* Misunderstood */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  ⚠️ فهمتها غلط
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                  {misunderstoodCount}
                </span>
              </div>

              {/* Strictly Forgot */}
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                  ❌ نسيتها تماماً
                </span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-400">
                  {strictlyForgotCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Restart Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xl mx-auto">
            {forgottenCardsList.length > 0 ? (
              <button
                type="button"
                onClick={handleRestartForgottenOnly}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>إعادة الكروت المحتاجة تثبيت فقط ({forgottenCardsList.length}) 🔄</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleResetFull}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة مراجعة كل الكروت ({cards.length}) 🔁</span>
            </button>
          </div>

          {/* Categorized Cards Review Tabs */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSummaryTab('forgot')}
                className={`py-2 px-5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                  summaryTab === 'forgot'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>الكروت المحتاجة تثبيت ومراجعة ({forgottenCardsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryTab('knew')}
                className={`py-2 px-5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                  summaryTab === 'knew'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>الكروت المتقنة ({knownCardsList.length})</span>
              </button>
            </div>

            {/* List for Forgotten / Needs Practice Cards */}
            {summaryTab === 'forgot' && (
              <div className="space-y-3">
                {forgottenCardsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">ما شاء الله! أتقنت جميع الكروت بنجاح تام في هذه الجلسة 🎉</p>
                  </div>
                ) : (
                  forgottenCardsList.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2.5 text-right"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-rose-600" />
                          <span>السؤال أو المفهوم:</span>
                        </span>
                        <div>{getStateBadge(evaluations[card.id])}</div>
                      </div>

                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {cleanLatexMath(card.front)}
                      </p>

                      <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                          الإجابة والشرح:
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {cleanLatexMath(card.back)}
                        </p>
                      </div>

                      {card.clinicalPearl && (
                        <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                          <strong className="block text-amber-800 dark:text-amber-300 mb-0.5">💡 معلومة سريرية للامتحان:</strong>
                          {cleanLatexMath(card.clinicalPearl)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* List for Known Cards */}
            {summaryTab === 'knew' && (
              <div className="space-y-3">
                {knownCardsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <p className="font-bold">لم تسجل أي كارت كـ "كنت عارفها" بعد.</p>
                  </div>
                ) : (
                  knownCardsList.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5 text-right"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cleanLatexMath(card.front)}</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">متقنة ✅</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {cleanLatexMath(card.back)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        </>
      ) : (
        /* ========================================================================= */
        /* 3. ACTIVE FLASHCARD INTERACTIVE REVIEW AREA */
        /* ========================================================================= */
        <>
          {/* Header & Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    عارض كروت الاستذكار التفاعلي مع التقييم الذاتي 🎴
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    اقرأ السؤال، اضغط لقلب الكارت، ثم قيّم حفظك بـ "مش فاكره" أو "كنت عارفها"
                  </p>
                </div>
              </div>
            </div>

            {/* Counter, Shuffle & Reset Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleShuffle}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 active:scale-95"
                title="ترتيب عشوائي للبطاقات"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>خلط عشوائي</span>
              </button>

              <button
                type="button"
                onClick={handleResetFull}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 active:scale-95"
                title="إعادة البدء من أول بطاقة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة</span>
              </button>

              <div className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-black shadow-sm">
                بطاقة {currentIndex + 1} من {totalInSession}
              </div>
            </div>
          </div>

          {/* Progress Tracker Bar with Remaining Indicator */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Target className="w-4 h-4 text-teal-600" />
                <span>تقدم الجلسة: {sessionProgressPercent}%</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  باقي <strong>{remainingInSession}</strong> كروت في هذه المجموعة
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ✅ عارفها: {knewCount}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  ❌ تحتاج تثبيت: {needsPracticeCount}
                </span>
              </div>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(knewCount / (totalInSession || 1)) * 100}%` }}
                title={`عارفها: ${knewCount}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${(needsPracticeCount / (totalInSession || 1)) * 100}%` }}
                title={`تحتاج تثبيت: ${needsPracticeCount}`}
              />
            </div>
          </div>

          {/* 3D Flip Card Interactive Area */}
          <div
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`relative w-full h-[320px] sm:h-[360px] md:h-[390px] perspective-1000 cursor-pointer select-none group transition-all duration-300 ${
              isSlidingNext ? 'opacity-30 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            {/* Feedback Floating Banner Overlay (Haptic / Micro-animation) */}
            {feedbackState && (
              <div className="absolute inset-x-4 top-4 z-40 pointer-events-none flex justify-center animate-in fade-in zoom-in-95 duration-150">
                <div
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black shadow-2xl flex items-center gap-2 backdrop-blur-md border ${
                    feedbackState.rating === 'knew'
                      ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-600/35'
                      : feedbackState.rating === 'remembered_then_forgot'
                      ? 'bg-amber-500/95 text-white border-amber-300 shadow-amber-500/35'
                      : feedbackState.rating === 'misunderstood'
                      ? 'bg-indigo-600/95 text-white border-indigo-400 shadow-indigo-600/35'
                      : 'bg-rose-600/95 text-white border-rose-400 shadow-rose-600/35'
                  }`}
                >
                  <CheckCheck className="w-4 h-4 animate-bounce" />
                  <span>{feedbackState.text}</span>
                </div>
              </div>
            )}

            <div
              className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform rounded-3xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD (Question / Term) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-teal-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-2 border-teal-200/90 dark:border-teal-800/90 shadow-xl group-hover:border-teal-400/90 dark:group-hover:border-teal-500 group-hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-teal-100/90 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{currentCard?.category || 'سؤال ومفهوم'}</span>
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    وجه البطاقة (السؤال أو المصطلح) 🩺
                  </span>
                </div>

                <div className="my-auto text-center px-4 sm:px-6">
                  <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                    {cleanLatexMath(currentCard?.front || '')}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>اضغط في أي مكان لقلب الكارت ومعرفة الإجابة والتقييم</span>
                  </span>
                  <span className="font-mono font-bold">#{currentIndex + 1}</span>
                </div>
              </div>

              {/* BACK OF CARD (Answer / Explanation) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 text-white border-2 border-teal-500/70 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>الإجابة والشرح النموذجي</span>
                  </span>
                  <span className="text-xs text-teal-300/80 font-medium">
                    ظهر البطاقة (الحل الكامل) ✅
                  </span>
                </div>

                <div className="my-auto text-center px-4 sm:px-6 overflow-y-auto max-h-[220px]">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-100 leading-relaxed whitespace-pre-line">
                    {cleanLatexMath(currentCard?.back || '')}
                  </p>

                  {currentCard?.clinicalPearl && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-teal-900/60 border border-teal-500/40 text-xs text-teal-200 text-right leading-relaxed shadow-sm whitespace-pre-line">
                      <span className="font-bold text-teal-300 block mb-1">💡 معلومة ونقطة تركيز للامتحان:</span>
                      {cleanLatexMath(currentCard.clinicalPearl)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-teal-300/80 pt-3 border-t border-teal-800/60">
                  <span className="font-bold">اضغط للعودة إلى السؤال</span>
                  <span className="font-mono font-bold">#{currentIndex + 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Self-Evaluation Rating Buttons (أسفل الكارت - 4 خيارات تفاعلية واضحة بألوان متناسقة) */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-sm space-y-3.5 ${
              shakeButtons
                ? 'animate-gentle-shake ring-4 ring-amber-400/60 shadow-lg shadow-amber-500/25 border-amber-400 dark:border-amber-500'
                : ''
            } ${
              isFlipped
                ? 'bg-gradient-to-br from-teal-50/50 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 border-teal-300 dark:border-teal-700 shadow-md ring-2 ring-teal-500/25'
                : 'bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-1 px-1">
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Target className="w-4 h-4 text-teal-600" />
                <span>تقييم مستوى حفظك واستيعابك لهذا الكارت:</span>
              </span>
              <span
                className={`text-[11px] font-semibold transition ${
                  isFlipped ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-400'
                }`}
              >
                {isFlipped
                  ? '✨ الإجابة معروضة — حدد حالتك لنقل الكارت فورياً وبسلاسة ⚡'
                  : 'اقرأ الإجابة أولاً ثم حدد مستواك بدقة'}
              </span>
            </div>

            {/* Hint when card is not yet flipped */}
            {!isFlipped && (
              <div
                onClick={handleFlip}
                className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/80 dark:border-amber-700/60 text-center cursor-pointer hover:bg-amber-500/20 transition flex items-center justify-center gap-2 group shadow-xs select-none"
              >
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition shrink-0" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  اضغط على الكارت لقلبه ورؤية الإجابة أولاً لتفعيل التقييم والمتابعة 🔄
                </span>
              </div>
            )}

            {/* Warning when attempting to skip without selecting rating */}
            {needsEvaluationWarning && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-md animate-gentle-shake">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-pulse" />
                <span>⚠️ يرجى تحديد مدى تذكرك للكارت أولاً للمتابعة</span>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* الزر 1: متقنها وفاكرها كويس (أخضر زمردي مع أيقونة تفوق) */}
              <button
                type="button"
                disabled={!!feedbackState}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEvaluate('knew');
                }}
                className={`py-3.5 px-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-between gap-2 transition-all duration-200 shadow-sm text-right active:scale-95 ${
                  feedbackState?.rating === 'knew'
                    ? 'scale-105 bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/40 ring-4 ring-emerald-400/50'
                    : evaluations[currentCard?.id] === 'knew'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/25 ring-2 ring-emerald-400'
                    : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1.5 rounded-xl flex-shrink-0 transition ${
                      evaluations[currentCard?.id] === 'knew' || feedbackState?.rating === 'knew'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block leading-tight font-black">متقنها وفاكرها كويس</span>
                    <span className="text-[10px] font-normal opacity-85 block truncate">ممتاز وجاهزة للامتحان</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono font-bold flex-shrink-0">1</span>
              </button>

              {/* الزر 2: كنت فاكرها بس نسيتها (برتقالي / أصفر هادئ مع أيقونة تذكير) */}
              <button
                type="button"
                disabled={!!feedbackState}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEvaluate('remembered_then_forgot');
                }}
                className={`py-3.5 px-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-between gap-2 transition-all duration-200 shadow-sm text-right active:scale-95 ${
                  feedbackState?.rating === 'remembered_then_forgot'
                    ? 'scale-105 bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/40 ring-4 ring-amber-300/50'
                    : evaluations[currentCard?.id] === 'remembered_then_forgot'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/25 ring-2 ring-amber-400'
                    : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1.5 rounded-xl flex-shrink-0 transition ${
                      evaluations[currentCard?.id] === 'remembered_then_forgot' || feedbackState?.rating === 'remembered_then_forgot'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block leading-tight font-black">كنت فاكرها بس نسيتها</span>
                    <span className="text-[10px] font-normal opacity-85 block truncate">تردد ونسيان مؤقت</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono font-bold flex-shrink-0">2</span>
              </button>

              {/* الزر 3: المعلومة وصلتني غلط (أزرق / بنفسجي مع أيقونة تصحيح المفهوم الطبي) */}
              <button
                type="button"
                disabled={!!feedbackState}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEvaluate('misunderstood');
                }}
                className={`py-3.5 px-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-between gap-2 transition-all duration-200 shadow-sm text-right active:scale-95 ${
                  feedbackState?.rating === 'misunderstood'
                    ? 'scale-105 bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/40 ring-4 ring-indigo-400/50'
                    : evaluations[currentCard?.id] === 'misunderstood'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/25 ring-2 ring-indigo-400'
                    : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1.5 rounded-xl flex-shrink-0 transition ${
                      evaluations[currentCard?.id] === 'misunderstood' || feedbackState?.rating === 'misunderstood'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block leading-tight font-black">المعلومة وصلتني غلط</span>
                    <span className="text-[10px] font-normal opacity-85 block truncate">تصحيح المفهوم الطبي</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono font-bold flex-shrink-0">3</span>
              </button>

              {/* الزر 4: مش فاكرها خالص / صعبة (أحمر / وردي هادئ مع أيقونة إعادة المحاولة) */}
              <button
                type="button"
                disabled={!!feedbackState}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEvaluate('forgot');
                }}
                className={`py-3.5 px-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-between gap-2 transition-all duration-200 shadow-sm text-right active:scale-95 ${
                  feedbackState?.rating === 'forgot'
                    ? 'scale-105 bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/40 ring-4 ring-rose-400/50'
                    : evaluations[currentCard?.id] === 'forgot'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-rose-600/25 ring-2 ring-rose-400'
                    : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800/80 hover:border-rose-500'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1.5 rounded-xl flex-shrink-0 transition ${
                      evaluations[currentCard?.id] === 'forgot' || feedbackState?.rating === 'forgot'
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block leading-tight font-black">مش فاكرها خالص / صعبة</span>
                    <span className="text-[10px] font-normal opacity-85 block truncate">تحتاج إعادة وتكرار</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono font-bold flex-shrink-0">4</span>
              </button>
            </div>
          </div>

          {/* 5. Navigation Row (Previous, Flip, Next) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0 || !!feedbackState}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
              <span>البطاقة السابقة</span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              disabled={!!feedbackState}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xs sm:text-sm border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition active:scale-95 shadow-sm"
            >
              {isFlipped ? '🔄 عرض السؤال' : '✨ إظهار الإجابة'}
            </button>

            {/* Next Button with Navigation Lock logic */}
            {currentCard && !evaluations[currentCard.id] ? (
              <button
                type="button"
                onClick={() => {
                  if (!isFlipped) setIsFlipped(true);
                  triggerEvaluationPrompt();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:hover:bg-amber-900/50 cursor-pointer shadow-xs active:scale-95"
                title="يرجى تحديد مدى تذكرك للكارت أولاً للمتابعة"
              >
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>البطاقة التالية</span>
                <ChevronLeft className="w-4 h-4 opacity-40" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= activeDeck.length - 1 || !!feedbackState}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>البطاقة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            💡 اختصارات لوحة المفاتيح: (مسافة أو Enter) لقلب الكارت • [1] متقنها • [2] كنت فاكرها • [3] فهمتها غلط • [4] صعبة ومش فاكرها
          </div>
        </>
      )}
    </div>
  );
}
