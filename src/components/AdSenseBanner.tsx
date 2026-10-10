'use client';

import React, { useEffect, useState } from 'react';

interface AdSenseBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  layoutKey?: string;
  className?: string;
  position?: 'header' | 'in-content' | 'pre-download' | 'sidebar' | 'footer';
  label?: string;
}

export default function AdSenseBanner({
  slotId = '1234567890',
  format = 'auto',
  className = '',
  position = 'in-content',
  label = 'مساحة إعلانية مصرحة',
}: AdSenseBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000';
  const isProduction = process.env.NODE_ENV === 'production' && !clientId.includes('00000000');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && isProduction) {
        // @ts-expect-error adsbygoogle is added by Google script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.warn('AdSense script push error:', e);
    }
  }, [isProduction]);

  const getMinHeight = () => {
    switch (position) {
      case 'header':
        return 'min-h-[90px] md:min-h-[100px]';
      case 'pre-download':
        return 'min-h-[250px] md:min-h-[280px]';
      case 'in-content':
        return 'min-h-[250px]';
      default:
        return 'min-h-[120px]';
    }
  };

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
      dir="rtl"
    >
      {/* Label compliant with Google AdSense terms */}
      <div className="flex items-center justify-between w-full mb-1.5 px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          {label}
        </span>
        <span className="text-[10px] tracking-wider uppercase text-slate-300 dark:text-slate-600">Advertisement</span>
      </div>

      <div className={`w-full flex items-center justify-center ${getMinHeight()}`}>
        {isProduction ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          /* High-fidelity Mock Banner for Dev / Review Preview */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 border border-dashed border-teal-200/80 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl text-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 text-xs font-bold">
                Ad
              </span>
              <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                {position === 'header' && 'إعلان أعلى الصفحة (Leaderboard Banner)'}
                {position === 'in-content' && 'إعلان مدمج بين فقرات المحتوى الطبي (In-Article Ad)'}
                {position === 'pre-download' && 'إعلان ما قبل روابط التحميل (Pre-Download High Impact)'}
                {position === 'sidebar' && 'إعلان الشريط الجانبي (Vertical Skyscraper)'}
                {position === 'footer' && 'إعلان أسفل المحتوى (Bottom Display)'}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
              موقع مجهز برمجياً للربط التلقائي بـ Google AdSense عند إدخال معرف الناشر (Publisher ID: {clientId})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
