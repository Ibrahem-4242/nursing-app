'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Subject, Lecture, SubjectQuizFile } from '@/lib/types';
import {
  BookOpen,
  FileText,
  ArrowLeft,
  Layers,
  ClipboardCheck,
  EyeOff,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface SemesterSubjectsBrowserProps {
  subjects: Subject[];
  lectures: Lecture[];
  quizzesList: SubjectQuizFile[];
  isAdmin: boolean;
  initialSemester?: '1' | '2';
  gridCols?: 3 | 4;
}

export default function SemesterSubjectsBrowser({
  subjects,
  lectures,
  quizzesList,
  isAdmin,
  initialSemester,
  gridCols = 4,
}: SemesterSubjectsBrowserProps) {
  // Helper to get lectures and quizzes for a subject in a specific semester
  const getSubjectSemesterStats = (sub: Subject, sem: '1' | '2') => {
    const defaultSem = sub.semester === '2' ? '2' : '1';
    const subLectures = lectures.filter(
      (l) => l.subjectId === sub.id && (l.semester || defaultSem) === sem
    );
    const subQuizzes = quizzesList.filter(
      (q) => (isAdmin || q.isLive !== false) && q.subjectId === sub.id && (q.semester || defaultSem) === sem
    );
    const hasContent = subLectures.length > 0 || subQuizzes.length > 0;
    const belongsToSemesterByConfig =
      (sub.semester || '1') === sem || sub.semester === 'both';

    return {
      lecturesCount: subLectures.length,
      quizzesCount: subQuizzes.length,
      totalQuestions: subQuizzes.reduce((acc, q) => acc + (q.questionsCount || 0), 0),
      hasContent,
      belongsToSemesterByConfig,
      shouldShow: isAdmin
        ? hasContent || belongsToSemesterByConfig
        : hasContent,
    };
  };

  const sem1Subjects = subjects
    .map((sub) => ({ sub, stats: getSubjectSemesterStats(sub, '1') }))
    .filter((item) => item.stats.shouldShow);

  const sem2Subjects = subjects
    .map((sub) => ({ sub, stats: getSubjectSemesterStats(sub, '2') }))
    .filter((item) => item.stats.shouldShow);

  const sem1ContentCount = sem1Subjects.filter((i) => i.stats.hasContent).length;
  const sem2ContentCount = sem2Subjects.filter((i) => i.stats.hasContent).length;

  const defaultActiveSemester: '1' | '2' =
    initialSemester === '2' && (isAdmin || sem2ContentCount > 0)
      ? '2'
      : sem1ContentCount > 0
      ? '1'
      : sem2ContentCount > 0
      ? '2'
      : '1';

  const [activeSemester, setActiveSemester] = useState<'1' | '2'>(defaultActiveSemester);

  useEffect(() => {
    if (initialSemester === '1' || initialSemester === '2') {
      if (isAdmin || (initialSemester === '1' ? sem1ContentCount > 0 : sem2ContentCount > 0)) {
        setActiveSemester(initialSemester);
      }
    }
  }, [initialSemester, isAdmin, sem1ContentCount, sem2ContentCount]);

  const currentItems = activeSemester === '1' ? sem1Subjects : sem2Subjects;
  const showSem1Tab = isAdmin || sem1ContentCount > 0;
  const showSem2Tab = isAdmin || sem2ContentCount > 0;

  return (
    <div className="space-y-8">
      {/* Semester Selector Tabs */}
      {(showSem1Tab || showSem2Tab) && (
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 w-fit mx-auto sm:mx-0">
          {showSem1Tab && (
            <button
              type="button"
              onClick={() => setActiveSemester('1')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeSemester === '1'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>سمستر 1 (الترم الأول)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeSemester === '1'
                    ? 'bg-white/20 text-white'
                    : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                }`}
              >
                {sem1ContentCount} مواد
              </span>
              {isAdmin && sem1ContentCount === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  <span>فارغ للطلاب</span>
                </span>
              )}
            </button>
          )}

          {showSem2Tab && (
            <button
              type="button"
              onClick={() => setActiveSemester('2')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeSemester === '2'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>سمستر 2 (الترم الثاني)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeSemester === '2'
                    ? 'bg-white/20 text-white'
                    : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                }`}
              >
                {sem2ContentCount} مواد
              </span>
              {isAdmin && sem2ContentCount === 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    activeSemester === '2'
                      ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>للأدمن فقط</span>
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Subjects Grid for Active Semester */}
      {currentItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            لا توجد مقررات منشورة في سمستر {activeSemester} حالياً 🩺
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? 'أنت تشاهد هذه الصفحة كأدمن — هذا السمستر مخفي تلقائياً عن الطلاب لأنه فارغ حالياً. يمكنك إضافة محاضرات أو كويزات لسمستر ' +
                activeSemester +
                ' من لوحة الإدارة.'
              : 'المقررات والمحاضرات تظهر هنا فور نشرها واعتمادها من لوحة التحكم مباشرة.'}
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          } gap-6`}
        >
          {currentItems.map(({ sub, stats }) => {
            const isEmptyForStudents = !stats.hasContent;

            return (
              <Link
                key={`${sub.id}-sem-${activeSemester}`}
                href={`/subject/${sub.id}?semester=${activeSemester}`}
                className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 transform hover:-translate-y-1.5 ${
                  isEmptyForStudents
                    ? 'border-dashed border-amber-300 dark:border-amber-800/80 opacity-85 hover:opacity-100 hover:border-amber-400'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl'
                }`}
              >
                <div>
                  {/* Admin-only empty indicator */}
                  {isAdmin && isEmptyForStudents && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>يظهر للأدمن فقط (فارغ ومخفي عن الطلاب)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200/60 dark:border-teal-800">
                      سمستر {activeSemester}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {stats.lecturesCount > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/50 px-2 py-0.5 rounded-lg">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{stats.lecturesCount} محاضرات</span>
                        </div>
                      )}
                      {stats.quizzesCount > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>{stats.quizzesCount} كويز</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-2">
                    {sub.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-5">
                    {sub.description}
                  </p>

                  {/* Available content summary badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2.5 rounded-xl mb-4 border border-teal-100/80 dark:border-teal-900/40">
                    <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {stats.lecturesCount > 0 && stats.quizzesCount > 0
                        ? 'متاح: محاضرات الشرح 📚 + أسئلة الكويزات 📝'
                        : stats.lecturesCount > 0
                        ? 'متاح: محاضرات الشرح والملخصات 📚'
                        : stats.quizzesCount > 0
                        ? `متاح: أسئلة الكويزات (${stats.quizzesCount} ملف) 📝`
                        : 'لا يوجد محتوى مرفوع في هذا السمستر بعد'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                    <span>
                      {stats.lecturesCount > 0 && stats.quizzesCount > 0
                        ? 'فتح المادة (محاضرات وكويزات)'
                        : stats.quizzesCount > 0
                        ? 'فتح أسئلة الكويزات'
                        : 'فتح المحاضرات'}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {stats.lecturesCount > 0 ? 'المحاضرة 1 مجاناً 🎁' : 'متاح مجاناً 🎁'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
