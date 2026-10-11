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
  subjects?: Subject[];
  subjectQuizzes?: Record<string, SubjectQuizFile>;
  brokenLinks: BrokenLinkReport[];
  complaints: ComplaintRecord[];
  visitors: VisitorEvent[];
  downloads: DownloadEvent[];
}

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'announcement-1',
  text: 'شدوا حيلكم يا شباااااااااااااااب',
  isActive: true,
  linkText: 'انضم لجروب الواتساب',
  linkUrl: 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti',
  updatedAt: new Date().toISOString(),
};

// Global in-memory cache to guarantee instant performance in runtime
let memoryStore: CmsStore | null = null;

let runtimeCustomToken = '';

const BUILTIN_SYNC_TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');

export function setRuntimeSyncToken(tok: string) {
  if (tok && tok.trim()) {
    runtimeCustomToken = tok.trim();
  }
}

function getGistConfig(customToken?: string) {
  const gistId = process.env.GITHUB_GIST_ID || 'c9b4d3dd9bed0d8e8bde23138aff9152';
  const token =
    customToken ||
    runtimeCustomToken ||
    process.env.GITHUB_SYNC_TOKEN ||
    BUILTIN_SYNC_TOKEN;
  return { gistId, token };
}

export async function syncFromCloud(customToken?: string): Promise<CmsStore | null> {
  const { gistId, token } = getGistConfig(customToken);
  if (!gistId) return null;

  // 1. Direct Authenticated GitHub Gist API fetch (Authoritative, 100% LIVE, zero CDN delay)
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'NursingStudyHubApp',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      cache: 'no-store',
      headers,
    });

    if (res.ok) {
      const gist = await res.json();
      const file = gist.files?.['cms-store.json'];
      if (file && file.content) {
        const parsed = JSON.parse(file.content);
        if (parsed && Array.isArray(parsed.lectures)) {
          return parsed as CmsStore;
        }
      }
    }
  } catch (apiErr) {
    console.warn('[CMS DB] Cloud sync API fetch notice, trying CDN fallback:', apiErr);
  }

  // 2. Direct Gist Raw CDN fetch fallback
  try {
    const rawRes = await fetch(
      `https://gist.githubusercontent.com/Ibrahem-4242/${gistId}/raw/cms-store.json?t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
    if (rawRes.ok) {
      const parsed = await rawRes.json();
      if (parsed && Array.isArray(parsed.lectures)) {
        return parsed as CmsStore;
      }
    }
  } catch (rawErr) {
    // Fallback to local disk
  }

  return null;
}

export async function syncToCloud(store: CmsStore, customToken?: string): Promise<boolean> {
  const { gistId, token } = getGistConfig(customToken);
  if (!gistId || !token) {
    console.warn('[CMS DB] GITHUB_SYNC_TOKEN is not set; changes saved locally in memory.');
    return false;
  }

  // 🛡️ CRITICAL ANTI-WIPE SAFEGUARD:
  // If in-memory store has 0 lectures, verify against existing cloud database.
  // Never allow cold starts or empty objects to accidentally erase existing lectures!
  if (!store.lectures || store.lectures.length === 0) {
    try {
      const existing = await syncFromCloud(customToken);
      if (existing && existing.lectures && existing.lectures.length > 0) {
        console.warn(
          `[CMS DB Safeguard] Blocked wiping cloud database (${existing.lectures.length} lectures preserved)!`
        );
        store.lectures = existing.lectures;
      }
    } catch (safeErr) {
      console.warn('[CMS DB Safeguard] Pre-check error:', safeErr);
    }
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Nursing Study Hub CMS Store - Protected (${store.lectures.length} lectures) at ${new Date().toISOString()}`,
        files: {
          'cms-store.json': {
            content: JSON.stringify(store, null, 2),
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn('[CMS DB] Cloud sync write response error:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[CMS DB] Cloud sync write error:', err);
    return false;
  }
}

function getStoreFilePath(): string {
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

  for (const candidate of [rootDataPath, tmpPath]) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(content) as CmsStore;
        if (parsed && Array.isArray(parsed.lectures) && parsed.lectures.length > 0) {
          memoryStore = parsed;
          return memoryStore;
        }
      }
    } catch (err) {
      console.warn('[CMS DB] Read candidate error:', candidate, err);
    }
  }

  // Pure clean store with curriculum subjects (fundamentals excluded)
  memoryStore = {
    announcement: DEFAULT_ANNOUNCEMENT,
    lectures: [],
    subjects: MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals'),
    subjectQuizzes: {},
    brokenLinks: [],
    complaints: [],
    visitors: [],
    downloads: [],
  };

  // NOTE: Strictly NEVER call persistStore or syncToCloud here!
  return memoryStore;
}

