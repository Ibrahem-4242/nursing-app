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
  pptUrl?: string;
  pptTitle?: string;
  pptFileSize?: string;
  audioUrl?: string;
  audioTitle?: string;
  audioFileSize?: string;
  audioDuration?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoFileSize?: string;
  videoDuration?: string;
  mindmapUrl?: string;
  mindmapTitle?: string;
  mindmapFileSize?: string;
  flashcards?: Flashcard[];
  flashcardsCount?: number;
  lastModified?: number;
  isFree?: boolean;
  isLive?: boolean;
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
  clinicalPearl?: string;
  videoUrl?: string;
  videoDuration?: string;
}

export interface LectureFile {
  type: 'pdf' | 'ppt' | 'mindmap' | 'cards' | 'audio' | 'questions' | 'video';
  title: string;
  fileSize: string;
  downloadUrl: string;
  fileUrl?: string;
  fileType?: string;
  pageCount?: string;
  updatedAt: string;
  customNote?: string;
  videoDuration?: string;
  resolution?: string;
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
  videoUrl?: string;
  videoDuration?: string;
  adminNote?: string;
  lastModified?: number;
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

export interface MaintenanceConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  estimatedReturn?: string;
  contactWhatsapp?: string;
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

export interface ShakibRakibSubscription {
  isActive: boolean;
  yearId: string;
  startDate: string;
  expiresAt: string;
  monthLabel: string;
}

export interface ShakibRakibConfig {
  price: number;
  isEnabled: boolean;
  monthLabel: string;
  updatedAt?: string;
}

export interface StudentBookmarks {
  lectureIds: string[];
  questionIds: string[];
  conceptIds: string[];
}

export interface FailedLoginRecord {
  count: number;
  lockedUntil?: number;
  lastFailedAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  targetYearId?: string; // '1' | '2' | 'all'
  targetStudentId?: string;
  linkUrl?: string;
  createdAt: string;
  type: 'lecture' | 'order' | 'announcement';
}

export interface DeviceLoginRecord {
  deviceId: string;
  timestamp: number;
  ip?: string;
}

export interface ActiveDeviceSession {
  deviceId: string;
  sessionId: string;
  userAgent?: string;
  deviceLabel?: string;
  ip?: string;
  loginAt: string;
  lastActiveAt: string;
}

export type FlashcardReviewState = 'knew' | 'forgot' | 'remembered_then_forgot' | 'misunderstood';

export interface StudentFlashcardProgressRecord {
  cardId: number | string;
  cardFront?: string;
  cardBack?: string;
  lectureId: string;
  lectureTitle?: string;
  subjectId?: string;
  subjectTitle?: string;
  state: FlashcardReviewState;
  reviewedAt: string;
  reviewCount: number;
}

export interface StudentFlashcardLectureSummary {
  lectureId: string;
  lectureTitle: string;
  subjectId?: string;
  subjectTitle?: string;
  totalReviewed: number;
  masteredCount: number;
  needsPracticeCount: number;
  masteryPercentage: number;
  cards: StudentFlashcardProgressRecord[];
}

export interface StudentFlashcardsMemorySummary {
  totalReviewed: number;
  masteredCount: number;
  needsPracticeCount: number;
  masteryPercentage: number;
  byLecture: StudentFlashcardLectureSummary[];
  forgottenCards: StudentFlashcardProgressRecord[];
}

export interface StudentUser {
  id: string;
  phone: string;
  name: string;
  university: string;
  password: string;
  createdAt: string;
  purchasedLectureIds: string[];
  shakibRakibSubscription?: ShakibRakibSubscription;
  bookmarks?: StudentBookmarks;
  flashcardReviews?: Record<string, StudentFlashcardProgressRecord>;
  isActive?: boolean;
  notes?: string;
  currentSessionId?: string;
  activeDevices?: ActiveDeviceSession[];
  knownDevices?: string[];
  deviceLogins?: DeviceLoginRecord[];
  isSuspicious?: boolean;
  suspiciousReason?: string;
  suspiciousAt?: number;
  isSuspended?: boolean;
  suspendedAt?: number;
  suspensionReason?: string;
  failedLoginAttempts?: FailedLoginRecord;
  yearId?: string;
  readNotificationIds?: string[];
  totalStudySeconds?: number;
  lastActiveAt?: string;
  lastActiveTarget?: string;
}

export interface StudentActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  university?: string;
  yearId?: string;
  sessionToken?: string;
  deviceId?: string;
  targetType: 'lecture' | 'video' | 'audio' | 'pdf' | 'ppt' | 'mindmap' | 'quiz' | 'flashcards' | 'subject' | 'general';
  targetId: string;
  targetTitle: string;
  subjectTitle?: string;
  resourceTitle?: string;
  startedAt: string;
  lastHeartbeatAt: string;
  durationSeconds: number;
  details?: {
    videoProgressPercent?: number;
    videoCurrentTime?: number;
    videoDuration?: number;
    cardsFlipped?: number;
    quizScore?: number;
    quizTotal?: number;
    score?: number;
    questionsCount?: number;
    percentage?: number;
    speed?: number;
    isPreview?: boolean;
    completed?: boolean;
    tab?: string;
  };
}

