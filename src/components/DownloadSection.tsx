'use client';

import React, { useState } from 'react';
import { LectureFile } from '@/lib/types';
import { FileText, Presentation, GitFork, Download, CheckCircle, ExternalLink, Info } from 'lucide-react';

interface DownloadSectionProps {
  files: LectureFile[];
  adminNote?: string;
  lectureTitle?: string;
}

export default function DownloadSection({ files, adminNote, lectureTitle }: DownloadSectionProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleDownload = (file: LectureFile) => {
    setDownloadingType(file.type);
    setTimeout(() => {
      setDownloadingType(null);
      // In real scenario, triggers download or opens URL
      alert(`بدأ تحميل ${file.title}`);
    }, 1000);
  };

  const getFileIcon = (type: LectureFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-600" />;
      case 'ppt':
        return <Presentation className="w-6 h-6 text-amber-600" />;
      case 'mindmap':
        return <GitFork className="w-6 h-6 text-indigo-600" />;
      default:
        return <FileText className="w-6 h-6 text-teal-600" />;
    }
  };

  const getBadgeColor = (type: LectureFile['type']) => {
    switch (type) {
      case 'pdf':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ppt':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'mindmap':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="w-full my-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-lg" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Download className="w-6 h-6" />
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
              تحميل الملفات والملخصات المعتمدة
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            جميع صيغ المحتوى جاهزة للطباعة والمذاكرة الرقمية
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
          جاهزة للتحميل الفوري
        </span>
      </div>

      {/* Admin Note Notice (like in Telegram bot) */}
      {adminNote && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">ملاحظة وتوجيهات إدارة القسم:</span>
            <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">{adminNote}</p>
          </div>
        </div>
      )}

      {/* Grid of File Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {files.map((file) => {
          const isCurrentLoading = downloadingType === file.type;

          return (
            <div
              key={file.type}
              className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-xl transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-teal-50/50 transition">
                    {getFileIcon(file.type)}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getBadgeColor(file.type)}`}>
                    {file.type.toUpperCase()}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-base leading-snug mb-2 group-hover:text-teal-700 transition">
                  {file.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>الحجم: {file.fileSize}</span>
                  {file.pageCount && <span>• {file.pageCount}</span>}
                </div>

                {file.customNote && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 leading-relaxed">
                    {file.customNote}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDownload(file)}
                disabled={isCurrentLoading}
                className={`w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm ${
                  isCurrentLoading
                    ? 'bg-emerald-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                }`}
              >
                {isCurrentLoading ? (
                  <>
                    <CheckCircle className="w-4 h-4 animate-bounce" />
                    <span>جارِ المعالجة...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تحميل الملف الآن</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
