import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  initChunkedUpload,
  saveUploadChunk,
  assembleChunkedUpload,
  cleanupChunks,
} from '@/lib/file-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 120;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAdminAuth(req: NextRequest): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('x-admin-token');
  return token === AUTH_SECRET_VALUE || headerToken === AUTH_SECRET_VALUE;
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك برفع المحتوى' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const contentType = req.headers.get('content-type') || '';

    // Check for raw binary / octet-stream chunk upload (Ultra-fast, immune to multipart issues)
    const rawUploadId =
      searchParams.get('uploadId') ||
      req.headers.get('x-upload-id') ||
      '';
    const rawChunkIndex =
      searchParams.get('chunkIndex') ??
      req.headers.get('x-chunk-index');

    if (rawUploadId && rawChunkIndex !== null && rawChunkIndex !== undefined && rawChunkIndex !== '') {
      const chunkIndex = Number(rawChunkIndex);
      const arrayBuf = await req.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);

      if (bytes.length === 0) {
        return NextResponse.json(
          { success: false, message: 'بيانات الجزء فارغة' },
          { status: 400 }
        );
      }

      const cookieStore = cookies();
      const customToken =
        req.headers.get('x-github-token') ||
        cookieStore.get('nursing_sync_token')?.value ||
        '';

      await saveUploadChunk(rawUploadId, chunkIndex, bytes, customToken);

      return NextResponse.json({
        success: true,
        chunkIndex,
        receivedBytes: bytes.length,
      });
    }

    // A. Handle JSON payloads (init, complete, abort)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      const action = body.action || searchParams.get('action');

      if (action === 'init') {
        const { filename, totalChunks, totalSize } = body;
        if (!filename || !totalChunks) {
          return NextResponse.json(
            { success: false, message: 'اسم الملف وعدد الأجزاء مطلوبين' },
            { status: 400 }
          );
        }

        const uploadId = `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        initChunkedUpload(uploadId, filename, Number(totalChunks), Number(totalSize || 0));

        return NextResponse.json({
          success: true,
          uploadId,
          message: 'تم بدء جلسة الرفع المجزأ بنجاح',
        });
      }

      if (action === 'complete') {
        const { uploadId, filename, totalChunks, duration } = body;
        if (!uploadId || !filename || !totalChunks) {
          return NextResponse.json(
            { success: false, message: 'معرف الرفع واسم الملف وعدد الأجزاء مطلوبين لإتمام التجميع' },
            { status: 400 }
          );
        }

        const cookieStore = cookies();
        const customToken =
          req.headers.get('x-github-token') ||
          cookieStore.get('nursing_sync_token')?.value ||
          '';

        const result = await assembleChunkedUpload(
          uploadId,
          filename,
          Number(totalChunks),
          customToken
        );

        return NextResponse.json({
          success: true,
          fileId: result.fileId,
          url: result.url,
          sizeFormatted: result.sizeFormatted,
          duration: duration || '',
          message: 'تم تجميع وحفظ الملف بنجاح 🚀',
        });
      }

      if (action === 'abort') {
        const { uploadId } = body;
        const cookieStore = cookies();
        const customToken =
          req.headers.get('x-github-token') ||
          cookieStore.get('nursing_sync_token')?.value ||
          '';
        if (uploadId) {
          cleanupChunks(uploadId, customToken);
        }
        return NextResponse.json({ success: true, message: 'تم إلغاء الرفع وتنظيف الأجزاء' });
      }

      return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
    }

    // B. Handle multipart form data (Fallback chunk upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const uploadId = (formData.get('uploadId') as string) || '';
      const chunkIndexRaw = formData.get('chunkIndex');
      const chunkFile = formData.get('chunk') as Blob | File | null;

      if (!uploadId || chunkIndexRaw === null || !chunkFile) {
        return NextResponse.json(
          { success: false, message: 'معرف الرفع ورقم الجزء وبيانات الجزء مطلوبة' },
          { status: 400 }
        );
      }

      const chunkIndex = Number(chunkIndexRaw);
      const arrayBuf = await chunkFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);

      const cookieStore = cookies();
      const customToken =
        req.headers.get('x-github-token') ||
        cookieStore.get('nursing_sync_token')?.value ||
        '';

      await saveUploadChunk(uploadId, chunkIndex, bytes, customToken);

      return NextResponse.json({
        success: true,
        chunkIndex,
        receivedBytes: bytes.length,
      });
    }

    return NextResponse.json(
      { success: false, message: 'صيغة الطلب غير مدعومة' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[UploadChunk API Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'حدث خطأ أثناء معالجة الجزء' },
      { status: 500 }
    );
  }
}
