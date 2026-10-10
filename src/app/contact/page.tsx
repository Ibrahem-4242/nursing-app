'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Send, Phone, Mail, Clock, MessageSquare, CheckCircle2, Stethoscope } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'اتصل بنا والدعم' }]} />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            <span>خدمة ودعم طلاب التمريض</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            تواصل معنا (Contact & Support)
          </h1>
          <p className="text-sm text-slate-500">
            يسعدنا استقبال استفساراتكم حول الملخصات، تفعيل الاشتراكات، أو طلب إضافة محاضرات جديدة
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-teal-300 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-400" />
                <span>قنوات التواصل الرسمية</span>
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 -rotate-45" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">بوت وقناة التليجرام:</span>
                    <a
                      href={BOT_CONFIG.telegramBotLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-white hover:text-teal-300 transition"
                    >
                      {BOT_CONFIG.botName}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">رقم الهاتف وكاش للدعم:</span>
                    <span className="font-mono font-bold text-teal-300 text-base">
                      {BOT_CONFIG.adminContactPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">مواعيد العمل الرسمية:</span>
                    <span className="font-medium text-slate-200">
                      {BOT_CONFIG.workHours}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">البريد الإلكتروني للأكاديميا:</span>
                    <span className="font-mono text-slate-200">
                      support@nursinghub-edu.org
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment info notice */}
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs leading-relaxed">
              <span className="font-bold block mb-1">💳 لتفعيل المحتوى المدفوع فوراً:</span>
              يرجى تحويل الرسوم عبر اتصالات كاش على الرقم أعلاه، ثم إرسال سكرين التحويل عبر رسائل البوت وسيتم التفعيل والتأكيد خلال دقائق.
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">تم استلام رسالتك بنجاح!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  شكراً لتواصلك معنا يا {formData.name || 'زميلنا'}. سيقوم فريق الإدارة والتدريس بمراجعة استفسارك والرد عليك في أقرب وقت.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
                >
                  إرسال استفسار آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">أرسل استفسارك أو اقتراحك</h3>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالكامل (أو اسم الطالب):</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / الواتساب:</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="مثال: 011xxxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">السنة الدراسية:</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-sm bg-white"
                    >
                      <option value="السنة الأولى">السنة الأولى 🩺</option>
                      <option value="السنة الثانية">السنة الثانية 🧪</option>
                      <option value="السنة الثالثة">السنة الثالثة 💉</option>
                      <option value="السنة الرابعة">السنة الرابعة 🏥</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نص الاستفسار أو الملاحظة:</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب استفسارك بالتفصيل هنا..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-sm"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 -rotate-45" />
                  <span>إرسال الرسالة للإدارة الآن</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
