'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone, Share2, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export function triggerPWAInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
  }
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker for PWA criteria
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Successfully registered
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Check if already installed (standalone mode)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (checkStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 4. Check if dismissed recently (within 5 days)
    const dismissedAt = localStorage.getItem('nursing_pwa_dismissed_at');
    const isDismissed =
      dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 5 * 24 * 60 * 60 * 1000;

    // 5. Listen to beforeinstallprompt on Chromium/Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed && !checkStandalone) {
        // Small delay so student has a moment to view the content first
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    // 6. Listen for app installed event
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      localStorage.setItem('nursing_pwa_installed', 'true');
    };

    // 7. Manual trigger event listener
    const handleManualTrigger = () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else if (isAppleDevice) {
        setShowIOSModal(true);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    // For iOS users who haven't installed and haven't dismissed, show after 3s
    if (isAppleDevice && !isDismissed && !checkStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        localStorage.setItem('nursing_pwa_installed', 'true');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback instructions
      alert('لتثبيت التطبيق: افتح قائمة المتصفح (⋮) ثم اضغط على "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('nursing_pwa_dismissed_at', Date.now().toString());
  };

  if (isInstalled) return null;

  return (
    <>
      {/* FLOATING PWA INSTALL BANNER */}
      {showBanner && (
        <aside
          aria-label="تثبيت تطبيق ملخصات تمريض"
          className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-500"
          dir="rtl"
        >
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 text-white border-2 border-teal-500/60 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col gap-3.5">
            {/* Background decorative glow */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 flex-shrink-0">
                  <Smartphone className="w-6 h-6 stroke-[2.3]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-white">تطبيق ملخصات تمريض 📱</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                      مجاني
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    📲 ثبّت تطبيق ملخصات تمريض على شاشة هاتفك لتصفح أسرع وبدون استهلاك للإنترنت
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 relative z-10">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-600/30 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت التطبيق الآن 🚀</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-3 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs active:scale-95 transition"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* IOS SAFARI STEP-BY-STEP INSTALL GUIDE MODAL */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSModal(false);
          }}
        >
          <div className="w-full max-w-md bg-slate-900 border-2 border-teal-500/50 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600/20 text-teal-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">تثبيت التطبيق على آيفون (iOS)</h3>
                  <p className="text-[11px] text-slate-400">خطوات سهلة في ثوانٍ معدودة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-7 h-7 rounded-xl bg-teal-600/30 text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>اضغط على زر المشاركة</span>
                    <Share2 className="w-4 h-4 text-teal-400 inline" />
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ستجد أيقونة المشاركة في شريط الأدوات أسفل متصفح Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-7 h-7 rounded-xl bg-teal-600/30 text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>اختر &ldquo;إضافة إلى الشاشة الرئيسية&rdquo;</span>
                    <PlusSquare className="w-4 h-4 text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-slate-400">
                    (Add to Home Screen) من قائمة الخيارات المنسدلة.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-7 h-7 rounded-xl bg-teal-600/30 text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>اضغط على &ldquo;إضافة&rdquo; (Add)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-slate-400">
                    في أعلى الزاوية، ليظهر تطبيق المنصة فوراً على شاشتك الرئيسية!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIOSModal(false);
                setShowBanner(false);
              }}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition"
            >
              فهمت ذلك، شكراً لك 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
