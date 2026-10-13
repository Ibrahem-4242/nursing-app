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
    revalidatePath('/admin-dashboard', 'page');
    revalidatePath(`/lecture/${id}`, 'page');
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
    revalidatePath('/admin-dashboard', 'page');
    revalidatePath(`/lecture/${existing.id}`, 'page');
    if (existing.subjectId) {
      revalidatePath(`/subject/${existing.subjectId}`, 'page');
    }
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
  let subjectId: string | undefined;
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
  let questionsUrl: string | undefined;
  let removePdf = false;
  let removePpt = false;
  let removeMindmap = false;
  let removeAudio = false;
  let removeQuestions = false;
  let removeFlashcards = false;
  let pdfFile: File | null = null;
  let pptFile: File | null = null;
  let mindmapFile: File | null = null;
  let audioFile: File | null = null;
  let questionsFile: File | null = null;
  let ankiFile: File | null = null;
  let flashcardsJson: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    id = (formData.get('id') as string) || '';
    title = (formData.get('title') as string) || undefined;
    subjectId = (formData.get('subjectId') as string) || undefined;
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
    questionsUrl = (formData.get('questionsUrl') as string) || undefined;
    removePdf = formData.get('removePdf') === 'true';
    removePpt = formData.get('removePpt') === 'true';
    removeMindmap = formData.get('removeMindmap') === 'true';
    removeAudio = formData.get('removeAudio') === 'true';
    removeQuestions = formData.get('removeQuestions') === 'true';
    removeFlashcards = formData.get('removeFlashcards') === 'true';
    pdfFile = formData.get('pdfFile') as File | null;
    pptFile = formData.get('pptFile') as File | null;
    mindmapFile = formData.get('mindmapFile') as File | null;
    audioFile = formData.get('audioFile') as File | null;
    questionsFile = formData.get('questionsFile') as File | null;
    ankiFile = formData.get('ankiFile') as File | null;
    flashcardsJson = (formData.get('flashcardsJson') as string) || null;
  } else {
    const body = await req.json();
    id = body.id;
    title = body.title;
    subjectId = body.subjectId;
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
    questionsUrl = body.questionsUrl;
    removePdf = Boolean(body.removePdf);
    removePpt = Boolean(body.removePpt);
    removeMindmap = Boolean(body.removeMindmap);
    removeAudio = Boolean(body.removeAudio);
    removeQuestions = Boolean(body.removeQuestions);
    removeFlashcards = Boolean(body.removeFlashcards);
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

  // Update Text Fields first so file titles use the updated title
  if (title && title.trim()) {
    existing.title = title.trim();
  }
  if (subjectId && subjectId.trim()) {
    const allSubs = await CmsService.getAllSubjects();
    const targetSub = allSubs.find((s) => s.id === subjectId.trim());
    existing.subjectId = subjectId.trim();
    if (targetSub) {
      existing.subjectTitle = targetSub.title;
      existing.yearId = targetSub.yearId;
      existing.yearTitle =
        targetSub.yearName ||
        (targetSub.yearId === '1'
          ? 'السنة الأولى'
          : targetSub.yearId === '2'
          ? 'السنة الثانية'
          : targetSub.yearId === '3'
          ? 'السنة الثالثة'
          : 'السنة الرابعة');
    }
  }
  if (lectureNumber) existing.lectureNumber = lectureNumber;
  if (semester) existing.semester = semester;
  if (adminNote !== undefined) existing.adminNote = adminNote.trim();
  if (overview !== undefined) existing.overview = overview.trim();
  if (isFree !== undefined) existing.isFree = isFree;

  // Update or Remove PDF
  if (removePdf || (pdfUrl !== undefined && !pdfUrl.trim() && !pdfFile)) {
    existing.files = existing.files.filter((f: any) => f.type !== 'pdf' && f.fileType !== 'summary');
  } else if (pdfFile) {
    const buf = new Uint8Array(await pdfFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, pdfFile.name, customToken);
    const pdfIdx = existing.files.findIndex((f: any) => f.type === 'pdf' || f.fileType === 'summary');
    if (pdfIdx >= 0) {
      existing.files[pdfIdx].type = 'pdf';
      existing.files[pdfIdx].title = existing.title;
      existing.files[pdfIdx].downloadUrl = saved.url;
      existing.files[pdfIdx].fileUrl = saved.url;
      existing.files[pdfIdx].fileSize = saved.sizeFormatted;
      existing.files[pdfIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.unshift({
        type: 'pdf',
        title: existing.title,
        downloadUrl: saved.url,
        fileUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'ملف PDF معتمد',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف رسمي بعلامة مائية معتمدة جاهز للتنزيل والطباعة',
      });
    }
  } else if (pdfUrl && pdfUrl.trim()) {
    const pdfIdx = existing.files.findIndex((f: any) => f.type === 'pdf' || f.fileType === 'summary');
    if (pdfIdx >= 0) {
      existing.files[pdfIdx].type = 'pdf';
      existing.files[pdfIdx].title = existing.title;
      existing.files[pdfIdx].downloadUrl = pdfUrl.trim();
      existing.files[pdfIdx].fileUrl = pdfUrl.trim();
      existing.files[pdfIdx].fileSize = 'رابط خارجي 🌐';
      existing.files[pdfIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.unshift({
        type: 'pdf',
        title: existing.title,
        downloadUrl: pdfUrl.trim(),
        fileUrl: pdfUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        pageCount: 'ملف PDF معتمد',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف رسمي بعلامة مائية معتمدة جاهز للتنزيل والطباعة',
      });
    }
  }

  // Update or Remove PPT
  if (removePpt || (pptUrl !== undefined && !pptUrl.trim() && !pptFile)) {
    existing.files = existing.files.filter((f: any) => f.type !== 'ppt' && f.fileType !== 'powerpoint' && f.fileType !== 'presentation');
  } else if (pptFile) {
    const buf = new Uint8Array(await pptFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, pptFile.name, customToken);
    const pptIdx = existing.files.findIndex((f: any) => f.type === 'ppt' || f.fileType === 'powerpoint' || f.fileType === 'presentation');
    if (pptIdx >= 0) {
      existing.files[pptIdx].type = 'ppt';
      existing.files[pptIdx].title = `عروض بوربوينت - ${existing.title}`;
      existing.files[pptIdx].downloadUrl = saved.url;
      existing.files[pptIdx].fileUrl = saved.url;
      existing.files[pptIdx].fileSize = saved.sizeFormatted;
      existing.files[pptIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${existing.title}`,
        downloadUrl: saved.url,
        fileUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'سلايدات PowerPoint',
        updatedAt: getArabicFormattedDate(),
      });
    }
  } else if (pptUrl && pptUrl.trim()) {
    const pptIdx = existing.files.findIndex((f: any) => f.type === 'ppt' || f.fileType === 'powerpoint' || f.fileType === 'presentation');
    if (pptIdx >= 0) {
      existing.files[pptIdx].type = 'ppt';
      existing.files[pptIdx].title = `عروض بوربوينت - ${existing.title}`;
      existing.files[pptIdx].downloadUrl = pptUrl.trim();
      existing.files[pptIdx].fileUrl = pptUrl.trim();
      existing.files[pptIdx].fileSize = 'رابط خارجي 🌐';
      existing.files[pptIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'ppt',
        title: `عروض بوربوينت - ${existing.title}`,
        downloadUrl: pptUrl.trim(),
        fileUrl: pptUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        pageCount: 'سلايدات PowerPoint',
        updatedAt: getArabicFormattedDate(),
      });
    }
  }

  // Update or Remove Mindmap
  if (removeMindmap || (mindmapUrl !== undefined && !mindmapUrl.trim() && !mindmapFile)) {
    existing.files = existing.files.filter((f: any) => f.type !== 'mindmap' && f.fileType !== 'mindmap');
  } else if (mindmapFile) {
    const buf = new Uint8Array(await mindmapFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, mindmapFile.name, customToken);
    const mmIdx = existing.files.findIndex((f: any) => f.type === 'mindmap' || f.fileType === 'mindmap');
    if (mmIdx >= 0) {
      existing.files[mmIdx].type = 'mindmap';
      existing.files[mmIdx].title = `الخريطة الذهنية - ${existing.title}`;
      existing.files[mmIdx].downloadUrl = saved.url;
      existing.files[mmIdx].fileUrl = saved.url;
      existing.files[mmIdx].fileSize = saved.sizeFormatted;
      existing.files[mmIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'mindmap',
        title: `الخريطة الذهنية - ${existing.title}`,
        downloadUrl: saved.url,
        fileUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'خريطة ذهنية عالية الدقة',
        updatedAt: getArabicFormattedDate(),
      });
    }
  } else if (mindmapUrl && mindmapUrl.trim()) {
    const mmIdx = existing.files.findIndex((f: any) => f.type === 'mindmap' || f.fileType === 'mindmap');
    if (mmIdx >= 0) {
      existing.files[mmIdx].type = 'mindmap';
      existing.files[mmIdx].title = `الخريطة الذهنية - ${existing.title}`;
      existing.files[mmIdx].downloadUrl = mindmapUrl.trim();
      existing.files[mmIdx].fileUrl = mindmapUrl.trim();
      existing.files[mmIdx].fileSize = 'رابط خارجي 🌐';
      existing.files[mmIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'mindmap',
        title: `الخريطة الذهنية - ${existing.title}`,
        downloadUrl: mindmapUrl.trim(),
        fileUrl: mindmapUrl.trim(),
        fileSize: 'رابط خارجي 🌐',
        pageCount: 'خريطة ذهنية عالية الدقة',
        updatedAt: getArabicFormattedDate(),
      });
    }
  }

  // Update or Remove Audio
  if (removeAudio || (audioUrl !== undefined && !audioUrl.trim() && !audioFile)) {
    existing.files = existing.files.filter((f: any) => f.type !== 'audio' && f.fileType !== 'audio');
  } else if (audioFile) {
    const buf = new Uint8Array(await audioFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, audioFile.name, customToken);
    const audioIdx = existing.files.findIndex((f: any) => f.type === 'audio' || f.fileType === 'audio');
    if (audioIdx >= 0) {
      existing.files[audioIdx].title = `التسجيل الصوتي للشرح - ${existing.title}`;
      existing.files[audioIdx].downloadUrl = saved.url;
      existing.files[audioIdx].fileUrl = saved.url;
      existing.files[audioIdx].fileSize = saved.sizeFormatted;
      existing.files[audioIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${existing.title}`,
        downloadUrl: saved.url,
        fileUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    }
  } else if (audioUrl && audioUrl.trim()) {
    const audioIdx = existing.files.findIndex((f: any) => f.type === 'audio' || f.fileType === 'audio');
    if (audioIdx >= 0) {
      existing.files[audioIdx].title = `التسجيل الصوتي للشرح - ${existing.title}`;
      existing.files[audioIdx].downloadUrl = audioUrl.trim();
      existing.files[audioIdx].fileUrl = audioUrl.trim();
      if (audioFileSize) existing.files[audioIdx].fileSize = audioFileSize;
      existing.files[audioIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'audio',
        title: `التسجيل الصوتي للشرح - ${existing.title}`,
        downloadUrl: audioUrl.trim(),
        fileUrl: audioUrl.trim(),
        fileSize: audioFileSize || 'ملف صوتي سحابي 🎧',
        pageCount: 'ريكورد شرح المحاضرة 🎧',
        updatedAt: getArabicFormattedDate(),
        customNote: 'تسجيل صوتي واضح لشرح المحاضرة جاهز للاستماع المباشر بالموجة الصوتية أو التحميل',
      });
    }
  }

  // Update or Remove Questions File
  if (removeQuestions || (questionsUrl !== undefined && !questionsUrl.trim() && !questionsFile)) {
    existing.files = existing.files.filter((f: any) => f.type !== 'questions' && f.fileType !== 'questions');
  } else if (questionsFile) {
    const buf = new Uint8Array(await questionsFile.arrayBuffer());
    const saved = await saveUploadedFile(buf, questionsFile.name, customToken);
    const qIdx = existing.files.findIndex((f: any) => f.type === 'questions' || f.fileType === 'questions');
    if (qIdx >= 0) {
      existing.files[qIdx].title = `أسئلة وتمارين المحاضرة - ${existing.title}`;
      existing.files[qIdx].downloadUrl = saved.url;
      existing.files[qIdx].fileUrl = saved.url;
      existing.files[qIdx].fileSize = saved.sizeFormatted;
      existing.files[qIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'questions',
        title: `أسئلة وتمارين المحاضرة - ${existing.title}`,
        downloadUrl: saved.url,
        fileUrl: saved.url,
        fileSize: saved.sizeFormatted,
        pageCount: 'بنك أسئلة وتدريبات PDF',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف أسئلة وتدريبات واختبارات لتقييم فهم المحاضرة',
      });
    }
  } else if (questionsUrl && questionsUrl.trim()) {
    const qIdx = existing.files.findIndex((f: any) => f.type === 'questions' || f.fileType === 'questions');
    if (qIdx >= 0) {
      existing.files[qIdx].title = `أسئلة وتمارين المحاضرة - ${existing.title}`;
      existing.files[qIdx].downloadUrl = questionsUrl.trim();
      existing.files[qIdx].fileUrl = questionsUrl.trim();
      existing.files[qIdx].fileSize = 'رابط درايف 🌐';
      existing.files[qIdx].updatedAt = getArabicFormattedDate();
    } else {
      existing.files.push({
        type: 'questions',
        title: `أسئلة وتمارين المحاضرة - ${existing.title}`,
        downloadUrl: questionsUrl.trim(),
        fileUrl: questionsUrl.trim(),
        fileSize: 'رابط درايف 🌐',
        pageCount: 'بنك أسئلة وتدريبات PDF',
        updatedAt: getArabicFormattedDate(),
        customNote: 'ملف أسئلة وتدريبات واختبارات لتقييم فهم المحاضرة عبر رابط مباشر',
      });
    }
  }

  // Sync file titles whenever lecture title was edited
  existing.files = existing.files.map((f: any) => {
    if (f.type === 'pdf' || f.fileType === 'summary') {
      return { ...f, title: existing.title };
    }
    if (f.type === 'ppt' || f.fileType === 'powerpoint' || f.fileType === 'presentation') {
      return { ...f, title: `عروض بوربوينت - ${existing.title}` };
    }
    if (f.type === 'mindmap' || f.fileType === 'mindmap') {
      return { ...f, title: `الخريطة الذهنية - ${existing.title}` };
    }
    if (f.type === 'audio' || f.fileType === 'audio') {
      return { ...f, title: `التسجيل الصوتي للشرح - ${existing.title}` };
    }
    if (f.type === 'questions' || f.fileType === 'questions') {
      return { ...f, title: `أسئلة وتمارين المحاضرة - ${existing.title}` };
    }
    return f;
  });

  // Update or Remove Anki Flashcards
  if (removeFlashcards) {
    existing.flashcards = [];
  } else {
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
  }

  existing.lastModified = Date.now();
  await CmsService.addOrUpdateLecture(existing, customToken);

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/admin-dashboard', 'page');
    revalidatePath(`/lecture/${existing.id}`, 'page');
    if (existing.subjectId) {
      revalidatePath(`/subject/${existing.subjectId}`, 'page');
    }
  } catch {}

  return NextResponse.json({
    success: true,
    lecture: existing,
    message: 'تم تحديث المحاضرة والملفات بنجاح ✅',
  });
}
