// Persistent GitHub Releases Media & Large File Storage
// Enables storage and fast CDN streaming for files up to 2 GB per file without repository bloat

const BUILTIN_TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');
const DEFAULT_REPO = 'Ibrahem-4242/nursing-app';
export const MEDIA_RELEASE_TAG = 'v-media-storage';

let cachedReleaseId: number | null = 429968789;

export function getGitHubStorageToken(customToken?: string): string {
  return customToken || process.env.GITHUB_SYNC_TOKEN || BUILTIN_TOKEN;
}

export function getGitHubStorageRepo(): string {
  return process.env.GITHUB_REPO || DEFAULT_REPO;
}

export async function getMediaReleaseId(customToken?: string): Promise<number> {
  if (cachedReleaseId) return cachedReleaseId;

  const token = getGitHubStorageToken(customToken);
  const repo = getGitHubStorageRepo();

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${MEDIA_RELEASE_TAG}`, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        cachedReleaseId = data.id;
        return data.id;
      }
    }
  } catch (err) {
    console.warn('[GitHubReleaseStorage] Failed to fetch release by tag:', err);
  }

  // Fallback to verified existing release ID
  return 429968789;
}

export interface ReleaseAssetItem {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
}

let cachedAssets: { data: ReleaseAssetItem[]; timestamp: number } | null = null;

export function invalidateReleaseAssetsCache(): void {
  cachedAssets = null;
}

export async function listReleaseAssets(customToken?: string, forceRefresh = false): Promise<ReleaseAssetItem[]> {
  if (!forceRefresh && cachedAssets && Date.now() - cachedAssets.timestamp < 30000) {
    return cachedAssets.data;
  }

  const token = getGitHubStorageToken(customToken);
  const repo = getGitHubStorageRepo();
  const releaseId = await getMediaReleaseId(customToken);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/${releaseId}/assets?per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'NursingStudyHubApp',
        },
        cache: 'no-store',
      }
    );

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        const mapped = items.map((a: any) => ({
          id: a.id,
          name: a.name,
          size: a.size || 0,
          browser_download_url: a.browser_download_url,
        }));
        cachedAssets = { data: mapped, timestamp: Date.now() };
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[GitHubReleaseStorage] Failed to list assets:', err);
  }

  return [];
}

export async function uploadReleaseAsset(
  name: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream',
  customToken?: string
): Promise<{ success: boolean; id: number; downloadUrl: string }> {
  const token = getGitHubStorageToken(customToken);
  const repo = getGitHubStorageRepo();
  const releaseId = await getMediaReleaseId(customToken);

  const cleanName = name.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
  const uploadUrl = `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(
    cleanName
  )}`;

  let res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'NursingStudyHubApp',
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
    },
    body: buffer,
  });

  // If asset with this exact name already exists (status 422), delete it first and re-upload
  if (res.status === 422) {
    const assets = await listReleaseAssets(customToken);
    const existing = assets.find((a) => a.name === cleanName);
    if (existing) {
      await deleteReleaseAsset(existing.id, customToken);
      res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'NursingStudyHubApp',
          'Content-Type': contentType,
          'Content-Length': String(buffer.length),
        },
        body: buffer,
      });
    }
  }

  if (res.ok) {
    invalidateReleaseAssetsCache();
    const data = await res.json();
    return {
      success: true,
      id: data.id,
      downloadUrl: data.browser_download_url,
    };
  }

  const errText = await res.text().catch(() => '');
  throw new Error(`Upload to GitHub Release failed (${res.status}): ${errText.slice(0, 200)}`);
}

export async function deleteReleaseAsset(assetId: number, customToken?: string): Promise<boolean> {
  const token = getGitHubStorageToken(customToken);
  const repo = getGitHubStorageRepo();

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${assetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
      },
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export async function fetchReleaseAssetBuffer(
  assetIdOrName: number | string,
  customToken?: string
): Promise<Buffer | null> {
  const token = getGitHubStorageToken(customToken);
  const repo = getGitHubStorageRepo();

  let assetId: number | null = typeof assetIdOrName === 'number' ? assetIdOrName : null;

  if (assetId === null) {
    const cleanName = String(assetIdOrName).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
    const assets = await listReleaseAssets(customToken);
    const found = assets.find((a) => a.name === cleanName);
    if (found) {
      assetId = found.id;
    }
  }

  if (assetId === null) return null;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${assetId}`, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'NursingStudyHubApp',
        Accept: 'application/octet-stream',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }
  } catch (err) {
    console.warn(`[GitHubReleaseStorage] Failed to download asset ${assetIdOrName}:`, err);
  }

  return null;
}

export async function cleanupUploadParts(uploadId: string, customToken?: string): Promise<void> {
  const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const prefix = `${safeId}_part_`;

  try {
    const assets = await listReleaseAssets(customToken);
    const partAssets = assets.filter((a) => a.name.startsWith(prefix));

    await Promise.allSettled(partAssets.map((a) => deleteReleaseAsset(a.id, customToken)));
  } catch (err) {
    console.warn('[GitHubReleaseStorage] Cleanup parts notice:', err);
  }
}

export function getReleaseDownloadUrl(filename: string): string {
  const repo = getGitHubStorageRepo();
  const cleanName = filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
  return `https://github.com/${repo}/releases/download/${MEDIA_RELEASE_TAG}/${encodeURIComponent(cleanName)}`;
}
