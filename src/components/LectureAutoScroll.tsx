'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LectureAutoScroll() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScrollToHash = () => {
      const rawHash = window.location.hash;
      if (!rawHash) return;

      const targetId = rawHash.replace(/^#/, '');
      if (!targetId) return;

      // Allow DOM to finish rendering
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add animated glow pulse
          targetElement.classList.add(
            'ring-4',
            'ring-amber-400',
            'dark:ring-amber-500',
            'bg-amber-50/70',
            'dark:bg-amber-950/40',
            'transition-all',
            'duration-700'
          );

          setTimeout(() => {
            targetElement.classList.remove(
              'ring-4',
              'ring-amber-400',
              'dark:ring-amber-500',
              'bg-amber-50/70',
              'dark:bg-amber-950/40'
            );
          }, 3000);
        }
      }, 250);
    };

    handleScrollToHash();
    window.addEventListener('hashchange', handleScrollToHash);

    return () => {
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, [searchParams]);

  return null;
}
