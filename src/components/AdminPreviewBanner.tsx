'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MaintenanceConfig } from '@/lib/types';
import { Lock, Unlock, Settings, Eye, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import MaintenanceScreen from './MaintenanceScreen';

interface AdminPreviewBannerProps {
  config: MaintenanceConfig;
  onUnlock?: () => void;
}

export default function AdminPreviewBanner({
  config,
  onUnlock,
}: AdminPreviewBannerProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showStudentPreviewModal, setShowStudentPreviewModal] = useState(false);

  const handleQuickUnlock = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في فتح المنصة واستئناف العمل أمام جميع الطلاب الآن؟')) {
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: false }),
      });

      const data = await res.json();
      if (data.success) {
        if (onUnlock) onUnlock();
        window.location.reload();
      } else {
        alert(data.message || 'حدث خطأ في فتح المنصة');
      }
    } catch {
      alert('فشل الاتصال بالخادم، يرجى المحاولة من لوحة التحكم');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-[100] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl border-b border-amber-300/40">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold flex items-center gap-1">
                <Lock className="w-4 h-4 inline-block" />
                المنصة مغلقة حالياً (وضع الصيانة مفعل):
              </span>
              <span className="text-amber-100 hidden md:inline">
                أنت تتصفح في وضع المعاينة الإدارية الخاصة (الطلاب يرون شاشة القفل).
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto flex-wrap">
            {/* Preview what students see */}
            <button
              onClick={() => setShowStudentPreviewModal(true)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-white/20"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة شاشة الطالب</span>
            </button>

            {/* Back to dashboard */}
            <Link
              href="/admin-dashboard"
              className="px-3 py-1 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-white/10"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>لوحة التحكم</span>
            </Link>

            {/* 1-click Quick Unlock */}
            <button
              onClick={handleQuickUnlock}
              disabled={isUnlocking}
              className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-black transition shadow-md flex items-center gap-1.5 border border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الفتح...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>فتح المنصة للجميع الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal to Preview Student View Without Logging Out */}
      {showStudentPreviewModal && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold">
                محاكاة شاشة الطالب
              </span>
              <span className="text-xs text-slate-400">
                هذا هو بالضبط ما يراه أي طالب أو زائر يدخل المنصة الآن
              </span>
            </div>
            <button
              onClick={() => setShowStudentPreviewModal(false)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
            >
              إغلاق المعاينة ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MaintenanceScreen config={config} />
          </div>
        </div>
      )}
    </>
  );
}
