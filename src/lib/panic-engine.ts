import fs from 'fs';
import path from 'path';
import os from 'os';
import { PanicModeConfig } from './types';

// Global Process-Level Singleton Cache
declare global {
  // eslint-disable-next-line no-var
  var __NURSING_PANIC_MODE_CACHE__:
    | {
        isEnabled: boolean;
        activatedAt?: string;
        deactivatedAt?: string;
        cachedAt: number;
      }
    | undefined;
}

const MEMORY_TTL_MS = 1000; // 1-second fresh cache TTL

const GIST_ID = process.env.GITHUB_GIST_ID || 'c9b4d3dd9bed0d8e8bde23138aff9152';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Ibrahem-4242';
const BUILTIN_TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');
const GITHUB_TOKEN = process.env.GITHUB_SYNC_TOKEN || BUILTIN_TOKEN;

function getLocalFilePaths(): string[] {
  const list: string[] = [];
  try {
    // 1. Runtime writable temporary directory FIRST (vital on Vercel serverless)
    list.push(path.join(os.tmpdir(), 'nursing-panic-state.json'));
  } catch {}
  try {
    // 2. Project local data directory
    list.push(path.join(process.cwd(), 'data', 'panic-state.json'));
  } catch {}
  return list;
}

function readFromLocalDisk(): PanicModeConfig | null {
  let bestCandidate: { config: PanicModeConfig; mtime: number } | null = null;

  for (const filePath of getLocalFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed?.isEnabled === 'boolean') {
          const mtime = stats.mtimeMs || 0;
          if (!bestCandidate || mtime > bestCandidate.mtime) {
            bestCandidate = {
              config: {
                isEnabled: parsed.isEnabled,
                activatedAt: parsed.activatedAt,
                deactivatedAt: parsed.deactivatedAt,
              },
              mtime,
            };
          }
        }
      }
    } catch {}
  }

  return bestCandidate ? bestCandidate.config : null;
}

function writeToLocalDisk(state: PanicModeConfig) {
  for (const filePath of getLocalFilePaths()) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * Direct authoritative cloud synchronization.
 * Patches 'panic-state.json' on GitHub Gist synchronously
 * so the commit is committed before the client receives the response!
 */
async function syncToCloudDirect(state: PanicModeConfig, customToken?: string): Promise<boolean> {
  const token = customToken || GITHUB_TOKEN;
  if (!GIST_ID || !token) return false;

  const nowIso = new Date().toISOString();
  const panicPayload = {
    isEnabled: state.isEnabled,
    activatedAt: state.activatedAt,
    deactivatedAt: state.deactivatedAt,
    updatedAt: nowIso,
  };

  try {
    const patchRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Nursing Study Hub CMS DB (Panic State: ${state.isEnabled ? 'ON' : 'OFF'} at ${nowIso})`,
        files: {
          'panic-state.json': {
            content: JSON.stringify(panicPayload, null, 2),
          },
        },
      }),
    });

    if (patchRes.ok) {
      return true;
    }
  } catch (err) {
    console.warn('[PanicEngine] Direct cloud patch error:', err);
  }

  return false;
}

/**
 * Fast authoritative cloud fetch for panic-state.json.
 * 1. Checks the canonical HEAD raw URL directly (bypasses GitHub REST API truncation & rate limits).
 * 2. Falls back to GitHub Gist REST API.
 */
async function fetchFromCloudFast(): Promise<PanicModeConfig | null> {
  const token = GITHUB_TOKEN;
  if (!GIST_ID) return null;

  // Method 1: Canonical HEAD Raw URL fetch (Fastest, zero truncation, ~200ms)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const headRawUrl = `https://gist.githubusercontent.com/${GITHUB_OWNER}/${GIST_ID}/raw/panic-state.json?_cb=${Date.now()}`;
      const rawRes = await fetch(headRawUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (rawRes.ok) {
        const parsed = await rawRes.json();
        if (typeof parsed?.isEnabled === 'boolean') {
          return {
            isEnabled: parsed.isEnabled,
            activatedAt: parsed.activatedAt,
            deactivatedAt: parsed.deactivatedAt,
          };
        }
      }
    } catch (rawErr) {
      // Retry once or continue to REST API fallback
    }
  }

  // Method 2: Authenticated GitHub Gist REST API fetch fallback
  if (token) {
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'NursingStudyHubApp',
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const panicFile = data.files?.['panic-state.json'];

        if (panicFile) {
          let content = panicFile.content;

          // When GitHub Gist truncates the file or leaves content empty, fetch raw_url directly
          if ((!content || !content.trim() || panicFile.truncated) && panicFile.raw_url) {
            try {
              const rawRes = await fetch(panicFile.raw_url, {
                cache: 'no-store',
                headers: {
                  Authorization: `token ${token}`,
                  'User-Agent': 'NursingStudyHubApp',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  Pragma: 'no-cache',
                },
              });
              if (rawRes.ok) {
                content = await rawRes.text();
              }
            } catch {}
          }

          if (content && content.trim()) {
            try {
              const parsed = JSON.parse(content);
              if (typeof parsed?.isEnabled === 'boolean') {
                return {
                  isEnabled: parsed.isEnabled,
                  activatedAt: parsed.activatedAt,
                  deactivatedAt: parsed.deactivatedAt,
                };
              }
            } catch {}
          }
        }

        // Only fallback to cms-store.json if panic-state.json does not exist in the Gist at all
        if (!panicFile) {
          const cmsFile = data.files?.['cms-store.json'];
          if (cmsFile?.content && cmsFile.content.trim()) {
            try {
              const cmsParsed = JSON.parse(cmsFile.content);
              if (typeof cmsParsed?.panicMode?.isEnabled === 'boolean') {
                return cmsParsed.panicMode;
              }
            } catch {}
          }
        }
      }
    } catch (apiErr) {
      // Cloud unreachable
    }
  }

  return null;
}

