'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Video,
  Headphones,
  HelpCircle,
  Brain,
  FileText,
  DollarSign,
  X,
  Check,
  Loader2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { PlatformPackage, PackagePermissions, PackageContentType, Subject } from '@/lib/types';

interface PackageManagementSectionProps {
  packages: PlatformPackage[];
  subjects: Subject[];
  isLoading: boolean;
  onRefresh: () => void;
  getAdminHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    badge: 'bg-amber-500 text-white',
  },
  teal: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-800',
    badge: 'bg-teal-600 text-white',
  },
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
    badge: 'bg-indigo-600 text-white',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
    badge: 'bg-purple-600 text-white',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
    badge: 'bg-emerald-600 text-white',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
    badge: 'bg-rose-600 text-white',
  },
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
    badge: 'bg-blue-600 text-white',
  },
};

const ALL_CONTENT_TYPES: { id: PackageContentType; label: string; icon: any }[] = [
  { id: 'pdf', label: 'مذكرات فلوسكاب والـ PDF 📄', icon: FileText },
  { id: 'video', label: 'فيديوهات الشرح بالذكاء الاصطناعي 🎬', icon: Video },
  { id: 'audio', label: 'التسجيلات الصوتية المركزة 🎧', icon: Headphones },
  { id: 'quiz', label: 'بنوك الأسئلة والكويزات ❓', icon: HelpCircle },
  { id: 'mindmap', label: 'الخرائط الذهنية 🧠', icon: Brain },
  { id: 'flashcards', label: 'كروت الاستذكار (Flashcards) 🎴', icon: Sparkles },
];

