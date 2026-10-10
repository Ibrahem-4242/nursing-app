# 🚀 إعداد قاعدة بيانات والتخزين السحابي المجاني (Supabase Cloud Setup)

النظام يعمل تلقائياً وبشكل كامل محلياً وسحابياً دون أي إعداد إضافي. إذا أردت ربط حساب **Supabase** المجاني ليكون هو المخزن السحابي الأساسي، اتبع الخطوات السريعة التالية:

---

### 1. المتغيرات في ملف `.env.local` أو في إعدادات Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

### 2. إنشاء الجداول في Supabase SQL Editor:
انسخ والصق الكود التالي في تبويب **SQL Editor** داخل Supabase واضغط **Run**:

```sql
-- 1. جدول الإعلانات والتنبيهات
CREATE TABLE IF NOT EXISTS nursing_announcements (
  id TEXT PRIMARY KEY DEFAULT 'announcement-1',
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  link_text TEXT,
  link_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المحاضرات المرفوعة
CREATE TABLE IF NOT EXISTS nursing_lectures (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  subject_title TEXT NOT NULL,
  lecture_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  file_size TEXT,
  admin_note TEXT,
  overview TEXT,
  is_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول بلاغات الروابط المعطلة
CREATE TABLE IF NOT EXISTS nursing_broken_links (
  id TEXT PRIMARY KEY,
  lecture_id TEXT,
  lecture_title TEXT NOT NULL,
  subject_title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  user_note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول إحصائيات الزوار
CREATE TABLE IF NOT EXISTS nursing_analytics_visitors (
  id TEXT PRIMARY KEY,
  device_type TEXT,
  page TEXT,
  user_agent TEXT,
  date_str TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول إحصائيات التحميلات
CREATE TABLE IF NOT EXISTS nursing_analytics_downloads (
  id TEXT PRIMARY KEY,
  lecture_title TEXT,
  subject_title TEXT,
  file_type TEXT,
  file_name TEXT,
  date_str TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3. إنشاء حاوية التخزين للملفات (Storage Bucket):
1. اذهب إلى **Storage** في Supabase.
2. اضغط **New Bucket** باسم: `lecture-pdfs`.
3. اجعل الحاوية **Public Bucket** (لتسمح بتحميل الطلاب للـ PDFs بضغطة واحدة).

---

### 🩺 ميزات النظام الجاهزة:
- **العلامة المائية التلقائية (Automatic Watermark)**: تطبق باسم منصة ملخصات تمريض تلقائياً عند الرفع لحفظ الحقوق.
- **إشعارات تيليجرام اللحظية**: ترسل تنبيهات الزوار، التحميلات، والبلاغات فوراً.
- **التقرير اليومي**: يرسل تلقائياً نهاية كل يوم بإجمالي الزوار والتحميلات وتفاصيل كل محاضرة.
