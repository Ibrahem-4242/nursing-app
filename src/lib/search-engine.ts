import React from 'react';

export interface IndexedConcept {
  index: number;
  heading: string;
  summary: string;
  points: string[];
  clinicalWarning?: string;
}

export interface IndexedTerm {
  index: number;
  term: string;
  arabic: string;
  definition: string;
  clinicalRelevance?: string;
}

export interface IndexedQuiz {
  index: number;
  id: number;
  question: string;
  explanation: string;
  pearl?: string;
}

export interface IndexedFlashcard {
  index: number;
  id: number;
  front: string;
  back: string;
  category?: string;
}

export interface IndexedIntervention {
  index: number;
  title: string;
  rationale: string;
  actionSteps: string[];
}

export interface IndexedLecture {
  lectureId: string;
  lectureTitle: string;
  lectureNumber: number;
  subtitle: string;
  overview: string;
  subjectId: string;
  subjectTitle: string;
  yearId: string;
  yearTitle: string;
  semester?: '1' | '2';
  isFree: boolean;
  price: number;
  readingMinutes: number;
  viewCount: number;
  concepts: IndexedConcept[];
  terminology: IndexedTerm[];
  quiz: IndexedQuiz[];
  flashcards: IndexedFlashcard[];
  interventions: IndexedIntervention[];
  clinicalPearls?: string[];
}

export interface IndexedSubject {
  id: string;
  title: string;
  englishTitle?: string;
  description: string;
  yearId: string;
  yearName: string;
}

export interface LectureMatch {
  lecture: IndexedLecture;
  matchedField: string;
  matchedSnippet: string;
  score: number;
}

export interface ConceptMatch {
  lectureId: string;
  lectureTitle: string;
  subjectTitle: string;
  yearTitle: string;
  concept: IndexedConcept;
  matchedField: string;
  matchedSnippet: string;
  score: number;
}

export type QuizOrTermType = 'quiz' | 'term' | 'flashcard' | 'intervention';

export interface QuizOrTermMatch {
  type: QuizOrTermType;
  lectureId: string;
  lectureTitle: string;
  subjectTitle: string;
  yearTitle: string;
  item: IndexedQuiz | IndexedTerm | IndexedFlashcard | IndexedIntervention;
  title: string;
  subtitle?: string;
  matchedField: string;
  matchedSnippet: string;
  badgeLabel: string;
  targetAnchor: string;
  targetTab?: string;
  score: number;
}

export interface SearchMatchResult {
  matchingLectures: LectureMatch[];
  matchingConcepts: ConceptMatch[];
  matchingQuizzesAndTerms: QuizOrTermMatch[];
  totalMatches: number;
}

/**
 * Normalizes text for Arabic and English medical searches
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics / tashkeel
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates a regex that accounts for Arabic character variations (alif, taa marbuta, etc.)
 */
export function createHighlightRegex(query: string): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const words = trimmed
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (words.length === 0) return null;

  const wordPatterns = words.map((w) => {
    return w
      .split('')
      .map((ch) => {
        if (/[أإآا]/.test(ch)) return '[أإآا]';
        if (/[ةه]/.test(ch)) return '[ةه]';
        if (/[يى]/.test(ch)) return '[يى]';
        // Escape standard regex characters
        return ch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      })
      .join('');
  });

  try {
    return new RegExp(`(${wordPatterns.join('|')})`, 'gi');
  } catch {
    return null;
  }
}

/**
 * Extracts a concise snippet centered around the match
 */
function extractSnippet(fullText: string, queryWords: string[], maxLength = 120): string {
  if (!fullText) return '';
  const normalizedFull = normalizeText(fullText);

  let firstIndex = -1;
  for (const qWord of queryWords) {
    const idx = normalizedFull.indexOf(qWord);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return fullText.slice(0, maxLength) + (fullText.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, firstIndex - 30);
  const end = Math.min(fullText.length, start + maxLength);
  let snippet = fullText.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < fullText.length) snippet = snippet + '...';

  return snippet;
}

/**
 * High-performance search execution across all indexed items
 */
