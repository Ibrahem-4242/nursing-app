import fs from 'fs';
import path from 'path';

// Global in-memory cache to guarantee persistence across requests in serverless runtimes
const globalFileStorage: Map<string, { buffer: Buffer; filename: string; contentType: string }> =
  (globalThis as any).__nursingFileStorage ||
  ((globalThis as any).__nursingFileStorage = new Map());

function getUploadsDirectory(): string {
  // On Vercel or read-only environments, always prioritize /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join('/tmp', 'nursing-uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return tmpDir;
  }

  const localDir = path.join(process.cwd(), 'data', 'uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const tmpDir = path.join('/tmp', 'nursing-uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return tmpDir;
  }
}

function getContentTypeForExt(ext: string): string {
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (ext === '.ppt') return 'application/vnd.ms-powerpoint';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

import { getSupabase, isSupabaseConfigured } from './supabase';

export async function saveUploadedFile(
  bytes: Uint8Array,
  filename: string,
  customToken?: string
): Promise<{ fileId: string; url: string; sizeFormatted: string }> {
  const dir = getUploadsDirectory();
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const cleanFilename = filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
  const safeName = `${fileId}_${cleanFilename}`;
  const originalName = cleanFilename;
  const ext = path.extname(cleanFilename).toLowerCase();
  const contentType = getContentTypeForExt(ext);
  const buffer = Buffer.from(bytes);

  // 1. Always store in runtime memory cache
  globalFileStorage.set(safeName, { buffer, filename: originalName, contentType });

  const sizeKb = Math.round(bytes.length / 1024);
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

  // 2. If Supabase Cloud Storage is configured, upload to bucket
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.storage
          .from('lecture-pdfs')
          .upload(safeName, buffer, { contentType, upsert: true });

        if (!error) {
          const { data } = supabase.storage
            .from('lecture-pdfs')
            .getPublicUrl(safeName);

          if (data?.publicUrl) {
            return {
              fileId: safeName,
              url: data.publicUrl,
              sizeFormatted,
            };
          }
        } else {
          console.warn('[Supabase Storage] Notice:', error.message);
        }
      } catch (sbErr) {
        console.warn('[Supabase Storage] Error:', sbErr);
      }
    }
  }

  // 3. Permanent Cloud Storage: Upload to GitHub repo contents via API
  try {
    const token = customToken || process.env.GITHUB_SYNC_TOKEN || '';

    if (token && bytes.length < 25 * 1024 * 1024) {
      const base64Content = buffer.toString('base64');
      const ghRes = await fetch(
        `https://api.github.com/repos/Ibrahem-4242/nursing-app/contents/public/uploads/${encodeURIComponent(safeName)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'NursingStudyHubApp',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload ${originalName} via admin`,
            content: base64Content,
          }),
        }
      );

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const rawUrl =
          ghData.content?.download_url ||
          `https://raw.githubusercontent.com/Ibrahem-4242/nursing-app/main/public/uploads/${encodeURIComponent(safeName)}`;

        return {
          fileId: safeName,
          url: rawUrl,
          sizeFormatted,
        };
      }
    }
  } catch (ghErr) {
    console.warn('[Storage] GitHub contents upload notice:', ghErr);
  }

  // 4. Fallback persistence to disk
  try {
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);
  } catch (diskErr) {
    try {
      const tmpPath = path.join('/tmp', 'nursing-uploads', safeName);
      const tmpDir = path.dirname(tmpPath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(tmpPath, buffer);
    } catch (tmpErr) {
      console.warn('[Storage] Preserved in memory cache:', tmpErr);
    }
  }

  return {
    fileId: safeName,
    url: `/api/files/${encodeURIComponent(safeName)}`,
    sizeFormatted,
  };
}

// Backward compatibility alias
export const saveUploadedPdf = saveUploadedFile;

export function getUploadedFile(fileId: string): { buffer: Buffer; filename: string; contentType: string } | null {
  const safeName = path.basename(fileId);

  // 1. Check in-memory storage first
  if (globalFileStorage.has(safeName)) {
    return globalFileStorage.get(safeName)!;
  }

  const dir = getUploadsDirectory();
  const filePath = path.join(dir, safeName);

  let buffer: Buffer | null = null;
  try {
    if (fs.existsSync(filePath)) {
      buffer = fs.readFileSync(filePath);
    }
  } catch {}

  if (!buffer) {
    try {
      const tmpPath = path.join('/tmp', 'nursing-uploads', safeName);
      if (fs.existsSync(tmpPath)) {
        buffer = fs.readFileSync(tmpPath);
      }
    } catch {}
  }

  if (!buffer) return null;

  const originalName = safeName.replace(/^[0-9]+-[a-z0-9]+_/, '') || 'file';
  const ext = path.extname(originalName).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.pdf') contentType = 'application/pdf';
  else if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (ext === '.ppt') contentType = 'application/vnd.ms-powerpoint';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  return {
    buffer,
    filename: originalName,
    contentType,
  };
}

// Backward compatibility alias
export const getUploadedPdf = getUploadedFile;
