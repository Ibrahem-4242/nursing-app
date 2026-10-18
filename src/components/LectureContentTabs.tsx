'use client';

import React, { useState } from 'react';
import { LectureFile, Flashcard } from '@/lib/types';
import Flashcards3D from '@/components/Flashcards3D';
import AudioWavePlayer from '@/components/AudioWavePlayer';
import WhatsAppJoinModal from '@/components/WhatsAppJoinModal';
import ReportBrokenLinkModal from '@/components/ReportBrokenLinkModal';
import PurchaseLectureModal from '@/components/PurchaseLectureModal';
import { useStudentAuth } from '@/context/StudentAuthContext';
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
  EyeOff,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface LectureContentTabsProps {
  files: LectureFile[];
  flashcards: Flashcard[];
  subjectTitle: string;
  lectureTitle?: string;
  adminNote?: string;
  lectureId?: string;
  yearId?: string;
  isFree?: boolean;
  price?: number;
  isAdmin?: boolean;
}

export default function LectureContentTabs({
  files,
  flashcards,
  subjectTitle,
  lectureTitle,
  adminNote,
  lectureId,
  yearId,
  isFree = true,
  price = 50,
  isAdmin = false,
}: LectureContentTabsProps) {
  const getFileUrl = (f: any) => (f?.downloadUrl || f?.fileUrl || '').trim();
  const isValidUrl = (u: string) => Boolean(u && u !== '#');

  const rawPdf = files.find(
    (f: any) => (f.type === 'pdf' || f.fileType === 'summary') && isValidUrl(getFileUrl(f))
  );
  const rawPpt = files.find(
    (f: any) => (f.type === 'ppt' || f.fileType === 'powerpoint') && isValidUrl(getFileUrl(f))
  );
  const rawMindmap = files.find(
    (f: any) => (f.type === 'mindmap' || f.fileType === 'mindmap') && isValidUrl(getFileUrl(f))
  );
  const rawAudio = files.find(
    (f: any) => (f.type === 'audio' || f.fileType === 'audio') && isValidUrl(getFileUrl(f))
  );
  const rawQuestions = files.find(
    (f: any) => (f.type === 'questions' || f.fileType === 'questions') && isValidUrl(getFileUrl(f))
  );

  const pdfFile: LectureFile | null = rawPdf
    ? { ...rawPdf, type: 'pdf', downloadUrl: getFileUrl(rawPdf) }
    : null;
  const pptFile: LectureFile | null = rawPpt
    ? { ...rawPpt, type: 'ppt', downloadUrl: getFileUrl(rawPpt) }
    : null;
  const mindmapFile: LectureFile | null = rawMindmap
    ? { ...rawMindmap, type: 'mindmap', downloadUrl: getFileUrl(rawMindmap) }
    : null;
  const audioFile: LectureFile | null = rawAudio
    ? { ...rawAudio, type: 'audio', downloadUrl: getFileUrl(rawAudio) }
    : null;
  const questionsFile: LectureFile | null = rawQuestions
    ? { ...rawQuestions, type: 'questions', downloadUrl: getFileUrl(rawQuestions) }
    : null;
  const hasFlashcards = Array.isArray(flashcards) && flashcards.length > 0;

  const defaultTab: 'pdf' | 'ppt' | 'mindmap' | 'audio' | 'questions' | 'flashcards' = pdfFile
    ? 'pdf'
    : audioFile
    ? 'audio'
    : questionsFile
    ? 'questions'
    : pptFile
    ? 'ppt'
    : mindmapFile
    ? 'mindmap'
    : hasFlashcards
    ? 'flashcards'
    : 'pdf';

  const [activeTab, setActiveTab] = useState<'pdf' | 'ppt' | 'mindmap' | 'audio' | 'questions' | 'flashcards'>(
    defaultTab
  );

  React.useEffect(() => {
    const currentValid =
      (activeTab === 'pdf' && !!pdfFile) ||
      (activeTab === 'ppt' && !!pptFile) ||
      (activeTab === 'mindmap' && !!mindmapFile) ||
      (activeTab === 'audio' && !!audioFile) ||
      (activeTab === 'questions' && !!questionsFile) ||
      (activeTab === 'flashcards' && hasFlashcards);
    if (!currentValid) {
      setActiveTab(defaultTab);
    }
  }, [pdfFile, pptFile, mindmapFile, audioFile, questionsFile, hasFlashcards, activeTab, defaultTab]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const { student, isLecturePurchased, openAuthModal } = useStudentAuth();
  const isPurchasedByStudent = Boolean(lectureId && isLecturePurchased(lectureId, yearId));
  const isUnlocked = isFree || isPurchasedByStudent || isAdmin;

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
      case 'questions':
        return questionsFile;
      default:
        return null;
    }
  };

  const hasTrackedFlashcards = React.useRef(false);

  const handleSelectTab = (tab: 'pdf' | 'ppt' | 'mindmap' | 'audio' | 'questions' | 'flashcards') => {
    setActiveTab(tab);
    if (tab === 'flashcards' && !hasTrackedFlashcards.current) {
      hasTrackedFlashcards.current = true;
      fetch('/api/track-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: pdfFile?.title || audioFile?.title || questionsFile?.title || pptFile?.title || mindmapFile?.title || subjectTitle,
          subjectTitle,
          cardsCount: flashcards?.length || 0,
        }),
      }).catch((e) => console.warn('Flashcard tracking error:', e));
    }
  };

  const getExtension = (file: LectureFile) => {
    if (file.type === 'pdf' || file.type === 'questions') return 'pdf';
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
              ? 'ملخص صوتي 🎧'
              : file.type === 'questions'
              ? 'أسئلة وتدريبات المحاضرة ❓'
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

  // Strictly display ONLY the tabs that actually have uploaded content in this lecture!
  const visibleTabs = [
    {
      id: 'pdf' as const,
      label: 'ملف PDF',
      hasContent: !!pdfFile,
      activeClass: 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]',
      icon: FileText,
    },
    {
      id: 'audio' as const,
      label: 'الملخص الصوتي',
      hasContent: !!audioFile,
      activeClass: 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-[1.02]',
      icon: Headphones,
      pulseDot: !!audioFile,
    },
    {
      id: 'questions' as const,
      label: 'أسئلة المحاضرة',
      hasContent: !!questionsFile,
      activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]',
      icon: HelpCircle,
    },
    {
      id: 'ppt' as const,
      label: 'عروض بوربوينت',
      hasContent: !!pptFile,
      activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02]',
      icon: Presentation,
    },
    {
      id: 'mindmap' as const,
      label: 'خريطة ذهنية',
      hasContent: !!mindmapFile,
      activeClass: 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 scale-[1.02]',
      icon: GitFork,
    },
    {
      id: 'flashcards' as const,
      label: 'كروت استذكار',
      hasContent: hasFlashcards,
      activeClass: 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 scale-[1.02]',
      icon: Layers,
    },
  ].filter((t) => t.hasContent);

  return (
    <div className="w-full my-8 space-y-6" dir="rtl">
      {/* 1. The Interactive Tabs Selector (Only shown if at least 1 resource is available) */}
      {visibleTabs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 relative ${
                    isSelected
                      ? tab.activeClass
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.pulseDot && (
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                      title="متوفر تسجيل صوتي"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback only if a lecture has 0 resources at all */}
      {visibleTabs.length === 0 && (
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2">
          <BookOpen className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            ملفات هذه المحاضرة قيد التجهيز والاعتماد
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            ستظهر ملفات الـ PDF والملخصات والريكوردات هنا فور اعتمادها مباشرة.
          </p>
        </div>
      )}

      {/* 2. File Download & Player Box (for PDF, PPT, Mindmap, Audio, Questions) */}
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
                    : activeTab === 'questions'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                }`}
              >
                {activeTab === 'pdf' && <FileText className="w-8 h-8" />}
                {activeTab === 'ppt' && <Presentation className="w-8 h-8" />}
                {activeTab === 'mindmap' && <GitFork className="w-8 h-8" />}
                {activeTab === 'audio' && <Headphones className="w-8 h-8" />}
                {activeTab === 'questions' && <HelpCircle className="w-8 h-8" />}
              </div>

              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block mb-1">
                  {activeTab === 'pdf' && 'ملخص المحاضرة المعتمد (PDF)'}
                  {activeTab === 'ppt' && 'سلايدات الشرح الجامعي (PowerPoint)'}
                  {activeTab === 'mindmap' && 'الخريطة الذهنية التفاعلية الشاملة'}
                  {activeTab === 'audio' && 'الملخص والشرح الصوتي للمحاضرة (Audio Summary)'}
                  {activeTab === 'questions' && 'بنك أسئلة وتدريبات المحاضرة (Questions PDF)'}
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

            {isUnlocked ? (
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isFree ? 'متاح للتحميل المجاني' : 'تم تفعيل المحاضرة بحسابك 🎓'}</span>
              </span>
            ) : (
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>محاضرة مدفوعة ({price} ج.م) 🔒</span>
              </span>
            )}
          </div>

          {/* Interactive Animated Sound Wave Player when Audio Tab is active & unlocked */}
          {activeTab === 'audio' && isUnlocked && activeFile.downloadUrl && (
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

          {/* THE "حملها دلوقتي" (Download Now) BIG BUTTON OR PURCHASE PROMPT */}
          <div className="pt-2 space-y-3">
            {isUnlocked ? (
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
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-850 dark:to-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/80 text-center space-y-4 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs font-black mb-2">
                    <span>سعر المحاضرة: {price} ج.م فقط 🇪🇬</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    هذه المحاضرة مخصصة للمشتركين 🔒
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-lg mx-auto leading-relaxed">
                    يمكنك شراء المحاضرة بسهولة عبر فودافون كاش وتفعيلها فوراً في حسابك لتفتح معك في أي وقت ومن أي جهاز.
                  </p>
                </div>

                {student ? (
                  <button
                    type="button"
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition"
                  >
                    <span>شراء وتفعيل المحاضرة الآن ({price} ج.م) 💳</span>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => openAuthModal('register')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-600/25 active:scale-95 transition"
                    >
                      <span>عمل حساب جديد للشراء 👤</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition"
                    >
                      <span>تسجيل الدخول بالحساب</span>
                    </button>
                  </div>
                )}
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
        isUnlocked ? (
          <div className="animate-in fade-in duration-300">
            <Flashcards3D cards={flashcards} subjectTitle={subjectTitle} />
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-3xl bg-amber-50/70 dark:bg-slate-900 border-2 border-amber-300/80 dark:border-amber-700/80 text-center space-y-4 shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              كروت الاستذكار الذكية مخصصة للمشتركين 🎴
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              تحتوي هذه المحاضرة على {flashcards.length} كارت ذكي ثلاثي الأبعاد. قم بتفعيل المحاضرة لتتمكن من التدريب عليها.
            </p>
            {student ? (
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
              >
                شراء وتفعيل المحاضرة ({price} ج.م) 💳
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
              >
                إنشاء حساب لتفعيل المحاضرة 👤
              </button>
            )}
          </div>
        )
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

      {/* Purchase Lecture Modal */}
      <PurchaseLectureModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        lectureId={lectureId || ''}
        lectureTitle={lectureTitle || activeFile?.title || 'المحاضرة'}
        subjectTitle={subjectTitle}
        price={price}
      />
    </div>
  );
}