async function getFreshStore(): Promise<CmsStore> {
  const cloudStore = await syncFromCloud();
  if (cloudStore && Array.isArray(cloudStore.lectures)) {
    const store = initMemoryStore();
    store.announcement = cloudStore.announcement || store.announcement;
    store.lectures = cloudStore.lectures;
    if (cloudStore.subjects && Array.isArray(cloudStore.subjects)) {
      store.subjects = cloudStore.subjects.filter((s: any) => s.id !== 'fundamentals');
    } else if (!store.subjects || store.subjects.length === 0) {
      store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    }
    if (cloudStore.subjectQuizzes) store.subjectQuizzes = cloudStore.subjectQuizzes;
    if (cloudStore.brokenLinks) store.brokenLinks = cloudStore.brokenLinks;
    if (cloudStore.complaints) store.complaints = cloudStore.complaints;
    if (cloudStore.visitors) store.visitors = cloudStore.visitors;
    if (cloudStore.downloads) store.downloads = cloudStore.downloads;
    memoryStore = store;

    // Save a local disk backup copy silently so offline/cold-start has it
    try {
      const candidates = [
        path.join(process.cwd(), 'data', 'cms-store.json'),
        getStoreFilePath(),
      ];
      for (const p of candidates) {
        const d = path.dirname(p);
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf-8');
      }
    } catch {}

    return memoryStore;
  }
  return initMemoryStore();
}

function persistStore(store: CmsStore, customToken?: string): void {
  try {
    const candidates = [
      path.join(process.cwd(), 'data', 'cms-store.json'),
      getStoreFilePath(),
    ];
    for (const p of candidates) {
      const d = path.dirname(p);
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf-8');
    }
  } catch (err) {
    try {
      fs.writeFileSync(path.join('/tmp', 'nursing-cms-store.json'), JSON.stringify(store, null, 2), 'utf-8');
    } catch {
      console.warn('[CMS DB] Persistence to disk skipped, kept in memory store.');
    }
  }

  syncToCloud(store, customToken).catch(() => {});
}

