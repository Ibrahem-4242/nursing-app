'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Stethoscope,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  Command,
  CornerDownLeft,
  ChevronLeft,
} from 'lucide-react';
import {
  executeSearch,
  IndexedLecture,
  IndexedSubject,
  SearchMatchResult,
} from '@/lib/search-engine';
import HighlightText from '@/components/HighlightText';

// Helper to open search modal from anywhere in the app
export function openGlobalSearch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-medical-search'));
  }
}

export default function GlobalSearchModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'lectures' | 'concepts' | 'quizzes_terms'>('all');

  const [lectures, setLectures] = useState<IndexedLecture[]>([]);
  const [subjects, setSubjects] = useState<IndexedSubject[]>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [searchResults, setSearchResults] = useState<SearchMatchResult>({
    matchingLectures: [],
    matchingConcepts: [],
    matchingQuizzesAndTerms: [],
    totalMatches: 0,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // 1. Listen for custom open event and global shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle modal on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('open-medical-search', handleOpenEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-medical-search', handleOpenEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 2. Fetch search index once when modal opens or in idle
  useEffect(() => {
    if (!isOpen || lectures.length > 0 || isLoadingIndex) return;

    let isMounted = true;
    setIsLoadingIndex(true);

    fetch('/api/search')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setLectures(data.lectures || []);
          setSubjects(data.subjects || []);
        }
      })
      .catch((err) => {
        console.error('[SearchModal] Failed to load search index:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingIndex(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, lectures.length, isLoadingIndex]);

  // 3. Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setSearchResults({
        matchingLectures: [],
        matchingConcepts: [],
        matchingQuizzesAndTerms: [],
        totalMatches: 0,
      });
      setActiveTab('all');
    }
  }, [isOpen]);

  // 4. Instant search execution on query change
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({
        matchingLectures: [],
        matchingConcepts: [],
        matchingQuizzesAndTerms: [],
        totalMatches: 0,
      });
      return;
    }

    startTransition(() => {
      const results = executeSearch(query, lectures, subjects);
      setSearchResults(results);
    });
  }, [query, lectures, subjects]);

  // Handle result item click
  const handleSelectResult = (targetUrl: string, anchorId?: string) => {
    setIsOpen(false);

    const fullUrl = anchorId ? `${targetUrl}#${anchorId}` : targetUrl;
    router.push(fullUrl);

    // If already on the same page, trigger smooth scroll
    if (anchorId && typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400');
          }, 2500);
        }
      }, 300);
    }
  };

  const popularSearches = [
    { label: 'إنعاش القلب والرئتين', query: 'CPR' },
    { label: 'صدمة نقص الحجم', query: 'Hypovolemic Shock' },
    { label: 'عظام الجمجمة', query: 'Skull' },
    { label: 'العلامات الحيوية', query: 'Vital Signs' },
    { label: 'اتجاهات ومستويات التشريح', query: 'Anatomical' },
    { label: 'التعقيم ومكافحة العدوى', query: 'Aseptic' },
  ];

  if (!isOpen) return null;

  const showLectures = activeTab === 'all' || activeTab === 'lectures';
  const showConcepts = activeTab === 'all' || activeTab === 'concepts';
  const showQuizzesTerms = activeTab === 'all' || activeTab === 'quizzes_terms';

  const hasAnyResults = searchResults.totalMatches > 0;
  const isSearchActive = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* TOP SEARCH HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 stroke-[2.3]" />
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن أي مصطلح، موضوع، أو مرض (مثال: Shock, CPR, عظام الجمجمة, اتجاهات التشريح)..."
                className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1"
              title="إغلاق (Esc)"
            >
              <span>ESC</span>
            </button>
          </div>

          {/* CATEGORY FILTER TABS (When search has results) */}
          {isSearchActive && hasAnyResults && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>الكل</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                  {searchResults.totalMatches}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lectures')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeTab === 'lectures'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>📚 المحاضرات</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                  {searchResults.matchingLectures.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('concepts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeTab === 'concepts'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>💡 المفاهيم والشروحات</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                  {searchResults.matchingConcepts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quizzes_terms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeTab === 'quizzes_terms'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>❓ أسئلة ومصطلحات</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                  {searchResults.matchingQuizzesAndTerms.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* RESULTS SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* EMPTY / INITIAL STATE: POPULAR QUICK SEARCHES */}
          {!isSearchActive && (
            <div className="space-y-5 py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>عمليات بحث شائعة وسريعة في التمريض:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {popularSearches.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(item.query)}
                    className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 transition flex items-center gap-1.5"
                  >
                    <span>⚡ {item.label}</span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      ({item.query})
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-teal-950 dark:text-teal-200 text-xs space-y-1.5">
                <p className="font-bold">💡 نصائح للبحث الذكي:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>يمكنك البحث باللغة العربية أو الإنجليزية أو بالمصطلحات اللاتينية والطبية.</li>
                  <li>البحث يشمل تلقائياً عناوين المحاضرات، الأسئلة وشروحاتها، وفلاش كاردز الحفظ.</li>
                  <li>اضغط على أي نتيجة للانتقال فوراً والتمرير التلقائي لمكان المعلومة داخل المحاضرة.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ACTIVE SEARCH WITH NO RESULTS */}
          {isSearchActive && !hasAnyResults && (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                لم يتم العثور على نتائج مطابقة لـ &ldquo;{query}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                تأكد من كتابة الكلمة بشكل صحيح، أو جرّب البحث باللغة الإنجليزية أو بمصطلح طبي عام (مثل: Vital, Shock, Heart, تشريح).
              </p>
            </div>
          )}

          {/* CATEGORY 1: 📚 LECTURES MATCHES */}
          {showLectures && searchResults.matchingLectures.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>📚 المحاضرات المطابقة ({searchResults.matchingLectures.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {searchResults.matchingLectures.map(({ lecture, matchedField, matchedSnippet }, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectResult(`/lecture/${lecture.lectureId}`)}
                    className="w-full text-right p-4 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 dark:bg-slate-850 dark:hover:bg-teal-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition group space-y-2 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold">
                          {lecture.subjectTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                          المحاضرة {lecture.lectureNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>{lecture.readingMinutes} دقيقة</span>
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-[-2px] transition-transform flex items-center gap-1">
                        <span>فتح المحاضرة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h5 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                      <HighlightText text={lecture.lectureTitle} query={query} />
                    </h5>

                    {matchedSnippet && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        <HighlightText text={matchedSnippet} query={query} />
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 2: 💡 CLINICAL CONCEPTS */}
          {showConcepts && searchResults.matchingConcepts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>💡 المفاهيم والشروحات الطبية ({searchResults.matchingConcepts.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {searchResults.matchingConcepts.map(
                  ({ lectureId, lectureTitle, subjectTitle, concept, matchedField, matchedSnippet }, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(`/lecture/${lectureId}`, `concept-${concept.index}`)}
                      className="w-full text-right p-4 rounded-2xl bg-white dark:bg-slate-850 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition group space-y-2 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800">
                            مفهوم طبي سريري
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            من: {lectureTitle} ({subjectTitle})
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>انتقال للمفهوم 🎯</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <h5 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                        <HighlightText text={concept.heading} query={query} />
                      </h5>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <HighlightText text={matchedSnippet} query={query} />
                      </p>
                    </button>
                  )
                )}
              </div>
            </section>
          )}

          {/* CATEGORY 3: ❓ QUIZZES, TERMINOLOGY & FLASHCARDS */}
          {showQuizzesTerms && searchResults.matchingQuizzesAndTerms.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-violet-500" />
                  <span>❓ أسئلة الكويزات والمصطلحات ({searchResults.matchingQuizzesAndTerms.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {searchResults.matchingQuizzesAndTerms.map(
                  ({ type, lectureId, lectureTitle, subjectTitle, title, subtitle, matchedSnippet, badgeLabel, targetAnchor, targetTab }, idx) => {
                    const targetUrl = targetTab ? `/lecture/${lectureId}?tab=${targetTab}` : `/lecture/${lectureId}`;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectResult(targetUrl, targetAnchor)}
                        className="w-full text-right p-4 rounded-2xl bg-white dark:bg-slate-850 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition group space-y-2 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                type === 'quiz'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : type === 'term'
                                  ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                  : type === 'flashcard'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                              }`}
                            >
                              {badgeLabel}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {lectureTitle}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                            <span>عرض السؤال / المصطلح</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed">
                          <HighlightText text={title} query={query} />
                        </h5>

                        {subtitle && subtitle !== title && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <HighlightText text={subtitle} query={query} />
                          </p>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>

        {/* BOTTOM SHORTCUT FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />
              <span>انقر للانتقال المباشر</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Ctrl + K لفتح / إغلاق البحث</span>
          </div>

          <div>
            {isSearchActive && hasAnyResults && (
              <span className="font-bold text-teal-700 dark:text-teal-300">
                {searchResults.totalMatches} نتيجة مطابقة
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
