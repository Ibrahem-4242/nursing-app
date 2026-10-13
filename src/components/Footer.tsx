import React from 'react';
import Link from 'next/link';
import { Stethoscope, MessageCircle, Heart } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';
import SecretAdminTrigger from './SecretAdminTrigger';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 pt-16 pb-12 border-t border-slate-800 dark:border-slate-900" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800 dark:border-slate-800/80">
          {/* Col 1: Platform Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-white">ملخصات تمريض</span>
                <span className="text-[10px] block text-teal-400 font-bold">Nursing Study Notes</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              المنصة الأكاديمية الأولى المتخصصة في دعم طلاب كليات ومعاهد التمريض بأحدث الملخصات، الخرائط الذهنية، الكويزات التفاعلية وبطاقات الاستذكار التفاعلية.
            </p>
            <div className="pt-2">
              <a
                href={BOT_CONFIG.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                <span>انضم لجروب الواتساب الرسمي</span>
              </a>
            </div>
          </div>

          {/* Col 2: Academic Years & Semesters */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              المقررات والفصول الدراسية
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/year/1" className="hover:text-teal-400 transition">
                  السنة الأولى (جميع المقررات المعتمدة)
                </Link>
              </li>
              <li>
                <Link href="/year/1?semester=1" className="hover:text-teal-400 transition">
                  الفصل الدراسي الأول (سمستر 1)
                </Link>
              </li>
              <li>
                <Link href="/year/1?semester=2" className="hover:text-teal-400 transition">
                  الفصل الدراسي الثاني (سمستر 2)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & AdSense Compliant Pages */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              السياسات والمعايير
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-teal-400 transition">
                  سياسة الخصوصية (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-400 transition">
                  شروط الاستخدام والأمانة العلمية (Terms)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-400 transition">
                  من نحن والرؤية التعليمية (About Us)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-400 transition">
                  اتصل بنا والدعم (Contact)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Vision & Help */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              المحتوى والتطوير
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <p className="leading-relaxed">
                يتم تحديث وإضافة ملخصات وكويزات جديدة بشكل أسبوعي تغطي جميع الفصول الدراسية وفق المعايير الأكاديمية الرسمية.
              </p>
              <div className="p-3 bg-slate-800/60 dark:bg-slate-900 rounded-xl border border-slate-700/60 text-[11px] text-teal-300">
                ✨ تشمل كل محاضرة 4 عناصر متكاملة: PDF، بوربوينت، خريطة ذهنية، وبطاقات فلاش كاردز تفاعلية.
              </div>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer Banner */}
        <div className="py-6 border-b border-slate-800/80 dark:border-slate-800/60 text-[11px] text-slate-400 leading-relaxed text-center sm:text-right">
          <span className="text-amber-400 font-bold">⚠️ إخلاء مسؤولية أكاديمية: </span>
          المحتوى التعليمي والملخصات والخرائط الذهنية المتوفرة على منصة ملخصات تمريض مخصصة لأغراض المذاكرة الأكاديمية والتحصيل الدراسي لطلاب التمريض. لا يُعتبر المحتوى بديلاً عن المراجع الطبية المعتمدة أو التوجيهات الطبية الرسمية المعمول بها في المنشآت الصحية.
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} ملخصات تمريض. جميع الحقوق محفوظة.</p>
            <SecretAdminTrigger />
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span>صُممت بكل</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>لخدمة أبطال الجيش الأبيض والتمريض</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
