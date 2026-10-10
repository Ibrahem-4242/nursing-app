import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import { BookOpen, FileText, Award, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface YearPageProps {
  params: {
    yearId: string;
  };
}

export function generateStaticParams() {
  const years = DataService.getAcademicYears();
  return years.map((y) => ({
    yearId: y.id,
  }));
}

export default function YearPage({ params }: YearPageProps) {
  const year = DataService.getAcademicYearById(params.yearId);

  if (!year) {
    notFound();
  }

  const subjects = DataService.getSubjectsByYear(year.id);

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

          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-teal-200">
            <span>📚 عدد المواد: {subjects.length} مقررات</span>
            <span>•</span>
            <span>⚡️ متوفر ملخصات وكويزات ومجسمات 3D</span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="8765432109" label={`إعلانات مقررات ${year.title}`} />

      {/* Subjects Grid */}
      <div className="my-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">مواد ومقررات {year.title}</h2>
            <p className="text-xs text-slate-500 mt-1">اختر المادة لتصفح كافة المحاضرات، الكويزات، وتحميل الملفات</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
            {subjects.length} مواد
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/subject/${sub.id}`}
              className="group flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-mono font-bold border border-teal-200/60">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      {sub.totalLectures} محاضرات
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {sub.totalQuizzes} كويزات
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition mb-1">
                  {sub.title}
                </h3>
                <span className="text-xs font-medium text-slate-400 block mb-3 font-mono">
                  {sub.englishTitle}
                </span>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6">
                  {sub.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                  <span>فتح المحاضرات والكويزات</span>
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

      {/* High-yield Study Tips Section (Crucial for AdSense rich educational content) */}
      <section className="my-12 p-8 rounded-3xl bg-slate-100/80 border border-slate-200 text-slate-800">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <span>نصائح دراسية وسريرية لتفوق طلاب {year.title}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 leading-relaxed mt-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <span className="font-bold text-teal-800 block mb-1">📌 الربط بين النظري والعملي (Theory-Practice Integration):</span>
            لا تكتفِ بحفظ المصطلحات الطبية كنصوص؛ بل اربط كل مفهوم فسيولوجي بتطبيقه في الرعاية التمريضية بالمستشفى (مثل سبب قياس النبض قبل إعطاء دواء الديجوكسين).
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <span className="font-bold text-teal-800 block mb-1">🗂️ التكرار المتباعد عبر الفلاش كاردز (Spaced Repetition):</span>
            استخدم بطاقات الاستذكار السريع المتوفرة في كل محاضرة لمراجعة المصطلحات والجرعات الدوائية لمدة 10 دقائق يومياً لتثبيتها في الذاكرة طويلة المدى.
          </div>
        </div>
      </section>

      {/* In-content AdSense */}
      <AdSenseBanner position="in-content" slotId="7654321098" label="إعلان ممول - أدوات دراسة التمريض" />
    </div>
  );
}
