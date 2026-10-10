import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Stethoscope, Award, Users, Target, CheckCircle2, HeartHandshake } from 'lucide-react';

export const metadata = {
  title: 'من نحن والرؤية التعليمية | ملخصات تمريض',
  description: 'تعرف على رسالة منصة ملخصات تمريض الأكاديمية لدعم طلاب كليات ومعاهد التمريض بأحدث الوسائل التعليمية ثلاثية الأبعاد.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'عن المنصة' }]} />

      <div className="space-y-10 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm leading-relaxed text-slate-700 dark:text-slate-300 transition-colors">
        {/* Header */}
        <header className="pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800/50 mb-3">
            <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>المنصة الرائدة لتعليم التمريض الرقمي التفاعلي</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            عن منصة ملخصات تمريض
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            تمكين جيل المستقبل من كوادر التمريض والرعاية الصحية بمحتوى أكاديمي دقيق ومبتكر
          </p>
        </header>

        {/* Vision & Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-teal-950 dark:text-teal-200">رؤيتنا الأكاديمية</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              أن نكون المرجع الرقمي الأكثر موثوقية وتفاعلية لطلاب التمريض في العالم العربي، بالجمع بين عمق المعلومة الطبية وقوة الوسائط التفاعلية الحديثة كالنماذج ثلاثية الأبعاد وخرائط المفاهيم.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-sky-950 dark:text-sky-200">رسالتنا للطلاب</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              تيسير فهم المناهج التمريضية المعقدة (التشريح، علم الأدوية، الباطني والجراحي)، وتقديم ملخصات مركزة تدعم الاستيعاب والتفوق الدراسي واجتياز الامتحانات بنجاح باهر.
            </p>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>ما يميز منصة ملخصات تمريض</span>
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block mb-0.5">مجسمات تفاعلية ثلاثية الأبعاد بـ Three.js:</strong>
                تسمح للطالب باستكشاف تشريح القلب والأعضاء الحيوية بزاوية 360 درجة، مما يربط بين النظرية المجردة والتطبيق الحقيقي.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block mb-0.5">بطاقات استذكار 3D تفاعلية (Spaced Repetition):</strong>
                أسلوب علمي مثبت لترسيخ أسماء الأدوية وجرعاتها والمصطلحات الإنجليزية دون نسيان.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block mb-0.5">بنك أسئلة وكويزات مع الشرح النموذجي:</strong>
                تدريب عملي على أسئلة الامتحانات المعتمدة مع توضيح أسباب الإجابات الصحيحة والخاطئة والنقاط الهامة للامتحان.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block mb-0.5">ملفات بصيغ متعددة مجهزة للطباعة:</strong>
                ملخصات ورقية PDF، وسلايدات بوربوينت PPT، وخرائط ذهنية شاملة.
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Standards */}
        <section className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white space-y-3 border border-slate-800 dark:border-slate-700">
          <h3 className="text-base font-bold text-teal-300">معايير التدقيق العلمي والمراجعة</h3>
          <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
            تتم مراجعة المحتوى والملخصات المنشورة وتحديثها دورياً بالاستناد إلى أحدث المعايير الدولية الصادرة عن جمعيات التمريض المعتمدة وإرشادات منظمة الصحة العالمية (WHO) والمناهج المقررة في كليات التمريض.
          </p>
        </section>
      </div>
    </div>
  );
}
