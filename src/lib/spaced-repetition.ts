import { FlashcardReviewState, StudentFlashcardProgressRecord, StudentStudyStreak } from '@/lib/types';

/**
 * Returns Cairo date string in YYYY-MM-DD format
 */
export function getCairoDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  d.setDate(d.getDate() + days);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * SM-2 inspired spacing algorithm for medical flashcards
 * Evaluates the 4 clinical memory rating states:
 * 1. forgot: "مش فاكرها خالص / صعبة" -> interval = 1, repetitions = 0
 * 2. misunderstood: "المعلومة وصلتلي غلط" -> interval = 1, repetitions = 0
 * 3. remembered_then_forgot: "كنت فاكرها بس نسيتها" -> interval = 2
 * 4. knew: "متقنها وفاكرها كويس" -> 1 day -> 3 days -> 7 days -> 16 days -> 30 days...
 */
export function calculateNextSpacedReview(
  existing?: Partial<StudentFlashcardProgressRecord>,
  rating: FlashcardReviewState = 'knew',
  baseDate: Date = new Date()
): {
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  lastRating: FlashcardReviewState;
  reviewedAt: string;
} {
  let repetitions = existing?.repetitions || 0;
  let easeFactor = existing?.easeFactor || 2.5;
  let intervalDays = 1;

  if (rating === 'forgot') {
    // 1. مش فاكرها خالص / صعبة
    repetitions = 0;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    intervalDays = 1;
  } else if (rating === 'misunderstood') {
    // 2. المعلومة وصلتلي غلط
    repetitions = 0;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    intervalDays = 1;
  } else if (rating === 'remembered_then_forgot') {
    // 3. كنت فاكرها بس نسيتها
    repetitions = Math.max(1, repetitions);
    easeFactor = Math.max(1.3, Number((easeFactor - 0.05).toFixed(2)));
    intervalDays = 2;
  } else {
    // 4. متقنها وفاكرها كويس (knew)
    repetitions += 1;
    easeFactor = Math.min(3.0, Number((easeFactor + 0.1).toFixed(2)));

    // Progression: 1 -> 3 -> 7 -> 16 -> 30 days
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else if (repetitions === 3) {
      intervalDays = 7;
    } else if (repetitions === 4) {
      intervalDays = 16;
    } else if (repetitions === 5) {
      intervalDays = 30;
    } else {
      const prevInterval = existing?.intervalDays || 30;
      intervalDays = Math.min(180, Math.round(prevInterval * easeFactor));
    }
  }

  const todayStr = getCairoDateString(baseDate);
  const nextReviewDate = addDaysToDate(todayStr, intervalDays);

  return {
    intervalDays,
    repetitions,
    easeFactor,
    nextReviewDate,
    lastRating: rating,
    reviewedAt: new Date().toISOString(),
  };
}

/**
 * Checks if a card is due for review on a given date (defaults to today)
 */
export function isCardDue(card: Partial<StudentFlashcardProgressRecord>, todayStr: string = getCairoDateString()): boolean {
  if (!card) return false;

  // If nextReviewDate is set, compare with today
  if (card.nextReviewDate) {
    return card.nextReviewDate <= todayStr;
  }

  // If card was rated forgot or misunderstood, it is due immediately
  if (card.state === 'forgot' || card.state === 'misunderstood' || card.state === 'remembered_then_forgot') {
    return true;
  }

  // If never scheduled or no state, it's due if it exists
  return true;
}

/**
 * Updates or increments student study streak upon completing daily review session
 */
export function evaluateStudyStreak(
  streak?: StudentStudyStreak,
  todayStr: string = getCairoDateString()
): {
  currentStreak: number;
  lastStreakDate: string;
  longestStreak: number;
  isNewStreakDay: boolean;
} {
  const currentStreak = streak?.currentStreak || 0;
  const lastStreakDate = streak?.lastStreakDate;
  const longestStreak = streak?.longestStreak || currentStreak;
  const yesterdayStr = addDaysToDate(todayStr, -1);

  if (lastStreakDate === todayStr) {
    // Already counted for today
    return {
      currentStreak: Math.max(1, currentStreak),
      lastStreakDate: todayStr,
      longestStreak: Math.max(longestStreak, currentStreak),
      isNewStreakDay: false,
    };
  }

  if (lastStreakDate === yesterdayStr) {
    // Consecutive day
    const updatedStreak = currentStreak + 1;
    return {
      currentStreak: updatedStreak,
      lastStreakDate: todayStr,
      longestStreak: Math.max(longestStreak, updatedStreak),
      isNewStreakDay: true,
    };
  }

  // Streak broken or brand new
  return {
    currentStreak: 1,
    lastStreakDate: todayStr,
    longestStreak: Math.max(longestStreak, 1),
    isNewStreakDay: true,
  };
}

/**
 * Returns true if streak is currently active (reviewed yesterday or today)
 */
export function isStreakActive(streak?: StudentStudyStreak, todayStr: string = getCairoDateString()): boolean {
  if (!streak || !streak.lastStreakDate || streak.currentStreak <= 0) return false;
  const yesterdayStr = addDaysToDate(todayStr, -1);
  return streak.lastStreakDate === todayStr || streak.lastStreakDate === yesterdayStr;
}
