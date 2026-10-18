'use client';

import React, { useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import PurchaseLectureModal from '@/components/PurchaseLectureModal';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Crown,
  BookOpen,
  ArrowLeft,
  Calendar,
  Lock,
} from 'lucide-react';

interface ShakibRakibBannerProps {
  price?: number;
  yearId?: string;
  yearTitle?: string;
  monthLabel?: string;
}

export default function ShakibRakibBanner({
  price = 10,
  yearId = '1',
  yearTitle = 'السنة الأولى',
  monthLabel = 'اشتراك الشهر الحالي (شامل كل المواد)',
}: ShakibRakibBannerProps) {
  const { student, hasShakibRakib, shakibRakibDaysRemaining, openAuthModal } = useStudentAuth();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleOpenPurchase = () => {
    if (!student) {
      openAuthModal('register');
      return;
    }
    setIsPurchaseModalOpen(true);
  };

  return (
    <>
      <section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-amber-500/20 my-8 border-2 border-amber-300/40"
        dir="rtl"
      >
        {/* Decorative Golden Ambient Elements */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Content Info */}
          <div className="space-y-3.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black border border-white/30 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                <span>باقة شاكب راكب الشهرية 🚀</span>
              </span>

              {hasShakibRakib ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>اشتراكك مفعّل ونشط (باقي {shakibRakibDaysRemaining} يوم)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/30 text-yellow-100 text-xs font-bold border border-yellow-300/30">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>وفر أكثر من 90% من شراء كل محاضرة مفردة</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              🚀 اشترك في باقة شاكب راكب الشهرية بـ{' '}
              <span className="underline decoration-yellow-300 underline-offset-4 decoration-4">
                {price} ج.م
              </span>{' '}
              فقط وافتح جميع مواد ومحاضرات الشهر كاملة دفعة واحدة!
            </h2>

            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              تشمل جميع مواد {yearTitle} (تشريح، فسيولوجي، تمريض، وكل المقررات) بمعدل كافة محاضرات هذا الشهر، بجميع مواردها: <strong>ملخصات PDF جاهزة للطباعة، عروض PPT، خرائط ذهنية، كروت استذكار فلاش كاردز، والشروحات الصوتية 🎧</strong>.
            </p>

            {/* Feature Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-bold text-amber-100">
              <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>فتح فوري لكافة المواد</span>
              </span>
              <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-xl">
                <BookOpen className="w-3.5 h-3.5 text-yellow-300" />
                <span>شامل جميع محاضرات الشهر</span>
              </span>
              <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-yellow-300" />
                <span>ساري لمدة 30 يوماً كاملة</span>
              </span>
            </div>
          </div>

          {/* Action Button & Pricing Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3 flex-shrink-0">
            <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 text-center sm:text-right lg:text-center w-full sm:w-auto">
              <span className="text-[11px] font-bold text-amber-100 block">سعر باقة هذا الشهر</span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {price} <span className="text-xs font-bold text-amber-200">ج.م فقط / شهرياً</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenPurchase}
              className="px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-black text-sm sm:text-base shadow-2xl active:scale-95 transition flex items-center justify-center gap-2 border border-amber-300/40"
            >
              <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span>
                {hasShakibRakib
                  ? 'تمديد / تجديد باقة شاكب راكب 🚀'
                  : 'اشترك الآن في باقة شاكب راكب 🚀'}
              </span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* The Unified Modal */}
      <PurchaseLectureModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        lectureId={`shakib-rakib-${yearId}`}
        lectureTitle="باقة شاكب راكب الشهرية 🚀"
        subjectTitle={`جميع مواد ${yearTitle}`}
        orderType="shakib_rakib"
        yearId={yearId}
        monthLabel={monthLabel}
        price={price}
      />
    </>
  );
}
