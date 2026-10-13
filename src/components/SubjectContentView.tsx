'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Subject, Lecture, SubjectQuizFile } from '@/lib/types';
import SubjectQuizFileBox from '@/components/SubjectQuizFileBox';
import {
  FileText,
  Clock,
  Eye,
  Gift,
  Lock,
  ArrowLeft,
  ArrowRight,
  Presentation,
  GitFork,
  Layers,
  Headphones,
  ClipboardCheck,
  BookOpen,
  Calendar,
  EyeOff,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

interface SubjectContentViewProps {
  subject: Subject;
  lectures: Lecture[];
  quizzesFiles: SubjectQuizFile[];
  isAdmin: boolean;
  initialSemester?: '1' | '2';
}

export default function SubjectContentView({
  subject,
  lectures,
  quizzesFiles,
  isAdmin,
  initialSemester,
}: SubjectContentViewProps) {
  const defaultSubSem: '1' | '2' = subject.semester === '2' ? '2' : '1';

  const sem1Lectures = lectures.filter((l) => (l.semester || defaultSubSem) === '1');
  const sem2Lectures = lectures.filter((l) => (l.semester || defaultSubSem) === '2');

  const sem1Quizzes = quizzesFiles.filter((q) => (q.semester || defaultSubSem) === '1');
  const sem2Quizzes = quizzesFiles.filter((q) => (q.semester || defaultSubSem) === '2');

  const sem1HasContent = sem1Lectures.length > 0 || sem1Quizzes.length > 0;
  const sem2HasContent = sem2Lectures.length > 0 || sem2Quizzes.length > 0;

  const computeInitialSemester = (): '1' | '2' => {
    if (initialSemester === '2' && (isAdmin || sem2HasContent)) return '2';
    if (initialSemester === '1' && (isAdmin || sem1HasContent)) return '1';
    if (sem1HasContent) return '1';
    if (sem2HasContent) return '2';
    return defaultSubSem;
  };

  const [activeSemester, setActiveSemester] = useState<'1' | '2'>(computeInitialSemester);

  const curLectures = activeSemester === '1' ? sem1Lectures : sem2Lectures;
  const curQuizzes = activeSemester === '1' ? sem1Quizzes : sem2Quizzes;

  const hasLectures = curLectures.length > 0;
  const hasQuizzes = curQuizzes.length > 0;

  // Determine whether the 2-option chooser should be used
  const shouldShowChooser = (hasLectures && hasQuizzes) || isAdmin;

  const computeDefaultMode = (
    lecCount: number,
    quizCount: number
  ): 'chooser' | 'lectures' | 'quizzes' => {
    if ((lecCount > 0 && quizCount > 0) || isAdmin) {
      return 'chooser';
    }
    if (lecCount > 0) return 'lectures';
    if (quizCount > 0) return 'quizzes';
    return 'chooser';
  };

  const [viewMode, setViewMode] = useState<'chooser' | 'lectures' | 'quizzes'>(() =>
    computeDefaultMode(curLectures.length, curQuizzes.length)
  );

  // Reset viewMode appropriately when switching semesters
  const handleSemesterChange = (sem: '1' | '2') => {
    setActiveSemester(sem);
    const nextLecs = sem === '1' ? sem1Lectures : sem2Lectures;
    const nextQuizzes = sem === '1' ? sem1Quizzes : sem2Quizzes;
    setViewMode(computeDefaultMode(nextLecs.length, nextQuizzes.length));
  };

  useEffect(() => {
    setViewMode(computeDefaultMode(curLectures.length, curQuizzes.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSemester, curLectures.length, curQuizzes.length, isAdmin]);

  const showSemesterTabs = isAdmin || (sem1HasContent && sem2HasContent);
  const totalQuizQuestions = curQuizzes.reduce(
    (sum, q) => sum + (Number(q.questionsCount) || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* 1. Semester Tabs (Shown if both semesters have content, or always for Admin) */}
      {showSemesterTabs && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {(isAdmin || sem1HasContent) && (
              <button
                type="button"
                onClick={() => handleSemesterChange('1')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  activeSemester === '1'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>سمستر 1 (الترم الأول)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSemester === '1'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {sem1Lectures.length} محاضرة • {sem1Quizzes.length} كويز
                </span>
                {isAdmin && !sem1HasContent && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    <span>فارغ للطلاب</span>
                  </span>
                )}
              </button>
            )}

            {(isAdmin || sem2HasContent) && (
              <button
                type="button"
                onClick={() => handleSemesterChange('2')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                  activeSemester === '2'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>سمستر 2 (الترم الثاني)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSemester === '2'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {sem2Lectures.length} محاضرة • {sem2Quizzes.length} كويز
                </span>
                {isAdmin && !sem2HasContent && (
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

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
            الفصل الدراسي الحالي: سمستر {activeSemester}
          </span>
        </div>
      )}

      {/* 2. Interactive 2-Choice Gateway (Shown first when both Lectures & Quizzes have content, or for Admin) */}
      {viewMode === 'chooser' && shouldShowChooser && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center sm:text-right space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>اختر القسم المطلوب في مادة {subject.title} (سمستر {activeSemester})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ماذا تريد أن تذاكر الآن؟ 🎯
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              اختر بين تصفح محاضرات الشرح والملخصات أو الدخول لبنك أسئلة الكويزات والامتحانات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Choice 1: Lectures Card */}
            {(hasLectures || isAdmin) && (
              <button
                type="button"
                onClick={() => setViewMode('lectures')}
                className={`group text-right relative overflow-hidden rounded-3xl p-7 sm:p-8 bg-white dark:bg-slate-900 border-2 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between ${
                  !hasLectures
                    ? 'border-dashed border-amber-300 dark:border-amber-800 opacity-85 hover:opacity-100'
                    : 'border-teal-200 dark:border-teal-800/80 hover:border-teal-500 dark:hover:border-teal-400 shadow-lg'
                }`}
              >
                <div className="absolute -top-12 -left-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  {isAdmin && !hasLectures && (
                    <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 w-fit">
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>يظهر للأدمن فقط (لا توجد محاضرات مرفوعة - مخفي عن الطلاب)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                      {curLectures.length} محاضرات متاحة
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-2.5">
                    📚 محاضرات المادة والملخصات
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    تصفح محاضرات الشرح المرتبة لمادة {subject.title}، وحمّل ملفات الـ PDF، البوربوينت، الخرائط الذهنية، واستمع للريكوردات الصوتية والفلاش كاردز.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 group-hover:bg-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 transition">
                    <span>فتح المحاضرات</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    المحاضرة 1 مجاناً 🎁
                  </span>
                </div>
              </button>
            )}

            {/* Choice 2: Quiz Questions Card */}
            {(hasQuizzes || isAdmin) && (
              <button
                type="button"
                onClick={() => setViewMode('quizzes')}
                className={`group text-right relative overflow-hidden rounded-3xl p-7 sm:p-8 bg-white dark:bg-slate-900 border-2 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between ${
                  !hasQuizzes
                    ? 'border-dashed border-amber-300 dark:border-amber-800 opacity-85 hover:opacity-100'
                    : 'border-amber-300/90 dark:border-amber-700/80 hover:border-amber-500 dark:hover:border-amber-400 shadow-lg'
                }`}
              >
                <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  {isAdmin && !hasQuizzes && (
                    <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 w-fit">
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      <span>يظهر للأدمن فقط (لا توجد ملفات كويز - مخفي عن الطلاب)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                      <ClipboardCheck className="w-8 h-8" />
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800">
                      {curQuizzes.length} ملف كويز {totalQuizQuestions > 0 ? `( +${totalQuizQuestions} سؤال )` : ''}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition mb-2.5">
                    📝 أسئلة الكويزات والامتحانات
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    بنك أسئلة الكويزات المجمعة واختبارات الميدتيرم والامتحانات السابقة لمادة {subject.title} مع الإجابات النموذجية جاهزة للتحميل.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition">
                    <span>فتح أسئلة الكويزات</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    متاح مجاناً للجميع 🎁
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Quick Navigation Bar when inside Lectures or Quizzes view (if chooser is applicable) */}
      {viewMode !== 'chooser' && shouldShowChooser && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('chooser')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لاختيار القسم</span>
          </button>

          <div className="flex items-center gap-2">
            {(hasLectures || isAdmin) && (
              <button
                type="button"
                onClick={() => setViewMode('lectures')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition ${
                  viewMode === 'lectures'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>المحاضرات ({curLectures.length})</span>
              </button>
            )}

            {(hasQuizzes || isAdmin) && (
              <button
                type="button"
                onClick={() => setViewMode('quizzes')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition ${
                  viewMode === 'quizzes'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>أسئلة الكويزات ({curQuizzes.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. QUIZZES VIEW (Supports Multiple Quiz Files per Subject & Semester) */}
      {viewMode === 'quizzes' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-amber-500" />
                <span>أسئلة الكويزات والامتحانات - سمستر {activeSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                جميع ملفات أسئلة الكويزات والميدتيرم المتاحة لمادة {subject.title}
              </p>
            </div>
            <span className="text-xs font-bold px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
              {curQuizzes.length} ملفات متاحة
            </span>
          </div>

          {curQuizzes.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-amber-300 dark:border-amber-800 space-y-2">
              <EyeOff className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-black text-slate-900 dark:text-white">
                لا توجد ملفات كويزات مرفوعة في سمستر {activeSemester} لهذه المادة حالياً
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                (هذا القسم يظهر لك لأنك مسجل دخول كأدمن، وهو مخفي تماماً عن الطلاب حتى ترفع ملف كويز)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {curQuizzes.map((qFile, idx) => (
                <SubjectQuizFileBox key={qFile.id || `${qFile.subjectId}-${idx}`} quizFile={qFile} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. LECTURES VIEW */}
      {viewMode === 'lectures' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <span>محاضرات المادة المتاحة - سمستر {activeSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اختر المحاضرة لفتح ملفات الشرح المتوفرة بها
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
              {curLectures.length} محاضرات متاحة
            </span>
          </div>

          {curLectures.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-amber-300 dark:border-amber-800 space-y-2">
              <EyeOff className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-black text-slate-900 dark:text-white">
                لا توجد محاضرات مرفوعة في سمستر {activeSemester} لهذه المادة حالياً
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                (هذا القسم يظهر لك لأنك مسجل دخول كأدمن، وهو مخفي تماماً عن الطلاب حتى ترفع محاضرة)
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {curLectures.map((lec) => {
                const isValidFile = (f: any) => Boolean((f?.downloadUrl || f?.fileUrl) && (f?.downloadUrl || f?.fileUrl) !== '#');
                const hasPdf = lec.files?.some((f: any) => (f.type === 'pdf' || f.fileType === 'summary') && isValidFile(f));
                const hasPpt = lec.files?.some((f: any) => (f.type === 'ppt' || f.fileType === 'powerpoint') && isValidFile(f));
                const hasMindmap = lec.files?.some((f: any) => (f.type === 'mindmap' || f.fileType === 'mindmap') && isValidFile(f));
                const hasAudio = lec.files?.some((f: any) => (f.type === 'audio' || f.fileType === 'audio') && isValidFile(f));
                const hasFlashcards = (lec.flashcards?.length || 0) > 0;

                return (
                  <div
                    key={lec.id}
                    className="group p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black text-xs flex items-center justify-center">
                          #{lec.lectureNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          المحاضرة رقم {lec.lectureNumber} • سمستر {lec.semester || defaultSubSem}
                        </span>
                      </div>

                      {/* Free vs Paid Badge */}
                      {lec.isFree ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                          <Gift className="w-3.5 h-3.5" />
                          <span>مجانية للجميع 🎁</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                          <Lock className="w-3.5 h-3.5" />
                          <span>محتوى مدفوع (10 ج)</span>
                        </span>
                      )}
                    </div>

                    <Link href={`/lecture/${lec.id}`}>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug mb-2">
                        {lec.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">
                      {lec.subtitle || lec.overview}
                    </p>

                    {/* Resource Badges: Only show resources that actually exist in this lecture */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                      {hasPdf && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <FileText className="w-3.5 h-3.5 text-rose-500" />
                          <span>ملف PDF</span>
                        </span>
                      )}
                      {hasPpt && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Presentation className="w-3.5 h-3.5 text-amber-500" />
                          <span>عرض بوربوينت</span>
                        </span>
                      )}
                      {hasMindmap && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <GitFork className="w-3.5 h-3.5 text-sky-500" />
                          <span>خريطة ذهنية</span>
                        </span>
                      )}
                      {hasAudio && (
                        <span className="flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400">
                          <Headphones className="w-3.5 h-3.5" />
                          <span>ريكورد صوتي 🎧</span>
                        </span>
                      )}
                      {hasFlashcards && (
                        <span className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400">
                          <Layers className="w-3.5 h-3.5" />
                          <span>فلاش كاردز ({lec.flashcards.length})</span>
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {lec.readingMinutes} دقيقة قراءة
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {lec.viewCount} طالب
                        </span>
                      </div>

                      <Link
                        href={`/lecture/${lec.id}`}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition active:scale-95 shadow-md shadow-teal-600/20 text-xs"
                      >
                        <span>فتح المحاضرة</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
