import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { DataService } from '@/lib/data-service';
import { CmsService } from '@/lib/cms-db';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import SubjectContentView from '@/components/SubjectContentView';
import {
  FileText,
  Gift,
  Sparkles,
  Presentation,
  GitFork,
  Layers,
  Headphones,
  HelpCircle,
  EyeOff,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SubjectPageProps {
  params: {
    subId: string;
  };
  searchParams?: {
    semester?: string;
  };
}

export default async function SubjectPage({ params, searchParams }: SubjectPageProps) {
  const isAdmin =
    cookies().get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  const allSubjects = await CmsService.getAllSubjects();
  const liveSubjects = await CmsService.getLiveSubjects();
  const lectures = await CmsService.getLiveLecturesBySubject(params.subId);

  const subject =
    liveSubjects.find((s) => s.id === params.subId || s.slug === params.subId) ||
    allSubjects.find((s) => s.id === params.subId || s.slug === params.subId) ||
    DataService.getSubjectById(params.subId) ||
    (lectures.length > 0
      ? {
          id: params.subId,
          yearId: lectures[0].yearId || '1',
          yearName: lectures[0].yearTitle || 'السنة الأولى',
          slug: params.subId,
          title: lectures[0].subjectTitle || params.subId,
          description: `مقرر ${lectures[0].subjectTitle || params.subId} - ملخصات ومحاضرات معتمدة`,
          icon: 'Activity',
          color: 'teal',
          totalLectures: lectures.length,
          totalQuizzes: 0,
        }
      : undefined);

  if (!subject) {
    notFound();
  }

  const year = DataService.getAcademicYearById(subject.yearId);
  const allQuizzesFiles = await CmsService.getSubjectQuizFiles(subject.id);
  const quizzesFiles = allQuizzesFiles.filter((q) => q.isLive !== false);

  // Strict rule: if a subject has 0 live lectures and 0 live quizzes, hide it from everyone
  if (lectures.length === 0 && quizzesFiles.length === 0) {
    notFound();
  }

  const initialSemester =
    searchParams?.semester === '2'
      ? '2'
      : searchParams?.semester === '1'
      ? '1'
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: year?.title || 'السنة الدراسية', href: `/year/${subject.yearId}` },
          { label: subject.title },
        ]}
      />

      {/* Subject Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl mb-8 border border-teal-500/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مقرر دراسي معتمد • {subject.yearName}</span>
            </div>
          </div>

          {/* Clean Arabic title */}
          <h1 className="text-3xl sm:text-4xl font-black">{subject.title}</h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
            {subject.description}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-300">
              <Gift className="w-4 h-4 text-emerald-400" />
              المحاضرة الأولى مجانية بالكامل للجميع 🎁
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              متوفر: {lectures.length} محاضرات شرح • {quizzesFiles.length} ملفات أسئلة كويزات 📝
            </span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="6543210987" label={`إعلانات مادة ${subject.title}`} />

      {/* Content Section: Lectures & Quizzes with 2-Option Chooser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-10">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">
          <SubjectContentView
            subject={subject}
            lectures={lectures}
            quizzesFiles={quizzesFiles}
            isAdmin={false}
            initialSemester={initialSemester}
          />

          {/* AdSense In-Content */}
          <AdSenseBanner position="in-content" slotId="5432167890" label="إعلان ممول - المحاضرات الأكاديمية" />
        </div>

        {/* Sidebar Column: Study Guide & AdSense */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cards Guide Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>محتويات كل محاضرة</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span><strong>ملخصات PDF:</strong> ملونة ومجهزة للطباعة والمذاكرة الورقية.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Presentation className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong>عروض البوربوينت:</strong> السلايدات الرسمية مع الرسوم التوضيحية.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <GitFork className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>خرائط ذهنية:</strong> تشجير بصري شامل لكافة عناصر المحاضرة.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Headphones className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <span><strong>ريكوردات صوتية:</strong> استماع مباشر لشرح المحاضرة بموجة صوتية تفاعلية وتحكم بالسرعة.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>فلاش كاردز تفاعلية:</strong> بطاقات استذكار سريعة بنظام Flip Card.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong>أسئلة الكويزات:</strong> ملف PDF مجمع لبنك الأسئلة وامتحانات الميدتيرم.</span>
              </li>
            </ul>
          </div>

          {/* Sidebar AdSense Banner */}
          <AdSenseBanner position="sidebar" slotId="4321098765" label="إعلان ممول - مراجع التمريض" />
        </div>
      </div>
    </div>
  );
}
