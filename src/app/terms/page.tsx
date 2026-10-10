import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Scale, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'شروط الاستخدام والأمانة العلمية | نيرسنج هَب',
  description: 'شروط استخدام منصة نيرسنج هَب، حقوق الملكية الفكرية، وإخلاء المسؤولية الطبية والأكاديمية.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'شروط الاستخدام' }]} />

      <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm leading-relaxed text-slate-700">
        <header className="pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 mb-3">
            <Scale className="w-4 h-4 text-teal-600" />
            <span>معايير النشر والأمانة الأكاديمية</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">شروط الاستخدام (Terms of Service)</h1>
          <p className="text-xs text-slate-400 mt-1">تاريخ السريان: أكتوبر 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-600" />
            <span>1. الموافقة على الشروط والهدف التعليمي</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            باستخدامك لمنصة <strong>نيرسنج هَب (NursingHub)</strong> أو أي من أدواتها وخدماتها (الملخصات، الخرائط الذهنية، الكويزات، والمجسمات ثلاثية الأبعاد)، فإنك تقر وتوافق صراحة على الالتزام بجميع بنود وشروط هذه الاتفاقية. جميع المواد المتاحة مخصصة حصراً للدراسة الفردية غير التجارية وتطوير المهارات التمريضية الأكاديمية والسريرية.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            <span>2. حقوق الملكية الفكرية وحظر إعادة النشر التجاري</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            جميع الملخصات والنصوص التعليمية، وتصميمات الخرائط الذهنية، وبرمجيات الكويزات التفاعلية، ومجسمات Three.js المعروضة في المنصة محمية بحقوق الملكية الفكرية. يُسمح للطالب بتحميل وطباعة النسخ للأغراض التعليمية الشخصية، ويُحظر تماماً إعادة بيعها أو تداولها تجارياً دون تصريح كتابي مسبق.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>3. إخلاء المسؤولية الطبية والسريرية (Medical Disclaimer)</span>
          </h2>
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
            <strong>تنويه سريري حاسم:</strong> المحتوى المنشور على نيرسنج هَب معد لأغراض المذاكرة والتحصيل العلمي الأكاديمي للطلاب، ولا يُقصد به تقديم نصائح علاجية أو تشخيصية حية للمرضى. يجب على الممارس الصحي دائماً الرجوع إلى البروتوكولات السريرية المعتمدة في المستشفى وتعليمات الطبيب المعالج والجرعات الدوائية الرسمية الصادرة عن الهيئات الصحية المختصة.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-600" />
            <span>4. التعديل وتحديث الشروط</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            تحتفظ إدارة المنصة بحق تعديل أو تحديث هذه الشروط في أي وقت لمواكبة التحديثات الأكاديمية أو القوانين الرقمية. يعتبر استمرار استخدامك للموقع بعد نشر التعديلات قبولاً ضمنياً بها.
          </p>
        </section>
      </div>
    </div>
  );
}
