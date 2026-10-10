'use client';

import React from 'react';
import { MessageCircle, CheckCircle, X, Sparkles, ArrowLeft, HeartHandshake } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';

interface WhatsAppJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  lectureTitle?: string;
}

export default function WhatsAppJoinModal({
  isOpen,
  onClose,
  lectureTitle,
}: WhatsAppJoinModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-right">
        {/* Background Decorative Glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Download Success Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>تم بدء التحميل بنجاح! 🎉</span>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 flex-shrink-0">
            <MessageCircle className="w-7 h-7 fill-white/20" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              لا تفوّت باقي المحاضرات والمراجعات! 🩺
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lectureTitle ? `مذاكرة موفقة لـ "${lectureTitle}"` : 'منصة ملخصات تمريض'}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          انضم الآن لجروب الواتساب الرسمي المعتمد لدفعة تمريض لتصلك التحديثات، الخرائط الذهنية، ومذكرات الميدتيرم والفاينال فور نزولها أولاً بأول مع زملائك!
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={BOT_CONFIG.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 active:scale-95 transition flex items-center justify-center gap-2 group"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>انضم لجروب الواتساب الرسمي الآن 🟢</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            سأنضم لاحقاً • متابعة التصفح
          </button>
        </div>
      </div>
    </div>
  );
}
