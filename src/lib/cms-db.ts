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
} from './types';
import { MOCK_LECTURES, MOCK_SUBJECTS } from './mock-data';

interface CmsStore {
  announcement: AnnouncementConfig;
  lectures: Lecture[];
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

function getStoreFilePath(): string {
  // Use /tmp in serverless (e.g. Vercel) if working directory is read-only, otherwise data/
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

  const filePath = getStoreFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as CmsStore;
      if (parsed && Array.isArray(parsed.lectures)) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[CMS DB] Failed to read store file, falling back to seed data:', err);
  }

  // Seed with mock data
  memoryStore = {
    announcement: DEFAULT_ANNOUNCEMENT,
    lectures: [...MOCK_LECTURES],
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
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[CMS DB] Failed to persist store to disk:', err);
  }
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
    const store = initMemoryStore();
    return store.lectures;
  },

  /**
   * Returns only lectures that are live AND have active content/files
   */
  async getLiveLectures(): Promise<Lecture[]> {
    const store = initMemoryStore();
    return store.lectures.filter((lec) => {
      // Must have at least 1 downloadable file or flashcards
      const hasFiles = lec.files && lec.files.length > 0;
      const hasCards = lec.flashcards && lec.flashcards.length > 0;
      const isLive = (lec as unknown as { isLive?: boolean }).isLive !== false;
      return isLive && (hasFiles || hasCards);
    });
  },

  /**
   * Returns live subjects that have at least 1 live lecture with content
   * (الزائر العادي يرى فقط المواد والمحاضرات التي تحتوي على ملفات ومحتوى فعلي)
   */
  async getLiveSubjects(): Promise<Subject[]> {
    const liveLectures = await this.getLiveLectures();
    const activeSubjectIds = new Set(liveLectures.map((l) => l.subjectId));

    return MOCK_SUBJECTS.filter((sub) => activeSubjectIds.has(sub.id)).map((sub) => {
      const subjectLectures = liveLectures.filter((l) => l.subjectId === sub.id);
      return {
        ...sub,
        totalLectures: subjectLectures.length,
      };
    });
  },

  async getLiveLecturesBySubject(subjectId: string): Promise<Lecture[]> {
    const liveLectures = await this.getLiveLectures();
    return liveLectures.filter((lec) => lec.subjectId === subjectId);
  },

  async getLectureById(id: string): Promise<Lecture | undefined> {
    const store = initMemoryStore();
    return store.lectures.find((lec) => lec.id === id || lec.slug === id);
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
    return lecture;
  },

  async deleteLecture(id: string): Promise<boolean> {
    const store = initMemoryStore();
    const initialLen = store.lectures.length;
    store.lectures = store.lectures.filter((l) => l.id !== id);
    if (store.lectures.length !== initialLen) {
      persistStore(store);
      return true;
    }
    return false;
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
};
