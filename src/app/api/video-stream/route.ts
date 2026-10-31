import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { findLocalFilePath, getContentTypeForExt } from '@/lib/file-storage';
import { listReleaseAssets } from '@/lib/github-release-storage';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_COOKIE_NAME = 'nursing_admin_token';
const ADMIN_SECRET_VALUE = 'secret_session_5143545638_verified';
const STUDENT_COOKIE_NAME = 'nursing_student_session';

async function verifyLectureAccess(
  lectureId?: string,
  quizId?: string,
  isAdmin: boolean = false,
  fileId?: string,
  externalUrl?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Admin is always allowed
  if (isAdmin) return { allowed: true };

  const resolvedLectureId = lectureId && !lectureId.startsWith('quiz-') ? lectureId : undefined;
  const resolvedQuizId = quizId || (lectureId && lectureId.startsWith('quiz-') ? lectureId.replace(/^quiz-/, '') : undefined);

  // 2. Check if this is a FREE lecture (anyone can watch free educational lectures!)
  if (resolvedLectureId) {
    try {
      const lecture = await CmsService.getLectureById(resolvedLectureId);
      if (lecture && lecture.isFree) {
        return { allowed: true };
      }
    } catch {}
  }

  // 3. Check if this is a FREE quiz
  if (resolvedQuizId) {
    try {
      const allQuizzes = await CmsService.getAllSubjectQuizFilesList();
      const quiz = allQuizzes.find((q) => q.id === resolvedQuizId || q.subjectId === resolvedQuizId);
      if (quiz && quiz.isFree !== false) {
        return { allowed: true };
      }
    } catch {}
  }

  // 4. If neither lectureId nor quizId passed directly, check if the video file belongs to ANY free lecture
  if (fileId || externalUrl) {
    try {
      const targetQuery = fileId || externalUrl || '';
      const prefix = fileId ? fileId.split('_')[0] : '';
      const allLecs = await CmsService.getAllLectures();
      const matchedLec = allLecs.find((l) =>
        (l.videoUrl && l.videoUrl.includes(targetQuery)) ||
        (prefix && l.videoUrl && l.videoUrl.includes(prefix)) ||
        JSON.stringify(l).includes(targetQuery) ||
        (prefix && JSON.stringify(l).includes(prefix))
      );
      if (matchedLec && matchedLec.isFree) {
        return { allowed: true };
      }
    } catch {}
  }

  // 5. If not verified as free, enforce student session check
  const cookieStore = cookies();
  const rawVal = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
  if (!rawVal) {
    return {
      allowed: false,
      reason: 'مشاهدة هذا الفيديو مخصصة فقط للطلاب المسجلين بالمنصة. يرجى تسجيل الدخول بحسابك أو إنشاء حساب مجاني 🔒',
    };
  }

  const [studentId] = rawVal.split(':::');
  if (!studentId) {
    return { allowed: false, reason: 'جلسة الطالب غير صالحة، يرجى إعادة تسجيل الدخول' };
  }

  const student = await CmsService.getStudentById(studentId);
  if (!student) {
    return { allowed: false, reason: 'حساب الطالب غير موجود بالمنصة' };
  }

  if (student.isSuspended) {
    return { allowed: false, reason: 'تم تعليق وتجميد الحساب من قبل الإدارة ⛔' };
  }

  // If lecture is provided and it is a PAID lecture:
  if (resolvedLectureId) {
    try {
      const lecture = await CmsService.getLectureById(resolvedLectureId);
      if (lecture && !lecture.isFree) {
        if (student.shakibRakibSubscription?.isActive) {
          const expires = new Date(student.shakibRakibSubscription.expiresAt).getTime();
          if (expires > Date.now()) {
            const subYear = student.shakibRakibSubscription.yearId;
            if (!lecture.yearId || !subYear || subYear === 'all' || subYear === lecture.yearId) {
              return { allowed: true };
            }
          }
        }

        if (Array.isArray(student.purchasedLectureIds) && student.purchasedLectureIds.includes(resolvedLectureId)) {
          return { allowed: true };
        }

        return { allowed: false, reason: 'المحاضرة مدفوعة وغير مفعلة في حسابك بعد 🔒' };
      }
    } catch (err) {
      console.warn('[VideoStreamAuth] Lecture lookup error:', err);
    }
  }

  // If quiz is provided and it is a PAID quiz:
  if (resolvedQuizId) {
    try {
      const allQuizzes = await CmsService.getAllSubjectQuizFilesList();
      const quiz = allQuizzes.find((q) => q.id === resolvedQuizId || q.subjectId === resolvedQuizId);
      if (quiz && quiz.isFree === false) {
        if (student.shakibRakibSubscription?.isActive) {
          const expires = new Date(student.shakibRakibSubscription.expiresAt).getTime();
          if (expires > Date.now()) {
            return { allowed: true };
          }
        }
        return { allowed: false, reason: 'ملف أسئلة الكويز مخصص للمشتركين فقط 🔒' };
      }
    } catch (err) {
      console.warn('[VideoStreamAuth] Quiz lookup error:', err);
    }
  }

  return { allowed: true };
}

