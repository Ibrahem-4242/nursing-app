import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import { CmsService } from '@/lib/cms-db';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import {
  FileText,
  Clock,
  Eye,
  Gift,
  Lock,
  ArrowLeft,
  Sparkles,
  Download,
  Presentation,
  GitFork,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SubjectPageProps {
  params: {
    subId: string;
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const subject = DataService.getSubjectById(params.subId);

  if (!subject) {
    notFound();
  }

  const year = DataService.getAcademicYearById(subject.yearId);
  const liveLectures = await CmsService.getLiveLecturesBySubject(subject.id);
  const lectures = liveLectures.length > 0 ? liveLectures : DataService.getLecturesBySubject(subject.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: year?.title || 'السنة الدراسية', href: `/year/${subject.yearId}` },
          { label: subject.title },
        ]}
      />

      {/* Subject Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl mb-8 border border-teal-500/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>كود المقرر: {subject.code} • {subject.yearName}</span>
          </div>

          {/* Clean Arabic title without small English subtitle */}
          <h1 className="text-3xl sm:text-4xl font-black">{subject.title}</h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
            {subject.description}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-300">
              <Gift className="w-4 h-4 text-emerald-400" />
              المحاضرة الأولى مجانية بالكامل للجميع 🎁
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              كل محاضرة تشمل: PDF • بوربوينت • خريطة ذهنية • فلاش كاردز
            </span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="6543210987" label={`إعلانات مادة ${subject.title}`} />

      {/* Content Section: Lectures & Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-10">
        {/* Main Column: Lectures List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <span>محاضرات المادة المتاحة</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اختر المحاضرة لفتح ملفات الـ PDF والبوربوينت والخرائط الذهنية وتصفح الفلاش كاردز التفاعلية
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
              {lectures.length} محاضرات متاحة
            </span>
          </div>

          {lectures.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <p className="text-sm font-semibold">جارِ رفع وتنسيق محاضرات هذه المادة قريباً ⌛️</p>
            </div>
          ) : (
            <div className="space-y-5">
              {lectures.map((lec) => (
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
                        المحاضرة رقم {lec.lectureNumber}
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

                  {/* The 4-Resource Badges inside each lecture card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>ملف PDF</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Presentation className="w-3.5 h-3.5 text-amber-500" />
                      <span>عرض بوربوينت</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <GitFork className="w-3.5 h-3.5 text-sky-500" />
                      <span>خريطة ذهنية</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium font-bold text-teal-600 dark:text-teal-400">
                      <Layers className="w-3.5 h-3.5" />
                      <span>فلاش كاردز تفاعلية</span>
                    </span>
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
                      <span>فتح المحاضرة والفلاش كاردز</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AdSense In-Content between lectures and quizzes */}
          <AdSenseBanner position="in-content" slotId="5432167890" label="إعلان ممول - المحاضرات الأكاديمية" />

        </div>

        {/* Sidebar Column: Study Guide & AdSense */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cards Guide Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>محتويات كل محاضرة</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span><strong>ملخصات PDF:</strong> ملونة ومجهزة للطباعة والمذاكرة الورقية.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Presentation className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong>عروض البوربوينت:</strong> السلايدات الرسمية مع الرسوم التوضيحية.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <GitFork className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>خرائط ذهنية:</strong> تشجير بصري شامل لكافة عناصر المحاضرة.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>فلاش كاردز تفاعلية:</strong> بطاقات استذكار سريعة بنظام Flip Card.</span>
              </li>
            </ul>
          </div>

          {/* Sidebar AdSense Banner */}
          <AdSenseBanner position="sidebar" slotId="4321098765" label="إعلان ممول - مراجع التمريض" />
        </div>
      </div>
    </div>
  );
}
