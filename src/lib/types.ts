export interface AcademicYear {
  id: string;
  slug: string;
  title: string;
  badge: string;
  stageName: string;
  description: string;
  icon: string;
  subjectsCount: number;
  color: {
    bg: string;
    border: string;
    text: string;
    gradient: string;
    accent: string;
  };
}

export interface Subject {
  id: string;
  yearId: string;
  yearName: string;
  slug: string;
  title: string;
  englishTitle: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  totalLectures: number;
  totalQuizzes: number;
}

export interface MedicalTerm {
  term: string;
  arabic: string;
  definition: string;
  clinicalRelevance: string;
}

export interface ClinicalConcept {
  heading: string;
  summary: string;
  points: string[];
  clinicalWarning?: string;
}

export interface NursingIntervention {
  title: string;
  rationale: string;
  actionSteps: string[];
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
  clinicalPearl?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pearl?: string;
}

export interface LectureFile {
  type: 'pdf' | 'ppt' | 'mindmap' | 'cards';
  title: string;
  fileSize: string;
  downloadUrl: string;
  pageCount?: string;
  updatedAt: string;
  customNote?: string;
}

export interface Lecture {
  id: string;
  subjectId: string;
  yearId: string;
  subjectTitle: string;
  yearTitle: string;
  slug: string;
  lectureNumber: number;
  title: string;
  subtitle: string;
  isFree: boolean;
  price: number;
  viewCount: number;
  readingMinutes: number;
  threeDModelType?: 'heart' | 'dna' | 'cell' | 'brain' | 'lungs';
  overview: string;
  concepts: ClinicalConcept[];
  terminology: MedicalTerm[];
  interventions: NursingIntervention[];
  clinicalPearls: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  files: LectureFile[];
  adminNote?: string;
}

export interface QuizItem {
  id: string;
  quizNumber: number;
  title: string;
  subjectId: string;
  yearId: string;
  isFree: boolean;
  price: number;
  questionsCount: number;
  durationMinutes: number;
  fileUrl: string;
  customNote?: string;
}
