'use client';

import React, { useState } from 'react';
import { AlertCircle, X, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface ReportBrokenLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  lectureTitle: string;
  subjectTitle: string;
  linkUrl: string;
  lectureId?: string;
}

export default function ReportBrokenLinkModal({
  isOpen,
  onClose,
  lectureTitle,
  subjectTitle,
  linkUrl,
  lectureId,
}: ReportBrokenLinkModalProps) {
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/report-broken-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId,
          lectureTitle,
          subjectTitle,
          linkUrl,
          userNote: note.trim(),
          userPhone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setNote('');
          setPhone('');
          onClose();
        }, 2200);
      }
    } catch (err) {
      console.error('[ReportBrokenLink] Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              تم إرسال البلاغ بنجاح!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              وصل إشعار فوري للأدمن عبر تيليجرام وسنقوم بفحص الرابط وتعديله في أسرع وقت. شكراً لمساعدتك يا بطل 🩺
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  الإبلاغ عن رابط لا يعمل ⚠️
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lectureTitle} • {subjectTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              إذا واجهت مشكلة في تحميل الملف أو ظهرت لك صفحة فارغة، أبلغنا فوراً وسيصل تنبيه مباشر للأدمن لحل المشكلة فوراً.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تفاصيل المشكلة (اختياري):
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: الملف لا يحمل، أو الرابط يفتح صفحة بيضاء..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>رقم هاتفك / الواتساب (اختياري):</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">لإعلامك فور حل الرابط</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 011xxxxxxxx"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-right"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارِ الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال البلاغ الآن ⚠️</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
