import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    'المنصة الأكاديمية الشاملة لطلاب كليات ومعاهد التمريض: ملخصات PDF، عروض بوربوينت PPT، خرائط ذهنية، فلاش كاردز ثلاثية الأبعاد تفاعلية، وكويزات تجريبية معتمدة لجميع السنوات الدراسية.',
  keywords: [
    'ملخصات تمريض',
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
  metadataBase: new URL('https://nursing-app.vercel.app'),
  openGraph: {
    title: 'ملخصات تمريض | بنك ملخصات وكويزات التمريض التفاعلي',
    description: 'استكشف ملخصات مواد التمريض التفاعلية ثلاثية الأبعاد والخرائط الذهنية وبنك الأسئلة.',
    type: 'website',
    locale: 'ar_EG',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000';

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        {/* Google AdSense Head Script */}
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
