'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import { triggerPWAInstall } from '@/components/PWAInstallBanner';

interface PWAInstallButtonProps {
  variant?: 'pill' | 'footer' | 'navbar';
  className?: string;
}

export default function PWAInstallButton({ variant = 'footer', className = '' }: PWAInstallButtonProps) {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={() => triggerPWAInstall()}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-teal-600/15 hover:bg-teal-600/25 text-teal-400 border border-teal-500/30 text-xs font-bold transition active:scale-95 ${className}`}
        title="تثبيت التطبيق على الشاشة الرئيسية"
      >
        <Smartphone className="w-4 h-4" />
        <span>تثبيت التطبيق 📱</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => triggerPWAInstall()}
      className={`inline-flex items-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition ${className}`}
      title="تثبيت المنصة كتطبيق على هاتفك"
    >
      <Smartphone className="w-4 h-4" />
      <span>تثبيت تطبيق المنصة على هاتفك 📲</span>
    </button>
  );
}
