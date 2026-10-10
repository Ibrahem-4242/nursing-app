import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import { BOT_CONFIG } from '@/lib/mock-data';
import {
  BookOpen,
  FileText,
  Clock,
  Eye,
  Gift,
  Lock,
  ArrowLeft,
  Award,
  Sparkles,
  Download,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface SubjectPageProps {
  params: {
    subId: string;
  };
}

export function generateStaticParams() {
  const subjects = DataService.getSubjectsByYear('1').concat(
    DataService.getSubjectsByYear('2'),
    DataService.getSubjectsByYear('3'),
    DataService.getSubjectsByYear('4')
  );
  return subjects.map((s) => ({
    subId: s.id,
  }));
}

export default function SubjectPage({ params }: SubjectPageProps) {
  const subject = DataService.getSubjectById(params.subId);

  if (!subject) {
    notFound();
  }

  const year = DataService.getAcademicYearById(subject.yearId);
  const lectures = DataService.getLecturesBySubject(subject.id);
  const quizzes = DataService.getQuizzesBySubject(subject.id);

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>كود المقرر: {subject.code} • {subject.yearName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black">{subject.title}</h1>
          <p className="text-sm font-mono text-teal-300/80 -mt-1">{subject.englishTitle}</p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
            {subject.description}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-300">
              <Gift className="w-4 h-4 text-emerald-400" />
              المحاضرة الأولى مجانية بالكامل للجميع 🎁
            </span>
            <span>•</span>
            <span>ملخصات ورقية، عروض بوربوينت، وفلاش كاردز 3D</span>
          </div>
        </div>
      </div>

      {/* Top AdSense Banner */}
      <AdSenseBanner position="header" slotId="6543210987" label={`إعلانات مادة ${subject.title}`} />

      {/* Content Section: Lectures & Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-10">
        {/* Main Column: Lectures List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" />
                <span>محاضرات المادة المتاحة</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">تصفح الشرح السريري والمجسمات التفاعلية والفلاش كاردز</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
              {lectures.length} محاضرات جاهزة
            </span>
          </div>

          {lectures.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
              <p className="text-sm font-semibold">جارِ رفع وتنسيق محاضرات هذه المادة قريباً ⌛️</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lectures.map((lec) => (
                <div
                  key={lec.id}
                  className="group p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                        #{lec.lectureNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        المحاضرة {lec.lectureNumber}
                      </span>
                    </div>

                    {/* Free vs Paid Badge */}
                    {lec.isFree ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <Gift className="w-3.5 h-3.5" />
                        <span>مجانية للجميع 🎁</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                        <Lock className="w-3.5 h-3.5" />
                        <span>مدفوعة (10 ج)</span>
                      </span>
                    )}
                  </div>

                  <Link href={`/lecture/${lec.id}`}>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition leading-snug mb-2">
                      {lec.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {lec.subtitle || lec.overview}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {lec.readingMinutes} دقيقة قراءة
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {lec.viewCount} طالب
                      </span>
                    </div>

                    <Link
                      href={`/lecture/${lec.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-bold hover:bg-teal-600 hover:text-white transition active:scale-95 shadow-sm"
                    >
                      <span>فتح المحتوى والمجسم 3D</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AdSense In-Content between lectures and quizzes */}
          <AdSenseBanner position="in-content" slotId="5432167890" label="إعلان ممول - المحاضرات الأكاديمية" />

          {/* Section 2: Quizzes Department (قسم أسئلة الكويزات) */}
          <div className="pt-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  <span>قسم أسئلة الكويزات والنماذج</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">اختبارات تدريبية مع نماذج الإجابة للامتحانات النهائية</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                {quizzes.length} كويزات
              </span>
            </div>

            {quizzes.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                سيتم إضافة نماذج الكويزات الخاصة بمادة {subject.title} قريباً ⌛️
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          كويز {quiz.quizNumber}
                        </span>
                        {quiz.isFree ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            مجاني 🎁
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            10 ج 🔒
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-800 mb-2 leading-snug">
                        {quiz.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        <span>{quiz.questionsCount} سؤال</span>
                        <span>•</span>
                        <span>{quiz.durationMinutes} دقيقة</span>
                      </div>

                      {quiz.customNote && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mb-3 leading-relaxed">
                          {quiz.customNote}
                        </p>
                      )}
                    </div>

                    <a
                      href={quiz.fileUrl}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل ملف الكويز (PDF)</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column: Support, Payment info & Study Guide */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment Notice Widget (from Telegram Bot logic) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 shadow-sm text-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-base text-teal-900">نظام الاشتراك في المحتوى</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              المحاضرة الأولى في كل مادة مجانية دائماً للجميع 🎁. لشراء باقي المحاضرات أو الكويزات المقفولة:
            </p>
            <div className="p-3.5 bg-white rounded-2xl border border-teal-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">طريقة التحويل:</span>
                <span className="font-bold text-teal-800">{BOT_CONFIG.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">رقم الكاش:</span>
                <span className="font-mono font-bold text-teal-700 text-sm select-all">
                  {BOT_CONFIG.adminContactPhone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">سعر المحاضرة:</span>
                <span className="font-bold text-slate-900">10 جنيهات فقط</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              قم بإرسال سكرين شوت التحويل ورقم التليفون عبر بوت التليجرام وسيتم التفعيل خلال دقائق.
            </p>
          </div>

          {/* Cards Guide Card (from bot function getCardsPinGuide) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>كيفية الاستفادة القصوى من المحتوى</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">1.</span>
                <span>اقرأ الملخص النصي للشرح السريري والمصطلحات الإنجليزية بعناية.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">2.</span>
                <span>تفاعل مع مجسم Three.js 3D لفهم البنية التشريحية ثلاثية الأبعاد.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">3.</span>
                <span>استخدم الفلاش كاردز ثلاثية الأبعاد لاختبار الاسترجاع السريع للمعلومات.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">4.</span>
                <span>حل الكويز التفاعلي للوقوف على مستواك الحقيقي وتصحيح الأخطاء فوراً.</span>
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
