import fs from 'fs';
import path from 'path';

function getUploadsDirectory(): string {
  const localDir = path.join(process.cwd(), 'data', 'uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const tmpDir = path.join('/tmp', 'nursing-uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
}

export function saveUploadedFile(
  bytes: Uint8Array,
  filename: string
): { fileId: string; url: string; sizeFormatted: string } {
  const dir = getUploadsDirectory();
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const cleanFilename = filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
  const safeName = `${fileId}_${cleanFilename}`;
  const filePath = path.join(dir, safeName);

  fs.writeFileSync(filePath, Buffer.from(bytes));

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
  const dir = getUploadsDirectory();
  const safeName = path.basename(fileId);
  const filePath = path.join(dir, safeName);

  let buffer: Buffer | null = null;
  if (fs.existsSync(filePath)) {
    buffer = fs.readFileSync(filePath);
  } else {
    const tmpPath = path.join('/tmp', 'nursing-uploads', safeName);
    if (fs.existsSync(tmpPath)) {
      buffer = fs.readFileSync(tmpPath);
    }
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
