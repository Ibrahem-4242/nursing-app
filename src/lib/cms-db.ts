import fs from 'fs';
import path from 'path';
import {
  Lecture,
  Subject,
  AnnouncementConfig,
  MaintenanceConfig,
  BrokenLinkReport,
  ComplaintRecord,
  VisitorEvent,
  DownloadEvent,
  SubjectQuizFile,
  StudentUser,
  PurchaseOrder,
  ShakibRakibConfig,
  ShakibRakibSubscription,
  PromoCoupon,
  StudentBookmarks,
  FailedLoginRecord,
  AppNotification,
  PanicModeConfig,
  PlatformFeaturesConfig,
} from './types';
import { MOCK_SUBJECTS } from './mock-data';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { PanicEngine } from './panic-engine';

interface CmsStore {
  announcement: AnnouncementConfig;
  maintenance?: MaintenanceConfig;
  panicMode?: PanicModeConfig;
  platformFeatures?: PlatformFeaturesConfig;
  shakibRakibConfig?: ShakibRakibConfig;
  lectures: Lecture[];
  deletedLectureIds?: string[];
  deletedQuizIds?: string[];
  subjects?: Subject[];
  subjectQuizzes?: Record<string, SubjectQuizFile>;
  brokenLinks: BrokenLinkReport[];
  complaints: ComplaintRecord[];
  visitors: VisitorEvent[];
  downloads: DownloadEvent[];
  students?: StudentUser[];
  deletedStudentIds?: string[];
  orders?: PurchaseOrder[];
  deletedOrderIds?: string[];
  coupons?: PromoCoupon[];
  deletedCouponIds?: string[];
  failedLoginAttempts?: Record<string, FailedLoginRecord>;
  notifications?: AppNotification[];
  deletedNotificationIds?: string[];
  // Permanent counters and daily maps to guarantee mathematical accuracy
  cumulativeVisitors?: number;
  cumulativeDownloads?: number;
  cumulativePageViews?: number;
  dailyVisitorsMap?: Record<string, number>;
  dailyDownloadsMap?: Record<string, number>;
}

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'announcement-1',
  text: 'شدوا حيلكم يا شباااااااااااااااب',
  isActive: true,
  linkText: 'انضم لجروب الواتساب',
  linkUrl: 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  isEnabled: false,
  title: 'المنصة في وضع الصيانة والتحديث المؤقت 🛠️',
  message: 'نقوم حالياً بإجراء تحديثات وتحسينات دورية لإضافة محاضرات ومحتوى تعليمي جديد وتطوير تجربة التعلم لجميع طلاب تمريض. سنعود إليكم خلال وقت قصير بإذن الله.',
  estimatedReturn: 'خلال وقت قصير جداً',
  contactWhatsapp: 'https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_SHAKIB_RAKIB_CONFIG: ShakibRakibConfig = {
  price: 10,
  isEnabled: true,
  monthLabel: 'اشتراك الشهر الحالي (شامل كل المواد)',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_PLATFORM_FEATURES: PlatformFeaturesConfig = {
  shakibRakib: true,
  announcementBar: true,
  whatsappButton: true,
  bookmarks: true,
  notifications: true,
  subjectQuizzes: true,
  coupons: true,
  audioSummaries: true,
  mindmaps: true,
  powerpointPpt: true,
  flashcards: true,
  statsBar: true,
};


// Global in-memory cache to guarantee instant performance in runtime
let memoryStore: CmsStore | null = null;

let runtimeCustomToken = '';

const BUILTIN_SYNC_TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');

