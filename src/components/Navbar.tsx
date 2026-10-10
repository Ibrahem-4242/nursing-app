'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Menu, X, Send } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo: ملخصات تمريض */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/25 group-hover:scale-105 transition-transform duration-300">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                ملخصات تمريض
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                منصة تعليمية
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
              الملخصات، الكويزات، والخرائط الذهنية لسنوات التمريض
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            الرئيسية
          </Link>
          <Link href="/year/1" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            السنة الأولى
          </Link>
          <Link href="/year/2" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            السنة الثانية
          </Link>
          <Link href="/year/3" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            السنة الثالثة
          </Link>
          <Link href="/year/4" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            السنة الرابعة
          </Link>
          <Link href="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            عن المنصة
          </Link>
          <Link href="/contact" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            اتصل بنا
          </Link>
        </nav>

        {/* Right Controls: Dark Mode Toggle & Telegram Bot Action */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />

          <a
            href={BOT_CONFIG.telegramBotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 hover:opacity-95 active:scale-95 transition"
          >
            <Send className="w-3.5 h-3.5 -rotate-45" />
            <span>بوت التليجرام الرسمي</span>
          </a>
        </div>

        {/* Mobile menu and theme toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-2.5 shadow-xl animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white"
          >
            🏠 الرئيسية
          </Link>
          <Link
            href="/year/1"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            🩺 السنة الأولى
          </Link>
          <Link
            href="/year/2"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            🧪 السنة الثانية
          </Link>
          <Link
            href="/year/3"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            💉 السنة الثالثة
          </Link>
          <Link
            href="/year/4"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            🏥 السنة الرابعة
          </Link>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
            >
              عن المنصة
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
            >
              اتصل بنا
            </Link>
            <Link
              href="/privacy-policy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
            >
              سياسة الخصوصية
            </Link>
            <a
              href={BOT_CONFIG.telegramBotLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 text-white font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5 -rotate-45" />
              <span>فتح البوت على تليجرام</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
