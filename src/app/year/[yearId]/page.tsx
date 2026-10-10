import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import { CmsService } from '@/lib/cms-db';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import { BookOpen, FileText, ArrowLeft, Sparkles, CheckCircle2, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface YearPageProps {
  params: {
    yearId: string;
  };
}

export default async function YearPage({ params }: YearPageProps) {
  const year = DataService.getAcademicYearById(params.yearId);

  if (!year) {
    notFound();
  }

  const liveSubjects = await CmsService.getLiveSubjects();
  const subjects = liveSubjects.length > 0 ? liveSubjects : DataService.getSubjectsByYear(year.id);

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
            <span>⚡️ متوفر في كل محاضرة: PDF • بوربوينت • خريطة ذهنية • فلاش كاردز</span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="8765432109" label={`إعلانات مقررات ${year.title}`} />

      {/* Subjects Grid */}
      <div className="my-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">مواد ومقررات {year.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">اختر المادة لتصفح المحاضرات وتحميل الملفات والفلاش كاردز</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
            {subjects.length} مواد
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/subject/${sub.id}`}
              className="group flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold border border-teal-200/60 dark:border-teal-800">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{sub.totalLectures} محاضرات</span>
                  </div>
                </div>

                {/* Subject Arabic Title Only (Removed small englishTitle as requested) */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-3">
                  {sub.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-5">
                  {sub.description}
                </p>

                {/* Materials Badge Indicator */}
                <div className="flex items-center gap-2 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/40 mb-4">
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>PDF • بوربوينت • خريطة ذهنية • فلاش كاردز + أسئلة كويزات 📝</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                  <span>فتح المحاضرات والملخصات</span>
                  <ArrowLeft className="w-4 h-4" />
                </span>

                <span className="text-[11px] text-slate-400">
                  المحاضرة 1 مجاناً 🎁
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* High-yield Study Tips Section */}
      <section className="my-12 p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>نصائح وتوجيهات دراسية لتفوق طلاب {year.title}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">📌 الربط بين النظري والعملي (Theory-Practice Integration):</span>
            لا تكتفِ بحفظ المصطلحات الطبية كنصوص؛ بل اربط كل مفهوم فسيولوجي بتطبيقه في الرعاية التمريضية بالمستشفى (مثل سبب قياس النبض قبل إعطاء دواء الديجوكسين).
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">🗂️ التكرار المتباعد عبر الفلاش كاردز (Spaced Repetition):</span>
            استخدم بطاقات الاستذكار السريع المتوفرة في كل محاضرة لمراجعة المصطلحات والجرعات الدوائية لمدة 10 دقائق يومياً لتثبيتها في الذاكرة طويلة المدى.
          </div>
        </div>
      </section>

      {/* In-content AdSense */}
      <AdSenseBanner position="in-content" slotId="7654321098" label="إعلان ممول - أدوات دراسة التمريض" />
    </div>
  );
}