export function executeSearch(
  query: string,
  lectures: IndexedLecture[],
  subjects: IndexedSubject[] = []
): SearchMatchResult {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      matchingLectures: [],
      matchingConcepts: [],
      matchingQuizzesAndTerms: [],
      totalMatches: 0,
    };
  }

  const normalizedQuery = normalizeText(cleanQuery);
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);

  const matchingLectures: LectureMatch[] = [];
  const matchingConcepts: ConceptMatch[] = [];
  const matchingQuizzesAndTerms: QuizOrTermMatch[] = [];

  // Helper to test if all query tokens are present or calculate match density
  const scoreText = (rawText: string, weight = 1): number => {
    if (!rawText) return 0;
    const norm = normalizeText(rawText);
    if (!norm) return 0;

    if (norm === normalizedQuery) return 100 * weight;
    if (norm.includes(normalizedQuery)) return 80 * weight;

    let hits = 0;
    for (const w of queryWords) {
      if (norm.includes(w)) hits++;
    }

    if (hits === 0) return 0;
    const ratio = hits / queryWords.length;
    return ratio * 50 * weight;
  };

  // 1. SEARCH LECTURES & SUBJECTS
  for (const lec of lectures) {
    let bestLecScore = 0;
    let matchedField = '';
    let snippet = '';

    const titleScore = scoreText(lec.lectureTitle, 2.5);
    if (titleScore > bestLecScore) {
      bestLecScore = titleScore;
      matchedField = 'عنوان المحاضرة';
      snippet = lec.lectureTitle;
    }

    const subTitleScore = scoreText(lec.subtitle, 1.8);
    if (subTitleScore > bestLecScore) {
      bestLecScore = subTitleScore;
      matchedField = 'الموضوع الرئيسي';
      snippet = extractSnippet(lec.subtitle, queryWords);
    }

    const subjectScore = scoreText(lec.subjectTitle, 2.0);
    if (subjectScore > bestLecScore) {
      bestLecScore = subjectScore;
      matchedField = 'المادة الدراسية';
      snippet = lec.subjectTitle;
    }

    const overviewScore = scoreText(lec.overview, 1.2);
    if (overviewScore > bestLecScore) {
      bestLecScore = overviewScore;
      matchedField = 'ملخص المحاضرة';
      snippet = extractSnippet(lec.overview, queryWords);
    }

    if (bestLecScore > 20) {
      matchingLectures.push({
        lecture: lec,
        matchedField,
        matchedSnippet: snippet || lec.subtitle || lec.overview,
        score: bestLecScore,
      });
    }

    // 2. SEARCH CLINICAL CONCEPTS
    for (const concept of lec.concepts || []) {
      let conceptScore = 0;
      let cField = '';
      let cSnippet = '';

      const hScore = scoreText(concept.heading, 2.2);
      if (hScore > conceptScore) {
        conceptScore = hScore;
        cField = 'عنوان المفهوم الطبي';
        cSnippet = concept.heading;
      }

      const sumScore = scoreText(concept.summary, 1.5);
      if (sumScore > conceptScore) {
        conceptScore = sumScore;
        cField = 'شرح المفهوم';
        cSnippet = extractSnippet(concept.summary, queryWords);
      }

      for (const pt of concept.points || []) {
        const ptScore = scoreText(pt, 1.3);
        if (ptScore > conceptScore) {
          conceptScore = ptScore;
          cField = 'نقطة سريرية';
          cSnippet = extractSnippet(pt, queryWords);
        }
      }

      if (concept.clinicalWarning) {
        const warnScore = scoreText(concept.clinicalWarning, 1.6);
        if (warnScore > conceptScore) {
          conceptScore = warnScore;
          cField = 'تحذير سريري هام ⚠️';
          cSnippet = extractSnippet(concept.clinicalWarning, queryWords);
        }
      }

      if (conceptScore > 20) {
        matchingConcepts.push({
          lectureId: lec.lectureId,
          lectureTitle: lec.lectureTitle,
          subjectTitle: lec.subjectTitle,
          yearTitle: lec.yearTitle,
          concept,
          matchedField: cField,
          matchedSnippet: cSnippet || concept.summary,
          score: conceptScore,
        });
      }
    }

    // 3. SEARCH QUIZZES
    for (const q of lec.quiz || []) {
      let qScore = 0;
      let qSnippet = '';

      const questScore = scoreText(q.question, 2.0);
      if (questScore > qScore) {
        qScore = questScore;
        qSnippet = q.question;
      }

      const expScore = scoreText(q.explanation, 1.4);
      if (expScore > qScore) {
        qScore = expScore;
        qSnippet = extractSnippet(q.explanation, queryWords);
      }

      if (qScore > 20) {
        matchingQuizzesAndTerms.push({
          type: 'quiz',
          lectureId: lec.lectureId,
          lectureTitle: lec.lectureTitle,
          subjectTitle: lec.subjectTitle,
          yearTitle: lec.yearTitle,
          item: q,
          title: q.question,
          subtitle: q.explanation ? extractSnippet(q.explanation, queryWords) : undefined,
          matchedField: questScore >= expScore ? 'سؤال الكويز' : 'التعليل والحل النموذجي',
          matchedSnippet: qSnippet,
          badgeLabel: 'سؤال كويز ❓',
          targetAnchor: `quiz-${q.index}`,
          targetTab: 'questions',
          score: qScore,
        });
      }
    }

    // 4. SEARCH MEDICAL TERMINOLOGY
    for (const term of lec.terminology || []) {
      let tScore = 0;
      let tSnippet = '';

      const enScore = scoreText(term.term, 2.2);
      if (enScore > tScore) {
        tScore = enScore;
        tSnippet = `${term.term} - ${term.arabic}`;
      }

      const arScore = scoreText(term.arabic, 2.2);
      if (arScore > tScore) {
        tScore = arScore;
        tSnippet = `${term.arabic} (${term.term})`;
      }

      const defScore = scoreText(term.definition, 1.3);
      if (defScore > tScore) {
        tScore = defScore;
        tSnippet = extractSnippet(term.definition, queryWords);
      }

      if (tScore > 20) {
        matchingQuizzesAndTerms.push({
          type: 'term',
          lectureId: lec.lectureId,
          lectureTitle: lec.lectureTitle,
          subjectTitle: lec.subjectTitle,
          yearTitle: lec.yearTitle,
          item: term,
          title: `${term.term} • ${term.arabic}`,
          subtitle: term.definition,
          matchedField: 'مصطلح طبي وتعريفه',
          matchedSnippet: tSnippet,
          badgeLabel: 'مصطلح طبي 🩺',
          targetAnchor: `term-${term.index}`,
          score: tScore,
        });
      }
    }

    // 5. SEARCH FLASHCARDS
    for (const card of lec.flashcards || []) {
      let cScore = 0;
      let cSnippet = '';

      const frontScore = scoreText(card.front, 1.8);
      if (frontScore > cScore) {
        cScore = frontScore;
        cSnippet = card.front;
      }

      const backScore = scoreText(card.back, 1.6);
      if (backScore > cScore) {
        cScore = backScore;
        cSnippet = extractSnippet(card.back, queryWords);
      }

      if (cScore > 20) {
        matchingQuizzesAndTerms.push({
          type: 'flashcard',
          lectureId: lec.lectureId,
          lectureTitle: lec.lectureTitle,
          subjectTitle: lec.subjectTitle,
          yearTitle: lec.yearTitle,
          item: card,
          title: card.front,
          subtitle: card.back,
          matchedField: frontScore >= backScore ? 'وجه الكارت (السؤال)' : 'ظهر الكارت (الإجابة)',
          matchedSnippet: cSnippet,
          badgeLabel: 'كارت ذكي 🎴',
          targetAnchor: `flashcard-${card.index}`,
          targetTab: 'flashcards',
          score: cScore,
        });
      }
    }

    // 6. SEARCH NURSING INTERVENTIONS
    for (const action of lec.interventions || []) {
      let aScore = 0;
      let aSnippet = '';

      const titleScore = scoreText(action.title, 2.0);
      if (titleScore > aScore) {
        aScore = titleScore;
        aSnippet = action.title;
      }

      const ratScore = scoreText(action.rationale, 1.4);
      if (ratScore > aScore) {
        aScore = ratScore;
        aSnippet = extractSnippet(action.rationale, queryWords);
      }

      for (const step of action.actionSteps || []) {
        const stepScore = scoreText(step, 1.2);
        if (stepScore > aScore) {
          aScore = stepScore;
          aSnippet = extractSnippet(step, queryWords);
        }
      }

      if (aScore > 20) {
        matchingQuizzesAndTerms.push({
          type: 'intervention',
          lectureId: lec.lectureId,
          lectureTitle: lec.lectureTitle,
          subjectTitle: lec.subjectTitle,
          yearTitle: lec.yearTitle,
          item: action,
          title: action.title,
          subtitle: action.rationale,
          matchedField: 'تدخل تمريضي عملي',
          matchedSnippet: aSnippet,
          badgeLabel: 'تدخل سريري 💉',
          targetAnchor: `intervention-${action.index}`,
          score: aScore,
        });
      }
    }
  }

  // Sort all categories by score descending
  matchingLectures.sort((a, b) => b.score - a.score);
  matchingConcepts.sort((a, b) => b.score - a.score);
  matchingQuizzesAndTerms.sort((a, b) => b.score - a.score);

  const totalMatches =
    matchingLectures.length + matchingConcepts.length + matchingQuizzesAndTerms.length;

  return {
    matchingLectures,
    matchingConcepts,
    matchingQuizzesAndTerms,
    totalMatches,
  };
}
