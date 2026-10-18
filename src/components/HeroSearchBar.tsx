'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { openGlobalSearch } from '@/components/GlobalSearchModal';

export default function HeroSearchBar() {
  return (
    <div className="pt-1 max-w-xl mx-auto lg:mx-0">
      <button
        type="button"
        onClick={() => openGlobalSearch()}
        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-200/80 dark:border-teal-800/80 hover:border-teal-500 dark:hover:border-teal-400 shadow-lg shadow-teal-700/5 group transition-all text-right cursor-pointer"
        title="البحث الطبي الشامل (Ctrl + K)"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              ابحث عن أي مصطلح، موضوع، أو مرض طبي...
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              (مثال: Shock, CPR, عظام الجمجمة, اتجاهات التشريح)...
            </div>
          </div>
        </div>

        <kbd className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs">
          <span>Ctrl K</span>
        </kbd>
      </button>
    </div>
  );
}
