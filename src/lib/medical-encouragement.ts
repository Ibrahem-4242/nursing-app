export interface MedicalTier {
  tierNumber: number;
  minPercent: number;
  maxPercent: number;
  headline: string;
  subtext: string;
  fullMessage: string;
  badge: string;
  emoji: string;
  theme: {
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    textLight: string;
    textDark: string;
    pillBg: string;
    pillText: string;
    gradientFrom: string;
    gradientTo: string;
    strokeGradient: [string, string];
    glowColor: string;
  };
  confetti?: boolean;
}

export const MEDICAL_TIERS: MedicalTier[] = [
  {
    tierNumber: 1,
    minPercent: 0,
    maxPercent: 10,
    headline: 'بداية الطريق خطوة!',
    subtext: 'طبيعي البدايات تكون صعبة، راجع المحاضرة مرة تانية والجيش الأبيض مبيستسلمش 🩺💪',
    fullMessage: 'بداية الطريق خطوة! طبيعي البدايات تكون صعبة، راجع المحاضرة مرة تانية والجيش الأبيض مبيستسلمش 🩺💪',
    badge: 'الشريحة 1: بداية الطريق 🩺',
    emoji: '🩺',
    theme: {
      bgLight: 'from-slate-50 via-sky-50/50 to-slate-100',
      bgDark: 'dark:from-slate-900/90 dark:via-sky-950/30 dark:to-slate-900',
      borderLight: 'border-slate-300',
      borderDark: 'dark:border-slate-700',
      textLight: 'text-slate-800',
      textDark: 'dark:text-slate-200',
      pillBg: 'bg-slate-200/80 dark:bg-slate-800',
      pillText: 'text-slate-700 dark:text-slate-300',
      gradientFrom: '#64748b',
      gradientTo: '#94a3b8',
      strokeGradient: ['#64748b', '#94a3b8'],
      glowColor: 'rgba(100, 116, 139, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 2,
    minPercent: 11,
    maxPercent: 20,
    headline: 'محاولة كويسة!',
    subtext: 'الذاكرة الطبية بتحتاج تكرار، راجع الكروت المنسية وهتشوف الفرق 🌿',
    fullMessage: 'محاولة كويسة! الذاكرة الطبية بتحتاج تكرار، راجع الكروت المنسية وهتشوف الفرق 🌿',
    badge: 'الشريحة 2: محاولة كويسة 🌿',
    emoji: '🌿',
    theme: {
      bgLight: 'from-sky-50 via-blue-50/40 to-slate-50',
      bgDark: 'dark:from-sky-950/40 dark:via-blue-950/30 dark:to-slate-900',
      borderLight: 'border-sky-300',
      borderDark: 'dark:border-sky-800',
      textLight: 'text-sky-900',
      textDark: 'dark:text-sky-200',
      pillBg: 'bg-sky-100 dark:bg-sky-950',
      pillText: 'text-sky-700 dark:text-sky-300',
      gradientFrom: '#0284c7',
      gradientTo: '#38bdf8',
      strokeGradient: ['#0284c7', '#38bdf8'],
      glowColor: 'rgba(56, 189, 248, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 3,
    minPercent: 21,
    maxPercent: 30,
    headline: 'خطوة للأمام!',
    subtext: 'بدأت تلم أطراف المحاضرة، كرر المراجعة بتركيز أكبر وهتثبت 📚',
    fullMessage: 'خطوة للأمام! بدأت تلم أطراف المحاضرة، كرر المراجعة بتركيز أكبر وهتثبت 📚',
    badge: 'الشريحة 3: خطوة للأمام 📚',
    emoji: '📚',
    theme: {
      bgLight: 'from-blue-50 via-indigo-50/40 to-sky-50',
      bgDark: 'dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900',
      borderLight: 'border-blue-300',
      borderDark: 'dark:border-blue-800',
      textLight: 'text-blue-900',
      textDark: 'dark:text-blue-200',
      pillBg: 'bg-blue-100 dark:bg-blue-950',
      pillText: 'text-blue-700 dark:text-blue-300',
      gradientFrom: '#2563eb',
      gradientTo: '#60a5fa',
      strokeGradient: ['#2563eb', '#60a5fa'],
      glowColor: 'rgba(37, 99, 235, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 4,
    minPercent: 31,
    maxPercent: 40,
    headline: 'أداء واعد!',
    subtext: 'كسرنا حاجز الصعوبة وبدأت المعلومات تستقر في الذاكرة طويلة المدى 🧠',
    fullMessage: 'أداء واعد! كسرنا حاجز الصعوبة وبدأت المعلومات تستقر في الذاكرة طويلة المدى 🧠',
    badge: 'الشريحة 4: أداء واعد 🧠',
    emoji: '🧠',
    theme: {
      bgLight: 'from-purple-50 via-violet-50/40 to-indigo-50',
      bgDark: 'dark:from-purple-950/40 dark:via-violet-950/30 dark:to-slate-900',
      borderLight: 'border-purple-300',
      borderDark: 'dark:border-purple-800',
      textLight: 'text-purple-900',
      textDark: 'dark:text-purple-200',
      pillBg: 'bg-purple-100 dark:bg-purple-950',
      pillText: 'text-purple-700 dark:text-purple-300',
      gradientFrom: '#7c3aed',
      gradientTo: '#a855f7',
      strokeGradient: ['#7c3aed', '#a855f7'],
      glowColor: 'rgba(124, 58, 237, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 5,
    minPercent: 41,
    maxPercent: 50,
    headline: 'نص المشوار خلص!',
    subtext: 'فهمك للمصطلحات بيزيد، شد حيلك في النصف التاني ⚡',
    fullMessage: 'نص المشوار خلص! فهمك للمصطلحات بيزيد، شد حيلك في النصف التاني ⚡',
    badge: 'الشريحة 5: نص المشوار ⚡',
    emoji: '⚡',
    theme: {
      bgLight: 'from-amber-50 via-yellow-50/40 to-orange-50',
      bgDark: 'dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-slate-900',
      borderLight: 'border-amber-300',
      borderDark: 'dark:border-amber-800',
      textLight: 'text-amber-900',
      textDark: 'dark:text-amber-200',
      pillBg: 'bg-amber-100 dark:bg-amber-950',
      pillText: 'text-amber-800 dark:text-amber-300',
      gradientFrom: '#d97706',
      gradientTo: '#f59e0b',
      strokeGradient: ['#d97706', '#f59e0b'],
      glowColor: 'rgba(217, 119, 6, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 6,
    minPercent: 51,
    maxPercent: 60,
    headline: 'مستوى جيد جداً!',
    subtext: 'عديت مرحلة الخطر وبقيت مسيطر على أغلب نقاط المحاضرة 🎯',
    fullMessage: 'مستوى جيد جداً! عديت مرحلة الخطر وبقيت مسيطر على أغلب نقاط المحاضرة 🎯',
    badge: 'الشريحة 6: مستوى جيد جداً 🎯',
    emoji: '🎯',
    theme: {
      bgLight: 'from-orange-50 via-amber-50/40 to-rose-50',
      bgDark: 'dark:from-orange-950/40 dark:via-amber-950/30 dark:to-slate-900',
      borderLight: 'border-orange-300',
      borderDark: 'dark:border-orange-800',
      textLight: 'text-orange-900',
      textDark: 'dark:text-orange-200',
      pillBg: 'bg-orange-100 dark:bg-orange-950',
      pillText: 'text-orange-800 dark:text-orange-300',
      gradientFrom: '#ea580c',
      gradientTo: '#f97316',
      strokeGradient: ['#ea580c', '#f97316'],
      glowColor: 'rgba(234, 88, 12, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 7,
    minPercent: 61,
    maxPercent: 70,
    headline: 'تمريض متميز!',
    subtext: 'متبقي لمسات بسيطة وتوصل لدرجة الإتقان الكامل 🩺✨',
    fullMessage: 'تمريض متميز! متبقي لمسات بسيطة وتوصل لدرجة الإتقان الكامل 🩺✨',
    badge: 'الشريحة 7: تمريض متميز 🩺✨',
    emoji: '🩺✨',
    theme: {
      bgLight: 'from-teal-50 via-emerald-50/40 to-cyan-50',
      bgDark: 'dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900',
      borderLight: 'border-teal-300',
      borderDark: 'dark:border-teal-800',
      textLight: 'text-teal-900',
      textDark: 'dark:text-teal-200',
      pillBg: 'bg-teal-100 dark:bg-teal-950',
      pillText: 'text-teal-800 dark:text-teal-300',
      gradientFrom: '#0f766e',
      gradientTo: '#14b8a6',
      strokeGradient: ['#0f766e', '#14b8a6'],
      glowColor: 'rgba(20, 184, 166, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 8,
    minPercent: 71,
    maxPercent: 80,
    headline: 'أداء بطولي رائع!',
    subtext: 'تمكنك من المعلومات قوي جداً ومستواك مشرف بجد 🌟👏',
    fullMessage: 'أداء بطولي رائع! تمكنك من المعلومات قوي جداً ومستواك مشرف بجد 🌟👏',
    badge: 'الشريحة 8: أداء بطولي 🌟👏',
    emoji: '🌟👏',
    theme: {
      bgLight: 'from-emerald-50 via-teal-50/40 to-green-50',
      bgDark: 'dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900',
      borderLight: 'border-emerald-300',
      borderDark: 'dark:border-emerald-800',
      textLight: 'text-emerald-900',
      textDark: 'dark:text-emerald-200',
      pillBg: 'bg-emerald-100 dark:bg-emerald-950',
      pillText: 'text-emerald-800 dark:text-emerald-300',
      gradientFrom: '#059669',
      gradientTo: '#10b981',
      strokeGradient: ['#059669', '#10b981'],
      glowColor: 'rgba(16, 185, 129, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 9,
    minPercent: 81,
    maxPercent: 90,
    headline: 'إبهار حقيقي وتفوق كاسح!',
    subtext: 'جاهز تماماً للامتحانات وبأعلى الدرجات 🔥🚀',
    fullMessage: 'إبهار حقيقي وتفوق كاسح! جاهز تماماً للامتحانات وبأعلى الدرجات 🔥🚀',
    badge: 'الشريحة 9: تفوق كاسح 🔥🚀',
    emoji: '🔥🚀',
    theme: {
      bgLight: 'from-rose-50 via-orange-50/40 to-amber-50',
      bgDark: 'dark:from-rose-950/40 dark:via-orange-950/30 dark:to-slate-900',
      borderLight: 'border-rose-300',
      borderDark: 'dark:border-rose-800',
      textLight: 'text-rose-900',
      textDark: 'dark:text-rose-200',
      pillBg: 'bg-rose-100 dark:bg-rose-950',
      pillText: 'text-rose-800 dark:text-rose-300',
      gradientFrom: '#e11d48',
      gradientTo: '#f43f5e',
      strokeGradient: ['#e11d48', '#f43f5e'],
      glowColor: 'rgba(225, 29, 72, 0.35)',
    },
    confetti: false,
  },
  {
    tierNumber: 10,
    minPercent: 91,
    maxPercent: 100,
    headline: 'أسطورة الجيش الأبيض!',
    subtext: 'إتقان بنسبة 100% وعلامة كاملة تليق بتمريض المستقبل 👑💯🎉',
    fullMessage: 'أسطورة الجيش الأبيض! إتقان بنسبة 100% وعلامة كاملة تليق بتمريض المستقبل 👑💯🎉',
    badge: 'الشريحة 10: أسطورة الجيش الأبيض 👑💯',
    emoji: '👑💯🎉',
    theme: {
      bgLight: 'from-amber-100/70 via-emerald-50/60 to-yellow-100/60',
      bgDark: 'dark:from-amber-950/50 dark:via-emerald-950/40 dark:to-yellow-950/30',
      borderLight: 'border-amber-400',
      borderDark: 'dark:border-amber-600',
      textLight: 'text-amber-950',
      textDark: 'dark:text-amber-100',
      pillBg: 'bg-amber-200/90 dark:bg-amber-900/60',
      pillText: 'text-amber-950 dark:text-amber-200',
      gradientFrom: '#d97706',
      gradientTo: '#10b981',
      strokeGradient: ['#f59e0b', '#10b981'],
      glowColor: 'rgba(245, 158, 11, 0.45)',
    },
    confetti: true,
  },
];

export function getMedicalTier(percent: number): MedicalTier {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  if (clamped <= 10) return MEDICAL_TIERS[0];
  if (clamped <= 20) return MEDICAL_TIERS[1];
  if (clamped <= 30) return MEDICAL_TIERS[2];
  if (clamped <= 40) return MEDICAL_TIERS[3];
  if (clamped <= 50) return MEDICAL_TIERS[4];
  if (clamped <= 60) return MEDICAL_TIERS[5];
  if (clamped <= 70) return MEDICAL_TIERS[6];
  if (clamped <= 80) return MEDICAL_TIERS[7];
  if (clamped <= 90) return MEDICAL_TIERS[8];
  return MEDICAL_TIERS[9];
}
