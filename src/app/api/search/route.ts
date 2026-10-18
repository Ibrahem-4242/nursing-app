import { NextResponse } from 'next/server';
import { CmsService } from '@/lib/cms-db';
import { ACADEMIC_YEARS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json(
        { success: true, count: 0, index: [] },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    const [liveLectures, liveSubjects] = await Promise.all([
      CmsService.getLiveLectures(),
      CmsService.getLiveSubjects(),
    ]);

    // Build subject and year lookup maps for fast indexing
    const subjectMap = new Map<string, { title: string; yearId: string }>();
    for (const sub of liveSubjects) {
      subjectMap.set(sub.id, { title: sub.title, yearId: sub.yearId });
      if (sub.slug) {
        subjectMap.set(sub.slug, { title: sub.title, yearId: sub.yearId });
      }
    }

    const yearMap = new Map<string, string>();
    for (const yr of ACADEMIC_YEARS) {
      yearMap.set(yr.id, yr.title);
    }

    // Build lightweight searchable items for every live lecture
    const indexedLectures = liveLectures.map((lec) => {
      const subInfo = subjectMap.get(lec.subjectId);
      const subjectTitle = lec.subjectTitle || subInfo?.title || 'مادة تمريضية';
      const yearId = lec.yearId || subInfo?.yearId || '1';
      const yearTitle = lec.yearTitle || yearMap.get(yearId) || 'السنة الدراسية';

      return {
        lectureId: lec.id,
        lectureTitle: lec.title || '',
        lectureNumber: lec.lectureNumber || 1,
        subtitle: lec.subtitle || '',
        overview: lec.overview || '',
        subjectId: lec.subjectId,
        subjectTitle,
        yearId,
        yearTitle,
        semester: lec.semester || '1',
        isFree: lec.isFree ?? true,
        price: lec.price || 50,
        readingMinutes: lec.readingMinutes || 15,
        viewCount: lec.viewCount || 0,
        concepts: (lec.concepts || []).map((c, idx) => ({
          index: idx,
          heading: c.heading || '',
          summary: c.summary || '',
          points: c.points || [],
          clinicalWarning: c.clinicalWarning || '',
        })),
        terminology: (lec.terminology || []).map((t, idx) => ({
          index: idx,
          term: t.term || '',
          arabic: t.arabic || '',
          definition: t.definition || '',
          clinicalRelevance: t.clinicalRelevance || '',
        })),
        quiz: (lec.quiz || []).map((q, idx) => ({
          index: idx,
          id: q.id ?? idx + 1,
          question: q.question || '',
          explanation: q.explanation || '',
          pearl: q.pearl || '',
        })),
        flashcards: (lec.flashcards || []).map((f, idx) => ({
          index: idx,
          id: f.id ?? idx + 1,
          front: f.front || '',
          back: f.back || '',
          category: f.category || '',
        })),
        interventions: (lec.interventions || []).map((action, idx) => ({
          index: idx,
          title: action.title || '',
          rationale: action.rationale || '',
          actionSteps: action.actionSteps || [],
        })),
        clinicalPearls: lec.clinicalPearls || [],
      };
    });

    const indexedSubjects = liveSubjects.map((s) => ({
      id: s.id,
      title: s.title,
      englishTitle: s.englishTitle || '',
      description: s.description || '',
      yearId: s.yearId,
      yearName: s.yearName || yearMap.get(s.yearId) || '',
    }));

    return NextResponse.json(
      {
        success: true,
        lectures: indexedLectures,
        subjects: indexedSubjects,
        totalLectures: indexedLectures.length,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('[SearchAPI] Error generating search index:', err);
    return NextResponse.json(
      { success: false, message: 'فشل في إنشاء فهرس البحث الطبي' },
      { status: 500 }
    );
  }
}