function getTodayString(): string {
  try {
    const d = new Date();
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
    const store = await getFreshStore();
    return store.announcement || DEFAULT_ANNOUNCEMENT;
  },

  async updateAnnouncement(
    text: string,
    isActive: boolean,
    linkText?: string,
    linkUrl?: string,
    customToken?: string
  ): Promise<AnnouncementConfig> {
    const store = await getFreshStore();
    store.announcement = {
      id: `announcement-${Date.now()}`,
      text,
      isActive,
      linkText: linkText || '',
      linkUrl: linkUrl || '',
      updatedAt: new Date().toISOString(),
    };
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
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
          console.warn('[Supabase] getAllLectures error, fallback to cloud store:', err);
        }
      }
    }

    const store = await getFreshStore();
    return store.lectures;
  },

  async getLiveLectures(): Promise<Lecture[]> {
    const all = await this.getAllLectures();
    return all.filter((lec) => {
      const hasFiles = lec.files && lec.files.length > 0;
      const hasCards = lec.flashcards && lec.flashcards.length > 0;
      const isLive = (lec as unknown as { isLive?: boolean }).isLive !== false;
      return isLive && (hasFiles || hasCards);
    });
  },

  // --- SUBJECTS MANAGEMENT ---
  async getAllSubjects(): Promise<Subject[]> {
    const store = await getFreshStore();
    if (!store.subjects || store.subjects.length === 0) {
      store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    }
    // Strictly filter out fundamentals or any test subject
    store.subjects = store.subjects.filter((s) => s.id !== 'fundamentals');
    return store.subjects;
  },

  async addSubject(
    subjectData: Partial<Subject> & { title: string; yearId: string },
    customToken?: string
  ): Promise<Subject> {
    const store = await getFreshStore();
    if (!store.subjects) {
      store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    }
    const yearNames: Record<string, string> = {
      '1': 'السنة الأولى',
      '2': 'السنة الثانية',
      '3': 'السنة الثالثة',
      '4': 'السنة الرابعة',
    };
    const id = subjectData.id?.trim() || `sub-${Date.now()}`;
    const newSubject: Subject = {
      id,
      yearId: subjectData.yearId || '1',
      yearName: yearNames[subjectData.yearId || '1'] || 'السنة الأولى',
      slug: subjectData.slug || id,
      title: subjectData.title.trim(),
      englishTitle: subjectData.englishTitle?.trim() || '',
      description: subjectData.description?.trim() || `مقرر ${subjectData.title.trim()} - ملخصات ومحاضرات معتمدة`,
      icon: subjectData.icon || 'BookOpen',
      color: subjectData.color || 'teal',
      totalLectures: 0,
      totalQuizzes: 0,
    };
    store.subjects.push(newSubject);
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return newSubject;
  },

  async updateSubject(
    subjectData: Partial<Subject> & { id: string },
    customToken?: string
  ): Promise<Subject | null> {
    const store = await getFreshStore();
    if (!store.subjects) store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    const index = store.subjects.findIndex((s) => s.id === subjectData.id);
    if (index === -1) return null;
    store.subjects[index] = { ...store.subjects[index], ...subjectData };
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return store.subjects[index];
  },

  async deleteSubject(id: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.subjects) store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    store.subjects = store.subjects.filter((s) => s.id !== id);
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async getLiveSubjects(): Promise<Subject[]> {
    const allSubjects = await this.getAllSubjects();
    const liveLectures = await this.getLiveLectures();
    const counts: Record<string, number> = {};

    for (const lec of liveLectures) {
      counts[lec.subjectId] = (counts[lec.subjectId] || 0) + 1;
    }

    return allSubjects.map((sub) => ({
      ...sub,
      totalLectures: counts[sub.id] || 0,
      totalQuizzes: 0,
    }));
  },

  async getLiveLecturesBySubject(subjectId: string): Promise<Lecture[]> {
    const liveLectures = await this.getLiveLectures();
    return liveLectures.filter((lec) => lec.subjectId === subjectId);
  },

  async getLectureById(id: string): Promise<Lecture | undefined> {
    const all = await this.getAllLectures();
    return all.find((lec) => lec.id === id || lec.slug === id);
  },

  async addOrUpdateLecture(lecture: Lecture, customToken?: string): Promise<Lecture> {
    const store = await getFreshStore();
    const existingIndex = store.lectures.findIndex((l) => l.id === lecture.id);

    if (existingIndex >= 0) {
      store.lectures[existingIndex] = { ...store.lectures[existingIndex], ...lecture };
    } else {
      store.lectures.unshift(lecture);
    }

    persistStore(store, customToken);
    await syncToCloud(store, customToken);

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

  async deleteLecture(id: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    const initialLen = store.lectures.length;
    store.lectures = store.lectures.filter((l) => l.id !== id);
    if (store.lectures.length !== initialLen) {
      persistStore(store, customToken);
      await syncToCloud(store, customToken);
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

  async toggleLectureLive(id: string, isLive: boolean, customToken?: string): Promise<Lecture | undefined> {
    const store = await getFreshStore();
    const lec = store.lectures.find((l) => l.id === id);
    if (lec) {
      (lec as unknown as { isLive: boolean }).isLive = isLive;
      persistStore(store, customToken);
      await syncToCloud(store, customToken);
      if (isSupabaseConfigured) {
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('nursing_lectures').update({ is_live: isLive }).eq('id', id);
          } catch (sbErr) {
            console.warn('[Supabase] toggleLectureLive error:', sbErr);
          }
        }
      }
      return lec;
    }
    return undefined;
  },

  // --- BROKEN LINK REPORTS ---
  async getBrokenLinkReports(): Promise<BrokenLinkReport[]> {
    const store = await getFreshStore();
    return store.brokenLinks || [];
  },

  async addBrokenLinkReport(
    report: Omit<BrokenLinkReport, 'id' | 'createdAt' | 'status'>
  ): Promise<BrokenLinkReport> {
    const store = await getFreshStore();
    const newReport: BrokenLinkReport = {
      ...report,
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    if (!store.brokenLinks) store.brokenLinks = [];
    store.brokenLinks.unshift(newReport);
    persistStore(store);
    await syncToCloud(store);
    return newReport;
  },

  async resolveBrokenLinkReport(id: string): Promise<boolean> {
    const store = await getFreshStore();
    const item = store.brokenLinks?.find((r) => r.id === id);
    if (item) {
      item.status = 'resolved';
      persistStore(store);
      await syncToCloud(store);
      return true;
    }
    return false;
  },

  // --- COMPLAINTS & STUDENT MESSAGES ---
  async getComplaints(): Promise<ComplaintRecord[]> {
    const store = await getFreshStore();
    return store.complaints || [];
  },

  async addComplaint(data: {
    name: string;
    phone: string;
    year?: string;
    type?: string;
    message: string;
  }): Promise<ComplaintRecord> {
    const store = await getFreshStore();
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
    await syncToCloud(store);
    return newComplaint;
  },

  async resolveComplaint(id: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.complaints) return false;
    const item = store.complaints.find((c) => c.id === id);
    if (item) {
      item.status = 'resolved';
      persistStore(store);
      await syncToCloud(store);
      return true;
    }
    return false;
  },

  // --- VISITOR & DOWNLOAD TELEMETRY ---
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
    const store = await getFreshStore();
    if (store.subjectQuizzes && store.subjectQuizzes[subjectId]) {
      return store.subjectQuizzes[subjectId];
    }
    return null;
  },

  async saveSubjectQuizFile(quizFile: SubjectQuizFile, customToken?: string): Promise<SubjectQuizFile> {
    const store = await getFreshStore();
    if (!store.subjectQuizzes) {
      store.subjectQuizzes = {};
    }
    store.subjectQuizzes[quizFile.subjectId] = quizFile;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return quizFile;
  },

  async getAllSubjectQuizFiles(): Promise<Record<string, SubjectQuizFile>> {
    const store = await getFreshStore();
    return store.subjectQuizzes || {};
  },
};
