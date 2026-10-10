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
} from 'lucide-react';
import { MOCK_SUBJECTS } from '@/lib/mock-data';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'lectures' | 'announcement' | 'reports' | 'telegram'>('upload');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
  const [subjectId, setSubjectId] = useState('anatomy');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [overview, setOverview] = useState('');
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [file, setFile] = useState<File | null>(null);
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
    loadAnnouncement();
    loadReports();
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
      if (data.success && data.reports) {
        setReports(data.reports);
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
    if (!file) {
      setUploadFeedback({ type: 'error', message: 'يرجى اختيار ملف PDF أولاً' });
      return;
    }
    if (!lectureTitle.trim()) {
      setUploadFeedback({ type: 'error', message: 'يرجى إدخال اسم المحاضرة' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);
      formData.append('lectureTitle', lectureTitle.trim());
      formData.append('lectureNumber', String(lectureNumber));
      formData.append('adminNote', adminNote.trim());
      formData.append('overview', overview.trim());
      formData.append('watermark', String(applyWatermark));

      const res = await fetch('/api/admin/upload-lecture', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadFeedback({
          type: 'success',
          message: 'تم رفع المحاضرة ووضع العلامة المائية ونشرها بنجاح! 🚀 تم إرسال إشعار تيليجرام.',
        });
        setLectureTitle('');
        setLectureNumber((prev) => prev + 1);
        setAdminNote('');
        setOverview('');
        setFile(null);
        loadLectures();
        loadStats();
      } else {
        setUploadFeedback({ type: 'error', message: data.message || 'فشل الرفع' });
      }
    } catch (err) {
      setUploadFeedback({ type: 'error', message: 'حدث خطأ في الاتصال أثناء الرفع' });
    } finally {
      setIsUploading(false);
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
    } catch (e) {
      alert('فشل تحديث حالة البلاغ');
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
            <span>البلاغات ({reports.filter((r) => r.status === 'pending').length})</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subject Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    المادة الأكاديمية:
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MOCK_SUBJECTS.map((sub) => (
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
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* PDF Dropzone / File Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ملف المحاضرة (صيغة PDF فقط):
                </label>
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
                          يدعم أي حجم PDF • سيتم تطبيق العلامة المائية تلقائياً
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
                disabled={isUploading || !file}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-base shadow-xl shadow-teal-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارِ معالجة الـ PDF ودمج العلامة المائية والنشر...</span>
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
                          <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                            {lec.files?.length || 1} ملفات (PDF)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{lec.files?.[0]?.updatedAt || 'معتمد'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
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
