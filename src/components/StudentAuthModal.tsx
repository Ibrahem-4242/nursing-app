'use client';

import React, { useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  X,
  User,
  Phone,
  GraduationCap,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  ShieldAlert,
  Clock,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

export default function StudentAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register } = useStudentAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedMessage, setSuspendedMessage] = useState('');

  React.useEffect(() => {
    setMode(authModalMode);
    setFeedback(null);
    setIsSuspended(false);
    setSuspendedMessage('');
  }, [authModalMode, isAuthModalOpen]);

  React.useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
      setCountdownSeconds(diff);
      if (diff <= 0) {
        setLockedUntil(null);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(phone, password);
        if (res.success) {
          setIsSuspended(false);
          setSuspendedMessage('');
          setLockedUntil(null);
          setCountdownSeconds(0);
          setFeedback({ type: 'success', message: res.message });
          setTimeout(() => closeAuthModal(), 1200);
        } else {
          if (res.isSuspended || res.message?.includes('تم تعليق وتجميد')) {
            setIsSuspended(true);
            setSuspendedMessage(res.message);
          } else {
            setIsSuspended(false);
            setSuspendedMessage('');
          }
          if (res.locked && res.lockedUntil) {
            setLockedUntil(res.lockedUntil);
            const secs = Math.max(0, Math.ceil((res.lockedUntil - Date.now()) / 1000));
            setCountdownSeconds(secs);
          }
          if (!res.isSuspended && !res.message?.includes('تم تعليق وتجميد')) {
            setFeedback({ type: 'error', message: res.message });
          }
        }
      } else {
        const res = await register(phone, name, university, password, selectedYearId);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
          setTimeout(() => closeAuthModal(), 1200);
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {mode === 'login' ? 'تسجيل دخول الطالب 🎓' : 'إنشاء حساب طالب جديد 🩺'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'سجل دخولك لتصفح وفتح المحاضرات المشتراة'
                  : 'أنشئ حسابك للاشتراك وشراء المحاضرات ومتابعة مذاكرتك'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 gap-1.5 relative z-10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFeedback(null);
              setIsSuspended(false);
              setSuspendedMessage('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-teal-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFeedback(null);
              setIsSuspended(false);
              setSuspendedMessage('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-teal-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم بالكامل:
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[0-9\u0660-\u0669\u06F0-\u06F9]/g, '');
                      setName(clean);
                    }}
                    placeholder="اكتب اسمك ثلاثي أو رباعي (حروف فقط بدون أرقام)..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  جامعتك / كليتك:
                </label>
                <div className="relative">
                  <GraduationCap className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="مثال: تمريض القاهرة، تمريض عين شمس، معهد فني صحي..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الفرقة الدراسية (لتخصيص الإشعارات والمحاضرات):
                </label>
                <div className="relative">
                  <BookOpen className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="1">🩺 الفرقة الأولى (السنة الأولى)</option>
                    <option value="2">🩺 الفرقة الثانية (السنة الثانية)</option>
                    <option value="3">🩺 الفرقة الثالثة (السنة الثالثة)</option>
                    <option value="4">🩺 الفرقة الرابعة (السنة الرابعة)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رقم الهاتف:
            </label>
            <div className="relative">
              <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  const clean = e.target.value
                    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
                    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
                    .replace(/[^0-9]/g, '');
                  setPhone(clean);
                }}
                placeholder="أرقام فقط (مثال: 01012345678)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور (الباسورد):
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اختر كلمة مرور خاصة بحسابك..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'login' && lockedUntil && countdownSeconds > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/50 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-bold space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse text-rose-600" />
                <span>حساب معلق مؤقتاً لدواعي الأمان 🔒</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300 font-medium">
                تم تعليق محاولات تسجيل الدخول مؤقتاً لحماية حسابك من محاولات التخمين والاختراق العشوائي بعد إدخال كلمة مرور خاطئة 5 مرات متتالية.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-rose-500/20 text-xs font-mono font-black">
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>الوقت المتبقي لفك القفل:</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-rose-600 text-white shadow-sm text-sm">
                  ⏳ {formatCountdown(countdownSeconds)} متبقية
                </span>
              </div>
            </div>
          )}

          {mode === 'login' && isSuspended && (
            <div className="p-4 rounded-2xl bg-rose-500/15 dark:bg-rose-950/60 border-2 border-rose-500/40 text-rose-900 dark:text-rose-100 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce text-rose-600" />
                <span>حساب معلق ومجمد من قبل الإدارة ⛔</span>
              </div>
              <div className="text-xs leading-relaxed font-bold whitespace-pre-line text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                {suspendedMessage || `⚠️ تم تعليق وتجميد حسابك من قبل إدارة المنصة بسبب نشاط غير مصرح به.\nيرجى التواصل فوراً مع التيم لحل المشكلة على الرقم التالي:\n📞 01148283443`}
              </div>
              <a
                href="https://wa.me/201148283443?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%AA%D9%85%20%D8%AA%D8%B9%D9%84%D9%8A%D9%82%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A%20%D8%B9%D9%84%D9%89%20%D9%85%D9%86%D8%B5%D8%A9%20%D9%85%D9%84%D8%AE%D8%B5%D8%A7%D8%AA%20%D8%AA%D9%85%D8%B1%D9%8A%D8%B6%20%D9%88%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D9%85%D8%B1%D8%A7%D8%AC%D8%B9%D8%AA%D9%87%20%D9%88%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%AA%D9%87."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل مع التيم عبر واتساب (01148283443) 💬</span>
              </a>
            </div>
          )}

          {feedback && (!lockedUntil || countdownSeconds <= 0) && !isSuspended && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || Boolean(mode === 'login' && lockedUntil && countdownSeconds > 0)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-teal-600/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارِ التحقق والمتابعة...</span>
              </>
            ) : mode === 'login' && lockedUntil && countdownSeconds > 0 ? (
              <>
                <Lock className="w-4 h-4 text-rose-200" />
                <span>الحساب معلق مؤقتاً ({formatCountdown(countdownSeconds)} متبقية)</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول الآن 🚀</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب فوراً 🚀</span>
              </>
            )}
          </button>
        </form>

        {/* Note on free content */}
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          💡 المحاضرات المجانية متاحة للتحميل المباشر للجميع بدون الحاجة لحساب. الحساب مخصص لشراء وتفعيل المحاضرات المدفوعة.
        </p>
      </div>
    </div>
  );
}
