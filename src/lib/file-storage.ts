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

export function saveUploadedPdf(
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

export function getUploadedPdf(fileId: string): { buffer: Buffer; filename: string } | null {
  const dir = getUploadsDirectory();
  const safeName = path.basename(fileId);
  const filePath = path.join(dir, safeName);

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return {
      buffer,
      filename: safeName.replace(/^[0-9]+-[a-z0-9]+_/, '') || 'lecture.pdf',
    };
  }

  // Fallback check in /tmp as well
  const tmpPath = path.join('/tmp', 'nursing-uploads', safeName);
  if (fs.existsSync(tmpPath)) {
    const buffer = fs.readFileSync(tmpPath);
    return {
      buffer,
      filename: safeName.replace(/^[0-9]+-[a-z0-9]+_/, '') || 'lecture.pdf',
    };
  }

  return null;
}
