'use client';

import React, { useState } from 'react';
import { Bookmark, Pin, Star } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarksContext';

interface QuestionBookmarkButtonProps {
  questionId: number | string;
  questionText: string;
  lectureId?: string;
  className?: string;
}

export default function QuestionBookmarkButton({
  questionId,
  questionText,
  lectureId = 'general',
  className = '',
}: QuestionBookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const targetId = `${lectureId}:::q-${questionId}`;
  const bookmarked = isBookmarked('question', targetId);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    const snippet = questionText.slice(0, 40) + (questionText.length > 40 ? '...' : '');
    await toggleBookmark('question', targetId, snippet);
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
      title={bookmarked ? 'محفوظ في بنك الأسئلة الصعبة ليلة الامتحان 📌 (انقر للإزالة)' : 'احفظ هذا السؤال ليلة الامتحان 📌'}
    >
      <Pin
        className={`w-3.5 h-3.5 transition-transform ${
          bookmarked ? 'text-amber-600 fill-amber-500 rotate-45' : 'text-slate-400'
        }`}
      />
      <span>{bookmarked ? 'محفوظ ليلة الامتحان 📌' : 'احفظ هذا السؤال ليلة الامتحان 📌'}</span>
    </button>
  );
}
