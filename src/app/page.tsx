import React from 'react';
import Link from 'next/link';
import { DataService } from '@/lib/data-service';
import StethoscopeHero from '@/components/StethoscopeHero';
import AdSenseBanner from '@/components/AdSenseBanner';
import { BOT_CONFIG } from '@/lib/mock-data';
import {
  Stethoscope,
  BookOpen,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  FileCheck2,
  FileText,
  Presentation,
  GitFork,
  Layers,
  Award,
  Headphones,
} from 'lucide-react';

import { cookies } from 'next/headers';
import { CmsService } from '@/lib/cms-db';
import SemesterSubjectsBrowser from '@/components/SemesterSubjectsBrowser';
import ShakibRakibBanner from '@/components/ShakibRakibBanner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { semester?: string };
}) {
  const isAdmin =
    cookies().get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  const [
    allSubjects,
    liveLectures,
    allQuizFiles,
    shakibConfig,
    platformFeatures,
  ] = await Promise.all([
    CmsService.getLiveSubjects(),
    CmsService.getLiveLectures(),
    CmsService.getAllSubjectQuizFilesList(),
    CmsService.getShakibRakibConfig(),
    CmsService.getPlatformFeatures(),
  ]);
  const quizzesList =
    platformFeatures.subjectQuizzes !== false
      ? allQuizFiles.filter((q) => q.isLive !== false)
      : [];
  const initialSemester =
    searchParams?.semester === '2' ? '2' : searchParams?.semester === '1' ? '1' : undefined;

  const subjectYearMap = new Map<string, string>();
  allSubjects.forEach((s) => subjectYearMap.set(s.id, s.yearId));

  const allYears = DataService.getAcademicYears();
  const activeYears = allYears.filter((yr) => {
    if (yr.id === '1') return true;
    const hasLec = liveLectures.some(
      (l) => (l.yearId || subjectYearMap.get(l.subjectId) || '1') === yr.id
    );
    const hasQuiz = quizzesList.some(
      (q) => (subjectYearMap.get(q.subjectId) || '1') === yr.id
    );
    return hasLec || hasQuiz;
  });

  return (
    <div className="w-full pb-20 overflow-x-hidden">
      {/* 1. Hero Section with Interactive 3D Stethoscope */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-6 pb-10 sm:pt-10 sm:pb-16 border-b border-slate-200/60 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-[11px] sm:text-xs font-bold border border-teal-200 dark:border-teal-700">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>مقررات وملخصات السنة الأولى (الفرقة الأولى) تمريض 🩺</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                ملخصات، مذكرات، ومواد تمريض{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-emerald-500">
                  السنة الأولى 🩺
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                مرحباً بك في منصة <strong>ملخصات تمريض</strong>. بنك رقمي متكامل مخصص لطلاب <strong>السنة الأولى</strong> بكليات ومعاهد التمريض، تشمل كل محاضرة 5 موارد متكاملة: <strong>ملف PDF للطباعة، عروض بوربوينت PPT، خرائط ذهنية Mind Maps، كروت استذكار فلاش كاردز تفاعلية، وملخص صوتي وشرح Audio 🎧</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
                {activeYears.map((yr) => (
                  <Link
                    key={yr.id}
                    href={`/year/${yr.id}`}
                    className="w-full sm:w-auto px-6 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تصفح مواد {yr.title}</span>
                  </Link>
                ))}

                {platformFeatures.whatsappButton && (
                  <a
                    href={BOT_CONFIG.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>انضم لجروب الواتساب الرسمي</span>
                  </a>
                )}
              </div>

              {/* Quick Trust Badges */}
              {platformFeatures.statsBar && (
                <div className="pt-3 grid grid-cols-3 gap-1.5 sm:gap-3 max-w-lg mx-auto lg:mx-0 text-center">
                  <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <span className="block text-base sm:text-xl font-black text-teal-600 dark:text-teal-400">الفرقة الأولى</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">مقررات تأسيسية</span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <span className="block text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400">5 في 1</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">شامل كل الموارد</span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <span className="block text-base sm:text-xl font-black text-sky-600 dark:text-sky-400">100%</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">شامل للامتحانات</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Real Interactive 3D Stethoscope Canvas (No clutter!) */}
            <div className="lg:col-span-5">
              <StethoscopeHero />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top AdSense Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSenseBanner position="header" slotId="9876543210" label="إعلان ممول - منصة ملخصات تمريض" />

        {/* 🚀 Shakib Rakib Golden Banner (باقة شاكب راكب الشهرية الشاملة) */}
        {platformFeatures.shakibRakib && shakibConfig.isEnabled !== false && (
          <ShakibRakibBanner
            price={shakibConfig.price || 10}
            yearId="1"
            yearTitle="السنة الأولى"
            monthLabel={shakibConfig.monthLabel}
          />
        )}
      </div>

      {/* 3. Academic Years Sections (Only years with content are displayed) */}
      {activeYears.map((yr) => {
        const yrSubjects = allSubjects.filter((s) => s.yearId === yr.id);
        return (
          <section key={yr.id} id={`year-${yr.id}-subjects`} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold mb-2 border border-teal-200 dark:border-teal-800">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>مقررات {yr.badge} المعتمدة</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  مواد {yr.title} ({yr.stageName})
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  اختر المادة لتصفح المحاضرات، وتحميل الـ PDF والبوربوينت والخرائط وفلاش كاردز والملخصات الصوتية 🎧
                </p>
              </div>

              <Link
                href={`/year/${yr.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition self-start md:self-auto shadow-sm"
              >
                <span>عرض كل مقررات {yr.title}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            <SemesterSubjectsBrowser
              subjects={yrSubjects}
              lectures={liveLectures}
              quizzesList={quizzesList}
              isAdmin={false}
              initialSemester={initialSemester}
              gridCols={4}
            />
          </section>
        );
      })}

      {/* 4. Pedagogical 5-Resource Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white shadow-2xl border border-teal-800/30">
          <div className="max-w-3xl mb-8">
            <span className="text-teal-400 text-xs font-bold tracking-wider uppercase block mb-2">
              هيكل المحاضرة المتكامل
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              5 عناصر أساسية في كل محاضرة لمساعدتك على التفوق 🌟
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">1. ملخصات PDF</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ملفات منسقة جاهزة للطباعة والمذاكرة السريعة مع الرسوم التوضيحية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3">
                <Presentation className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">2. عروض PPT</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                سلايدات الشرح الجامعي الرسمي مع الملاحظات الإيضاحية للمحاضرات.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-3">
                <GitFork className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">3. خرائط ذهنية</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                مخططات بصرية شاملة تختصر المقرر في شجرة مفاهيم مترابطة.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">4. كروت فلاش كاردز</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                بطاقات استذكار سريعة بنظام Flip Card لترسيخ المصطلحات والأدوية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center mb-3">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">5. ملخصات صوتية Audio</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                تسجيل وشرح صوتي مركز يلخص أهم نقاط المحاضرة لترسيخ الفهم السريع أثناء التنقل.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. In-content AdSense placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSenseBanner position="in-content" slotId="5432109876" label="إعلان ممول - المحتوى التعليمي" />
      </div>
    </div>
  );
}
