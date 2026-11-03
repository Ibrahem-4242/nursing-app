import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CmsService } from '@/lib/cms-db';
import { Lecture, LectureFile, SubjectQuizFile } from '@/lib/types';
import { MOCK_SUBJECTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'nursing_admin_token';
const AUTH_SECRET_VALUE = 'secret_session_5143545638_verified';

function checkAdminAuth(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token === AUTH_SECRET_VALUE;
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || '').trim(); // 'lecture-to-quiz' | 'quiz-to-lecture' | 'change-subject'
    const targetSubjectId = body.targetSubjectId ? String(body.targetSubjectId).trim() : undefined;
    const targetSemester = body.targetSemester === '2' ? '2' : body.targetSemester === '1' ? '1' : undefined;
    const customTitle = body.title ? String(body.title).trim() : undefined;

    const allSubjects = await CmsService.getAllSubjects();
    const resolvedSubjects = allSubjects.length > 0 ? allSubjects : MOCK_SUBJECTS;

    // 1. CONVERT LECTURE -> SUBJECT QUIZ FILE
    if (action === 'lecture-to-quiz') {
      const lectureId = String(body.lectureId || '').trim();
      if (!lectureId) {
        return NextResponse.json({ success: false, message: 'معرف المحاضرة مطلوب' }, { status: 400 });
      }

      const lecture = await CmsService.getLectureById(lectureId);
      if (!lecture) {
        return NextResponse.json({ success: false, message: 'المحاضرة غير موجودة' }, { status: 404 });
      }

      const finalSubId = targetSubjectId || lecture.subjectId;
      const targetSub = resolvedSubjects.find((s) => s.id === finalSubId) || {
        id: finalSubId,
        title: lecture.subjectTitle || 'مقرر تمريض',
        semester: '1',
      };

      const finalSem: '1' | '2' =
        targetSemester || lecture.semester || (targetSub.semester === '2' ? '2' : '1');

      // Extract files from lecture
      const pdfFile = lecture.files?.find((f) => f.type === 'pdf' || f.fileType === 'summary');
      const qFile = lecture.files?.find((f) => f.type === 'questions' || f.fileType === 'questions');
      const pptFile = lecture.files?.find((f) => f.type === 'ppt' || f.fileType === 'presentation');
      const audioFile = lecture.files?.find((f) => f.type === 'audio' || f.fileType === 'audio');
      const videoFile = lecture.files?.find((f) => f.type === 'video' || f.fileType === 'video');
      const mindmapFile = lecture.files?.find((f) => f.type === 'mindmap' || f.fileType === 'mindmap');

      const primaryDownloadUrl = qFile?.downloadUrl || pdfFile?.downloadUrl || '';
      const primarySize = qFile?.fileSize || pdfFile?.fileSize || 'ملف رقمي 📄';

      let explanationUrl: string | undefined = undefined;
      let explanationTitle: string | undefined = undefined;
      let explanationFileSize: string | undefined = undefined;

      if (qFile && pdfFile && qFile.downloadUrl !== pdfFile.downloadUrl) {
        explanationUrl = pdfFile.downloadUrl;
        explanationTitle = pdfFile.title || 'ملف الشرح وتوضيح الإجابات';
        explanationFileSize = pdfFile.fileSize;
      }

      const questionsCount =
        Number(body.questionsCount) ||
        (Array.isArray(lecture.quiz) && lecture.quiz.length > 0 ? lecture.quiz.length : 100);

      const finalQuizTitle = customTitle || lecture.title;

      const newQuizFile: SubjectQuizFile = {
        id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: targetSub.id,
        subjectTitle: targetSub.title,
        semester: finalSem,
        title: finalQuizTitle,
        description:
          lecture.overview ||
          lecture.subtitle ||
          `ملف أسئلة وكويزات شامل لمقرر ${targetSub.title} (سمستر ${finalSem}).`,
        downloadUrl: primaryDownloadUrl,
        fileSize: primarySize,
        questionsCount,
        updatedAt: `تم التحويل في ${new Date().toLocaleDateString('ar-EG')}`,
        explanationUrl,
        explanationTitle,
        explanationFileSize,
        pptUrl: pptFile?.downloadUrl,
        pptTitle: pptFile?.title || (pptFile ? 'العرض التقديمي (PowerPoint)' : undefined),
        pptFileSize: pptFile?.fileSize,
        audioUrl: audioFile?.downloadUrl,
        audioTitle: audioFile?.title || (audioFile ? 'شرح صوتي للكويز' : undefined),
        audioFileSize: audioFile?.fileSize,
        videoUrl: videoFile?.downloadUrl,
        videoTitle: videoFile?.title || (videoFile ? 'فيديو حل وشرح الكويز' : undefined),
        videoFileSize: videoFile?.fileSize,
        videoDuration: videoFile?.videoDuration,
        mindmapUrl: mindmapFile?.downloadUrl,
        mindmapTitle: mindmapFile?.title || (mindmapFile ? 'خريطة ذهنية للأسئلة' : undefined),
        mindmapFileSize: mindmapFile?.fileSize,
        flashcards: Array.isArray(lecture.flashcards) && lecture.flashcards.length > 0 ? lecture.flashcards : undefined,
        flashcardsCount: Array.isArray(lecture.flashcards) ? lecture.flashcards.length : undefined,
        isFree: lecture.isFree !== false,
        isLive: true,
      };

      const savedQuiz = await CmsService.saveSubjectQuizFile(newQuizFile);

      // Delete the original lecture so it moves exclusively to the quizzes category
      await CmsService.deleteLecture(lectureId);

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/admin-dashboard', 'page');
        revalidatePath(`/subject/${lecture.subjectId}`, 'page');
        revalidatePath(`/subject/${targetSub.id}`, 'page');
      } catch {}

      return NextResponse.json({
        success: true,
        message: `تم تحويل المحاضرة "${lecture.title}" بنجاح إلى قسم أسئلة الكويزات لمادة "${targetSub.title}"! 🚀`,
        quizFile: savedQuiz,
      });
    }

    // 2. CONVERT SUBJECT QUIZ FILE -> LECTURE
    if (action === 'quiz-to-lecture') {
      const quizId = String(body.quizId || '').trim();
      if (!quizId) {
        return NextResponse.json({ success: false, message: 'معرف الكويز مطلوب' }, { status: 400 });
      }

      const allQuizzes = await CmsService.getAllSubjectQuizFilesList();
      const quiz = allQuizzes.find((q) => q.id === quizId || q.subjectId === quizId);
      if (!quiz) {
        return NextResponse.json({ success: false, message: 'ملف الكويز غير موجود' }, { status: 404 });
      }

      const finalSubId = targetSubjectId || quiz.subjectId;
      const targetSub = resolvedSubjects.find((s) => s.id === finalSubId) || {
        id: finalSubId,
        title: quiz.subjectTitle || 'مقرر تمريض',
        yearId: '1',
        yearName: 'السنة الأولى',
        semester: '1',
      };

      const finalSem: '1' | '2' =
        targetSemester || quiz.semester || (targetSub.semester === '2' ? '2' : '1');

      // Get current lectures count in target subject to calculate lectureNumber
      const allLecs = await CmsService.getAllLectures();
      const existingInSub = allLecs.filter((l) => l.subjectId === targetSub.id);
      const nextLectureNumber = existingInSub.length + 1;

      const lectureFiles: LectureFile[] = [];

      // 1. Primary PDF
      if (quiz.downloadUrl) {
        lectureFiles.push({
          type: 'pdf',
          title: quiz.title,
          fileSize: quiz.fileSize || 'ملف رقمي 📄',
          downloadUrl: quiz.downloadUrl,
          fileUrl: quiz.downloadUrl,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      // 2. Explanation PDF
      if (quiz.explanationUrl) {
        lectureFiles.push({
          type: 'questions',
          title: quiz.explanationTitle || 'ملف الشرح وتوضيح الإجابات',
          fileSize: quiz.explanationFileSize || 'ملف رقمي 📄',
          downloadUrl: quiz.explanationUrl,
          fileUrl: quiz.explanationUrl,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      // 3. PPT
      if (quiz.pptUrl) {
        lectureFiles.push({
          type: 'ppt',
          title: quiz.pptTitle || 'العرض التقديمي (PowerPoint)',
          fileSize: quiz.pptFileSize || 'عرض تقديمي 📊',
          downloadUrl: quiz.pptUrl,
          fileUrl: quiz.pptUrl,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      // 4. Audio
      if (quiz.audioUrl) {
        lectureFiles.push({
          type: 'audio',
          title: quiz.audioTitle || 'الشرح والتسجيل الصوتي',
          fileSize: quiz.audioFileSize || 'تسجيل صوتي 🎧',
          downloadUrl: quiz.audioUrl,
          fileUrl: quiz.audioUrl,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      // 5. Video
      if (quiz.videoUrl) {
        lectureFiles.push({
          type: 'video',
          title: quiz.videoTitle || 'فيديو الشرح التفاعلي',
          fileSize: quiz.videoFileSize || 'فيديو شرح 🎬',
          downloadUrl: quiz.videoUrl,
          fileUrl: quiz.videoUrl,
          videoDuration: quiz.videoDuration,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      // 6. Mindmap
      if (quiz.mindmapUrl) {
        lectureFiles.push({
          type: 'mindmap',
          title: quiz.mindmapTitle || 'الخريطة الذهنية',
          fileSize: quiz.mindmapFileSize || 'خريطة ذهنية 🧠',
          downloadUrl: quiz.mindmapUrl,
          fileUrl: quiz.mindmapUrl,
          updatedAt: new Date().toLocaleDateString('ar-EG'),
        });
      }

      const finalLectureTitle = customTitle || quiz.title;
      const lectureId = `lec-${Date.now()}`;

      const newLecture: Lecture = {
        id: lectureId,
        subjectId: targetSub.id,
        yearId: targetSub.yearId || '1',
        semester: finalSem,
        subjectTitle: targetSub.title,
        yearTitle: targetSub.yearName || (targetSub.yearId === '2' ? 'السنة الثانية' : 'السنة الأولى'),
        slug: `lecture-${Date.now()}`,
        lectureNumber: nextLectureNumber,
        title: finalLectureTitle,
        subtitle: quiz.description || `محاضرة وبنك أسئلة شامل لمقرر ${targetSub.title}`,
        isFree: quiz.isFree !== false,
        price: 25,
        viewCount: 0,
        readingMinutes: 15,
        adminNote: `تم تحويل هذا المحتوى من قسم أسئلة الكويزات بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
        overview: quiz.description || '',
        concepts: [],
        files: lectureFiles,
        flashcards: Array.isArray(quiz.flashcards) ? quiz.flashcards : [],
        quiz: [],
        terminology: [],
        interventions: [],
        clinicalPearls: [],
        lastModified: Date.now(),
      };

      await CmsService.addOrUpdateLecture(newLecture);

      // Remove from quizzes
      await CmsService.deleteSubjectQuizFile(quiz.id || quiz.subjectId);

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/admin-dashboard', 'page');
        revalidatePath(`/subject/${quiz.subjectId}`, 'page');
        revalidatePath(`/subject/${targetSub.id}`, 'page');
      } catch {}

      return NextResponse.json({
        success: true,
        message: `تم تحويل ملف الكويز "${quiz.title}" بنجاح إلى محاضرة رسمية لمادة "${targetSub.title}"! 🚀`,
        lecture: newLecture,
      });
    }

    // 3. CHANGE SUBJECT ONLY
    if (action === 'change-subject') {
      const itemType = String(body.itemType || 'lecture'); // 'lecture' | 'quiz'
      const itemId = String(body.itemId || '').trim();

      if (!itemId || !targetSubjectId) {
        return NextResponse.json(
          { success: false, message: 'معرف المحتوى ومعرف المادة الجديدة مطلوبان' },
          { status: 400 }
        );
      }

      const targetSub = resolvedSubjects.find((s) => s.id === targetSubjectId);
      if (!targetSub) {
        return NextResponse.json({ success: false, message: 'المادة المحددة غير موجودة' }, { status: 404 });
      }

      if (itemType === 'lecture') {
        const lecture = await CmsService.getLectureById(itemId);
        if (!lecture) {
          return NextResponse.json({ success: false, message: 'المحاضرة غير موجودة' }, { status: 404 });
        }

        const oldSubId = lecture.subjectId;
        lecture.subjectId = targetSub.id;
        lecture.subjectTitle = targetSub.title;
        lecture.yearId = targetSub.yearId || '1';
        lecture.yearTitle = targetSub.yearName || (targetSub.yearId === '2' ? 'السنة الثانية' : 'السنة الأولى');
        if (targetSemester) {
          lecture.semester = targetSemester;
        }

        await CmsService.addOrUpdateLecture(lecture);

        try {
          revalidatePath(`/subject/${oldSubId}`, 'page');
          revalidatePath(`/subject/${targetSub.id}`, 'page');
          revalidatePath('/admin-dashboard', 'page');
        } catch {}

        return NextResponse.json({
          success: true,
          message: `تم نقل المحاضرة "${lecture.title}" إلى مادة "${targetSub.title}" بنجاح! 🚀`,
        });
      } else {
        // Quiz File
        const allQuizzes = await CmsService.getAllSubjectQuizFilesList();
        const quiz = allQuizzes.find((q) => q.id === itemId || q.subjectId === itemId);
        if (!quiz) {
          return NextResponse.json({ success: false, message: 'ملف الكويز غير موجود' }, { status: 404 });
        }

        const oldSubId = quiz.subjectId;
        const updatedQuiz = await CmsService.updateSubjectQuizFile(quiz.id || quiz.subjectId, {
          subjectId: targetSub.id,
          subjectTitle: targetSub.title,
          semester: targetSemester || quiz.semester || '1',
        });

        try {
          revalidatePath(`/subject/${oldSubId}`, 'page');
          revalidatePath(`/subject/${targetSub.id}`, 'page');
          revalidatePath('/admin-dashboard', 'page');
        } catch {}

        return NextResponse.json({
          success: true,
          message: `تم نقل ملف الكويز "${quiz.title}" إلى مادة "${targetSub.title}" بنجاح! 🚀`,
          quiz: updatedQuiz,
        });
      }
    }

    return NextResponse.json({ success: false, message: 'نوع الإجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'فشل تنفيذ الإجراء' }, { status: 500 });
  }
}