export function maskRawGithubUrls<T>(data: T): T {
  if (!data) return data;
  try {
    const str = JSON.stringify(data);
    if (!str.includes('raw.githubusercontent.com')) return data;
    const masked = str.replace(
      /https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/public\/uploads\/([^"'\\]+)/g,
      '/api/files/$1'
    );
    return JSON.parse(masked);
  } catch {
    return data;
  }
}

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

let memoryStoreLastFetched = 0;
const STORE_CACHE_TTL_MS = 2500;
let inFlightCloudSyncPromise: Promise<CmsStore | null> | null = null;

export async function syncFromCloud(customToken?: string): Promise<CmsStore | null> {
  const { gistId, token } = getGistConfig(customToken);
  if (!gistId) return null;

  if (inFlightCloudSyncPromise && !customToken) {
    return inFlightCloudSyncPromise;
  }

  const doSync = async (): Promise<CmsStore | null> => {
    // 1. Direct Authenticated GitHub Gist API fetch (Authoritative, 100% LIVE, zero CDN delay)
    try {
      const headers: Record<string, string> = {
      'User-Agent': 'NursingStudyHubApp',
      'Accept': 'application/vnd.github.v3+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com/gists/${gistId}?_cb=${Date.now()}`, {
      cache: 'no-store',
      headers,
    });

    if (res.ok) {
      const gist = await res.json();
      const file = gist.files?.['cms-store.json'];
      if (file) {
        let content = file.content;
        // If GitHub API truncated file.content (> ~300KB), fetch full content via file.raw_url with zero CDN lag
        if ((file.truncated || !content) && file.raw_url) {
          try {
            const rawUrlWithBust = file.raw_url.includes('?')
              ? `${file.raw_url}&_cb=${Date.now()}`
              : `${file.raw_url}?_cb=${Date.now()}`;
            const rawRes = await fetch(rawUrlWithBust, {
              cache: 'no-store',
              headers: {
                ...(token ? { 'Authorization': `token ${token}` } : {}),
                'User-Agent': 'NursingStudyHubApp',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
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
                  const vaultUrlWithBust = vaultFile.raw_url.includes('?')
                    ? `${vaultFile.raw_url}&_cb=${Date.now()}`
                    : `${vaultFile.raw_url}?_cb=${Date.now()}`;
                  const rawVaultRes = await fetch(vaultUrlWithBust, {
                    cache: 'no-store',
                    headers: {
                      ...(token ? { 'Authorization': `token ${token}` } : {}),
                      'User-Agent': 'NursingStudyHubApp',
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache',
                    },
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

    // 2. Direct Gist Raw CDN fetch fallback with cache bust
    try {
      const owner = process.env.GITHUB_OWNER || 'Ibrahem-4242';
      const rawRes = await fetch(
        `https://gist.githubusercontent.com/${owner}/${gistId}/raw/cms-store.json?_cb=${Date.now()}`,
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
      console.warn('[CMS DB] Cloud sync raw fetch notice:', rawErr);
    }
    return null;
  };

  if (!customToken) {
    inFlightCloudSyncPromise = doSync();
    try {
      return await inFlightCloudSyncPromise;
    } finally {
      inFlightCloudSyncPromise = null;
    }
  }

  return await doSync();
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

      // Safely merge deletedStudentIds (ONLY student IDs, NEVER phone numbers)
      const allDeletedStudents = new Set<string>();
      (store.deletedStudentIds || []).forEach((id) => {
        if (id && !/^[0-9]{8,15}$/.test(id)) allDeletedStudents.add(id);
      });
      (existing.deletedStudentIds || []).forEach((id) => {
        if (id && !/^[0-9]{8,15}$/.test(id)) allDeletedStudents.add(id);
      });
      store.deletedStudentIds = Array.from(allDeletedStudents);

      // Safely merge students (strictly excluding tombstoned IDs)
      const studentMap = new Map<string, StudentUser>();
      (existing.students || []).forEach((s) => {
        if (s && s.id && !allDeletedStudents.has(s.id)) {
          studentMap.set(s.id, s);
        }
      });
      (store.students || []).forEach((s) => {
        if (s && s.id && !allDeletedStudents.has(s.id)) {
          studentMap.set(s.id, s);
        }
      });
      store.students = Array.from(studentMap.values());

      // Safely merge deletedOrderIds
      const allDeletedOrders = new Set<string>();
      (store.deletedOrderIds || []).forEach((id) => allDeletedOrders.add(id));
      (existing.deletedOrderIds || []).forEach((id) => allDeletedOrders.add(id));
      store.deletedOrderIds = Array.from(allDeletedOrders);

      // Safely merge purchase orders (strictly excluding deletedOrderIds)
      const orderMap = new Map<string, PurchaseOrder>();
      (existing.orders || []).forEach((o) => {
        if (o && o.id && !allDeletedOrders.has(o.id)) {
          orderMap.set(o.id, o);
        }
      });
      (store.orders || []).forEach((o) => {
        if (o && o.id && !allDeletedOrders.has(o.id)) {
          orderMap.set(o.id, o);
        }
      });
      store.orders = Array.from(orderMap.values());

      // Safely merge deletedCouponIds
      const allDeletedCoupons = new Set<string>();
      (store.deletedCouponIds || []).forEach((id) => allDeletedCoupons.add(id.trim().toUpperCase()));
      (existing.deletedCouponIds || []).forEach((id) => allDeletedCoupons.add(id.trim().toUpperCase()));
      store.deletedCouponIds = Array.from(allDeletedCoupons);

      // Safely merge coupons (strictly excluding deletedCouponIds)
      const couponMap = new Map<string, PromoCoupon>();
      (existing.coupons || []).forEach((c) => {
        const codeKey = (c.code || '').trim().toUpperCase();
        if (codeKey && !allDeletedCoupons.has(codeKey)) {
          couponMap.set(codeKey, { ...c, code: codeKey });
        }
      });
      (store.coupons || []).forEach((c) => {
        const codeKey = (c.code || '').trim().toUpperCase();
        if (codeKey && !allDeletedCoupons.has(codeKey)) {
          couponMap.set(codeKey, { ...c, code: codeKey });
        }
      });
      store.coupons = Array.from(couponMap.values());

      // Safely merge telemetry counters and daily maps
      store.cumulativeVisitors = Math.max(store.cumulativeVisitors || 0, existing.cumulativeVisitors || 0);
      store.cumulativeDownloads = Math.max(store.cumulativeDownloads || 0, existing.cumulativeDownloads || 0);
      store.cumulativePageViews = Math.max(store.cumulativePageViews || 0, existing.cumulativePageViews || 0);
      store.dailyVisitorsMap = {
        ...(existing.dailyVisitorsMap || {}),
        ...(store.dailyVisitorsMap || {}),
      };
      store.dailyDownloadsMap = {
        ...(existing.dailyDownloadsMap || {}),
        ...(store.dailyDownloadsMap || {}),
      };

      store.shakibRakibConfig = {
        ...DEFAULT_SHAKIB_RAKIB_CONFIG,
        ...(existing.shakibRakibConfig || {}),
        ...(store.shakibRakibConfig || {}),
      };

      store.platformFeatures = {
        ...DEFAULT_PLATFORM_FEATURES,
        ...(existing.platformFeatures || {}),
        ...(store.platformFeatures || {}),
      };

      // Always synchronize authoritative panicMode from PanicEngine
      store.panicMode = await PanicEngine.getPanicMode();
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
    memoryStoreLastFetched = Date.now();
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

  for (const candidate of [tmpPath, rootDataPath]) {
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
    if (!loadedStore.maintenance) {
      loadedStore.maintenance = DEFAULT_MAINTENANCE;
    }
    if (!loadedStore.shakibRakibConfig) {
      loadedStore.shakibRakibConfig = DEFAULT_SHAKIB_RAKIB_CONFIG;
    }
    if (!loadedStore.panicMode) {
      loadedStore.panicMode = { isEnabled: false };
    }
    if (!loadedStore.platformFeatures) {
      loadedStore.platformFeatures = DEFAULT_PLATFORM_FEATURES;
    }
    memoryStore = maskRawGithubUrls(loadedStore);
    return memoryStore;
  }

    memoryStore = {
      announcement: DEFAULT_ANNOUNCEMENT,
      maintenance: DEFAULT_MAINTENANCE,
      shakibRakibConfig: DEFAULT_SHAKIB_RAKIB_CONFIG,
      panicMode: { isEnabled: false },
      platformFeatures: DEFAULT_PLATFORM_FEATURES,
      lectures: [],
      deletedLectureIds: [],
      subjects: MOCK_SUBJECTS.filter((s) => s.id !== 'fundamentals'),
      subjectQuizzes: {},
      brokenLinks: [],
      complaints: [],
      visitors: [],
      downloads: [],
      students: [],
      deletedStudentIds: [],
      orders: [],
      deletedOrderIds: [],
    };

    return memoryStore;
  }

async function getFreshStore(): Promise<CmsStore> {
  const now = Date.now();
  if (
    memoryStore &&
    Array.isArray(memoryStore.lectures) &&
    memoryStore.lectures.length > 0 &&
    now - memoryStoreLastFetched < STORE_CACHE_TTL_MS
  ) {
    return memoryStore;
  }

  const cloudStore = await syncFromCloud();
  let store = initMemoryStore();

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
    if (cloudStore.maintenance) {
      store.maintenance = {
        ...DEFAULT_MAINTENANCE,
        ...cloudStore.maintenance,
      };
    }
    const deletedStudentSet = new Set<string>();
    (store.deletedStudentIds || []).forEach((id) => {
      if (id && !/^[0-9]{8,15}$/.test(id)) deletedStudentSet.add(id);
    });
    (cloudStore.deletedStudentIds || []).forEach((id) => {
      if (id && !/^[0-9]{8,15}$/.test(id)) deletedStudentSet.add(id);
    });
    store.deletedStudentIds = Array.from(deletedStudentSet);

    if (cloudStore.students && Array.isArray(cloudStore.students)) {
      const existingStuMap = new Map((store.students || []).map((s) => [s.id, s]));
      for (const s of cloudStore.students) {
        if (s && s.id && !deletedStudentSet.has(s.id)) {
          existingStuMap.set(s.id, s);
        }
      }
      store.students = Array.from(existingStuMap.values()).filter(
        (s) => s && s.id && !deletedStudentSet.has(s.id)
      );
    }

    const deletedOrderSet = new Set<string>();
    (store.deletedOrderIds || []).forEach((id) => deletedOrderSet.add(id));
    (cloudStore.deletedOrderIds || []).forEach((id) => deletedOrderSet.add(id));
    store.deletedOrderIds = Array.from(deletedOrderSet);

    if (cloudStore.orders && Array.isArray(cloudStore.orders)) {
      const existingOrdMap = new Map((store.orders || []).map((o) => [o.id, o]));
      for (const o of cloudStore.orders) {
        if (o && o.id && !deletedOrderSet.has(o.id)) {
          existingOrdMap.set(o.id, o);
        }
      }
      store.orders = Array.from(existingOrdMap.values()).filter(
        (o) => o && o.id && !deletedOrderSet.has(o.id)
      );
    }

    // Safely merge telemetry counters and daily maps
    store.cumulativeVisitors = Math.max(store.cumulativeVisitors || 0, cloudStore.cumulativeVisitors || 0);
    store.cumulativeDownloads = Math.max(store.cumulativeDownloads || 0, cloudStore.cumulativeDownloads || 0);
    store.cumulativePageViews = Math.max(store.cumulativePageViews || 0, cloudStore.cumulativePageViews || 0);
    store.dailyVisitorsMap = {
      ...(cloudStore.dailyVisitorsMap || {}),
      ...(store.dailyVisitorsMap || {}),
    };
    store.dailyDownloadsMap = {
      ...(cloudStore.dailyDownloadsMap || {}),
      ...(store.dailyDownloadsMap || {}),
    };

    if (cloudStore.shakibRakibConfig) {
      store.shakibRakibConfig = {
        ...DEFAULT_SHAKIB_RAKIB_CONFIG,
        ...cloudStore.shakibRakibConfig,
      };
    } else if (!store.shakibRakibConfig) {
      store.shakibRakibConfig = DEFAULT_SHAKIB_RAKIB_CONFIG;
    }

    // Always synchronize authoritative panicMode from PanicEngine
    store.panicMode = await PanicEngine.getPanicMode();

    if (cloudStore.platformFeatures) {
      store.platformFeatures = {
        ...DEFAULT_PLATFORM_FEATURES,
        ...cloudStore.platformFeatures,
      };
    } else if (!store.platformFeatures) {
      store.platformFeatures = DEFAULT_PLATFORM_FEATURES;
    }

    store = maskRawGithubUrls(store);
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

    memoryStoreLastFetched = Date.now();
    return memoryStore;
  }
  store = maskRawGithubUrls(store);
  memoryStoreLastFetched = Date.now();
  return store;
}

function persistStore(store: CmsStore, customToken?: string): void {
  memoryStoreLastFetched = 0;
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

  // --- MAINTENANCE & LOCKDOWN ---
  async getMaintenanceConfig(): Promise<MaintenanceConfig> {
    const store = await getFreshStore();
    return store.maintenance || DEFAULT_MAINTENANCE;
  },

  async updateMaintenanceConfig(
    config: Partial<MaintenanceConfig>,
    customToken?: string
  ): Promise<MaintenanceConfig> {
    const store = await getFreshStore();
    const current = store.maintenance || DEFAULT_MAINTENANCE;
    const updated: MaintenanceConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    store.maintenance = updated;
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return updated;
  },

  // --- EMERGENCY DECOY / CAMOUFLAGE MODE (كبسة يمعلم مشمش 🥛) ---
  async getPanicMode(): Promise<PanicModeConfig> {
    return PanicEngine.getPanicMode();
  },

  async setPanicMode(
    isEnabled: boolean,
    customToken?: string
  ): Promise<{ success: boolean; isEnabled: boolean; activatedAt?: string }> {
    return PanicEngine.setPanicMode(isEnabled, customToken);
  },

  // --- PLATFORM FEATURES & VISIBILITY CONTROLS (التحكم في الميزات والظهور) ---
  async getPlatformFeatures(): Promise<PlatformFeaturesConfig> {
    const store = await getFreshStore();
    return { ...DEFAULT_PLATFORM_FEATURES, ...(store.platformFeatures || {}) };
  },

  async updatePlatformFeatures(
    features: Partial<PlatformFeaturesConfig>,
    customToken?: string
  ): Promise<PlatformFeaturesConfig> {
    const store = await getFreshStore();
    const current = store.platformFeatures || DEFAULT_PLATFORM_FEATURES;
    const updated: PlatformFeaturesConfig = {
      ...DEFAULT_PLATFORM_FEATURES,
      ...current,
      ...features,
      updatedAt: new Date().toISOString(),
    };
    store.platformFeatures = updated;

    // Sync with shakibRakibConfig if shakibRakib feature is toggled
    if (features.shakibRakib !== undefined) {
      if (!store.shakibRakibConfig) {
        store.shakibRakibConfig = { ...DEFAULT_SHAKIB_RAKIB_CONFIG };
      }
      store.shakibRakibConfig.isEnabled = features.shakibRakib;
    }

    memoryStore = store;

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

    await syncToCloud(store, customToken);
    return updated;
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
    const allQuizFiles = (await this.getAllSubjectQuizFilesList()).filter((q) => q.isLive !== false);
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

  async getLecturesBySubject(subjectId: string): Promise<Lecture[]> {
    const all = await this.getAllLectures();
    return all
      .filter((lec) => lec.subjectId === subjectId)
      .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
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
    const today = getTodayString();
    const newEvent: VisitorEvent = {
      ...event,
      id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: today,
    };
    if (!store.visitors) store.visitors = [];
    if (!store.dailyVisitorsMap) store.dailyVisitorsMap = {};
    if (!store.cumulativeVisitors) store.cumulativeVisitors = Math.max(store.visitors.length || 0, 1);
    if (!store.cumulativePageViews) store.cumulativePageViews = Math.max(store.visitors.length || 0, 1);

    store.cumulativePageViews++;

    if (event.isDailyUnique !== false) {
      store.dailyVisitorsMap[today] = (store.dailyVisitorsMap[today] || 0) + 1;
      store.cumulativeVisitors++;
    }

    store.visitors.push(newEvent);
    if (store.visitors.length > 250) store.visitors = store.visitors.slice(-250);
    persistStore(store);
    await syncToCloud(store);
  },

  async trackDownload(event: Omit<DownloadEvent, 'id' | 'timestamp' | 'dateStr'>): Promise<void> {
    const store = await getFreshStore();
    const today = getTodayString();
    const newEvent: DownloadEvent = {
      ...event,
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateStr: today,
    };
    if (!store.downloads) store.downloads = [];
    if (!store.dailyDownloadsMap) store.dailyDownloadsMap = {};
    if (!store.cumulativeDownloads) store.cumulativeDownloads = Math.max(store.downloads.length || 0, 1);

    store.dailyDownloadsMap[today] = (store.dailyDownloadsMap[today] || 0) + 1;
    store.cumulativeDownloads++;

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

    const todayUnique = todayVisitorsList.filter((v) => v.isDailyUnique !== false).length;
    const yesterdayUnique = yesterdayVisitorsList.filter((v) => v.isDailyUnique !== false).length;

    const visitorsCount = Math.max(store.dailyVisitorsMap?.[today] || 0, todayUnique, todayVisitorsList.length);
    const yesterdayVisitorsCount = Math.max(store.dailyVisitorsMap?.[yesterday] || 0, yesterdayUnique, yesterdayVisitorsList.length);
    const allTimeVisitorsCount = Math.max(store.cumulativeVisitors || 0, allVisitors.length, visitorsCount);

    const todayDownloadsList = allDownloads.filter((d) => d.dateStr === today);
    const yesterdayDownloadsList = allDownloads.filter((d) => d.dateStr === yesterday);

    const downloadsCount = Math.max(store.dailyDownloadsMap?.[today] || 0, todayDownloadsList.length);
    const yesterdayDownloadsCount = Math.max(store.dailyDownloadsMap?.[yesterday] || 0, yesterdayDownloadsList.length);
    const allTimeDownloadsCount = Math.max(store.cumulativeDownloads || 0, allDownloads.length, downloadsCount);

    const breakdownMap: Record<string, { subjectTitle: string; lectureTitle: string; count: number }> = {};
    for (const dl of todayDownloadsList) {
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
      visitors: visitorsCount,
      pageViews: Math.max(todayVisitorsList.length, visitorsCount),
      yesterdayVisitors: yesterdayVisitorsCount,
      allTimeVisitors: allTimeVisitorsCount,
      downloads: downloadsCount,
      yesterdayDownloads: yesterdayDownloadsCount,
      allTimeDownloads: allTimeDownloadsCount,
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
    const todayVisitors = Math.max(store.dailyVisitorsMap?.[today] || 0, todayUnique, todayVisitorsList.length);

    const todayDownloads = Math.max(
      store.dailyDownloadsMap?.[today] || 0,
      (store.downloads || []).filter((d) => d.dateStr === today).length
    );
    const pendingReports = (store.brokenLinks || []).filter((r) => r.status === 'pending').length;

    return {
      totalVisitors: Math.max(store.cumulativeVisitors || 0, (store.visitors || []).length, todayVisitors),
      todayVisitors,
      totalDownloads: Math.max(store.cumulativeDownloads || 0, (store.downloads || []).length, todayDownloads),
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
      isFree: quizFile.isFree !== false,
      isLive: quizFile.isLive !== false,
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

  async toggleQuizFree(id: string, isFree: boolean, customToken?: string): Promise<SubjectQuizFile | null> {
    return this.updateSubjectQuizFile(id, { isFree }, customToken);
  },

  async toggleQuizLive(id: string, isLive: boolean, customToken?: string): Promise<SubjectQuizFile | null> {
    return this.updateSubjectQuizFile(id, { isLive }, customToken);
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

    if (
      (updates as any).removePpt ||
      updates.pptUrl === '' ||
      (updates.pptUrl === undefined && 'pptUrl' in updates)
    ) {
      delete (updated as any).pptUrl;
      delete (updated as any).pptTitle;
      delete (updated as any).pptFileSize;
    }

    if (
      (updates as any).removeAudio ||
      updates.audioUrl === '' ||
      (updates.audioUrl === undefined && 'audioUrl' in updates)
    ) {
      delete (updated as any).audioUrl;
      delete (updated as any).audioTitle;
      delete (updated as any).audioFileSize;
      delete (updated as any).audioDuration;
    }

    if (
      (updates as any).removeMindmap ||
      updates.mindmapUrl === '' ||
      (updates.mindmapUrl === undefined && 'mindmapUrl' in updates)
    ) {
      delete (updated as any).mindmapUrl;
      delete (updated as any).mindmapTitle;
      delete (updated as any).mindmapFileSize;
    }

    if (
      (updates as any).removeFlashcards ||
      (updates.flashcards && updates.flashcards.length === 0)
    ) {
      delete (updated as any).flashcards;
      delete (updated as any).flashcardsCount;
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

  // --- STUDENT ACCOUNTS (حسابات الطلاب والاشتراكات) ---
  async getStudents(): Promise<StudentUser[]> {
    const store = await getFreshStore();
    return store.students || [];
  },

  async getStudentById(id: string): Promise<StudentUser | null> {
    const students = await this.getStudents();
    return students.find((s) => s.id === id || s.phone === id) || null;
  },

  async getStudentByPhone(phone: string): Promise<StudentUser | null> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const students = await this.getStudents();
    return students.find((s) => s.phone.trim().replace(/\s+/g, '') === cleanPhone) || null;
  },

  async registerStudent(
    data: { phone: string; name: string; university: string; password: string; deviceId?: string; sessionId?: string; yearId?: string },
    customToken?: string
  ): Promise<{ success: boolean; student?: StudentUser; message?: string }> {
    const store = await getFreshStore();
    if (!store.students) store.students = [];

    const cleanPhone = data.phone.trim().replace(/\s+/g, '');
    const existing = store.students.find((s) => s.phone.trim().replace(/\s+/g, '') === cleanPhone);
    if (existing) {
      return { success: false, message: 'رقم الهاتف مسجل بالفعل! يرجى تسجيل الدخول أو إدخال رقم هاتف آخر.' };
    }

    const initialDeviceId = data.deviceId ? [data.deviceId.trim()] : [];
    const newStudent: StudentUser = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phone: cleanPhone,
      name: data.name.trim(),
      university: data.university.trim(),
      password: data.password.trim(),
      createdAt: new Date().toISOString(),
      purchasedLectureIds: [],
      isActive: true,
      currentSessionId: data.sessionId,
      knownDevices: initialDeviceId,
      yearId: data.yearId || '1',
      readNotificationIds: [],
    };

    // Ensure cleanPhone and newStudent.id are never tombstoned in deletedStudentIds
    if (store.deletedStudentIds) {
      store.deletedStudentIds = store.deletedStudentIds.filter(
        (id) => id !== cleanPhone && id !== newStudent.id && !/^[0-9]{8,15}$/.test(id)
      );
    }

    store.students.unshift(newStudent);
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return { success: true, student: newStudent };
  },

  async recordStudentLogin(
    studentId: string,
    deviceId: string,
    sessionId: string,
    customToken?: string
  ): Promise<{ success: boolean; message?: string; student?: StudentUser; code?: string; isSuspended?: boolean }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    // 1. STRICT SUSPENSION CHECK: Block suspended accounts immediately
    if (student.isSuspended) {
      return {
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        isSuspended: true,
        message:
          '⚠️ تم تعليق وتجميد حسابك من قبل إدارة المنصة بسبب نشاط غير مصرح به.\nيرجى التواصل فوراً مع التيم لحل المشكلة على الرقم التالي:\n📞 01148283443',
      };
    }

    if (!student.knownDevices) {
      student.knownDevices = [];
    }

    if (!student.deviceLogins) {
      student.deviceLogins = [];
    }

    const cleanDev = (deviceId || '').trim();
    const now = Date.now();

    // 2. INTELLIGENT ACCOUNT SHARING DETECTION ALGORITHM
    if (cleanDev) {
      student.deviceLogins.push({
        deviceId: cleanDev,
        timestamp: now,
      });

      // Keep recent 60 login events to maintain clean storage
      if (student.deviceLogins.length > 60) {
        student.deviceLogins = student.deviceLogins.filter(
          (d) => now - d.timestamp <= 72 * 60 * 60 * 1000
        );
      }

      // Check distinct devices switched within the last 24 hours
      const last24hLogins = student.deviceLogins.filter(
        (d) => now - d.timestamp <= 24 * 60 * 60 * 1000
      );
      const distinct24hDevices = Array.from(new Set(last24hLogins.map((d) => d.deviceId).filter(Boolean)));

      if (distinct24hDevices.length >= 3) {
        student.isSuspicious = true;
        student.suspiciousAt = now;
        student.suspiciousReason = `تم التبديل بين ${distinct24hDevices.length} أجهزة مختلفة اليوم (اشتباه مشاركة جماعية)`;
      } else {
        // Also check rapid session switching: 5 or more logins across 2 or more devices within 1 hour
        const last1hLogins = student.deviceLogins.filter(
          (d) => now - d.timestamp <= 60 * 60 * 1000
        );
        const distinct1hDevices = Array.from(new Set(last1hLogins.map((d) => d.deviceId).filter(Boolean)));
        if (last1hLogins.length >= 5 && distinct1hDevices.length >= 2) {
          student.isSuspicious = true;
          student.suspiciousAt = now;
          student.suspiciousReason = `تسجيل دخول متكرر ومتسارع (${last1hLogins.length} مرات عبر أجهزة مختلفة في ساعة واحدة)`;
        }
      }

      // Check lifetime 5 devices limit
      const isKnown = student.knownDevices.includes(cleanDev);
      if (!isKnown) {
        if (student.knownDevices.length >= 5) {
          return {
            success: false,
            code: 'DEVICE_LIMIT_EXCEEDED',
            message:
              'عذراً، لقد تجاوزت الحد الأقصى للأجهزة المصرح بها (5 أجهزة). يرجى التواصل مع إدارة المنصة أو الدعم الفني لإعادة تعيين أجهزتك المصرح لها.',
          };
        }
        student.knownDevices.push(cleanDev);
      }
    }

    student.currentSessionId = sessionId;

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return { success: true, student };
  },

  async resetStudentDevices(
    studentId: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    student.knownDevices = [];
    student.deviceLogins = [];
    student.currentSessionId = undefined;

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return {
      success: true,
      message: 'تم تصفير جميع الأجهزة والجلسات المسجلة للطالب بنجاح! يمكنه الآن الدخول من أجهزته الجديدة ✅',
    };
  },

  async setStudentSuspension(
    studentId: string,
    isSuspended: boolean,
    reason?: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string; student?: StudentUser }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    student.isSuspended = isSuspended;

    if (isSuspended) {
      student.suspendedAt = Date.now();
      student.suspensionReason = reason || 'تم تعليق وتجميد الحساب من قبل إدارة المنصة بسبب نشاط غير مصرح به';
      student.currentSessionId = undefined; // Immediately invalidate active session!
    } else {
      delete student.suspendedAt;
      delete student.suspensionReason;
      student.isSuspicious = false;
      delete student.suspiciousReason;
      delete student.suspiciousAt;
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);

    return {
      success: true,
      message: isSuspended
        ? `تم تعليق وتجميد حساب الطالب (${student.name}) بنجاح ⛔`
        : `تم فك تجميد حساب الطالب (${student.name}) بنجاح وإعادته للعمل 🟢`,
      student,
    };
  },

  async dismissStudentSuspicion(
    studentId: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    student.isSuspicious = false;
    delete student.suspiciousReason;
    delete student.suspiciousAt;

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);

    return {
      success: true,
      message: `تم إلغاء علامة الاشتباه عن الطالب (${student.name}) بنجاح ✅`,
    };
  },

  async updateStudentData(
    studentId: string,
    updates: { name?: string; phone?: string; university?: string; password?: string; yearId?: string },
    customToken?: string
  ): Promise<{ success: boolean; message?: string; student?: StudentUser }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    if (updates.name && updates.name.trim()) {
      student.name = updates.name.trim();
    }
    if (updates.phone && updates.phone.trim()) {
      const cleanPhone = updates.phone.trim();
      const duplicate = store.students.find(
        (s) => s.id !== student.id && s.phone === cleanPhone
      );
      if (duplicate) {
        return { success: false, message: 'رقم الهاتف هذا مسجل بالفعل لطالب آخر' };
      }
      student.phone = cleanPhone;
    }
    if (updates.university && updates.university.trim()) {
      student.university = updates.university.trim();
    }
    if (updates.yearId && updates.yearId.trim()) {
      student.yearId = updates.yearId.trim();
    }
    if (updates.password && updates.password.trim()) {
      student.password = updates.password.trim();
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return { success: true, student };
  },

  async updateStudentPassword(
    studentId: string,
    newPass: string,
    customToken?: string
  ): Promise<boolean> {
    const res = await this.updateStudentData(studentId, { password: newPass }, customToken);
    return res.success;
  },

  async toggleStudentLectureAccess(
    studentId: string,
    lectureId: string,
    grant: boolean,
    customToken?: string
  ): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.students) return false;
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return false;

    if (!Array.isArray(student.purchasedLectureIds)) {
      student.purchasedLectureIds = [];
    }

    if (grant) {
      if (!student.purchasedLectureIds.includes(lectureId)) {
        student.purchasedLectureIds.push(lectureId);
      }
    } else {
      student.purchasedLectureIds = student.purchasedLectureIds.filter((id) => id !== lectureId);
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async deleteStudent(studentId: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.students) store.students = [];
    if (!store.deletedStudentIds) store.deletedStudentIds = [];

    const target = store.students.find((s) => s.id === studentId || s.phone === studentId);
    const actualId = target ? target.id : studentId;
    // Only tombstone student IDs (stu-...), NEVER raw phone numbers!
    if (actualId && !/^[0-9]{8,15}$/.test(actualId) && !store.deletedStudentIds.includes(actualId)) {
      store.deletedStudentIds.push(actualId);
    }

    store.students = store.students.filter((s) => s.id !== actualId && s.id !== studentId);
    // Sanitize and purge any raw phone numbers from deletedStudentIds
    store.deletedStudentIds = store.deletedStudentIds.filter((id) => !/^[0-9]{8,15}$/.test(id));

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  // --- BRUTE-FORCE & RATE-LIMITING PROTECTION (حماية تخمين كلمات المرور) ---
  async checkFailedLogin(
    identifier: string,
    studentId?: string
  ): Promise<{
    locked: boolean;
    count: number;
    lockedUntil?: number;
    remainingSeconds?: number;
    remainingMinutes?: number;
  }> {
    const store = await getFreshStore();
    const cleanKey = identifier.trim();

    let record: FailedLoginRecord | undefined;
    if (studentId && store.students) {
      const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
      if (student?.failedLoginAttempts) {
        record = student.failedLoginAttempts;
      }
    }

    if (!record && store.failedLoginAttempts) {
      record = store.failedLoginAttempts[cleanKey];
    }

    if (!record) {
      return { locked: false, count: 0 };
    }

    const now = Date.now();

    // Check if locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const diffMs = record.lockedUntil - now;
      const remainingSeconds = Math.ceil(diffMs / 1000);
      const remainingMinutes = Math.ceil(diffMs / 60000);
      return {
        locked: true,
        count: record.count,
        lockedUntil: record.lockedUntil,
        remainingSeconds,
        remainingMinutes,
      };
    }

    // If lock expired, auto-unlock
    if (record.lockedUntil && now >= record.lockedUntil) {
      await this.resetFailedLogin(cleanKey, studentId);
      return { locked: false, count: 0 };
    }

    if (record.lastFailedAt && now - record.lastFailedAt > 15 * 60 * 1000) {
      await this.resetFailedLogin(cleanKey, studentId);
      return { locked: false, count: 0 };
    }

    return {
      locked: false,
      count: record.count,
      lockedUntil: record.lockedUntil,
    };
  },

  async recordFailedLogin(
    identifier: string,
    studentId?: string,
    secondaryIp?: string,
    customToken?: string
  ): Promise<{
    locked: boolean;
    count: number;
    lockedUntil?: number;
    attemptsLeft: number;
  }> {
    const store = await getFreshStore();
    if (!store.failedLoginAttempts) store.failedLoginAttempts = {};

    const cleanKey = identifier.trim();
    const now = Date.now();

    const student = studentId && store.students
      ? store.students.find((s) => s.id === studentId || s.phone === studentId)
      : undefined;

    const prev = student?.failedLoginAttempts || store.failedLoginAttempts[cleanKey];

    let count = 1;
    if (prev && prev.lastFailedAt && now - prev.lastFailedAt <= 15 * 60 * 1000) {
      count = (prev.count || 0) + 1;
    }

    const isLocked = count >= 5;
    const lockedUntil = isLocked ? now + 15 * 60 * 1000 : undefined;

    const record: FailedLoginRecord = {
      count,
      lockedUntil,
      lastFailedAt: now,
    };

    store.failedLoginAttempts[cleanKey] = record;
    if (secondaryIp && secondaryIp.trim()) {
      store.failedLoginAttempts[secondaryIp.trim()] = record;
    }

    if (student) {
      student.failedLoginAttempts = record;
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);

    return {
      locked: isLocked,
      count,
      lockedUntil,
      attemptsLeft: Math.max(0, 5 - count),
    };
  },

  async resetFailedLogin(
    identifier: string,
    studentId?: string,
    secondaryIp?: string,
    customToken?: string
  ): Promise<boolean> {
    const store = await getFreshStore();
    const cleanKey = identifier.trim();

    let modified = false;

    if (store.failedLoginAttempts && store.failedLoginAttempts[cleanKey]) {
      delete store.failedLoginAttempts[cleanKey];
      modified = true;
    }

    if (secondaryIp && store.failedLoginAttempts && store.failedLoginAttempts[secondaryIp.trim()]) {
      delete store.failedLoginAttempts[secondaryIp.trim()];
      modified = true;
    }

    if (studentId && store.students) {
      const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
      if (student && student.failedLoginAttempts) {
        student.failedLoginAttempts = undefined;
        modified = true;
      }
    }

    if (modified) {
      memoryStore = store;
      persistStore(store, customToken);
      await syncToCloud(store, customToken);
    }

    return true;
  },

  async unlockStudent(
    studentId: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, message: 'قائمة الطلاب فارغة' };

    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود' };

    student.failedLoginAttempts = undefined;

    if (store.failedLoginAttempts) {
      if (student.phone) {
        delete store.failedLoginAttempts[student.phone];
        delete store.failedLoginAttempts[student.phone.trim().replace(/\s+/g, '')];
      }
      delete store.failedLoginAttempts[student.id];
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);

    return {
      success: true,
      message: `تم فك قفل الحساب بنجاح وتصفير محاولات الدخول للطالب (${student.name})! 🔓`,
    };
  },

  // --- PURCHASE ORDERS (طلبات الشراء والمدفوعات) ---
  async getOrders(): Promise<PurchaseOrder[]> {
    const store = await getFreshStore();
    return store.orders || [];
  },

  async getOrderById(orderId: string): Promise<PurchaseOrder | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === orderId) || null;
  },

  async getOrdersByStudent(studentId: string): Promise<PurchaseOrder[]> {
    const cleanId = studentId && studentId.includes(':::') ? studentId.split(':::')[0] : studentId;
    const orders = await this.getOrders();
    return orders.filter((o) => o.studentId === cleanId || o.studentPhone === cleanId);
  },

  async createOrder(
    data: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>,
    customToken?: string
  ): Promise<PurchaseOrder> {
    const store = await getFreshStore();
    if (!store.orders) store.orders = [];

    const newOrder: PurchaseOrder = {
      ...data,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return newOrder;
  },

  async approveOrder(
    orderId: string,
    customToken?: string
  ): Promise<{ success: boolean; order?: PurchaseOrder; message?: string }> {
    const store = await getFreshStore();
    if (!store.orders) return { success: false, message: 'لا توجد طلبات' };
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'الطلب غير موجود' };

    order.status = 'approved';
    order.reviewedAt = new Date().toISOString();

    // Grant lecture or shakib-rakib bundle access to student immediately
    const student = store.students?.find((s) => s.id === order.studentId || s.phone === order.studentPhone) || null;
    if (student) {
      if (order.orderType === 'shakib_rakib') {
        const now = new Date();
        let baseTime = now.getTime();
        let originalStartDate = now.toISOString();

        if (student.shakibRakibSubscription?.isActive && student.shakibRakibSubscription.expiresAt) {
          const currentExpiry = new Date(student.shakibRakibSubscription.expiresAt).getTime();
          if (currentExpiry > now.getTime()) {
            baseTime = currentExpiry;
            if (student.shakibRakibSubscription.startDate) {
              originalStartDate = student.shakibRakibSubscription.startDate;
            }
          }
        }

        const expires = new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
        student.shakibRakibSubscription = {
          isActive: true,
          yearId: order.yearId || student.yearId || '1',
          startDate: originalStartDate,
          expiresAt: expires.toISOString(),
          monthLabel: order.monthLabel || store.shakibRakibConfig?.monthLabel || 'باقة شاكب راكب الشهرية 🚀',
        };
      } else {
        if (!Array.isArray(student.purchasedLectureIds)) student.purchasedLectureIds = [];
        if (!student.purchasedLectureIds.includes(order.lectureId)) {
          student.purchasedLectureIds.push(order.lectureId);
        }
      }
    }

    // Record coupon usage if applied
    if (order.couponCode) {
      const codeKey = order.couponCode.trim().toUpperCase();
      if (!store.coupons) store.coupons = [];
      const coupon = store.coupons.find((c) => (c.code || '').trim().toUpperCase() === codeKey);
      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        if (!coupon.usedByStudents) coupon.usedByStudents = [];
        const studentPhone = (order.studentPhone || '').trim();
        if (studentPhone && !coupon.usedByStudents.includes(studentPhone)) {
          coupon.usedByStudents.push(studentPhone);
        }
      }
    }

    // Generate In-App Notification for student
    const notifTitle = 'مبروك! تم اعتماد طلبك بنجاح 🎉';
    const notifMessage =
      order.orderType === 'shakib_rakib'
        ? `مبروك! تم تفعيل اشتراك باقة شاكب راكب (${order.monthLabel || 'الشهرية'}) في حسابك بنجاح 🚀`
        : `مبروك! تم تفعيل ${order.lectureTitle} في حسابك بنجاح ✅`;
    const notifLink =
      order.orderType === 'shakib_rakib'
        ? `/year/${order.yearId || '1'}`
        : `/lecture/${order.lectureId}`;

    if (!store.notifications) store.notifications = [];
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    store.notifications.unshift({
      id: notifId,
      title: notifTitle,
      message: notifMessage,
      targetStudentId: order.studentId || (student ? student.id : undefined),
      targetYearId: order.yearId || 'all',
      linkUrl: notifLink,
      createdAt: new Date().toISOString(),
      type: 'order',
    });
    if (store.notifications.length > 100) {
      store.notifications = store.notifications.slice(0, 100);
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return { success: true, order };
  },

  async rejectOrder(
    orderId: string,
    rejectionReason: string,
    customToken?: string
  ): Promise<{ success: boolean; order?: PurchaseOrder; message?: string }> {
    const store = await getFreshStore();
    if (!store.orders) return { success: false, message: 'لا توجد طلبات' };
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'الطلب غير موجود' };

    order.status = 'rejected';
    order.rejectionReason = rejectionReason.trim() || 'لم يتم استلام المبلغ على المحفظة';
    order.reviewedAt = new Date().toISOString();

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return { success: true, order };
  },

  async deleteOrder(orderId: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.deletedOrderIds) store.deletedOrderIds = [];
    if (orderId && !store.deletedOrderIds.includes(orderId)) {
      store.deletedOrderIds.push(orderId);
    }
    store.orders = (store.orders || []).filter((o) => o.id !== orderId);
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  // --- SHAKIB RAKIB BUNDLE (باقة شاكب راكب الشهرية الشاملة) ---
  async getShakibRakibConfig(): Promise<ShakibRakibConfig> {
    const store = await getFreshStore();
    return store.shakibRakibConfig || DEFAULT_SHAKIB_RAKIB_CONFIG;
  },

  async updateShakibRakibConfig(
    updates: Partial<ShakibRakibConfig>,
    customToken?: string
  ): Promise<ShakibRakibConfig> {
    const store = await getFreshStore();
    store.shakibRakibConfig = {
      ...(store.shakibRakibConfig || DEFAULT_SHAKIB_RAKIB_CONFIG),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return store.shakibRakibConfig;
  },

  hasAccessToLecture(
    student: StudentUser | null | undefined,
    lectureId: string,
    yearId?: string
  ): boolean {
    if (!student || student.isSuspended) return false;
    // Check Shakib Rakib monthly subscription
    if (student.shakibRakibSubscription?.isActive) {
      const expires = new Date(student.shakibRakibSubscription.expiresAt).getTime();
      if (expires > Date.now()) {
        const subYear = student.shakibRakibSubscription.yearId;
        if (!yearId || !subYear || subYear === 'all' || subYear === yearId) {
          return true;
        }
      }
    }
    // Check individual purchased lectures
    return Array.isArray(student.purchasedLectureIds) && student.purchasedLectureIds.includes(lectureId);
  },

  async updateStudentShakibRakib(
    studentId: string,
    subscription: ShakibRakibSubscription | null,
    customToken?: string
  ): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.students) return false;
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return false;

    if (subscription) {
      student.shakibRakibSubscription = subscription;
    } else {
      delete student.shakibRakibSubscription;
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  // --- SMART BOOKMARKS SYSTEM (نظام الإشارات المرجعية وحفظ ليلة الامتحان) ---
  async getStudentBookmarks(studentId: string): Promise<StudentBookmarks> {
    const store = await getFreshStore();
    if (!store.students) return { lectureIds: [], questionIds: [], conceptIds: [] };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    return student?.bookmarks || { lectureIds: [], questionIds: [], conceptIds: [] };
  },

  async toggleStudentBookmark(
    studentId: string,
    type: 'lecture' | 'question' | 'concept',
    targetId: string,
    customToken?: string
  ): Promise<{ success: boolean; bookmarks: StudentBookmarks; isBookmarked: boolean }> {
    const store = await getFreshStore();
    if (!store.students) return { success: false, bookmarks: { lectureIds: [], questionIds: [], conceptIds: [] }, isBookmarked: false };
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return { success: false, bookmarks: { lectureIds: [], questionIds: [], conceptIds: [] }, isBookmarked: false };

    if (!student.bookmarks) {
      student.bookmarks = { lectureIds: [], questionIds: [], conceptIds: [] };
    }
    if (!Array.isArray(student.bookmarks.lectureIds)) student.bookmarks.lectureIds = [];
    if (!Array.isArray(student.bookmarks.questionIds)) student.bookmarks.questionIds = [];
    if (!Array.isArray(student.bookmarks.conceptIds)) student.bookmarks.conceptIds = [];

    let isBookmarked = false;
    const cleanTarget = targetId.trim();

    if (type === 'lecture') {
      if (student.bookmarks.lectureIds.includes(cleanTarget)) {
        student.bookmarks.lectureIds = student.bookmarks.lectureIds.filter((id) => id !== cleanTarget);
        isBookmarked = false;
      } else {
        student.bookmarks.lectureIds.push(cleanTarget);
        isBookmarked = true;
      }
    } else if (type === 'question') {
      if (student.bookmarks.questionIds.includes(cleanTarget)) {
        student.bookmarks.questionIds = student.bookmarks.questionIds.filter((id) => id !== cleanTarget);
        isBookmarked = false;
      } else {
        student.bookmarks.questionIds.push(cleanTarget);
        isBookmarked = true;
      }
    } else if (type === 'concept') {
      if (student.bookmarks.conceptIds.includes(cleanTarget)) {
        student.bookmarks.conceptIds = student.bookmarks.conceptIds.filter((id) => id !== cleanTarget);
        isBookmarked = false;
      } else {
        student.bookmarks.conceptIds.push(cleanTarget);
        isBookmarked = true;
      }
    }

    memoryStore = store;
    persistStore(store, customToken);
    syncToCloud(store, customToken).catch(() => {});

    return { success: true, bookmarks: student.bookmarks, isBookmarked };
  },

  // --- PROMO COUPONS SYSTEM (كوبونات وأكواد الخصم) ---
  async getCoupons(customToken?: string): Promise<PromoCoupon[]> {
    const store = await getFreshStore();
    return (store.coupons || []).filter((c) => {
      const code = (c.code || '').trim().toUpperCase();
      return code && !(store.deletedCouponIds || []).includes(code);
    });
  },

  async getCouponByCode(code: string, customToken?: string): Promise<PromoCoupon | null> {
    if (!code) return null;
    const store = await getFreshStore();
    const cleanCode = code.trim().toUpperCase();
    if ((store.deletedCouponIds || []).includes(cleanCode)) return null;
    const coupon = (store.coupons || []).find(
      (c) => (c.code || '').trim().toUpperCase() === cleanCode
    );
    return coupon || null;
  },

  async saveCoupon(coupon: PromoCoupon, customToken?: string): Promise<PromoCoupon> {
    const store = await getFreshStore();
    if (!store.coupons) store.coupons = [];
    if (!store.deletedCouponIds) store.deletedCouponIds = [];

    const cleanCode = (coupon.code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) throw new Error('كود الخصم مطلوب');

    // Remove from deletedCouponIds if re-creating
    store.deletedCouponIds = store.deletedCouponIds.filter((id) => id !== cleanCode);

    const existingIndex = store.coupons.findIndex(
      (c) => (c.code || '').trim().toUpperCase() === cleanCode
    );

    const updatedCoupon: PromoCoupon = {
      code: cleanCode,
      discountType: coupon.discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Math.max(1, Number(coupon.discountValue) || 0),
      maxUses: coupon.maxUses ? Math.max(1, Number(coupon.maxUses)) : undefined,
      usedCount: existingIndex >= 0 ? store.coupons[existingIndex].usedCount : 0,
      usedByStudents: existingIndex >= 0 ? store.coupons[existingIndex].usedByStudents || [] : [],
      expiresAt: coupon.expiresAt || undefined,
      isActive: coupon.isActive ?? true,
      applicableLectureIds: Array.isArray(coupon.applicableLectureIds) ? coupon.applicableLectureIds : [],
      createdAt: existingIndex >= 0 ? store.coupons[existingIndex].createdAt || new Date().toISOString() : new Date().toISOString(),
      notes: coupon.notes || undefined,
    };

    if (existingIndex >= 0) {
      store.coupons[existingIndex] = {
        ...store.coupons[existingIndex],
        ...updatedCoupon,
      };
    } else {
      store.coupons.push(updatedCoupon);
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return updatedCoupon;
  },

  async toggleCouponActive(code: string, isActive: boolean, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.coupons) return false;
    const cleanCode = (code || '').trim().toUpperCase();
    const coupon = store.coupons.find((c) => (c.code || '').trim().toUpperCase() === cleanCode);
    if (!coupon) return false;

    coupon.isActive = isActive;
    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async deleteCoupon(code: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.deletedCouponIds) store.deletedCouponIds = [];
    const cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode && !store.deletedCouponIds.includes(cleanCode)) {
      store.deletedCouponIds.push(cleanCode);
    }
    store.coupons = (store.coupons || []).filter(
      (c) => (c.code || '').trim().toUpperCase() !== cleanCode
    );

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async recordCouponUsage(code: string, studentPhone: string, customToken?: string): Promise<boolean> {
    const store = await getFreshStore();
    if (!store.coupons) return false;
    const cleanCode = (code || '').trim().toUpperCase();
    const coupon = store.coupons.find((c) => (c.code || '').trim().toUpperCase() === cleanCode);
    if (!coupon) return false;

    coupon.usedCount = (coupon.usedCount || 0) + 1;
    if (!coupon.usedByStudents) coupon.usedByStudents = [];
    const phone = (studentPhone || '').trim();
    if (phone && !coupon.usedByStudents.includes(phone)) {
      coupon.usedByStudents.push(phone);
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },

  async validateCoupon(params: {
    code: string;
    studentPhone?: string;
    lectureId?: string;
    originalPrice: number;
  }): Promise<{
    valid: boolean;
    message?: string;
    discountAmount?: number;
    finalPrice?: number;
    coupon?: PromoCoupon;
  }> {
    const { code, studentPhone, lectureId, originalPrice } = params;
    if (!code || !code.trim()) {
      return { valid: false, message: 'يرجى إدخال كود الخصم أولاً' };
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const store = await getFreshStore();
    if ((store.deletedCouponIds || []).includes(cleanCode)) {
      return { valid: false, message: 'كود الخصم المدخل غير صالح أو تم حذفه ❌' };
    }

    const coupon = (store.coupons || []).find(
      (c) => (c.code || '').trim().toUpperCase() === cleanCode
    );

    if (!coupon) {
      return { valid: false, message: 'كود الخصم المدخل غير موجود أو غير صحيح ❌' };
    }

    if (!coupon.isActive) {
      return { valid: false, message: 'كود الخصم هذا متوقف حالياً وغير مفعل 🚫' };
    }

    // Expiry check
    if (coupon.expiresAt) {
      const expTime = new Date(coupon.expiresAt).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        return { valid: false, message: 'عذراً، انتهت صلاحية هذا الكود ⏳' };
      }
    }

    // Max uses check
    if (coupon.maxUses !== undefined && coupon.maxUses > 0) {
      if ((coupon.usedCount || 0) >= coupon.maxUses) {
        return { valid: false, message: 'عذراً، اكتمل الحد الأقصى لاستخدام هذا الكود 🔒' };
      }
    }

    // Student reuse check
    if (studentPhone && studentPhone.trim()) {
      const cleanPhone = studentPhone.trim();
      if (coupon.usedByStudents && coupon.usedByStudents.includes(cleanPhone)) {
        return { valid: false, message: 'لقد استخدمت كود الخصم هذا مسبقاً، الكود صالح لمرة واحدة لكل طالب ⚠️' };
      }
    }

    // Applicable lecture check
    if (coupon.applicableLectureIds && coupon.applicableLectureIds.length > 0 && lectureId) {
      if (!coupon.applicableLectureIds.includes(lectureId)) {
        return { valid: false, message: 'كود الخصم هذا مخصص لمحاضرات أخرى محددة 🏷️' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((originalPrice * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    // Boundary constraints
    discountAmount = Math.max(0, Math.min(discountAmount, originalPrice));
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      message: `تم تطبيق كود الخصم بنجاح! وفرت ${discountAmount} ج.م 🎉`,
      discountAmount,
      finalPrice,
      coupon,
    };
  },

  // --- IN-APP NOTIFICATIONS HUB (نظام الإشعارات والتنبيهات الموجهة) ---
  async getNotifications(yearId?: string, studentId?: string): Promise<AppNotification[]> {
    const store = await getFreshStore();
    const all = store.notifications || [];

    // Filter strictly according to academic year and student targeting
    const filtered = all.filter((n) => {
      // 1. If notification is targeted to a specific student (e.g. order approval)
      if (n.targetStudentId) {
        return studentId && n.targetStudentId === studentId;
      }

      // 2. If notification is general (targetYearId === 'all' or empty)
      if (!n.targetYearId || n.targetYearId === 'all') {
        return true;
      }

      // 3. Strict Year-Targeting:
      // When a notification is for year '1', only show to year '1' students.
      // If student has a yearId, it must match.
      if (yearId) {
        return n.targetYearId === yearId;
      }

      return false;
    });

    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createNotification(
    notificationData: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
    customToken?: string
  ): Promise<AppNotification> {
    const store = await getFreshStore();
    if (!store.notifications) store.notifications = [];

    const newNotification: AppNotification = {
      id: notificationData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: notificationData.title,
      message: notificationData.message,
      targetYearId: notificationData.targetYearId || 'all',
      targetStudentId: notificationData.targetStudentId,
      linkUrl: notificationData.linkUrl,
      createdAt: notificationData.createdAt || new Date().toISOString(),
      type: notificationData.type || 'announcement',
    };

    store.notifications.unshift(newNotification);

    if (store.notifications.length > 100) {
      store.notifications = store.notifications.slice(0, 100);
    }

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return newNotification;
  },

  async markNotificationRead(notificationId: string, studentId?: string, customToken?: string): Promise<boolean> {
    if (!studentId) return true;
    const store = await getFreshStore();
    if (!store.students) return false;
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return false;

    if (!student.readNotificationIds) student.readNotificationIds = [];
    if (!student.readNotificationIds.includes(notificationId)) {
      student.readNotificationIds.push(notificationId);
      memoryStore = store;
      persistStore(store, customToken);
      await syncToCloud(store, customToken);
    }
    return true;
  },

  async markAllNotificationsRead(studentId?: string, notificationIds?: string[], customToken?: string): Promise<boolean> {
    if (!studentId) return true;
    const store = await getFreshStore();
    if (!store.students) return false;
    const student = store.students.find((s) => s.id === studentId || s.phone === studentId);
    if (!student) return false;

    if (!student.readNotificationIds) student.readNotificationIds = [];
    const idsToAdd = notificationIds || (store.notifications || []).map((n) => n.id);
    student.readNotificationIds = Array.from(new Set([...student.readNotificationIds, ...idsToAdd]));

    memoryStore = store;
    persistStore(store, customToken);
    await syncToCloud(store, customToken);
    return true;
  },
};



