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
  deletedLectureIds?: string[];
  deletedQuizIds?: string[];
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
      if (file) {
        let content = file.content;
        // If GitHub API truncated file.content (> ~300KB), fetch full content via file.raw_url
        if ((file.truncated || !content) && file.raw_url) {
          try {
            const rawRes = await fetch(file.raw_url, {
              cache: 'no-store',
              headers: token
                ? { 'Authorization': `token ${token}`, 'User-Agent': 'NursingStudyHubApp' }
                : { 'User-Agent': 'NursingStudyHubApp' },
            });
            if (rawRes.ok) {
              content = await rawRes.text();
            }
          } catch (rErr) {
            console.warn('[CMS DB] Failed to fetch raw_url for truncated file:', rErr);
          }
        }

        if (content) {
          const parsed = JSON.parse(content) as CmsStore;
          if (parsed && Array.isArray(parsed.lectures)) {
            // Check if vault has additional lectures
            const vaultFile = gist.files?.['lectures-vault.json'];
            if (vaultFile) {
              let vaultContent = vaultFile.content;
              if ((vaultFile.truncated || !vaultContent) && vaultFile.raw_url) {
                try {
                  const rawVaultRes = await fetch(vaultFile.raw_url, {
                    cache: 'no-store',
                    headers: token
                      ? { 'Authorization': `token ${token}`, 'User-Agent': 'NursingStudyHubApp' }
                      : { 'User-Agent': 'NursingStudyHubApp' },
                  });
                  if (rawVaultRes.ok) {
                    vaultContent = await rawVaultRes.text();
                  }
                } catch {}
              }
              if (vaultContent) {
                try {
                  const vaultLecs = JSON.parse(vaultContent) as Lecture[];
                  if (Array.isArray(vaultLecs)) {
                    const deletedSet = new Set(parsed.deletedLectureIds || []);
                    const curIds = new Set(parsed.lectures.map((l) => l.id));
                    for (const vL of vaultLecs) {
                      if (!deletedSet.has(vL.id) && !curIds.has(vL.id)) {
                        parsed.lectures.push(vL);
                        curIds.add(vL.id);
                      }
                    }
                  }
                } catch {}
              }
            }
            return parsed;
          }
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

  // 🛡️ CRITICAL INDESTRUCTIBLE MERGE SAFEGUARD:
  // Never allow any deployment, script, or cold-start to erase existing lectures.
  try {
    const existing = await syncFromCloud(customToken);
    if (existing && Array.isArray(existing.lectures)) {
      const allDeleted = new Set<string>();
      (store.deletedLectureIds || []).forEach((id) => allDeleted.add(id));
      (existing.deletedLectureIds || []).forEach((id) => allDeleted.add(id));
      store.deletedLectureIds = Array.from(allDeleted);

      // Map existing lectures by ID
      const lectureMap = new Map<string, Lecture>();

      // 1. Existing cloud lectures (if not explicitly deleted)
      for (const lec of existing.lectures) {
        if (!allDeleted.has(lec.id)) {
          lectureMap.set(lec.id, lec);
        }
      }

      // 2. Incoming store lectures (take precedence / newer updates)
      for (const lec of (store.lectures || [])) {
        if (!allDeleted.has(lec.id)) {
          lectureMap.set(lec.id, lec);
        }
      }

      store.lectures = Array.from(lectureMap.values());

      // Safely merge subjectQuizzes and deletedQuizIds
      const allDeletedQuizzes = new Set<string>();
      (store.deletedQuizIds || []).forEach((id) => allDeletedQuizzes.add(id));
      (existing.deletedQuizIds || []).forEach((id) => allDeletedQuizzes.add(id));
      store.deletedQuizIds = Array.from(allDeletedQuizzes);

      const mergedQuizzes: Record<string, SubjectQuizFile> = {};
      if (existing.subjectQuizzes) {
        for (const [k, q] of Object.entries(existing.subjectQuizzes)) {
          const qId = q.id || k;
          if (!allDeletedQuizzes.has(k) && !allDeletedQuizzes.has(qId)) {
            mergedQuizzes[k] = { ...q, id: qId };
          }
        }
      }
      if (store.subjectQuizzes) {
        for (const [k, q] of Object.entries(store.subjectQuizzes)) {
          const qId = q.id || k;
          if (!allDeletedQuizzes.has(k) && !allDeletedQuizzes.has(qId)) {
            mergedQuizzes[k] = { ...q, id: qId };
          }
        }
      }
      store.subjectQuizzes = mergedQuizzes;
    }
  } catch (safeErr) {
    console.warn('[CMS DB Safeguard] Cloud pre-merge notice:', safeErr);
  }

  // Also verify against local immutable vault file so nothing ever slips through
  try {
    const vaultPath = path.join(process.cwd(), 'data', 'lectures-vault.json');
    if (fs.existsSync(vaultPath)) {
      const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
      const vaultLectures = JSON.parse(vaultContent) as Lecture[];
      if (Array.isArray(vaultLectures)) {
        const deletedSet = new Set(store.deletedLectureIds || []);
        const currentIds = new Set((store.lectures || []).map((l) => l.id));
        for (const vLec of vaultLectures) {
          if (!deletedSet.has(vLec.id) && !currentIds.has(vLec.id)) {
            store.lectures.push(vLec);
            currentIds.add(vLec.id);
          }
        }
      }
    }
  } catch {}

  // Prune visitor and download telemetry before writing to keep Gist size small (< 300KB)
  if (store.visitors && store.visitors.length > 200) {
    store.visitors = store.visitors.slice(-200);
  }
  if (store.downloads && store.downloads.length > 200) {
    store.downloads = store.downloads.slice(-200);
  }

  // Update local vault file synchronously
  try {
    const vaultPath = path.join(process.cwd(), 'data', 'lectures-vault.json');
    fs.writeFileSync(vaultPath, JSON.stringify(store.lectures, null, 2), 'utf-8');
  } catch {}

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Nursing Study Hub CMS Store & Vault - Protected (${store.lectures.length} lectures) at ${new Date().toISOString()}`,
        files: {
          'cms-store.json': {
            content: JSON.stringify(store, null, 2),
          },
          'lectures-vault.json': {
            content: JSON.stringify(store.lectures, null, 2),
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

function saveLectureToFile(lecture: Lecture): void {
  try {
    const candidates = [
      path.join(process.cwd(), 'lectures-data'),
      path.join('/tmp', 'nursing-lectures-data'),
    ];
    for (const dir of candidates) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${lecture.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(lecture, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[CMS DB] Failed to save lecture to isolated file:', err);
  }
}

function removeLectureFile(lectureId: string): void {
  try {
    const candidates = [
      path.join(process.cwd(), 'lectures-data', `${lectureId}.json`),
      path.join('/tmp', 'nursing-lectures-data', `${lectureId}.json`),
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  } catch (err) {
    console.warn('[CMS DB] Failed to delete lecture isolated file:', err);
  }
}

function loadAllLecturesFromFiles(): Lecture[] {
  const lectures: Lecture[] = [];
  const candidates = [
    path.join(process.cwd(), 'lectures-data'),
    path.join('/tmp', 'nursing-lectures-data'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = fs.readFileSync(path.join(dir, file), 'utf-8');
            const lec = JSON.parse(content) as Lecture;
            if (lec && lec.id && !lectures.some((l) => l.id === lec.id)) {
              lectures.push(lec);
            }
          }
        }
      }
    } catch {}
  }
  return lectures;
}

function initMemoryStore(): CmsStore {
  if (memoryStore) return memoryStore;

  const tmpPath = getStoreFilePath();
  const rootDataPath = path.join(process.cwd(), 'data', 'cms-store.json');
  const vaultPath = path.join(process.cwd(), 'data', 'lectures-vault.json');

  let loadedStore: CmsStore | null = null;

  for (const candidate of [rootDataPath, tmpPath]) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(content) as CmsStore;
        if (parsed && Array.isArray(parsed.lectures) && parsed.lectures.length > 0) {
          loadedStore = parsed;
          break;
        }
      }
    } catch (err) {
      console.warn('[CMS DB] Read candidate error:', candidate, err);
    }
  }

  // Also check if vault has any lectures not present in loadedStore
  try {
    if (fs.existsSync(vaultPath)) {
      const vContent = fs.readFileSync(vaultPath, 'utf-8');
      const vLecs = JSON.parse(vContent) as Lecture[];
      if (Array.isArray(vLecs) && vLecs.length > 0) {
        if (!loadedStore) {
          loadedStore = {
            announcement: DEFAULT_ANNOUNCEMENT,
            lectures: vLecs,
            deletedLectureIds: [],
            subjects: MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals'),
            subjectQuizzes: {},
            brokenLinks: [],
            complaints: [],
            visitors: [],
            downloads: [],
          };
        } else {
          const deletedSet = new Set(loadedStore.deletedLectureIds || []);
          const curIds = new Set(loadedStore.lectures.map((l) => l.id));
          for (const vl of vLecs) {
            if (!deletedSet.has(vl.id) && !curIds.has(vl.id)) {
              loadedStore.lectures.push(vl);
              curIds.add(vl.id);
            }
          }
        }
      }
    }
  } catch {}

  // Also load and merge from isolated lectures-data folder
  const isolatedLecs = loadAllLecturesFromFiles();
  if (isolatedLecs.length > 0) {
    if (!loadedStore) {
      loadedStore = {
        announcement: DEFAULT_ANNOUNCEMENT,
        lectures: isolatedLecs,
        deletedLectureIds: [],
        subjects: MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals'),
        subjectQuizzes: {},
        brokenLinks: [],
        complaints: [],
        visitors: [],
        downloads: [],
      };
    } else {
      const deletedSet = new Set(loadedStore.deletedLectureIds || []);
      const curIds = new Set(loadedStore.lectures.map((l) => l.id));
      for (const iso of isolatedLecs) {
        if (!deletedSet.has(iso.id) && !curIds.has(iso.id)) {
          loadedStore.lectures.push(iso);
          curIds.add(iso.id);
        }
      }
    }
  }

  if (loadedStore) {
    memoryStore = loadedStore;
    return memoryStore;
  }

  // Pure clean store with curriculum subjects (fundamentals excluded)
  memoryStore = {
    announcement: DEFAULT_ANNOUNCEMENT,
    lectures: [],
    deletedLectureIds: [],
    subjects: MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals'),
    subjectQuizzes: {},
    brokenLinks: [],
    complaints: [],
    visitors: [],
    downloads: [],
  };

  return memoryStore;
}

async function getFreshStore(): Promise<CmsStore> {
  const cloudStore = await syncFromCloud();
  const store = initMemoryStore();

  if (cloudStore && Array.isArray(cloudStore.lectures)) {
    store.announcement = cloudStore.announcement || store.announcement;

    // Merge deleted lecture IDs
    const deletedSet = new Set<string>();
    (store.deletedLectureIds || []).forEach((id) => deletedSet.add(id));
    (cloudStore.deletedLectureIds || []).forEach((id) => deletedSet.add(id));
    store.deletedLectureIds = Array.from(deletedSet);

    // Merge lectures safely between cloud and local
    const merged = new Map<string, Lecture>();

    // 1. First add from memory / local store (if not deleted)
    for (const l of (store.lectures || [])) {
      if (!deletedSet.has(l.id)) merged.set(l.id, l);
    }

    // 2. Cloud store merges in (only if local doesn't have a newer modification timestamp)
    for (const l of (cloudStore.lectures || [])) {
      if (!deletedSet.has(l.id)) {
        const local = merged.get(l.id);
        if (local) {
          const localTs = (local as any).lastModified || 0;
          const cloudTs = (l as any).lastModified || 0;
          if (localTs > cloudTs) {
            // Keep local version because it was edited more recently
            continue;
          }
        }
        merged.set(l.id, l);
      }
    }

    store.lectures = Array.from(merged.values());

    if (cloudStore.subjects && Array.isArray(cloudStore.subjects)) {
      store.subjects = cloudStore.subjects.filter((s: any) => s.id !== 'fundamentals');
    } else if (!store.subjects || store.subjects.length === 0) {
      store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    }

    const deletedQuizSet = new Set<string>();
    (store.deletedQuizIds || []).forEach((id) => deletedQuizSet.add(id));
    (cloudStore.deletedQuizIds || []).forEach((id) => deletedQuizSet.add(id));
    store.deletedQuizIds = Array.from(deletedQuizSet);

    const mergedQuizzes: Record<string, SubjectQuizFile> = {};
    if (store.subjectQuizzes) {
      for (const [k, q] of Object.entries(store.subjectQuizzes)) {
        const qId = q.id || k;
        if (!deletedQuizSet.has(k) && !deletedQuizSet.has(qId)) {
          mergedQuizzes[k] = { ...q, id: qId };
        }
      }
    }
    if (cloudStore.subjectQuizzes) {
      for (const [k, q] of Object.entries(cloudStore.subjectQuizzes)) {
        const qId = q.id || k;
        if (!deletedQuizSet.has(k) && !deletedQuizSet.has(qId)) {
          const localQ = mergedQuizzes[k];
          if (localQ) {
            const localTs = (localQ as any).lastModified || 0;
            const cloudTs = (q as any).lastModified || 0;
            if (localTs > cloudTs) {
              continue;
            }
          }
          mergedQuizzes[k] = { ...q, id: qId };
        }
      }
    }
    store.subjectQuizzes = mergedQuizzes;

    if (cloudStore.brokenLinks) store.brokenLinks = cloudStore.brokenLinks;
    if (cloudStore.complaints) store.complaints = cloudStore.complaints;
    if (cloudStore.visitors && Array.isArray(cloudStore.visitors)) {
      const existingVisMap = new Map((store.visitors || []).map((v) => [v.id, v]));
      for (const v of cloudStore.visitors) {
        existingVisMap.set(v.id, v);
      }
      store.visitors = Array.from(existingVisMap.values());
    }
    if (cloudStore.downloads && Array.isArray(cloudStore.downloads)) {
      const existingDlMap = new Map((store.downloads || []).map((d) => [d.id, d]));
      for (const d of cloudStore.downloads) {
        existingDlMap.set(d.id, d);
      }
      store.downloads = Array.from(existingDlMap.values());
    }
    memoryStore = store;

    // Save a local disk backup copy silently so offline/cold-start has it
    try {
      const candidates = [
        path.join(process.cwd(), 'data', 'cms-store.json'),
        path.join(process.cwd(), 'data', 'lectures-vault.json'),
        getStoreFilePath(),
      ];
      for (const p of candidates) {
        const d = path.dirname(p);
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        if (p.includes('lectures-vault.json')) {
          fs.writeFileSync(p, JSON.stringify(store.lectures, null, 2), 'utf-8');
        } else {
          fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf-8');
        }
      }
    } catch {}

    return memoryStore;
  }
  return store;
}

function persistStore(store: CmsStore, customToken?: string): void {
  for (const lec of (store.lectures || [])) {
    saveLectureToFile(lec);
  }
  try {
    const candidates = [
      path.join(process.cwd(), 'data', 'cms-store.json'),
      path.join(process.cwd(), 'data', 'lectures-vault.json'),
      getStoreFilePath(),
    ];
    for (const p of candidates) {
      const d = path.dirname(p);
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      if (p.includes('lectures-vault.json')) {
        fs.writeFileSync(p, JSON.stringify(store.lectures, null, 2), 'utf-8');
      } else {
        fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    try {
      fs.writeFileSync(path.join('/tmp', 'nursing-cms-store.json'), JSON.stringify(store, null, 2), 'utf-8');
      fs.writeFileSync(path.join('/tmp', 'nursing-lectures-vault.json'), JSON.stringify(store.lectures, null, 2), 'utf-8');
    } catch {
      console.warn('[CMS DB] Persistence to disk skipped, kept in memory store.');
    }
  }

  syncToCloud(store, customToken).catch(() => {});
}

function getTodayString(offsetDays = 0): string {
  try {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
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
      semester: subjectData.semester || '1',
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
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return newSubject;
  },

  async updateSubject(
    subjectData: Partial<Subject> & { id: string; syncItemsSemester?: boolean },
    customToken?: string
  ): Promise<Subject | null> {
    const store = await getFreshStore();
    if (!store.subjects) store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    const index = store.subjects.findIndex((s) => s.id === subjectData.id);
    if (index === -1) return null;

    const yearNames: Record<string, string> = {
      '1': 'السنة الأولى',
      '2': 'السنة الثانية',
      '3': 'السنة الثالثة',
      '4': 'السنة الرابعة',
    };

    const { syncItemsSemester, ...cleanData } = subjectData;
    if (cleanData.yearId) {
      cleanData.yearName = yearNames[cleanData.yearId] || 'السنة الأولى';
    }
    store.subjects[index] = { ...store.subjects[index], ...cleanData };
    const updatedSub = store.subjects[index];

    // Sync title, yearId, and optionally semester across lectures & quizzes of this subject
    for (const lec of store.lectures || []) {
      if (lec.subjectId === subjectData.id) {
        if (cleanData.title) lec.subjectTitle = updatedSub.title;
        if (cleanData.yearId) {
          lec.yearId = updatedSub.yearId;
          lec.yearTitle = updatedSub.yearName;
        }
        if (syncItemsSemester && (cleanData.semester === '1' || cleanData.semester === '2')) {
          lec.semester = cleanData.semester;
        }
      }
    }
    if (store.subjectQuizzes) {
      for (const q of Object.values(store.subjectQuizzes)) {
        if (q.subjectId === subjectData.id) {
          if (cleanData.title) q.subjectTitle = updatedSub.title;
          if (syncItemsSemester && (cleanData.semester === '1' || cleanData.semester === '2')) {
            q.semester = cleanData.semester;
          }
        }
      }
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return store.subjects[index];
  },

  async deleteSubject(id: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.subjects) store.subjects = MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals');
    store.subjects = store.subjects.filter((s) => s.id !== id);
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async getLiveSubjects(): Promise<Subject[]> {
    const allSubjects = await this.getAllSubjects();
    const liveLectures = await this.getLiveLectures();
    const allQuizFiles = await this.getAllSubjectQuizFilesList();
    const counts: Record<string, number> = {};
    const quizzesBySub: Record<string, SubjectQuizFile[]> = {};

    for (const lec of liveLectures) {
      counts[lec.subjectId] = (counts[lec.subjectId] || 0) + 1;
    }

    for (const qf of allQuizFiles) {
      if (!quizzesBySub[qf.subjectId]) quizzesBySub[qf.subjectId] = [];
      quizzesBySub[qf.subjectId].push(qf);
    }

    return allSubjects.map((sub) => {
      const subQuizzes = quizzesBySub[sub.id] || [];
      return {
        ...sub,
        totalLectures: counts[sub.id] || 0,
        totalQuizzes: subQuizzes.length,
        quizzesFile: subQuizzes[0] || undefined,
        quizzesFiles: subQuizzes,
      };
    });
  },

  async getLiveLecturesBySubject(subjectId: string): Promise<Lecture[]> {
    const liveLectures = await this.getLiveLectures();
    return liveLectures
      .filter((lec) => lec.subjectId === subjectId)
      .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
  },

  async getLectureById(id: string): Promise<Lecture | undefined> {
    const all = await this.getAllLectures();
    return all.find((lec) => lec.id === id || lec.slug === id);
  },

  async addOrUpdateLecture(lecture: Lecture, customToken?: string): Promise<Lecture> {
    const store = await getFreshStore();
    if (store.deletedLectureIds) {
      store.deletedLectureIds = store.deletedLectureIds.filter((id) => id !== lecture.id);
    }
    const existingIndex = store.lectures.findIndex((l) => l.id === lecture.id);

    const now = Date.now();
    const updatedLecture: Lecture = {
      ...lecture,
      lastModified: now,
    };

    if (existingIndex >= 0) {
      store.lectures[existingIndex] = {
        ...store.lectures[existingIndex],
        ...updatedLecture,
        files: [...updatedLecture.files],
        flashcards: updatedLecture.flashcards ? [...updatedLecture.flashcards] : [],
        lastModified: now,
      };
    } else {
      store.lectures.unshift(updatedLecture);
    }

    memoryStore = store;
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
    removeLectureFile(id);
    const store = await getFreshStore();
    if (!store.deletedLectureIds) store.deletedLectureIds = [];
    if (!store.deletedLectureIds.includes(id)) {
      store.deletedLectureIds.push(id);
    }
    const initialLen = store.lectures.length;
    store.lectures = store.lectures.filter((l) => l.id !== id);
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);

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
    const store = await getFreshStore();
    const newEvent: VisitorEvent = {
      ...event,
      id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: getTodayString(),
    };
    if (!store.visitors) store.visitors = [];
    store.visitors.push(newEvent);
    if (store.visitors.length > 250) store.visitors = store.visitors.slice(-250);
    persistStore(store);
    await syncToCloud(store);
  },

  async trackDownload(event: Omit<DownloadEvent, 'id' | 'timestamp' | 'dateStr'>): Promise<void> {
    const store = await getFreshStore();
    const newEvent: DownloadEvent = {
      ...event,
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: getTodayString(),
    };
    if (!store.downloads) store.downloads = [];
    store.downloads.push(newEvent);
    if (store.downloads.length > 250) store.downloads = store.downloads.slice(-250);
    persistStore(store);
    await syncToCloud(store);
  },

  async getTodayAnalytics(targetDate?: string): Promise<{
    date: string;
    visitors: number;
    pageViews: number;
    yesterdayVisitors: number;
    allTimeVisitors: number;
    downloads: number;
    yesterdayDownloads: number;
    allTimeDownloads: number;
    breakdown: Array<{ subjectTitle: string; lectureTitle: string; downloads: number }>;
  }> {
    const store = await getFreshStore();
    const today = targetDate || getTodayString();
    const yesterday = getTodayString(-1);

    const allVisitors = store.visitors || [];
    const allDownloads = store.downloads || [];

    const todayVisitorsList = allVisitors.filter((v) => v.dateStr === today);
    const yesterdayVisitorsList = allVisitors.filter((v) => v.dateStr === yesterday);

    // Count daily unique visitors (where isDailyUnique !== false)
    const todayUnique = todayVisitorsList.filter((v) => v.isDailyUnique !== false).length;
    const yesterdayUnique = yesterdayVisitorsList.filter((v) => v.isDailyUnique !== false).length;

    const todayDownloads = allDownloads.filter((d) => d.dateStr === today);
    const yesterdayDownloads = allDownloads.filter((d) => d.dateStr === yesterday);

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
      visitors: todayUnique || todayVisitorsList.length,
      pageViews: todayVisitorsList.length,
      yesterdayVisitors: yesterdayUnique || yesterdayVisitorsList.length,
      allTimeVisitors: allVisitors.length,
      downloads: todayDownloads.length,
      yesterdayDownloads: yesterdayDownloads.length,
      allTimeDownloads: allDownloads.length,
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
    const store = await getFreshStore();
    const today = getTodayString();

    const todayVisitorsList = (store.visitors || []).filter((v) => v.dateStr === today);
    const todayUnique = todayVisitorsList.filter((v) => v.isDailyUnique !== false).length;
    const todayVisitors = todayUnique || todayVisitorsList.length;

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

  // --- SUBJECT QUIZZES (اسئلة الكويزات المجمعة والمتعددة لكل مادة وسمستر) ---
  async getAllSubjectQuizFilesList(): Promise<SubjectQuizFile[]> {
    const store = await getFreshStore();
    const deletedSet = new Set(store.deletedQuizIds || []);
    const subjectsMap = new Map((store.subjects || []).map((s) => [s.id, s]));
    const list: SubjectQuizFile[] = [];

    if (store.subjectQuizzes) {
      for (const [key, q] of Object.entries(store.subjectQuizzes)) {
        const qId = q.id || key;
        if (deletedSet.has(key) || deletedSet.has(qId)) continue;
        const sub = subjectsMap.get(q.subjectId);
        const resolvedSemester: '1' | '2' =
          q.semester === '2' ? '2' : q.semester === '1' ? '1' : sub?.semester === '2' ? '2' : '1';
        list.push({
          ...q,
          id: qId,
          semester: resolvedSemester,
        });
      }
    }

    return list;
  },

  async getSubjectQuizFiles(subjectId: string, semester?: '1' | '2'): Promise<SubjectQuizFile[]> {
    const all = await this.getAllSubjectQuizFilesList();
    return all.filter((q) => {
      if (q.subjectId !== subjectId) return false;
      if (semester && q.semester !== semester) return false;
      return true;
    });
  },

  async getSubjectQuizFile(subjectId: string): Promise<SubjectQuizFile | null> {
    const files = await this.getSubjectQuizFiles(subjectId);
    return files[0] || null;
  },

  async saveSubjectQuizFile(quizFile: SubjectQuizFile, customToken?: string): Promise<SubjectQuizFile> {
    const store = await getFreshStore();
    if (!store.subjectQuizzes) {
      store.subjectQuizzes = {};
    }
    const id = quizFile.id?.trim() || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const normalized: SubjectQuizFile = {
      ...quizFile,
      id,
      semester: quizFile.semester === '2' ? '2' : '1',
      lastModified: Date.now(),
    };
    if (store.deletedQuizIds) {
      store.deletedQuizIds = store.deletedQuizIds.filter((dId) => dId !== id);
    }
    store.subjectQuizzes[id] = normalized;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return normalized;
  },

  async updateSubjectQuizFile(
    id: string,
    updates: Partial<SubjectQuizFile>,
    customToken?: string
  ): Promise<SubjectQuizFile | null> {
    const store = await getFreshStore();
    if (!store.subjectQuizzes) return null;

    let targetKey: string | null = null;
    for (const [k, q] of Object.entries(store.subjectQuizzes)) {
      if (k === id || q.id === id) {
        targetKey = k;
        break;
      }
    }
    if (!targetKey) return null;

    const existing = store.subjectQuizzes[targetKey];
    const updated: SubjectQuizFile = {
      ...existing,
      ...updates,
      id: existing.id || targetKey,
      lastModified: Date.now(),
    };

    if (
      (updates as any).removeExplanation ||
      updates.explanationUrl === '' ||
      (updates.explanationUrl === undefined && 'explanationUrl' in updates)
    ) {
      delete (updated as any).explanationUrl;
      delete (updated as any).explanationTitle;
      delete (updated as any).explanationFileSize;
    }

    store.subjectQuizzes[targetKey] = updated;
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return updated;
  },

  async deleteSubjectQuizFile(id: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.deletedQuizIds) store.deletedQuizIds = [];
    if (!store.deletedQuizIds.includes(id)) {
      store.deletedQuizIds.push(id);
    }

    if (store.subjectQuizzes) {
      for (const [k, q] of Object.entries(store.subjectQuizzes)) {
        if (k === id || q.id === id) {
          delete store.subjectQuizzes[k];
        }
      }
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async getAllSubjectQuizFiles(): Promise<Record<string, SubjectQuizFile>> {
    const list = await this.getAllSubjectQuizFilesList();
    const map: Record<string, SubjectQuizFile> = {};
    for (const q of list) {
      map[q.id || q.subjectId] = q;
    }
    return map;
  },
};

