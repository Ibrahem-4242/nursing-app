'use client';

import React, { useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  X,
  CreditCard,
  Phone,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface PurchaseLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lectureId: string;
  lectureTitle: string;
  subjectTitle: string;
  price?: number;
  onOrderSuccess?: () => void;
}

export default function PurchaseLectureModal({
  isOpen,
  onClose,
  lectureId,
  lectureTitle,
  subjectTitle,
  price = 50,
  onOrderSuccess,
}: PurchaseLectureModalProps) {
  const { student, openAuthModal } = useStudentAuth();

  const [senderPhone, setSenderPhone] = useState('');
  const [contactPhone, setContactPhone] = useState(student?.phone || '');
  const [userMessage, setUserMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopiedWallet, setIsCopiedWallet] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    if (student?.phone) {
      setContactPhone(student.phone);
    }
  }, [student]);

  if (!isOpen) return null;

  // If student somehow opened purchase modal without being logged in
  if (!student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">يجب تسجيل الدخول أو إنشاء حساب أولاً 🔐</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            لشراء المحاضرة والاحتفاظ بها وتفعيلها في حسابك لتفتح معك في أي وقت، يرجى تسجيل الدخول أو إنشاء حساب سريع.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                openAuthModal('register');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
            >
              إنشاء حساب جديد 🩺
            </button>
            <button
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  const WALLET_NUMBER = '01148243443';

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(WALLET_NUMBER);
    setIsCopiedWallet(true);
    setTimeout(() => setIsCopiedWallet(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      setFeedback({ type: 'error', message: 'يرجى كتابة رقم المحفظة الذي قمت بالتحويل منه' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('lectureId', lectureId);
      formData.append('lectureTitle', lectureTitle);
      formData.append('subjectTitle', subjectTitle);
      formData.append('price', String(price));
      formData.append('senderPhone', senderPhone.trim());
      formData.append('contactPhone', (contactPhone || student.phone).trim());
      formData.append('userMessage', userMessage.trim());

      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await fetch('/api/student/purchase', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'تم إرسال طلب الشراء والتحويل بنجاح! سيتم فتح المحاضرة فوراً.',
        });
        if (onOrderSuccess) onOrderSuccess();
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setFeedback({ type: 'error', message: data?.message || 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ في الاتصال، يرجى إعادة المحاولة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                تأكيد شراء واشتراك المحاضرة 💳
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subjectTitle} • {lectureTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 block mb-0.5">
              قيمة الاشتراك وتفعيل المحاضرة:
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {price} <span className="text-sm font-bold text-teal-600">جنية مصري (EGP)</span>
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تفعيل دائم بحسابك</span>
          </span>
        </div>

        {/* Official Transfer Instructions Box as requested by User */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">📢</span>
            <p className="text-xs sm:text-sm font-black leading-relaxed">
              تقدر تحول اجمالي المبلغ اللي انت هتحوله (حسب اللي انت عاوزه) وتكتب في الرسالة عاوز محاضرات اي بالظبط، علي المحفظة علي الرقم دا:
            </p>
          </div>

          {/* Wallet Number Pill with 1-Click Copy */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">رقم المحفظة (فودافون كاش / محافظ إلكترونية):</span>
              <span className="font-mono text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 tracking-wider" dir="ltr">
                {WALLET_NUMBER}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyWallet}
              className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              {isCopiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedWallet ? 'تم النسخ!' : 'نسخ الرقم'}</span>
            </button>
          </div>

          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed pr-1">
            وابعت اسكرين بالتحويل ، والرقم اللي حولت منه بالأسفل 📸👇
          </p>
        </div>

        {/* Form to submit proof and order */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الرقم اللي حوّلت منه (المحفظة) *:
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="مثال: 010xxxxxxxx"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم للتواصل (لو حصلت مشاكل) *:
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="رقمك للتواصل والواتساب..."
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رسالتك / المحاضرات المطلوبة تحديداً (اختياري):
            </label>
            <div className="relative">
              <MessageSquare className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="اكتب هنا أي تفاصيل أو إذا كنت محول لمجموعة محاضرات معينة..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              صورة إيصال التحويل (اسكرين شوت):
            </label>
            <input
              type="file"
              id="screenshot-file-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setScreenshotFile(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('screenshot-file-input')?.click()}
              className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                screenshotFile
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-teal-500'
              }`}
            >
              {screenshotFile ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم إرفاق الإيصال: {screenshotFile.name}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>اضغط هنا لرفع صورة / سكرين شوت إيصال التحويل</span>
                </>
              )}
            </button>
            {screenshotFile && (
              <button
                type="button"
                onClick={() => setScreenshotFile(null)}
                className="text-[11px] text-rose-500 hover:underline block text-center w-full mt-1 font-bold"
              >
                إلغاء الصورة المرفقة
              </button>
            )}
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جارِ إرسال طلب الشراء...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>إرسال تفاصيل التحويل وتأكيد الشراء 🚀</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
