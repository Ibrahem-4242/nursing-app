'use client';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SUBJECTS } from '@/lib/mock-data';
import { useStudentAuth } from '@/context/StudentAuthContext';
import DailyReviewQueueCard from '@/components/DailyReviewQueueCard';
import {
  StudentActivitySummary,
  StudentActivityLog,
  FlashcardReviewState,
  SpacedRepetitionCardItem,
  SpacedRepetitionSubjectGroup,
  SpacedRepetitionLectureGroup,
  PlatformFeaturesConfig,
  SubjectStudyProgress,
  StudentUser,
} from '@/lib/types';
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
  TrendingDown,
  BookmarkCheck,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
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
  Stethoscope,
  Lightbulb,
  RotateCw,
  Download,
  Copy,
  Check,
  Filter,
  History,
  FolderTree,
} from 'lucide-react';


function createZeroSummary(student: StudentUser | null): StudentActivitySummary {
  const targetYearId = student?.yearId || '1';
  const defaultSubjects = SUBJECTS.filter((s) => s.yearId === targetYearId);
  const subjectProgress: SubjectStudyProgress[] = defaultSubjects.map((s) => ({
    subjectId: s.id,
    subjectTitle: s.title,
    totalLectures: s.totalLectures || 0,
    openedLecturesCount: 0,
    percent: 0,
    totalDurationSeconds: 0,
  }));

  return {
    studentId: student?.id || student?.phone || '',
    studentName: student?.name || 'طالب',
    studentPhone: student?.phone || '',
    university: student?.university || '',
    yearId: targetYearId,
    totalStudySeconds: 0,
    totalSessions: 0,
    byTypeBreakdown: {},
    recentLogs: [],
    subjectProgress,
    quizStats: {
      totalQuizzesTaken: 0,
      averageScorePercent: 0,
      quizzes: [],
    },
    flashcardsStats: {
      totalSessions: 0,
      totalDurationSeconds: 0,
    },
    flashcardMemory: {
      totalReviewed: 0,
      masteredCount: 0,
      rememberedThenForgotCount: 0,
      misunderstoodCount: 0,
      forgotCount: 0,
      needsPracticeCount: 0,
      masteryPercentage: 0,
      rememberedThenForgotPercentage: 0,
      misunderstoodPercentage: 0,
      forgotPercentage: 0,
      byLecture: [],
      forgottenCards: [],
      misunderstoodCards: [],
      repeatedCards: [],
      spacedRepetition: {
        totalRepeatedCards: 0,
        totalReviewsAcrossRepeated: 0,
        improvedCardsCount: 0,
        declinedCardsCount: 0,
        stableMasteredCount: 0,
        strugglingCount: 0,
        mostRepeatedCards: [],
        hierarchyBySubject: [],
      },
    },
    devicesUsed: [],
  };
}

