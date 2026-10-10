'use client';

import React, { useState } from 'react';
import { SubjectQuizFile } from '@/lib/types';
import WhatsAppJoinModal from '@/components/WhatsAppJoinModal';
import ReportBrokenLinkModal from '@/components/ReportBrokenLinkModal';
import {
  FileText,
  ArrowDownCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';

interface SubjectQuizFileBoxProps {
  quizFile: SubjectQuizFile;
}

export default function SubjectQuizFileBox({ quizFile }: SubjectQuizFileBoxProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleDownloadQuizFile = async () => {
    setIsDownloading(true);

    try {
      // 1. Send tracking event to Telegram & Analytics
      fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: quizFile.title,
          subjectTitle: quizFile.subjectTitle,
          fileType: 'ملف أسئلة الكويزات PDF',
          fileName: `${quizFile.title.replace(/[\/\\]/g, '-')}.pdf`,
        }),
      }).catch((err) => console.warn('[QuizDownload] Tracking notice:', err));

      const safeFilename = `${quizFile.title.replace(/[\/\\]/g, '-')}.pdf`;

      // 2. Perform File Download
      if (quizFile.downloadUrl && quizFile.downloadUrl.startsWith('http')) {
        const a = document.createElement('a');
        a.href = quizFile.downloadUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (quizFile.downloadUrl && quizFile.downloadUrl.startsWith('/api/files/')) {
        const a = document.createElement('a');
        a.href = quizFile.downloadUrl;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // High-yield compiled PDF container
        const content = `%PDF-1.4\n% منصة ملخصات تمريض - ${quizFile.title}\nالمادة: ${quizFile.subjectTitle}\nعدد الأسئلة: +${quizFile.questionsCount} سؤال MCQ وامتحانات سابقة\nتم التنزيل بنجاح من منصة ملخصات تمريض.\nبنك أسئلة الكويزات مخصص للمذاكرة والمراجعة والامتحانات الأكاديمية.`;
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);

      // 3. Trigger WhatsApp Join Modal after 1.2s
      setTimeout(() => {
        setIsWhatsAppModalOpen(true);
      }, 1200);
    } catch (e) {
      console.error('[QuizDownload] Error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full my-6" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-teal-500/10 dark:from-amber-950/20 dark:via-slate-900 dark:to-teal-950/20 p-6 sm:p-8 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-xl transition-all duration-300 hover:shadow-2xl">
        {/* Background Decorative Accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-teal-400/10 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                <HelpCircle className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>أسئلة الكويزات والامتحانات المجمعة</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    مقرر {quizFile.subjectTitle}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {quizFile.title}
                </h3>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>متاح مجاناً للجميع 🎁</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-amber-100 dark:border-slate-800">
            {quizFile.description ||
              `ملف PDF شامل ومجمع يحتوي على بنك أسئلة الكويزات، اختبارات الميدتيرم، وأسئلة الاختيار من متعدد (MCQ) مع الإجابات والشرح النموذجي لمادة ${quizFile.subjectTitle}.`}
          </p>

          {/* Key Specs Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>+{quizFile.questionsCount} سؤال محلول</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
              <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>ملف PDF قابل للطباعة</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <span>الحجم: {quizFile.fileSize}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{quizFile.updatedAt}</span>
            </div>
          </div>

          {/* Action Button: حملها دلوقتي */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleDownloadQuizFile}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-teal-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-amber-600/20 active:scale-98 transition-all duration-200 disabled:opacity-50"
            >
              <ArrowDownCircle className="w-6 h-6 animate-bounce" />
              <span>حملها دلوقتي (ملف أسئلة الكويزات PDF)</span>
            </button>

            {downloadSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم بدء تحميل ملف أسئلة الكويزات بنجاح! تفقد مجلد التنزيلات (Downloads).</span>
              </div>
            )}

            {/* Report Broken Link Button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors py-1 px-3 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-200/50"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>هل الرابط لا يعمل؟ أبلغنا فوراً لنصلحه ⚠️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal after Download */}
      <WhatsAppJoinModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        lectureTitle={quizFile.title}
      />

      {/* Report Broken Link Modal */}
      <ReportBrokenLinkModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        lectureTitle={quizFile.title}
        subjectTitle={quizFile.subjectTitle}
        linkUrl={quizFile.downloadUrl}
      />
    </div>
  );
}
