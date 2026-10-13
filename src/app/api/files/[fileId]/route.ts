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

    const totalLength = file.buffer.length;
    const rangeHeader = req.headers.get('range');

    const headers = new Headers();
    headers.set('Content-Type', file.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalLength - 1) : totalLength - 1;

        if (start >= 0 && start < totalLength && start <= end) {
          const chunk = file.buffer.subarray(start, end + 1);
          headers.set('Content-Range', `bytes ${start}-${end}/${totalLength}`);
          headers.set('Content-Length', String(chunk.length));
          return new NextResponse(new Uint8Array(chunk), {
            status: 206,
            headers,
          });
        }
      }
    }

    headers.set('Content-Length', String(totalLength));
    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[FileServer] Error serving file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
