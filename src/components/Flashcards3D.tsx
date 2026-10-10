'use client';

import React, { useState, useEffect } from 'react';
import { Flashcard } from '@/lib/types';
import { ChevronRight, ChevronLeft, RotateCcw, Shuffle, Sparkles, CheckCircle2 } from 'lucide-react';

interface Flashcards3DProps {
  cards: Flashcard[];
  subjectTitle?: string;
}

export default function Flashcards3D({ cards, subjectTitle = 'مقرر التمريض' }: Flashcards3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(cards);

  useEffect(() => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  if (!shuffledCards || shuffledCards.length === 0) {
    return null;
  }

  const currentCard = shuffledCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const newShuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffled);
    setCurrentIndex(0);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full my-10" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
              بطاقات الاستذكار السريع (Interactive 3D Flashcards)
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            اضغط على البطاقة لقلبها واختبار معلوماتك السريرية في {subjectTitle}
          </p>
        </div>

        {/* Counter and Shuffle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="ترتيب عشوائي للبطاقات"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>خلط عشوائي</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            بطاقة {currentIndex + 1} من {shuffledCards.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="w-full h-[300px] sm:h-[340px] md:h-[360px] perspective-1000 cursor-pointer select-none group"
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform rounded-3xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-teal-50/20 to-slate-50 border-2 border-teal-200/80 shadow-xl group-hover:border-teal-400/80 group-hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold">
                {currentCard.category || 'مفهوم سريري'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span>وجه البطاقة (السؤال)</span>
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1 text-teal-600 font-medium">
                <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                اضغط هنا لقلب البطاقة ومعرفة الإجابة
              </span>
              <span>#{currentIndex + 1}</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-white border-2 border-teal-500/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                الإجابة والتعليل النموذجي
              </span>
              <span className="text-xs text-teal-300/80 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ظهر البطاقة</span>
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
                {currentCard.back}
              </p>

              {currentCard.clinicalPearl && (
                <div className="mt-4 p-3 rounded-2xl bg-teal-800/40 border border-teal-500/30 text-xs text-teal-200">
                  <span className="font-bold text-teal-300 block mb-0.5">💡 لؤلؤة سريرية (Clinical Pearl):</span>
                  {currentCard.clinicalPearl}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span className="text-teal-400/90 font-medium">اضغط للعودة إلى السؤال</span>
              <span>#{currentIndex + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 shadow-sm transition active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
          <span>البطاقة السابقة</span>
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-2.5 rounded-2xl bg-teal-50 text-teal-700 font-bold text-sm border border-teal-200 hover:bg-teal-100 transition active:scale-95 shadow-sm"
        >
          {isFlipped ? 'عرض السؤال' : 'إظهار الحل'}
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 transition active:scale-95"
        >
          <span>البطاقة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
