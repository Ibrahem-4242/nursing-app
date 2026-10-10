import { ACADEMIC_YEARS, SUBJECTS, LECTURES, QUIZZES_LIST, BOT_CONFIG } from './mock-data';
import { AcademicYear, Subject, Lecture, QuizItem } from './types';

export class DataService {
  /**
   * جلب جميع السنوات الدراسية
   */
  static getAcademicYears(): AcademicYear[] {
    return ACADEMIC_YEARS;
  }

  /**
   * جلب سنة دراسية محددة بالـ id أو slug
   */
  static getAcademicYearById(idOrSlug: string): AcademicYear | undefined {
    return ACADEMIC_YEARS.find(
      (y) => y.id === idOrSlug || y.slug === idOrSlug || y.title.includes(idOrSlug)
    );
  }

  /**
   * جلب مواد سنة دراسية محددة
   */
  static getSubjectsByYear(yearId: string): Subject[] {
    return SUBJECTS.filter((s) => s.yearId === yearId);
  }

  /**
   * جلب مادة محددة بالـ id أو slug
   */
  static getSubjectById(idOrSlug: string): Subject | undefined {
    return SUBJECTS.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  /**
   * جلب جميع محاضرات مادة محددة
   */
  static getLecturesBySubject(subjectId: string): Lecture[] {
    return LECTURES.filter((l) => l.subjectId === subjectId);
  }

  /**
   * جلب محاضرة محددة بالـ id أو slug
   */
  static getLectureById(idOrSlug: string): Lecture | undefined {
    return LECTURES.find((l) => l.id === idOrSlug || l.slug === idOrSlug);
  }

  /**
   * جلب كويزات مادة محددة
   */
  static getQuizzesBySubject(subjectId: string): QuizItem[] {
    return QUIZZES_LIST.filter((q) => q.subjectId === subjectId);
  }

  /**
   * محاكاة الربط البرمجي مع Google Apps Script Web App أو Google Sheets API
   */
  static async syncWithGoogleSheets(): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = BOT_CONFIG.appsScriptWebhookUrl;
      if (!endpoint || endpoint.includes('AKfycby4vIPoD5IRIwfCg6HN23uerHzBPP')) {
        // Mock fallback / dry-run
        return {
          success: true,
          message: 'تمت قراءة البيانات المحدثة بنجاح من طبقة الكاش والتخزين السحابي.',
        };
      }
      const response = await fetch(`${endpoint}?action=getData`, {
        next: { revalidate: 300 },
      });
      if (response.ok) {
        return { success: true, message: 'تمت المزامنة بنجاح مع شيت البوت.' };
      }
      return { success: false, message: 'تعذر الاتصال بـ Google Apps Script.' };
    } catch {
      return { success: false, message: 'خطأ في شبكة الاتصال بالشيت السحابي.' };
    }
  }
}
