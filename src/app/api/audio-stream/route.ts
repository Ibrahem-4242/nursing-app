import { NextRequest, NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value ===
      'secret_session_5143545638_verified';

    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled && !isAdmin) {
      return new NextResponse('Audio stream not found', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get('id');
    const rawUrl = searchParams.get('url');

    let targetUrl = '';
    if (driveId && /^[a-zA-Z0-9_-]+$/.test(driveId)) {
      targetUrl = `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`;
    } else if (rawUrl && rawUrl.startsWith('http')) {
      targetUrl = rawUrl;
    } else {
      return new NextResponse('Invalid audio source', { status: 400 });
    }

    const reqHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    const range = req.headers.get('range');
    if (range) {
      reqHeaders['Range'] = range;
    }

    const upstream = await fetch(targetUrl, {
      headers: reqHeaders,
      redirect: 'follow',
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse('Upstream audio unavailable', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';
    // If Google Drive returned an HTML virus-scan warning page instead of audio bytes, signal client to use preview
    if (contentType.includes('text/html')) {
      return new NextResponse('HTML response instead of audio stream', { status: 422 });
    }

    const resHeaders = new Headers();
    resHeaders.set(
      'Content-Type',
      contentType.startsWith('audio/') || contentType === 'application/ogg'
        ? contentType
        : 'audio/mpeg'
    );
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Cache-Control', 'public, max-age=3600');

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) {
      resHeaders.set('Content-Range', contentRange);
    }
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      resHeaders.set('Content-Length', contentLength);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers: resHeaders,
    });
  } catch (err) {
    console.error('[AudioStream] Error:', err);
    return new NextResponse('Error streaming audio', { status: 500 });
  }
}
