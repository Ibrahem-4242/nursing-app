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
} from 'lucide-react';

import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const liveSubjects = await CmsService.getLiveSubjects();
  const year1Subjects = liveSubjects.length > 0 ? liveSubjects : DataService.getSubjectsByYear('1');

  return (
    <div className="w-full pb-20">
      {/* 1. Hero Section with Interactive 3D Stethoscope */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-10 pb-16 border-b border-slate-200/60 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-700">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>مقررات وملخصات السنة الأولى (الفرقة الأولى) تمريض 🩺</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                ملخصات، مذكرات، ومواد تمريض{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-emerald-500">
                  السنة الأولى 🩺
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                مرحباً بك في منصة <strong>ملخصات تمريض</strong>. بنك رقمي متكامل مخصص لطلاب <strong>السنة الأولى</strong> بكليات ومعاهد التمريض، تشمل كل محاضرة 4 موارد: <strong>ملف PDF للطباعة، عروض بوربوينت PPT، خرائط ذهنية Mind Maps، وكروت استذكار فلاش كاردز تفاعلية</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/year/1"
                  className="px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح مواد السنة الأولى</span>
                </Link>

                <a
                  href={BOT_CONFIG.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>انضم لجروب الواتساب الرسمي</span>
                </a>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 text-center">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="block text-xl font-black text-teal-600 dark:text-teal-400">الفرقة الأولى</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">مقررات تأسيسية</span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">4 في 1</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">PDF • PPT • خرائط • كروت</span>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="block text-xl font-black text-sky-600 dark:text-sky-400">100%</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">ملخصات شاملة للامتحانات</span>
                </div>
              </div>
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
      </div>

      {/* 3. Primary Feature: Year 1 Subjects Grid (السنة الأولى هي البطل الأساسي) */}
      <section id="year-1-subjects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold mb-2 border border-teal-200 dark:border-teal-800">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>مقررات الفرقة الأولى المعتمدة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              مواد السنة الأولى (العلوم الطبية والتمريضية)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              اختر المادة لتصفح المحاضرات، وتحميل الـ PDF والبوربوينت والخرائط وفلاش كاردز
            </p>
          </div>

          <Link
            href="/year/1"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition self-start md:self-auto shadow-sm"
          >
            <span>عرض كل مقررات السنة الأولى</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Year 1 Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {year1Subjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/subject/${sub.id}`}
              className="group flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold border border-teal-200/60 dark:border-teal-800">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold text-teal-600 dark:text-teal-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{sub.totalLectures} محاضرات</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-2">
                  {sub.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-5">
                  {sub.description}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2 rounded-xl mb-4">
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>PDF • PPT • خرائط • فلاش كاردز</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                  <span>فتح المحاضرات</span>
                  <ArrowLeft className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-slate-400">
                  المحاضرة 1 مجاناً 🎁
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Pedagogical 4-Resource Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white shadow-2xl border border-teal-800/30">
          <div className="max-w-3xl mb-8">
            <span className="text-teal-400 text-xs font-bold tracking-wider uppercase block mb-2">
              هيكل المحاضرة المتكامل
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              4 عناصر أساسية في كل محاضرة لمساعدتك على التفوق
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">1. ملخصات PDF ملونة</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ملفات منسقة جاهزة للطباعة والمذاكرة السريعة مع الرسوم التوضيحية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3">
                <Presentation className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">2. عروض بوربوينت PPT</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                سلايدات الشرح الجامعي الرسمي مع الملاحظات الإيضاحية للمحاضرات.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-3">
                <GitFork className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">3. خرائط ذهنية Mind Map</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                مخططات بصرية شاملة تختصر المقرر في شجرة مفاهيم مترابطة.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1">4. فلاش كاردز تفاعلية</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                بطاقات استذكار سريعة بنظام Flip Card لترسيخ المصطلحات والأدوية.
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
