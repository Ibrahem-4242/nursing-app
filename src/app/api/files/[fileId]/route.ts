import { NextRequest, NextResponse } from 'next/server';
import { getUploadedPdfAsync } from '@/lib/file-storage';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value ===
      'secret_session_5143545638_verified';

    // Check camouflage / panic mode
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled && !isAdmin) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    // Check maintenance mode: if locked, block downloads for non-admins
    const maintenance = await CmsService.getMaintenanceConfig();
    if (maintenance.isEnabled && !isAdmin) {
      return new NextResponse(
        JSON.stringify({
          error: 'المنصة في وضع الصيانة والتحديث حالياً',
          message: maintenance.message,
        }),
        { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const fileId = decodeURIComponent(params.fileId);
    const file = await getUploadedPdfAsync(fileId);

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
        } else {
          headers.set('Content-Range', `bytes */${totalLength}`);
          return new NextResponse(null, { status: 416, headers });
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
