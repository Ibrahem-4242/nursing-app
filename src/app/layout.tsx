import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import VisitorTracker from '@/components/VisitorTracker';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'ملخصات تمريض | المنصة الشاملة لكويزات ومواد التمريض التفاعلية',
    template: '%s | ملخصات تمريض',
  },
  description:
    'المنصة الأكاديمية الشاملة لطلاب كليات ومعاهد التمريض: ملخصات PDF، عروض بوربوينت PPT، خرائط ذهنية، فلاش كاردز تفاعلية، ملخصات صوتية Audio، وكويزات تجريبية معتمدة لجميع السنوات الدراسية.',
  keywords: [
    'ملخصات تمريض',
    'ملخص صوتي تمريض',
    'تسجيلات صوتية تمريض',
    'كويزات تمريض',
    'تشريح اناتومي تمريض',
    'فارماكولوجي تمريض',
    'أساسيات التمريض',
    'تمريض باطني وجراحي',
    'تمريض أطفال',
    'تمريض نساء وتوليد',
    'فلاش كاردز طبية',
    'خرائط ذهنية تمريض',
  ],
  authors: [{ name: 'فريق ملخصات تمريض الأكاديمي' }],
  creator: 'ملخصات تمريض',
  metadataBase: new URL('https://www.nursingsum.live'),
  openGraph: {
    title: 'ملخصات تمريض | بنك ملخصات وكويزات التمريض التفاعلي',
    description: 'استكشف ملخصات مواد التمريض التفاعلية ثلاثية الأبعاد والخرائط الذهنية وبنك الأسئلة.',
    type: 'website',
    locale: 'ar_EG',
  },
  other: {
    'google-adsense-account': 'ca-pub-9204080838190086',
  },
};

import { ACADEMIC_YEARS } from '@/lib/mock-data';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';
import MaintenanceWrapper from '@/components/MaintenanceWrapper';
import { MaintenanceConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let activeYears = [{ id: '1', title: 'السنة الأولى' }];
  let maintenanceConfig: MaintenanceConfig = {
    isEnabled: false,
    title: 'المنصة في وضع الصيانة والتحديث المؤقت 🛠️',
    message:
      'نقوم حالياً بإجراء تحديثات وتحسينات دورية لإضافة محاضرات ومحتوى تعليمي جديد وتطوير تجربة التعلم لجميع طلاب تمريض. سنعود إليكم خلال وقت قصير بإذن الله.',
    estimatedReturn: 'خلال وقت قصير جداً',
    contactWhatsapp: 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti',
    updatedAt: new Date().toISOString(),
  };

  const cookieStore = cookies();
  const isAdmin =
    cookieStore.get('nursing_admin_token')?.value ===
    'secret_session_5143545638_verified';

  try {
    const [liveLectures, quizzesList, allSubjects, fetchedMaintenance] = await Promise.all([
      CmsService.getLiveLectures(),
      CmsService.getAllSubjectQuizFilesList(),
      CmsService.getAllSubjects(),
      CmsService.getMaintenanceConfig(),
    ]);

    if (fetchedMaintenance) {
      maintenanceConfig = fetchedMaintenance;
    }

    const subjectYearMap = new Map<string, string>();
    allSubjects.forEach((s) => subjectYearMap.set(s.id, s.yearId));

    const yearsWithContent = ACADEMIC_YEARS.filter((yr) => {
      if (yr.id === '1') return true;
      const hasLec = liveLectures.some(
        (l) => (l.yearId || subjectYearMap.get(l.subjectId) || '1') === yr.id
      );
      const hasQuiz = quizzesList.some(
        (q) => q.isLive !== false && (subjectYearMap.get(q.subjectId) || '1') === yr.id
      );
      return hasLec || hasQuiz;
    }).map((yr) => ({ id: yr.id, title: yr.title }));

    if (yearsWithContent.length > 0) {
      activeYears = yearsWithContent;
    }
  } catch {
    activeYears = [{ id: '1', title: 'السنة الأولى' }];
  }

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        {/* Google AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9204080838190086"
          crossOrigin="anonymous"
        ></script>
        {/* Script to avoid theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-cairo min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-teal-600 selection:text-white transition-colors duration-200">
        <MaintenanceWrapper maintenanceConfig={maintenanceConfig} isAdmin={isAdmin}>
          <AnnouncementBar />
          <Navbar activeYears={activeYears} />
          <main className="flex-1">{children}</main>
          <Footer activeYears={activeYears} />
        </MaintenanceWrapper>
        <VisitorTracker />
        <Analytics />
      </body>
    </html>
  );
}