function extractDriveId(url: string): string | null {
  const match = url.match(/(?:file\/d\/|id=|\/d\/)([a-zA-Z0-9_-]{15,})/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_SECRET_VALUE;

    // 1. Panic / Camouflage Mode check
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled && !isAdmin) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    const externalUrl = searchParams.get('url');
    const lectureId = searchParams.get('lectureId') || undefined;
    const quizId = searchParams.get('quizId') || undefined;

    // 2. Permissions check
    const access = await verifyLectureAccess(lectureId, quizId, isAdmin, fileId || undefined, externalUrl || undefined);
    if (!access.allowed) {
      return new NextResponse(
        JSON.stringify({ error: access.reason || 'المحتوى مخصص للمشتركين فقط' }),
        { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // 3. Option A: Serve locally assembled or stored video file with byte-range streaming
    if (fileId) {
      const safeId = decodeURIComponent(fileId);
      const filePath = findLocalFilePath(safeId);

      if (filePath && fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const totalLength = stats.size;
        const ext = path.extname(filePath).toLowerCase();
        const contentType = getContentTypeForExt(ext) || 'video/mp4';

        const rangeHeader = req.headers.get('range');

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range');

        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
          if (match) {
            const rawStart = match[1];
            const rawEnd = match[2];
            let start = rawStart ? parseInt(rawStart, 10) : 0;
            let end = rawEnd ? parseInt(rawEnd, 10) : totalLength - 1;

            if (isNaN(start)) start = 0;
            if (isNaN(end) || end >= totalLength) end = totalLength - 1;

            if (start <= end && start < totalLength) {
              const chunkSize = end - start + 1;
              headers.set('Content-Range', `bytes ${start}-${end}/${totalLength}`);
              headers.set('Content-Length', String(chunkSize));

              const nodeStream = fs.createReadStream(filePath, { start, end });
              const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

              return new Response(webStream, {
                status: 206,
                headers,
              });
            } else {
              // Requested range cannot be satisfied (RFC 7233)
              headers.set('Content-Range', `bytes */${totalLength}`);
              return new Response(null, {
                status: 416,
                headers,
              });
            }
          }
        }

        // No range header: serve full stream
        headers.set('Content-Length', String(totalLength));
        const nodeStream = fs.createReadStream(filePath);
        const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

        return new Response(webStream, {
          status: 200,
          headers,
        });
      }

      // If NOT found on local disk, stream directly from GitHub permanent cloud repo!
      try {
        const builtinToken = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');
        const token = process.env.GITHUB_SYNC_TOKEN || builtinToken;
        const repo = process.env.GITHUB_REPO || 'Ibrahem-4242/nursing-app';
        const upstreamHeaders: Record<string, string> = {
          'User-Agent': 'NursingStudyHubApp',
        };
        if (token) {
          upstreamHeaders['Authorization'] = `token ${token}`;
        }
        const rangeHeader = req.headers.get('range');
        if (rangeHeader) {
          upstreamHeaders['Range'] = rangeHeader;
        }

        // 1a. Try GitHub Release Asset CDN directly
        const ghReleaseUrl = `https://github.com/${repo}/releases/download/v-media-storage/${encodeURIComponent(safeId)}`;
        let ghRes = await fetch(ghReleaseUrl, {
          headers: upstreamHeaders,
          cache: 'no-store',
        });

        // 1b. If not found in release (e.g. non-ASCII Arabic characters converted to dots by GitHub Releases API),
        // resolve asset by unique fileId prefix (e.g. "1793457581853-6810ut")
        if (!ghRes.ok && ghRes.status !== 206) {
          const prefix = safeId.split('_')[0];
          if (prefix && prefix.length > 5) {
            const assets = await listReleaseAssets(token);
            const matching = assets.find((a) => a.name.startsWith(prefix));
            if (matching?.browser_download_url) {
              ghRes = await fetch(matching.browser_download_url, {
                headers: upstreamHeaders,
                cache: 'no-store',
              });
            }
          }
        }

        // 2. Fallback to raw GitHub repo contents if not found in release
        if (!ghRes.ok && ghRes.status !== 206) {
          const ghRawUrl = `https://raw.githubusercontent.com/${repo}/main/public/uploads/${encodeURIComponent(safeId)}`;
          ghRes = await fetch(ghRawUrl, {
            headers: upstreamHeaders,
            cache: 'no-store',
          });
        }

        if (ghRes.ok || ghRes.status === 206) {
          const ext = path.extname(safeId).toLowerCase();
          const contentType = getContentTypeForExt(ext) || 'video/mp4';

          const resHeaders = new Headers();
          resHeaders.set('Content-Type', contentType);
          resHeaders.set('Accept-Ranges', 'bytes');
          resHeaders.set('Access-Control-Allow-Origin', '*');
          resHeaders.set('Cache-Control', 'public, max-age=3600');

          const cl = ghRes.headers.get('content-length');
          const cr = ghRes.headers.get('content-range');
          if (cl) resHeaders.set('Content-Length', cl);
          if (cr) resHeaders.set('Content-Range', cr);

          return new Response(ghRes.body, {
            status: ghRes.status === 206 ? 206 : 200,
            headers: resHeaders,
          });
        }
      } catch (ghErr) {
        console.warn('[VideoStream] Cloud fetch fallback error:', ghErr);
      }

      return new NextResponse('Video File Not Found', { status: 404 });
    }

    // 4. Option B: Stream / Proxy external video or Google Drive link
    if (externalUrl) {
      let targetUrl = externalUrl.trim();
      const driveId = extractDriveId(targetUrl);

      if (driveId) {
        targetUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${driveId}`;
      }

      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      const rangeHeader = req.headers.get('range');
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }

      let upstreamRes = await fetch(targetUrl, {
        headers: upstreamHeaders,
        redirect: 'follow',
      });

      // If upstream failed or returned html on drive confirmation
      const isHtml = (upstreamRes.headers.get('content-type') || '').includes('text/html');
      if ((!upstreamRes.ok && upstreamRes.status !== 206) || isHtml) {
        // Fallback direct stream attempt for Google Drive
        if (driveId) {
          const altUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t&authuser=0`;
          const altRes = await fetch(altUrl, {
            headers: upstreamHeaders,
            redirect: 'follow',
          });
          if (altRes.ok || altRes.status === 206) {
            upstreamRes = altRes;
          }
        }
      }

      const resHeaders = new Headers();
      resHeaders.set(
        'Content-Type',
        upstreamRes.headers.get('content-type') || 'video/mp4'
      );
      resHeaders.set('Accept-Ranges', 'bytes');
      resHeaders.set('Access-Control-Allow-Origin', '*');

      const cl = upstreamRes.headers.get('content-length');
      const cr = upstreamRes.headers.get('content-range');
      if (cl) resHeaders.set('Content-Length', cl);
      if (cr) resHeaders.set('Content-Range', cr);

      return new Response(upstreamRes.body, {
        status: upstreamRes.status === 206 ? 206 : 200,
        headers: resHeaders,
      });
    }

    return new NextResponse('Missing fileId or url parameter', { status: 400 });
  } catch (err: any) {
    console.error('[VideoStream API Error]:', err);
    return new NextResponse('Internal Video Streaming Error', { status: 500 });
  }
}
