import React from 'react';
import Link from 'next/link';
import { DataService } from '@/lib/data-service';
import MedicalHero3D from '@/components/ThreeD/MedicalHero3D';
import AdSenseBanner from '@/components/AdSenseBanner';
import { BOT_CONFIG } from '@/lib/mock-data';
import {
  Stethoscope,
  BookOpen,
  Send,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  FileCheck2,
  BrainCircuit,
  Layers,
  HeartPulse,
} from 'lucide-react';

export default function HomePage() {
  const years = DataService.getAcademicYears();

  return (
    <div className="w-full pb-20">
      {/* 1. Hero Section with Three.js 3D Visualizer */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 pt-10 pb-16 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>المنصة التفاعلية المعتمدة لطلاب كليات ومعاهد التمريض 🩺</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                ملخصات، كويزات، ومجسمات تمريض{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-600 to-emerald-600">
                  ثلاثية الأبعاد 3D
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                حوّل دراستك التمريضية إلى تجربة سريرية ممتعة. تصفح ملخصات سنوات التمريض الأربع، حمّل عروض البوربوينت والخرائط الذهنية، واختبر معلوماتك ببطاقات الاستذكار ثلاثية الأبعاد والكويزات الفورية.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#academic-years"
                  className="px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح السنوات الدراسية</span>
                </a>

                <a
                  href={BOT_CONFIG.telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-teal-400 text-slate-700 hover:text-teal-700 font-bold text-sm shadow-sm active:scale-95 transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-sky-500 -rotate-45" />
                  <span>فتح بوت التليجرام الرسمي</span>
                </a>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 text-center">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xl font-black text-teal-600">4 سنوات</span>
                  <span className="text-[11px] text-slate-500 font-medium">تغطية تامة للمناهج</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xl font-black text-sky-600">Three.js</span>
                  <span className="text-[11px] text-slate-500 font-medium">مجسمات 3D تفاعلية</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xl font-black text-emerald-600">100%</span>
                  <span className="text-[11px] text-slate-500 font-medium">محتوى سريري مدقق</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Three.js 3D Canvas */}
            <div className="lg:col-span-5">
              <MedicalHero3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top AdSense Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSenseBanner position="header" slotId="9876543210" label="إعلان ممول - منصة نيرسنج هَب" />
      </div>

      {/* 3. Academic Years Selection Section */}
      <section id="academic-years" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>اختر سنتك الدراسية للبدء</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            مقررات وسنوات دراسة التمريض
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            تم تنظيم المواد والمحاضرات والكويزات بحسب الخطة الدراسية الرسمية المعتمدة لكليات ومعاهد التمريض
          </p>
        </div>

        {/* 4 Academic Year Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {years.map((year) => (
            <Link
              key={year.id}
              href={`/year/${year.id}`}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-teal-400 transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div>
                {/* Year Badge and Number */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${year.color.bg} ${year.color.text} border ${year.color.border}`}>
                    {year.badge}
                  </span>
                  <span className="text-2xl font-black text-slate-200 group-hover:text-teal-200 transition">
                    0{year.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-700 transition mb-1">
                  {year.title}
                </h3>
                <span className="text-xs font-semibold text-slate-400 block mb-3">
                  {year.stageName}
                </span>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6">
                  {year.description}
                </p>
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {year.subjectsCount} مواد معتمدة
                </span>

                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 group-hover:translate-x-[-4px] transition-transform">
                  <span>تصفح المواد</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Pedagogical & Interactive Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white shadow-2xl">
          <div className="max-w-3xl mb-10">
            <span className="text-teal-400 text-xs font-bold tracking-wider uppercase block mb-2">
              تقنيات تعليمية حديثة
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              أدوات تفاعلية صُممت خصيصاً لترسيخ المفاهيم التمريضية والسريرية
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1.5">مجسمات 3D تفاعلية</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                استكشف تشريح الأعضاء وعضلة القلب والأوعية الدموية بحرية بزاوية 360 درجة عبر مكتبة Three.js.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1.5">فلاش كاردز ثلاثية الأبعاد</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                بطاقات استذكار سريعة تدعم التقليب ثلاثي الأبعاد لحفظ المصطلحات الطبية والأدوية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1.5">كويزات بتصحيح فوري</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                اختبارات تجريبية تفاعلية تقدم شروحات نموذجية ولآلئ سريرية لكل سؤال لتجهيزك للامتحانات.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-4">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-1.5">خرائط ذهنية وملخصات</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ملفات PDF وPPT وMindmap عالية الدقة مجهزة للطباعة والمراجعة ليلة الامتحان.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. In-content AdSense placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSenseBanner position="in-content" slotId="5432109876" label="إعلان ممول - المحتوى التعليمي" />
      </div>
    </div>
  );
}
