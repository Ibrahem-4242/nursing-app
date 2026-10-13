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
  semester?: '1' | '2' | 'both';
  slug: string;
  title: string;
  englishTitle?: string;
  code?: string;
  description: string;
  icon: string;
  color: string;
  totalLectures: number;
  totalQuizzes: number;
  quizzesFile?: SubjectQuizFile;
  quizzesFiles?: SubjectQuizFile[];
}

export interface SubjectQuizFile {
  id?: string;
  subjectId: string;
  subjectTitle: string;
  semester?: '1' | '2';
  title: string;
  description?: string;
  fileSize: string;
  downloadUrl: string;
  questionsCount: number;
  updatedAt: string;
  explanationUrl?: string;
  explanationTitle?: string;
  explanationFileSize?: string;
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
  type: 'pdf' | 'ppt' | 'mindmap' | 'cards' | 'audio' | 'questions';
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
  semester?: '1' | '2';
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

export interface AnnouncementConfig {
  id: string;
  text: string;
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
  updatedAt: string;
}

export interface BrokenLinkReport {
  id: string;
  lectureId?: string;
  lectureTitle: string;
  subjectTitle: string;
  linkUrl: string;
  userNote?: string;
  userPhone?: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface ComplaintRecord {
  id: string;
  name: string;
  phone: string;
  year?: string;
  type?: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface VisitorEvent {
  id: string;
  timestamp: string;
  dateStr: string;
  deviceType: string;
  page: string;
  userAgent?: string;
  isDailyUnique?: boolean;
}

export interface DownloadEvent {
  id: string;
  timestamp: string;
  dateStr: string;
  lectureTitle: string;
  subjectTitle: string;
  fileType: string;
  fileName?: string;
}

