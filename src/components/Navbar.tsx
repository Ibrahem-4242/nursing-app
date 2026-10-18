'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Menu, X, MessageCircle, Bookmark } from 'lucide-react';
import { BOT_CONFIG } from '@/lib/mock-data';
import ThemeToggle from '@/components/ThemeToggle';
import StudentNavbarPill from '@/components/StudentNavbarPill';
import NotificationBell from '@/components/NotificationBell';
import { useBookmarks } from '@/context/BookmarksContext';
import { PlatformFeaturesConfig } from '@/lib/types';

interface NavbarProps {
  activeYears?: { id: string; title: string }[];
  platformFeatures?: PlatformFeaturesConfig;
}

export default function Navbar({
  activeYears = [{ id: '1', title: 'السنة الأولى' }],
  platformFeatures,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalCount: bookmarksCount } = useBookmarks();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo: ملخصات تمريض */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md sm:shadow-lg shadow-teal-600/25 group-hover:scale-105 transition-transform duration-300">
            <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.3]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-tight">
              ملخصات تمريض
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold text-teal-600 dark:text-teal-400 mt-0.5 line-clamp-1">
              {activeYears.length === 1 ? `مقررات وملخصات ${activeYears[0].title}` : 'المنصة الأكاديمية لطلاب التمريض'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
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



        {/* Right Controls: Dark Mode Toggle, Bookmarks, Notification Bell, Student Account Pill, & WhatsApp Group */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {platformFeatures?.bookmarks !== false && (
            <Link
              href="/bookmarks"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black transition relative shadow-xs"
              title="محفوظاتي ليلة الامتحان"
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>محفوظاتي</span>
              {bookmarksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black min-w-[18px] text-center">
                  {bookmarksCount}
                </span>
              )}
            </Link>
          )}

          {platformFeatures?.notifications !== false && <NotificationBell />}
          <ThemeToggle />
          <StudentNavbarPill />

          {platformFeatures?.whatsappButton !== false && (
            <a
              href={BOT_CONFIG.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.2]" />
              <span>انضم لجروب الواتساب</span>
            </a>
          )}
        </div>

        {/* Mobile controls: Bookmarks, Notifications, Theme toggle and menu */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2">
          {/* Mobile Bookmarks Quick Button */}
          {platformFeatures?.bookmarks !== false && (
            <Link
              href="/bookmarks"
              className="p-1.5 sm:p-2 rounded-xl text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition relative"
              aria-label="محفوظاتي ليلة الامتحان"
              title="محفوظاتي ليلة الامتحان"
            >
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500 text-amber-600" />
              {bookmarksCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {bookmarksCount > 9 ? '9+' : bookmarksCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Notification Bell */}
          {platformFeatures?.notifications !== false && <NotificationBell isMobile />}

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


          {/* Mobile Bookmarks Button inside Drawer */}
          {platformFeatures?.bookmarks !== false && (
            <Link
              href="/bookmarks"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-black shadow-xs active:scale-98 transition"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600" />
                <span>محفوظاتي ليلة الامتحان 🔖</span>
              </div>
              {bookmarksCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {bookmarksCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Student Account Pill */}
          <div className="pb-1">
            <StudentNavbarPill isMobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>

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
            {platformFeatures?.whatsappButton !== false && (
              <a
                href={BOT_CONFIG.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.2]" />
                <span>انضم لجروب الواتساب الرسمي</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
