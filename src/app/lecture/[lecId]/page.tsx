import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { DataService } from '@/lib/data-service';
import { CmsService } from '@/lib/cms-db';
import { StudentUser } from '@/lib/types';
import Breadcrumb from '@/components/Breadcrumb';
import AdSenseBanner from '@/components/AdSenseBanner';
import LectureContentTabs from '@/components/LectureContentTabs';
import StudentWatermark from '@/components/StudentWatermark';
import LockedLectureView from '@/components/LockedLectureView';
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
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LecturePageProps {
  params: {
    lecId: string;
  };
}

export default async function LecturePage({ params }: LecturePageProps) {
  const cookieStore = cookies();
  const isAdmin =
    cookieStore.get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  const lecture = await CmsService.getLectureById(params.lecId);

  if (!lecture || (lecture as any).isLive === false) {
    notFound();
  }

  // 🛡️ Check student session & access permission
  let student: StudentUser | null = null;
  const rawStudentVal = cookieStore.get('nursing_student_session')?.value;
  if (rawStudentVal) {
    const [studentId] = rawStudentVal.split(':::');
    if (studentId) {
      student = await CmsService.getStudentById(studentId);
    }
  }

  const hasAccess =
    lecture.isFree ||
    isAdmin ||
    CmsService.hasAccessToLecture(student, lecture.id, lecture.yearId);

  const liveSubjects = await CmsService.getLiveSubjects();
  const subject =
    liveSubjects.find((s) => s.id === lecture.subjectId || s.slug === lecture.subjectId) ||
    DataService.getSubjectById(lecture.subjectId);
  const year = DataService.getAcademicYearById(lecture.yearId);
  const lecSemester = lecture.semester || (subject?.semester === '2' ? '2' : '1');

  // 🔒 If student does NOT have access to this paid lecture:
  // Render Free Mindmap Preview + Locked Content Shield without exposing sensitive files in HTML
  if (!hasAccess) {
    const mindmapFile =
      lecture.files?.find(
        (f: any) =>
          (f.type === 'mindmap' || f.fileType === 'mindmap') &&
          Boolean((f?.downloadUrl || f?.fileUrl) && (f?.downloadUrl || f?.fileUrl) !== '#')
      ) || null;

    const previewConcepts = (lecture.concepts || []).map((c) => ({
      heading: c.heading,
      summary: c.summary,
      points: c.points?.slice(0, 3) || [],
      clinicalWarning: c.clinicalWarning,
    }));

    return (
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" dir="rtl">
        {/* 1. Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: year?.title || 'السنة الدراسية', href: `/year/${lecture.yearId}?semester=${lecSemester}` },
            { label: `${subject?.title || 'المادة'} (سمستر ${lecSemester})`, href: `/subject/${lecture.subjectId}?semester=${lecSemester}` },
            { label: `المحاضرة ${lecture.lectureNumber}` },
          ]}
        />

        {/* 2. Lecture Header Section */}
        <header className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
                {lecture.subjectTitle}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                {lecture.yearTitle}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>محتوى مقفول ({lecture.price || 50} ج.م) 🔒</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {lecture.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {lecture.subtitle}
          </p>

          {/* Metadata info */}
          <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>وقت القراءة المقدر: {lecture.readingMinutes} دقيقة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>شاهد هذه المحاضرة {lecture.viewCount} طالب</span>
            </span>
          </div>

          {lecture.overview && (
            <div className="p-5 sm:p-6 rounded-2xl bg-teal-50/80 dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800 text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm mt-3">
              <h2 className="text-sm sm:text-base font-bold text-teal-900 dark:text-teal-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>وصف وملخص المحاضرة</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {lecture.overview}
              </div>
            </div>
          )}
        </header>

        {/* 3. Top Google AdSense Placement */}
        <AdSenseBanner
          position="header"
          slotId="1122334455"
          label="إعلان ممول - منصة ملخصات التمريض"
        />

        {/* 4. LOCKED LECTURE VIEW (FREE MINDMAP PREVIEW + LOCKED CONTENT SHIELD) */}
        <LockedLectureView
          lectureId={lecture.id}
          lectureTitle={lecture.title}
          subtitle={lecture.subtitle}
          subjectTitle={lecture.subjectTitle}
          yearTitle={lecture.yearTitle}
          yearId={lecture.yearId}
          price={lecture.price || 50}
          mindmapFile={mindmapFile}
          concepts={previewConcepts}
        />

        {/* 5. Bottom AdSense Banner */}
        <AdSenseBanner
          position="footer"
          slotId="4455667788"
          label="إعلان ممول - نهاية المحاضرة"
        />
      </article>
    );
  }

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" dir="rtl">
      {/* 🛡️ Dynamic Anti-Leak Watermark (Paid Lectures for Authenticated Students) */}
      <StudentWatermark isFree={lecture.isFree} lectureId={lecture.id} yearId={lecture.yearId} />

      {/* 1. Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: year?.title || 'السنة الدراسية', href: `/year/${lecture.yearId}?semester=${lecSemester}` },
          { label: `${subject?.title || 'المادة'} (سمستر ${lecSemester})`, href: `/subject/${lecture.subjectId}?semester=${lecSemester}` },
          { label: `المحاضرة ${lecture.lectureNumber}` },
        ]}
      />

      {/* 2. Lecture Header Section */}
      <header className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
              {lecture.subjectTitle}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
              {lecture.yearTitle}
            </span>
          </div>

          {lecture.isFree ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>محتوى مجاني متاح للجميع 🎁</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>محتوى مقفول 🔒</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
          {lecture.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {lecture.subtitle}
        </p>

        {/* Metadata info */}
        <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>وقت القراءة المقدر: {lecture.readingMinutes} دقيقة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>شاهد هذه المحاضرة {lecture.viewCount} طالب</span>
          </span>
          {(() => {
            const avail: string[] = [];
            const isValid = (f: any) => Boolean((f?.downloadUrl || f?.fileUrl) && (f?.downloadUrl || f?.fileUrl) !== '#');
            if (lecture.files?.some((f: any) => (f.type === 'pdf' || f.fileType === 'summary') && isValid(f))) avail.push('ملف PDF');
            if (lecture.files?.some((f: any) => (f.type === 'audio' || f.fileType === 'audio') && isValid(f))) avail.push('ريكورد صوتي 🎧');
            if (lecture.files?.some((f: any) => (f.type === 'questions' || f.fileType === 'questions') && isValid(f))) avail.push('أسئلة وتمارين ❓');
            if (lecture.files?.some((f: any) => (f.type === 'ppt' || f.fileType === 'powerpoint') && isValid(f))) avail.push('عرض بوربوينت 📊');
            if (lecture.files?.some((f: any) => (f.type === 'mindmap' || f.fileType === 'mindmap') && isValid(f))) avail.push('خريطة ذهنية 🧠');
            if ((lecture.flashcards?.length || 0) > 0) avail.push(`${lecture.flashcards.length} كارت ذكي 🎴`);
            if (avail.length === 0) return null;
            return (
              <span className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>المتوفر بالمحاضرة: {avail.join(' • ')}</span>
              </span>
            );
          })()}
        </div>
        {/* Lecture Overview Prominently placed right at the top */}
        {lecture.overview && (
          <div className="p-5 sm:p-6 rounded-2xl bg-teal-50/80 dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800 text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm mt-3">
            <h2 className="text-sm sm:text-base font-bold text-teal-900 dark:text-teal-300 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>وصف وملخص المحاضرة</span>
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {lecture.overview}
            </div>
          </div>
        )}
      </header>

      {/* 3. Top Google AdSense Placement (Above Content) */}
      <AdSenseBanner
        position="header"
        slotId="1122334455"
        label="إعلان ممول - منصة ملخصات التمريض"
      />

      {/* 4. THE INTERACTIVE TABS & DIRECT DOWNLOAD SECTION */}
      <section className="my-6">
        <LectureContentTabs
          files={lecture.files}
          flashcards={lecture.flashcards}
          subjectTitle={lecture.subjectTitle}
          lectureTitle={lecture.title}
          adminNote={lecture.adminNote}
          lectureId={lecture.id}
          yearId={lecture.yearId}
          isFree={lecture.isFree}
          price={lecture.price || 50}
          isAdmin={false}
        />
      </section>

      {/* 5. Rich Pedagogical Nursing Content */}
      <section className="space-y-8 my-10 text-slate-800 dark:text-slate-200">
        {/* Detailed Concepts with Clinical Warnings */}
        {lecture.concepts && lecture.concepts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              أهم المفاهيم والنقاط الرئيسية
            </h2>

            {lecture.concepts.map((concept, index) => (
              <div
                key={index}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <h3 className="text-lg font-bold text-teal-800 dark:text-teal-300">
                  {concept.heading}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {concept.summary}
                </p>

                <ul className="space-y-2.5 mr-2">
                  {concept.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 mt-2 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                {concept.clinicalWarning && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 mt-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{concept.clinicalWarning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* In-Content Google AdSense Placement */}
        <AdSenseBanner
          position="in-content"
          slotId="2233445566"
          label="إعلان ممول - مراجع ومعايير التمريض"
        />

        {/* Medical Terminology Section */}
        {lecture.terminology && lecture.terminology.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              المصطلحات الطبية والتمريضية الهامة (Key Terminology)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lecture.terminology.map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-base text-teal-700 dark:text-teal-400 tracking-wide">
                        {t.term}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        {t.arabic}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {t.definition}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/40 p-2 rounded-xl">
                    <span className="font-bold">الأهمية التطبيقية للامتحان: </span>
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
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              التدخلات التمريضية والإجراءات العملية (Nursing Interventions)
            </h2>

            <div className="space-y-4">
              {lecture.interventions.map((action, aIdx) => (
                <div key={aIdx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{action.title}</h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">التعليل العلمي (Rationale): </span>
                    {action.rationale}
                  </p>

                  <ul className="space-y-2 mr-2">
                    {action.actionSteps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
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
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-bold">نقاط ذهبية وأسئلة هامة للامتحانات (Exam Pearls)</h3>
            </div>
            <ul className="space-y-2.5 mr-2">
              {lecture.clinicalPearls.map((pearl, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-600 dark:text-amber-400">•</span>
                  <span>{pearl}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 6. Bottom AdSense Banner */}
      <AdSenseBanner
        position="footer"
        slotId="4455667788"
        label="إعلان ممول - نهاية المحاضرة"
      />
    </article>
  );
}
