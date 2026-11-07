import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getUploadedFile, getUploadedFileAsync, getContentTypeForExt } from '@/lib/file-storage';
import { listReleaseAssets, getGitHubStorageToken } from '@/lib/github-release-storage';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value ===
      'secret_session_5143545638_verified';

    // 1. Check camouflage / panic mode
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled && !isAdmin) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    // 2. Check maintenance mode: if locked, block downloads for non-admins
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
    const safeName = path.basename(fileId);
    const ext = path.extname(safeName).toLowerCase();
    const cleanContentType = getContentTypeForExt(ext);
    const originalName = safeName.replace(/^[0-9]+-[a-z0-9]+_/, '') || 'file';

    // 3. Fast in-memory / local disk check (0ms latency)
    const local = getUploadedFile(safeName);
    if (local && local.buffer) {
      const totalLength = local.buffer.length;
      const rangeHeader = req.headers.get('range');

      const headers = new Headers();
      headers.set('Content-Type', local.contentType || cleanContentType);
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(local.filename || originalName)}"`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : 0;
          const end = match[2] ? Math.min(parseInt(match[2], 10), totalLength - 1) : totalLength - 1;

          if (start >= 0 && start < totalLength && start <= end) {
            const chunk = local.buffer.subarray(start, end + 1);
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
      return new NextResponse(new Uint8Array(local.buffer), {
        status: 200,
        headers,
      });
    }

    // 4. GitHub Release Asset CDN Streaming (Resilient prefix matching for Arabic filenames & Range seeking)
    try {
      const token = getGitHubStorageToken();
      const assets = await listReleaseAssets(token);
      const prefixMatch = safeName.match(/^([0-9]{10,14}-[a-z0-9]+)/i);
      const prefix = prefixMatch ? prefixMatch[1] : safeName.split('_')[0];
      const cleanName = safeName.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');

      const matchedAsset = assets.find((a) => {
        if (a.name === safeName || a.name === cleanName) return true;
        if (prefix && prefix.length > 5 && (a.name.startsWith(prefix) || a.name.includes(prefix)) && a.name.endsWith(ext)) {
          return true;
        }
        return false;
      });

      if (matchedAsset && matchedAsset.browser_download_url) {
        const rangeHeader = req.headers.get('range');
        const upstreamHeaders: Record<string, string> = {
          'User-Agent': 'NursingStudyHubApp',
        };
        if (rangeHeader) {
          upstreamHeaders['Range'] = rangeHeader;
        }

        const ghRes = await fetch(matchedAsset.browser_download_url, {
          headers: upstreamHeaders,
          cache: 'no-store',
          redirect: 'follow',
        });

        if (ghRes.ok || ghRes.status === 206) {
          const resHeaders = new Headers();
          resHeaders.set('Content-Type', cleanContentType);
          resHeaders.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
          resHeaders.set('Accept-Ranges', 'bytes');
          resHeaders.set('Access-Control-Allow-Origin', '*');
          resHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

          const cl = ghRes.headers.get('content-length');
          const cr = ghRes.headers.get('content-range');
          if (cl) resHeaders.set('Content-Length', cl);
          if (cr) resHeaders.set('Content-Range', cr);

          return new Response(ghRes.body, {
            status: ghRes.status === 206 ? 206 : 200,
            headers: resHeaders,
          });
        }
      }
    } catch (releaseErr) {
      console.warn('[FileServer] GitHub release stream notice:', releaseErr);
    }

    // 5. Fallback to getUploadedFileAsync (checks raw GitHub repo public/uploads/ or local tmp)
    const file = await getUploadedFileAsync(fileId);
    if (!file) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const totalLength = file.buffer.length;
    const rangeHeader = req.headers.get('range');

    const headers = new Headers();
    headers.set('Content-Type', file.contentType || cleanContentType);
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');
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
