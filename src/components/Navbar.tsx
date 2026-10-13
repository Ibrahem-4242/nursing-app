'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Menu, X, MessageCircle } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';
import ThemeToggle from '@/components/ThemeToggle';

interface NavbarProps {
  activeYears?: { id: string; title: string }[];
}

export default function Navbar({
  activeYears = [{ id: '1', title: 'السنة الأولى' }],
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo: ملخصات تمريض */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/25 group-hover:scale-105 transition-transform duration-300">
            <Stethoscope className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-tight">
              ملخصات تمريض
            </span>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
              {activeYears.length === 1 ? `مقررات وملخصات ${activeYears[0].title}` : 'المنصة الأكاديمية لطلاب التمريض'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            الرئيسية
          </Link>
          {activeYears.map((yr) => (
            <Link
              key={yr.id}
              href={`/year/${yr.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold hover:bg-teal-600 hover:text-white transition"
            >
              <span>🩺 {yr.title}</span>
            </Link>
          ))}
          <Link href="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            عن المنصة
          </Link>
          <Link href="/contact" className="hover:text-teal-600 dark:hover:text-teal-400 transition py-1">
            اتصل بنا
          </Link>
        </nav>

        {/* Right Controls: Dark Mode Toggle & WhatsApp Group Action */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />

          <a
            href={BOT_CONFIG.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.2]" />
            <span>انضم لجروب الواتساب</span>
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
          {activeYears.map((yr) => (
            <Link
              key={yr.id}
              href={`/year/${yr.id}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-sm font-bold text-teal-700 dark:text-teal-300"
            >
              🩺 {yr.title}
            </Link>
          ))}
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
              href={BOT_CONFIG.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.2]" />
              <span>انضم لجروب الواتساب الرسمي</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
