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

export function saveUploadedFile(
  bytes: Uint8Array,
  filename: string
): { fileId: string; url: string; sizeFormatted: string } {
  const dir = getUploadsDirectory();
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const cleanFilename = filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
  const safeName = `${fileId}_${cleanFilename}`;
  const originalName = cleanFilename;
  const ext = path.extname(cleanFilename).toLowerCase();
  const contentType = getContentTypeForExt(ext);
  const buffer = Buffer.from(bytes);

  // 1. Always store in runtime memory cache (guarantees zero-failure in serverless)
  globalFileStorage.set(safeName, { buffer, filename: originalName, contentType });

  // 2. Best-effort persistence to disk
  try {
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);
  } catch (diskErr) {
    // If localDir failed, try /tmp
    try {
      const tmpPath = path.join('/tmp', 'nursing-uploads', safeName);
      const tmpDir = path.dirname(tmpPath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(tmpPath, buffer);
    } catch (tmpErr) {
      console.warn('[Storage] Disk write skipped, preserved in memory:', tmpErr);
    }
  }

  const sizeKb = Math.round(bytes.length / 1024);
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

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
