import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CmsService } from '@/lib/cms-db';
import { saveUploadedFile } from '@/lib/file-storage';
import { parseAnkiPackage } from '@/lib/anki-parser';
import { getArabicFormattedDate } from '@/lib/telegram';
import { Flashcard } from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

function getCustomToken(req: NextRequest): string {
  const cookieStore = cookies();
  return (
    req.headers.get('x-github-token') ||
    cookieStore.get('nursing_sync_token')?.value ||
    ''
  );
}

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const lectures = await CmsService.getAllLectures();
  return NextResponse.json(
    { success: true, lectures },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const customToken = getCustomToken(req);
  const deleted = await CmsService.deleteLecture(id, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json(
    {
      success: deleted,
      message: deleted ? 'تم حذف المحاضرة بنجاح' : 'لم يتم العثور على المحاضرة',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const body = await req.json();
  const { id, isLive, isFree, semester } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const existing = await CmsService.getLectureById(id);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'المحاضرة غير موجودة' }, { status: 404 });
  }

  const customToken = getCustomToken(req) || body.token || '';

  if (isLive !== undefined) {
    (existing as any).isLive = !!isLive;
  }
  if (isFree !== undefined) {
    existing.isFree = !!isFree;
  }
  if (semester === '1' || semester === '2') {
    existing.semester = semester;
  }

  await CmsService.addOrUpdateLecture(existing, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json({ success: true, lecture: existing });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  let id = '';
  let title: string | undefined;
  let lectureNumber: number | undefined;
  let semester: '1' | '2' | undefined;
  let adminNote: string | undefined;
  let overview: string | undefined;
  let isFree: boolean | undefined;
  let pdfUrl: string | undefined;
  let pptUrl: string | undefined;
  let mindmapUrl: string | undefined;
  let audioUrl: string | undefined;
  let audioFileSize: string | undefined;
  let removeAudio = false;
  let pdfFile: File | null = null;
  let pptFile: File | null = null;
  let mindmapFile: File | null = null;
  let audioFile: File | null = null;
  let ankiFile: File | null = null;
  let flashcardsJson: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    id = (formData.get('id') as string) || '';
    title = (formData.get('title') as string) || undefined;
    lectureNumber = formData.get('lectureNumber') ? Number(formData.get('lectureNumber')) : undefined;
    const rawSem = formData.get('semester') as string | null;
    if (rawSem === '1' || rawSem === '2') semester = rawSem;
    adminNote = formData.get('adminNote') !== null ? (formData.get('adminNote') as string) : undefined;
    overview = formData.get('overview') !== null ? (formData.get('overview') as string) : undefined;
    if (formData.get('isFree') !== null) {
      isFree = formData.get('isFree') !== 'false';
    }
    pdfUrl = (formData.get('pdfUrl') as string) || undefined;
    pptUrl = (formData.get('pptUrl') as string) || undefined;
    mindmapUrl = (formData.get('mindmapUrl') as string) || undefined;
    audioUrl = (formData.get('audioUrl') as string) || undefined;
    audioFileSize = (formData.get('audioFileSize') as string) || undefined;
    removeAudio = formData.get('removeAudio') === 'true';
    pdfFile = formData.get('pdfFile') as File | null;
    pptFile = formData.get('pptFile') as File | null;
    mindmapFile = formData.get('mindmapFile') as File | null;
    audioFile = formData.get('audioFile') as File | null;
    ankiFile = formData.get('ankiFile') as File | null;
    flashcardsJson = (formData.get('flashcardsJson') as string) || null;
  } else {
    const body = await req.json();
    id = body.id;
    title = body.title;
    lectureNumber = body.lectureNumber !== undefined ? Number(body.lectureNumber) : undefined;
    if (body.semester === '1' || body.semester === '2') semester = body.semester;
    adminNote = body.adminNote;
    overview = body.overview;
    isFree = body.isFree !== undefined ? Boolean(body.isFree) : undefined;
    pdfUrl = body.pdfUrl;
    pptUrl = body.pptUrl;
    mindmapUrl = body.mindmapUrl;
    audioUrl = body.audioUrl;
    audioFileSize = body.audioFileSize;
    removeAudio = Boolean(body.removeAudio);
    if (body.flashcardsJson) {
      flashcardsJson = typeof body.flashcardsJson === 'string' ? body.flashcardsJson : JSON.stringify(body.flashcardsJson);
    }
  }

  if (!id) {
    return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
  }

  const existing = await CmsService.getLectureById(id);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'المحاضرة غير موجودة' }, { status: 404 });
  }

  const customToken = getCustomToken(req);

  if (!existing.files) existing.files = [];

  // Update PDF
  if (pdfFile) {
    const buf = new Uint8Array(await pdfFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, pdfFile.name, customToken);
    const pdfIdx = existing.files.findIndex((f) => f.type === 'pdf');
    if (pdfIdx >= 0) {
      existing.files[pdfIdx].downloadUrl = saved.url;
      existing.files[pdfIdx].fileSize = saved.sizeFormatted;
    } else {
      existing.files.unshift({
        type: 'pdf',
        title: existing.title,
        downloadUrl: saved.url,
        fileSize: saved.sizeFormatted,
        updatedAt: getArabicFormattedDate(),
      });
    }
  } else if (pdfUrl && pdfUrl.trim()) {
    const pdfIdx = existing.files.findIndex((f) => f.type === 'pdf');
    if (pdfIdx >= 0) {
      existing.files[pdfIdx].downloadUrl = pdfUrl.trim();
    } else {
      existing.files.unshift({
        type: 'pdf',
        title: existing.title,
        downloadUrl: pdfUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        updatedAt: getArabicFormattedDate(),
      });
    }
  }

  // Update PPT
  if (pptFile) {
    const buf = new Uint8Array(await pptFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, pptFile.name, customToken);
    const pptIdx = existing.files.findIndex((f) => f.type === 'ppt');
    if (pptIdx >= 0) {
      existing.files[pptIdx].downloadUrl = saved.url;
      existing.files[pptIdx].fileSize = saved.sizeFormatted;
    } else {
      existing.files.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${existing.title}`,
        downloadUrl: saved.url,
        fileSize: saved.sizeFormatted,
        updatedAt: getArabicFormattedDate(),
      });
    }
  } else if (pptUrl && pptUrl.trim()) {
    const pptIdx = existing.files.findIndex((f) => f.type === 'ppt');
    if (pptIdx >= 0) {
      existing.files[pptIdx].downloadUrl = pptUrl.trim();
    } else {
      existing.files.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${existing.title}`,
        downloadUrl: pptUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        updatedAt: getArabicFormattedDate(),
      });
    }
  }

  // Update Mindmap
  if (mindmapFile) {
    const buf = new Uint8Array(await mindmapFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, mindmapFile.name, customToken);
    const mmIdx = existing.files.findIndex((f) => f.type === 'mindmap');
    if (mmIdx >= 0) {
      existing.files[mmIdx].downloadUrl = saved.url;
      existing.files[mmIdx].fileSize = saved.sizeFormatted;
    } else {
      existing.files.push({
        type: 'mindmap',
        title: `الخريطة الذهنية - ${existing.title}`,
        downloadUrl: saved.url,
        fileSize: saved.sizeFormatted,
        updatedAt: getArabicFormattedDate(),
      });
    }
  } else if (mindmapUrl && mindmapUrl.trim()) {
    const mmIdx = existing.files.findIndex((f) => f.type === 'mindmap');
    if (mmIdx >= 0) {
      existing.files[mmIdx].downloadUrl = mindmapUrl.trim();
    } else {
      existing.files.push({
        type: 'mindmap',
        title: `الخريطة الذهنية - ${existing.title}`,
        downloadUrl: mindmapUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        updatedAt: getArabicFormattedDate(),
      });
    }
  }

  // Update or Remove Audio
  if (removeAudio) {
    existing.files = existing.files.filter((f) => f.type !== 'audio');
  } else if (audioFile) {
    const buf = new Uint8Array(await audioFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, audioFile.name, customToken);
    const audioIdx = existing.files.findIndex((f) => f.type === 'audio');
    if (audioIdx >= 0) {
      existing.files[audioIdx].downloadUrl = saved.url;
      existing.files[audioIdx].fileSize = saved.sizeFormatted;
      existing.files[audioIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${existing.title}`,
        downloadUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    }
  } else if (audioUrl && audioUrl.trim()) {
    const audioIdx = existing.files.findIndex((f) => f.type === 'audio');
    if (audioIdx >= 0) {
      existing.files[audioIdx].downloadUrl = audioUrl.trim();
      if (audioFileSize) existing.files[audioIdx].fileSize = audioFileSize;
      existing.files[audioIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${existing.title}`,
        downloadUrl: audioUrl.trim(),
        fileSize: audioFileSize || 'ملف صوتي سحابي 🎧',
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    }
  }

  // Update Anki Flashcards
  let updatedCards: Flashcard[] | null = null;
  if (flashcardsJson) {
    try {
      const parsed = JSON.parse(flashcardsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        updatedCards = parsed;
      }
    } catch {}
  }

  if (!updatedCards && ankiFile) {
    try {
      const buf = await ankiFile.arrayBuffer();
      const cards = await parseAnkiPackage(buf);
      if (cards && cards.length > 0) {
        updatedCards = cards;
      }
    } catch (e: any) {
      console.warn('[Lectures PUT] Anki parsing error:', e.message);
    }
  }

  if (updatedCards && updatedCards.length > 0) {
    existing.flashcards = updatedCards.map((c) => ({
      ...c,
      front: cleanLatexMath(c.front),
      back: cleanLatexMath(c.back),
      clinicalPearl: c.clinicalPearl ? cleanLatexMath(c.clinicalPearl) : undefined,
    }));
  }

  // Update Text Fields
  if (title) existing.title = title.trim();
  if (lectureNumber) existing.lectureNumber = lectureNumber;
  if (semester) existing.semester = semester;
  if (adminNote !== undefined) existing.adminNote = adminNote.trim();
  if (overview !== undefined) existing.overview = overview.trim();
  if (isFree !== undefined) existing.isFree = isFree;

  await CmsService.addOrUpdateLecture(existing, customToken);

  try {
    revalidatePath('/', 'layout');
  } catch {}

  return NextResponse.json({
    success: true,
    lecture: existing,
    message: 'تم تحديث المحاضرة والملفات بنجاح',
  });
}