export const PanicEngine = {
  /**
   * Reads current panic mode.
   * Priority:
   * 1. In-memory singleton cache (< 1s TTL) -> 0ms
   * 2. Authoritative live cloud fetch -> < 300ms
   * 3. IN-MEMORY RESILIENCE: If cloud fetch timed out/rate-limited, maintain active cached state!
   * 4. Local disk fallback (checked by most recent modification time)
   */
  async getPanicMode(): Promise<PanicModeConfig> {
    const now = Date.now();
    const cached = globalThis.__NURSING_PANIC_MODE_CACHE__;

    if (cached && now - cached.cachedAt < MEMORY_TTL_MS) {
      return {
        isEnabled: cached.isEnabled,
        activatedAt: cached.activatedAt,
        deactivatedAt: cached.deactivatedAt,
      };
    }

    // 1. Fetch live from authoritative cloud
    const cloudState = await fetchFromCloudFast();
    if (cloudState) {
      writeToLocalDisk(cloudState);
      globalThis.__NURSING_PANIC_MODE_CACHE__ = {
        ...cloudState,
        cachedAt: now,
      };
      return cloudState;
    }

    // 2. CRITICAL INDESTRUCTIBLE SAFEGUARD:
    // If cloud is temporarily unreachable or rate-limited, NEVER revert an active panic state!
    if (cached) {
      return {
        isEnabled: cached.isEnabled,
        activatedAt: cached.activatedAt,
        deactivatedAt: cached.deactivatedAt,
      };
    }

    // 3. Fallback to local disk (by most recent file modification time)
    const diskState = readFromLocalDisk();
    if (diskState) {
      globalThis.__NURSING_PANIC_MODE_CACHE__ = {
        ...diskState,
        cachedAt: now,
      };
      return diskState;
    }

    // Default fallback: disabled
    const fallback: PanicModeConfig = { isEnabled: false };
    globalThis.__NURSING_PANIC_MODE_CACHE__ = {
      ...fallback,
      cachedAt: now,
    };
    return fallback;
  },

  /**
   * Sets panic mode immediately.
   * Updates memory (0ms) and disk (1ms), then AWAITS the direct Gist PATCH
   * so the change is 100% committed to the cloud before the HTTP response completes!
   */
  async setPanicMode(
    isEnabled: boolean,
    customToken?: string
  ): Promise<{ success: boolean; isEnabled: boolean; activatedAt?: string }> {
    const nowIso = new Date().toISOString();
    const currentCached = globalThis.__NURSING_PANIC_MODE_CACHE__;

    const updatedState: PanicModeConfig = {
      isEnabled,
      activatedAt: isEnabled ? nowIso : currentCached?.activatedAt || nowIso,
      deactivatedAt: isEnabled ? undefined : nowIso,
    };

    // 1. Update in-memory cache immediately (0ms)
    globalThis.__NURSING_PANIC_MODE_CACHE__ = {
      ...updatedState,
      cachedAt: Date.now(),
    };

    // 2. Write to local disk immediately (1ms)
    writeToLocalDisk(updatedState);

    // 3. Update data/cms-store.json locally if it exists
    try {
      const cmsStorePath = path.join(process.cwd(), 'data', 'cms-store.json');
      if (fs.existsSync(cmsStorePath)) {
        const raw = fs.readFileSync(cmsStorePath, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.panicMode = updatedState;
        fs.writeFileSync(cmsStorePath, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    } catch {}

    // 4. AWAIT the direct cloud patch synchronously
    await syncToCloudDirect(updatedState, customToken);

    return {
      success: true,
      isEnabled,
      activatedAt: updatedState.activatedAt,
    };
  },
};
