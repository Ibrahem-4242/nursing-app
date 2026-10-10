import fs from 'fs';
import path from 'path';
import {
  Lecture,
  Subject,
  AnnouncementConfig,
  BrokenLinkReport,
  ComplaintRecord,
  VisitorEvent,
  DownloadEvent,
  SubjectQuizFile,
} from './types';
import { MOCK_SUBJECTS } from './mock-data';
import { getSupabase, isSupabaseConfigured } from './supabase';

interface CmsStore {
  announcement: AnnouncementConfig;
  lectures: Lecture[];
  subjectQuizzes?: Record<string, SubjectQuizFile>;
  brokenLinks: BrokenLinkReport[];
  complaints: ComplaintRecord[];
  visitors: VisitorEvent[];
  downloads: DownloadEvent[];
}

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'announcement-1',
  text: '📢 مرحباً بكم في منصة ملخصات تمريض! تم رفع وتحديث ملخصات الفرقة الأولى المعتمدة بالكامل 🩺',
  isActive: true,
  linkText: 'انضم لجروب الواتساب',
  linkUrl: 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti',
  updatedAt: new Date().toISOString(),
};

// Global in-memory cache to guarantee instant updates in runtime
let memoryStore: CmsStore | null = null;
const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a12675d818365e';

export async function syncFromCloud(): Promise<CmsStore | null> {
  try {
    const res = await fetch(CLOUD_SYNC_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.lectures)) {
        return json.data as CmsStore;
      }
    }
  } catch (err) {
    console.warn('[CMS DB] Cloud read error:', err);
  }
  return null;
}

export async function syncToCloud(store: CmsStore): Promise<void> {
  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'nursing-cms-production', data: store }),
    });
  } catch (err) {
    console.warn('[CMS DB] Cloud write error:', err);
  }
}

function getStoreFilePath(): string {
  // On Vercel or serverless environments, prioritize /tmp immediately
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'nursing-cms-store.json');
  }

  const localDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'cms-store.json');
  } catch {
    return path.join('/tmp', 'nursing-cms-store.json');
  }
}

function initMemoryStore(): CmsStore {
  if (memoryStore) return memoryStore;

  const tmpPath = getStoreFilePath();
  const rootDataPath = path.join(process.cwd(), 'data', 'cms-store.json');

  for (const candidate of [tmpPath, rootDataPath]) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(content) as CmsStore;
        if (parsed && Array.isArray(parsed.lectures)) {
          memoryStore = parsed;
          return memoryStore;
        }
      }
    } catch (err) {
      console.warn('[CMS DB] Read candidate error:', candidate, err);
    }
  }

  // Pure clean store without test data
  memoryStore = {
    announcement: DEFAULT_ANNOUNCEMENT,
    lectures: [],
    subjectQuizzes: {},
    brokenLinks: [],
    complaints: [],
    visitors: [],
    downloads: [],
  };

  persistStore(memoryStore);
  return memoryStore;
}

function persistStore(store: CmsStore): void {
  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {}
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    try {
      fs.writeFileSync(path.join('/tmp', 'nursing-cms-store.json'), JSON.stringify(store, null, 2), 'utf-8');
    } catch {
      console.warn('[CMS DB] Persistence to disk skipped, kept in memory store.');
    }
  }

  // Background sync to cloud storage
  syncToCloud(store).catch(() => {});
}

