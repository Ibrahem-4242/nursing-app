'use client';

import React, { useState } from 'react';
import { MaintenanceConfig } from '@/lib/types';
import {
  Wrench,
  Clock,
  MessageCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  HeartPulse,
} from 'lucide-react';

interface MaintenanceScreenProps {
  config: MaintenanceConfig;
  onAdminLoginSuccess?: () => void;
}

export default function MaintenanceScreen({
  config,
  onAdminLoginSuccess,
}: MaintenanceScreenProps) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setPinError('يرجى إدخال رمز الدخول');
      return;
    }

    setIsSubmittingPin(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onAdminLoginSuccess) {
            onAdminLoginSuccess();
          } else {
            window.location.reload();
          }
        }, 600);
      } else {
        setPinError(data.message || 'رمز الدخول غير صحيح');
      }
    } catch {
      setPinError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  const whatsappUrl =
    config.contactWhatsapp || 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Search Engine Robots Prevention during Maintenance */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>{config.title || 'المنصة في وضع الصيانة والتحديث'}</title>
      </head>

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 font-black text-xl">
            🩺
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
              ملخصات تمريض
            </h1>
            <p className="text-xs text-slate-400 font-medium">Nursing Study Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
            وضع الصيانة والتحديث
          </span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 text-center relative overflow-hidden">
          {/* Subtle Heartbeat Pulse Line Background */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
            <HeartPulse className="w-96 h-96 text-teal-400" />
          </div>

          {/* Icon Badge */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/30 flex items-center justify-center shadow-inner relative">
              <Wrench className="w-11 h-11 text-teal-400 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-4 h-4 text-amber-300" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            {config.title || 'المنصة في وضع الصيانة والتحديث المؤقت 🛠️'}
          </h2>

          {/* Custom Admin Message */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 mb-6 text-slate-300 text-sm sm:text-base leading-relaxed text-right whitespace-pre-line shadow-inner">
            {config.message ||
              'نقوم حالياً بإجراء تحديثات وتحسينات دورية لإضافة محاضرات ومحتوى تعليمي جديد وتطوير تجربة التعلم لجميع طلاب تمريض. سنعود إليكم خلال وقت قصير بإذن الله.'}
          </div>

          {/* Estimated Return Pill */}
          {config.estimatedReturn && (
            <div className="inline-flex items-center gap-2.5 bg-teal-950/60 border border-teal-500/30 text-teal-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl mb-8">
              <Clock className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>الموعد المتوقع للافتتاح والعودة:</span>
              <span className="text-white font-bold bg-teal-500/20 px-2 py-0.5 rounded-lg border border-teal-400/30">
                {config.estimatedReturn}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل مع الدعم عبر واتساب</span>
            </a>

            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>إعادة المحاولة والتحقق</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer & Discreet Admin Login Trigger */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-900">
        <div>
          جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة ملخصات تمريض — نعمل دائماً لتقديم الأفضل لزملائنا
        </div>

        {/* Discreet Admin Login Trigger for the Owner */}
        <button
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          title="دخول المشرف لمعاينة المنصة"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>دخول المشرف (للمعاينة)</span>
        </button>
      </footer>

      {/* Admin Login Modal (Guarantees Admin NEVER Gets Locked Out) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setPinError('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">دخول المشرف للمعاينة</h3>
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              أدخل رمز المرور الإداري (PIN) للدخول الفوري وتصفح المنصة بشكل كامل في وضع المعاينة الإدارية الخاصة.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رمز المرور الإداري (PIN):
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••••••••"
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-center text-white text-lg tracking-widest font-mono outline-none transition"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {isSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم التحقق بنجاح! جاري فتح وضع المعاينة...</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingPin || isSuccess}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30"
                >
                  {isSubmittingPin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تسجيل الدخول والمعاينة</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
