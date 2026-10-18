'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Lecture, QuizQuestion, ClinicalConcept } from '@/lib/types';
import { useBookmarks } from '@/context/BookmarksContext';
import { cleanLatexMath } from '@/lib/text-cleaner';
import {
  Bookmark,
  BookOpen,
  Pin,
  Star,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Search,
  ExternalLink,
  Printer,
  Sparkles,
  ArrowRight,
  Clock,
  Eye,
  Gift,
  Lock,
} from 'lucide-react';

interface BookmarksClientViewProps {
  allLectures: Lecture[];
}

export default function BookmarksClientView({ allLectures }: BookmarksClientViewProps) {
  const { bookmarks, removeBookmark, clearAllBookmarks, totalCount, isLoading } = useBookmarks();
  const [activeTab, setActiveTab] = useState<'lectures' | 'questions' | 'concepts'>('lectures');
  const [searchQuery, setSearchQuery] = useState('');

  // Map of lectures by ID for instant O(1) lookup
  const lectureMap = useMemo(() => {
    const map = new Map<string, Lecture>();
    for (const lec of allLectures) {
      map.set(lec.id, lec);
    }
    return map;
  }, [allLectures]);

  // 1. Saved Lectures List
  const savedLectures = useMemo(() => {
    return bookmarks.lectureIds
      .map((id) => lectureMap.get(id))
      .filter((lec): lec is Lecture => Boolean(lec));
  }, [bookmarks.lectureIds, lectureMap]);

  // 2. Saved Questions List
  interface ParsedSavedQuestion {
    targetId: string;
    lectureId: string;
    lectureTitle: string;
    question: QuizQuestion;
  }

  const savedQuestions = useMemo(() => {
    const results: ParsedSavedQuestion[] = [];

    for (const targetId of bookmarks.questionIds) {
      // format: ${lectureId}:::q-${q.id}
      const parts = targetId.split(':::q-');
      if (parts.length === 2) {
        const [lectureId, qIdStr] = parts;
        const lec = lectureMap.get(lectureId);
        if (lec && lec.quiz) {
          const q = lec.quiz.find((item) => String(item.id) === qIdStr);
          if (q) {
            results.push({
              targetId,
              lectureId,
              lectureTitle: lec.title,
              question: q,
            });
            continue;
          }
        }
      }

      // Fallback: search across all lectures for question ID if lecture ID was generic
      for (const lec of allLectures) {
        if (lec.quiz) {
          const rawQId = targetId.includes(':::q-') ? targetId.split(':::q-')[1] : targetId;
          const q = lec.quiz.find((item) => String(item.id) === rawQId);
          if (q && !results.some((r) => r.targetId === targetId)) {
            results.push({
              targetId,
              lectureId: lec.id,
              lectureTitle: lec.title,
              question: q,
            });
            break;
          }
        }
      }
    }

    return results;
  }, [bookmarks.questionIds, lectureMap, allLectures]);

  // 3. Saved Concepts List
  interface ParsedSavedConcept {
    targetId: string;
    lectureId: string;
    lectureTitle: string;
    conceptIndex: number;
    concept: ClinicalConcept;
  }

  const savedConcepts = useMemo(() => {
    const results: ParsedSavedConcept[] = [];

    for (const targetId of bookmarks.conceptIds) {
      // format: ${lectureId}:::concept-${index}
      const parts = targetId.split(':::concept-');
      if (parts.length === 2) {
        const [lectureId, cIdxStr] = parts;
        const cIndex = Number(cIdxStr);
        const lec = lectureMap.get(lectureId);
        if (lec && lec.concepts && lec.concepts[cIndex]) {
          results.push({
            targetId,
            lectureId,
            lectureTitle: lec.title,
            conceptIndex: cIndex,
            concept: lec.concepts[cIndex],
          });
        }
      }
    }

    return results;
  }, [bookmarks.conceptIds, lectureMap]);

  // Filtered lists based on search query
  const filteredLectures = useMemo(() => {
    if (!searchQuery.trim()) return savedLectures;
    const q = searchQuery.toLowerCase();
    return savedLectures.filter(
      (lec) =>
        lec.title.toLowerCase().includes(q) ||
        (lec.subtitle && lec.subtitle.toLowerCase().includes(q)) ||
        (lec.subjectTitle && lec.subjectTitle.toLowerCase().includes(q))
    );
  }, [savedLectures, searchQuery]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return savedQuestions;
    const q = searchQuery.toLowerCase();
    return savedQuestions.filter(
      (item) =>
        item.question.question.toLowerCase().includes(q) ||
        item.lectureTitle.toLowerCase().includes(q) ||
        item.question.options.some((opt) => opt.toLowerCase().includes(q)) ||
        (item.question.explanation && item.question.explanation.toLowerCase().includes(q))
    );
  }, [savedQuestions, searchQuery]);

  const filteredConcepts = useMemo(() => {
    if (!searchQuery.trim()) return savedConcepts;
    const q = searchQuery.toLowerCase();
    return savedConcepts.filter(
      (item) =>
        item.concept.heading.toLowerCase().includes(q) ||
        item.lectureTitle.toLowerCase().includes(q) ||
        item.concept.summary.toLowerCase().includes(q) ||
        item.concept.points.some((pt) => pt.toLowerCase().includes(q))
    );
  }, [savedConcepts, searchQuery]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تفريغ جميع المحفوظات ليلة الامتحان؟')) {
      clearAllBookmarks();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-400 text-teal-950 font-black shadow-lg">
                <Bookmark className="w-6 h-6 fill-current" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  محفوظاتي ليلة الامتحان 🔖
                </h1>
                <p className="text-xs sm:text-sm text-teal-200 mt-1">
                  مراجعتك السريعة المركزة: أهم المحاضرات، الأسئلة المعقدة، والتريكات السريرية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 print:hidden cursor-pointer"
                    title="طباعة للمراجعة الورقية ليلة الامتحان"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة ليلة الامتحان 🖨️</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-xs transition border border-rose-400/30 print:hidden cursor-pointer"
                    title="تفريغ كل المحفوظات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تفريغ الكل</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white font-bold border border-white/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>إجمالي المحفوظات: {totalCount}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-200 font-medium">
              📚 {savedLectures.length} محاضرات
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-200 font-medium">
              📌 {savedQuestions.length} أسئلة صعبة
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-200 font-medium">
              ⭐ {savedConcepts.length} مفاهيم رئيسية
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
        {/* Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('lectures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'lectures'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>المحاضرات ({savedLectures.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
            <span>الأسئلة الصعبة ({savedQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>المفاهيم والتريكات ({savedConcepts.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في محفوظاتك..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: SAVED LECTURES */}
      {activeTab === 'lectures' && (
        <div className="space-y-4">
          {savedLectures.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <BookOpen className="w-12 h-12 text-teal-600/40 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                لم تقم بحفظ أي محاضرات بعد 📚
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                اضغط على زر النجمة ⭐ "احفظ ليلة الامتحان" في رأس أي محاضرة أو بطاقتها لحفظها هنا للمراجعة السريعة.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
              >
                <span>استكشف المحاضرات الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              لا توجد محاضرات تطابق بحثك: &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLectures.map((lec) => (
                <div
                  key={lec.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                        {lec.subjectTitle}
                      </span>
                      {lec.isFree ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <Gift className="w-3 h-3" />
                          <span>مجانية</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                          <Lock className="w-3 h-3" />
                          <span>مدفوعة</span>
                        </span>
                      )}
                    </div>

                    <Link href={`/lecture/${lec.id}`}>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition leading-snug">
                        {lec.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {lec.subtitle || lec.overview}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lec.readingMinutes} دقيقة
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {lec.viewCount} طالب
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/lecture/${lec.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      <span>فتح وقراءة المحاضرة</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => removeBookmark('lecture', lec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="إزالة من المحفوظات"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {savedQuestions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Pin className="w-12 h-12 text-amber-500/40 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                لا توجد أسئلة معقدة محفوظة حالياً 📌
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                أثناء حل كويز أي محاضرة، اضغط على زر &quot;احفظ هذا السؤال ليلة الامتحان 📌&quot; ليتم تجميع الأسئلة الصعبة وإجاباتها النموذجية هنا للمراجعة الفورية.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition shadow-md shadow-amber-500/20"
              >
                <span>حل الكويزات الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              لا توجد أسئلة تطابق بحثك: &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="space-y-5">
              {filteredQuestions.map((item, qIdx) => {
                const { question } = item;
                return (
                  <div
                    key={item.targetId || qIdx}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Header with Lecture link and Mastered removal button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                          {qIdx + 1}
                        </span>
                        <Link
                          href={`/lecture/${item.lectureId}`}
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <span>المحاضرة: {item.lectureTitle}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBookmark('question', item.targetId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition cursor-pointer"
                        title="أتقنت هذا السؤال، احذفه من بنك المراجعة"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>حذف بعد الإتقان ✅</span>
                      </button>
                    </div>

                    {/* Question text */}
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                      {cleanLatexMath(question.question)}
                    </h4>

                    {/* Options list with correct marked */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {question.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === question.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 opacity-70'
                            }`}
                          >
                            <span>{cleanLatexMath(opt)}</span>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex-shrink-0">
                                الإجابة الصحيحة ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Model Explanation */}
                    {question.explanation && (
                      <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-slate-800/50 border border-teal-100 dark:border-teal-900 text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
                        <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
                          التعليل العلمي والشرح النموذجي:
                        </span>
                        {cleanLatexMath(question.explanation)}
                      </div>
                    )}

                    {/* Clinical Pearl */}
                    {(question.clinicalPearl || question.pearl) && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                            نصيحة ذهبية للامتحان (Clinical Pearl):
                          </span>
                          {cleanLatexMath((question.clinicalPearl || question.pearl) || '')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED CONCEPTS */}
      {activeTab === 'concepts' && (
        <div className="space-y-6">
          {savedConcepts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Star className="w-12 h-12 text-teal-600/40 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                لم تقم بحفظ أي مفاهيم بعد ⭐
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                اضغط على زر النجمة ⭐ بجانب أي مفهوم سريري رئيسي داخل المحاضرة لحفظه هنا والمراجعة المركزة قبل دخول اللجنة.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
              >
                <span>استكشف المحاضرات الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              لا توجد مفاهيم تطابق بحثك: &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="space-y-5">
              {filteredConcepts.map((item, cIdx) => {
                const { concept } = item;
                return (
                  <div
                    key={item.targetId || cIdx}
                    className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <Link
                          href={`/lecture/${item.lectureId}#concept-${item.conceptIndex}`}
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <span>المحاضرة: {item.lectureTitle}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBookmark('concept', item.targetId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        title="إزالة من المفاهيم المحفوظة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة 🗑️</span>
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-teal-800 dark:text-teal-300">
                      {concept.heading}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {concept.summary}
                    </p>

                    <ul className="space-y-2 mr-2">
                      {concept.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 mt-2 flex-shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {concept.clinicalWarning && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-medium">{concept.clinicalWarning}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
