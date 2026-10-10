import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import MedicalOrganViewer from '@/components/ThreeD/MedicalOrganViewer';
import Flashcards3D from '@/components/Flashcards3D';
import InteractiveQuiz from '@/components/InteractiveQuiz';
import DownloadSection from '@/components/DownloadSection';
import {
  Clock,
  Eye,
  Gift,
  Lock,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Stethoscope,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface LecturePageProps {
  params: {
    lecId: string;
  };
}

export function generateStaticParams() {
  const lectures = DataService.getLecturesBySubject('anatomy').concat(
    DataService.getLecturesBySubject('fundamentals'),
    DataService.getLecturesBySubject('pharmacology')
  );
  return lectures.map((l) => ({
    lecId: l.id,
  }));
}

export default function LecturePage({ params }: LecturePageProps) {
  const lecture = DataService.getLectureById(params.lecId);

  if (!lecture) {
    notFound();
  }

  const subject = DataService.getSubjectById(lecture.subjectId);
  const year = DataService.getAcademicYearById(lecture.yearId);

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* 1. Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: year?.title || 'السنة الدراسية', href: `/year/${lecture.yearId}` },
          { label: subject?.title || 'المادة', href: `/subject/${lecture.subjectId}` },
          { label: `المحاضرة ${lecture.lectureNumber}` },
        ]}
      />

      {/* 2. Lecture Header Section */}
      <header className="space-y-4 pb-6 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
              {lecture.subjectTitle}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {lecture.yearTitle}
            </span>
          </div>

          {lecture.isFree ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>محتوى مجاني متاح للجميع 🎁</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>محتوى مدفوع (10 جنيهات)</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
          {lecture.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {lecture.subtitle}
        </p>

        {/* Metadata info */}
        <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>وقت القراءة المقدر: {lecture.readingMinutes} دقيقة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>شاهد هذه المحاضرة {lecture.viewCount} طالب</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>مدعومة بمجسم تشريحي ثلاثي الأبعاد 3D</span>
          </span>
        </div>
      </header>

      {/* 3. Top Google AdSense Placement (Above Content) */}
      <AdSenseBanner
        position="header"
        slotId="1122334455"
        label="إعلان ممول - منصة ملخصات التمريض"
      />

      {/* 4. Three.js Interactive 3D Anatomical Organ / Model Viewer */}
      <section className="my-8">
        <MedicalOrganViewer
          organType={lecture.threeDModelType || 'heart'}
          title={`المجسم السريري ثلاثي الأبعاد: ${lecture.title}`}
          subtitle="حرّك المؤشر للتدوير بزاوية 360 درجة، وكبّر لمشاهدة التفاصيل التشريحية الدقيقة"
        />
      </section>

      {/* 5. Rich Pedagogical Nursing Content (Vital for AdSense approval) */}
      <section className="space-y-8 my-10 text-slate-800">
        {/* Overview Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-teal-50/50 border border-teal-200/80 leading-relaxed shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-teal-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <span>المقدمة والنظرة السريرية الشاملة للمحاضرة</span>
          </h2>
          <div className="text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed">
            {lecture.overview}
          </div>
        </div>

        {/* Detailed Concepts with Clinical Warnings */}
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4 pb-2 border-b border-slate-200">
            المفاهيم والآليات الفسيولوجية الأساسية (Core Concepts)
          </h2>

          {lecture.concepts.map((concept, index) => (
            <div
              key={index}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <h3 className="text-lg font-bold text-slate-900 text-teal-800">
                {concept.heading}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                {concept.summary}
              </p>

              <ul className="space-y-2.5 mr-2">
                {concept.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-teal-600 mt-2 flex-shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              {concept.clinicalWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 mt-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{concept.clinicalWarning}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 6. In-Content Google AdSense Placement (Between Paragraphs) */}
        <AdSenseBanner
          position="in-content"
          slotId="2233445566"
          label="إعلان ممول - مراجع ومعايير التمريض"
        />

        {/* Medical Terminology Section */}
        {lecture.terminology && lecture.terminology.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4 pb-2 border-b border-slate-200">
              المصطلحات الطبية والتمريضية الهامة (Key Terminology)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lecture.terminology.map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-base text-teal-700 tracking-wide">
                        {t.term}
                      </span>
                      <span className="text-xs font-bold text-slate-600 px-2.5 py-0.5 rounded-md bg-slate-100">
                        {t.arabic}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {t.definition}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-teal-800 bg-teal-50/50 p-2 rounded-xl">
                    <span className="font-bold">الأهمية السريرية: </span>
                    {t.clinicalRelevance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nursing Interventions & Actions */}
        {lecture.interventions && lecture.interventions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4 pb-2 border-b border-slate-200">
              التدخلات التمريضية والإجراءات العملية (Nursing Interventions)
            </h2>

            <div className="space-y-4">
              {lecture.interventions.map((action, aIdx) => (
                <div key={aIdx} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-base text-slate-900">{action.title}</h3>
                  </div>

                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">التعليل العلمي (Rationale): </span>
                    {action.rationale}
                  </p>

                  <ul className="space-y-2 mr-2">
                    {action.actionSteps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Pearls Box */}
        {lecture.clinicalPearls && lecture.clinicalPearls.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <Lightbulb className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-bold">لآلئ سريرية ونقاط للامتحانات (Clinical Pearls)</h3>
            </div>
            <ul className="space-y-2.5 mr-2">
              {lecture.clinicalPearls.map((pearl, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-amber-900 leading-relaxed">
                  <span className="font-bold text-amber-600">•</span>
                  <span>{pearl}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 7. Interactive 3D Flashcards Section */}
      <Flashcards3D cards={lecture.flashcards} subjectTitle={lecture.subjectTitle} />

      {/* 8. Pre-Download Google AdSense Placement */}
      <AdSenseBanner
        position="pre-download"
        slotId="3344556677"
        label="إعلان ممول - مخصص لروابط التنزيل"
      />

      {/* 9. Download Files Section (PDF, PPT, Mindmap) */}
      <DownloadSection
        files={lecture.files}
        adminNote={lecture.adminNote}
        lectureTitle={lecture.title}
      />

      {/* 10. Interactive Nursing Quiz Section */}
      <InteractiveQuiz
        questions={lecture.quiz}
        lectureTitle={lecture.title}
      />

      {/* 11. Bottom AdSense Banner */}
      <AdSenseBanner
        position="footer"
        slotId="4455667788"
        label="إعلان ممول - نهاية المحاضرة"
      />
    </article>
  );
}
