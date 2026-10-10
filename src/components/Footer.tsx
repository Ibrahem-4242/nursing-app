import React from 'react';
import Link from 'next/link';
import { Stethoscope, Send, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Platform Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-white">نيرسنج هَب</span>
                <span className="text-[10px] block text-teal-400 font-bold">Nursing Study Hub</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              المنصة الأكاديمية الأولى المتخصصة في دعم طلاب كليات ومعاهد التمريض بأحدث الملخصات، الخرائط الذهنية، الكويزات التفاعلية والمجسمات الطبية ثلاثية الأبعاد.
            </p>
            <div className="pt-2">
              <a
                href={BOT_CONFIG.telegramBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5 -rotate-45" />
                <span>انضم لقناة وبوت التليجرام</span>
              </a>
            </div>
          </div>

          {/* Col 2: Academic Years */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              السنوات الدراسية
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/year/1" className="hover:text-teal-400 transition">
                  السنة الأولى (التشريح، وظائف الأعضاء، الأساسيات)
                </Link>
              </li>
              <li>
                <Link href="/year/2" className="hover:text-teal-400 transition">
                  السنة الثانية (الفارماكولوجي، الميكرو، باطني وجراحي)
                </Link>
              </li>
              <li>
                <Link href="/year/3" className="hover:text-teal-400 transition">
                  السنة الثالثة (تمريض أطفال، نساء وتوليد)
                </Link>
              </li>
              <li>
                <Link href="/year/4" className="hover:text-teal-400 transition">
                  السنة الرابعة (التمريض النفسي، القيادة والإدارة)
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
                  اتصل بنا والدعم الفني (Contact)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Payment System */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              الدعم والاشتراكات
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>مواعيد خدمة الطلاب: {BOT_CONFIG.workHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>طريقة الدفع: {BOT_CONFIG.paymentMethod}</span>
              </div>
              <p className="text-[11px] text-slate-500 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 leading-relaxed">
                رقم كاش للمحتوى المدفوع: <span className="text-teal-300 font-mono font-bold">{BOT_CONFIG.adminContactPhone}</span> (المحاضرة الأولى مجانية دائماً لجميع المواد).
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer Banner */}
        <div className="py-6 border-b border-slate-800/80 text-[11px] text-slate-400 leading-relaxed text-center sm:text-right">
          <span className="text-amber-400 font-bold">⚠️ إخلاء مسؤولية أكاديمية: </span>
          المحتوى التعليمي والملخصات والخرائط الذهنية المتوفرة على منصة NursingHub مخصصة لأغراض المذاكرة الأكاديمية والتدريب السريري لطلاب التمريض. لا يُعتبر المحتوى بديلاً عن المراجع الطبية المعتمدة أو التوجيهات الطبية الرسمية المعمول بها في المنشآت الصحية.
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} نيرسنج هَب (NursingHub). جميع الحقوق محفوظة.</p>
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
