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
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const isRealAdSense = Boolean(clientId && !clientId.includes('00000000') && clientId.startsWith('ca-pub-'));

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && isRealAdSense) {
        // @ts-expect-error adsbygoogle is added by Google script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.warn('AdSense script push error:', e);
    }
  }, [isRealAdSense]);

  // If no real AdSense client ID is active, do not display dummy dashed developer boxes to students
  if (!isRealAdSense) {
    return null;
  }

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
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 transition-all duration-300 ${className}`}
      dir="rtl"
    >
      <div className="flex items-center justify-between w-full mb-1.5 px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          {label}
        </span>
        <span className="text-[10px] tracking-wider uppercase text-slate-300 dark:text-slate-600">Advertisement</span>
      </div>

      <div className={`w-full flex items-center justify-center ${getMinHeight()}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
