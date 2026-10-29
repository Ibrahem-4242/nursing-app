'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, BarChart3, AlertCircle } from 'lucide-react';

export default function StudentDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[StudentDashboard Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            لوحة إحصائيات الطالب 📊
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            حدث تنشيط في المتصفح أو تأخر مؤقت في الاتصال، اضغط إعادة المحاولة لعرض إحصائياتك فوراً.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة الآن</span>
          </button>
          <Link
            href="/"
            className="w-full py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm hover:bg-slate-200 transition text-center"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
