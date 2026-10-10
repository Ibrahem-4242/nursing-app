import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { ShieldCheck, Lock, Eye, FileText, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'سياسة الخصوصية | نيرسنج هَب',
  description: 'سياسة الخصوصية المعتمدة لمنصة نيرسنج هَب واستخدام ملفات تعريف الارتباط وإعلانات Google AdSense.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">
      <Breadcrumb items={[{ label: 'سياسة الخصوصية' }]} />

      <div className="space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm leading-relaxed text-slate-700">
        <header className="pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 mb-3">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>متوافقة مع معايير Google AdSense واللوائح الدولية</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">سياسة الخصوصية (Privacy Policy)</h1>
          <p className="text-xs text-slate-400 mt-1">تاريخ آخر تحديث: أكتوبر 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <span>1. التزامنا بحماية خصوصية الطلاب</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            في منصة <strong>نيرسنج هَب (NursingHub)</strong>، ندرك تماماً أهمية خصوصية بيانات مستخدمينا وزوارنا من طلاب وأعضاء هيئة التدريس في كليات ومعاهد التمريض. توضح هذه الوثيقة طبيعة المعلومات الشخصية التي نتلقاها ونجمعها وكيفية حمايتها واستخدامها.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" />
            <span>2. ملفات تعريف الارتباط وإعلانات Google AdSense</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            نستخدم في موقعنا خدمات إعلانية مقدمة من أطراف ثالثة، وعلى رأسها <strong>Google AdSense</strong>.
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-2 mr-2">
            <li>
              تستخدم Google ملفات تعريف ارتباط (Cookies)، بما في ذلك ملف تعريف الارتباط <strong>DoubleClick DART</strong>، لعرض الإعلانات للمستخدمين استناداً إلى زيارتهم لموقعنا ومواقع أخرى على شبكة الإنترنت.
            </li>
            <li>
              يمكن للمستخدمين إلغاء الاشتراك في استخدام ملف تعريف الارتباط DART لتقديم إعلانات قائمة على الاهتمامات من خلال زيارة{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline font-semibold"
              >
                سياسة الخصوصية الخاصة بإعلانات Google وشبكة المحتوى
              </a>.
            </li>
            <li>
              قد يستخدم شركاؤنا الإعلانيون ملفات تعريف الارتباط وإشارات الويب (Web Beacons) لقياس مدى فعالية حملاتهم الإعلانية وتخصيص المحتوى الإعلاني الذي تراه.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>3. ملفات السجل (Log Files) والتحليلات</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            مثل غالبية المواقع الإلكترونية المعتمدة، نستخدم ملفات السجل القياسية. تشمل هذه المعلومات: عناوين بروتوكول الإنترنت (IP)، نوع المتصفح، مزود خدمة الإنترنت (ISP)، طابع التاريخ والوقت، صفحات الإحالة/الخروج، وعدد النقرات لتحليل الاتجاهات وإدارة الموقع وتحسين تجربة التصفح. هذه المعلومات لا ترتبط بأي معلومات تحدد الهوية الشخصية للمستخدم.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>4. حقوق الخصوصية وحماية بيانات الأطفال (COPPA & GDPR)</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            محتوى منصة نيرسنج هَب موجه للطلاب الأكاديميين والبالغين في مرحلة التعليم الجامعي وما فوق. نحن لا نقوم عن قصد بجمع أي معلومات تعريفية شخصية من أطفال دون سن 13 عاماً. إذا كان لديك سبب للاعتقاد بأن طفلاً قد زودنا بمعلومات شخصية، يرجى الاتصال بنا فوراً لحذف تلك المعلومات من سجلاتنا.
          </p>
        </section>

        <section className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm">
          <span className="font-bold block mb-1">📬 هل لديك أي استفسار بشأن سياسة الخصوصية؟</span>
          يمكنك التواصل معنا مباشرة عبر صفحة{' '}
          <a href="/contact" className="underline font-bold text-teal-700">
            اتصل بنا
          </a>{' '}
          أو مراسلتنا عبر بوت الدعم الرسمي في التليجرام.
        </section>
      </div>
    </div>
  );
}
