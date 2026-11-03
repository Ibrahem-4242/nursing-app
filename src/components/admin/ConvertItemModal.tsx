'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Layers,
  BookOpen,
  HelpCircle,
  Check,
  X,
  Loader2,
  ArrowRightLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Subject } from '@/lib/types';

export interface ConvertItemTarget {
  type: 'lecture' | 'quiz';
  id: string;
  title: string;
  currentSubjectId: string;
  currentSubjectTitle: string;
  currentSemester?: '1' | '2';
}

interface ConvertItemModalProps {
  isOpen: boolean;
  target: ConvertItemTarget | null;
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
  getAdminHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function ConvertItemModal({
  isOpen,
  target,
  subjects,
  onClose,
  onSuccess,
  getAdminHeaders,
}: ConvertItemModalProps) {
  const [activeMode, setActiveMode] = useState<'switch_category' | 'change_subject'>('switch_category');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>('1');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!target) return;
    setSelectedSubjectId(target.currentSubjectId || subjects[0]?.id || 'anatomy');
    setSelectedSemester(target.currentSemester === '2' ? '2' : '1');
    setCustomTitle(target.title || '');
    setActiveMode('switch_category');
  }, [target, subjects]);

  if (!isOpen || !target) return null;

  const isLecture = target.type === 'lecture';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let payload: any = {};

      if (activeMode === 'change_subject') {
        payload = {
          action: 'change-subject',
          itemType: target.type,
          itemId: target.id,
          targetSubjectId: selectedSubjectId,
          targetSemester: selectedSemester,
        };
      } else {
        // switch_category
        if (isLecture) {
          payload = {
            action: 'lecture-to-quiz',
            lectureId: target.id,
            targetSubjectId: selectedSubjectId,
            targetSemester: selectedSemester,
            title: customTitle.trim() || target.title,
          };
        } else {
          payload = {
            action: 'quiz-to-lecture',
            quizId: target.id,
            targetSubjectId: selectedSubjectId,
            targetSemester: selectedSemester,
            title: customTitle.trim() || target.title,
          };
        }
      }

      const res = await fetch('/api/admin/convert-item', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تنفيذ العملية بنجاح! 🚀');
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'فشل تنفيذ الإجراء');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <ArrowRightLeft className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-base">
                تغيير مادة أو فئة المحتوى 🔄
              </h3>
              <p className="text-xs text-teal-100 truncate max-w-xs">
                {target.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Current State Info Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>الفئة الحالية:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {isLecture ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                    <span>محاضرة عادية في المنهج</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>ملف في قسم أسئلة الكويزات</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>المادة الحالية:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {target.currentSubjectTitle} (سمستر {target.currentSemester || '1'})
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveMode('switch_category')}
              className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeMode === 'switch_category'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>تحويل الفئة {isLecture ? 'إلى كويز ❓' : 'إلى محاضرة 📚'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('change_subject')}
              className={`py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeMode === 'change_subject'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>نقل لمادة تانية 🩺</span>
            </button>
          </div>

          {/* Explanation Banner based on mode */}
          {activeMode === 'switch_category' ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-black text-xs block">
                {isLecture
                  ? '💡 سيتم تحويل المحاضرة إلى قسم أسئلة الكويزات:'
                  : '💡 سيتم تحويل الكويز إلى محاضرة رسمية كاملة:'}
              </span>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isLecture
                  ? 'سيتم نقل ملف الأسئلة، الشرح، الباوربوينت، الفيديوهات، الريكورد، والخرائط الذهنية إلى قسم بنك أسئلة الكويزات، وإزالتها من قسم المحاضرات العادية.'
                  : 'سيتم إنشاء محاضرة جديدة متكاملة برقم تسلسلي تحت المادة المحددة تضم كافة الملفات والمرفقات والفيديوهات، وإزالتها من قسم الكويزات.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
              <span className="font-bold text-[11px] block">
                سيتم نقل هذا المحتوى فوراً بجميع مرفقاته وفيديوهاته إلى المادة الجديدة التي تختارها بالأدنى.
              </span>
            </div>
          )}

          {/* Target Subject Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              المادة الدراسية المراد النقل إليها *:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.yearName || `الفرقة ${s.yearId}`})
                </option>
              ))}
            </select>
          </div>

          {/* Target Semester */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              الفصل الدراسي (الترم):
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="1">الترم الأول (سمستر 1)</option>
              <option value="2">الترم الثاني (سمستر 2)</option>
            </select>
          </div>

          {/* Optional Title Edit */}
          {activeMode === 'switch_category' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                تعديل العنوان بعد التحويل (اختياري):
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="عنوان المحتوى..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-bold transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-2.5 px-6 rounded-xl font-black text-white shadow-md transition flex items-center gap-2 disabled:opacity-50 ${
                activeMode === 'switch_category'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>
                {activeMode === 'switch_category'
                  ? isLecture
                    ? 'تحويل إلى قسم الكويزات فوراً ❓'
                    : 'تحويل إلى محاضرة رسمية فوراً 📚'
                  : 'نقل إلى المادة الجديدة الآن 🚀'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
