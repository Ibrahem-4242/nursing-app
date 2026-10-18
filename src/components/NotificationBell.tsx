'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Megaphone,
  CheckCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { useStudentAuth } from '@/context/StudentAuthContext';

function formatTimeAgoArabic(dateString: string): string {
  try {
    const now = Date.now();
    const past = new Date(dateString).getTime();
    if (isNaN(past)) return dateString;
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSec < 60) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return 'منذ دقيقة';
    if (diffMin === 2) return 'منذ دقيقتين';
    if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return 'منذ ساعة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays <= 10) return `منذ ${diffDays} أيام`;
    return `منذ ${diffDays} يوماً`;
  } catch {
    return dateString;
  }
}

export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const { student, isLoggedIn } = useStudentAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeYearId, setActiveYearId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize active year from student profile or localStorage
  useEffect(() => {
    let year = student?.yearId || student?.shakibRakibSubscription?.yearId;
    if (!year && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nursing_student_active_year');
        if (stored) year = stored;
      } catch {}
    }
    setActiveYearId(year || '1');
  }, [student]);

  // Load read notification IDs from localStorage and student profile
  useEffect(() => {
    const ids = new Set<string>();
    if (student?.readNotificationIds) {
      student.readNotificationIds.forEach((id) => ids.add(id));
    }
    if (typeof window !== 'undefined') {
      try {
        const localRead = localStorage.getItem('nursing_read_notif_ids');
        if (localRead) {
          const parsed = JSON.parse(localRead);
          if (Array.isArray(parsed)) {
            parsed.forEach((id) => ids.add(id));
          }
        }
      } catch {}
    }
    setReadIds(ids);
  }, [student]);

  // Fetch notifications for the active year and student
  const fetchNotifications = async (year: string) => {
    try {
      setIsLoading(true);
      const url = `/api/student/notifications?yearId=${year}${student?.id ? `&studentId=${student.id}` : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.warn('[NotificationBell] Failed to fetch:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeYearId);
    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications(activeYearId);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeYearId, student?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const saveReadId = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nursing_read_notif_ids', JSON.stringify(Array.from(next)));
        } catch {}
      }
      return next;
    });

    fetch('/api/student/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', notificationId: id, studentId: student?.id }),
    }).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const next = new Set([...Array.from(prev), ...allIds]);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nursing_read_notif_ids', JSON.stringify(Array.from(next)));
        } catch {}
      }
      return next;
    });

    try {
      await fetch('/api/student/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', notificationIds: allIds, studentId: student?.id }),
      });
    } catch {}
  };

  const handleNotificationClick = (notif: AppNotification) => {
    saveReadId(notif.id);
    setIsOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const handleYearChange = (newYear: string) => {
    setActiveYearId(newYear);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nursing_student_active_year', newYear);
      } catch {}
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="relative inline-block" ref={containerRef} dir="rtl">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-center transition cursor-pointer ${
          isMobile
            ? 'p-2 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
            : 'w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs'
        }`}
        title="الإشعارات والتنبيهات الموجهة"
        aria-label="الإشعارات"
      >
        <Bell className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${unreadCount > 0 ? 'text-teal-600 dark:text-teal-400' : ''}`} />

        {/* Unread Red Badge with Pulse */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[18px] items-center justify-center px-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-md shadow-rose-600/40">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative z-10">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
            isMobile ? 'w-[88vw] max-w-[340px] fixed sm:absolute left-4 right-4 sm:left-auto top-20 sm:top-auto' : 'w-84 sm:w-96'
          }`}
        >
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-l from-teal-50 via-white to-white dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>التنبيهات والإشعارات</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                        {unreadCount} جديد
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    إشعارات مخصصة لفرقتك الدراسية وحسابك 🩺
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 rounded-xl bg-teal-100 hover:bg-teal-200 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>تحديد الكل</span>
                </button>
              )}
            </div>

            {/* Academic Year Selector Pill */}
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                <span>الفرقة المعروضة:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleYearChange('1')}
                  className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition ${
                    activeYearId === '1'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  الفرقة الأولى
                </button>
                <button
                  type="button"
                  onClick={() => handleYearChange('2')}
                  className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition ${
                    activeYearId === '2'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  الفرقة الثانية
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  لا توجد إشعارات جديدة حالياً 📭
                </div>
                <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  ستصلك تنبيهات فورية هنا عند رفع محاضرات جديدة لمواد الفرقة {activeYearId === '1' ? 'الأولى' : 'الثانية'} أو اعتماد مدفوعاتك.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = readIds.has(notif.id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                      !isRead
                        ? 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Icon by Type */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                        notif.type === 'order'
                          ? 'bg-emerald-500 text-white'
                          : notif.type === 'lecture'
                          ? 'bg-teal-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {notif.type === 'order' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : notif.type === 'lecture' ? (
                        <BookOpen className="w-4 h-4" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-medium">
                          {formatTimeAgoArabic(notif.createdAt)}
                        </span>
                        {notif.targetStudentId ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                            خاص بحسابك 🔒
                          </span>
                        ) : notif.targetYearId && notif.targetYearId !== 'all' ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                            الفرقة {notif.targetYearId === '1' ? 'الأولى' : notif.targetYearId === '2' ? 'الثانية' : notif.targetYearId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>إشعارات ذكية فورية لجميع المحاضرات والطلبات</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
