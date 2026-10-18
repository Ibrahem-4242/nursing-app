'use client';

import React, { useState } from 'react';
import { Star, Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarksContext';

interface LectureBookmarkButtonProps {
  lectureId: string;
  lectureTitle?: string;
  variant?: 'pill' | 'icon' | 'badge';
  className?: string;
}

export default function LectureBookmarkButton({
  lectureId,
  lectureTitle = 'المحاضرة',
  variant = 'pill',
  className = '',
}: LectureBookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked('lecture', lectureId);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    await toggleBookmark('lecture', lectureId, lectureTitle);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer ${
          bookmarked
            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-500 border border-amber-300 dark:border-amber-700 shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
        } ${isBouncing ? 'scale-110' : ''} ${className}`}
        title={bookmarked ? 'محفوظة ليلة الامتحان 🔖 (انقر للإزالة)' : 'حفظ المحاضرة ليلة الامتحان ⭐'}
        aria-label="حفظ المحاضرة"
      >
        <Star
          className={`w-4 h-4 transition-transform ${
            bookmarked ? 'fill-amber-400 text-amber-500 scale-105' : 'text-slate-400'
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
        bookmarked
          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/20 border border-amber-300'
          : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
      } ${isBouncing ? 'scale-105' : ''} ${className}`}
      title={bookmarked ? 'محفوظة ليلة الامتحان 🔖 (انقر للإزالة)' : 'حفظ المحاضرة كاملة للمراجعة السريعة ⭐'}
    >
      <Star
        className={`w-3.5 h-3.5 ${
          bookmarked ? 'fill-white text-white' : 'text-amber-500'
        }`}
      />
      <span>{bookmarked ? 'محفوظة ليلة الامتحان 🔖' : 'احفظ ليلة الامتحان ⭐'}</span>
    </button>
  );
}