function getTodayString(): string {
  try {
    const d = new Date();
    // format as YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export const CmsService = {
  // --- ANNOUNCEMENT ---
  async getAnnouncement(): Promise<AnnouncementConfig> {
    const store = initMemoryStore();
    return store.announcement || DEFAULT_ANNOUNCEMENT;
  },

  async updateAnnouncement(
    text: string,
    isActive: boolean,
    linkText?: string,
    linkUrl?: string
  ): Promise<AnnouncementConfig> {
    const store = initMemoryStore();
    store.announcement = {
      id: 'announcement-1',
      text,
      isActive,
      linkText: linkText || '',
      linkUrl: linkUrl || '',
      updatedAt: new Date().toISOString(),
    };
    persistStore(store);
    return store.announcement;
  },

  // --- LECTURES & CONTENT ---
  async getAllLectures(): Promise<Lecture[]> {
    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('nursing_lectures')
            .select('*')
            .order('lecture_number', { ascending: true });

          if (!error && data && data.length > 0) {
            return data.map((row: any) => {
              if (row.raw_data && typeof row.raw_data === 'object') {
                return row.raw_data as Lecture;
              }
              return {
                id: row.id,
                subjectId: row.subject_id,
                yearId: '1',
                subjectTitle: row.subject_title,
                yearTitle: 'السنة الأولى',
                slug: row.slug || row.id,
                lectureNumber: row.lecture_number,
                title: row.title,
                subtitle: `شرح وملخص معتمد لمادة ${row.subject_title}`,
                isFree: true,
                price: 0,
                viewCount: 1,
                readingMinutes: 10,
                overview: row.overview || '',
                concepts: [],
                terminology: [],
                interventions: [],
                clinicalPearls: [],
                flashcards: [],
                quiz: [],
                files: [
                  {
                    type: 'pdf',
                    title: row.title,
                    downloadUrl: row.pdf_url,
                    fileSize: row.file_size || '3.5 MB',
                    updatedAt: 'معتمد',
                  },
                ],
                adminNote: row.admin_note || '',
              } as Lecture;
            });
          }
        } catch (err) {
          console.warn('[Supabase] getAllLectures error, fallback to local store:', err);
        }
      }
    }

    // Check cloud sync store (guarantees cross-instance persistence on Vercel)
    const cloudStore = await syncFromCloud();
    if (cloudStore && Array.isArray(cloudStore.lectures)) {
      const store = initMemoryStore();
      store.lectures = cloudStore.lectures;
      if (cloudStore.subjectQuizzes) store.subjectQuizzes = cloudStore.subjectQuizzes;
      if (cloudStore.announcement) store.announcement = cloudStore.announcement;
      return store.lectures;
    }

    const store = initMemoryStore();
    return store.lectures;
  },

  /**
   * Returns only lectures that are live AND have active content/files
   */
  async getLiveLectures(): Promise<Lecture[]> {
    const all = await this.getAllLectures();
    return all.filter((lec) => {
      // Must have at least 1 downloadable file or flashcards
      const hasFiles = lec.files && lec.files.length > 0;
      const hasCards = lec.flashcards && lec.flashcards.length > 0;
      const isLive = (lec as unknown as { isLive?: boolean }).isLive !== false;
      return isLive && (hasFiles || hasCards);
    });
  },

  /**
   * Returns live subjects that have at least 1 live lecture with content
   * (الزائر العادي يرى فقط المواد والمحاضرات التي تحتوي على ملفات ومحتوى فعلي تم رفعه)
   */
  async getLiveSubjects(): Promise<Subject[]> {
    const liveLectures = await this.getLiveLectures();
    if (!liveLectures || liveLectures.length === 0) {
      return [];
    }

    const subjectsMap = new Map<string, Subject>();

    for (const lec of liveLectures) {
      const subId = lec.subjectId;
      if (!subjectsMap.has(subId)) {
        const mockMatch = MOCK_SUBJECTS.find((m) => m.id === subId);
        const title = lec.subjectTitle || mockMatch?.title || subId;
        const yearId = lec.yearId || mockMatch?.yearId || '1';
        const yearName = lec.yearTitle || mockMatch?.yearName || (yearId === '1' ? 'السنة الأولى' : yearId === '2' ? 'السنة الثانية' : yearId === '3' ? 'السنة الثالثة' : 'السنة الرابعة');

        subjectsMap.set(subId, {
          id: subId,
          yearId,
          yearName,
          slug: mockMatch?.slug || subId,
          title,
          englishTitle: mockMatch?.englishTitle || title,
          code: mockMatch?.code || subId.toUpperCase().slice(0, 7),
          description: mockMatch?.description || `مقرر ${title} - ملخصات ومحاضرات معتمدة`,
          icon: mockMatch?.icon || 'Activity',
          color: mockMatch?.color || 'teal',
          totalLectures: 0,
          totalQuizzes: 0,
        });
      }
      const existing = subjectsMap.get(subId)!;
      existing.totalLectures += 1;
    }

    return Array.from(subjectsMap.values());
  },

  async getLiveLecturesBySubject(subjectId: string): Promise<Lecture[]> {
    const liveLectures = await this.getLiveLectures();
    return liveLectures.filter((lec) => lec.subjectId === subjectId);
  },

  async getLectureById(id: string): Promise<Lecture | undefined> {
    const all = await this.getAllLectures();
    return all.find((lec) => lec.id === id || lec.slug === id);
  },

  async addOrUpdateLecture(lecture: Lecture): Promise<Lecture> {
    const store = initMemoryStore();
    const existingIndex = store.lectures.findIndex((l) => l.id === lecture.id);

    if (existingIndex >= 0) {
      store.lectures[existingIndex] = { ...store.lectures[existingIndex], ...lecture };
    } else {
      store.lectures.unshift(lecture);
    }

    persistStore(store);
    await syncToCloud(store);

    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const pdfUrl = lecture.files?.[0]?.downloadUrl || '';
          const fileSize = lecture.files?.[0]?.fileSize || '';
          await supabase.from('nursing_lectures').upsert({
            id: lecture.id,
            subject_id: lecture.subjectId,
            subject_title: lecture.subjectTitle,
            lecture_number: lecture.lectureNumber,
            title: lecture.title,
            slug: lecture.slug || lecture.id,
            pdf_url: pdfUrl,
            file_size: fileSize,
            admin_note: lecture.adminNote || '',
            overview: lecture.overview || '',
            is_live: true,
            raw_data: lecture,
          });
        } catch (sbErr) {
          console.warn('[Supabase] addOrUpdateLecture error:', sbErr);
        }
      }
    }

    return lecture;
  },

  async deleteLecture(id: string): Promise<boolean> {
    const store = initMemoryStore();
    const initialLen = store.lectures.length;
    store.lectures = store.lectures.filter((l) => l.id !== id);
    if (store.lectures.length !== initialLen) {
      persistStore(store);
      await syncToCloud(store);
    }

    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('nursing_lectures').delete().eq('id', id);
        } catch (sbErr) {
          console.warn('[Supabase] deleteLecture error:', sbErr);
        }
      }
    }

    return true;
  },

  async toggleLectureLive(id: string, isLive: boolean): Promise<Lecture | undefined> {
    const store = initMemoryStore();
    const lec = store.lectures.find((l) => l.id === id);
    if (lec) {
      (lec as unknown as { isLive: boolean }).isLive = isLive;
      persistStore(store);
      return lec;
    }
    return undefined;
  },

  // --- BROKEN LINK REPORTS ---
  async getBrokenLinkReports(): Promise<BrokenLinkReport[]> {
    const store = initMemoryStore();
    return store.brokenLinks || [];
  },

  async addBrokenLinkReport(
    report: Omit<BrokenLinkReport, 'id' | 'createdAt' | 'status'>
  ): Promise<BrokenLinkReport> {
    const store = initMemoryStore();
    const newReport: BrokenLinkReport = {
      ...report,
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    if (!store.brokenLinks) store.brokenLinks = [];
    store.brokenLinks.unshift(newReport);
    persistStore(store);
    return newReport;
  },

  async resolveBrokenLinkReport(id: string): Promise<boolean> {
    const store = initMemoryStore();
    const item = store.brokenLinks?.find((r) => r.id === id);
    if (item) {
      item.status = 'resolved';
      persistStore(store);
      return true;
    }
    return false;
  },

  // --- COMPLAINTS & STUDENT MESSAGES ---
  async getComplaints(): Promise<ComplaintRecord[]> {
    const store = initMemoryStore();
    return store.complaints || [];
  },

  async addComplaint(data: {
    name: string;
    phone: string;
    year?: string;
    type?: string;
    message: string;
  }): Promise<ComplaintRecord> {
    const store = initMemoryStore();
    const newComplaint: ComplaintRecord = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      phone: data.phone,
      year: data.year,
      type: data.type,
      message: data.message,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    if (!store.complaints) store.complaints = [];
    store.complaints.unshift(newComplaint);
    persistStore(store);
    return newComplaint;
  },

  async resolveComplaint(id: string): Promise<boolean> {
    const store = initMemoryStore();
    if (!store.complaints) return false;
    const item = store.complaints.find((c) => c.id === id);
    if (item) {
      item.status = 'resolved';
      persistStore(store);
      return true;
    }
    return false;
  },

  // --- VISITOR & DOWNLOAD ANALYTICS ---
  async trackVisitor(event: Omit<VisitorEvent, 'id' | 'timestamp' | 'dateStr'>): Promise<void> {
    const store = initMemoryStore();
    const newEvent: VisitorEvent = {
      ...event,
      id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: getTodayString(),
    };
    if (!store.visitors) store.visitors = [];
    store.visitors.push(newEvent);
    // Keep last 5,000 events to manage storage cleanly
    if (store.visitors.length > 5000) store.visitors = store.visitors.slice(-5000);
    persistStore(store);
  },

  async trackDownload(event: Omit<DownloadEvent, 'id' | 'timestamp' | 'dateStr'>): Promise<void> {
    const store = initMemoryStore();
    const newEvent: DownloadEvent = {
      ...event,
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: getTodayString(),
    };
    if (!store.downloads) store.downloads = [];
    store.downloads.push(newEvent);
    if (store.downloads.length > 5000) store.downloads = store.downloads.slice(-5000);
    persistStore(store);
  },

  async getTodayAnalytics(): Promise<{
    date: string;
    visitors: number;
    downloads: number;
    breakdown: Array<{ subjectTitle: string; lectureTitle: string; downloads: number }>;
  }> {
    const store = initMemoryStore();
    const today = getTodayString();

    const todayVisitors = (store.visitors || []).filter((v) => v.dateStr === today);
    const todayDownloads = (store.downloads || []).filter((d) => d.dateStr === today);

    // Group downloads by lecture
    const breakdownMap: Record<string, { subjectTitle: string; lectureTitle: string; count: number }> = {};
    for (const dl of todayDownloads) {
      const key = `${dl.subjectTitle}:::${dl.lectureTitle}`;
      if (!breakdownMap[key]) {
        breakdownMap[key] = {
          subjectTitle: dl.subjectTitle,
          lectureTitle: dl.lectureTitle,
          count: 0,
        };
      }
      breakdownMap[key].count++;
    }

    const breakdown = Object.values(breakdownMap).map((item) => ({
      subjectTitle: item.subjectTitle,
      lectureTitle: item.lectureTitle,
      downloads: item.count,
    }));

    return {
      date: today,
      visitors: todayVisitors.length,
      downloads: todayDownloads.length,
      breakdown,
    };
  },

  async getSummaryStats(): Promise<{
    totalVisitors: number;
    todayVisitors: number;
    totalDownloads: number;
    todayDownloads: number;
    totalLectures: number;
    pendingReports: number;
  }> {
    const store = initMemoryStore();
    const today = getTodayString();

    const todayVisitors = (store.visitors || []).filter((v) => v.dateStr === today).length;
    const todayDownloads = (store.downloads || []).filter((d) => d.dateStr === today).length;
    const pendingReports = (store.brokenLinks || []).filter((r) => r.status === 'pending').length;

    return {
      totalVisitors: (store.visitors || []).length,
      todayVisitors,
      totalDownloads: (store.downloads || []).length,
      todayDownloads,
      totalLectures: store.lectures.length,
      pendingReports,
    };
  },

  // --- SUBJECT QUIZZES (اسئلة الكويزات المجمعة) ---
  async getSubjectQuizFile(subjectId: string): Promise<SubjectQuizFile | null> {
    const cloudStore = await syncFromCloud();
    if (cloudStore && cloudStore.subjectQuizzes && cloudStore.subjectQuizzes[subjectId]) {
      return cloudStore.subjectQuizzes[subjectId];
    }

    const store = initMemoryStore();
    if (store.subjectQuizzes && store.subjectQuizzes[subjectId]) {
      return store.subjectQuizzes[subjectId];
    }

    return null;
  },

  async saveSubjectQuizFile(quizFile: SubjectQuizFile): Promise<SubjectQuizFile> {
    const store = initMemoryStore();
    if (!store.subjectQuizzes) {
      store.subjectQuizzes = {};
    }
    store.subjectQuizzes[quizFile.subjectId] = quizFile;
    persistStore(store);
    await syncToCloud(store);
    return quizFile;
  },

  async getAllSubjectQuizFiles(): Promise<Record<string, SubjectQuizFile>> {
    const cloudStore = await syncFromCloud();
    if (cloudStore && cloudStore.subjectQuizzes) {
      return cloudStore.subjectQuizzes;
    }
    const store = initMemoryStore();
    return store.subjectQuizzes || {};
  },
};
