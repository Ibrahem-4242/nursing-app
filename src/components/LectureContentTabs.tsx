'use client';

import React, { useState } from 'react';
import { LectureFile, Flashcard } from '@/lib/types';
import Flashcards3D from '@/components/Flashcards3D';
import AudioWavePlayer from '@/components/AudioWavePlayer';
import WhatsAppJoinModal from '@/components/WhatsAppJoinModal';
import ReportBrokenLinkModal from '@/components/ReportBrokenLinkModal';
import {
  FileText,
  Presentation,
  GitFork,
  Layers,
  Headphones,
  CheckCircle2,
  Info,
  ArrowDownCircle,
  AlertCircle,
  Lock,
  MessageCircle,
} from 'lucide-react';

interface LectureContentTabsProps {
  files: LectureFile[];
  flashcards: Flashcard[];
  subjectTitle: string;
  adminNote?: string;
  lectureId?: string;
  isFree?: boolean;
}

export default function LectureContentTabs({
  files,
  flashcards,
  subjectTitle,
  adminNote,
  lectureId,
  isFree = true,
}: LectureContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'ppt' | 'mindmap' | 'audio' | 'flashcards'>('pdf');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const pdfFile = files.find((f) => f.type === 'pdf') || files[0];
  const pptFile = files.find((f) => f.type === 'ppt') || files[1] || files[0];
  const mindmapFile = files.find((f) => f.type === 'mindmap') || files[2] || files[0];
  const audioFile = files.find((f) => f.type === 'audio') || null;

  const getActiveFile = () => {
    switch (activeTab) {
      case 'pdf':
        return pdfFile;
      case 'ppt':
        return pptFile;
      case 'mindmap':
        return mindmapFile;
      case 'audio':
        return audioFile;
      default:
        return null;
    }
  };

  const hasTrackedFlashcards = React.useRef(false);

  const handleSelectTab = (tab: 'pdf' | 'ppt' | 'mindmap' | 'audio' | 'flashcards') => {
    setActiveTab(tab);
    if (tab === 'flashcards' && !hasTrackedFlashcards.current) {
      hasTrackedFlashcards.current = true;
      fetch('/api/track-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: pdfFile?.title || subjectTitle,
          subjectTitle,
          cardsCount: flashcards?.length || 0,
        }),
      }).catch((e) => console.warn('Flashcard tracking error:', e));
    }
  };

  const getExtension = (file: LectureFile) => {
    if (file.type === 'pdf') return 'pdf';
    if (file.type === 'ppt') return 'pptx';
    if (file.type === 'audio') {
      const lower = (file.downloadUrl || '').toLowerCase();
      if (lower.includes('.m4a')) return 'm4a';
      if (lower.includes('.wav')) return 'wav';
      if (lower.includes('.ogg')) return 'ogg';
      if (lower.includes('.opus')) return 'opus';
      if (lower.includes('.aac')) return 'aac';
      if (lower.includes('.webm')) return 'webm';
      return 'mp3';
    }
    if (file.downloadUrl?.endsWith('.png')) return 'png';
    if (file.downloadUrl?.endsWith('.jpg') || file.downloadUrl?.endsWith('.jpeg')) return 'jpg';
    return 'pdf';
  };

  const handleDownloadNow = async (file: LectureFile) => {
    try {
      // 1. Send Download Tracking Event to Telegram & CMS Analytics
      fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: file.title,
          subjectTitle,
          fileType:
            file.type === 'pdf'
              ? 'ملخص PDF'
              : file.type === 'ppt'
              ? 'عرض بوربوينت PPT'
              : file.type === 'audio'
              ? 'تسجيل صوتي 🎧'
              : 'خريطة ذهنية',
          fileName: file.title,
        }),
      }).catch((e) => console.warn('Tracking download non-blocking notice:', e));

      const extension = getExtension(file);
      const safeFilename = `${file.title.replace(/[\/\\]/g, '-')}.${extension}`;

      // 2. Perform File Download
      if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
        // Direct remote or cloud link
        const a = document.createElement('a');
        a.href = file.downloadUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (file.downloadUrl && file.downloadUrl.startsWith('/api/files/')) {
        const a = document.createElement('a');
        a.href = file.downloadUrl;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Safe formatted downloadable content
        const content = `%PDF-1.4\n% منصة ملخصات تمريض - ${file.title}\nالمادة: ${subjectTitle}\nتم التحميل بنجاح من منصة ملخصات تمريض.\nالمحتوى مخصص للمذاكرة الأكاديمية والامتحانات.`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadSuccess(file.type);
      setTimeout(() => setDownloadSuccess(null), 4000);

      // 3. Trigger WhatsApp Join Modal after 1.2s to encourage community join
      setTimeout(() => {
        setIsWhatsAppModalOpen(true);
      }, 1200);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const activeFile = getActiveFile();

  return (
    <div className="w-full my-8 space-y-6" dir="rtl">
      {/* 1. The Interactive Tabs Selector */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Tab 1: PDF */}
          <button
            onClick={() => handleSelectTab('pdf')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>ملف PDF</span>
          </button>

          {/* Tab 2: PowerPoint */}
          <button
            onClick={() => handleSelectTab('ppt')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'ppt'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Presentation className="w-4 h-4 flex-shrink-0" />
            <span>عروض بوربوينت</span>
          </button>

          {/* Tab 3: Mind Map */}
          <button
            onClick={() => handleSelectTab('mindmap')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'mindmap'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitFork className="w-4 h-4 flex-shrink-0" />
            <span>خريطة ذهنية</span>
          </button>

          {/* Tab 4: Audio Recording */}
          <button
            onClick={() => handleSelectTab('audio')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 relative ${
              activeTab === 'audio'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-4 h-4 flex-shrink-0" />
            <span>ريكورد المحاضرة</span>
            {audioFile && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="متوفر تسجيل صوتي" />
            )}
          </button>

          {/* Tab 5: Flashcards */}
          <button
            onClick={() => handleSelectTab('flashcards')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              activeTab === 'flashcards'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>كروت استذكار</span>
          </button>
        </div>
      </div>

      {/* Empty State if Audio Tab is selected but lecture has no audio attached yet */}
      {activeTab === 'audio' && !audioFile && (
        <div className="bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-violet-950/20 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
            <Headphones className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            لا يتوفر تسجيل صوتي مرفق لهذه المحاضرة حالياً 🎧
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            سيتم إرفاق الريكورد الصوتي فور توفره. يمكنك الآن المذاكرة من ملخص الـ PDF أو عروض البوربوينت أو الخريطة الذهنية والكروت التفاعلية.
          </p>
        </div>
      )}

      {/* 2. File Download & Player Box (for PDF, PPT, Mindmap, Audio) */}
      {activeTab !== 'flashcards' && activeFile && (
        <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-850 dark:to-teal-950/20 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div
                className={`p-4 rounded-2xl ${
                  activeTab === 'pdf'
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    : activeTab === 'ppt'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : activeTab === 'audio'
                    ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'
                    : 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                }`}
              >
                {activeTab === 'pdf' && <FileText className="w-8 h-8" />}
                {activeTab === 'ppt' && <Presentation className="w-8 h-8" />}
                {activeTab === 'mindmap' && <GitFork className="w-8 h-8" />}
                {activeTab === 'audio' && <Headphones className="w-8 h-8" />}
              </div>

              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block mb-1">
                  {activeTab === 'pdf' && 'ملخص المحاضرة المعتمد (PDF)'}
                  {activeTab === 'ppt' && 'سلايدات الشرح الجامعي (PowerPoint)'}
                  {activeTab === 'mindmap' && 'الخريطة الذهنية التفاعلية الشاملة'}
                  {activeTab === 'audio' && 'التسجيل الصوتي لشرح المحاضرة (Audio Record)'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {activeFile.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>الحجم: {activeFile.fileSize}</span>
                  {activeFile.pageCount && <span>• {activeFile.pageCount}</span>}
                  <span>• {activeTab === 'audio' ? 'جاهز للاستماع والتحميل الفوري' : 'جاهز للتنزيل الفوري'}</span>
                </div>
              </div>
            </div>

            {isFree ? (
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>متاح للتحميل المجاني</span>
              </span>
            ) : (
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>محتوى مقفول 🔒</span>
              </span>
            )}
          </div>

          {/* Interactive Animated Sound Wave Player when Audio Tab is active & free */}
          {activeTab === 'audio' && isFree && activeFile.downloadUrl && (
            <AudioWavePlayer
              audioUrl={activeFile.downloadUrl}
              title={activeFile.title}
              subjectTitle={subjectTitle}
            />
          )}

          {/* Description or custom note */}
          {activeFile.customNote && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-100/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              💡 {activeFile.customNote}
            </p>
          )}

          {/* Admin Note if available */}
          {adminNote && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">توجيهات المذاكرة:</span>
                <p className="leading-relaxed">{adminNote}</p>
              </div>
            </div>
          )}

          {/* THE "حملها دلوقتي" (Download Now) BIG BUTTON */}
          <div className="pt-2 space-y-3">
            {isFree ? (
              <>
                <button
                  onClick={() => handleDownloadNow(activeFile)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-teal-600/25 active:scale-98 transition-all duration-200"
                >
                  <ArrowDownCircle className="w-6 h-6 animate-bounce" />
                  <span>حملها دلوقتي</span>
                </button>

                {downloadSuccess === activeFile.type && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>بدأ تحميل الملف بنجاح! تفقد مجلد التنزيلات (Downloads) في جهازك.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-amber-900 dark:text-amber-200">هذه المحاضرة مقفولة 🔒</h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                    المحتوى متاح للمشتركين فقط. يمكنك التواصل معنا عبر الواتساب للاشتراك وفتح المحاضرة فوراً.
                  </p>
                </div>
                <a
                  href="https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل عبر الواتساب للاشتراك وتفعيل المحاضرة 💬</span>
                </a>
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
      )}

      {/* 3. Interactive Flashcards Section (When Flashcards Tab is selected) */}
      {activeTab === 'flashcards' && (
        <div className="animate-in fade-in duration-300">
          <Flashcards3D cards={flashcards} subjectTitle={subjectTitle} />
        </div>
      )}

      {/* WhatsApp Modal after Download */}
      <WhatsAppJoinModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        lectureTitle={activeFile?.title}
      />

      {/* Report Broken Link Modal */}
      <ReportBrokenLinkModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        lectureTitle={activeFile?.title || ''}
        subjectTitle={subjectTitle}
        linkUrl={activeFile?.downloadUrl || ''}
        lectureId={lectureId}
      />
    </div>
  );
}
