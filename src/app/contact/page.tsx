'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Send, CheckCircle2, MessageSquare, AlertCircle, Loader2, Phone, Sparkles } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    year: 'السنة الأولى',
    type: 'شكوى بخصوص ملف أو رابط عطلان',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.phone.trim()) {
      setErrorMessage('يرجى كتابة رقم الهاتف للتواصل معك');
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage('يرجى كتابة تفاصيل الشكوى أو الرسالة');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.message || 'حدث خطأ أثناء الإرسال، حاول مجدداً');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى المحاولة بعد قليل أو مراسلتنا عبر الواتساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'الشكاوى والتواصل والدعم' }]} />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-700">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>خدمة ودعم طلاب التمريض والشكاوى المباشرة</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            الشكاوى والتواصل (Complaints & Support)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            عندك شكوى بخصوص رابط، عطل في تحميل ملف، أو استفسار؟ اكتبه هنا وهيتبعت إشعار فوري للإدارة على التيليجرام برقمك للتواصل معك فوراً 🩺
          </p>
        </div>

        {/* Clean Centered Contact Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl transition-colors duration-200">
          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                تم استلام شكواك بنجاح! 🎉
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                شكراً لتواصلك يا {formData.name || 'بطل التمريض'}. تم إرسال إشعار فوري للإدارة عبر التيليجرام برقم هاتفك (<span className="font-bold text-teal-600 dark:text-teal-400" dir="ltr">{formData.phone}</span>) وسيتم مراجعة الطلب والتواصل معك في أسرع وقت.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      phone: '',
                      year: 'السنة الأولى',
                      type: 'شكوى بخصوص ملف أو رابط عطلان',
                      message: '',
                    });
                  }}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-teal-600/20"
                >
                  إرسال شكوى أو استفسار آخر
                </button>
                <a
                  href={BOT_CONFIG.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  جروب الواتساب للمساعدة السريعة 💬
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    نموذج إرسال الشكاوى والملاحظات
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    سيصل إشعار فوري على بوت التيليجرام لإدارة المنصة
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الاسم بالكامل (أو اسم الطالب):
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>رقم الهاتف / الواتساب: <span className="text-rose-500">*</span></span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">يصل للبوت للتواصل معك</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="مثال: 011xxxxxxxx"
                      dir="ltr"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    السنة الدراسية:
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 text-sm transition"
                  >
                    <option value="السنة الأولى">السنة الأولى 🩺</option>
                    <option value="السنة الثانية">السنة الثانية 🧪</option>
                    <option value="السنة الثالثة">السنة الثالثة 💉</option>
                    <option value="السنة الرابعة">السنة الرابعة 🏥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نوع الرسالة / الشكوى:
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 text-sm transition"
                >
                  <option value="شكوى بخصوص ملف أو رابط عطلان">⚠️ شكوى بخصوص ملف أو رابط عطلان</option>
                  <option value="شكوى عامة في المنصة">📢 شكوى أو ملاحظة عامة</option>
                  <option value="طلب ملخص أو مادة جديدة">📖 طلب رفع ملخص أو مذكرات جديدة</option>
                  <option value="استفسار أو اقتراح">💡 استفسار دراسي أو اقتراح للمنصة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>تفاصيل الشكوى أو الرسالة: <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">وضح التفاصيل ورابط المحاضرة إن أمكن</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="اكتب شكواك أو استفسارك بالتفصيل هنا..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارِ إرسال الشكوى لبوت الإدارة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 -rotate-45" />
                    <span>إرسال الشكوى للإدارة الآن بالرقم 📨</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* WhatsApp Group Banner */}
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm block">
              💬 هل تود الانضمام لجروب دفعة التمريض على الواتساب؟
            </span>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              لتبادل الاستفسارات ومناقشة أسئلة المحاضرات والامتحانات أولاً بأول مع زملائك.
            </p>
          </div>
          <a
            href={BOT_CONFIG.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition flex-shrink-0 shadow-sm"
          >
            <span>انضم لجروب الواتساب 💬</span>
          </a>
        </div>
      </div>
    </div>
  );
}
