'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentBookmarks } from '@/lib/types';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { Bookmark, CheckCircle2, Trash2 } from 'lucide-react';

interface BookmarksContextType {
  bookmarks: StudentBookmarks;
  isLoading: boolean;
  totalCount: number;
  isBookmarked: (type: 'lecture' | 'question' | 'concept', targetId: string) => boolean;
  toggleBookmark: (
    type: 'lecture' | 'question' | 'concept',
    targetId: string,
    titleLabel?: string
  ) => Promise<boolean>;
  removeBookmark: (
    type: 'lecture' | 'question' | 'concept',
    targetId: string
  ) => Promise<void>;
  clearAllBookmarks: (type?: 'lecture' | 'question' | 'concept') => void;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nursing_student_bookmarks_v1';

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { student, isLoggedIn } = useStudentAuth();
  const [bookmarks, setBookmarks] = useState<StudentBookmarks>({
    lectureIds: [],
    questionIds: [],
    conceptIds: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'add' | 'remove'>('add');

  // 1. Load initial bookmarks from localStorage + server
  useEffect(() => {
    let localBookmarks: StudentBookmarks = { lectureIds: [], questionIds: [], conceptIds: [] };
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localBookmarks = JSON.parse(stored);
      }
    } catch {}

    // If student is logged in and has bookmarks in user object, merge them
    if (student?.bookmarks) {
      const merged: StudentBookmarks = {
        lectureIds: Array.from(new Set([...(localBookmarks.lectureIds || []), ...(student.bookmarks.lectureIds || [])])),
        questionIds: Array.from(new Set([...(localBookmarks.questionIds || []), ...(student.bookmarks.questionIds || [])])),
        conceptIds: Array.from(new Set([...(localBookmarks.conceptIds || []), ...(student.bookmarks.conceptIds || [])])),
      };
      setBookmarks(merged);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from server
    fetch('/api/student/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.bookmarks) {
          const merged: StudentBookmarks = {
            lectureIds: Array.from(new Set([...(localBookmarks.lectureIds || []), ...(data.bookmarks.lectureIds || [])])),
            questionIds: Array.from(new Set([...(localBookmarks.questionIds || []), ...(data.bookmarks.questionIds || [])])),
            conceptIds: Array.from(new Set([...(localBookmarks.conceptIds || []), ...(data.bookmarks.conceptIds || [])])),
          };
          setBookmarks(merged);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
        } else {
          setBookmarks(localBookmarks);
        }
      })
      .catch(() => {
        setBookmarks(localBookmarks);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [student?.id, student?.bookmarks]);

  // Trigger brief vibration on mobile if supported
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }
  };

  const showToast = (msg: string, type: 'add' | 'remove') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const isBookmarked = useCallback(
    (type: 'lecture' | 'question' | 'concept', targetId: string) => {
      const cleanId = (targetId || '').trim();
      if (!cleanId) return false;
      if (type === 'lecture') return (bookmarks.lectureIds || []).includes(cleanId);
      if (type === 'question') return (bookmarks.questionIds || []).includes(cleanId);
      if (type === 'concept') return (bookmarks.conceptIds || []).includes(cleanId);
      return false;
    },
    [bookmarks]
  );

  const toggleBookmark = async (
    type: 'lecture' | 'question' | 'concept',
    targetId: string,
    titleLabel?: string
  ): Promise<boolean> => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return false;

    triggerHaptic();

    const currentlyBookmarked = isBookmarked(type, cleanId);
    const willBeBookmarked = !currentlyBookmarked;

    // 1. Optimistic state update
    const updated: StudentBookmarks = {
      lectureIds: [...(bookmarks.lectureIds || [])],
      questionIds: [...(bookmarks.questionIds || [])],
      conceptIds: [...(bookmarks.conceptIds || [])],
    };

    if (type === 'lecture') {
      updated.lectureIds = willBeBookmarked
        ? [...updated.lectureIds, cleanId]
        : updated.lectureIds.filter((id) => id !== cleanId);
    } else if (type === 'question') {
      updated.questionIds = willBeBookmarked
        ? [...updated.questionIds, cleanId]
        : updated.questionIds.filter((id) => id !== cleanId);
    } else if (type === 'concept') {
      updated.conceptIds = willBeBookmarked
        ? [...updated.conceptIds, cleanId]
        : updated.conceptIds.filter((id) => id !== cleanId);
    }

    setBookmarks(updated);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Toast feedback
    if (willBeBookmarked) {
      showToast(
        titleLabel
          ? `تمت إضافة "${titleLabel}" لمحفوظات ليلة الامتحان 🔖`
          : 'تمت الإضافة لمحفوظات ليلة الامتحان 🔖',
        'add'
      );
    } else {
      showToast('تمت الإزالة من المحفوظات 🗑️', 'remove');
    }

    // 2. Synchronize with server in the background
    fetch('/api/student/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, targetId: cleanId }),
    }).catch((err) => {
      console.warn('[Bookmarks] Sync notice:', err);
    });

    return willBeBookmarked;
  };

  const removeBookmark = async (
    type: 'lecture' | 'question' | 'concept',
    targetId: string
  ) => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return;
    if (isBookmarked(type, cleanId)) {
      await toggleBookmark(type, cleanId);
    }
  };

  const clearAllBookmarks = (type?: 'lecture' | 'question' | 'concept') => {
    setBookmarks((prev) => {
      let updated: StudentBookmarks;
      if (!type) {
        updated = { lectureIds: [], questionIds: [], conceptIds: [] };
      } else if (type === 'lecture') {
        updated = { ...prev, lectureIds: [] };
      } else if (type === 'question') {
        updated = { ...prev, questionIds: [] };
      } else {
        updated = { ...prev, conceptIds: [] };
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      showToast('تم إفراغ المحفوظات بنجاح 🗑️', 'remove');
      return updated;
    });
  };

  const totalCount =
    (bookmarks.lectureIds?.length || 0) +
    (bookmarks.questionIds?.length || 0) +
    (bookmarks.conceptIds?.length || 0);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        isLoading,
        totalCount,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        clearAllBookmarks,
      }}
    >
      {children}

      {/* GLOBAL TOAST NOTIFICATION FOR BOOKMARK ACTIONS */}
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none"
          dir="rtl"
        >
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-black border backdrop-blur-md ${
              toastType === 'add'
                ? 'bg-slate-900/95 text-amber-300 border-amber-400/50 shadow-amber-500/10'
                : 'bg-slate-900/95 text-slate-300 border-slate-700/60 shadow-black/30'
            }`}
          >
            {toastType === 'add' ? (
              <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            ) : (
              <Trash2 className="w-4 h-4 text-slate-400" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return ctx;
}
