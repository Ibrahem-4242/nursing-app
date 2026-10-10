'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, X, ArrowLeft, ExternalLink } from 'lucide-react';

interface Announcement {
  text: string;
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('announcement_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const fetchAnnouncement = async () => {
      try {
        const res = await fetch('/api/announcement');
        const data = await res.json();
        if (data.success && data.announcement) {
          setAnnouncement(data.announcement);
        }
      } catch (err) {
        console.error('[AnnouncementBar] Failed to load announcement:', err);
      }
    };

    fetchAnnouncement();
  }, []);

  if (!announcement || !announcement.isActive || !announcement.text || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  return (
    <aside
      aria-label="تنبيه وإعلان المنصة"
      className="relative z-40 bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-medium py-2.5 px-4 shadow-sm"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 justify-center sm:justify-start">
          <span className="p-1 rounded-lg bg-white/20 text-white flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </span>

          <span className="leading-tight font-bold tracking-wide">
            {announcement.text}
          </span>

          {announcement.linkUrl && announcement.linkText && (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-teal-800 text-xs font-black hover:bg-teal-50 transition-colors shadow-sm ml-2"
            >
              <span>{announcement.linkText}</span>
              <ArrowLeft className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          title="إغلاق التنبيه"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
