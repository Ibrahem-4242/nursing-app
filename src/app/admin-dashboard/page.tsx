'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Upload,
  FileText,
  Megaphone,
  AlertTriangle,
  Send,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Eye,
  ExternalLink,
  Layers,
  Sparkles,
  Loader2,
  Users,
  DownloadCloud,
  Check,
  FileUp,
  MessageCircle,
  BarChart3,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { MOCK_SUBJECTS } from '@/lib/mock-data';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'lectures' | 'quizzes' | 'announcement' | 'reports' | 'telegram'>('upload');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Subject Quizzes Form state
  const [quizSubjectId, setQuizSubjectId] = useState('anatomy');
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(150);
  const [quizApplyWatermark, setQuizApplyWatermark] = useState(true);
  const [isUploadingQuiz, setIsUploadingQuiz] = useState(false);
  const [quizUploadFeedback, setQuizUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState<Record<string, any>>({});
  const [isLoadingSubjectQuizzes, setIsLoadingSubjectQuizzes] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    todayVisitors: 0,
    totalVisitors: 0,
    todayDownloads: 0,
    totalDownloads: 0,
    totalLectures: 0,
    pendingReports: 0,
  });

  // Upload Form state
  const [yearId, setYearId] = useState('1');
  const [subjectId, setSubjectId] = useState('anatomy');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [overview, setOverview] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [ankiFile, setAnkiFile] = useState<File | null>(null);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [mindmapFile, setMindmapFile] = useState<File | null>(null);
  const [isImportingAnki, setIsImportingAnki] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lectures state
  const [lectures, setLectures] = useState<any[]>([]);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementLinkText, setAnnouncementLinkText] = useState('انضم لجروب الواتساب');
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementFeedback, setAnnouncementFeedback] = useState<string | null>(null);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Telegram test state
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);
  const [isSendingDailyReport, setIsSendingDailyReport] = useState(false);

  // Verify auth on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          setIsAuthenticated(false);
          router.replace('/');
        } else {
          setIsAuthenticated(true);
          loadAllData();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.replace('/');
      });
  }, [router]);

  const loadAllData = () => {
    loadStats();
    loadLectures();
    loadSubjectQuizzes();
    loadAnnouncement();
    loadReports();
  };

  const loadSubjectQuizzes = async () => {
    setIsLoadingSubjectQuizzes(true);
    try {
      const res = await fetch('/api/admin/upload-quiz-file');
      const data = await res.json();
      if (data.success && data.quizzes) {
        setSubjectQuizzes(data.quizzes);
      }
    } catch (e) {
      console.warn('Failed to load subject quizzes:', e);
    } finally {
      setIsLoadingSubjectQuizzes(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  };

  const loadLectures = async () => {
    setIsLoadingLectures(true);
    try {
      const res = await fetch('/api/admin/lectures');
      const data = await res.json();
      if (data.success && data.lectures) {
        setLectures(data.lectures);
      }
    } catch (e) {
      console.warn('Failed to load lectures:', e);
    } finally {
      setIsLoadingLectures(false);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      const data = await res.json();
      if (data.success && data.announcement) {
        setAnnouncementText(data.announcement.text || '');
        setAnnouncementActive(!!data.announcement.isActive);
        setAnnouncementLinkText(data.announcement.linkText || '');
        setAnnouncementLinkUrl(data.announcement.linkUrl || '');
      }
    } catch (e) {
      console.warn('Failed to load announcement:', e);
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.success) {
        if (data.reports) setReports(data.reports);
        if (data.complaints) setComplaints(data.complaints);
      }
    } catch (e) {
      console.warn('Failed to load reports:', e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/');
  };

  // Upload lecture handler
  const handleUploadLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !externalPdfUrl.trim()) {
      setUploadFeedback({ type: 'error', message: 'يرجى اختيار ملف PDF أو وضع رابط تحميل مباشر' });
      return;
    }
    if (!lectureTitle.trim()) {
      setUploadFeedback({ type: 'error', message: 'يرجى إدخال اسم المحاضرة' });
      return;
    }

    // Validate total upload payload size before sending to prevent serverless 413 drop
    if (file) {
      const totalBytes =
        (file?.size || 0) +
        (ankiFile?.size || 0) +
        (pptFile?.size || 0) +
        (mindmapFile?.size || 0);
      const totalMb = totalBytes / (1024 * 1024);

      if (totalMb > 4.5) {
        setUploadFeedback({
          type: 'error',
          message: `حجم الملفات الإجمالي (${totalMb.toFixed(1)} MB) يتجاوز الحد الأقصى في الرفع المباشر (4.5 MB). يمكنك ضغط الـ PDF أو استخدام خيار "رابط خارجي مباشر (Google Drive)" لنشر الملف بدون أي حدود!`,
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (externalPdfUrl.trim()) formData.append('externalPdfUrl', externalPdfUrl.trim());
      if (ankiFile) formData.append('ankiFile', ankiFile);
      if (pptFile) formData.append('pptFile', pptFile);
      if (mindmapFile) formData.append('mindmapFile', mindmapFile);
      formData.append('subjectId', subjectId);
      formData.append('yearId', yearId);
      formData.append('lectureTitle', lectureTitle.trim());
      formData.append('lectureNumber', String(lectureNumber));
      formData.append('adminNote', adminNote.trim());
      formData.append('overview', overview.trim());
      formData.append('watermark', String(applyWatermark));

      const res = await fetch('/api/admin/upload-lecture', {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم الملف كبير جداً وتجاوز الحد الأقصى المسموح به (4.5 MB). يرجى ضغط الـ PDF قبل رفعه.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى إعادة تسجيل الدخول عبر زر الفوتر السري.');
          } else if (res.status === 504) {
            throw new Error('استغرقت معالجة الملف وقتاً طويلاً وتجاوزت مهلة السيرفر. يرجى تجربة ملف أصغر حجماً.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر إتمام الرفع'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        setUploadFeedback({
          type: 'success',
          message: `تم رفع المحاضرة ووضع العلامة المائية ونشرها بنجاح! 🚀 ${
            data.flashcardsCount ? `(تم استخراج ${data.flashcardsCount} بطاقة فلاش كاردز 🎴)` : ''
          }`,
        });
        setLectureTitle('');
        setLectureNumber((prev) => prev + 1);
        setAdminNote('');
        setOverview('');
        setFile(null);
        setAnkiFile(null);
        setPptFile(null);
        setMindmapFile(null);
        setExternalPdfUrl('');
        loadLectures();
        loadStats();
      } else {
        setUploadFeedback({ type: 'error', message: data?.message || 'فشل الرفع' });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: err?.message || 'حدث خطأ في الاتصال أثناء الرفع. يرجى التأكد من اتصال الإنترنت وحجم الملف.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Direct Anki Import Handler for existing lecture
  const handleImportAnki = async (lectureId: string, apkgFile: File) => {
    if (apkgFile.size > 4.5 * 1024 * 1024) {
      alert(`حجم ملف Anki (${(apkgFile.size / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد المسموح به (4.5 MB).`);
      return;
    }
    setIsImportingAnki(lectureId);
    try {
      const formData = new FormData();
      formData.append('lectureId', lectureId);
      formData.append('ankiFile', apkgFile);

      const res = await fetch('/api/admin/import-anki', {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم ملف Anki كبير جداً وتجاوز الحد الأقصى (4.5 MB).');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر معالجة الملف'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        alert(`تم استخراج وتحديث ${data.cardsCount || data.flashcardsCount} بطاقة فلاش كاردز بنجاح! 🎴`);
        loadLectures();
      } else {
        alert(data?.message || 'فشل استيراد حزمة Anki');
      }
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء رفع واستخراج ملف Anki');
    } finally {
      setIsImportingAnki(null);
    }
  };

  // Upload Subject Quiz Questions PDF
  const handleUploadQuizFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizFile) {
      setQuizUploadFeedback({ type: 'error', message: 'يرجى اختيار ملف PDF لأسئلة الكويزات أولاً' });
      return;
    }

    const quizSizeMb = quizFile.size / (1024 * 1024);
    if (quizSizeMb > 4.5) {
      setQuizUploadFeedback({
        type: 'error',
        message: `حجم ملف الكويزات (${quizSizeMb.toFixed(1)} MB) يتجاوز الحد الأقصى المسموح به في الرفع المباشر (4.5 MB). يرجى ضغط الـ PDF لتفادي انقطاع الاتصال من السيرفر.`,
      });
      return;
    }

    setIsUploadingQuiz(true);
    setQuizUploadFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', quizFile);
      formData.append('subjectId', quizSubjectId);
      formData.append('questionsCount', String(quizQuestionsCount));
      formData.append('watermark', String(quizApplyWatermark));

      const res = await fetch('/api/admin/upload-quiz-file', {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم ملف الكويزات كبير جداً وتجاوز الحد الأقصى (4.5 MB). يرجى ضغط الـ PDF قبل رفعه.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى إعادة تسجيل الدخول عبر زر الفوتر السري.');
          } else if (res.status === 504) {
            throw new Error('استغرقت معالجة الملف وقتاً طويلاً وتجاوزت مهلة السيرفر.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر إتمام الرفع'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        setQuizUploadFeedback({ type: 'success', message: data.message });
        setQuizFile(null);
        loadSubjectQuizzes();
      } else {
        setQuizUploadFeedback({ type: 'error', message: data?.message || 'فشل الرفع' });
      }
    } catch (err: any) {
      setQuizUploadFeedback({
        type: 'error',
        message: err?.message || 'حدث خطأ في الاتصال أثناء رفع ملف الكويزات. يرجى التأكد من اتصال الإنترنت وحجم الملف.',
      });
    } finally {
      setIsUploadingQuiz(false);
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    setAnnouncementFeedback(null);

    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: announcementText,
          isActive: announcementActive,
          linkText: announcementLinkText,
          linkUrl: announcementLinkUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnnouncementFeedback('تم حفظ وتحديث شريط الإعلانات فوراً لجميع الطلاب! ✅');
        setTimeout(() => setAnnouncementFeedback(null), 3000);
      }
    } catch {
      setAnnouncementFeedback('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Delete lecture
  const handleDeleteLecture = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف محاضرة "${title}"؟`)) return;

    try {
      const res = await fetch(`/api/admin/lectures?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
        loadStats();
      }
    } catch (err) {
      alert('فشل حذف المحاضرة');
    }
  };

  // Resolve broken link report
  const handleResolveReport = async (id: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        loadReports();
        loadStats();
      }
    } catch {
      alert('فشل تحديث حالة البلاغ');
    }
  };

  // Resolve complaint
  const handleResolveComplaint = async (id: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'complaint' }),
      });
      const data = await res.json();
      if (data.success) {
        loadReports();
      }
    } catch {
      alert('فشل تحديث حالة الشكوى');
    }
  };

  // Test Telegram
  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch('/api/admin/test-telegram', { method: 'POST' });
      const data = await res.json();
      setTelegramFeedback(data.message);
    } catch {
      setTelegramFeedback('فشل الاتصال بالبوت');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Trigger Daily Report
  const handleSendDailyReport = async () => {
    setIsSendingDailyReport(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch('/api/cron/daily-report', { method: 'POST' });
      const data = await res.json();
      setTelegramFeedback(data.message);
    } catch {
      setTelegramFeedback('فشل إرسال التقرير اليومي');
    } finally {
      setIsSendingDailyReport(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white" dir="rtl">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
          <span className="font-bold">جارِ التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20" dir="rtl">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black">لوحة التحكم السحابية (Secret CMS)</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  متصل ومباشر 🟢
                </span>
              </div>
              <p className="text-xs text-slate-400">إدارة المحتوى، العلامات المائية، وبوت تيليجرام</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>معاينة الموقع</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Quick Stats Counters */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.todayVisitors}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">زوار اليوم (إجمالي: {stats.totalVisitors})</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.todayDownloads}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">تحميلات اليوم (إجمالي: {stats.totalDownloads})</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{lectures.length}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">محاضرة متاحة ومرفوعة</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.pendingReports}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">بلاغات روابط معلقة</span>
            </div>
          </div>
        </section>

        {/* 2. Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'upload'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>رفع محاضرة بضغطة واحدة</span>
          </button>

          <button
            onClick={() => setActiveTab('lectures')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'lectures'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المحاضرات المنشورة ({lectures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'quizzes'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>أسئلة الكويزات لكل مادة</span>
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'announcement'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>شريط التنبيهات والإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'reports'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>البلاغات والشكاوى ({reports.filter((r) => r.status === 'pending').length + complaints.filter((c) => c.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'telegram'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>تتبع وتنبيهات تيليجرام</span>
          </button>
        </div>

        {/* TAB 1: 1-Click Upload Form */}
        {activeTab === 'upload' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <span>رفع ملف PDF ونشر المحاضرة فوراً</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر المادة، اسحب ملف الـ PDF، وسيقوم النظام بختم العلامة المائية وتحديث واجهة الطلاب في نفس اللحظة!
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                🛡️ علامة مائية تلقائية مفعلة
              </span>
            </div>

            <form onSubmit={handleUploadLecture} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Academic Year Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الفرقة الدراسية:
                  </label>
                  <select
                    value={yearId}
                    onChange={(e) => {
                      const newYear = e.target.value;
                      setYearId(newYear);
                      const available = MOCK_SUBJECTS.filter((s) => s.yearId === newYear);
                      if (available.length > 0) {
                        setSubjectId(available[0].id);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">السنة الأولى (الفرقة الأولى)</option>
                    <option value="2">السنة الثانية (الفرقة الثانية)</option>
                    <option value="3">السنة الثالثة (الفرقة الثالثة)</option>
                    <option value="4">السنة الرابعة (الفرقة الرابعة)</option>
                  </select>
                </div>

                {/* Subject Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    المادة الأكاديمية:
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MOCK_SUBJECTS.filter((s) => s.yearId === yearId).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.title} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lecture Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    عنوان أو اسم المحاضرة:
                  </label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    placeholder="مثال: الجهاز التنفسي والتبادل الغازي"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Lecture Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رقم المحاضرة:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lectureNumber}
                    onChange={(e) => setLectureNumber(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* PDF Upload Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  طريقة إضافة ملف المحاضرة (PDF):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      uploadMode === 'file'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <FileUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>رفع ملف PDF مباشر (حتى 4.5 MB)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      uploadMode === 'link'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>رابط خارجي مباشر (Google Drive / سحابي) - بدون حد للحجم 🚀</span>
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                      file
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => document.getElementById('pdf-file-input')?.click()}
                  >
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />

                    {file ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB • جاهز للرفع والختم
                        </p>
                        <span className="inline-block text-[11px] text-teal-600 dark:text-teal-400 font-bold underline">
                          اضغط لتغيير الملف
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                          <FileUp className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            اضغط هنا لاختيار ملف PDF أو اسحبه وأفلته هنا
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            الحد الأقصى للملف: 4.5 MB (لأفضل سرعة رفع وعرض) • تطبق العلامة المائية تلقائياً
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold">
                      <ExternalLink className="w-4 h-4" />
                      <span>ضع رابط ملف المحاضرة (Google Drive / Telegram / MediaFire):</span>
                    </div>
                    <input
                      type="url"
                      value={externalPdfUrl}
                      onChange={(e) => setExternalPdfUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view أو رابط مباشر"
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                      <p className="font-bold">💡 نصيحة لنشر ملفات Google Drive لأي حجم بدون أي قيود:</p>
                      <p>1. ارفع ملف الـ PDF على Google Drive من حسابك.</p>
                      <p>2. اضغط كليك يمين على الملف ⬅️ مشاركة (Share) ⬅️ اجعل الوصول العام: <strong>أي شخص لديه الرابط (Anyone with the link)</strong>.</p>
                      <p>3. انسخ الرابط والصقه هنا مباشرة. سيعمل للطلاب فوراً وبسرعة فائقة!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
                <input
                  type="checkbox"
                  id="watermark-toggle"
                  checked={applyWatermark}
                  onChange={(e) => setApplyWatermark(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded-lg border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="watermark-toggle" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  تطبيق علامة مائية تلقائية (Watermark) باسم "منصة ملخصات تمريض" على جميع صفحات الـ PDF لحفظ الحقوق الفكرية
                </label>
              </div>

              {/* Additional Study Materials (Anki .apkg, PowerPoint, Mindmap) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>الملفات الإضافية والمواد التفاعلية (اختياري)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يمكنك إرفاق حزمة Anki، وسلايدات بوربوينت، وخريطة ذهنية لتوفير تجربة تعليمية متكاملة للطلاب.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Anki Package (.apkg) */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>حزمة كروت Anki (.apkg)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        للعارض الداخلي فقط 🎴
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      يتم استخراج البطاقات تلقائياً وتفعيل عارض الفلاش كاردز 3D الداخلي (ممنوع التحميل للطلاب).
                    </p>
                    <input
                      type="file"
                      id="anki-file-input"
                      accept=".apkg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAnkiFile(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('anki-file-input')?.click()}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        ankiFile
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-500'
                      }`}
                    >
                      {ankiFile ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{ankiFile.name}</span>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-3.5 h-3.5" />
                          <span>اختر ملف .apkg</span>
                        </>
                      )}
                    </button>
                    {ankiFile && (
                      <button
                        type="button"
                        onClick={() => setAnkiFile(null)}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                      >
                        إلغاء الملف
                      </button>
                    )}
                  </div>

                  {/* 2. PowerPoint (.pptx, .ppt) */}
                  <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>عرض بوربوينت (PPTX)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        تحميل مباشر 📊
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      ملف الشرائح التقديمية الأصلية للمحاضرة متاح لتحميل الطلاب المباشر.
                    </p>
                    <input
                      type="file"
                      id="ppt-file-input"
                      accept=".pptx,.ppt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPptFile(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('ppt-file-input')?.click()}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        pptFile
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      {pptFile ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{pptFile.name}</span>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-3.5 h-3.5" />
                          <span>اختر ملف PPTX / PPT</span>
                        </>
                      )}
                    </button>
                    {pptFile && (
                      <button
                        type="button"
                        onClick={() => setPptFile(null)}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                      >
                        إلغاء الملف
                      </button>
                    )}
                  </div>

                  {/* 3. Mindmap (.png, .jpg, .pdf) */}
                  <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>خريطة ذهنية (Mindmap)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                        عرض وتحميل 🧠
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      صورة عالية الدقة أو ملف PDF للخريطة التلخيصية للمحاضرة.
                    </p>
                    <input
                      type="file"
                      id="mindmap-file-input"
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMindmapFile(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('mindmap-file-input')?.click()}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        mindmapFile
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-teal-500'
                      }`}
                    >
                      {mindmapFile ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{mindmapFile.name}</span>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-3.5 h-3.5" />
                          <span>اختر صورة أو PDF</span>
                        </>
                      )}
                    </button>
                    {mindmapFile && (
                      <button
                        type="button"
                        onClick={() => setMindmapFile(null)}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                      >
                        إلغاء الملف
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  توجيهات أو ملاحظة للطلاب تظهر أسفل التحميل (اختياري):
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="مثال: ركز على أسئلة الامتحانات في صفحة 5 و 7"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {uploadFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading || (uploadMode === 'file' ? !file : !externalPdfUrl.trim()) || !lectureTitle.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-base shadow-xl shadow-teal-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارِ معالجة البيانات ونشر المحاضرة سحابياً...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>رفع ونشر المحاضرة فوراً للطلاب 🚀</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Manage Live Lectures */}
        {activeTab === 'lectures' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>المحاضرات والمذكرات الحالية ({lectures.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  أي حذف أو تعديل هنا ينعكس في الموقع فوراً وفي نفس اللحظة بدون إعادة عمل Build!
                </p>
              </div>

              <button
                onClick={loadLectures}
                disabled={isLoadingLectures}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLectures ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingLectures ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
                <span>جارِ تحميل المحاضرات...</span>
              </div>
            ) : lectures.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p>لا توجد محاضرات مضافة بعد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-3 px-4">رقم</th>
                      <th className="py-3 px-4">اسم المحاضرة</th>
                      <th className="py-3 px-4">المادة</th>
                      <th className="py-3 px-4">الملفات المتاحة</th>
                      <th className="py-3 px-4">تاريخ النشر</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {lectures.map((lec) => (
                      <tr key={lec.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-3.5 px-4 font-bold text-teal-600">#{lec.lectureNumber}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {lec.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{lec.subjectTitle}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[11px]">
                              PDF 📄
                            </span>
                            {lec.files?.some((f: any) => f.fileType === 'powerpoint') && (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                                PPT 📊
                              </span>
                            )}
                            {lec.files?.some((f: any) => f.fileType === 'mindmap') && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                                Mindmap 🧠
                              </span>
                            )}
                            {lec.flashcards?.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                                {lec.flashcards.length} كارت 🎴
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal text-[10px]">
                                بدون كروت
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{lec.files?.[0]?.updatedAt || 'معتمد'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Anki import button */}
                            <label
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 cursor-pointer transition flex items-center"
                              title="استيراد كروت Anki (.apkg) لهذه المحاضرة"
                            >
                              <input
                                type="file"
                                accept=".apkg"
                                className="hidden"
                                disabled={isImportingAnki === lec.id}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImportAnki(lec.id, e.target.files[0]);
                                  }
                                }}
                              />
                              {isImportingAnki === lec.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              ) : (
                                <Layers className="w-4 h-4" />
                              )}
                            </label>

                            <Link
                              href={`/lecture/${lec.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition"
                              title="معاينة صفحة المحاضرة"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleDeleteLecture(lec.id, lec.title)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                              title="حذف المحاضرة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB QUIZZES: Manage Subject Quiz Questions PDF */}
        {activeTab === 'quizzes' && (
          <div className="space-y-8">
            {/* 1. Upload Form for Subject Quizzes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <span>رفع وتحديث ملف أسئلة الكويزات المجمعة لكل مادة</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ارفع ملف PDF يجمع كافة أسئلة الكويزات والامتحانات والـ MCQ مع الإجابات النموذجية لمادة معينة ليتاح للطلاب فوراً.
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                  📝 بنك أسئلة الكويزات المجمعة
                </span>
              </div>

              <form onSubmit={handleUploadQuizFile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subject Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      المادة الأكاديمية:
                    </label>
                    <select
                      value={quizSubjectId}
                      onChange={(e) => setQuizSubjectId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {MOCK_SUBJECTS.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.title} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Questions Count */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      عدد الأسئلة التقريبي في الملف:
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={quizQuestionsCount}
                      onChange={(e) => setQuizQuestionsCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* PDF Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    ملف أسئلة الكويزات (صيغة PDF):
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                      quizFile
                        ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => document.getElementById('quiz-pdf-input')?.click()}
                  >
                    <input
                      id="quiz-pdf-input"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setQuizFile(e.target.files[0]);
                        }
                      }}
                    />

                    {quizFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{quizFile.name}</p>
                        <p className="text-xs text-slate-500">
                          الحجم: {(quizFile.size / (1024 * 1024)).toFixed(2)} MB • جاهز للرفع والختم
                        </p>
                        <span className="inline-block text-[11px] text-amber-600 dark:text-amber-400 font-bold underline">
                          اضغط لتغيير الملف
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                          <FileUp className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            اضغط هنا لاختيار ملف PDF لأسئلة الكويزات أو اسحبه هنا
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ملف مجمع للأسئلة والإجابات • الحد الأقصى: 4.5 MB • تطبق العلامة المائية تلقائياً
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Watermark Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <input
                    type="checkbox"
                    id="quiz-watermark-toggle"
                    checked={quizApplyWatermark}
                    onChange={(e) => setQuizApplyWatermark(e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded-lg border-slate-300 focus:ring-amber-500"
                  />
                  <label htmlFor="quiz-watermark-toggle" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    ختم علامة مائية تلقائية باسم "منصة ملخصات تمريض" على جميع صفحات بنك الأسئلة لحفظ الحقوق الفكرية
                  </label>
                </div>

                {quizUploadFeedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      quizUploadFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                    }`}
                  >
                    {quizUploadFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span>{quizUploadFeedback.message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploadingQuiz || !quizFile}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 text-white font-black text-base shadow-xl shadow-amber-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploadingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جارِ معالجة ملف الكويزات ووضع العلامة المائية والنشر...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5" />
                      <span>رفع ونشر ملف أسئلة الكويزات للمادة فوراً 🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 2. List of Subjects and their Quiz Status */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>حالة ملف أسئلة الكويزات لجميع المواد ({MOCK_SUBJECTS.length})</span>
                </h4>
                <button
                  onClick={loadSubjectQuizzes}
                  disabled={isLoadingSubjectQuizzes}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  title="تحديث"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubjectQuizzes ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-3 px-4">المادة</th>
                      <th className="py-3 px-4">كود المقرر</th>
                      <th className="py-3 px-4">السنة</th>
                      <th className="py-3 px-4">حالة ملف أسئلة الكويزات</th>
                      <th className="py-3 px-4">عدد الأسئلة</th>
                      <th className="py-3 px-4 text-center">معاينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MOCK_SUBJECTS.map((sub) => {
                      const customQuiz = subjectQuizzes[sub.id];
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sub.title}</td>
                          <td className="py-3 px-4 text-teal-600 font-mono">{sub.code}</td>
                          <td className="py-3 px-4 text-slate-500">{sub.yearName}</td>
                          <td className="py-3 px-4">
                            {customQuiz ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200">
                                مرفوع ومتاح للطلاب 🟢 ({customQuiz.fileSize})
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[11px]">
                                لم يُرفع ملف كويز بعد ⚪️
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {customQuiz ? `+${customQuiz.questionsCount} سؤال` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/subject/${sub.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition inline-flex items-center"
                              title="معاينة المادة"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Announcement Bar Settings */}
        {activeTab === 'announcement' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-teal-600" />
                  <span>شريط التنبيهات والإعلانات العلوي (Announcement Bar)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اكتب إعلاناً ترويجياً أو تنبيهاً هاماً (مثل: مواعيد الامتحانات أو المراجعات) وسيظهر فوراً في أعلى كل صفحات الموقع.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حالة الشريط:</span>
                <button
                  type="button"
                  onClick={() => setAnnouncementActive(!announcementActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementActive ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {announcementActive ? 'مفعل 🟢' : 'معطل ⚪'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  نص الإعلان أو التنبيه:
                </label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="مثال: 📢 تنبيه: تم رفع مراجعة الميدتيرم لمادة التشريح والفسيولوجي الآن!"
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    نص الزر الإضافي (اختياري):
                  </label>
                  <input
                    type="text"
                    value={announcementLinkText}
                    onChange={(e) => setAnnouncementLinkText(e.target.value)}
                    placeholder="مثال: انضم لجروب الواتساب"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رابط الزر:
                  </label>
                  <input
                    type="text"
                    value={announcementLinkUrl}
                    onChange={(e) => setAnnouncementLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">معاينة مباشرة لشكل الشريط في الموقع:</span>
                <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-700 text-white text-xs font-medium py-2.5 px-4 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 flex-shrink-0" />
                    <span>{announcementText || 'نص الإعلان سيظهر هنا'}</span>
                    {announcementLinkText && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-teal-800 text-[10px] font-black mr-2">
                        {announcementLinkText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {announcementFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-xs font-bold text-center">
                  {announcementFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {isSavingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                <span>حفظ ونشر التنبيه فوراً في أعلى الموقع 📢</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Broken Link Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>بلاغات الروابط المعطلة الواردة من الطلاب</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تصلك هذه البلاغات أيضاً فورياً عبر بوت تيليجرام.
                </p>
              </div>

              <button
                onClick={loadReports}
                disabled={isLoadingReports}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingReports ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                <span>جارِ تحميل البلاغات...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد أي بلاغات معلقة حالياً!</p>
                <p className="text-xs">جميع روابط الملخصات والمذكرات تعمل بصورة ممتازة.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                      rep.status === 'resolved'
                        ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {rep.lectureTitle}
                        </span>
                        <span className="text-xs text-slate-500">({rep.subjectTitle})</span>
                        {rep.status === 'resolved' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            تم الإصلاح ✅
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            قيد الانتظار ⚠️
                          </span>
                        )}
                      </div>

                      {rep.userNote && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          📝 ملاحظة الطالب: <i>{rep.userNote}</i>
                        </p>
                      )}

                      {rep.userPhone && (
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-slate-500 text-[11px]">رقم هاتف الطالب:</span>
                          <span className="font-bold text-teal-700 dark:text-teal-400 font-mono" dir="ltr">
                            {rep.userPhone}
                          </span>
                          <a
                            href={`https://wa.me/2${rep.userPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                          >
                            واتساب 💬
                          </a>
                          <a
                            href={`tel:${rep.userPhone}`}
                            className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                          >
                            اتصال 📞
                          </a>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">التوقيت: {rep.createdAt}</p>
                    </div>

                    {rep.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تم الإصلاح ✅</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Section 2: Student Complaints & Messages */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-teal-600" />
                  <span>شكاوى ورسائل الطلاب الواردة بالرقم ({complaints.length})</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  جميع الشكاوى والاستفسارات المرسلة من الطلاب مع أرقام هواتفهم للتواصل والمتابعة المباشرة.
                </p>
              </div>

              {complaints.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">لا توجد شكاوى جديدة حتى الآن</p>
                  <p className="text-[11px]">أي شكوى يرسلها طالب ستظهر هنا وتصلك فوراً على بوت التيليجرام.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((comp) => (
                    <div
                      key={comp.id}
                      className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                        comp.status === 'resolved'
                          ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {comp.name}
                          </span>
                          <span className="text-xs text-slate-500">({comp.year})</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {comp.type}
                          </span>
                          {comp.status === 'resolved' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              تم الرد والحل ✅
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              جديدة وغير محلولة 🔔
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          💬 {comp.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[11px]">رقم الطالب:</span>
                            <span className="font-bold text-teal-700 dark:text-teal-400 font-mono" dir="ltr">
                              {comp.phone}
                            </span>
                          </div>
                          <a
                            href={`https://wa.me/2${comp.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <span>واتساب 💬</span>
                          </a>
                          <a
                            href={`tel:${comp.phone}`}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <span>اتصال 📞</span>
                          </a>
                          <span className="text-[10px] text-slate-400 mr-auto">{comp.createdAt}</span>
                        </div>
                      </div>

                      {comp.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveComplaint(comp.id)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تم الحل والتواصل ✅</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Telegram Integration & Daily Reports */}
        {activeTab === 'telegram' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-600" />
                  <span>تتبع وإشعارات تيليجرام المباشرة (Telegram Integration)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  البوت مربوط ومبرمج لإرسال التنبيهات اللحظية والتقرير اليومي الشامل تلقائياً.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                Bot Active 🤖
              </span>
            </div>

            {/* Telegram Config Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 block">معرف المحادثة (Chat ID):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">8098726389</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 block">توكن البوت (Bot Token):</span>
                <span className="font-mono text-slate-900 dark:text-white">8276648021:AA...bVeciIg</span>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">التنبيهات التلقائية المفعلة في النظام:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-1">
                  <span className="font-bold text-teal-800 dark:text-teal-300 block">1. إشعار دخول زائر جديد</span>
                  <p className="text-slate-600 dark:text-slate-400">يرسل فورا نوع الجهاز، التوقيت، والصفحة التي دخل إليها.</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">2. إشعار تحميل المذكرات</span>
                  <p className="text-slate-600 dark:text-slate-400">يرسل اسم المحاضرة والمادة ونوع الملف المحمّل والتوقيت.</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block">3. إشعار بلاغ عن رابط عطلان</span>
                  <p className="text-slate-600 dark:text-slate-400">تنبيه عاجل مع ملاحظة الطالب لفحص الرابط وإصلاحه.</p>
                </div>
              </div>
            </div>

            {/* Test & Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">اختبار وتوليد التقارير:</h4>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isTestingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال إشعار تجريبي للبوت الآن 🔔</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendDailyReport}
                  disabled={isSendingDailyReport}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSendingDailyReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  <span>إرسال التقرير اليومي الشامل (Daily Summary) لتيليجرام 📊</span>
                </button>
              </div>

              {telegramFeedback && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center animate-in fade-in">
                  {telegramFeedback}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
