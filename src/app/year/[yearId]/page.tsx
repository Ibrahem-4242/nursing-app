import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { DataService } from '@/lib/data-service';
import { CmsService } from '@/lib/cms-db';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import SemesterSubjectsBrowser from '@/components/SemesterSubjectsBrowser';
import ShakibRakibBanner from '@/components/ShakibRakibBanner';
import DailyReviewQueueCard from '@/components/DailyReviewQueueCard';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface YearPageProps {
  params: {
    yearId: string;
  };
  searchParams?: {
    semester?: string;
  };
}

export default async function YearPage({ params, searchParams }: YearPageProps) {
  const year = DataService.getAcademicYearById(params.yearId);

  if (!year) {
    notFound();
  }

  const isAdmin =
    cookies().get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  const allSubjects = await CmsService.getLiveSubjects();
  const subjects = allSubjects.filter((s) => s.yearId === year.id);
  const liveLectures = await CmsService.getLiveLectures();
  const allQuizFiles = await CmsService.getAllSubjectQuizFilesList();
  const platformFeatures = await CmsService.getPlatformFeatures();
  const quizzesList = platformFeatures.subjectQuizzes !== false ? allQuizFiles.filter((q) => q.isLive !== false) : [];
  const shakibConfig = await CmsService.getShakibRakibConfig();
  const initialSemester =
    searchParams?.semester === '2' ? '2' : searchParams?.semester === '1' ? '1' : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: year.title }]} />

      {/* Year Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-8 sm:p-10 text-white shadow-xl mb-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-200 text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{year.badge} • {year.stageName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black">{year.title}</h1>

          <p className="text-sm sm:text-base text-teal-100 leading-relaxed">
            {year.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-teal-200">
            <span>📚 عدد المواد: {subjects.length} مقررات معتمدة</span>
            <span>•</span>
            <span>⚡️ مقسمة حسب الفصل الدراسي: سمستر 1 (الترم الأول) و سمستر 2 (الترم الثاني)</span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="8765432109" label={`إعلانات مقررات ${year.title}`} />

      {/* 🚀 Shakib Rakib Golden Banner (باقة شاكب راكب الشهرية الشاملة) */}
      {platformFeatures.shakibRakib !== false && shakibConfig.isEnabled !== false && (
        <ShakibRakibBanner
          price={shakibConfig.price || 10}
          yearId={year.id}
          yearTitle={year.title}
          monthLabel={shakibConfig.monthLabel}
        />
      )}

      {/* 🧠 Daily Spaced Repetition Queue Card strictly for this Academic Year */}
      {platformFeatures.dailyReviewDose !== false && (
        <DailyReviewQueueCard yearId={year.id} />
      )}

      {/* Subjects Grid by Semester */}
      <div className="my-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">مواد ومقررات {year.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">اختر الفصل الدراسي والمادة لتصفح المحاضرات أو أسئلة الكويزات</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
            {subjects.length} مواد
          </span>
        </div>

        <SemesterSubjectsBrowser
          subjects={subjects}
          lectures={liveLectures}
          quizzesList={quizzesList}
          isAdmin={false}
          initialSemester={initialSemester}
          gridCols={3}
        />
      </div>

      {/* High-yield Study Tips Section */}
      <section className="my-12 p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>نصائح وتوجيهات دراسية لتفوق طلاب {year.title}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">📌 الربط بين النظري والعملي (Theory-Practice Integration):</span>
            لا تكتفِ بحفظ المصطلحات الطبية كنصوص؛ بل اربط كل مفهوم فسيولوجي بتطبيقه في الرعاية التمريضية بالمستشفى (مثل سبب قياس النبض قبل إعطاء دواء الديجوكسين).
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">🗂️ التكرار المتباعد عبر الفلاش كاردز (Spaced Repetition):</span>
            استخدم بطاقات الاستذكار السريع المتوفرة في كل محاضرة لمراجعة المصطلحات والجرعات الدوائية لمدة 10 دقائق يومياً لتثبيتها في الذاكرة طويلة المدى.
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="font-bold text-violet-800 dark:text-violet-300 block mb-1">🎧 استغلال الملخصات الصوتية (Audio Summaries):</span>
            استمع للملخص الصوتي السريع للمحاضرة في أوقات المواصلات والتنقل لتثبيت أهم النقاط السريرية دون عناء القراءة الطويلة.
          </div>
        </div>
      </section>

      {/* In-content AdSense */}
      <AdSenseBanner position="in-content" slotId="7654321098" label="إعلان ممول - أدوات دراسة التمريض" />
    </div>
  );
}
