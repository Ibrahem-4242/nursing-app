import { NextRequest, NextResponse } from 'next/server';
import { getUploadedPdf } from '@/lib/file-storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = decodeURIComponent(params.fileId);
    const file = getUploadedPdf(fileId);

    if (!file) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', file.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(file.buffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[FileServer] Error serving file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