export default function PackageManagementSection({
  packages,
  subjects,
  isLoading,
  onRefresh,
  getAdminHeaders,
}: PackageManagementSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PlatformPackage | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formColor, setFormColor] = useState<string>('amber');
  const [formPrice, setFormPrice] = useState<number>(10);
  const [formDurationDays, setFormDurationDays] = useState<number>(30);
  const [formAllSubjects, setFormAllSubjects] = useState(true);
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([]);
  const [formYearId, setFormYearId] = useState<string>('all');
  const [formSemester, setFormSemester] = useState<'all' | '1' | '2'>('all');
  const [formContentTypes, setFormContentTypes] = useState<PackageContentType[]>(['all']);
  const [formIsActive, setFormIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormName('');
    setFormDescription('');
    setFormBadgeText('باقة جديدة ✨');
    setFormColor('amber');
    setFormPrice(15);
    setFormDurationDays(30);
    setFormAllSubjects(true);
    setFormSubjectIds([]);
    setFormYearId('all');
    setFormSemester('all');
    setFormContentTypes(['all']);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: PlatformPackage) => {
    setEditingPkg(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormBadgeText(pkg.badgeText || '');
    setFormColor(pkg.colorTheme || 'amber');
    setFormPrice(pkg.price);
    setFormDurationDays(pkg.durationDays);
    setFormAllSubjects(pkg.permissions.allSubjects !== false);
    setFormSubjectIds(pkg.permissions.subjectIds || []);
    setFormYearId(pkg.permissions.yearId || 'all');
    setFormSemester((pkg.permissions.semesters as any) || 'all');
    setFormContentTypes(
      Array.isArray(pkg.permissions.contentTypes) && pkg.permissions.contentTypes.length > 0
        ? pkg.permissions.contentTypes
        : ['all']
    );
    setFormIsActive(pkg.isActive !== false);
    setIsModalOpen(true);
  };

  const handleToggleContentType = (type: PackageContentType) => {
    if (type === 'all') {
      setFormContentTypes(['all']);
      return;
    }

    let next: PackageContentType[] = formContentTypes.filter((t) => t !== 'all');
    if (next.includes(type)) {
      next = next.filter((t) => t !== type);
    } else {
      next.push(type);
    }

    if (next.length === 0 || next.length === ALL_CONTENT_TYPES.length) {
      next = ['all'];
    }
    setFormContentTypes(next);
  };

  const handleToggleSubject = (subId: string) => {
    if (formSubjectIds.includes(subId)) {
      setFormSubjectIds(formSubjectIds.filter((id) => id !== subId));
    } else {
      setFormSubjectIds([...formSubjectIds, subId]);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('يرجى كتابة اسم الباقة أولاً');
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: Partial<PlatformPackage> = {
        id: editingPkg ? editingPkg.id : undefined,
        name: formName.trim(),
        description: formDescription.trim(),
        badgeText: formBadgeText.trim(),
        colorTheme: formColor as any,
        price: Number(formPrice) || 0,
        durationDays: Number(formDurationDays) || 30,
        isActive: formIsActive,
        permissions: {
          allSubjects: formAllSubjects,
          subjectIds: formAllSubjects ? [] : formSubjectIds,
          yearId: formYearId,
          semesters: formSemester,
          contentTypes: formContentTypes,
        },
      };

      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ package: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        onRefresh();
      } else {
        alert(data.message || 'فشل حفظ الباقة');
      }
    } catch (err: any) {
      alert('خطأ أثناء حفظ الباقة: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (pkg: PlatformPackage) => {
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'toggle',
          id: pkg.id,
          isActive: !pkg.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || 'تعذر تغيير حالة الباقة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    }
  };

  const handleDelete = async (pkg: PlatformPackage) => {
    if (!confirm(`هل أنت متأكد من حذف أو إلغاء باقة "${pkg.name}" نهائياً من المنصة؟`)) return;

    try {
      const res = await fetch(`/api/admin/packages?id=${encodeURIComponent(pkg.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || 'تعذر حذف الباقة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>باقات المنصة المعمولة والمخصصة 📦</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            أنشئ باقات جديدة، وحدد صلاحيات كل باقة (المواد، السعر، مدة الباقة، وأنواع المحتوى)، أو قم بتعطيل وإلغاء أي باقة بنقرة زر.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="py-2.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>➕ إنشاء باقة جديدة</span>
        </button>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          لا توجد باقات حالياً. اضغط على زر &quot;إنشاء باقة جديدة&quot; لإضافة أول باقة!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const color = COLOR_CLASSES[pkg.colorTheme || 'amber'] || COLOR_CLASSES.amber;
            const perms = pkg.permissions || {};
            const isAllContent = !perms.contentTypes || perms.contentTypes.includes('all');

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl p-5 border transition flex flex-col justify-between ${color.bg} ${color.border} relative overflow-hidden`}
              >
                <div className="space-y-3">
                  {/* Top Row: Badge + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${color.badge}`}>
                      {pkg.badgeText || 'باقة دراسية'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(pkg)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                        pkg.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {pkg.isActive !== false ? 'مفعلة 🟢' : 'معطلة 🔒'}
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h5 className="font-black text-sm text-slate-900 dark:text-white">{pkg.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {pkg.price} <span className="text-[10px]">ج.م</span>
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pkg.durationDays} يوم</span>
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {/* Permissions Summary Pills */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="font-bold">المواد المشمولة:</span>
                      <span className="font-black text-amber-700 dark:text-amber-400">
                        {perms.allSubjects !== false
                          ? 'جميع المواد 📚'
                          : `${perms.subjectIds?.length || 0} مواد مخصصة 🩺`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="font-bold">الفصل الدراسي:</span>
                      <span>
                        {perms.semesters === '1'
                          ? 'الترم الأول فقط'
                          : perms.semesters === '2'
                          ? 'الترم الثاني فقط'
                          : 'الترمين معاً'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="font-bold">صلاحيات المحتوى:</span>
                      <span className="font-bold text-[10px]">
                        {isAllContent ? 'وصول شامل لكل المحتوى ⭐' : `${perms.contentTypes?.length} أنواع محددة`}
                      </span>
                    </div>

                    {/* Content icons */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {isAllContent ? (
                        <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[10px] font-bold">
                          ملخصات + فيديوهات + كويزات + خرائط + ريكوردات + فلاش كاردز
                        </span>
                      ) : (
                        perms.contentTypes?.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[10px] font-bold"
                          >
                            {t === 'pdf'
                              ? '📄 مذكرات'
                              : t === 'video'
                              ? '🎬 فيديو'
                              : t === 'audio'
                              ? '🎧 صوت'
                              : t === 'quiz'
                              ? '❓ كويزات'
                              : t === 'mindmap'
                              ? '🧠 خرائط'
                              : '🎴 كروت'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Bottom */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => openEditModal(pkg)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                    title="تعديل بيانات وصلاحيات الباقة"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(pkg)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900 transition flex items-center gap-1"
                    title="حذف أو إلغاء الباقة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Package */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {editingPkg ? `تعديل باقة "${editingPkg.name}" ✏️` : 'إنشاء باقة دراسية جديدة ➕'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    حدد تفاصيل الباقة، السعر، المدة الافتراضية، والصلاحيات والمواد المتاحة بدقة.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePackage} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Row 1: Name & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الباقة *:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: باقة الترم الأول الشاملة / باقة الكويزات"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شارة الباقة (Badge Text):
                  </label>
                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    placeholder="مثال: VIP 👑 / الأكثر طلباً ⭐ / مادة واحدة"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Price, Duration, Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السعر الافتراضي (ج.م) *:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المدة الافتراضية (بالأيام) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    لون الباقة المميز:
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="amber">ذهبي (Amber)</option>
                    <option value="teal">فيروزي (Teal)</option>
                    <option value="indigo">نيلي (Indigo)</option>
                    <option value="purple">بنفسجي (Purple)</option>
                    <option value="emerald">زمردي (Emerald)</option>
                    <option value="rose">وردي (Rose)</option>
                    <option value="blue">أزرق (Blue)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف الباقة ومميزاتها للطلاب:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="اكتب وصفاً موجزاً يوضح ما يحصل عليه الطالب عند تفعيل هذه الباقة..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* PERMISSIONS SECTION */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-4">
                <h5 className="font-black text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>تحديد صلاحيات ومحتوى الباقة بدقة:</span>
                </h5>

                {/* Year & Semester Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      السنة الدراسية المشمولة:
                    </label>
                    <select
                      value={formYearId}
                      onChange={(e) => setFormYearId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="all">جميع السنوات والفرق الدراسية 🎓</option>
                      <option value="1">الفرقة الأولى (سنة أولى)</option>
                      <option value="2">الفرقة الثانية (سنة ثانية)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الفصل الدراسي (الترم):
                    </label>
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="all">الترمين معاً (ترم أول + ترم ثاني) 📚</option>
                      <option value="1">الترم الأول فقط (سمستر 1)</option>
                      <option value="2">الترم الثاني فقط (سمستر 2)</option>
                    </select>
                  </div>
                </div>

                {/* Subjects Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">نطاق المواد المفتوحة:</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormAllSubjects(true)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                          formAllSubjects
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        كل المواد المتاحة 📚
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAllSubjects(false)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                          !formAllSubjects
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        مواد محددة فقط 🩺
                      </button>
                    </div>
                  </div>

                  {!formAllSubjects && (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {subjects.map((s) => {
                        const checked = formSubjectIds.includes(s.id);
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

                {/* Content Types Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      أنواع المحتوى المصرح بالوصول إليها:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleToggleContentType('all')}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black transition ${
                        formContentTypes.includes('all')
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formContentTypes.includes('all') ? 'وصول شامل لكل المحتوى ⭐' : 'تحديد يدوي'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_CONTENT_TYPES.map((c) => {
                      const isChecked = formContentTypes.includes('all') || formContentTypes.includes(c.id);
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

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">حالة تفعيل الباقة:</span>
                  <span className="text-[11px] text-slate-500">
                    الباقات المفعلة تظهر كخيارات متاحة للاشتراك والتفعيل للطلاب.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-4 py-1.5 rounded-full font-black text-xs transition ${
                    formIsActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                  }`}
                >
                  {formIsActive ? 'مفعلة 🟢' : 'معطلة 🔒'}
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-bold transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingPkg ? 'حفظ التعديلات 🚀' : 'إنشاء الباقة فوراً 🚀'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
