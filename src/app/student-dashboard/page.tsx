'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { StudentActivitySummary, StudentActivityLog } from '@/lib/types';
import {
  GraduationCap,
  Clock,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Video,
  FileText,
  Headphones,
  Laptop,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Target,
  Search,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Flame,
  Brain,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { student, isLoggedIn, openAuthModal } = useStudentAuth();
  const [summary, setSummary] = useState<StudentActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'timeline'>('overview');
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardLectureFilter, setCardLectureFilter] = useState('all');
  const [cardStateFilter, setCardStateFilter] = useState<string>('all');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !student) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/student/activity?summary=true&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.summary) {
          setSummary(data.summary);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch student study summary:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, student?.id, refreshKey]);

  const formatStudyDurationArabic = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 دقيقة';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0 && mins > 0) return `${hrs} س و ${mins} د`;
    if (hrs > 0) return `${hrs} ساعة`;
    if (mins > 0 && secs > 0) return `${mins} د و ${secs} ث`;
    if (mins > 0) return `${mins} دقيقة`;
    return `${secs} ثانية`;
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'غير محدد';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 2) return 'نشط الآن 🟢';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      if (diffHour < 24) return `منذ ${diffHour} ساعة`;
      if (diffDay === 1) return 'أمس';
      if (diffDay < 7) return `منذ ${diffDay} أيام`;
      return new Date(isoString).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // NOT LOGGED IN STATE
  if (!isLoggedIn || !student) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              لوحة نشاط وإحصائيات الطالب 📊
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              سجل دخولك بحسابك الأكاديمي لمتابعة ساعات مذاكرتك الفعلية، إنجازك في كل مادة، وسجل الكروت والكويزات المكتملة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="w-full py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <span>تسجيل الدخول إلى حسابي</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  const filteredLogs = (summary?.recentLogs || []).filter((log) => {
    if (selectedFilter === 'all') return true;
    return log.targetType === selectedFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* 1. Header & Identity */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-teal-200 shadow-md">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black">{student.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {student.university}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  السنة {student.yearId === '2' ? 'الثانية' : student.yearId === '3' ? 'الثالثة' : student.yearId === '4' ? 'الرابعة' : 'الأولى'}
                </span>
              </div>
              <div className="text-xs text-teal-100 flex items-center gap-3">
                <span className="font-mono" dir="ltr">{student.phone}</span>
                <span>•</span>
                <span>حساب أكاديمي نشط ✅</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition border border-white/15 text-xs font-bold flex items-center gap-1.5"
              title="تحديث الإحصائيات الآن"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
            <Link
              href="/bookmarks"
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition border border-amber-400/30 flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>محفوظاتي ليلة الامتحان</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">جاري جمع وتحليل بيانات نشاطك الأكاديمي...</p>
        </div>
      ) : summary ? (
        <>
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>نظرة عامة والنشاط 📊</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'flashcards'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>كروت الاستذكار والذاكرة 🎴</span>
              {summary.flashcardMemory?.forgottenCards && summary.flashcardMemory.forgottenCards.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                  {summary.flashcardMemory.forgottenCards.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>سجل النشاط الزمني (Timeline) ⏱️</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Stats 4-Card Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Total Active Study Time */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">وقت المذاكرة الفعلي</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatStudyDurationArabic(summary.totalStudySeconds)}
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block">
                    محسوب بدقة أثناء تصفحك النشط ⏱️
                  </span>
                </div>

                {/* Stat 2: Total Sessions & Lectures */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">المحتويات المذاكرة</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {summary.totalSessions}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                    جلسة مذاكرة مكتملة 📖
                  </span>
                </div>

                {/* Stat 3: Flashcards */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">كروت الاستذكار</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {summary.flashcardMemory?.totalReviewed || summary.byTypeBreakdown?.flashcards?.count || 0}
                      </span>
                      {summary.flashcardMemory?.masteryPercentage ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ({summary.flashcardMemory.masteryPercentage}% متقن)
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                    كارت تمت مراجعته وتثبيته 🎴
                  </span>
                </div>

                {/* Stat 4: Quizzes */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">الكويزات والامتحانات</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {summary.quizStats?.totalQuizzesTaken || 0}
                      </span>
                      {summary.quizStats?.averageScorePercent ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          (متوسط {summary.quizStats.averageScorePercent}%)
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    اختبار تجريبي محلول 🎯
                  </span>
                </div>
              </div>

              {/* Subject Progress Breakdown */}
              {summary.subjectProgress && summary.subjectProgress.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        إنجازك في المواد الدراسية 📚
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                      مستوى إتمام المحاضرات لكل مقرر
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.subjectProgress.map((sub) => (
                      <Link
                        key={sub.subjectId}
                        href={`/subject/${sub.subjectId}`}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-600 transition group block space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                            {sub.subjectTitle}
                          </span>
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            {sub.percent}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-l from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, sub.percent)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            فتح {sub.openedLecturesCount} من {sub.totalLectures} محاضرة
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            {formatStudyDurationArabic(sub.totalDurationSeconds)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Performance History */}
              {summary.quizStats && summary.quizStats.quizzes.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        سجل درجات الكويزات الأخيرة 🎯
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                      درجاتك وتقييمك الفوري
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {summary.quizStats.quizzes.map((quiz) => {
                      const pct = quiz.percentage ?? 0;
                      const isHigh = pct >= 80;
                      const isMid = pct >= 60 && pct < 80;

                      return (
                        <div
                          key={quiz.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 truncate">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                              {quiz.targetTitle}
                            </div>
                            {quiz.subjectTitle && (
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                                {quiz.subjectTitle}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">
                              {formatRelativeTime(quiz.date)}
                            </div>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black flex flex-col items-center flex-shrink-0 ${
                              isHigh
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : isMid
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <span>{pct}%</span>
                            {quiz.score !== undefined && quiz.questionsCount && (
                              <span className="text-[9px] font-normal opacity-80">
                                {quiz.score}/{quiz.questionsCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Devices Used Info */}
              {summary.devicesUsed && summary.devicesUsed.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      الأجهزة المسجلة والمتصلة بحسابك 📱💻
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    يسمح النظام بجهازين نشطين في نفس الوقت لحماية حسابك وضمان أمان بياناتك الأكاديمية.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {summary.devicesUsed.map((dev, idx) => (
                      <div
                        key={dev.deviceId || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            {idx === 0 ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {dev.label || `الجهاز ${idx + 1}`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {dev.deviceId ? `${dev.deviceId.slice(0, 14)}...` : 'معرف افتراضي'}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block">آخر نشاط:</span>
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                            {formatRelativeTime(dev.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FLASHCARDS & MEMORY PERSISTENCE */}
          {/* ========================================================================= */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              {/* Header Hero Card */}
              <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                        <Brain className="w-6 h-6 text-yellow-300" />
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black">كروت الاستذكار والذاكرة التفاعلية 🎴</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
                      نظام ذكي يتتبع حفظك لكل كارت فلاش كارد، يصنف نقاط القوة لديك مقابل النقاط الصعبة، ويوفر لك بنكاً فورياً للكروت المنسية لإعادة تثبيتها بضغطة زر واحدة.
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                    <span className="text-[11px] text-amber-200 block">نسبة الحفظ والإتقان الإجمالية:</span>
                    <div className="text-3xl font-black font-mono text-yellow-300">
                      {summary.flashcardMemory?.masteryPercentage || 0}%
                    </div>
                  </div>
                </div>

                {/* 4 Flashcard Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[11px] text-amber-200 block mb-1">إجمالي الكروت المراجعة</span>
                    <span className="text-xl sm:text-2xl font-black font-mono">{summary.flashcardMemory?.totalReviewed || 0}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 backdrop-blur-md border border-emerald-400/30 text-center">
                    <span className="text-[11px] text-emerald-300 block mb-1">✅ كروت متقنة ومحفوظة</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">{summary.flashcardMemory?.masteredCount || 0}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-950/40 backdrop-blur-md border border-rose-400/30 text-center">
                    <span className="text-[11px] text-rose-300 block mb-1">❌ كروت تحتاج تثبيت</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-rose-300">{summary.flashcardMemory?.needsPracticeCount || 0}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[11px] text-amber-200 block mb-1">المحاضرات المراجعة</span>
                    <span className="text-xl sm:text-2xl font-black font-mono">{summary.flashcardMemory?.byLecture?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Breakdown By Lecture (نسبة الحفظ لكل محاضرة) */}
              {summary.flashcardMemory?.byLecture && summary.flashcardMemory.byLecture.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        نسبة الحفظ والإتقان لكل محاضرة 📖
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {summary.flashcardMemory.byLecture.length} محاضرة تمت مراجعة كروتها
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.flashcardMemory.byLecture.map((lec) => (
                      <div
                        key={lec.lectureId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-amber-400 dark:hover:border-amber-600 transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                              {lec.lectureTitle}
                            </h4>
                            {lec.subjectTitle && (
                              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
                                {lec.subjectTitle}
                              </span>
                            )}
                          </div>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {lec.masteryPercentage}%
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${lec.masteryPercentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span>
                            ✅ متقن: <strong className="text-emerald-600 dark:text-emerald-400">{lec.masteredCount}</strong> • ❌ يحتاج تثبيت: <strong className="text-rose-600 dark:text-rose-400">{lec.needsPracticeCount}</strong>
                          </span>
                          <Link
                            href={`/lecture/${lec.lectureId}?tab=flashcards`}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 dark:hover:text-white font-bold text-[10px] transition flex items-center gap-1"
                          >
                            <span>مذاكرة</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Section 2: Forgotten Cards Bank (بنك الكروت المنسية التي تحتاج مراجعة الآن) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-600" />
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        بنك الكروت المنسية التي تحتاج مراجعة الآن (النقاط الصعبة) 🧠
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        قائمة فورية بالكروت التي حددتها كـ "نسيتها" أو "كنت فاكرها ونسيت" أو "فهمتها غلط" لإعادة تثبيتها مباشرة
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 self-start sm:self-auto">
                    {summary.flashcardMemory?.forgottenCards?.length || 0} كارت يحتاج تثبيت
                  </span>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      placeholder="ابحث في نص السؤال أو المفهوم..."
                      className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* State filter buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'forgot', label: '❌ نسيتها' },
                      { id: 'remembered_then_forgot', label: '🤔 كنت فاكرها' },
                      { id: 'misunderstood', label: '⚠️ فهمتها غلط' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setCardStateFilter(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          cardStateFilter === st.id
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Forgotten Cards List */}
                {(() => {
                  const forgotten = (summary.flashcardMemory?.forgottenCards || []).filter((card) => {
                    if (cardStateFilter !== 'all' && card.state !== cardStateFilter) return false;
                    if (cardSearchQuery.trim()) {
                      const q = cardSearchQuery.toLowerCase();
                      const f = (card.cardFront || '').toLowerCase();
                      const b = (card.cardBack || '').toLowerCase();
                      const l = (card.lectureTitle || '').toLowerCase();
                      if (!f.includes(q) && !b.includes(q) && !l.includes(q)) return false;
                    }
                    return true;
                  });

                  if (forgotten.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
                        <Sparkles className="w-10 h-10 mx-auto text-emerald-500" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          لا توجد كروت منسية تطابق هذا البحث!
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ممتاز! جميع كروتك المراجعة إما متقنة بنسبة 100% أو أنك لم تبدأ مراجعة الكروت بعد.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {forgotten.map((card, idx) => {
                        const cardKey = `${card.lectureId}_${card.cardId}`;
                        const isRevealed = !!revealedAnswers[cardKey];

                        return (
                          <div
                            key={cardKey + idx}
                            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-3 text-right hover:border-amber-400 dark:hover:border-amber-600 transition"
                          >
                            <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {card.lectureTitle || 'المحاضرة'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {card.state === 'remembered_then_forgot' ? (
                                  <span className="text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-md">🤔 كنت فاكرها بس نسيتها</span>
                                ) : card.state === 'misunderstood' ? (
                                  <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">⚠️ المعلومة وصلتني غلط</span>
                                ) : (
                                  <span className="text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">❌ نسيتها تماماً</span>
                                )}
                              </span>
                            </div>

                            {/* Question */}
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              {card.cardFront}
                            </p>

                            {/* Answer (Toggled) */}
                            {isRevealed && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line animate-in fade-in">
                                <strong className="block text-emerald-700 dark:text-emerald-400 mb-1 font-bold">
                                  الإجابة والشرح النموذجي:
                                </strong>
                                {card.cardBack}
                              </div>
                            )}

                            {/* Card Footer */}
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => setRevealedAnswers((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                                className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{isRevealed ? 'إخفاء الإجابة' : 'عرض الإجابة السريعة'}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px]">
                                  رُوجعت {card.reviewCount} مرة
                                </span>
                                <Link
                                  href={`/lecture/${card.lectureId}?tab=flashcards`}
                                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] transition flex items-center gap-1"
                                >
                                  <span>مذاكرة في المحاضرة</span>
                                  <ChevronLeft className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TIMELINE & ACTIVITY LOG */}
          {/* ========================================================================= */}
          {activeTab === 'timeline' && (
            <div className="space-y-8">
              {/* Chronological Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      سجل نشاطك الزمني المفصل (Timeline) ⏱️
                    </h2>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'video', label: 'فيديوهات 🎬' },
                      { id: 'pdf', label: 'ملفات PDF 📄' },
                      { id: 'audio', label: 'صوتيات 🎧' },
                      { id: 'flashcards', label: 'كروت 🎴' },
                      { id: 'quiz', label: 'كويزات ❓' },
                      { id: 'lecture', label: 'المحاضرات 📖' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFilter(f.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                          selectedFilter === f.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      لا توجد أنشطة مسجلة في هذا القسم بعد.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ابدأ بفتح أي محاضرة، قراءة تلخيص PDF، أو حل كويز وسيظهر وقتك وسجلك هنا فورياً.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const isVideo = log.targetType === 'video';
                      const isPdf = log.targetType === 'pdf';
                      const isAudio = log.targetType === 'audio';
                      const isQuiz = log.targetType === 'quiz';
                      const isCards = log.targetType === 'flashcards';

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-300 dark:hover:border-teal-700 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isVideo
                                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                                  : isPdf
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                  : isAudio
                                  ? 'bg-violet-100 dark:bg-violet-950 text-violet-600'
                                  : isCards
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                                  : isQuiz
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                                  : 'bg-teal-100 dark:bg-teal-950 text-teal-600'
                              }`}
                            >
                              {isVideo && <Video className="w-4 h-4" />}
                              {isPdf && <FileText className="w-4 h-4" />}
                              {isAudio && <Headphones className="w-4 h-4" />}
                              {isCards && <Layers className="w-4 h-4" />}
                              {isQuiz && <HelpCircle className="w-4 h-4" />}
                              {!isVideo && !isPdf && !isAudio && !isCards && !isQuiz && (
                                <BookOpen className="w-4 h-4" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                  {log.targetTitle}
                                </span>
                                {log.resourceTitle && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                                    {log.resourceTitle}
                                  </span>
                                )}
                                {log.subjectTitle && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                                    {log.subjectTitle}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>{new Date(log.startedAt).toLocaleString('ar-EG')}</span>
                                <span>•</span>
                                <span>آخر تفاعل: {formatRelativeTime(log.lastHeartbeatAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="self-end sm:self-auto flex-shrink-0">
                            <span className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold border border-teal-200 dark:border-teal-800/60 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatStudyDurationArabic(log.durationSeconds)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Devices Used Info */}
              {summary.devicesUsed && summary.devicesUsed.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      الأجهزة المسجلة والمتصلة بحسابك 📱💻
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    يسمح النظام بجهازين مفعلين في نفس الوقت لحماية حسابك وتأمين بيانات المذاكرة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {summary.devicesUsed.map((dev, idx) => (
                      <div
                        key={dev.deviceId || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            {idx === 0 ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {dev.label || `الجهاز ${idx + 1}`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {dev.deviceId ? `${dev.deviceId.slice(0, 14)}...` : 'معرف افتراضي'}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block">آخر نشاط:</span>
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                            {formatRelativeTime(dev.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
