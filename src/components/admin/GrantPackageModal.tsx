'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  X,
  Loader2,
  BookOpen,
  Video,
  Headphones,
  HelpCircle,
  Brain,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  StudentUser,
  PlatformPackage,
  PackagePermissions,
  PackageContentType,
  Subject,
} from '@/lib/types';

interface GrantPackageModalProps {
  isOpen: boolean;
  student: StudentUser | null;
  packages: PlatformPackage[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: (updatedStudent?: StudentUser) => void;
  getAdminHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

const ALL_CONTENT_TYPES: { id: PackageContentType; label: string; icon: any }[] = [
  { id: 'pdf', label: 'مذكرات فلوسكاب والـ PDF 📄', icon: FileText },
  { id: 'video', label: 'فيديوهات الشرح بالذكاء الاصطناعي 🎬', icon: Video },
  { id: 'audio', label: 'التسجيلات الصوتية 🎧', icon: Headphones },
  { id: 'quiz', label: 'بنوك الأسئلة والكويزات ❓', icon: HelpCircle },
  { id: 'mindmap', label: 'الخرائط الذهنية 🧠', icon: Brain },
  { id: 'flashcards', label: 'كروت الاستذكار 🎴', icon: Sparkles },
];

export default function GrantPackageModal({
  isOpen,
  student,
  packages,
  subjects,
  onClose,
  onSuccess,
  getAdminHeaders,
}: GrantPackageModalProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('shakib-rakib');
  const [packageName, setPackageName] = useState<string>('باقة شاكب راكب الشاملة 🚀');
  const [durationAction, setDurationAction] = useState<'set_from_now' | 'extend_balance' | 'exact_date'>('set_from_now');
  const [days, setDays] = useState<number>(30);
  const [targetDate, setTargetDate] = useState<string>('');
  const [allSubjects, setAllSubjects] = useState<boolean>(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [yearId, setYearId] = useState<string>('all');
  const [semester, setSemester] = useState<'all' | '1' | '2'>('all');
  const [contentTypes, setContentTypes] = useState<PackageContentType[]>(['all']);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Normalize student current active subscription (activePackage or shakibRakibSubscription)
  const currentActiveSub = useMemo(() => {
    if (!student) return null;
    if (student.activePackage && student.activePackage.expiresAt) {
      return student.activePackage;
    }
    if (student.shakibRakibSubscription && student.shakibRakibSubscription.expiresAt) {
      return {
        packageId: 'shakib-rakib',
        packageName: student.shakibRakibSubscription.monthLabel || 'باقة شاكب راكب الشاملة 🚀',
        isActive: student.shakibRakibSubscription.isActive,
        startDate: student.shakibRakibSubscription.startDate,
        expiresAt: student.shakibRakibSubscription.expiresAt,
        yearId: student.shakibRakibSubscription.yearId,
        permissions: {
          allSubjects: true,
          subjectIds: [],
          yearId: student.shakibRakibSubscription.yearId,
          semesters: 'all' as any,
          contentTypes: ['all'] as any,
        },
      };
    }
    return null;
  }, [student]);

  const isCurrentSubActive = Boolean(
    currentActiveSub?.isActive && new Date(currentActiveSub.expiresAt).getTime() > Date.now()
  );

  // When student or packages change, initialize form
  useEffect(() => {
    if (!student) return;

    if (currentActiveSub) {
      setSelectedPackageId(currentActiveSub.packageId || 'custom');
      setPackageName(currentActiveSub.packageName || 'باقة مخصصة');
      setYearId(currentActiveSub.yearId || student.yearId || 'all');
      const perms = currentActiveSub.permissions || {};
      setAllSubjects(perms.allSubjects !== false);
      setSelectedSubjectIds(perms.subjectIds || []);
      setSemester((perms.semesters as any) || 'all');
      setContentTypes(
        Array.isArray(perms.contentTypes) && perms.contentTypes.length > 0 ? perms.contentTypes : ['all']
      );
      if (currentActiveSub.expiresAt) {
        setTargetDate(new Date(currentActiveSub.expiresAt).toISOString().split('T')[0]);
        const remDays = Math.max(1, Math.ceil((new Date(currentActiveSub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        setDays(remDays);
      }
      setDurationAction(isCurrentSubActive ? 'extend_balance' : 'set_from_now');
    } else {
      // Default to first active package or shakib-rakib
      const defaultPkg = packages.find((p) => p.isActive) || packages[0];
      if (defaultPkg) {
        applyPackageTemplate(defaultPkg);
      } else {
        setSelectedPackageId('shakib-rakib');
        setPackageName('باقة شاكب راكب الشاملة 🚀');
        setDays(30);
        setAllSubjects(true);
        setSelectedSubjectIds([]);
        setYearId(student.yearId || 'all');
        setSemester('all');
        setContentTypes(['all']);
      }
      setDurationAction('set_from_now');
    }
  }, [student, currentActiveSub, packages]);

  const applyPackageTemplate = (pkg: PlatformPackage) => {
    setSelectedPackageId(pkg.id);
    setPackageName(pkg.name);
    setDays(pkg.durationDays || 30);
    const perms = pkg.permissions || {};
    setAllSubjects(perms.allSubjects !== false);
    setSelectedSubjectIds(perms.subjectIds || []);
    setYearId(perms.yearId || student?.yearId || 'all');
    setSemester((perms.semesters as any) || 'all');
    setContentTypes(
      Array.isArray(perms.contentTypes) && perms.contentTypes.length > 0 ? perms.contentTypes : ['all']
    );
  };

  const handleSelectPackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (pkgId === 'custom') {
      setPackageName('باقة مخصصة للطالب ⚡️');
      return;
    }
    const found = packages.find((p) => p.id === pkgId);
    if (found) {
      applyPackageTemplate(found);
    }
  };

  const handleToggleContentType = (type: PackageContentType) => {
    if (type === 'all') {
      setContentTypes(['all']);
      return;
    }

    let next: PackageContentType[] = contentTypes.filter((t) => t !== 'all');
    if (next.includes(type)) {
      next = next.filter((t) => t !== type);
    } else {
      next.push(type);
    }

    if (next.length === 0 || next.length === ALL_CONTENT_TYPES.length) {
      next = ['all'];
    }
    setContentTypes(next);
  };

  const handleToggleSubject = (subId: string) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);
    try {
      const calculatedExpiresAt = previewExpiry ? previewExpiry.toISOString() : undefined;

      const payload = {
        studentId: student.id,
        action: 'grant',
        packageId: selectedPackageId,
        packageName: packageName.trim() || 'باقة دراسية 🚀',
        days: durationAction !== 'exact_date' ? days : undefined,
        calculationMode: durationAction,
        expiresAt: calculatedExpiresAt,
        yearId,
        permissions: {
          allSubjects,
          subjectIds: allSubjects ? [] : selectedSubjectIds,
          yearId,
          semesters: semester,
          contentTypes,
        },
        notes: notes.trim(),
      };

      const res = await fetch('/api/admin/students/shakib-rakib', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تفعيل وتخصيص الباقة للطالب بنجاح! 🚀');
        onSuccess(data.student);
        onClose();
      } else {
        alert(data.message || 'فشل تفعيل الباقة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!student) return;
    if (!confirm(`هل أنت متأكد من رغبتك في إيقاف وإلغاء الباقة للطالب "${student.name}" فوراً؟`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/students/shakib-rakib', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          studentId: student.id,
          action: 'revoke',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم إيقاف الاشتراك بنجاح ⏹️');
        if (student) {
          onSuccess({
            ...student,
            activePackage: student.activePackage ? { ...student.activePackage, isActive: false } : undefined,
            shakibRakibSubscription: student.shakibRakibSubscription ? { ...student.shakibRakibSubscription, isActive: false } : undefined,
          });
        } else {
          onSuccess();
        }
        onClose();
      } else {
        alert(data.message || 'تعذر إيقاف الاشتراك');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewExpiry = useMemo(() => {
    const now = Date.now();
    const existingExpiry =
      currentActiveSub?.isActive && currentActiveSub.expiresAt
        ? new Date(currentActiveSub.expiresAt).getTime()
        : 0;

    if (durationAction === 'exact_date') {
      if (!targetDate) return null;
      return new Date(`${targetDate}T23:59:59.999Z`);
    }

    const safeDays = Math.max(1, Number(days) || 1);
    if (durationAction === 'extend_balance' && existingExpiry > now) {
      return new Date(existingExpiry + safeDays * 24 * 60 * 60 * 1000);
    }
    return new Date(now + safeDays * 24 * 60 * 60 * 1000);
  }, [currentActiveSub, durationAction, days, targetDate]);

  const previewDaysLeft = useMemo(() => {
    if (!previewExpiry) return 0;
    const diff = previewExpiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [previewExpiry]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Crown className="w-5 h-5 text-yellow-200 fill-yellow-200" />
            </div>
            <div>
              <h3 className="font-black text-base">
                تفعيل وتخصيص باقة للطالب 🎓
              </h3>
              <p className="text-xs text-amber-100">
                {student.name} • {student.phone} • {student.university}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Current Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isCurrentSubActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <div>
              <span className="font-black block text-xs">
                {isCurrentSubActive
                  ? `اشتراك نشط: ${currentActiveSub?.packageName || 'باقة شاكب راكب'} 🟢`
                  : 'الطالب غير مشترك في أي باقة حالياً ⏹️'}
              </span>
              <span className="text-[11px] opacity-80">
                {isCurrentSubActive
                  ? `ينتهي في: ${new Date(currentActiveSub!.expiresAt).toLocaleDateString('ar-EG', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })} (متبقي ${Math.max(0, Math.ceil((new Date(currentActiveSub!.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} يوم)`
                  : 'اختر باقة لتفعيلها وتحديد مدتها وصلاحياتها بالكامل.'}
              </span>
            </div>

            {isCurrentSubActive && (
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isSubmitting}
                className="py-1 px-3 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold transition"
              >
                إلغاء الاشتراك فوراً ⏹️
              </button>
            )}
          </div>

          {/* 1. Choose Package Template */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اختر باقة من الباقات المعمولة (أو تخصيص حر):
            </label>
            <select
              value={selectedPackageId}
              onChange={(e) => handleSelectPackageChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.price} ج.م • {pkg.durationDays} يوم)
                </option>
              ))}
              <option value="custom">⚡️ باقة مخصصة بالكامل (تحديد الصلاحيات يدوياً)</option>
            </select>
          </div>

          {/* Package Name Display / Edit */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم الباقة في حساب الطالب:
            </label>
            <input
              type="text"
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="مثال: باقة شاكب راكب الشاملة / باقة الترم الأول"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            />
          </div>

          {/* 2. DURATION SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>تحديد مدة الاشتراك وطريقة الاحتساب:</span>
              </label>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDurationAction('set_from_now')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    durationAction === 'set_from_now' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title="تعديل وضبط المدة لتبدأ من الآن وتستمر لعدد الأيام المختار"
                >
                  تعيين من اليوم ⏱️
                </button>
                {isCurrentSubActive && (
                  <button
                    type="button"
                    onClick={() => setDurationAction('extend_balance')}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      durationAction === 'extend_balance' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title="إضافة الأيام فوق تاريخ الانتهاء الحالي للطالب دون إضاعة رصيده"
                  >
                    تمديد إضافي (+) 🔄
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDurationAction('exact_date')}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    durationAction === 'exact_date' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title="اختيار تاريخ انتهاء محدد باليوم والشهر والسنة"
                >
                  تاريخ محدد 📅
                </button>
              </div>
            </div>

            {durationAction !== 'exact_date' ? (
              <div className="space-y-2">
                {/* Mode indicator description */}
                <p className="text-[11px] text-slate-500 font-medium">
                  {durationAction === 'set_from_now'
                    ? '⚡️ سيتم احتساب المدة من اليوم وتنتهي بعد عدد الأيام المختار أدناه (استبدال / تعديل مدة الباقة بدقة).'
                    : '🔄 سيتم إضافة عدد الأيام المختار فوق الرصيد الحالي للطالب دون تصفير أيامه المتبقية.'}
                </p>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'أسبوع (7 أيام)', val: 7 },
                    { label: 'أسبوعين (15 يوم)', val: 15 },
                    { label: 'شهر (30 يوم)', val: 30 },
                    { label: 'ترم كامل (90 يوم)', val: 90 },
                    { label: '6 شهور (180 يوم)', val: 180 },
                    { label: 'سنة كاملة (365 يوم)', val: 365 },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setDays(chip.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        days === chip.val
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">عدد الأيام المطلوب:</span>
                  <input
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                    className="w-28 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-center text-sm"
                  />
                  <span className="text-slate-500 font-bold">يوم</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  اختر تاريخ الانتهاء الدقيق (ينتهي بنهاية هذا اليوم 23:59):
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>
            )}

            {/* Live Expiry Preview Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/80 dark:border-emerald-700/80 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">تاريخ الانتهاء الجديد الناتج:</span>
                <span className="font-black text-xs text-emerald-800 dark:text-emerald-200">
                  {previewExpiry
                    ? previewExpiry.toLocaleDateString('ar-EG', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-black text-[10px]">
                متبقي {previewDaysLeft} يوم
              </span>
            </div>
          </div>

          {/* 3. GRANULAR PERMISSIONS SECTION */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-4">
            <h5 className="font-black text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>صلاحيات الباقة لهذا الطالب:</span>
            </h5>

            {/* Year & Semester Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السنة الدراسية:
                </label>
                <select
                  value={yearId}
                  onChange={(e) => setYearId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="all">كل الفرق والسنوات الدراسية</option>
                  <option value="1">الفرقة الأولى فقط</option>
                  <option value="2">الفرقة الثانية فقط</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الفصل الدراسي (الترم):
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="all">الترمين معاً (1 و 2)</option>
                  <option value="1">الترم الأول فقط</option>
                  <option value="2">الترم الثاني فقط</option>
                </select>
              </div>
            </div>

            {/* Subjects Scope */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">المواد المصرح له بها:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllSubjects(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      allSubjects
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    كل المواد 📚
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllSubjects(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      !allSubjects
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    مواد معينة فقط 🩺
                  </button>
                </div>
              </div>

              {!allSubjects && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((s) => {
                    const checked = selectedSubjectIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border text-[11px] ${
                          checked
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 font-black text-amber-900 dark:text-amber-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 border-transparent text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleSubject(s.id)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{s.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Types */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">أنواع المحتوى المصرح بها:</label>
                <button
                  type="button"
                  onClick={() => handleToggleContentType('all')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black transition ${
                    contentTypes.includes('all')
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {contentTypes.includes('all') ? 'وصول شامل لكل المحتوى ⭐' : 'تحديد يدوي'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_CONTENT_TYPES.map((c) => {
                  const isChecked = contentTypes.includes('all') || contentTypes.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleContentType(c.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition ${
                        isChecked
                          ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 font-black text-amber-950 dark:text-amber-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                          isChecked ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات داخلية للإدارة (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم الدفع فودافون كاش / منحة دراسية / تجديد كويزات فقط..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          {/* Modal Footer Actions */}
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
              className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-300" />}
              <span>تفعيل الباقة للطالب الآن 🚀</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
