'use client';

import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarksContext';

interface ConceptBookmarkButtonProps {
  lectureId: string;
  conceptIndex: number;
  conceptHeading: string;
  className?: string;
}

export default function ConceptBookmarkButton({
  lectureId,
  conceptIndex,
  conceptHeading,
  className = '',
}: ConceptBookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const targetId = `${lectureId}:::concept-${conceptIndex}`;
  const bookmarked = isBookmarked('concept', targetId);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    await toggleBookmark('concept', targetId, conceptHeading);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
        bookmarked
          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs'
          : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 border border-slate-200/80 dark:border-slate-700'
      } ${isBouncing ? 'scale-105' : ''} ${className}`}
      title={bookmarked ? 'مفهوم مميز ليلة الامتحان ⭐ (انقر للإزالة)' : 'احفظ هذا المفهوم الصعب ليلة الامتحان ⭐'}
    >
      <Star
        className={`w-3.5 h-3.5 ${
          bookmarked ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
        }`}
      />
      <span>{bookmarked ? 'مفهوم مميز ليلة الامتحان ⭐' : 'احفظ هذا المفهوم ⭐'}</span>
    </button>
  );
}