export interface SubjectStudyProgress {
  subjectId: string;
  subjectTitle: string;
  totalLectures: number;
  openedLecturesCount: number;
  percent: number;
  totalDurationSeconds: number;
}

export interface StudentQuizActivityItem {
  id: string;
  targetId: string;
  targetTitle: string;
  subjectTitle?: string;
  score?: number;
  questionsCount?: number;
  percentage?: number;
  date: string;
}

export interface StudentDeviceInfo {
  deviceId: string;
  firstSeenAt?: string;
  lastActiveAt?: string;
  sessionsCount: number;
  label?: string;
  isCurrent?: boolean;
}

export interface StudentActivitySummary {
  studentId: string;
  studentName: string;
  studentPhone: string;
  university?: string;
  yearId?: string;
  totalStudySeconds: number;
  totalSessions: number;
  lastActiveAt?: string;
  lastActiveTarget?: string;
  byTypeBreakdown: Record<string, { durationSeconds: number; count: number }>;
  recentLogs: StudentActivityLog[];
  subjectProgress?: SubjectStudyProgress[];
  quizStats?: {
    totalQuizzesTaken: number;
    averageScorePercent: number;
    quizzes: StudentQuizActivityItem[];
  };
  flashcardsStats?: {
    totalSessions: number;
    totalDurationSeconds: number;
  };
  flashcardMemory?: StudentFlashcardsMemorySummary;
  devicesUsed?: StudentDeviceInfo[];
}

export interface PromoCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  usedByStudents?: string[];
  expiresAt?: string;
  isActive: boolean;
  applicableLectureIds?: string[];
  createdAt?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentUniversity: string;
  lectureId: string;
  lectureTitle: string;
  subjectTitle: string;
  orderType?: 'lecture' | 'shakib_rakib';
  yearId?: string;
  monthLabel?: string;
  price: number;
  originalPrice?: number;
  couponCode?: string;
  discountAmount?: number;
  senderPhone: string;
  contactPhone: string;
  userMessage?: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PanicModeConfig {
  isEnabled: boolean;
  activatedAt?: string;
  deactivatedAt?: string;
}

export interface PlatformFeaturesConfig {
  shakibRakib: boolean;       // باقة شاكب راكب الشهرية
  announcementBar: boolean;   // شريط الإعلانات والتنبيهات
  whatsappButton: boolean;    // زر ورابط جروب الواتساب الرسمي
  bookmarks: boolean;         // نظام محفوظاتي ليلة الامتحان
  notifications: boolean;     // جرس الإشعارات والتنبيهات
  subjectQuizzes: boolean;    // قسم كويزات وبنك أسئلة المواد
  coupons: boolean;           // نظام كوبونات وأكواد الخصم
  audioSummaries: boolean;    // الملخصات الصوتية Audio
  videoLectures: boolean;     // فيديوهات وشروحات المحاضرات Video
  mindmaps: boolean;          // الخرائط الذهنية Mind Maps
  powerpointPpt: boolean;     // عروض البوربوينت PPT
  flashcards: boolean;        // كروت الاستذكار Flashcards
  statsBar: boolean;          // شريط إحصائيات وأرقام المنصة
  updatedAt?: string;
}



