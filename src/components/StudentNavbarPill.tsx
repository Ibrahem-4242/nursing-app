'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import {
  User,
  GraduationCap,
  BookOpen,
  LogOut,
  ChevronDown,
  Sparkles,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface StudentNavbarPillProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function StudentNavbarPill({ isMobile = false, onNavigate }: StudentNavbarPillProps) {
  const { student, isLoggedIn, logout, openAuthModal } = useStudentAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoggedIn || !student) {
    if (isMobile) {
      return (
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate();
            openAuthModal('login');
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-2 border border-teal-200 dark:border-teal-800/80 transition"
        >
          <User className="w-4 h-4" />
          <span>تسجيل الدخول / حساب جديد 👤</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => openAuthModal('login')}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition border border-slate-200 dark:border-slate-700"
        title="حساب الطالب للمحاضرات المشتراة"
      >
        <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>حساب الطالب 👤</span>
      </button>
    );
  }

  // LOGGED IN VIEW
  const purchasedCount = student.purchasedLectureIds?.length || 0;

  if (isMobile) {
    return (
      <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-slate-850 border border-teal-200 dark:border-teal-800/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                <span>{student.name}</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">({student.university})</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                {student.phone}
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
            {purchasedCount} محاضرة مفعلة
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            if (onNavigate) onNavigate();
          }}
          className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-teal-200 dark:border-teal-800 text-xs font-black transition shadow-sm"
      >
        <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
          {student.name.charAt(0)}
        </div>
        <div className="flex flex-col text-right">
          <span className="leading-tight truncate max-w-[110px]">{student.name}</span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal leading-tight truncate max-w-[110px]">
            {student.university}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in space-y-2.5">
          <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
              <span>{student.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {student.university}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
              {student.phone}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-teal-50/70 dark:bg-slate-800/60 text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>المحاضرات المفعلة:</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[11px] font-black">
              {purchasedCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              logout();
            }}
            className="w-full py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      )}
    </div>
  );
}
