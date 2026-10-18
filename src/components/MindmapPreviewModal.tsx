'use client';

import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Sparkles,
  CreditCard,
  Network,
  Maximize2,
} from 'lucide-react';
import { LectureFile } from '@/lib/types';

interface MindmapPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mindmapFile: LectureFile;
  lectureTitle: string;
  subjectTitle: string;
  price?: number;
  onOpenPurchase?: () => void;
}

export default function MindmapPreviewModal({
  isOpen,
  onClose,
  mindmapFile,
  lectureTitle,
  subjectTitle,
  price = 50,
  onOpenPurchase,
}: MindmapPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  const rawUrl = (mindmapFile.downloadUrl || mindmapFile.fileUrl || '').trim();

  // Convert Google Drive view URL to preview URL for embedding in iframe
  const getEmbeddableUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      return url
        .replace(/\/view(\?.*)?$/, '/preview')
        .replace(/\/edit(\?.*)?$/, '/preview');
    }
    return url;
  };

  const embedUrl = getEmbeddableUrl(rawUrl);
  const isImage = /\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(rawUrl);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                  معاينة مجانية 100% 🗺️
                </span>
                <span className="text-xs text-slate-500">{subjectTitle}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate max-w-md">
                {mindmapFile.title || `الخريطة الذهنية - ${lectureTitle}`}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls (primarily for images or scaled preview) */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="تصغير (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-slate-700 dark:text-slate-300">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="تكبير (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="إعادة ضبط الحجم"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct Download Free Mindmap */}
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              title="تحميل الخريطة الذهنية مجاناً"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل مجاني 📥</span>
            </a>

            {/* Open in full external window */}
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="فتح في نافذة كاملة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto relative flex items-center justify-center p-2 sm:p-4">
          {embedUrl ? (
            isImage ? (
              <div
                className="transition-transform duration-150 ease-out origin-center max-w-full max-h-full flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={embedUrl}
                  alt={mindmapFile.title || 'الخريطة الذهنية للمحاضرة'}
                  className="rounded-2xl shadow-xl max-w-full max-h-[75vh] object-contain border border-slate-200 dark:border-slate-800"
                />
              </div>
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner bg-white dark:bg-slate-900"
                title="معاينة الخريطة الذهنية"
                allowFullScreen
              />
            )
          ) : (
            <div className="text-center p-8 space-y-3">
              <Network className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                تعذر تحميل رابط المعاينة المباشر
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Upsell Banner */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-400/40">
          <div className="flex items-center gap-2 text-center sm:text-right">
            <Sparkles className="w-5 h-5 text-yellow-200 flex-shrink-0" />
            <div>
              <span className="text-xs sm:text-sm font-black block">
                أعجبتك الخريطة الذهنية؟ افتح المحاضرة كاملة الآن! 🚀
              </span>
              <span className="text-[11px] text-amber-100 hidden sm:block">
                احصل على الشرح الكامل، سلايدات الباوربوينت، الريكوردات، وكروت الاستذكار بـ {price} ج.م فقط
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenPurchase) onOpenPurchase();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-amber-50 font-black text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>شراء وتفعيل المحاضرة ({price} ج.م) 💳</span>
          </button>
        </div>
      </div>
    </div>
  );
}
