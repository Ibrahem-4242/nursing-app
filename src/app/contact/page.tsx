'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    year: 'السنة الأولى',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'اتصل بنا والدعم' }]} />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-700">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>خدمة ودعم طلاب التمريض</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            تواصل معنا (Contact & Support)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            يسعدنا استقبال استفساراتكم واقتراحاتكم حول ملخصات التمريض والكويزات وسنقوم بالرد عليكم سريعاً
          </p>
        </div>

        {/* Clean Centered Contact Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl transition-colors duration-200">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">تم استلام رسالتك بنجاح!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                شكراً لتواصلك معنا يا {formData.name || 'زميلنا'}. سيتم مراجعة استفسارك والرد عليك في أقرب وقت عبر رقم هاتفك أو الواتساب.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-teal-600/20"
              >
                إرسال استفسار آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                أرسل استفسارك أو طلبك
              </h3>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الاسم بالكامل (أو اسم الطالب):
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الهاتف / الواتساب:
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: 011xxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition"
                  />
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
                  نص الاستفسار أو الملاحظة:
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="اكتب استفسارك بالتفصيل هنا..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 text-sm transition"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 -rotate-45" />
                <span>إرسال الرسالة للإدارة الآن</span>
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
              لتبادل الاستفسارات ومناقشة أسئلة الكويزات والامتحانات أولاً بأول مع زملائك.
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti"
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
