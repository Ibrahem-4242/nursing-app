'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Sparkles,
  CreditCard,
  Network,
  Maximize2,
  Download,
  FileText,
  Presentation,
  Headphones,
  HelpCircle,
  Stethoscope,
  Layers,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { LectureFile } from '@/lib/types';
import MindmapPreviewModal from '@/components/MindmapPreviewModal';
import PurchaseLectureModal from '@/components/PurchaseLectureModal';
import { useStudentAuth } from '@/context/StudentAuthContext';

interface LockedConceptNode {
  heading: string;
  summary: string;
  points?: string[];
  clinicalWarning?: string;
}

interface LockedLectureViewProps {
  lectureId: string;
  lectureTitle: string;
  subtitle?: string;
  subjectTitle: string;
  yearTitle: string;
  yearId: string;
  price: number;
  mindmapFile?: LectureFile | null;
  concepts?: LockedConceptNode[];
}

export default function LockedLectureView({
  lectureId,
  lectureTitle,
  subtitle,
  subjectTitle,
  yearTitle,
  yearId,
  price = 50,
  mindmapFile,
  concepts = [],
}: LockedLectureViewProps) {
  const router = useRouter();
  const { student, openAuthModal } = useStudentAuth();

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isMindmapModalOpen, setIsMindmapModalOpen] = useState(false);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number>(0);

  const rawMindmapUrl = (mindmapFile?.downloadUrl || mindmapFile?.fileUrl || '').trim();

  const handleOpenPurchase = () => {
    if (!student) {
      openAuthModal('register');
    } else {
      setIsPurchaseModalOpen(true);
    }
  };

  return (
    <div className="space-y-10 my-6" dir="rtl">
      {/* 1. TOP GOLDEN LOCKED BANNER */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 border-amber-300/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black border border-white/30">
            <Lock className="w-3.5 h-3.5 text-yellow-200" />
            <span>محاضرة مدفوعة ({price} ج.م فقط)</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">
            هذه المحاضرة مخصصة لطلاب المنصة المشتركين 🔒
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl leading-relaxed">
            عاين الخريطة الذهنية مجاناً بالكامل أدناه لتكتشف جودة وطريقة تلخيص المحاضرة، ويمكنك الاشتراك لفتح باقي المحتوى فوراً.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenPurchase}
          className="px-7 py-4 rounded-2xl bg-white text-slate-900 hover:bg-amber-50 font-black text-sm sm:text-base shadow-xl shadow-black/10 active:scale-95 transition flex items-center justify-center gap-2.5 whitespace-nowrap self-start md:self-auto"
        >
          <CreditCard className="w-5 h-5 text-amber-600" />
          <span>شراء المحاضرة ({price} ج.م) 💳</span>
        </button>
      </section>

      {/* 2. DEDICATED FREE MINDMAP PREVIEW SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200 dark:border-purple-900/60">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>معاينة مجانية 100% 🎁</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>🗺️ عاين الخريطة الذهنية للمحاضرة مجاناً (Mindmap Free Preview)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              استعرض الخريطة الذهنية التفاعلية الشاملة مجاناً لترى كيفية تلخيص عناصر ومحاور المحاضرة وجودة التنظيم السريري قبل الاشتراك.
            </p>
          </div>
        </div>

        {/* Mindmap Interactive Card */}
        {mindmapFile ? (
          <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-purple-950/30 p-6 sm:p-8 rounded-3xl border-2 border-purple-300 dark:border-purple-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/30">
                  <Network className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                    الخريطة الذهنية الرسمية المعتمدة
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {mindmapFile.title || `الخريطة الذهنية الشاملة - ${lectureTitle}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>الحجم: {mindmapFile.fileSize || '1.2 MB'}</span>
                    <span>• {mindmapFile.pageCount || 'خريطة ذهنية عالية الدقة'}</span>
                    <span>• متاحة للمعاينة والتكبير والتحميل المجاني</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsMindmapModalOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-95 transition"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>معاينة وتكبير الخريطة (عرض كامل) 🔍</span>
                </button>

                {rawMindmapUrl && (
                  <a
                    href={rawMindmapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm border border-purple-200 dark:border-purple-800 flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل الخريطة 📥</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick interactive peek note */}
            <div className="p-4 rounded-2xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-950 dark:text-purple-200 text-xs sm:text-sm flex items-center justify-between gap-3">
              <span className="font-bold">
                💡 اضغط على زر المعاينة بالأعلى لاستعراض الخريطة بكامل الدقة وتكبير التفاصيل الدقيقة والمحاور السريرية مجاناً!
              </span>
              <button
                type="button"
                onClick={() => setIsMindmapModalOpen(true)}
                className="text-purple-700 dark:text-purple-300 underline font-black whitespace-nowrap hover:text-purple-900"
              >
                فتح المعاينة الآن ←
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Network className="w-10 h-10 text-purple-600 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              معاينة الخريطة الهيكلية للمحاضرة
            </h4>
            <p className="text-xs text-slate-500">
              يمكنك الاطلاع على الهيكل والتقسيمات السريرية للمحاضرة بالأسفل.
            </p>
          </div>
        )}

        {/* Interactive Mindmap Branches & Mental Concept Tree */}
        {concepts && concepts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>محاور وفروع الخريطة الذهنية السريرية (Interactive Mental Tree)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  انقر على أي فرع من الفروع التالية لمعاينة طريقة تلخيص المفاهيم الطبية:
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {concepts.length} فروع رئيسية
              </span>
            </div>

            {/* Branch Pills */}
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveBranchIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                    activeBranchIndex === idx
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-black/15 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[200px]">{concept.heading}</span>
                </button>
              ))}
            </div>

            {/* Selected Branch Content Preview */}
            {concepts[activeBranchIndex] && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <h5 className="font-black text-sm sm:text-base text-purple-900 dark:text-purple-300">
                    {concepts[activeBranchIndex].heading}
                  </h5>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {concepts[activeBranchIndex].summary}
                </p>

                {concepts[activeBranchIndex].points && (
                  <ul className="space-y-1.5 mr-2 pt-1">
                    {concepts[activeBranchIndex].points!.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {concepts[activeBranchIndex].clinicalWarning && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{concepts[activeBranchIndex].clinicalWarning}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. LOCKED CONTENT SHIELD (درع المحتوى المقفول) */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border-2 border-amber-400/60 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
            <span>محتوى تعليمي وسريري مخصص للمشتركين 🎓</span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
            🔒 هذا المحتوى خاص بطلاب المنصة المشتركين - بعد استعراضك للخريطة الذهنية، افتح الشرح الكامل والأسئلة وكروت الحفظ الآن بـ {price} ج.م فقط
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            اشترك الآن بضغطة زر واحدة لتفتح لك جميع أدوات وتفاصيل المحاضرة في حسابك بشكل دائم:
          </p>
        </div>

        {/* Resources Grid Included in Unlock */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">ملخص المحاضرة المعتمد (PDF)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ملف ملخص شامل جاهز للطباعة والمذاكرة السريعة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Presentation className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">سلايدات الشرح (PowerPoint)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              عروض تقديمية وسلايدات الشرح الجامعي الرسمية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">الشرح والتسجيل الصوتي (Audio)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              شرح صوتي ممتع مع مشغل نبضات تفاعلي للمراجعة في أي وقت.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">كروت الاستذكار (Flashcards 3D)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              كروت ثلاثية الأبعاد بنظام التقييم الذاتي والتكرار الموجه.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">بنك الأسئلة والتدريبات (Quiz)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              أسئلة امتحانات وتدريبات مع الإجابات النموذجية والتعليلات.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">التدخلات والتعليلات السريرية</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              كل التدخلات التمريضية والتحذيرات السريرية للامتحان.
            </p>
          </div>
        </div>

        {/* Big CTA Button */}
        <div className="relative z-10 text-center pt-2">
          <button
            type="button"
            onClick={handleOpenPurchase}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-black text-base sm:text-lg shadow-2xl shadow-amber-500/40 active:scale-95 transition"
          >
            <span>فتح المحاضرة الآن 🚀</span>
          </button>
          <div className="text-xs text-slate-400 mt-2">
            تفعيل فوري عبر فودافون كاش ومسار التيليجرام • متوافق مع جميع الهواتف والأجهزة
          </div>
        </div>
      </section>

      {/* Mindmap Preview Modal */}
      {mindmapFile && (
        <MindmapPreviewModal
          isOpen={isMindmapModalOpen}
          onClose={() => setIsMindmapModalOpen(false)}
          mindmapFile={mindmapFile}
          lectureTitle={lectureTitle}
          subjectTitle={subjectTitle}
          price={price}
          onOpenPurchase={() => setIsPurchaseModalOpen(true)}
        />
      )}

      {/* Purchase Modal */}
      <PurchaseLectureModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        lectureId={lectureId}
        lectureTitle={lectureTitle}
        subjectTitle={subjectTitle}
        orderType="lecture"
        yearId={yearId}
        price={price}
        onOrderSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
