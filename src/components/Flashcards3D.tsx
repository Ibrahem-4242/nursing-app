'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '@/lib/types';
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
} from 'lucide-react';

interface Flashcards3DProps {
  cards: Flashcard[];
  subjectTitle?: string;
  lectureTitle?: string;
}

export default function Flashcards3D({
  cards,
  subjectTitle = 'مقرر التمريض',
  lectureTitle,
}: Flashcards3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(cards);
  const [studiedCount, setStudiedCount] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudiedCount(new Set([0]));
  }, [cards]);

  const currentCard = shuffledCards[currentIndex];

  const handleNext = useCallback(() => {
    if (!shuffledCards || shuffledCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % shuffledCards.length;
        setStudiedCount((s) => {
          const nextSet = new Set(s);
          nextSet.add(next);
          return nextSet;
        });
        return next;
      });
    }, 150);
  }, [shuffledCards]);

  const handlePrev = useCallback(() => {
    if (!shuffledCards || shuffledCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev - 1 + shuffledCards.length) % shuffledCards.length;
        setStudiedCount((s) => {
          const nextSet = new Set(s);
          nextSet.add(next);
          return nextSet;
        });
        return next;
      });
    }, 150);
  }, [shuffledCards]);

  const handleShuffle = () => {
    setIsFlipped(false);
    const newShuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffled);
    setCurrentIndex(0);
    setStudiedCount(new Set([0]));
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setStudiedCount(new Set([0]));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!shuffledCards || shuffledCards.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <Layers className="w-10 h-10 text-teal-500 mx-auto mb-2 opacity-50" />
        <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد بطاقات فلاش كاردز مضافة لهذه المحاضرة بعد.</p>
        <p className="text-xs mt-1 text-slate-500">سيتم رفع حزمة البطاقات قريباً عبر الإدارة الأكاديمية.</p>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / shuffledCards.length) * 100);
  const masteryPercent = Math.round((studiedCount.size / shuffledCards.length) * 100);

  return (
    <div className="w-full my-8 space-y-6" dir="rtl">
      {/* 1. Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                عارض كروت الاستذكار التفاعلي (Interactive Flashcards)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اضغط على الكارت لقلبه واختبار استيعابك للمفاهيم الطبية والتمريضية
              </p>
            </div>
          </div>
        </div>

        {/* Counter, Shuffle & Reset Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 active:scale-95"
            title="ترتيب عشوائي للبطاقات"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>خلط عشوائي</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 active:scale-95"
            title="إعادة البدء من أول بطاقة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة</span>
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-black shadow-sm">
            بطاقة {currentIndex + 1} من {shuffledCards.length}
          </div>
        </div>
      </div>

      {/* 2. Progress Tracker Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
            <Award className="w-4 h-4" />
            <span>مستوى إنجاز الجلسة: {progressPercent}%</span>
          </div>
          <span>تم الاطلاع على {studiedCount.size} من {shuffledCards.length} كارت ({masteryPercent}%)</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-teal-500 via-emerald-500 to-teal-600 transition-all duration-300 rounded-full shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. 3D Flip Card Interactive Area */}
      <div
        onClick={handleFlip}
        className="w-full h-[320px] sm:h-[360px] md:h-[380px] perspective-1000 cursor-pointer select-none group"
      >
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
                <span>{currentCard.category || 'سؤال ومفهوم'}</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                وجه البطاقة (السؤال أو المصطلح) 🩺
              </span>
            </div>

            <div className="my-auto text-center px-4 sm:px-6">
              <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>اضغط في أي مكان لقلب الكارت ومعرفة الإجابة</span>
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
              <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-100 leading-relaxed">
                {currentCard.back}
              </p>

              {currentCard.clinicalPearl && (
                <div className="mt-4 p-3.5 rounded-2xl bg-teal-900/60 border border-teal-500/40 text-xs text-teal-200 text-right leading-relaxed shadow-sm">
                  <span className="font-bold text-teal-300 block mb-1">💡 معلومة ونقطة تركيز للامتحان:</span>
                  {currentCard.clinicalPearl}
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

      {/* 4. Smooth Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
          <span>البطاقة السابقة</span>
        </button>

        <button
          onClick={handleFlip}
          className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xs sm:text-sm border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition active:scale-95 shadow-sm"
        >
          {isFlipped ? '🔄 عرض السؤال' : '✨ إظهار الإجابة'}
        </button>

        <button
          onClick={handleNext}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition active:scale-95"
        >
          <span>البطاقة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        💡 تلميح: يمكنك استخدام مفاتيح الأسهم (⬅️ و ➡️) للتنقل، ومسافة (Space) لقلب الكارت على الكمبيوتر.
      </div>
    </div>
  );
}
