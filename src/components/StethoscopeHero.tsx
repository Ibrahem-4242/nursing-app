'use client';

import React from 'react';
import { Stethoscope, HeartPulse, Activity, Sparkles, FileText, Presentation, GitFork, Layers, CheckCircle2 } from 'lucide-react';

export default function StethoscopeHero() {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/30 transition-all duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/40 text-teal-300 text-xs font-bold shadow-sm">
          <Stethoscope className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>السماعة الطبية والتقييم السريري الشامل</span>
        </div>

        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>جاهزية للامتحانات 100%</span>
        </span>
      </div>

      {/* Central Visual Showcase: Ultra-Chic Stethoscope Centerpiece */}
      <div className="relative flex flex-col items-center justify-center py-6 sm:py-8 my-2">
        {/* Glowing Aura Rings */}
        <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-teal-500/10 animate-ping opacity-30" />
        <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-teal-400/20 animate-pulse" />

        {/* Floating Stethoscope Icon Medallion */}
        <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-teal-500/40 border-2 border-white/20 transform hover:scale-105 transition-transform duration-300">
          <Stethoscope className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2] drop-shadow-md text-white" />
        </div>

        {/* Animated ECG Pulse Wave Underneath */}
        <div className="w-full max-w-xs mt-6 flex items-center justify-center gap-1 opacity-80">
          <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
          <svg className="w-full h-8 text-teal-400" viewBox="0 0 200 40" fill="none" stroke="currentColor">
            <path
              d="M0 20 L40 20 L48 8 L54 32 L62 2 L70 38 L76 20 L120 20 L128 10 L134 30 L142 20 L200 20"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]"
            />
          </svg>
          <HeartPulse className="w-5 h-5 text-rose-400 animate-bounce" />
        </div>
      </div>

      {/* 4 Core Resources Mini-Grid: PDF, PPT, Mindmap, Flashcards */}
      <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 text-center">
        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-teal-500/50 transition">
          <FileText className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <span className="block text-[11px] font-bold text-slate-200">ملفات PDF</span>
          <span className="text-[10px] text-slate-400">جاهزة للطباعة</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-teal-500/50 transition">
          <Presentation className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className="block text-[11px] font-bold text-slate-200">عروض بوربوينت</span>
          <span className="text-[10px] text-slate-400">سلايدات الكلية</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-teal-500/50 transition">
          <GitFork className="w-4 h-4 text-sky-400 mx-auto mb-1" />
          <span className="block text-[11px] font-bold text-slate-200">خرائط ذهنية</span>
          <span className="text-[10px] text-slate-400">ربط المفاهيم</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-teal-500/50 transition">
          <Layers className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className="block text-[11px] font-bold text-slate-200">فلاش كاردز</span>
          <span className="text-[10px] text-slate-400">تفاعلية وسريعة</span>
        </div>
      </div>

      {/* Bottom Subtext */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          <span>تغطية شاملة للسنوات 1، 2، 3، 4</span>
        </span>
        <span className="text-[11px] text-teal-300 font-mono">🩺 Clinical Auscultation</span>
      </div>
    </div>
  );
}