export default function StudentDashboardPage() {
  const { student, isLoggedIn, openAuthModal, isLoading: authLoading } = useStudentAuth();
  const [summary, setSummary] = useState<StudentActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'timeline'>('overview');
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardLectureFilter, setCardLectureFilter] = useState('all');
  const [cardStateFilter, setCardStateFilter] = useState<string>('all');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Spaced Repetition Analytics States
  const [spacedSearchQuery, setSpacedSearchQuery] = useState('');
  const [spacedSubjectFilter, setSpacedSubjectFilter] = useState('all');
  const [spacedDateFilter, setSpacedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [spacedTrajectoryFilter, setSpacedTrajectoryFilter] = useState('all');
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [collapsedLectures, setCollapsedLectures] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [expandedCardHistory, setExpandedCardHistory] = useState<Record<string, boolean>>({});
  const [revealedSpacedAnswers, setRevealedSpacedAnswers] = useState<Record<string, boolean>>({});
  const [platformFeatures, setPlatformFeatures] = useState<PlatformFeaturesConfig | null>(null);

  const activeSummary = summary || createZeroSummary(student);
  const targetYearId = student?.yearId || '1';
  const defaultYearSubjects = SUBJECTS.filter((s) => s.yearId === targetYearId).map((s) => ({
    subjectId: s.id,
    subjectTitle: s.title,
    totalLectures: s.totalLectures || 0,
    openedLecturesCount: 0,
    percent: 0,
    totalDurationSeconds: 0,
  }));
  const effectiveSubjectProgress: SubjectStudyProgress[] =
    (activeSummary.subjectProgress && activeSummary.subjectProgress.length > 0)
      ? activeSummary.subjectProgress
      : defaultYearSubjects.length > 0
      ? defaultYearSubjects
      : SUBJECTS.slice(0, 3).map((s) => ({
          subjectId: s.id,
          subjectTitle: s.title,
          totalLectures: s.totalLectures || 0,
          openedLecturesCount: 0,
          percent: 0,
          totalDurationSeconds: 0,
        }));


  useEffect(() => {
    if (!isLoggedIn || !student) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    const targetStudentId = student.id || student.phone;

    // Dual-route fetch: Primary unblockable stats endpoint, fallback to activity endpoint
    const fetchSummaryData = async (): Promise<StudentActivitySummary | null> => {
      // 1. Primary dedicated route (immune to Brave Shields and adblockers)
      try {
        const url1 = `/api/student/dashboard-stats?studentId=${encodeURIComponent(targetStudentId)}&t=${Date.now()}`;
        const res1 = await fetch(url1, { cache: 'no-store' });
        if (res1.ok) {
          const data1 = await res1.json();
          if (data1 && data1.success && data1.summary) {
            return data1.summary;
          }
        }
      } catch (e1) {
        console.warn('[StudentDashboard] primary dashboard-stats notice:', e1);
      }

      // 2. Secondary fallback route
      try {
        const url2 = `/api/student/activity?summary=true&studentId=${encodeURIComponent(targetStudentId)}&t=${Date.now()}`;
        const res2 = await fetch(url2, { cache: 'no-store' });
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.success && data2.summary) {
            return data2.summary;
          }
        }
      } catch (e2) {
        console.warn('[StudentDashboard] secondary activity notice:', e2);
      }
      return null;
    };

    Promise.all([
      fetchSummaryData(),
      fetch(`/api/features?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ])
      .then(([summaryResult, featData]) => {
        if (!isMounted) return;
        if (summaryResult) {
          setSummary(summaryResult);
          setErrorMessage(null);
        } else {
          setErrorMessage('لم نتمكن من جلب ملخص الإحصائيات، يرجى المحاولة مرة أخرى.');
        }
        if (featData && featData.success && featData.features) {
          setPlatformFeatures(featData.features);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch student study summary or features:', err);
        if (isMounted) setErrorMessage(err?.message || 'خطأ في الاتصال بالشبكة');
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

  const formatArabicDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderCardStateBadge = (st: FlashcardReviewState) => {
    switch (st) {
      case 'knew':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>متقنها وفاكرها كويس</span>
          </span>
        );
      case 'remembered_then_forgot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>كنت فاكرها بس نسيتها</span>
          </span>
        );
      case 'misunderstood':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Stethoscope className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>المعلومة وصلتلي غلط</span>
          </span>
        );
      case 'forgot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <RotateCw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>مش فاكرها خالص / صعبة</span>
          </span>
        );
      default:
        return null;
    }
  };

  const renderCardTrajectory = (item: SpacedRepetitionCardItem) => {
    switch (item.improvementStatus) {
      case 'improved':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-black shadow-xs">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تحسن ملحوظ في الحفظ 📈 (ارتقاء إلى الإتقان)</span>
          </div>
        );
      case 'declined':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-black shadow-xs">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>تراجع في التذكر 📉 (يحتاج تثبيت فوري قبل النسيان)</span>
          </div>
        );
      case 'stable_mastered':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-black shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>إتقان راسخ وثابت 🛡️ (استقرار طويل المدى)</span>
          </div>
        );
      case 'struggling':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-black shadow-xs">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>تكرار مع استمرار الصعوبة 🔄 (نقطة تركيز للمذاكرة)</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleExportSpacedSummary = () => {
    if (!activeSummary.flashcardMemory?.spacedRepetition) return;
    const sp = activeSummary.flashcardMemory.spacedRepetition;

    let text = `📋 تقرير تحليلات تكرار المراجعة (Spaced Repetition Analytics)\n`;
    text += `👤 الطالب: ${student?.name || 'غير معروف'} (${student?.phone || ''})\n`;
    text += `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}\n`;
    text += `========================================================\n\n`;
    text += `📊 إحصائيات عامة لتكرار المراجعة:\n`;
    text += `• إجمالي الكروت المكررة (Review Count > 1): ${sp.totalRepeatedCards} كارت\n`;
    text += `• إجمالي جلسات التكرار عبر الكروت: ${sp.totalReviewsAcrossRepeated} مرة\n`;
    text += `• كروت شهدت تحسناً ملحوظاً 📈: ${sp.improvedCardsCount}\n`;
    text += `• كروت حافظت على الإتقان 🛡️: ${sp.stableMasteredCount}\n`;
    text += `• كروت تراجعت وتحتاج تثبيت 📉: ${sp.declinedCardsCount}\n`;
    text += `• كروت مستمرة في الصعوبة 🔄: ${sp.strugglingCount}\n\n`;
    text += `========================================================\n`;
    text += `🎴 تفاصيل الكروت المكررة مقسمة هرمياً (المادة ⬅️ المحاضرة ⬅️ الكروت):\n\n`;

    sp.hierarchyBySubject.forEach((subGroup) => {
      text += `📚 المادة: ${subGroup.subjectTitle} (إجمالي ${subGroup.totalCards} كارت مكرر • ${subGroup.totalRepetitions} تكرار)\n`;
      subGroup.lectures.forEach((lecGroup) => {
        text += `  📖 المحاضرة: ${lecGroup.lectureTitle} (${lecGroup.cardsCount} كارت مكرر)\n`;
        lecGroup.cards.forEach((card, idx) => {
          text += `    [${idx + 1}] السؤال: ${card.cardFront}\n`;
          text += `        الإجابة: ${card.cardBack}\n`;
          text += `        عدد مرات المراجعة: ${card.reviewCount} مرات (${card.improvementLabel})\n`;
          if (card.history && card.history.length > 0) {
            text += `        سجل المراجعات والتواريخ:\n`;
            card.history.forEach((h, hIdx) => {
              const stName =
                h.state === 'knew'
                  ? 'متقنها وفاكرها كويس'
                  : h.state === 'remembered_then_forgot'
                  ? 'كنت فاكرها بس نسيتها'
                  : h.state === 'misunderstood'
                  ? 'المعلومة وصلتلي غلط'
                  : 'مش فاكرها خالص/صعبة';
              text += `          - مراجعة ${hIdx + 1}: ${new Date(h.reviewedAt).toLocaleString('ar-EG')} [${stName}]\n`;
            });
          }
          text += `\n`;
        });
      });
      text += `--------------------------------------------------------\n`;
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }

    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spaced-repetition-${student?.name || 'student'}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const filteredSpacedHierarchy = (() => {
    const sp = activeSummary.flashcardMemory?.spacedRepetition;
    if (!sp || !sp.hierarchyBySubject || sp.hierarchyBySubject.length === 0) return [];

    const now = Date.now();

    return sp.hierarchyBySubject
      .map((subGroup) => {
        if (
          spacedSubjectFilter !== 'all' &&
          subGroup.subjectId !== spacedSubjectFilter &&
          subGroup.subjectTitle !== spacedSubjectFilter
        ) {
          return null;
        }

        const filteredLectures = subGroup.lectures
          .map((lecGroup) => {
            const filteredCards = lecGroup.cards.filter((card) => {
              if (spacedSearchQuery.trim()) {
                const q = spacedSearchQuery.toLowerCase();
                const f = (card.cardFront || '').toLowerCase();
                const b = (card.cardBack || '').toLowerCase();
                const l = (card.lectureTitle || '').toLowerCase();
                const s = (card.subjectTitle || '').toLowerCase();
                if (!f.includes(q) && !b.includes(q) && !l.includes(q) && !s.includes(q)) return false;
              }

              if (spacedTrajectoryFilter !== 'all' && card.improvementStatus !== spacedTrajectoryFilter) {
                return false;
              }

              if (spacedDateFilter !== 'all') {
                const cardTime = new Date(card.latestReviewedAt || card.reviewedAt).getTime();
                const diffHours = (now - cardTime) / (1000 * 3600);
                if (spacedDateFilter === 'today' && diffHours > 24) return false;
                if (spacedDateFilter === 'week' && diffHours > 24 * 7) return false;
                if (spacedDateFilter === 'month' && diffHours > 24 * 30) return false;
              }

              return true;
            });

            if (filteredCards.length === 0) return null;

            return {
              ...lecGroup,
              cardsCount: filteredCards.length,
              cards: filteredCards,
            };
          })
          .filter(Boolean) as SpacedRepetitionLectureGroup[];

        if (filteredLectures.length === 0) return null;

        const totalCards = filteredLectures.reduce((acc, l) => acc + l.cardsCount, 0);
        const totalRepetitions = filteredLectures.reduce(
          (acc, l) => acc + l.cards.reduce((cAcc, c) => cAcc + c.reviewCount, 0),
          0
        );

        return {
          ...subGroup,
          totalCards,
          totalRepetitions,
          lectures: filteredLectures,
        };
      })
      .filter(Boolean) as SpacedRepetitionSubjectGroup[];
  })();

  const totalFilteredSpacedCards = filteredSpacedHierarchy.reduce(
    (acc, sub) => acc + sub.totalCards,
    0
  );

  const availableSpacedSubjects = (() => {
    const sp = activeSummary.flashcardMemory?.spacedRepetition;
    if (!sp || !sp.hierarchyBySubject) return [];
    return sp.hierarchyBySubject.map((s) => ({
      id: s.subjectId,
      title: s.subjectTitle,
      count: s.totalCards,
    }));
  })();

    if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">جاري فحص الحساب الأكاديمي...</p>
        </div>
      </div>
    );
  }

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

  const filteredLogs = (activeSummary.recentLogs || []).filter((log) => {
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
              {(student?.name || 'ط').charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black">{student?.name || 'طالب'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {student?.university || 'الجامعة'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  السنة {student?.yearId ===  '2' ? 'الثانية' : student.yearId === '3' ? 'الثالثة' : student.yearId === '4' ? 'الرابعة' : 'الأولى'}
                </span>
              </div>
              <div className="text-xs text-teal-100 flex items-center gap-3">
                <span className="font-mono" dir="ltr">{student?.phone || ''}</span>
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

      {/* Subtle sync indicators */}
      {loading && !summary && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>جاري مزامنة أحدث إحصائياتك من السيرفر الأكاديمي...</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>يتم عرض البيانات التأسيسية الآن، اضغط تحديث للمزامنة المباشرة.</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-[11px] hover:bg-amber-700 transition"
          >
            تحديث الآن
          </button>
        </div>
      )}
          {/* 🧠 Daily Spaced Repetition Review Queue Card */}
          {platformFeatures?.dailyReviewDose !== false && <DailyReviewQueueCard yearId={student?.yearId} />}

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

            {platformFeatures?.flashcards !== false && (
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
                {activeSummary.flashcardMemory?.forgottenCards && activeSummary.flashcardMemory.forgottenCards.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                    {activeSummary.flashcardMemory.forgottenCards.length}
                  </span>
                )}
              </button>
            )}

            {platformFeatures?.studentActivityTracking !== false && (
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
            )}
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
                      {formatStudyDurationArabic(activeSummary.totalStudySeconds)}
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
                      {activeSummary.totalSessions}
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
                    <span className="text-[11px] font-bold text-slate-400 block">كروت الاستذكار والذاكرة</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {activeSummary.flashcardMemory?.totalReviewed || activeSummary.byTypeBreakdown?.flashcards?.count || 0}
                      </span>
                      {activeSummary.flashcardMemory?.masteryPercentage !== undefined ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ({activeSummary.flashcardMemory.masteryPercentage}% إتقان)
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {activeSummary.flashcardMemory && activeSummary.flashcardMemory.totalReviewed > 0 ? (
                    <div className="pt-1 text-[10px] space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${activeSummary.flashcardMemory.masteryPercentage}%` }} title={`متقنة: ${activeSummary.flashcardMemory.masteryPercentage}%`} />
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${activeSummary.flashcardMemory.rememberedThenForgotPercentage}%` }} title={`فاكرها ونسيت: ${activeSummary.flashcardMemory.rememberedThenForgotPercentage}%`} />
                        <div className="bg-indigo-500 h-full transition-all" style={{ width: `${activeSummary.flashcardMemory.misunderstoodPercentage}%` }} title={`وصلت غلط: ${activeSummary.flashcardMemory.misunderstoodPercentage}%`} />
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${activeSummary.flashcardMemory.forgotPercentage}%` }} title={`منسية: ${activeSummary.flashcardMemory.forgotPercentage}%`} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="text-emerald-600 dark:text-emerald-400">🟢 {activeSummary.flashcardMemory.masteredCount} متقن</span>
                        <span className="text-indigo-600 dark:text-indigo-400">🩺 {activeSummary.flashcardMemory.misunderstoodCount} تصحيح</span>
                        <span className="text-rose-600 dark:text-rose-400">🔴 {activeSummary.flashcardMemory.forgotCount} منسي</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                      كارت تمت مراجعته وتثبيته 🎴
                    </span>
                  )}
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
                        {activeSummary.quizStats?.totalQuizzesTaken || 0}
                      </span>
                      {activeSummary.quizStats?.averageScorePercent ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          (متوسط {activeSummary.quizStats.averageScorePercent}%)
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
              {effectiveSubjectProgress && effectiveSubjectProgress.length > 0 && (
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
                    {effectiveSubjectProgress.map((sub) => (
                      <Link
                        key={sub.subjectId}
                        href={`/subject/${sub.subjectId}`}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-600 transition group block space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition text-slate-900 dark:text-white">
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
              {activeSummary.quizStats && activeSummary.quizStats.quizzes.length > 0 && (
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
                    {activeSummary.quizStats.quizzes.map((quiz) => {
                      const pct = quiz.percentage ?? 0;
                      const isHigh = pct >= 80;
                      const isMid = pct >= 60 && pct < 80;

                      return (
                        <div
                          key={quiz.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3"
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
              {activeSummary.devicesUsed && activeSummary.devicesUsed.length > 0 && (
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
                    {activeSummary.devicesUsed.map((dev, idx) => (
                      <div
                        key={dev.deviceId || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
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
          {activeTab === 'flashcards' && platformFeatures?.flashcards !== false && (
            <div className="space-y-6">
              {/* Header Hero Card */}
              <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                        <Brain className="w-6 h-6 text-yellow-300" />
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black">كروت الاستذكار والذاكرة التفاعلية 🎴</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
                      نظام ذكي يتتبع حفظك لكل كارت فلاش كارد، يحلل توزيع استيعابك للمفاهيم الطبية عبر 4 حالات دقيقة، ويوفر لك بنكاً فورياً للكروت المنسية لإعادة تثبيتها وتصحيحها بضغطة زر.
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                    <span className="text-[11px] text-amber-200 block">إجمالي كروت المنهج المراجعة:</span>
                    <div className="text-3xl font-black font-mono text-yellow-300">
                      {activeSummary.flashcardMemory?.totalReviewed || 0} <span className="text-sm font-normal text-amber-100">كارت</span>
                    </div>
                  </div>
                </div>

                {/* The 4 Distinct Comprehension State Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {/* State 1: Mastered (knew) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/50 backdrop-blur-md border border-emerald-400/40 text-right space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                        <Award className="w-4 h-4" />
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-300">
                        {activeSummary.flashcardMemory?.masteryPercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1">
                        <span>متقنها وفاكرها كويس</span>
                        <span className="text-emerald-400 text-xs">✨</span>
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 mt-0.5">متقنة وجاهزة للامتحان النهائي</p>
                    </div>
                    <div className="pt-2 border-t border-emerald-400/20 flex items-center justify-between text-xs text-emerald-100">
                      <span>العدد الفعلي:</span>
                      <strong className="font-mono font-black text-emerald-300">{activeSummary.flashcardMemory?.masteredCount || 0} كارت</strong>
                    </div>
                  </div>

                  {/* State 2: Remembered then forgot */}
                  <div className="p-4 rounded-2xl bg-amber-950/50 backdrop-blur-md border border-amber-400/40 text-right space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                        <Lightbulb className="w-4 h-4" />
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-300">
                        {activeSummary.flashcardMemory?.rememberedThenForgotPercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1">
                        <span>كنت فاكرها بس نسيتها</span>
                        <span className="text-amber-400 text-xs">💡</span>
                      </h4>
                      <p className="text-[11px] text-amber-200/90 mt-0.5">محفوظة مسبقاً وتحتاج تذكيراً سريعاً</p>
                    </div>
                    <div className="pt-2 border-t border-amber-400/20 flex items-center justify-between text-xs text-amber-100">
                      <span>العدد الفعلي:</span>
                      <strong className="font-mono font-black text-amber-300">{activeSummary.flashcardMemory?.rememberedThenForgotCount || 0} كارت</strong>
                    </div>
                  </div>

                  {/* State 3: Misunderstood / Medical Concept Correction */}
                  <div className="p-4 rounded-2xl bg-indigo-950/60 backdrop-blur-md border border-indigo-400/50 text-right space-y-2 relative overflow-hidden group ring-1 ring-indigo-400/30">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-indigo-500/30 text-indigo-200">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <span className="text-2xl font-black font-mono text-indigo-200">
                        {activeSummary.flashcardMemory?.misunderstoodPercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-black text-sm text-white">المعلومة وصلتلي غلط</h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/40 text-indigo-100 border border-indigo-400/30">
                          تصحيح فوري
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200/90 mt-0.5">مفهوم طبي ملتبس يحتاج إعادة ضبط</p>
                    </div>
                    <div className="pt-2 border-t border-indigo-400/20 flex items-center justify-between text-xs text-indigo-100">
                      <span>العدد الفعلي:</span>
                      <strong className="font-mono font-black text-indigo-200">{activeSummary.flashcardMemory?.misunderstoodCount || 0} كارت</strong>
                    </div>
                  </div>

                  {/* State 4: Hard / Forgot */}
                  <div className="p-4 rounded-2xl bg-rose-950/50 backdrop-blur-md border border-rose-400/40 text-right space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                        <RotateCw className="w-4 h-4" />
                      </span>
                      <span className="text-2xl font-black font-mono text-rose-300">
                        {activeSummary.flashcardMemory?.forgotPercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1">
                        <span>مش فاكرها خالص / صعبة</span>
                        <span className="text-rose-400 text-xs">🔄</span>
                      </h4>
                      <p className="text-[11px] text-rose-200/90 mt-0.5">منسية كلياً وتحتاج تكراراً مكثفاً</p>
                    </div>
                    <div className="pt-2 border-t border-rose-400/20 flex items-center justify-between text-xs text-rose-100">
                      <span>العدد الفعلي:</span>
                      <strong className="font-mono font-black text-rose-300">{activeSummary.flashcardMemory?.forgotCount || 0} كارت</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehension Distribution Chart (الرسم البياني لتوزيع استيعاب الطالب) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      مخطط توزيع استيعاب الذاكرة ومستوى التمكن 📊
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    مبني على تقييمك الحقيقي لـ {activeSummary.flashcardMemory?.totalReviewed || 0} كارت
                  </span>
                </div>

                {/* Stacked Proportional Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-2xl overflow-hidden flex p-0.5 shadow-inner">
                    {activeSummary.flashcardMemory && activeSummary.flashcardMemory.totalReviewed > 0 ? (
                      <>
                        {activeSummary.flashcardMemory.masteryPercentage > 0 && (
                          <div
                            className="bg-emerald-500 h-full rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] text-white font-bold font-mono px-1 truncate"
                            style={{ width: `${activeSummary.flashcardMemory.masteryPercentage}%` }}
                            title={`متقنة: ${activeSummary.flashcardMemory.masteryPercentage}%`}
                          >
                            {activeSummary.flashcardMemory.masteryPercentage >= 10 ? `${activeSummary.flashcardMemory.masteryPercentage}%` : ''}
                          </div>
                        )}
                        {activeSummary.flashcardMemory.rememberedThenForgotPercentage > 0 && (
                          <div
                            className="bg-amber-500 h-full rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] text-white font-bold font-mono px-1 truncate"
                            style={{ width: `${activeSummary.flashcardMemory.rememberedThenForgotPercentage}%` }}
                            title={`كنت فاكرها ونسيت: ${activeSummary.flashcardMemory.rememberedThenForgotPercentage}%`}
                          >
                            {activeSummary.flashcardMemory.rememberedThenForgotPercentage >= 10 ? `${activeSummary.flashcardMemory.rememberedThenForgotPercentage}%` : ''}
                          </div>
                        )}
                        {activeSummary.flashcardMemory.misunderstoodPercentage > 0 && (
                          <div
                            className="bg-indigo-600 h-full rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] text-white font-bold font-mono px-1 truncate"
                            style={{ width: `${activeSummary.flashcardMemory.misunderstoodPercentage}%` }}
                            title={`المعلومة وصلت غلط: ${activeSummary.flashcardMemory.misunderstoodPercentage}%`}
                          >
                            {activeSummary.flashcardMemory.misunderstoodPercentage >= 10 ? `${activeSummary.flashcardMemory.misunderstoodPercentage}%` : ''}
                          </div>
                        )}
                        {activeSummary.flashcardMemory.forgotPercentage > 0 && (
                          <div
                            className="bg-rose-500 h-full rounded-xl transition-all duration-700 flex items-center justify-center text-[10px] text-white font-bold font-mono px-1 truncate"
                            style={{ width: `${activeSummary.flashcardMemory.forgotPercentage}%` }}
                            title={`منسية / صعبة: ${activeSummary.flashcardMemory.forgotPercentage}%`}
                          >
                            {activeSummary.flashcardMemory.forgotPercentage >= 10 ? `${activeSummary.flashcardMemory.forgotPercentage}%` : ''}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-400">
                        لم تبدأ مراجعة الكروت بعد
                      </div>
                    )}
                  </div>

                  {/* Interactive Legend with detailed numbers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">متقنة ومحفوظة</span>
                      </div>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {activeSummary.flashcardMemory?.masteryPercentage || 0}% ({activeSummary.flashcardMemory?.masteredCount || 0})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-amber-900 dark:text-amber-200">كنت فاكرها ونسيت</span>
                      </div>
                      <span className="font-mono font-black text-amber-700 dark:text-amber-400">
                        {activeSummary.flashcardMemory?.rememberedThenForgotPercentage || 0}% ({activeSummary.flashcardMemory?.rememberedThenForgotCount || 0})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <span className="font-bold text-indigo-900 dark:text-indigo-200">وصلتلي غلط</span>
                      </div>
                      <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">
                        {activeSummary.flashcardMemory?.misunderstoodPercentage || 0}% ({activeSummary.flashcardMemory?.misunderstoodCount || 0})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="font-bold text-rose-900 dark:text-rose-200">منسية / صعبة</span>
                      </div>
                      <span className="font-mono font-black text-rose-700 dark:text-rose-400">
                        {activeSummary.flashcardMemory?.forgotPercentage || 0}% ({activeSummary.flashcardMemory?.forgotCount || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Breakdown By Lecture (نسبة الحفظ لكل محاضرة) */}
              {activeSummary.flashcardMemory?.byLecture && activeSummary.flashcardMemory.byLecture.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        نسبة الحفظ والإتقان لكل محاضرة 📖
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {activeSummary.flashcardMemory.byLecture.length} محاضرة تمت مراجعة كروتها
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeSummary.flashcardMemory.byLecture.map((lec) => (
                      <div
                        key={lec.lectureId}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-amber-400 dark:hover:border-amber-600 transition group"
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
                    {activeSummary.flashcardMemory?.forgottenCards?.length || 0} كارت يحتاج تثبيت
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
                      { id: 'all', label: `الكل (${(activeSummary.flashcardMemory?.forgottenCards || []).length})` },
                      { id: 'remembered_then_forgot', label: `💡 كنت فاكرها (${activeSummary.flashcardMemory?.rememberedThenForgotCount || 0})` },
                      { id: 'misunderstood', label: `🩺 وصلت غلط (${activeSummary.flashcardMemory?.misunderstoodCount || 0})` },
                      { id: 'forgot', label: `🔄 منسية كلياً (${activeSummary.flashcardMemory?.forgotCount || 0})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setCardStateFilter(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          cardStateFilter === st.id
                            ? 'bg-amber-600 text-white shadow-xs'
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
                  const forgotten = (activeSummary.flashcardMemory?.forgottenCards || []).filter((card) => {
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
                      <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
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
                            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 space-y-3 text-right hover:border-amber-400 dark:hover:border-amber-600 transition"
                          >
                            <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {card.lectureTitle || 'المحاضرة'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {card.state === 'remembered_then_forgot' ? (
                                  <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3 text-amber-500" />
                                    <span>كنت فاكرها بس نسيتها</span>
                                  </span>
                                ) : card.state === 'misunderstood' ? (
                                  <span className="text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-black">
                                    <Stethoscope className="w-3 h-3 text-indigo-500" />
                                    <span>المعلومة وصلتلي غلط • محتاجة تصحيح فوري ⚠️</span>
                                  </span>
                                ) : (
                                  <span className="text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <RotateCw className="w-3 h-3 text-rose-500" />
                                    <span>مش فاكرها خالص / صعبة</span>
                                  </span>
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

              {/* ========================================================================= */}
              {/* SECTION 3: SPACED REPETITION ANALYTICS (تحليلات تكرار المراجعة المتقدمة) */}
              {/* ========================================================================= */}
              {platformFeatures?.spacedRepetitionAnalytics !== false && (
                <div id="spaced-repetition" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
                {/* Header with Title and Export Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          تحليلات تكرار المراجعة (Spaced Repetition Analytics) 🔁
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {activeSummary.flashcardMemory?.spacedRepetition?.totalRepeatedCards || 0} كارت مكرر
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        تقسيم هرمي للكروت المراجعة أكثر من مرة (المادة ⬅️ المحاضرة ⬅️ الكروت) وسجل التواريخ ومسار تطور الحفظ
                      </p>
                    </div>
                  </div>

                  {/* Export and Action Buttons */}
                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportSpacedSummary}
                      disabled={!activeSummary.flashcardMemory?.spacedRepetition?.totalRepeatedCards}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                      title="نسخ وتنزيل تقرير نصي شامل بالكروت الأكثر تكراراً"
                    >
                      {copyFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>تم نسخ وحفظ التقرير! 📋</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>تصدير ملخص الكروت الأكثر تكراراً 📥</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-right space-y-1">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">الكروت المكررة (مرات &gt; 1)</span>
                    <div className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                      {activeSummary.flashcardMemory?.spacedRepetition?.totalRepeatedCards || 0}
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block">
                      إجمالي {activeSummary.flashcardMemory?.spacedRepetition?.totalReviewsAcrossRepeated || 0} جلسة تكرار
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-right space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">شهدت تحسناً ملحوظاً 📈</span>
                    <div className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                      {activeSummary.flashcardMemory?.spacedRepetition?.improvedCardsCount || 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 block">
                      ارتقاء إلى الإتقان بعد النسيان
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-right space-y-1">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block">إتقان راسخ وثابت 🛡️</span>
                    <div className="text-2xl font-black font-mono text-blue-900 dark:text-blue-200">
                      {activeSummary.flashcardMemory?.spacedRepetition?.stableMasteredCount || 0}
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400/80 block">
                      مستقر في الذاكرة طويلة المدى
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-right space-y-1">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">تراجع أو صعوبة مستمرة 🔄</span>
                    <div className="text-2xl font-black font-mono text-rose-900 dark:text-rose-200">
                      {(activeSummary.flashcardMemory?.spacedRepetition?.declinedCardsCount || 0) +
                        (activeSummary.flashcardMemory?.spacedRepetition?.strugglingCount || 0)}
                    </div>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400/80 block">
                      نقاط تركيز تحتاج تثبيت وإعادة شرح
                    </span>
                  </div>
                </div>

                {/* Search & Filter Controls Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type="text"
                        value={spacedSearchQuery}
                        onChange={(e) => setSpacedSearchQuery(e.target.value)}
                        placeholder="ابحث في نص السؤال، الإجابة، أو المحاضرة..."
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Filter by Subject */}
                    <div className="w-full md:w-auto min-w-[180px]">
                      <select
                        value={spacedSubjectFilter}
                        onChange={(e) => setSpacedSubjectFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="all">كل المواد الدراسية 📚</option>
                        {availableSpacedSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.title} ({sub.count} كارت)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Review Date */}
                    <div className="w-full md:w-auto min-w-[160px]">
                      <select
                        value={spacedDateFilter}
                        onChange={(e) => setSpacedDateFilter(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="all">كل التواريخ 🗓️</option>
                        <option value="today">مراجعات اليوم (24 س) 🕒</option>
                        <option value="week">آخر 7 أيام 📅</option>
                        <option value="month">آخر 30 يوماً 🗓️</option>
                      </select>
                    </div>

                    {/* Filter by Trajectory */}
                    <div className="w-full md:w-auto min-w-[170px]">
                      <select
                        value={spacedTrajectoryFilter}
                        onChange={(e) => setSpacedTrajectoryFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="all">كل مسارات التطور 📈</option>
                        <option value="improved">تحسن ملحوظ 📈</option>
                        <option value="stable_mastered">إتقان ثابت 🛡️</option>
                        <option value="declined">تراجع في الحفظ 📉</option>
                        <option value="struggling">صعوبة مستمرة 🔄</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Badges Active Summary */}
                  {(spacedSearchQuery || spacedSubjectFilter !== 'all' || spacedDateFilter !== 'all' || spacedTrajectoryFilter !== 'all') && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500">
                      <span>
                        تم العثور على <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{totalFilteredSpacedCards}</strong> كارت مكرر يطابق الفلاتر
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSpacedSearchQuery('');
                          setSpacedSubjectFilter('all');
                          setSpacedDateFilter('all');
                          setSpacedTrajectoryFilter('all');
                        }}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[11px]"
                      >
                        إلغاء الفلاتر
                      </button>
                    </div>
                  )}
                </div>

                {/* Hierarchical Breakdown List (Subject ➡️ Lecture ➡️ Cards) */}
                {(() => {
                  if (!activeSummary.flashcardMemory?.spacedRepetition?.totalRepeatedCards) {
                    return (
                      <div className="py-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-8 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 mx-auto flex items-center justify-center">
                          <RotateCcw className="w-8 h-8" />
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">
                          لا توجد كروت تمت مراجعتها أكثر من مرة بعد 🔁
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                          نظام التكرار المتباعد (Spaced Repetition) يقوم تلقائياً برصد وتتبع أي كارت تراجعه مرتين أو أكثر، مع توثيق تواريخ المراجعات الدقيقة ومسار تحسن استيعابك (هل ارتقيت للإتقان أم تحتاج تثبيت إضافي).
                        </p>
                        <div className="pt-2">
                          <Link
                            href="/subjects"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                          >
                            <span>ابدأ بمراجعة كروت المحاضرات الآن</span>
                            <ChevronLeft className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  if (filteredSpacedHierarchy.length === 0) {
                    return (
                      <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                        <Search className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          لا توجد كروت مكررة تطابق هذا البحث أو الفلاتر المحددة!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSpacedSearchQuery('');
                            setSpacedSubjectFilter('all');
                            setSpacedDateFilter('all');
                            setSpacedTrajectoryFilter('all');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold transition hover:bg-amber-700"
                        >
                          إعادة ضبط جميع الفلاتر
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {filteredSpacedHierarchy.map((subGroup) => {
                        const isSubCollapsed = !!collapsedSubjects[subGroup.subjectId];

                        return (
                          <div
                            key={subGroup.subjectId}
                            className="rounded-3xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                          >
                            {/* LEVEL 1: Subject Header */}
                            <div
                              onClick={() =>
                                setCollapsedSubjects((prev) => ({
                                  ...prev,
                                  [subGroup.subjectId]: !prev[subGroup.subjectId],
                                }))
                              }
                              className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-amber-500/15 transition border-b border-slate-200/80 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{subGroup.subjectTitle}</span>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                                      مادة دراسية
                                    </span>
                                  </h4>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                                    {subGroup.totalCards} كارت مكرر • {subGroup.totalRepetitions} جلسة مراجعة عبر {subGroup.lectures.length} محاضرة
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {isSubCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                              </button>
                            </div>

                            {/* LEVEL 2: Lectures inside Subject */}
                            {!isSubCollapsed && (
                              <div className="p-4 sm:p-5 space-y-5">
                                {subGroup.lectures.map((lecGroup) => {
                                  const isLecCollapsed = !!collapsedLectures[lecGroup.lectureId];

                                  return (
                                    <div
                                      key={lecGroup.lectureId}
                                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-4 sm:p-5"
                                    >
                                      {/* Lecture Header */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div
                                          onClick={() =>
                                            setCollapsedLectures((prev) => ({
                                              ...prev,
                                              [lecGroup.lectureId]: !prev[lecGroup.lectureId],
                                            }))
                                          }
                                          className="flex items-center gap-2 cursor-pointer select-none group"
                                        >
                                          <Layers className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                                            {lecGroup.lectureTitle}
                                          </h5>
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {lecGroup.cardsCount} كارت
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                          <Link
                                            href={`/lecture/${lecGroup.lectureId}?tab=flashcards`}
                                            className="px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 dark:hover:text-white font-bold text-[11px] transition flex items-center gap-1"
                                          >
                                            <span>مذاكرة في المحاضرة</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </Link>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setCollapsedLectures((prev) => ({
                                                ...prev,
                                                [lecGroup.lectureId]: !prev[lecGroup.lectureId],
                                              }))
                                            }
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                          >
                                            {isLecCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </div>

                                      {/* LEVEL 3: Cards List */}
                                      {!isLecCollapsed && (
                                        <div className="grid grid-cols-1 gap-4">
                                          {lecGroup.cards.map((card, cardIdx) => {
                                            const cardKey = `spaced_${card.lectureId}_${card.cardId}_${cardIdx}`;
                                            const isRevealed = !!revealedSpacedAnswers[cardKey];
                                            const isHistoryExpanded = expandedCardHistory[cardKey] !== false;

                                            return (
                                              <div
                                                key={cardKey}
                                                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-amber-400 dark:hover:border-amber-600 transition"
                                              >
                                                {/* Top Row: Repetition Pill & Trajectory */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                                                      <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                                                      <span>تمت مراجعته {card.reviewCount} مرات</span>
                                                    </span>

                                                    <span className="text-[11px] text-slate-400">
                                                      آخر مراجعة: {formatRelativeTime(card.latestReviewedAt)}
                                                    </span>
                                                  </div>

                                                  {/* Trajectory Badge */}
                                                  {renderCardTrajectory(card)}
                                                </div>

                                                {/* Question (Front) */}
                                                <div className="space-y-1">
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                                    السؤال / وجه الكارت (Front):
                                                  </span>
                                                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                                                    {card.cardFront}
                                                  </p>
                                                </div>

                                                {/* Answer (Back) - Togglable */}
                                                {isRevealed ? (
                                                  <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line animate-in fade-in space-y-1.5">
                                                    <strong className="block text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                                      <CheckCircle2 className="w-4 h-4" />
                                                      <span>الإجابة النموذجية والشرح (Back):</span>
                                                    </strong>
                                                    <p>{card.cardBack}</p>
                                                  </div>
                                                ) : null}

                                                {/* Answer Toggle Button */}
                                                <div className="flex items-center justify-between pt-1 text-xs">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setRevealedSpacedAnswers((prev) => ({
                                                        ...prev,
                                                        [cardKey]: !prev[cardKey],
                                                      }))
                                                    }
                                                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
                                                  >
                                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    <span>{isRevealed ? 'إخفاء الإجابة والشرح' : 'عرض الإجابة النموذجية 👁️'}</span>
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setExpandedCardHistory((prev) => ({
                                                        ...prev,
                                                        [cardKey]: !isHistoryExpanded,
                                                      }))
                                                    }
                                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                                  >
                                                    <History className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>
                                                      {isHistoryExpanded ? 'طي سجل المراجعات' : `عرض سجل المراجعات (${card.history?.length || card.reviewCount})`}
                                                    </span>
                                                  </button>
                                                </div>

                                                {/* Review History Timeline */}
                                                {isHistoryExpanded && card.history && card.history.length > 0 && (
                                                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 mt-2">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                      <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span>سجل التواريخ والأوقات لكل مراجعة تمت:</span>
                                                      </span>
                                                      <span className="text-[10px] text-slate-400 font-normal">
                                                        من أقدم مراجعة ⬅️ إلى أحدث مراجعة
                                                      </span>
                                                    </div>

                                                    {/* Timeline Steps */}
                                                    <div className="space-y-3 relative pr-3 border-r-2 border-amber-400/40 dark:border-amber-600/40 mr-2">
                                                      {card.history.map((h, hIdx) => {
                                                        const isLatest = hIdx === card.history!.length - 1;
                                                        const isFirst = hIdx === 0;

                                                        return (
                                                          <div key={hIdx} className="relative flex items-start justify-between gap-3 text-xs pr-4">
                                                            {/* Stepper Dot */}
                                                            <div
                                                              className={`w-3.5 h-3.5 rounded-full absolute -right-[23px] top-1 border-2 border-white dark:border-slate-900 ${
                                                                isLatest
                                                                  ? 'bg-amber-500 ring-4 ring-amber-500/20'
                                                                  : 'bg-slate-300 dark:bg-slate-600'
                                                              }`}
                                                            />

                                                            <div className="space-y-0.5">
                                                              <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                  المراجعة {hIdx + 1}
                                                                </span>
                                                                {isFirst && (
                                                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                                                    أول مراجعة
                                                                  </span>
                                                                )}
                                                                {isLatest && (
                                                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 font-bold">
                                                                    أحدث مراجعة
                                                                  </span>
                                                                )}
                                                             </div>
                                                              <span className="text-[11px] text-slate-400 block">
                                                                {formatArabicDateTime(h.reviewedAt)} ({formatRelativeTime(h.reviewedAt)})
                                                              </span>
                                                            </div>

                                                            {/* State Badge for this attempt */}
                                                            <div>{renderCardStateBadge(h.state)}</div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TIMELINE & ACTIVITY LOG */}
          {/* ========================================================================= */}
          {activeTab === 'timeline' && platformFeatures?.studentActivityTracking !== false && (
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
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-300 dark:hover:border-teal-700 transition"
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
              {activeSummary.devicesUsed && activeSummary.devicesUsed.length > 0 && (
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
                    {activeSummary.devicesUsed.map((dev, idx) => (
                      <div
                        key={dev.deviceId || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
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
        </div>
  );
}
