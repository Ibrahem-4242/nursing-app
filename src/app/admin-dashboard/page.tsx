'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Upload,
  FileText,
  Megaphone,
  AlertTriangle,
  Send,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Eye,
  ExternalLink,
  Layers,
  Sparkles,
  Loader2,
  Users,
  DownloadCloud,
  Check,
  FileUp,
  MessageCircle,
  BarChart3,
  Clock,
  HelpCircle,
  Pencil,
  EyeOff,
  X,
  BookOpen,
  Lock,
  Unlock,
  Wrench,
  Gift,
  Headphones,
  Plus,
  CreditCard,
  KeyRound,
  ShieldAlert,
  Smartphone,
  School,
  UserCheck,
  Presentation,
  Network,
  Crown,
  Zap,
} from 'lucide-react';
import { MOCK_SUBJECTS } from '@/lib/mock-data';
import { parseAnkiPackage } from '@/lib/anki-parser';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { PurchaseOrder, StudentUser, ShakibRakibConfig } from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'lectures' | 'subjects' | 'quizzes' | 'orders' | 'students' | 'shakibRakib' | 'announcement' | 'maintenance' | 'reports' | 'telegram'>('upload');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [serverCloudToken, setServerCloudToken] = useState<string>('');

  // Subject Quizzes Form state
  const [quizSubjectId, setQuizSubjectId] = useState('anatomy');
  const [quizSemester, setQuizSemester] = useState<'1' | '2'>('1');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizUploadMode, setQuizUploadMode] = useState<'file' | 'link'>('file');
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [quizDriveUrl, setQuizDriveUrl] = useState('');
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(150);
  const [quizApplyWatermark, setQuizApplyWatermark] = useState(true);
  const [quizExplanationMode, setQuizExplanationMode] = useState<'file' | 'link'>('file');
  const [quizExplanationFile, setQuizExplanationFile] = useState<File | null>(null);
  const [quizExplanationDriveUrl, setQuizExplanationDriveUrl] = useState('');
  const [quizExplanationTitle, setQuizExplanationTitle] = useState('');

  // Quiz Multimedia Attachments state (PPT, Audio, Mindmap, Flashcards)
  const [quizPptUploadMode, setQuizPptUploadMode] = useState<'file' | 'link'>('file');
  const [quizPptFile, setQuizPptFile] = useState<File | null>(null);
  const [quizPptDriveUrl, setQuizPptDriveUrl] = useState('');
  const [quizPptTitle, setQuizPptTitle] = useState('');

  const [quizAudioUploadMode, setQuizAudioUploadMode] = useState<'file' | 'link'>('file');
  const [quizAudioFile, setQuizAudioFile] = useState<File | null>(null);
  const [quizAudioDriveUrl, setQuizAudioDriveUrl] = useState('');
  const [quizAudioTitle, setQuizAudioTitle] = useState('');

  const [quizMindmapUploadMode, setQuizMindmapUploadMode] = useState<'file' | 'link'>('file');
  const [quizMindmapFile, setQuizMindmapFile] = useState<File | null>(null);
  const [quizMindmapDriveUrl, setQuizMindmapDriveUrl] = useState('');
  const [quizMindmapTitle, setQuizMindmapTitle] = useState('');

  const [quizAnkiFile, setQuizAnkiFile] = useState<File | null>(null);
  const [quizParsedCardsJson, setQuizParsedCardsJson] = useState<string | null>(null);
  const [quizParsedCardsCount, setQuizParsedCardsCount] = useState<number>(0);
  const [isQuizParsingAnki, setIsQuizParsingAnki] = useState(false);

  const [quizIsFree, setQuizIsFree] = useState(true);
  const [quizIsLive, setQuizIsLive] = useState(true);
  const [isUploadingQuiz, setIsUploadingQuiz] = useState(false);
  const [quizUploadFeedback, setQuizUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState<Record<string, any>>({});
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [isLoadingSubjectQuizzes, setIsLoadingSubjectQuizzes] = useState(false);

  // Edit Quiz Modal state
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState('');
  const [editQuizSubjectId, setEditQuizSubjectId] = useState('anatomy');
  const [editQuizSemester, setEditQuizSemester] = useState<'1' | '2'>('1');
  const [editQuizQuestionsCount, setEditQuizQuestionsCount] = useState(150);
  const [editQuizDriveUrl, setEditQuizDriveUrl] = useState('');
  const [editQuizInitialDriveUrl, setEditQuizInitialDriveUrl] = useState('');
  const [editQuizFile, setEditQuizFile] = useState<File | null>(null);
  const [editQuizExplanationFile, setEditQuizExplanationFile] = useState<File | null>(null);
  const [editQuizExplanationDriveUrl, setEditQuizExplanationDriveUrl] = useState('');
  const [editQuizInitialExplanationUrl, setEditQuizInitialExplanationUrl] = useState('');
  const [editQuizExplanationTitle, setEditQuizExplanationTitle] = useState('');
  const [editRemoveQuizExplanation, setEditRemoveQuizExplanation] = useState(false);

  // Edit Quiz Multimedia state
  const [editQuizPptFile, setEditQuizPptFile] = useState<File | null>(null);
  const [editQuizPptDriveUrl, setEditQuizPptDriveUrl] = useState('');
  const [editQuizInitialPptUrl, setEditQuizInitialPptUrl] = useState('');
  const [editQuizPptTitle, setEditQuizPptTitle] = useState('');
  const [editRemoveQuizPpt, setEditRemoveQuizPpt] = useState(false);

  const [editQuizAudioFile, setEditQuizAudioFile] = useState<File | null>(null);
  const [editQuizAudioDriveUrl, setEditQuizAudioDriveUrl] = useState('');
  const [editQuizInitialAudioUrl, setEditQuizInitialAudioUrl] = useState('');
  const [editQuizAudioTitle, setEditQuizAudioTitle] = useState('');
  const [editRemoveQuizAudio, setEditRemoveQuizAudio] = useState(false);

  const [editQuizMindmapFile, setEditQuizMindmapFile] = useState<File | null>(null);
  const [editQuizMindmapDriveUrl, setEditQuizMindmapDriveUrl] = useState('');
  const [editQuizInitialMindmapUrl, setEditQuizInitialMindmapUrl] = useState('');
  const [editQuizMindmapTitle, setEditQuizMindmapTitle] = useState('');
  const [editRemoveQuizMindmap, setEditRemoveQuizMindmap] = useState(false);

  const [editQuizAnkiFile, setEditQuizAnkiFile] = useState<File | null>(null);
  const [editQuizParsedCardsJson, setEditQuizParsedCardsJson] = useState<string | null>(null);
  const [editQuizParsedCardsCount, setEditQuizParsedCardsCount] = useState<number>(0);
  const [isEditQuizParsingAnki, setIsEditQuizParsingAnki] = useState(false);
  const [editRemoveQuizFlashcards, setEditRemoveQuizFlashcards] = useState(false);

  const [editQuizIsFree, setEditQuizIsFree] = useState(true);
  const [editQuizIsLive, setEditQuizIsLive] = useState(true);
  const [isSavingQuizEdit, setIsSavingQuizEdit] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    todayVisitors: 0,
    totalVisitors: 0,
    todayDownloads: 0,
    totalDownloads: 0,
    totalLectures: 0,
    pendingReports: 0,
  });

  // Upload Form state
  const [yearId, setYearId] = useState('1');
  const [subjectId, setSubjectId] = useState('anatomy');
  const [semester, setSemester] = useState<'1' | '2'>('1');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [overview, setOverview] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(50);
  const [uploadMode, setUploadMode] = useState<'file' | 'link' | 'none'>('file');
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
  const [pptUploadMode, setPptUploadMode] = useState<'file' | 'link'>('file');
  const [externalPptUrl, setExternalPptUrl] = useState('');
  const [mindmapUploadMode, setMindmapUploadMode] = useState<'file' | 'link'>('file');
  const [externalMindmapUrl, setExternalMindmapUrl] = useState('');
  const [audioUploadMode, setAudioUploadMode] = useState<'file' | 'link'>('file');
  const [externalAudioUrl, setExternalAudioUrl] = useState('');
  const [questionsUploadMode, setQuestionsUploadMode] = useState<'file' | 'link'>('file');
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [externalQuestionsUrl, setExternalQuestionsUrl] = useState('');
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [ankiFile, setAnkiFile] = useState<File | null>(null);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [mindmapFile, setMindmapFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isImportingAnki, setIsImportingAnki] = useState<string | null>(null);
  const [parsedCardsJson, setParsedCardsJson] = useState<string | null>(null);
  const [parsedCardsCount, setParsedCardsCount] = useState<number>(0);
  const [isParsingAnki, setIsParsingAnki] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic Subjects state
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubYearId, setNewSubYearId] = useState('1');
  const [newSubSemester, setNewSubSemester] = useState<'1' | '2' | 'both'>('1');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectFeedback, setSubjectFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Subject Modal state
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editSubYearId, setEditSubYearId] = useState('1');
  const [editSubSemester, setEditSubSemester] = useState<'1' | '2' | 'both'>('1');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [isSavingSubjectEdit, setIsSavingSubjectEdit] = useState(false);

  // Quick Add Subject Modal state (accessible directly from any dropdown or form)
  const [isQuickAddSubOpen, setIsQuickAddSubOpen] = useState(false);
  const [quickAddTarget, setQuickAddTarget] = useState<'lecture' | 'quiz' | 'editLecture' | 'editQuiz'>('lecture');
  const [quickSubTitle, setQuickSubTitle] = useState('');
  const [quickSubEnglishTitle, setQuickSubEnglishTitle] = useState('');
  const [quickSubYearId, setQuickSubYearId] = useState('1');
  const [quickSubSemester, setQuickSubSemester] = useState<'1' | '2' | 'both'>('1');
  const [quickSubDesc, setQuickSubDesc] = useState('');
  const [isSubmittingQuickSub, setIsSubmittingQuickSub] = useState(false);
  const [quickSubFeedback, setQuickSubFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lectures state
  const [lectures, setLectures] = useState<any[]>([]);
  const [lectureSemesterFilter, setLectureSemesterFilter] = useState<'all' | '1' | '2'>('all');
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);
  const [editingLecture, setEditingLecture] = useState<any | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('anatomy');
  const [editLectureNumber, setEditLectureNumber] = useState(1);
  const [editSemester, setEditSemester] = useState<'1' | '2'>('1');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [editIsFree, setEditIsFree] = useState(true);
  const [editPrice, setEditPrice] = useState(50);
  const [editPdfUrl, setEditPdfUrl] = useState('');
  const [editInitPdfUrl, setEditInitPdfUrl] = useState('');
  const [editPptUrl, setEditPptUrl] = useState('');
  const [editInitPptUrl, setEditInitPptUrl] = useState('');
  const [editMindmapUrl, setEditMindmapUrl] = useState('');
  const [editInitMindmapUrl, setEditInitMindmapUrl] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');
  const [editInitAudioUrl, setEditInitAudioUrl] = useState('');
  const [editQuestionsUrl, setEditQuestionsUrl] = useState('');
  const [editInitQuestionsUrl, setEditInitQuestionsUrl] = useState('');
  const [editRemovePdf, setEditRemovePdf] = useState(false);
  const [editRemovePpt, setEditRemovePpt] = useState(false);
  const [editRemoveMindmap, setEditRemoveMindmap] = useState(false);
  const [editRemoveAudio, setEditRemoveAudio] = useState(false);
  const [editRemoveQuestions, setEditRemoveQuestions] = useState(false);
  const [editRemoveFlashcards, setEditRemoveFlashcards] = useState(false);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editPptFile, setEditPptFile] = useState<File | null>(null);
  const [editMindmapFile, setEditMindmapFile] = useState<File | null>(null);
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [editQuestionsFile, setEditQuestionsFile] = useState<File | null>(null);
  const [editAnkiFile, setEditAnkiFile] = useState<File | null>(null);
  const [editParsedCardsJson, setEditParsedCardsJson] = useState<string | null>(null);
  const [editParsedCardsCount, setEditParsedCardsCount] = useState<number>(0);
  const [isEditParsingAnki, setIsEditParsingAnki] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementLinkText, setAnnouncementLinkText] = useState('انضم لجروب الواتساب');
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementFeedback, setAnnouncementFeedback] = useState<string | null>(null);

  // Maintenance / Platform Lockdown State
  const [maintenanceIsEnabled, setMaintenanceIsEnabled] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('المنصة في وضع الصيانة والتحديث المؤقت 🛠️');
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'نقوم حالياً بإجراء تحديثات وتحسينات دورية لإضافة محاضرات ومحتوى تعليمي جديد وتطوير تجربة التعلم لجميع طلاب تمريض. سنعود إليكم خلال وقت قصير بإذن الله.'
  );
  const [maintenanceEstimatedReturn, setMaintenanceEstimatedReturn] = useState('خلال وقت قصير جداً');
  const [maintenanceWhatsapp, setMaintenanceWhatsapp] = useState('https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti');
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showMaintenancePreviewModal, setShowMaintenancePreviewModal] = useState(false);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Telegram test state
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);
  const [isSendingDailyReport, setIsSendingDailyReport] = useState(false);

  // Orders & Payments state
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedOrderForReject, setSelectedOrderForReject] = useState<PurchaseOrder | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isRejectingOrder, setIsRejectingOrder] = useState(false);
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);

  // Students & Accounts state
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentForPassword, setSelectedStudentForPassword] = useState<StudentUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentUser | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentUniversity, setEditStudentUniversity] = useState('');
  const [editStudentPassword, setEditStudentPassword] = useState('');
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [selectedStudentForLectures, setSelectedStudentForLectures] = useState<StudentUser | null>(null);
  const [lectureGrantSearch, setLectureGrantSearch] = useState('');

  // Shakib Rakib Bundle State
  const [shakibPrice, setShakibPrice] = useState<number>(10);
  const [shakibIsEnabled, setShakibIsEnabled] = useState<boolean>(true);
  const [shakibMonthLabel, setShakibMonthLabel] = useState<string>('اشتراك الشهر الحالي (شامل كل المواد)');
  const [isSavingShakib, setIsSavingShakib] = useState(false);
  const [shakibFeedback, setShakibFeedback] = useState<string | null>(null);
  const [shakibStudentSearch, setShakibStudentSearch] = useState('');
  const [isGrantingShakib, setIsGrantingShakib] = useState(false);

  // Cloud Sync Token state (GitHub Gist synchronization)
  const [syncToken, setSyncToken] = useState<string>('');
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSavedNotice, setTokenSavedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nursing_sync_token');
      if (stored) {
        setSyncToken(stored);
        setTokenInput(stored);
      }
    }
  }, []);

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const trimmed = tokenInput.trim();
      if (trimmed) {
        localStorage.setItem('nursing_sync_token', trimmed);
        setSyncToken(trimmed);
        setIsEditingToken(false);
        setTokenSavedNotice(true);
        setTimeout(() => setTokenSavedNotice(false), 4000);
      } else {
        localStorage.removeItem('nursing_sync_token');
        setSyncToken('');
        setIsEditingToken(false);
      }
    }
  };

  // Helper to automatically attach token headers to all admin mutation requests
  const getAdminHeaders = (extraHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extraHeaders };
    if (typeof window !== 'undefined') {
      const tok = localStorage.getItem('nursing_sync_token');
      if (tok) {
        headers['x-github-token'] = tok;
      }
    }
    return headers;
  };

  // Verify auth on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          setIsAuthenticated(false);
          router.replace('/');
        } else {
          setIsAuthenticated(true);
          if (data.cloudToken) {
            setServerCloudToken(data.cloudToken);
          }
          loadAllData();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.replace('/');
      });
  }, [router]);

  // Direct client-to-GitHub uploader for audio/files up to 24 MB (bypasses Vercel 4.5MB serverless body limit!)
  const uploadFileDirectlyToCloud = async (
    targetFile: File
  ): Promise<{ url: string; sizeFormatted: string } | null> => {
    try {
      const configRes = await fetch('/api/admin/cloud-config');
      if (!configRes.ok) return null;
      const configData = await configRes.json();
      if (!configData?.uploadBaseUrl) return null;

      const activeToken =
        (typeof window !== 'undefined' && localStorage.getItem('nursing_sync_token')) ||
        syncToken ||
        serverCloudToken ||
        configData.token;
      if (!activeToken) return null;

      const sizeKb = Math.round(targetFile.size / 1024);
      const sizeFormatted =
        sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '');
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(targetFile);
      });

      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const cleanFilename = targetFile.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
      const safeName = `${fileId}_${cleanFilename}`;

      const ghRes = await fetch(
        `${configData.uploadBaseUrl}${encodeURIComponent(safeName)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload ${cleanFilename} via admin direct cloud`,
            content: base64Content,
          }),
        }
      );

      if (ghRes.ok) {
        // ALWAYS return internal masked proxy URL - Never expose GitHub repo to users or inspect element!
        return { url: `/api/files/${encodeURIComponent(safeName)}`, sizeFormatted };
      }
    } catch (err) {
      console.warn('[DirectCloudUpload] Error:', err);
    }
    return null;
  };

  const loadAllData = () => {
    loadStats();
    loadSubjects();
    loadLectures();
    loadSubjectQuizzes();
    loadAnnouncement();
    loadMaintenance();
    loadReports();
    loadOrders();
    loadStudents();
    loadShakibConfig();
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/orders?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.warn('Failed to load orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/admin/students?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && data.students) {
        setStudents(data.students);
      }
    } catch (e) {
      console.warn('Failed to load students:', e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadShakibConfig = async () => {
    try {
      const res = await fetch(`/api/shakib-rakib/config?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const data = await res.json();
      if (data?.success && data?.config) {
        setShakibPrice(data.config.price || 10);
        setShakibIsEnabled(data.config.isEnabled !== false);
        setShakibMonthLabel(data.config.monthLabel || 'اشتراك الشهر الحالي (شامل كل المواد)');
      }
    } catch (err) {
      console.warn('Failed to load shakib config:', err);
    }
  };

  const handleSaveShakibConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingShakib(true);
    setShakibFeedback(null);
    try {
      const res = await fetch('/api/shakib-rakib/config', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          price: Number(shakibPrice) || 10,
          isEnabled: shakibIsEnabled,
          monthLabel: shakibMonthLabel.trim() || 'اشتراك الشهر الحالي (شامل كل المواد)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShakibFeedback('✅ تم حفظ وتحديث إعدادات باقة شاكب راكب بنجاح!');
        setTimeout(() => setShakibFeedback(null), 3500);
      } else {
        setShakibFeedback('❌ فشل الحفظ: ' + (data.message || 'خطأ غير معروف'));
      }
    } catch (err: any) {
      setShakibFeedback('❌ خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsSavingShakib(false);
    }
  };

  const handleGrantShakib = async (studentId: string, days = 30) => {
    setIsGrantingShakib(true);
    try {
      const res = await fetch('/api/admin/students/shakib-rakib', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          studentId,
          action: 'grant',
          days,
          yearId: '1',
          monthLabel: shakibMonthLabel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تفعيل باقة شاكب راكب للطالب بنجاح! 🚀');
        loadStudents();
      } else {
        alert(data.message || 'تعذر تفعيل الباقة للطالب');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsGrantingShakib(false);
    }
  };

  const handleRevokeShakib = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في إلغاء باقة شاكب راكب لهذا الطالب؟')) return;
    setIsGrantingShakib(true);
    try {
      const res = await fetch('/api/admin/students/shakib-rakib', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          studentId,
          action: 'revoke',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم إلغاء الاشتراك بنجاح ✅');
        loadStudents();
      } else {
        alert(data.message || 'تعذر إلغاء الاشتراك');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال: ' + err?.message);
    } finally {
      setIsGrantingShakib(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من قبول هذا الطلب وتفعيل المحاضرة فوراً في حساب الطالب؟')) return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'approve', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم قبول الطلب وتفعيل المحاضرة للطالب ✅');
        loadOrders();
        loadStudents();
      } else {
        alert(data.message || 'فشل قبول الطلب');
      }
    } catch (e: any) {
      alert('خطأ أثناء اعتماد الطلب: ' + e?.message);
    }
  };

  const handleRejectOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReject) return;
    setIsRejectingOrder(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'reject',
          orderId: selectedOrderForReject.id,
          reason: rejectionReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تسجيل رفض الطلب وإبلاغ الطالب بالسبب ✅');
        setSelectedOrderForReject(null);
        setRejectionReasonInput('');
        loadOrders();
      } else {
        alert(data.message || 'فشل رفض الطلب');
      }
    } catch (e: any) {
      alert('خطأ أثناء رفض الطلب: ' + e?.message);
    } finally {
      setIsRejectingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من السجلات؟')) return;
    // Optimistic UI removal
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'delete', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
      } else {
        alert('فشل حذف الطلب');
        loadOrders();
      }
    } catch (e: any) {
      alert('خطأ أثناء حذف الطلب: ' + e?.message);
      loadOrders();
    }
  };

  const handleUpdateStudentPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPassword) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      alert('يجب أن تكون كلمة المرور 4 أحرف أو أرقام على الأقل');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'update_password',
          studentId: selectedStudentForPassword.id,
          newPassword: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تحديث كلمة مرور الطالب بنجاح! 🔑');
        setSelectedStudentForPassword(null);
        setNewPasswordInput('');
        loadStudents();
      } else {
        alert(data.message || 'فشل تحديث كلمة المرور');
      }
    } catch (e: any) {
      alert('خطأ أثناء تحديث كلمة المرور: ' + e?.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    if (!editStudentName.trim()) {
      alert('اسم الطالب مطلوب');
      return;
    }
    if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(editStudentName)) {
      alert('اسم الطالب يجب أن يحتوي على حروف فقط وبدون أي أرقام');
      return;
    }

    let cleanPhone = editStudentPhone.trim()
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[^0-9]/g, '');

    if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
      alert('رقم الهاتف يجب أن يحتوي على أرقام فقط (مثال: 01xxxxxxxxx)');
      return;
    }

    if (editStudentPassword.trim() && editStudentPassword.trim().length < 4) {
      alert('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
      return;
    }

    setIsUpdatingStudent(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'update_student',
          studentId: selectedStudentForEdit.id,
          name: editStudentName.trim(),
          phone: cleanPhone,
          university: editStudentUniversity.trim(),
          password: editStudentPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تحديث بيانات الطالب بنجاح! ✅');
        setSelectedStudentForEdit(null);
        loadStudents();
      } else {
        alert(data.message || 'فشل تحديث بيانات الطالب');
      }
    } catch (e: any) {
      alert('خطأ أثناء تحديث بيانات الطالب: ' + e?.message);
    } finally {
      setIsUpdatingStudent(false);
    }
  };

  const handleResetStudentDevices = async (studentId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من تصفير جميع الأجهزة المسجلة للطالب "${studentName}"؟ سيتمكن من تسجيل الدخول من أجهزة جديدة فوراً.`)) return;
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'reset_devices', studentId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'تم تصفير الأجهزة بنجاح! 🔄');
        loadStudents();
      } else {
        alert(data.message || 'فشل تصفير الأجهزة');
      }
    } catch (err: any) {
      alert('حدث خطأ: ' + err?.message);
    }
  };

  const handleToggleStudentLecture = async (studentId: string, lectureId: string, grant: boolean) => {
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'toggle_lecture',
          studentId,
          lectureId,
          grant,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== studentId) return s;
            const curPurchased = s.purchasedLectureIds || [];
            const newPurchased = grant
              ? Array.from(new Set([...curPurchased, lectureId]))
              : curPurchased.filter((id) => id !== lectureId);
            return { ...s, purchasedLectureIds: newPurchased };
          })
        );
        if (selectedStudentForLectures && selectedStudentForLectures.id === studentId) {
          setSelectedStudentForLectures((prev) => {
            if (!prev) return null;
            const curPurchased = prev.purchasedLectureIds || [];
            const newPurchased = grant
              ? Array.from(new Set([...curPurchased, lectureId]))
              : curPurchased.filter((id) => id !== lectureId);
            return { ...prev, purchasedLectureIds: newPurchased };
          });
        }
      } else {
        alert(data.message || 'فشل تعديل إتاحة المحاضرة');
      }
    } catch (e: any) {
      alert('خطأ: ' + e?.message);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب وجميع بياناته؟ سيتم إلغاء وصوله لجميع المحاضرات.')) return;
    // Optimistic UI removal
    setStudents((prev) => prev.filter((s) => s.id !== studentId && s.phone !== studentId));
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'delete', studentId }),
      });
      const data = await res.json();
      if (data.success) {
        loadStudents();
      } else {
        alert(data.message || 'فشل حذف الطالب');
        loadStudents();
      }
    } catch (e: any) {
      alert('خطأ: ' + e?.message);
      loadStudents();
    }
  };

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const res = await fetch(`/api/admin/subjects?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (e) {
      console.warn('Failed to load subjects:', e);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTitle.trim()) {
      setSubjectFeedback({ type: 'error', message: 'يرجى إدخال اسم المادة' });
      return;
    }
    setIsAddingSubject(true);
    setSubjectFeedback(null);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: newSubTitle.trim(),
          yearId: newSubYearId,
          semester: newSubSemester,
          description: newSubDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubjectFeedback({ type: 'success', message: data.message || 'تمت إضافة المادة بنجاح! 📚' });
        setNewSubTitle('');
        setNewSubDesc('');
        loadSubjects();
      } else {
        setSubjectFeedback({ type: 'error', message: data.message || 'فشل إضافة المادة' });
      }
    } catch (err: any) {
      setSubjectFeedback({ type: 'error', message: err?.message || 'حدث خطأ أثناء إضافة المادة' });
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleUpdateSubjectSemester = async (id: string, newSem: '1' | '2' | 'both') => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, semester: newSem } : s)));
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PUT',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id,
          semester: newSem,
          syncItemsSemester: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjects();
        loadLectures();
        loadSubjectQuizzes();
      }
    } catch {
      alert('فشل تحديث الفصل الدراسي للمادة');
      loadSubjects();
    }
  };

  const openEditSubjectModal = (sub: any) => {
    setEditingSubject(sub);
    setEditSubTitle(sub.title || '');
    setEditSubYearId(sub.yearId || '1');
    setEditSubSemester(sub.semester === '2' ? '2' : sub.semester === 'both' ? 'both' : '1');
    setEditSubDesc(sub.description || '');
  };

  const handleSaveSubjectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editSubTitle.trim()) return;
    setIsSavingSubjectEdit(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PUT',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: editingSubject.id,
          title: editSubTitle.trim(),
          yearId: editSubYearId,
          semester: editSubSemester,
          description: editSubDesc.trim(),
          syncItemsSemester: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingSubject(null);
        loadSubjects();
        loadLectures();
        loadSubjectQuizzes();
      } else {
        alert(data.message || 'فشل تعديل المادة');
      }
    } catch {
      alert('حدث خطأ أثناء تعديل المادة');
    } finally {
      setIsSavingSubjectEdit(false);
    }
  };

  const handleDeleteSubject = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف مادة "${title}" نهائياً من الموقع؟`)) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/admin/subjects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjects();
      }
    } catch {
      alert('فشل حذف المادة');
      loadSubjects();
    }
  };

  // Quick Add Subject Modal Open Handler
  const openQuickAddSubjectModal = (target: 'lecture' | 'quiz' | 'editLecture' | 'editQuiz') => {
    setQuickAddTarget(target);
    setQuickSubFeedback(null);
    setQuickSubTitle('');
    setQuickSubEnglishTitle('');
    setQuickSubDesc('');
    if (target === 'lecture') {
      setQuickSubYearId(yearId);
      setQuickSubSemester(semester);
    } else if (target === 'quiz') {
      setQuickSubYearId('1');
      setQuickSubSemester(quizSemester);
    } else if (target === 'editLecture') {
      setQuickSubYearId(editingLecture?.yearId || '1');
      setQuickSubSemester(editSemester || '1');
    } else if (target === 'editQuiz') {
      setQuickSubYearId('1');
      setQuickSubSemester(editQuizSemester);
    }
    setIsQuickAddSubOpen(true);
  };

  // Quick Add Subject Submit Handler
  const handleQuickAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubTitle.trim()) {
      setQuickSubFeedback({ type: 'error', message: 'يرجى كتابة اسم المادة' });
      return;
    }
    setIsSubmittingQuickSub(true);
    setQuickSubFeedback(null);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: quickSubTitle.trim(),
          yearId: quickSubYearId,
          semester: quickSubSemester,
          description: quickSubDesc.trim(),
          englishTitle: quickSubEnglishTitle.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.subject) {
        const createdSub = data.subject;
        // Update local subjects list immediately
        setSubjects((prev) => {
          const filtered = prev.filter((s) => s.id !== createdSub.id);
          return [...filtered, createdSub];
        });

        // Apply immediately to the active form where user clicked
        if (quickAddTarget === 'lecture') {
          setYearId(createdSub.yearId || '1');
          setSubjectId(createdSub.id);
          if (createdSub.semester === '2') setSemester('2');
          else if (createdSub.semester === '1') setSemester('1');
        } else if (quickAddTarget === 'quiz') {
          setQuizSubjectId(createdSub.id);
          if (createdSub.semester === '2') setQuizSemester('2');
          else if (createdSub.semester === '1') setQuizSemester('1');
        } else if (quickAddTarget === 'editLecture') {
          setEditSubjectId(createdSub.id);
          if (editingLecture) editingLecture.yearId = createdSub.yearId || '1';
          if (createdSub.semester === '2') setEditSemester('2');
          else if (createdSub.semester === '1') setEditSemester('1');
        } else if (quickAddTarget === 'editQuiz') {
          setEditQuizSubjectId(createdSub.id);
          if (createdSub.semester === '2') setEditQuizSemester('2');
          else if (createdSub.semester === '1') setEditQuizSemester('1');
        }

        setIsQuickAddSubOpen(false);
        setQuickSubTitle('');
        setQuickSubEnglishTitle('');
        setQuickSubDesc('');
        loadSubjects();
      } else {
        setQuickSubFeedback({ type: 'error', message: data.message || 'فشل إضافة المادة' });
      }
    } catch (err: any) {
      setQuickSubFeedback({ type: 'error', message: err?.message || 'حدث خطأ أثناء إضافة المادة' });
    } finally {
      setIsSubmittingQuickSub(false);
    }
  };

  const loadSubjectQuizzes = async () => {
    setIsLoadingSubjectQuizzes(true);
    try {
      const res = await fetch(`/api/admin/upload-quiz-file?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.quizzes) setSubjectQuizzes(data.quizzes);
        if (data.quizzesList) setQuizzesList(data.quizzesList);
      }
    } catch (e) {
      console.warn('Failed to load subject quizzes:', e);
    } finally {
      setIsLoadingSubjectQuizzes(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  };

  const loadLectures = async () => {
    setIsLoadingLectures(true);
    try {
      const res = await fetch(`/api/admin/lectures?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && data.lectures) {
        setLectures(data.lectures);
        if (typeof window !== 'undefined' && data.lectures.length > 0) {
          localStorage.setItem('nursing_lectures_backup', JSON.stringify(data.lectures));
        }
      }
    } catch (e) {
      console.warn('Failed to load lectures:', e);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('nursing_lectures_backup');
        if (saved) {
          try {
            setLectures(JSON.parse(saved));
          } catch {}
        }
      }
    } finally {
      setIsLoadingLectures(false);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.announcement) {
        setAnnouncementText(data.announcement.text || '');
        setAnnouncementActive(!!data.announcement.isActive);
        setAnnouncementLinkText(data.announcement.linkText || '');
        setAnnouncementLinkUrl(data.announcement.linkUrl || '');
      }
    } catch (e) {
      console.warn('Failed to load announcement:', e);
    }
  };

  const loadMaintenance = async () => {
    try {
      const res = await fetch(`/api/admin/maintenance?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenanceIsEnabled(Boolean(data.maintenance.isEnabled));
        if (data.maintenance.title) setMaintenanceTitle(data.maintenance.title);
        if (data.maintenance.message) setMaintenanceMessage(data.maintenance.message);
        if (data.maintenance.estimatedReturn !== undefined)
          setMaintenanceEstimatedReturn(data.maintenance.estimatedReturn);
        if (data.maintenance.contactWhatsapp !== undefined)
          setMaintenanceWhatsapp(data.maintenance.contactWhatsapp);
      }
    } catch (e) {
      console.warn('Failed to load maintenance config:', e);
    }
  };

  const handleSaveMaintenance = async (targetEnabled?: boolean) => {
    setIsSavingMaintenance(true);
    setMaintenanceFeedback(null);
    try {
      const isEnabledValue =
        targetEnabled !== undefined ? targetEnabled : maintenanceIsEnabled;
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: isEnabledValue,
          title: maintenanceTitle,
          message: maintenanceMessage,
          estimatedReturn: maintenanceEstimatedReturn,
          contactWhatsapp: maintenanceWhatsapp,
        }),
      });
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenanceIsEnabled(Boolean(data.maintenance.isEnabled));
        setMaintenanceFeedback({
          type: 'success',
          message: data.maintenance.isEnabled
            ? 'تم قفل المنصة بنجاح 🔒 — تظهر للطلاب شاشة الصيانة، وتظل متاحة لك لمعاينتها كمشرف.'
            : 'تم فتح المنصة بنجاح 🎉 — المنصة الآن متاحة لجميع الطلاب والزوار.',
        });
      } else {
        setMaintenanceFeedback({
          type: 'error',
          message: data.message || 'حدث خطأ أثناء تعديل حالة القفل.',
        });
      }
    } catch {
      setMaintenanceFeedback({
        type: 'error',
        message: 'فشل الاتصال بالخادم، يرجى التحقق من الشبكة.',
      });
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/admin/reports', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.reports) setReports(data.reports);
        if (data.complaints) setComplaints(data.complaints);
      }
    } catch (e) {
      console.warn('Failed to load reports:', e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/');
  };

  // Upload lecture handler
  const handleUploadLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureTitle.trim()) {
      setUploadFeedback({ type: 'error', message: 'يرجى إدخال اسم المحاضرة' });
      return;
    }

    const hasPdf = (uploadMode === 'file' && !!file) || (uploadMode === 'link' && !!externalPdfUrl.trim());
    const hasPpt = (pptUploadMode === 'file' && !!pptFile) || (pptUploadMode === 'link' && !!externalPptUrl.trim());
    const hasMindmap = (mindmapUploadMode === 'file' && !!mindmapFile) || (mindmapUploadMode === 'link' && !!externalMindmapUrl.trim());
    const hasAudio = (audioUploadMode === 'file' && !!audioFile) || (audioUploadMode === 'link' && !!externalAudioUrl.trim());
    const hasQuestions = (questionsUploadMode === 'file' && !!questionsFile) || (questionsUploadMode === 'link' && !!externalQuestionsUrl.trim());
    const hasAnki = !!ankiFile || !!parsedCardsJson;

    if (!hasPdf && !hasPpt && !hasMindmap && !hasAudio && !hasAnki && !hasQuestions) {
      setUploadFeedback({
        type: 'error',
        message: 'يرجى رفع محتوى واحد على الأقل للمحاضرة (ملف PDF أو صوت أو بوربوينت أو فلاش كاردز أو خريطة ذهنية أو ملف أسئلة)',
      });
      return;
    }

    // Check max size: 25 MB per file
    const fileChecks = [
      { f: uploadMode === 'file' ? file : null, name: 'PDF' },
      { f: pptUploadMode === 'file' ? pptFile : null, name: 'PowerPoint' },
      { f: mindmapUploadMode === 'file' ? mindmapFile : null, name: 'الخريطة الذهنية' },
      { f: audioUploadMode === 'file' ? audioFile : null, name: 'الصوت' },
      { f: questionsUploadMode === 'file' ? questionsFile : null, name: 'الأسئلة' },
      { f: ankiFile, name: 'Anki' },
    ];
    for (const fc of fileChecks) {
      if (fc.f && fc.f.size > 25 * 1024 * 1024) {
        setUploadFeedback({
          type: 'error',
          message: `حجم ملف ${fc.name} (${(fc.f.size / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد المسموح به (25 MB). يرجى استخدام رابط Google Drive مباشر لرفعه بدون قيود!`,
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      let resolvedPdfUrl = uploadMode === 'link' ? externalPdfUrl.trim() : '';
      let pdfFileToSend: File | null = uploadMode === 'file' ? file : null;

      let resolvedPptUrl = pptUploadMode === 'link' ? externalPptUrl.trim() : '';
      let pptFileToSend: File | null = pptUploadMode === 'file' ? pptFile : null;

      let resolvedMmUrl = mindmapUploadMode === 'link' ? externalMindmapUrl.trim() : '';
      let mmFileToSend: File | null = mindmapUploadMode === 'file' ? mindmapFile : null;

      let resolvedAudioUrl = audioUploadMode === 'link' ? externalAudioUrl.trim() : '';
      let resolvedAudioSize = '';
      let audioFileToSend: File | null = audioUploadMode === 'file' ? audioFile : null;

      let resolvedQuestionsUrl = questionsUploadMode === 'link' ? externalQuestionsUrl.trim() : '';
      let questionsFileToSend: File | null = questionsUploadMode === 'file' ? questionsFile : null;

      // Offload single files > 2.5 MB directly to GitHub Cloud from browser (bypasses Vercel 4.5 MB limit)
      if (pdfFileToSend && pdfFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(pdfFileToSend);
        if (directUploaded) {
          resolvedPdfUrl = directUploaded.url;
          pdfFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الـ PDF الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (pptFileToSend && pptFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(pptFileToSend);
        if (directUploaded) {
          resolvedPptUrl = directUploaded.url;
          pptFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف البوربوينت الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (mmFileToSend && mmFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(mmFileToSend);
        if (directUploaded) {
          resolvedMmUrl = directUploaded.url;
          mmFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الخريطة الذهنية الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (audioFileToSend && audioFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(audioFileToSend);
        if (directUploaded) {
          resolvedAudioUrl = directUploaded.url;
          resolvedAudioSize = directUploaded.sizeFormatted;
          audioFileToSend = null;
        } else {
          throw new Error('تعذر رفع الملف الصوتي الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (questionsFileToSend && questionsFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(questionsFileToSend);
        if (directUploaded) {
          resolvedQuestionsUrl = directUploaded.url;
          questionsFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الأسئلة الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      // Check if combination of remaining files still exceeds 3.2 MB: if so, offload the largest to cloud
      const remainingFiles = [
        { file: pdfFileToSend, setUrl: (u: string) => { resolvedPdfUrl = u; pdfFileToSend = null; } },
        { file: pptFileToSend, setUrl: (u: string) => { resolvedPptUrl = u; pptFileToSend = null; } },
        { file: mmFileToSend, setUrl: (u: string) => { resolvedMmUrl = u; mmFileToSend = null; } },
        { file: audioFileToSend, setUrl: (u: string, s?: string) => { resolvedAudioUrl = u; if (s) resolvedAudioSize = s; audioFileToSend = null; } },
        { file: questionsFileToSend, setUrl: (u: string) => { resolvedQuestionsUrl = u; questionsFileToSend = null; } },
      ].filter((f) => f.file !== null);

      let totalRemainingBytes = remainingFiles.reduce((acc, f) => acc + (f.file?.size || 0), 0);
      while (totalRemainingBytes > 3.2 * 1024 * 1024 && remainingFiles.length > 0) {
        remainingFiles.sort((a, b) => (b.file?.size || 0) - (a.file?.size || 0));
        const largest = remainingFiles[0];
        if (largest.file) {
          const directUploaded = await uploadFileDirectlyToCloud(largest.file);
          if (directUploaded) {
            largest.setUrl(directUploaded.url, directUploaded.sizeFormatted);
            totalRemainingBytes -= largest.file.size;
            remainingFiles.shift();
          } else {
            break;
          }
        } else {
          break;
        }
      }

      const formData = new FormData();
      if (pdfFileToSend) formData.append('file', pdfFileToSend);
      else if (resolvedPdfUrl) formData.append('externalPdfUrl', resolvedPdfUrl);

      if (ankiFile) formData.append('ankiFile', ankiFile);
      if (parsedCardsJson) formData.append('flashcardsJson', parsedCardsJson);

      if (pptFileToSend) formData.append('pptFile', pptFileToSend);
      else if (resolvedPptUrl) formData.append('externalPptUrl', resolvedPptUrl);

      if (mmFileToSend) formData.append('mindmapFile', mmFileToSend);
      else if (resolvedMmUrl) formData.append('externalMindmapUrl', resolvedMmUrl);

      if (questionsFileToSend) formData.append('questionsFile', questionsFileToSend);
      else if (resolvedQuestionsUrl) formData.append('externalQuestionsUrl', resolvedQuestionsUrl);

      if (audioFileToSend) formData.append('audioFile', audioFileToSend);
      else if (resolvedAudioUrl) {
        formData.append('externalAudioUrl', resolvedAudioUrl);
        if (resolvedAudioSize) formData.append('audioFileSize', resolvedAudioSize);
      }

      formData.append('subjectId', subjectId);
      formData.append('yearId', yearId);
      formData.append('semester', semester);
      formData.append('lectureTitle', lectureTitle.trim());
      formData.append('lectureNumber', String(lectureNumber));
      formData.append('adminNote', adminNote.trim());
      formData.append('overview', overview.trim());
      formData.append('isFree', String(isFree));
      formData.append('price', String(price));
      formData.append('watermark', String(applyWatermark));

      if (typeof window !== 'undefined') {
        const tok = localStorage.getItem('nursing_sync_token');
        if (tok) formData.append('githubToken', tok);
      }

      const res = await fetch('/api/admin/upload-lecture', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم الملف كبير جداً وتجاوز الحد الأقصى المسموح به (4.5 MB). يرجى ضغط الملف أو استخدام رابط Google Drive.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى إعادة تسجيل الدخول عبر زر الفوتر السري.');
          } else if (res.status === 504) {
            throw new Error('استغرقت معالجة الملف وقتاً طويلاً وتجاوزت مهلة السيرفر. يرجى تجربة ملف أصغر حجماً.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر إتمام الرفع'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        setUploadFeedback({
          type: 'success',
          message: `تم رفع المحاضرة ونشر المحتوى المختار بنجاح! 🚀 ${
            data.flashcardsCount ? `(تم استخراج ${data.flashcardsCount} بطاقة فلاش كاردز 🎴)` : ''
          }`,
        });
        setLectureTitle('');
        setLectureNumber((prev) => prev + 1);
        setAdminNote('');
        setOverview('');
        setIsFree(true);
        setPrice(50);
        setFile(null);
        setAnkiFile(null);
        setParsedCardsJson(null);
        setParsedCardsCount(0);
        setPptFile(null);
        setExternalPptUrl('');
        setPptUploadMode('file');
        setMindmapFile(null);
        setExternalMindmapUrl('');
        setMindmapUploadMode('file');
        setAudioFile(null);
        setExternalAudioUrl('');
        setAudioUploadMode('file');
        setQuestionsFile(null);
        setExternalQuestionsUrl('');
        setQuestionsUploadMode('file');
        setExternalPdfUrl('');
        loadLectures();
        loadStats();
      } else {
        setUploadFeedback({ type: 'error', message: data?.message || 'فشل الرفع' });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: err?.message || 'حدث خطأ في الاتصال أثناء الرفع. يرجى التأكد من اتصال الإنترنت وحجم الملف.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Direct Anki Import Handler for existing lecture
  const handleImportAnki = async (lectureId: string, apkgFile: File) => {
    if (apkgFile.size > 4.5 * 1024 * 1024) {
      alert(`حجم ملف Anki (${(apkgFile.size / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد المسموح به (4.5 MB).`);
      return;
    }
    setIsImportingAnki(lectureId);
    try {
      const formData = new FormData();
      formData.append('lectureId', lectureId);
      formData.append('ankiFile', apkgFile);

      const res = await fetch('/api/admin/import-anki', {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم ملف Anki كبير جداً وتجاوز الحد الأقصى (4.5 MB).');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر معالجة الملف'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        alert(`تم استخراج وتحديث ${data.cardsCount || data.flashcardsCount} بطاقة فلاش كاردز بنجاح! 🎴`);
        loadLectures();
      } else {
        alert(data?.message || 'فشل استيراد حزمة Anki');
      }
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء رفع واستخراج ملف Anki');
    } finally {
      setIsImportingAnki(null);
    }
  };

  // Upload Subject Quiz Questions PDF & Multimedia
  const handleUploadQuizFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quizUploadMode === 'file' && !quizFile) {
      setQuizUploadFeedback({ type: 'error', message: 'يرجى اختيار ملف PDF لأسئلة الكويزات أولاً' });
      return;
    }
    if (quizUploadMode === 'link' && !quizDriveUrl.trim()) {
      setQuizUploadFeedback({ type: 'error', message: 'يرجى إدخال رابط Google Drive لملف أسئلة الكويزات' });
      return;
    }

    if (quizUploadMode === 'file' && quizFile && quizFile.size > 25 * 1024 * 1024) {
      setQuizUploadFeedback({
        type: 'error',
        message: 'حجم ملف الكويز يتجاوز 25 MB. يرجى استخدام رابط Google Drive مباشر لرفعه بدون قيود!',
      });
      return;
    }

    if (quizExplanationMode === 'file' && quizExplanationFile && quizExplanationFile.size > 25 * 1024 * 1024) {
      setQuizUploadFeedback({
        type: 'error',
        message: 'حجم ملف الشرح يتجاوز 25 MB. يرجى استخدام رابط Google Drive مباشر لرفعه بدون قيود!',
      });
      return;
    }

    if (quizPptUploadMode === 'file' && quizPptFile && quizPptFile.size > 25 * 1024 * 1024) {
      setQuizUploadFeedback({
        type: 'error',
        message: 'حجم ملف الباوربوينت يتجاوز 25 MB. يرجى استخدام رابط Google Drive مباشر.',
      });
      return;
    }

    if (quizAudioUploadMode === 'file' && quizAudioFile && quizAudioFile.size > 25 * 1024 * 1024) {
      setQuizUploadFeedback({
        type: 'error',
        message: 'حجم الملف الصوتي يتجاوز 25 MB. يرجى استخدام رابط Google Drive مباشر.',
      });
      return;
    }

    if (quizMindmapUploadMode === 'file' && quizMindmapFile && quizMindmapFile.size > 25 * 1024 * 1024) {
      setQuizUploadFeedback({
        type: 'error',
        message: 'حجم ملف الخريطة الذهنية يتجاوز 25 MB. يرجى استخدام رابط Google Drive مباشر.',
      });
      return;
    }

    setIsUploadingQuiz(true);
    setQuizUploadFeedback(null);

    try {
      let resolvedDriveUrl = quizUploadMode === 'link' ? quizDriveUrl.trim() : '';
      let quizFileToSend: File | null = quizUploadMode === 'file' ? quizFile : null;

      let resolvedExpUrl = quizExplanationMode === 'link' ? quizExplanationDriveUrl.trim() : '';
      let expFileToSend: File | null = quizExplanationMode === 'file' ? quizExplanationFile : null;

      let resolvedPptUrl = quizPptUploadMode === 'link' ? quizPptDriveUrl.trim() : '';
      let pptFileToSend: File | null = quizPptUploadMode === 'file' ? quizPptFile : null;

      let resolvedAudioUrl = quizAudioUploadMode === 'link' ? quizAudioDriveUrl.trim() : '';
      let audioFileToSend: File | null = quizAudioUploadMode === 'file' ? quizAudioFile : null;

      let resolvedMindmapUrl = quizMindmapUploadMode === 'link' ? quizMindmapDriveUrl.trim() : '';
      let mindmapFileToSend: File | null = quizMindmapUploadMode === 'file' ? quizMindmapFile : null;

      // Direct cloud offload for files > 2.5 MB to bypass Vercel 4.5 MB serverless limit
      if (quizFileToSend && quizFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(quizFileToSend);
        if (directUploaded) {
          resolvedDriveUrl = directUploaded.url;
          quizFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الكويز الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (expFileToSend && expFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(expFileToSend);
        if (directUploaded) {
          resolvedExpUrl = directUploaded.url;
          expFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الشرح الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (pptFileToSend && pptFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(pptFileToSend);
        if (directUploaded) {
          resolvedPptUrl = directUploaded.url;
          pptFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الباوربوينت الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (audioFileToSend && audioFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(audioFileToSend);
        if (directUploaded) {
          resolvedAudioUrl = directUploaded.url;
          audioFileToSend = null;
        } else {
          throw new Error('تعذر رفع الملف الصوتي الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (mindmapFileToSend && mindmapFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(mindmapFileToSend);
        if (directUploaded) {
          resolvedMindmapUrl = directUploaded.url;
          mindmapFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الخريطة الذهنية الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      const formData = new FormData();
      if (quizFileToSend) {
        formData.append('file', quizFileToSend);
      } else if (resolvedDriveUrl) {
        formData.append('externalDriveUrl', resolvedDriveUrl);
      }

      formData.append('subjectId', quizSubjectId);
      formData.append('semester', quizSemester);
      if (quizTitle.trim()) {
        formData.append('quizTitle', quizTitle.trim());
      }
      formData.append('questionsCount', String(quizQuestionsCount));
      formData.append('watermark', String(quizApplyWatermark));
      formData.append('isFree', String(quizIsFree));
      formData.append('isLive', String(quizIsLive));

      // Explanation
      if (expFileToSend) {
        formData.append('explanationFile', expFileToSend);
      } else if (resolvedExpUrl) {
        formData.append('externalExplanationUrl', resolvedExpUrl);
      }
      if (quizExplanationTitle.trim()) {
        formData.append('explanationTitle', quizExplanationTitle.trim());
      }

      // PowerPoint
      if (pptFileToSend) {
        formData.append('pptFile', pptFileToSend);
      } else if (resolvedPptUrl) {
        formData.append('externalPptUrl', resolvedPptUrl);
      }
      if (quizPptTitle.trim()) {
        formData.append('pptTitle', quizPptTitle.trim());
      }

      // Audio
      if (audioFileToSend) {
        formData.append('audioFile', audioFileToSend);
      } else if (resolvedAudioUrl) {
        formData.append('externalAudioUrl', resolvedAudioUrl);
      }
      if (quizAudioTitle.trim()) {
        formData.append('audioTitle', quizAudioTitle.trim());
      }

      // Mindmap
      if (mindmapFileToSend) {
        formData.append('mindmapFile', mindmapFileToSend);
      } else if (resolvedMindmapUrl) {
        formData.append('externalMindmapUrl', resolvedMindmapUrl);
      }
      if (quizMindmapTitle.trim()) {
        formData.append('mindmapTitle', quizMindmapTitle.trim());
      }

      // Flashcards
      if (quizParsedCardsJson) {
        formData.append('flashcardsJson', quizParsedCardsJson);
      } else if (quizAnkiFile) {
        formData.append('ankiFile', quizAnkiFile);
      }

      if (typeof window !== 'undefined') {
        const tok = localStorage.getItem('nursing_sync_token');
        if (tok) formData.append('githubToken', tok);
      }

      const res = await fetch('/api/admin/upload-quiz-file', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      });

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم ملف الكويزات كبير جداً وتجاوز الحد الأقصى (4.5 MB). يرجى استخدام خيار رابط Google Drive لرفعه بدون قيود.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى إعادة تسجيل الدخول عبر زر الفوتر السري.');
          } else if (res.status === 504) {
            throw new Error('استغرقت معالجة الملف وقتاً طويلاً وتجاوزت مهلة السيرفر.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر إتمام الرفع'}`);
          }
        }
      } catch (readErr: any) {
        throw readErr;
      }

      if (data && data.success) {
        setQuizUploadFeedback({ type: 'success', message: data.message });
        setQuizFile(null);
        setQuizDriveUrl('');
        setQuizTitle('');
        setQuizExplanationFile(null);
        setQuizExplanationDriveUrl('');
        setQuizExplanationTitle('');
        setQuizExplanationMode('file');

        // Reset multimedia
        setQuizPptFile(null);
        setQuizPptDriveUrl('');
        setQuizPptTitle('');
        setQuizAudioFile(null);
        setQuizAudioDriveUrl('');
        setQuizAudioTitle('');
        setQuizMindmapFile(null);
        setQuizMindmapDriveUrl('');
        setQuizMindmapTitle('');
        setQuizAnkiFile(null);
        setQuizParsedCardsJson(null);
        setQuizParsedCardsCount(0);

        loadSubjectQuizzes();
      } else {
        setQuizUploadFeedback({ type: 'error', message: data?.message || 'فشل الرفع' });
      }
    } catch (err: any) {
      setQuizUploadFeedback({
        type: 'error',
        message: err?.message || 'حدث خطأ في الاتصال أثناء رفع ملف الكويزات. يرجى التأكد من اتصال الإنترنت وحجم الملف.',
      });
    } finally {
      setIsUploadingQuiz(false);
    }
  };

  // Open Edit Quiz Modal
  const openEditQuizModal = (quiz: any) => {
    setEditingQuiz(quiz);
    setEditQuizTitle(quiz.title || '');
    setEditQuizSubjectId(quiz.subjectId || '');
    setEditQuizSemester(quiz.semester === '2' ? '2' : '1');
    setEditQuizQuestionsCount(quiz.questionsCount || 50);
    const qUrl = (quiz.downloadUrl || '').trim();
    const expUrl = (quiz.explanationUrl || '').trim();
    setEditQuizDriveUrl(qUrl);
    setEditQuizInitialDriveUrl(qUrl);
    setEditQuizFile(null);
    setEditQuizExplanationTitle(quiz.explanationTitle || '');
    setEditQuizExplanationDriveUrl(expUrl);
    setEditQuizInitialExplanationUrl(expUrl);
    setEditQuizExplanationFile(null);
    setEditRemoveQuizExplanation(false);

    // PPT
    const pUrl = (quiz.pptUrl || '').trim();
    setEditQuizPptDriveUrl(pUrl);
    setEditQuizInitialPptUrl(pUrl);
    setEditQuizPptTitle(quiz.pptTitle || '');
    setEditQuizPptFile(null);
    setEditRemoveQuizPpt(false);

    // Audio
    const aUrl = (quiz.audioUrl || '').trim();
    setEditQuizAudioDriveUrl(aUrl);
    setEditQuizInitialAudioUrl(aUrl);
    setEditQuizAudioTitle(quiz.audioTitle || '');
    setEditQuizAudioFile(null);
    setEditRemoveQuizAudio(false);

    // Mindmap
    const mUrl = (quiz.mindmapUrl || '').trim();
    setEditQuizMindmapDriveUrl(mUrl);
    setEditQuizInitialMindmapUrl(mUrl);
    setEditQuizMindmapTitle(quiz.mindmapTitle || '');
    setEditQuizMindmapFile(null);
    setEditRemoveQuizMindmap(false);

    // Flashcards
    setEditQuizAnkiFile(null);
    setEditQuizParsedCardsJson(null);
    setEditQuizParsedCardsCount(quiz.flashcards?.length || 0);
    setEditRemoveQuizFlashcards(false);

    setEditQuizIsFree(quiz.isFree !== false);
    setEditQuizIsLive(quiz.isLive !== false);
  };

  // Save Quiz Edit (Supports Title, Subject, Semester, Questions Count, URL, or File replacement)
  const handleSaveQuizEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    if (editQuizFile && editQuizFile.size > 25 * 1024 * 1024) {
      alert('حجم ملف الكويز الجديد أكبر من 25 MB. يرجى استخدام رابط Google Drive مباشر.');
      return;
    }

    if (editQuizExplanationFile && editQuizExplanationFile.size > 25 * 1024 * 1024) {
      alert('حجم ملف الشرح الجديد أكبر من 25 MB. يرجى استخدام رابط Google Drive مباشر.');
      return;
    }

    if (editQuizPptFile && editQuizPptFile.size > 25 * 1024 * 1024) {
      alert('حجم ملف الباوربوينت أكبر من 25 MB. يرجى استخدام رابط Google Drive مباشر.');
      return;
    }

    if (editQuizAudioFile && editQuizAudioFile.size > 25 * 1024 * 1024) {
      alert('حجم الملف الصوتي أكبر من 25 MB. يرجى استخدام رابط Google Drive مباشر.');
      return;
    }

    if (editQuizMindmapFile && editQuizMindmapFile.size > 25 * 1024 * 1024) {
      alert('حجم ملف الخريطة الذهنية أكبر من 25 MB. يرجى استخدام رابط Google Drive مباشر.');
      return;
    }

    setIsSavingQuizEdit(true);
    try {
      const quizId = editingQuiz.id || editingQuiz.subjectId;
      const willRemoveExp =
        editRemoveQuizExplanation ||
        (Boolean(editQuizInitialExplanationUrl) && !editQuizExplanationDriveUrl.trim() && !editQuizExplanationFile);

      const willRemovePpt =
        editRemoveQuizPpt ||
        (Boolean(editQuizInitialPptUrl) && !editQuizPptDriveUrl.trim() && !editQuizPptFile);

      const willRemoveAudio =
        editRemoveQuizAudio ||
        (Boolean(editQuizInitialAudioUrl) && !editQuizAudioDriveUrl.trim() && !editQuizAudioFile);

      const willRemoveMindmap =
        editRemoveQuizMindmap ||
        (Boolean(editQuizInitialMindmapUrl) && !editQuizMindmapDriveUrl.trim() && !editQuizMindmapFile);

      let resolvedQuizDriveUrl = editQuizDriveUrl.trim();
      let quizFileToSend: File | null = editQuizFile;

      let resolvedExpUrl = editQuizExplanationDriveUrl.trim();
      let expFileToSend: File | null = editQuizExplanationFile;

      let resolvedPptUrl = editQuizPptDriveUrl.trim();
      let pptFileToSend: File | null = editQuizPptFile;

      let resolvedAudioUrl = editQuizAudioDriveUrl.trim();
      let audioFileToSend: File | null = editQuizAudioFile;

      let resolvedMindmapUrl = editQuizMindmapDriveUrl.trim();
      let mindmapFileToSend: File | null = editQuizMindmapFile;

      // Direct cloud offload for large files > 2.5 MB to bypass Vercel 4.5 MB serverless limit
      if (quizFileToSend && quizFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(quizFileToSend);
        if (directUploaded) {
          resolvedQuizDriveUrl = directUploaded.url;
          quizFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الكويز الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (expFileToSend && expFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(expFileToSend);
        if (directUploaded) {
          resolvedExpUrl = directUploaded.url;
          expFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الشرح الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (pptFileToSend && pptFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(pptFileToSend);
        if (directUploaded) {
          resolvedPptUrl = directUploaded.url;
          pptFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الباوربوينت الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (audioFileToSend && audioFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(audioFileToSend);
        if (directUploaded) {
          resolvedAudioUrl = directUploaded.url;
          audioFileToSend = null;
        } else {
          throw new Error('تعذر رفع الملف الصوتي الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (mindmapFileToSend && mindmapFileToSend.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(mindmapFileToSend);
        if (directUploaded) {
          resolvedMindmapUrl = directUploaded.url;
          mindmapFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الخريطة الذهنية الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      const hasFilesToUpload =
        quizFileToSend || expFileToSend || pptFileToSend || audioFileToSend || mindmapFileToSend || editQuizAnkiFile;

      let res: Response;
      if (hasFilesToUpload) {
        const formData = new FormData();
        formData.append('id', quizId);
        formData.append('title', editQuizTitle.trim());
        formData.append('subjectId', editQuizSubjectId);
        formData.append('semester', editQuizSemester);
        formData.append('questionsCount', String(editQuizQuestionsCount));
        if (quizFileToSend) formData.append('file', quizFileToSend);
        if (resolvedQuizDriveUrl) formData.append('downloadUrl', resolvedQuizDriveUrl);
        formData.append('watermark', String(quizApplyWatermark));
        formData.append('isFree', String(editQuizIsFree));
        formData.append('isLive', String(editQuizIsLive));

        // Explanation
        if (willRemoveExp) {
          formData.append('removeExplanation', 'true');
        } else if (expFileToSend) {
          formData.append('explanationFile', expFileToSend);
          if (editQuizExplanationTitle.trim()) {
            formData.append('explanationTitle', editQuizExplanationTitle.trim());
          }
        } else if (resolvedExpUrl) {
          formData.append('externalExplanationUrl', resolvedExpUrl);
          if (editQuizExplanationTitle.trim()) {
            formData.append('explanationTitle', editQuizExplanationTitle.trim());
          }
        }

        // PPT
        if (willRemovePpt) {
          formData.append('removePpt', 'true');
        } else if (pptFileToSend) {
          formData.append('pptFile', pptFileToSend);
          if (editQuizPptTitle.trim()) formData.append('pptTitle', editQuizPptTitle.trim());
        } else if (resolvedPptUrl) {
          formData.append('externalPptUrl', resolvedPptUrl);
          if (editQuizPptTitle.trim()) formData.append('pptTitle', editQuizPptTitle.trim());
        }

        // Audio
        if (willRemoveAudio) {
          formData.append('removeAudio', 'true');
        } else if (audioFileToSend) {
          formData.append('audioFile', audioFileToSend);
          if (editQuizAudioTitle.trim()) formData.append('audioTitle', editQuizAudioTitle.trim());
        } else if (resolvedAudioUrl) {
          formData.append('externalAudioUrl', resolvedAudioUrl);
          if (editQuizAudioTitle.trim()) formData.append('audioTitle', editQuizAudioTitle.trim());
        }

        // Mindmap
        if (willRemoveMindmap) {
          formData.append('removeMindmap', 'true');
        } else if (mindmapFileToSend) {
          formData.append('mindmapFile', mindmapFileToSend);
          if (editQuizMindmapTitle.trim()) formData.append('mindmapTitle', editQuizMindmapTitle.trim());
        } else if (resolvedMindmapUrl) {
          formData.append('externalMindmapUrl', resolvedMindmapUrl);
          if (editQuizMindmapTitle.trim()) formData.append('mindmapTitle', editQuizMindmapTitle.trim());
        }

        // Flashcards
        if (editRemoveQuizFlashcards) {
          formData.append('removeFlashcards', 'true');
        } else if (editQuizParsedCardsJson) {
          formData.append('flashcardsJson', editQuizParsedCardsJson);
        } else if (editQuizAnkiFile) {
          formData.append('ankiFile', editQuizAnkiFile);
        }

        res = await fetch('/api/admin/upload-quiz-file', {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: formData,
        });
      } else {
        const bodyPayload: any = {
          id: quizId,
          title: editQuizTitle.trim(),
          subjectId: editQuizSubjectId,
          semester: editQuizSemester,
          questionsCount: Number(editQuizQuestionsCount) || 50,
          downloadUrl: resolvedQuizDriveUrl || undefined,
          isFree: editQuizIsFree,
          isLive: editQuizIsLive,
        };

        if (willRemoveExp) {
          bodyPayload.removeExplanation = true;
          bodyPayload.externalExplanationUrl = '';
        } else {
          if (resolvedExpUrl) bodyPayload.externalExplanationUrl = resolvedExpUrl;
          if (editQuizExplanationTitle.trim()) bodyPayload.explanationTitle = editQuizExplanationTitle.trim();
        }

        if (willRemovePpt) {
          bodyPayload.removePpt = true;
          bodyPayload.externalPptUrl = '';
        } else {
          if (resolvedPptUrl) bodyPayload.externalPptUrl = resolvedPptUrl;
          if (editQuizPptTitle.trim()) bodyPayload.pptTitle = editQuizPptTitle.trim();
        }

        if (willRemoveAudio) {
          bodyPayload.removeAudio = true;
          bodyPayload.externalAudioUrl = '';
        } else {
          if (resolvedAudioUrl) bodyPayload.externalAudioUrl = resolvedAudioUrl;
          if (editQuizAudioTitle.trim()) bodyPayload.audioTitle = editQuizAudioTitle.trim();
        }

        if (willRemoveMindmap) {
          bodyPayload.removeMindmap = true;
          bodyPayload.externalMindmapUrl = '';
        } else {
          if (resolvedMindmapUrl) bodyPayload.externalMindmapUrl = resolvedMindmapUrl;
          if (editQuizMindmapTitle.trim()) bodyPayload.mindmapTitle = editQuizMindmapTitle.trim();
        }

        if (editRemoveQuizFlashcards) {
          bodyPayload.removeFlashcards = true;
        } else if (editQuizParsedCardsJson) {
          bodyPayload.flashcardsJson = editQuizParsedCardsJson;
        }

        res = await fetch('/api/admin/upload-quiz-file', {
          method: 'PATCH',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(bodyPayload),
        });
      }

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم الملف كبير وتجاوز الحد الأقصى لسيرفر Vercel (4.5 MB). يرجى وضع رابط Google Drive مباشر.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى إعادة تسجيل الدخول.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر حفظ التعديلات'}`);
          }
        }
      } catch (parseErr: any) {
        throw parseErr;
      }

      if (data && data.success) {
        if (data.quizFile) {
          setQuizzesList((prev) =>
            prev.map((q) =>
              q.id === data.quizFile.id || q.subjectId === data.quizFile.id ? data.quizFile : q
            )
          );
        }
        setEditingQuiz(null);
        loadSubjectQuizzes();
      } else {
        alert(data?.message || 'فشل تعديل ملف الكويز');
      }
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء حفظ تعديلات ملف الكويز');
    } finally {
      setIsSavingQuizEdit(false);
    }
  };

  // 1-Click Toggle Quiz Semester ('1' <-> '2')
  const handleToggleQuizSemester = async (quizId: string, currentSem: string) => {
    const nextSem: '1' | '2' = currentSem === '2' ? '1' : '2';
    setQuizzesList((prev) =>
      prev.map((q) => (q.id === quizId || q.subjectId === quizId ? { ...q, semester: nextSem } : q))
    );
    try {
      const res = await fetch('/api/admin/upload-quiz-file', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: quizId, semester: nextSem }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjectQuizzes();
      } else {
        loadSubjectQuizzes();
      }
    } catch {
      alert('فشل تغيير سمستر ملف الكويز');
      loadSubjectQuizzes();
    }
  };

  // 1-Click Toggle Quiz Free vs Locked (قفل / فتح)
  const handleToggleQuizFree = async (id: string, currentIsFree: boolean) => {
    setQuizzesList((prev: any[]) =>
      prev.map((q) => ((q.id || q.subjectId) === id ? { ...q, isFree: !currentIsFree } : q))
    );

    try {
      const res = await fetch('/api/admin/upload-quiz-file', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, isFree: !currentIsFree }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjectQuizzes();
      } else {
        loadSubjectQuizzes();
      }
    } catch {
      alert('فشل تغيير حالة قفل الكويز');
      loadSubjectQuizzes();
    }
  };

  // 1-Click Toggle Quiz Live vs Hidden (إخفاء / إظهار)
  const handleToggleQuizLive = async (id: string, currentIsLive: boolean) => {
    setQuizzesList((prev: any[]) =>
      prev.map((q) => ((q.id || q.subjectId) === id ? { ...q, isLive: !currentIsLive } : q))
    );

    try {
      const res = await fetch('/api/admin/upload-quiz-file', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, isLive: !currentIsLive }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjectQuizzes();
        loadSubjects();
      } else {
        loadSubjectQuizzes();
      }
    } catch {
      alert('فشل تغيير حالة ظهور الكويز');
      loadSubjectQuizzes();
    }
  };

  // Delete Quiz File
  const handleDeleteQuizFile = async (quizId: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف ملف الكويز "${title}" نهائياً؟`)) return;
    setQuizzesList((prev) => prev.filter((q) => q.id !== quizId && q.subjectId !== quizId));
    try {
      const res = await fetch(`/api/admin/upload-quiz-file?id=${encodeURIComponent(quizId)}&t=${Date.now()}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadSubjectQuizzes();
      } else {
        loadSubjectQuizzes();
      }
    } catch {
      alert('فشل حذف ملف الكويز');
      loadSubjectQuizzes();
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    setAnnouncementFeedback(null);

    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: announcementText,
          isActive: announcementActive,
          linkText: announcementLinkText,
          linkUrl: announcementLinkUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnnouncementFeedback('تم حفظ وتحديث شريط الإعلانات فوراً لجميع الطلاب سحابياً! ✅');
        setTimeout(() => setAnnouncementFeedback(null), 3000);
      }
    } catch {
      setAnnouncementFeedback('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Delete lecture
  const handleDeleteLecture = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف محاضرة "${title}" نهائياً من الموقع؟`)) return;

    // Immediately remove from local state so it never reappears or lingers on UI
    setLectures((prev) => prev.filter((l) => l.id !== id));

    try {
      const res = await fetch(`/api/admin/lectures?id=${encodeURIComponent(id)}&t=${Date.now()}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
        loadStats();
      } else {
        loadLectures();
      }
    } catch (err) {
      alert('فشل حذف المحاضرة');
      loadLectures();
    }
  };

  // 1-Click Toggle Open 🎁 vs Locked 🔒
  const handleToggleFree = async (id: string, currentIsFree: boolean) => {
    const targetLec = lectures.find((l) => l.id === id);
    let priceToSend: number | undefined = undefined;

    if (currentIsFree) {
      // The lecture was free, and the admin is clicking to LOCK it (make it paid)
      const currentPrice = targetLec?.price && targetLec.price > 0 ? String(targetLec.price) : '50';
      const promptVal = window.prompt(
        `🔒 أنت الآن تقوم بقفل المحاضرة (${targetLec?.title || ''}) لتصبح مدفوعة باشتراك.\n\nمن فضلك اكتب سعر المحاضرة بالجنيه المصري (مثال: 50):`,
        currentPrice
      );
      if (promptVal === null) {
        // Admin clicked cancel -> do not change status
        return;
      }
      const parsedNum = parseInt(promptVal.trim(), 10);
      priceToSend = isNaN(parsedNum) || parsedNum <= 0 ? 50 : parsedNum;
    }

    // Optimistic UI update
    setLectures((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              isFree: !currentIsFree,
              price: currentIsFree ? priceToSend : l.price,
            }
          : l
      )
    );

    try {
      const res = await fetch('/api/admin/lectures', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id,
          isFree: !currentIsFree,
          ...(priceToSend !== undefined ? { price: priceToSend } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
      } else {
        loadLectures();
      }
    } catch {
      alert('فشل تغيير حالة قفل المحاضرة');
      loadLectures();
    }
  };

  // 1-Click Toggle Lecture Semester ('1' <-> '2')
  const handleToggleLectureSemester = async (id: string, currentSem: string) => {
    const nextSem: '1' | '2' = currentSem === '2' ? '1' : '2';
    setLectures((prev) =>
      prev.map((l) => (l.id === id ? { ...l, semester: nextSem } : l))
    );

    try {
      const res = await fetch('/api/admin/lectures', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, semester: nextSem }),
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
      } else {
        loadLectures();
      }
    } catch {
      alert('فشل تغيير الفصل الدراسي للمحاضرة');
      loadLectures();
    }
  };

  // Open Edit Lecture Modal
  const openEditModal = (lec: any) => {
    setEditingLecture(lec);
    setEditTitle(lec.title || '');
    setEditLectureNumber(lec.lectureNumber || 1);
    setEditSubjectId(lec.subjectId || '');
    setEditSemester(lec.semester === '2' ? '2' : '1');
    setEditAdminNote(lec.adminNote || '');
    setEditOverview(lec.overview || '');
    setEditIsFree(lec.isFree !== false);
    setEditPrice(lec.price || 50);
    const pdf = lec.files?.find((f: any) => f.type === 'pdf' || f.fileType === 'summary');
    const ppt = lec.files?.find((f: any) => f.type === 'ppt' || f.fileType === 'presentation' || f.fileType === 'powerpoint');
    const mm = lec.files?.find((f: any) => f.type === 'mindmap' || f.fileType === 'mindmap');
    const aud = lec.files?.find((f: any) => f.type === 'audio' || f.fileType === 'audio');
    const qFile = lec.files?.find((f: any) => f.type === 'questions' || f.fileType === 'questions');

    const pUrl = (pdf?.downloadUrl || pdf?.fileUrl || '').trim();
    const pptUrlVal = (ppt?.downloadUrl || ppt?.fileUrl || '').trim();
    const mmUrlVal = (mm?.downloadUrl || mm?.fileUrl || '').trim();
    const audUrlVal = (aud?.downloadUrl || aud?.fileUrl || '').trim();
    const qUrlVal = (qFile?.downloadUrl || qFile?.fileUrl || '').trim();

    setEditInitPdfUrl(pUrl);
    setEditInitPptUrl(pptUrlVal);
    setEditInitMindmapUrl(mmUrlVal);
    setEditInitAudioUrl(audUrlVal);
    setEditInitQuestionsUrl(qUrlVal);

    setEditPdfUrl(pUrl);
    setEditPptUrl(pptUrlVal);
    setEditMindmapUrl(mmUrlVal);
    setEditAudioUrl(audUrlVal);
    setEditQuestionsUrl(qUrlVal);

    setEditRemovePdf(false);
    setEditRemovePpt(false);
    setEditRemoveMindmap(false);
    setEditRemoveAudio(false);
    setEditRemoveQuestions(false);
    setEditRemoveFlashcards(false);
    setEditPdfFile(null);
    setEditPptFile(null);
    setEditMindmapFile(null);
    setEditAudioFile(null);
    setEditQuestionsFile(null);
    setEditAnkiFile(null);
    setEditParsedCardsJson(null);
    setEditParsedCardsCount(0);
  };

  // Save Lecture Edit (Supports Text Fields + Replacing/Removing Files)
  const handleSaveLectureEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture) return;

    // Check size limit: max 25 MB for any single file
    const fileChecks = [
      { file: editPdfFile, name: 'PDF' },
      { file: editPptFile, name: 'PowerPoint' },
      { file: editMindmapFile, name: 'الخريطة الذهنية' },
      { file: editAudioFile, name: 'الصوت' },
      { file: editQuestionsFile, name: 'الأسئلة' },
      { file: editAnkiFile, name: 'Anki' },
    ];
    for (const fc of fileChecks) {
      if (fc.file && fc.file.size > 25 * 1024 * 1024) {
        alert(`حجم ملف ${fc.name} (${(fc.file.size / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد المسموح به (25 MB). يرجى استخدام رابط Google Drive مباشر لرفعه بدون قيود.`);
        return;
      }
    }

    setIsSavingEdit(true);

    try {
      let resolvedPdfUrl = editPdfUrl.trim();
      let pdfFileToSend: File | null = editPdfFile;

      let resolvedPptUrl = editPptUrl.trim();
      let pptFileToSend: File | null = editPptFile;

      let resolvedMmUrl = editMindmapUrl.trim();
      let mmFileToSend: File | null = editMindmapFile;

      let resolvedAudioUrl = editAudioUrl.trim();
      let resolvedAudioSize = '';
      let audioFileToSend: File | null = editAudioFile;

      let resolvedQuestionsUrl = editQuestionsUrl.trim();
      let questionsFileToSend: File | null = editQuestionsFile;

      // Direct-to-GitHub cloud upload for large files (> 2.5 MB) to bypass Vercel's 4.5 MB serverless limit
      if (editPdfFile && editPdfFile.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(editPdfFile);
        if (directUploaded) {
          resolvedPdfUrl = directUploaded.url;
          pdfFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الـ PDF الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (editPptFile && editPptFile.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(editPptFile);
        if (directUploaded) {
          resolvedPptUrl = directUploaded.url;
          pptFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف البوربوينت الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (editMindmapFile && editMindmapFile.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(editMindmapFile);
        if (directUploaded) {
          resolvedMmUrl = directUploaded.url;
          mmFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الخريطة الذهنية الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (editAudioFile && editAudioFile.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(editAudioFile);
        if (directUploaded) {
          resolvedAudioUrl = directUploaded.url;
          resolvedAudioSize = directUploaded.sizeFormatted;
          audioFileToSend = null;
        } else {
          throw new Error('تعذر رفع الملف الصوتي الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      if (editQuestionsFile && editQuestionsFile.size > 2.5 * 1024 * 1024) {
        const directUploaded = await uploadFileDirectlyToCloud(editQuestionsFile);
        if (directUploaded) {
          resolvedQuestionsUrl = directUploaded.url;
          questionsFileToSend = null;
        } else {
          throw new Error('تعذر رفع ملف الأسئلة الكبير مباشرة. يرجى استخدام رابط Google Drive.');
        }
      }

      // Check if combination of remaining files still exceeds 3.2 MB: if so, offload the largest to cloud
      const remainingFiles = [
        { file: pdfFileToSend, setUrl: (u: string) => { resolvedPdfUrl = u; pdfFileToSend = null; } },
        { file: pptFileToSend, setUrl: (u: string) => { resolvedPptUrl = u; pptFileToSend = null; } },
        { file: mmFileToSend, setUrl: (u: string) => { resolvedMmUrl = u; mmFileToSend = null; } },
        { file: audioFileToSend, setUrl: (u: string, s?: string) => { resolvedAudioUrl = u; if (s) resolvedAudioSize = s; audioFileToSend = null; } },
        { file: questionsFileToSend, setUrl: (u: string) => { resolvedQuestionsUrl = u; questionsFileToSend = null; } },
      ].filter((f) => f.file !== null);

      let totalRemainingBytes = remainingFiles.reduce((acc, f) => acc + (f.file?.size || 0), 0);
      while (totalRemainingBytes > 3.2 * 1024 * 1024 && remainingFiles.length > 0) {
        remainingFiles.sort((a, b) => (b.file?.size || 0) - (a.file?.size || 0));
        const largest = remainingFiles[0];
        if (largest.file) {
          const directUploaded = await uploadFileDirectlyToCloud(largest.file);
          if (directUploaded) {
            largest.setUrl(directUploaded.url, directUploaded.sizeFormatted);
            totalRemainingBytes -= largest.file.size;
            remainingFiles.shift();
          } else {
            break;
          }
        } else {
          break;
        }
      }

      const willRemovePdf = editRemovePdf || (Boolean(editInitPdfUrl) && !resolvedPdfUrl.trim() && !pdfFileToSend);
      const willRemovePpt = editRemovePpt || (Boolean(editInitPptUrl) && !resolvedPptUrl.trim() && !pptFileToSend);
      const willRemoveMm = editRemoveMindmap || (Boolean(editInitMindmapUrl) && !resolvedMmUrl.trim() && !mmFileToSend);
      const willRemoveAud = editRemoveAudio || (Boolean(editInitAudioUrl) && !resolvedAudioUrl.trim() && !audioFileToSend);
      const willRemoveQ = editRemoveQuestions || (Boolean(editInitQuestionsUrl) && !resolvedQuestionsUrl.trim() && !questionsFileToSend);

      const hasFilesToSend = pdfFileToSend || pptFileToSend || mmFileToSend || audioFileToSend || questionsFileToSend || editAnkiFile;

      let res: Response;
      if (hasFilesToSend) {
        const formData = new FormData();
        formData.append('id', editingLecture.id);
        formData.append('title', editTitle.trim());
        formData.append('lectureNumber', String(editLectureNumber));
        if (editSubjectId) formData.append('subjectId', editSubjectId);
        formData.append('semester', editSemester);
        formData.append('adminNote', editAdminNote.trim());
        formData.append('overview', editOverview.trim());
        formData.append('isFree', String(editIsFree));
        formData.append('price', String(editPrice));
        formData.append('pdfUrl', willRemovePdf ? '' : resolvedPdfUrl.trim());
        formData.append('pptUrl', willRemovePpt ? '' : resolvedPptUrl.trim());
        formData.append('mindmapUrl', willRemoveMm ? '' : resolvedMmUrl.trim());
        formData.append('questionsUrl', willRemoveQ ? '' : resolvedQuestionsUrl.trim());
        formData.append('audioUrl', willRemoveAud ? '' : resolvedAudioUrl);
        if (resolvedAudioSize) formData.append('audioFileSize', resolvedAudioSize);
        if (willRemovePdf) formData.append('removePdf', 'true');
        if (willRemovePpt) formData.append('removePpt', 'true');
        if (willRemoveMm) formData.append('removeMindmap', 'true');
        if (willRemoveAud) formData.append('removeAudio', 'true');
        if (willRemoveQ) formData.append('removeQuestions', 'true');
        if (editRemoveFlashcards) formData.append('removeFlashcards', 'true');
        if (pdfFileToSend) formData.append('pdfFile', pdfFileToSend);
        if (pptFileToSend) formData.append('pptFile', pptFileToSend);
        if (mmFileToSend) formData.append('mindmapFile', mmFileToSend);
        if (audioFileToSend) formData.append('audioFile', audioFileToSend);
        if (questionsFileToSend) formData.append('questionsFile', questionsFileToSend);
        if (editAnkiFile) formData.append('ankiFile', editAnkiFile);
        if (editParsedCardsJson) formData.append('flashcardsJson', editParsedCardsJson);

        res = await fetch('/api/admin/lectures', {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/lectures', {
          method: 'PUT',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            id: editingLecture.id,
            title: editTitle.trim(),
            lectureNumber: editLectureNumber,
            subjectId: editSubjectId || undefined,
            semester: editSemester,
            adminNote: editAdminNote.trim(),
            overview: editOverview.trim(),
            isFree: editIsFree,
            price: editPrice,
            pdfUrl: willRemovePdf ? '' : resolvedPdfUrl.trim(),
            pptUrl: willRemovePpt ? '' : resolvedPptUrl.trim(),
            mindmapUrl: willRemoveMm ? '' : resolvedMmUrl.trim(),
            questionsUrl: willRemoveQ ? '' : resolvedQuestionsUrl.trim(),
            audioUrl: willRemoveAud ? '' : resolvedAudioUrl,
            audioFileSize: resolvedAudioSize || undefined,
            removePdf: willRemovePdf,
            removePpt: willRemovePpt,
            removeMindmap: willRemoveMm,
            removeAudio: willRemoveAud,
            removeQuestions: willRemoveQ,
            removeFlashcards: editRemoveFlashcards,
            flashcardsJson: editParsedCardsJson || undefined,
          }),
        });
      }

      let data: any = null;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 413) {
            throw new Error('حجم الملفات المرفوعة كبير جداً وتجاوز الحد الأقصى لسيرفر Vercel (4.5 MB). يرجى وضع رابط Google Drive مباشر للملفات الكبيرة.');
          } else if (res.status === 401) {
            throw new Error('انتهت صلاحية جلسة الأدمن. يرجى تسجيل الدخول مجدداً.');
          } else if (res.status === 504) {
            throw new Error('استغرقت المعالجة وقتاً طويلاً وتجاوزت مهلة السيرفر.');
          } else {
            throw new Error(`خطأ من الخادم (${res.status}): ${text.slice(0, 100) || 'تعذر حفظ التعديلات'}`);
          }
        }
      } catch (parseErr: any) {
        throw parseErr;
      }

      if (data && data.success) {
        if (data.lecture) {
          setLectures((prev) =>
            prev.map((l) => (l.id === data.lecture.id ? data.lecture : l))
          );
        }
        setEditingLecture(null);
        loadLectures();
        loadStats();
      } else {
        alert(data?.message || 'فشل تعديل المحاضرة');
      }
    } catch (err: any) {
      alert(err?.message || 'خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle Lecture Live Visibility
  const handleToggleLive = async (id: string, currentIsLive: boolean) => {
    try {
      const res = await fetch('/api/admin/lectures', {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, isLive: !currentIsLive }),
      });

      const data = await res.json();
      if (data.success) {
        loadLectures();
        loadStats();
      }
    } catch {
      alert('فشل تغيير حالة ظهور المحاضرة');
    }
  };

  // Resolve broken link report
  const handleResolveReport = async (id: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        loadReports();
        loadStats();
      }
    } catch {
      alert('فشل تحديث حالة البلاغ');
    }
  };

  // Resolve complaint
  const handleResolveComplaint = async (id: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'complaint' }),
      });
      const data = await res.json();
      if (data.success) {
        loadReports();
      }
    } catch {
      alert('فشل تحديث حالة الشكوى');
    }
  };

  // Test Telegram
  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch('/api/admin/test-telegram', { method: 'POST' });
      const data = await res.json();
      setTelegramFeedback(data.message);
    } catch {
      setTelegramFeedback('فشل الاتصال بالبوت');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Trigger Daily Report
  const handleSendDailyReport = async () => {
    setIsSendingDailyReport(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch('/api/cron/daily-report', { method: 'POST' });
      const data = await res.json();
      setTelegramFeedback(data.message);
    } catch {
      setTelegramFeedback('فشل إرسال التقرير اليومي');
    } finally {
      setIsSendingDailyReport(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white" dir="rtl">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
          <span className="font-bold">جارِ التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20" dir="rtl">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black">لوحة التحكم السحابية (Secret CMS)</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  متصل ومباشر 🟢
                </span>
              </div>
              <p className="text-xs text-slate-400">إدارة المحتوى، العلامات المائية، وبوت تيليجرام</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Maintenance Status & Toggle Button */}
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                maintenanceIsEnabled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="إدارة قفل المنصة ووضع الصيانة"
            >
              {maintenanceIsEnabled ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>المنصة مقفولة (صيانة)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>المنصة مفتوحة للطلاب</span>
                </>
              )}
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>معاينة الموقع</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cloud Sync Status & Configuration Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 border border-teal-500/30 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black">المزامنة السحابية المباشرة (GitHub Cloud Sync ⚡)</h3>
                  {syncToken ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      نشطة ومفعلة 🟢
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      أدخل رمز المزامنة لمرة واحدة 🔑
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {syncToken
                    ? 'أي تعديل أو إعلان أو رفع محاضرة يتم حفظه ومزامنته سحابياً فوراً لجميع الطلاب والزوار في ثانية واحدة!'
                    : 'قم بلصق رمز المزامنة السحابية (Sync Token) مرة واحدة لحفظ التعديلات ورفع المحاضرات فورياً لجميع الطلاب.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditingToken && (
                <button
                  type="button"
                  onClick={() => setIsEditingToken(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{syncToken ? 'تعديل رمز المزامنة' : 'إدخال رمز المزامنة 🔑'}</span>
                </button>
              )}
            </div>
          </div>

          {isEditingToken && (
            <form onSubmit={handleSaveToken} className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="gho_... الصق الرمز هنا"
                className="flex-1 min-w-[280px] px-4 py-2.5 rounded-xl bg-slate-950/80 border border-teal-500/40 text-white text-xs font-mono focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>حفظ الرمز في المتصفح</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingToken(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </form>
          )}

          {tokenSavedNotice && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center">
              تم حفظ رمز المزامنة السحابية بنجاح! سيتم تطبيق جميع التعديلات فوراً لجميع الطلاب 🚀
            </div>
          )}
        </div>

        {/* 1. Quick Stats Counters */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.todayVisitors}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">زوار اليوم (إجمالي: {stats.totalVisitors})</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.todayDownloads}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">تحميلات اليوم (إجمالي: {stats.totalDownloads})</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{lectures.length}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">محاضرة متاحة ومرفوعة</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black">{stats.pendingReports}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">بلاغات روابط معلقة</span>
            </div>
          </div>
        </section>

        {/* 2. Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'upload'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>رفع محاضرة بضغطة واحدة</span>
          </button>

          <button
            onClick={() => setActiveTab('lectures')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'lectures'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>المحاضرات المنشورة ({lectures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'subjects'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إدارة المواد والمقررات 📚 ({subjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'quizzes'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>أسئلة الكويزات لكل مادة</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              loadOrders();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition relative ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>طلبات الشراء والمدفوعات 💳</span>
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {orders.filter((o) => o.status === 'pending').length} جديد
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('students');
              loadStudents();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'students'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حسابات الطلاب والاشتراكات 👥 ({students.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('shakibRakib');
              loadShakibConfig();
              loadStudents();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'shakibRakib'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300/50'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>باقة شاكب راكب 🚀 ({shakibPrice} ج.م)</span>
            {students.filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now()).length > 0 && (
              <span className="bg-amber-900 text-amber-200 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {students.filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now()).length} مشترك
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'announcement'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>شريط التنبيهات والإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'maintenance'
                ? maintenanceIsEnabled
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-teal-600 text-white shadow-md'
                : maintenanceIsEnabled
                ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {maintenanceIsEnabled ? (
              <Lock className="w-4 h-4 text-rose-300 animate-pulse" />
            ) : (
              <Wrench className="w-4 h-4" />
            )}
            <span>قفل المنصة (الصيانة)</span>
            {maintenanceIsEnabled && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                مقفولة
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'reports'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>البلاغات والشكاوى ({reports.filter((r) => r.status === 'pending').length + complaints.filter((c) => c.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'telegram'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>تتبع وتنبيهات تيليجرام</span>
          </button>
        </div>

        {/* TAB 1: 1-Click Upload Form */}
        {activeTab === 'upload' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <span>رفع ملف PDF ونشر المحاضرة فوراً</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر المادة، اسحب ملف الـ PDF، وسيقوم النظام بختم العلامة المائية وتحديث واجهة الطلاب في نفس اللحظة!
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                🛡️ علامة مائية تلقائية مفعلة
              </span>
            </div>

            <form onSubmit={handleUploadLecture} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Academic Year Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الفرقة الدراسية:
                  </label>
                  <select
                    value={yearId}
                    onChange={(e) => {
                      const newYear = e.target.value;
                      setYearId(newYear);
                      const currentSubs = subjects.length > 0 ? subjects : MOCK_SUBJECTS;
                      const available = currentSubs.filter((s) => s.yearId === newYear);
                      if (available.length > 0) {
                        setSubjectId(available[0].id);
                        if (available[0].semester === '2') setSemester('2');
                        else if (available[0].semester === '1') setSemester('1');
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">السنة الأولى (الفرقة الأولى)</option>
                    <option value="2">السنة الثانية (الفرقة الثانية)</option>
                    <option value="3">السنة الثالثة (الفرقة الثالثة)</option>
                    <option value="4">السنة الرابعة (الفرقة الرابعة)</option>
                  </select>
                </div>

                {/* Semester Selector */}
                <div>
                  <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 mb-2">
                    الفصل الدراسي (الترم):
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as '1' | '2')}
                    className="w-full px-4 py-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-black text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">سمستر 1 (الترم الأول)</option>
                    <option value="2">سمستر 2 (الترم الثاني)</option>
                  </select>
                </div>

                {/* Subject Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      المادة الأكاديمية:
                    </label>
                    <button
                      type="button"
                      onClick={() => openQuickAddSubjectModal('lecture')}
                      className="text-[11px] font-black text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/70 border border-teal-300 dark:border-teal-800 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-xs hover:bg-teal-100"
                      title="أضف مادة دراسية جديدة من عندك وستظهر فوراً هنا وفي الموقع"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>أضف مادة جديدة من عندك 📚</span>
                    </button>
                  </div>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_SUBJECT__') {
                        openQuickAddSubjectModal('lecture');
                        return;
                      }
                      const val = e.target.value;
                      setSubjectId(val);
                      const currentSubs = subjects.length > 0 ? subjects : MOCK_SUBJECTS;
                      const chosen = currentSubs.find((s) => s.id === val);
                      if (chosen) {
                        if (chosen.yearId && chosen.yearId !== yearId) {
                          setYearId(chosen.yearId);
                        }
                        if (chosen.semester === '2') setSemester('2');
                        else if (chosen.semester === '1') setSemester('1');
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="__NEW_SUBJECT__" className="font-black text-teal-600 bg-teal-50 dark:bg-teal-950">
                      ➕ [ اضغط هنا لإضافة مادة جديدة من عندك 📚 ]
                    </option>
                    <optgroup label={`مواد السنة الحالية (${yearId === '1' ? 'السنة الأولى' : yearId === '2' ? 'السنة الثانية' : yearId === '3' ? 'السنة الثالثة' : 'السنة الرابعة'})`}>
                      {(subjects.length > 0 ? subjects : MOCK_SUBJECTS)
                        .filter((s) => s.yearId === yearId)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.title} {sub.semester === '2' ? '(سمستر 2)' : sub.semester === 'both' ? '(الترمين)' : '(سمستر 1)'}
                          </option>
                        ))}
                    </optgroup>
                    {(subjects.length > 0 ? subjects : MOCK_SUBJECTS).some((s) => s.yearId !== yearId) && (
                      <optgroup label="مواد من فرق دراسية أخرى (سيتم تحديد الفرقة تلقائياً)">
                        {(subjects.length > 0 ? subjects : MOCK_SUBJECTS)
                          .filter((s) => s.yearId !== yearId)
                          .map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.title} ({sub.yearName || `سنة ${sub.yearId}`}) {sub.semester === '2' ? '(سمستر 2)' : sub.semester === 'both' ? '(الترمين)' : '(سمستر 1)'}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Lecture Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    عنوان أو اسم المحاضرة:
                  </label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    placeholder="مثال: الجهاز التنفسي والتبادل الغازي"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Lecture Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رقم المحاضرة:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lectureNumber}
                    onChange={(e) => setLectureNumber(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* PDF Upload Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  طريقة إضافة ملف المحاضرة (PDF) — <span className="text-teal-600 dark:text-teal-400">اختياري لو بترفع صوت أو بوربوينت أو فلاش كاردز أو خريطة ذهنية فقط</span>:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      uploadMode === 'file'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <FileUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>رفع ملف PDF مباشر (حتى 4.5 MB)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      uploadMode === 'link'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>رابط خارجي مباشر (Google Drive) 🚀</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('none');
                      setFile(null);
                      setExternalPdfUrl('');
                    }}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      uploadMode === 'none'
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>بدون ملف PDF (رفع صوت / PPT / كروت / خريطة فقط) ✨</span>
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                      file
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => document.getElementById('pdf-file-input')?.click()}
                  >
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />

                    {file ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB • جاهز للرفع والختم
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-1">
                          <span className="inline-block text-[11px] text-teal-600 dark:text-teal-400 font-bold underline">
                            اضغط لتغيير الملف
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="text-[11px] text-rose-500 font-bold hover:underline"
                          >
                            إلغاء ملف الـ PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                          <FileUp className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            اضغط هنا لاختيار ملف PDF أو اسحبه وأفلته هنا (أو اتركه فارغاً وارفع أي ملف بالأسفل)
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            الحد الأقصى للملف المباشر: 4.5 MB • تطبق العلامة المائية تلقائياً
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : uploadMode === 'link' ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold">
                      <ExternalLink className="w-4 h-4" />
                      <span>ضع رابط ملف المحاضرة (Google Drive / Telegram / MediaFire):</span>
                    </div>
                    <input
                      type="url"
                      value={externalPdfUrl}
                      onChange={(e) => setExternalPdfUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view أو رابط مباشر"
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                      <p className="font-bold">💡 نصيحة لنشر ملفات Google Drive لأي حجم بدون أي قيود:</p>
                      <p>1. ارفع ملف الـ PDF على Google Drive من حسابك.</p>
                      <p>2. اضغط كليك يمين على الملف ⬅️ مشاركة (Share) ⬅️ اجعل الوصول العام: <strong>أي شخص لديه الرابط (Anyone with the link)</strong>.</p>
                      <p>3. انسخ الرابط والصقه هنا مباشرة. سيعمل للطلاب فوراً وبسرعة فائقة!</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span>تم اختيار نشر المحاضرة بدون ملف PDF — اختر أي محتوى بالأسفل (صوت 🎧 أو بوربوينت 📊 أو كروت Anki 🎴 أو خريطة ذهنية 🧠) وسيتم عرض ما ترفعه فقط للطلاب!</span>
                  </div>
                )}
              </div>

              {/* Watermark Checkbox */}
              {uploadMode === 'file' && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
                  <input
                    type="checkbox"
                    id="watermark-toggle"
                    checked={applyWatermark}
                    onChange={(e) => setApplyWatermark(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded-lg border-slate-300 focus:ring-teal-500"
                  />
                  <label htmlFor="watermark-toggle" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    تطبيق علامة مائية تلقائية (Watermark) باسم "منصة ملخصات تمريض" على جميع صفحات الـ PDF لحفظ الحقوق الفكرية
                  </label>
                </div>
              )}

              {/* Additional Study Materials (Anki .apkg, PowerPoint, Mindmap, Audio) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>الملفات الإضافية والمواد التفاعلية (اختياري)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يمكنك إرفاق حزمة Anki، وسلايدات بوربوينت، وخريطة ذهنية، وملف صوتي (ريكورد المحاضرة) لتوفير تجربة تعليمية متكاملة.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* 1. Anki Package (.apkg) */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>حزمة كروت Anki (.apkg)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        للعارض الداخلي فقط 🎴
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      يتم استخراج البطاقات تلقائياً وتفعيل عارض الفلاش كاردز 3D الداخلي (ممنوع التحميل للطلاب).
                    </p>
                    <input
                      type="file"
                      id="anki-file-input"
                      accept=".apkg"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const chosen = e.target.files[0];
                          setAnkiFile(chosen);
                          setIsParsingAnki(true);
                          setParsedCardsJson(null);
                          setParsedCardsCount(0);
                          try {
                            const buf = await chosen.arrayBuffer();
                            const cards = await parseAnkiPackage(buf);
                            if (cards && cards.length > 0) {
                              setParsedCardsCount(cards.length);
                              setParsedCardsJson(JSON.stringify(cards));
                            }
                          } catch (err: any) {
                            console.warn('Parsing anki file on client failed:', err);
                          } finally {
                            setIsParsingAnki(false);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('anki-file-input')?.click()}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        ankiFile
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-500'
                      }`}
                    >
                      {ankiFile ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{ankiFile.name}</span>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-3.5 h-3.5" />
                          <span>اختر ملف .apkg</span>
                        </>
                      )}
                    </button>
                    {isParsingAnki && (
                      <div className="p-2 text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري فحص واستخراج البطاقات...</span>
                      </div>
                    )}
                    {parsedCardsCount > 0 && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>تم استخراج {parsedCardsCount} كارت بنجاح! 🎉</span>
                      </div>
                    )}
                    {ankiFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnkiFile(null);
                          setParsedCardsJson(null);
                          setParsedCardsCount(0);
                        }}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                      >
                        إلغاء الملف
                      </button>
                    )}
                  </div>

                  {/* 2. PowerPoint (.pptx, .ppt) */}
                  <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>عروض بوربوينت (PPTX)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        تحميل مباشر 📊
                      </span>
                    </div>

                    {/* Mode Selector: File vs Drive Link */}
                    <div className="flex rounded-xl bg-indigo-100/70 dark:bg-indigo-950 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setPptUploadMode('file')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          pptUploadMode === 'file'
                            ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-white shadow-sm'
                            : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800'
                        }`}
                      >
                        <FileUp className="w-3 h-3" />
                        <span>رفع ملف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPptUploadMode('link')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          pptUploadMode === 'link'
                            ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-white shadow-sm'
                            : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>رابط درايف</span>
                      </button>
                    </div>

                    {pptUploadMode === 'file' ? (
                      <>
                        <input
                          type="file"
                          id="ppt-file-input"
                          accept=".pptx,.ppt"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPptFile(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('ppt-file-input')?.click()}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            pptFile
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                          }`}
                        >
                          {pptFile ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px]">{pptFile.name}</span>
                            </>
                          ) : (
                            <>
                              <FileUp className="w-3.5 h-3.5" />
                              <span>اختر ملف PPTX / PPT</span>
                            </>
                          )}
                        </button>
                        {pptFile && (
                          <button
                            type="button"
                            onClick={() => setPptFile(null)}
                            className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                          >
                            إلغاء الملف
                          </button>
                        )}
                      </>
                    ) : (
                      <input
                        type="url"
                        value={externalPptUrl}
                        onChange={(e) => setExternalPptUrl(e.target.value)}
                        placeholder="ضع رابط Google Drive لسلايدات PPT..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right dir-rtl"
                      />
                    )}
                  </div>

                  {/* 3. Mindmap (.png, .jpg, .pdf) */}
                  <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>خريطة ذهنية (Mindmap)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                        عرض وتحميل 🧠
                      </span>
                    </div>

                    {/* Mode Selector: File vs Drive Link */}
                    <div className="flex rounded-xl bg-teal-100/70 dark:bg-teal-950 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setMindmapUploadMode('file')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          mindmapUploadMode === 'file'
                            ? 'bg-white dark:bg-slate-800 text-teal-900 dark:text-white shadow-sm'
                            : 'text-teal-600 dark:text-teal-400 hover:text-teal-800'
                        }`}
                      >
                        <FileUp className="w-3 h-3" />
                        <span>رفع ملف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMindmapUploadMode('link')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          mindmapUploadMode === 'link'
                            ? 'bg-white dark:bg-slate-800 text-teal-900 dark:text-white shadow-sm'
                            : 'text-teal-600 dark:text-teal-400 hover:text-teal-800'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>رابط درايف</span>
                      </button>
                    </div>

                    {mindmapUploadMode === 'file' ? (
                      <>
                        <input
                          type="file"
                          id="mindmap-file-input"
                          accept=".png,.jpg,.jpeg,.webp,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setMindmapFile(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('mindmap-file-input')?.click()}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            mindmapFile
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-teal-500'
                          }`}
                        >
                          {mindmapFile ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px]">{mindmapFile.name}</span>
                            </>
                          ) : (
                            <>
                              <FileUp className="w-3.5 h-3.5" />
                              <span>اختر صورة أو PDF</span>
                            </>
                          )}
                        </button>
                        {mindmapFile && (
                          <button
                            type="button"
                            onClick={() => setMindmapFile(null)}
                            className="text-[10px] text-rose-500 hover:underline block text-center w-full"
                          >
                            إلغاء الملف
                          </button>
                        )}
                      </>
                    ) : (
                      <input
                        type="url"
                        value={externalMindmapUrl}
                        onChange={(e) => setExternalMindmapUrl(e.target.value)}
                        placeholder="ضع رابط Google Drive للخريطة الذهنية..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right dir-rtl"
                      />
                    )}
                  </div>

                  {/* 4. Audio Recording (.mp3, .m4a, .wav, .ogg, Google Drive) */}
                  <div className="p-4 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                        <Headphones className="w-4 h-4" />
                        <span>ملخص صوتي للمحاضرة (Audio)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                        موجة صوتية 🎧
                      </span>
                    </div>

                    {/* Mode Selector: File vs Drive Link */}
                    <div className="flex rounded-xl bg-violet-100/70 dark:bg-violet-950 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setAudioUploadMode('file')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          audioUploadMode === 'file'
                            ? 'bg-white dark:bg-slate-800 text-violet-900 dark:text-white shadow-sm'
                            : 'text-violet-600 dark:text-violet-400 hover:text-violet-800'
                        }`}
                      >
                        <FileUp className="w-3 h-3" />
                        <span>رفع ملف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioUploadMode('link')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          audioUploadMode === 'link'
                            ? 'bg-white dark:bg-slate-800 text-violet-900 dark:text-white shadow-sm'
                            : 'text-violet-600 dark:text-violet-400 hover:text-violet-800'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>رابط درايف</span>
                      </button>
                    </div>

                    {audioUploadMode === 'file' ? (
                      <>
                        <input
                          type="file"
                          id="audio-file-input"
                          accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.webm,.flac,.mp4"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAudioFile(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('audio-file-input')?.click()}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            audioFile
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-violet-500'
                          }`}
                        >
                          {audioFile ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{audioFile.name}</span>
                            </>
                          ) : (
                            <>
                              <Headphones className="w-3.5 h-3.5" />
                              <span>اختر ملف صوتي 🎵</span>
                            </>
                          )}
                        </button>
                        {audioFile && (
                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="text-violet-600 dark:text-violet-400 font-bold">
                              {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              onClick={() => setAudioFile(null)}
                              className="text-rose-500 hover:underline"
                            >
                              إلغاء الملف
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        type="url"
                        value={externalAudioUrl}
                        onChange={(e) => setExternalAudioUrl(e.target.value)}
                        placeholder="ضع رابط Google Drive للملف الصوتي..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-right dir-rtl"
                      />
                    )}
                  </div>

                  {/* 5. Lecture Questions PDF (.pdf, Google Drive) */}
                  <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        <span>أسئلة المحاضرة (PDF)</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                        تمارين ❓
                      </span>
                    </div>

                    {/* Mode Selector: File vs Drive Link */}
                    <div className="flex rounded-xl bg-rose-100/70 dark:bg-rose-950 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setQuestionsUploadMode('file')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          questionsUploadMode === 'file'
                            ? 'bg-white dark:bg-slate-800 text-rose-900 dark:text-white shadow-sm'
                            : 'text-rose-600 dark:text-rose-400 hover:text-rose-800'
                        }`}
                      >
                        <FileUp className="w-3 h-3" />
                        <span>رفع ملف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionsUploadMode('link')}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          questionsUploadMode === 'link'
                            ? 'bg-white dark:bg-slate-800 text-rose-900 dark:text-white shadow-sm'
                            : 'text-rose-600 dark:text-rose-400 hover:text-rose-800'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>رابط درايف</span>
                      </button>
                    </div>

                    {questionsUploadMode === 'file' ? (
                      <>
                        <input
                          type="file"
                          id="questions-file-input"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setQuestionsFile(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('questions-file-input')?.click()}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            questionsFile
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-rose-500'
                          }`}
                        >
                          {questionsFile ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{questionsFile.name}</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>اختر ملف أسئلة PDF ❓</span>
                            </>
                          )}
                        </button>
                        {questionsFile && (
                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              {(questionsFile.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuestionsFile(null)}
                              className="text-rose-500 hover:underline"
                            >
                              إلغاء الملف
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        type="url"
                        value={externalQuestionsUrl}
                        onChange={(e) => setExternalQuestionsUrl(e.target.value)}
                        placeholder="ضع رابط Google Drive لملف الأسئلة..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-right dir-rtl"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Lecture Overview / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  وصف وملخص المحاضرة (يظهر في أعلى صفحة المحاضرة للطلاب):
                </label>
                <textarea
                  rows={3}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="اكتب نبذة أو ملخص سريع عن محتوى المحاضرة وما سيتعلمه الطالب (يظهر في أعلى الصفحة للطلاب)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* Free vs Locked Availability */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  إتاحة المحاضرة للطلاب:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFree(true)}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      isFree
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span>مفتوحة مجانية للجميع 🎁</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFree(false)}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      !isFree
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>مقفولة (تتطلب اشتراك) 🔒</span>
                  </button>
                </div>

                {!isFree && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-black text-amber-900 dark:text-amber-200">
                      سعر المحاضرة بالجنيه المصري (ج.م) 💰:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value) || 0)}
                        className="w-32 py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold text-center"
                      />
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">جنيه مصري (EGP)</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      * سيتطلب من الطالب تسجيل الدخول أو إنشاء حساب لشراء هذه المحاضرة والتحويل عبر محفظة 01148243443
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  توجيهات أو ملاحظة للطلاب تظهر أسفل التحميل (اختياري):
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="مثال: ركز على أسئلة الامتحانات في صفحة 5 و 7"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {uploadFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isUploading ||
                  !lectureTitle.trim() ||
                  !(
                    (uploadMode === 'file' && !!file) ||
                    (uploadMode === 'link' && !!externalPdfUrl.trim()) ||
                    (pptUploadMode === 'file' && !!pptFile) ||
                    (pptUploadMode === 'link' && !!externalPptUrl.trim()) ||
                    (mindmapUploadMode === 'file' && !!mindmapFile) ||
                    (mindmapUploadMode === 'link' && !!externalMindmapUrl.trim()) ||
                    (audioUploadMode === 'file' && !!audioFile) ||
                    (audioUploadMode === 'link' && !!externalAudioUrl.trim()) ||
                    (questionsUploadMode === 'file' && !!questionsFile) ||
                    (questionsUploadMode === 'link' && !!externalQuestionsUrl.trim()) ||
                    !!ankiFile ||
                    !!parsedCardsJson
                  )
                }
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-base shadow-xl shadow-teal-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارِ معالجة البيانات ونشر المحاضرة سحابياً...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>رفع ونشر المحاضرة فوراً للطلاب 🚀</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Manage Live Lectures */}
        {activeTab === 'lectures' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>المحاضرات والمذكرات الحالية ({lectures.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  يمكنك تعديل أي تفصيلة في المحاضرة (الاسم، المادة، السمستر، أو إضافة/استبدال/حذف أي ملف داخلها) بضغطة زر!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLectureSemesterFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      lectureSemesterFilter === 'all'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50'
                    }`}
                  >
                    الكل ({lectures.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLectureSemesterFilter('1')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      lectureSemesterFilter === '1'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50'
                    }`}
                  >
                    سمستر 1 ({lectures.filter((l) => (l.semester || '1') === '1').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLectureSemesterFilter('2')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      lectureSemesterFilter === '2'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50'
                    }`}
                  >
                    سمستر 2 ({lectures.filter((l) => l.semester === '2').length})
                  </button>
                </div>

                <button
                  onClick={loadLectures}
                  disabled={isLoadingLectures}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLectures ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingLectures ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
                <span>جارِ تحميل المحاضرات...</span>
              </div>
            ) : lectures.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p>لا توجد محاضرات مضافة بعد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-3 px-4">رقم</th>
                      <th className="py-3 px-4">اسم المحاضرة</th>
                      <th className="py-3 px-4">المادة</th>
                      <th className="py-3 px-4">الفصل الدراسي (اضغط للتبديل)</th>
                      <th className="py-3 px-4">الملفات المتاحة</th>
                      <th className="py-3 px-4">تاريخ النشر</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {lectures
                      .filter((lec) => lectureSemesterFilter === 'all' || (lec.semester || '1') === lectureSemesterFilter)
                      .map((lec) => {
                        const lecSem = lec.semester || '1';
                        const hasPdfFile = lec.files?.some(
                          (f: any) => (f.type === 'pdf' || f.fileType === 'summary') && (f.downloadUrl || f.fileUrl) && (f.downloadUrl || f.fileUrl) !== '#'
                        );
                        const hasPptFile = lec.files?.some(
                          (f: any) => (f.type === 'ppt' || f.fileType === 'presentation' || f.fileType === 'powerpoint') && (f.downloadUrl || f.fileUrl) && (f.downloadUrl || f.fileUrl) !== '#'
                        );
                        const hasMindmapFile = lec.files?.some(
                          (f: any) => (f.type === 'mindmap' || f.fileType === 'mindmap') && (f.downloadUrl || f.fileUrl) && (f.downloadUrl || f.fileUrl) !== '#'
                        );
                        const hasAudioFile = lec.files?.some(
                          (f: any) => (f.type === 'audio' || f.fileType === 'audio') && (f.downloadUrl || f.fileUrl) && (f.downloadUrl || f.fileUrl) !== '#'
                        );
                        const hasQuestionsFile = lec.files?.some(
                          (f: any) => (f.type === 'questions' || f.fileType === 'questions') && (f.downloadUrl || f.fileUrl) && (f.downloadUrl || f.fileUrl) !== '#'
                        );
                        return (
                          <tr key={lec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-bold text-teal-600">#{lec.lectureNumber}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                              <div className="flex items-center gap-2">
                                <span>{lec.title}</span>
                                {lec.isFree !== false ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    مفتوحة 🎁
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    مقفولة 🔒
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{lec.subjectTitle}</td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleLectureSemester(lec.id, lecSem)}
                                className={`px-3 py-1 rounded-full text-[11px] font-black transition inline-flex items-center gap-1.5 border whitespace-nowrap ${
                                  lecSem === '2'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                                    : 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                                }`}
                                title="اضغط للتبديل الفوري بين سمستر 1 وسمستر 2"
                              >
                                <span>{lecSem === '2' ? '⚡ سمستر 2 (الترم الثاني)' : '🌱 سمستر 1 (الترم الأول)'}</span>
                                <span className="text-[10px] opacity-70">🔄</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {hasPdfFile && (
                                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[11px] whitespace-nowrap">
                                    PDF 📄
                                  </span>
                                )}
                                {hasPptFile && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] whitespace-nowrap">
                                    PPT 📊
                                  </span>
                                )}
                                {hasMindmapFile && (
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] whitespace-nowrap">
                                    Mindmap 🧠
                                  </span>
                                )}
                                {hasAudioFile && (
                                  <span className="px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-[11px] whitespace-nowrap">
                                    ملخص صوتي 🎧
                                  </span>
                                )}
                                {hasQuestionsFile && (
                                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] whitespace-nowrap">
                                    أسئلة ❓
                                  </span>
                                )}
                                {lec.flashcards?.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[11px] whitespace-nowrap">
                                    {lec.flashcards.length} كارت 🎴
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{lec.files?.[0]?.updatedAt || 'معتمد'}</td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* 1-Click Free vs Locked Toggle button */}
                                <button
                                  onClick={() => handleToggleFree(lec.id, lec.isFree !== false)}
                                  className={`p-1.5 rounded-lg transition ${
                                    lec.isFree !== false
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                      : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
                                  }`}
                                  title={lec.isFree !== false ? 'المحاضرة مفتوحة مجاناً (اضغط للقفل 🔒)' : 'المحاضرة مقفولة باشتراك (اضغط للفتح 🎁)'}
                                >
                                  {lec.isFree !== false ? <Gift className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
                                </button>

                                {/* Toggle Live button */}
                                <button
                                  onClick={() => handleToggleLive(lec.id, lec.isLive !== false)}
                                  className={`p-1.5 rounded-lg transition ${
                                    lec.isLive !== false
                                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={lec.isLive !== false ? 'المحاضرة منشورة للطلاب (اضغط للإخفاء)' : 'المحاضرة مخفية (اضغط للنشر)'}
                                >
                                  {lec.isLive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                {/* Edit lecture button */}
                                <button
                                  onClick={() => openEditModal(lec)}
                                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition"
                                  title="تعديل بيانات المحاضرة واستبدال أو حذف الملفات"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                {/* Anki import button */}
                                <label
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 cursor-pointer transition flex items-center"
                                  title="استيراد كروت Anki (.apkg) لهذه المحاضرة"
                                >
                                  <input
                                    type="file"
                                    accept=".apkg"
                                    className="hidden"
                                    disabled={isImportingAnki === lec.id}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleImportAnki(lec.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                  {isImportingAnki === lec.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                  ) : (
                                    <Layers className="w-4 h-4" />
                                  )}
                                </label>

                                <Link
                                  href={`/lecture/${lec.id}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition"
                                  title="معاينة صفحة المحاضرة"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>

                                <button
                                  onClick={() => handleDeleteLecture(lec.id, lec.title)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                                  title="حذف المحاضرة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Lecture Modal */}
            {editingLecture && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">تعديل شامل للمحاضرة ومحتوياتها 📝</h3>
                      <p className="text-xs text-slate-500">{editingLecture.subjectTitle}</p>
                    </div>
                    <button
                      onClick={() => setEditingLecture(null)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveLectureEdit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          اسم المحاضرة:
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            المادة الأكاديمية:
                          </label>
                          <button
                            type="button"
                            onClick={() => openQuickAddSubjectModal('editLecture')}
                            className="text-[10px] font-black text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة مادة</span>
                          </button>
                        </div>
                        <select
                          value={editSubjectId}
                          onChange={(e) => {
                            if (e.target.value === '__NEW_SUBJECT__') {
                              openQuickAddSubjectModal('editLecture');
                              return;
                            }
                            setEditSubjectId(e.target.value);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="__NEW_SUBJECT__" className="font-bold text-teal-600">
                            ➕ [ إضافة مادة جديدة... ]
                          </option>
                          {(subjects.length > 0 ? subjects : MOCK_SUBJECTS).map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.title} ({sub.yearName || `فرقة ${sub.yearId}`})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          رقم المحاضرة:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editLectureNumber}
                          onChange={(e) => setEditLectureNumber(Number(e.target.value))}
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 mb-1.5">
                          الفصل الدراسي:
                        </label>
                        <select
                          value={editSemester}
                          onChange={(e) => setEditSemester(e.target.value as '1' | '2')}
                          className="w-full px-3 py-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-black focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="1">سمستر 1 (الأول)</option>
                          <option value="2">سمستر 2 (الثاني)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          الإتاحة للطلاب:
                        </label>
                        <select
                          value={editIsFree ? 'free' : 'paid'}
                          onChange={(e) => setEditIsFree(e.target.value === 'free')}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="free">مجانية للجميع 🎁</option>
                          <option value="paid">مدفوعة / مقفولة 🔒</option>
                        </select>
                        {!editIsFree && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">سعر المحاضرة:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                                className="w-20 py-1 px-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold text-center"
                              />
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">ج.م</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ملاحظة الأدمن أو نصيحة المذاكرة:
                      </label>
                      <input
                        type="text"
                        value={editAdminNote}
                        onChange={(e) => setEditAdminNote(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        نبذة وشرح مختصر للمحاضرة:
                      </label>
                      <textarea
                        rows={2}
                        value={editOverview}
                        onChange={(e) => setEditOverview(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* File Replacement & Removal Options */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>إدارة ملفات ومحتويات المحاضرة (إضافة / استبدال / حذف أي محتوى منفرداً)</span>
                      </h4>

                      {/* PDF replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            ملف الـ PDF (ملخص المحاضرة 📄):
                          </label>
                          {(editingLecture?.files?.some((f: any) => f.type === 'pdf' || f.fileType === 'summary') || editPdfUrl || editPdfFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditPdfUrl('');
                                setEditPdfFile(null);
                                setEditRemovePdf(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemovePdf ? 'سيتم حذف الـ PDF عند الحفظ 🗑️' : 'حذف الـ PDF الحالي 🗑️'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editPdfUrl}
                            onChange={(e) => {
                              setEditPdfUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemovePdf(false);
                            }}
                            placeholder="رابط مباشر / Google Drive لملف PDF..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>{editPdfFile ? editPdfFile.name.slice(0, 10) : 'رفع PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditPdfFile(e.target.files[0]);
                                  setEditRemovePdf(false);
                                }
                              }}
                            />
                          </label>
                          {editPdfFile && (
                            <button
                              type="button"
                              onClick={() => setEditPdfFile(null)}
                              className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200"
                              title="إلغاء اختيار الملف"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PPT replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            عرض البوربوينت (PowerPoint 📊):
                          </label>
                          {(editingLecture?.files?.some((f: any) => f.type === 'ppt' || f.fileType === 'presentation') || editPptUrl || editPptFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditPptUrl('');
                                setEditPptFile(null);
                                setEditRemovePpt(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemovePpt ? 'سيتم حذف البوربوينت عند الحفظ 🗑️' : 'حذف البوربوينت الحالي 🗑️'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editPptUrl}
                            onChange={(e) => {
                              setEditPptUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemovePpt(false);
                            }}
                            placeholder="رابط مباشر / Google Drive لسلايدات PPT..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>{editPptFile ? editPptFile.name.slice(0, 10) : 'رفع PPT'}</span>
                            <input
                              type="file"
                              accept=".pptx,.ppt"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditPptFile(e.target.files[0]);
                                  setEditRemovePpt(false);
                                }
                              }}
                            />
                          </label>
                          {editPptFile && (
                            <button
                              type="button"
                              onClick={() => setEditPptFile(null)}
                              className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200"
                              title="إلغاء اختيار الملف"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mindmap replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            الخريطة الذهنية (Mindmap 🧠):
                          </label>
                          {(editingLecture?.files?.some((f: any) => f.type === 'mindmap' || f.fileType === 'mindmap') || editMindmapUrl || editMindmapFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditMindmapUrl('');
                                setEditMindmapFile(null);
                                setEditRemoveMindmap(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveMindmap ? 'سيتم حذف الخريطة عند الحفظ 🗑️' : 'حذف الخريطة الحالية 🗑️'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editMindmapUrl}
                            onChange={(e) => {
                              setEditMindmapUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveMindmap(false);
                            }}
                            placeholder="رابط مباشر / Google Drive للخريطة الذهنية..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>{editMindmapFile ? editMindmapFile.name.slice(0, 10) : 'رفع خريطة'}</span>
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.webp,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditMindmapFile(e.target.files[0]);
                                  setEditRemoveMindmap(false);
                                }
                              }}
                            />
                          </label>
                          {editMindmapFile && (
                            <button
                              type="button"
                              onClick={() => setEditMindmapFile(null)}
                              className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200"
                              title="إلغاء اختيار الملف"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Audio Recording replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-violet-700 dark:text-violet-300">
                            ملخص صوتي للمحاضرة (Audio Summary 🎧):
                          </label>
                          {(editingLecture?.files?.some((f: any) => f.type === 'audio' || f.fileType === 'audio') || editAudioUrl || editAudioFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditAudioUrl('');
                                setEditAudioFile(null);
                                setEditRemoveAudio(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveAudio ? 'سيتم حذف الصوت عند الحفظ 🗑️' : 'حذف الملف الصوتي الحالي 🗑️'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editAudioUrl}
                            onChange={(e) => {
                              setEditAudioUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveAudio(false);
                            }}
                            placeholder="رابط Google Drive أو رابط مباشر للملف الصوتي..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5" />
                            <span>{editAudioFile ? editAudioFile.name.slice(0, 10) : 'رفع صوت'}</span>
                            <input
                              type="file"
                              accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.webm,.flac,.mp4"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditAudioFile(e.target.files[0]);
                                  setEditRemoveAudio(false);
                                }
                              }}
                            />
                          </label>
                          {editAudioFile && (
                            <button
                              type="button"
                              onClick={() => setEditAudioFile(null)}
                              className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200"
                              title="إلغاء اختيار الملف"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Questions PDF replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            رابط أو ملف أسئلة المحاضرة (PDF ❓):
                          </label>
                          {(editingLecture?.files?.some((f: any) => f.type === 'questions' || f.fileType === 'questions') || editQuestionsUrl || editQuestionsFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuestionsUrl('');
                                setEditQuestionsFile(null);
                                setEditRemoveQuestions(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuestions ? 'سيتم حذف الأسئلة عند الحفظ 🗑️' : 'حذف ملف الأسئلة الحالي 🗑️'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuestionsUrl}
                            onChange={(e) => {
                              setEditQuestionsUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveQuestions(false);
                            }}
                            placeholder="رابط Google Drive أو رابط مباشر لملف أسئلة PDF..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>{editQuestionsFile ? editQuestionsFile.name.slice(0, 10) : 'رفع PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditQuestionsFile(e.target.files[0]);
                                  setEditRemoveQuestions(false);
                                }
                              }}
                            />
                          </label>
                          {editQuestionsFile && (
                            <button
                              type="button"
                              onClick={() => setEditQuestionsFile(null)}
                              className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200"
                              title="إلغاء اختيار الملف"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Anki Package replacement / removal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            كروت المراجعة الذكية (Anki .apkg 🎴):
                          </label>
                          {(editingLecture?.flashcards?.length > 0 || editAnkiFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditAnkiFile(null);
                                setEditParsedCardsJson(null);
                                setEditParsedCardsCount(0);
                                setEditRemoveFlashcards(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveFlashcards ? 'سيتم حذف الكروت عند الحفظ 🗑️' : 'حذف كروت الفلاش كاردز الحالية 🗑️'}
                            </button>
                          )}
                        </div>
                        <label className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{editAnkiFile ? `تم اختيار: ${editAnkiFile.name}` : 'اختر ملف .apkg لإضافة أو تحديث الكروت'}</span>
                          <input
                            type="file"
                            accept=".apkg"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files?.[0]) {
                                const chosen = e.target.files[0];
                                setEditAnkiFile(chosen);
                                setEditRemoveFlashcards(false);
                                setIsEditParsingAnki(true);
                                setEditParsedCardsJson(null);
                                setEditParsedCardsCount(0);
                                try {
                                  const buf = await chosen.arrayBuffer();
                                  const cards = await parseAnkiPackage(buf);
                                  if (cards && cards.length > 0) {
                                    setEditParsedCardsCount(cards.length);
                                    setEditParsedCardsJson(JSON.stringify(cards));
                                  }
                                } catch (err: any) {
                                  console.warn('Parsing edit anki file on client failed:', err);
                                } finally {
                                  setIsEditParsingAnki(false);
                                }
                              }
                            }}
                          />
                        </label>
                        {isEditParsingAnki && (
                          <div className="p-2 text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 font-bold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري استخراج البطاقات من الملف...</span>
                          </div>
                        )}
                        {editParsedCardsCount > 0 && (
                          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>تم استخراج {editParsedCardsCount} كارت بنجاح وتجهيزها للحفظ! 🎉</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingLecture(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20"
                      >
                        {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>حفظ التعديلات فوراً</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Dynamic Subjects Management */}
        {activeTab === 'subjects' && (
          <div className="space-y-8">
            {/* 1. Add New Subject Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    <span>إضافة مادة دراسية جديدة للموقع 📚</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    أضف أي مادة دراسية جديدة مباشرة وحدد لها السمستر (الترم الأول أو الثاني أو كلاهما)، وستظهر فوراً في قوائم الموقع!
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                  ⚡ إضافة حية فورية
                </span>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      اسم المادة بالعربي:
                    </label>
                    <input
                      type="text"
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      placeholder="مثال: تمريض صحة المجتمع"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      الفرقة الدراسية:
                    </label>
                    <select
                      value={newSubYearId}
                      onChange={(e) => setNewSubYearId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1">السنة الأولى</option>
                      <option value="2">السنة الثانية</option>
                      <option value="3">السنة الثالثة</option>
                      <option value="4">السنة الرابعة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 mb-2">
                      الفصل الدراسي (السمستر):
                    </label>
                    <select
                      value={newSubSemester}
                      onChange={(e) => setNewSubSemester(e.target.value as '1' | '2' | 'both')}
                      className="w-full px-4 py-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-black focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1">سمستر 1 (الترم الأول)</option>
                      <option value="2">سمستر 2 (الترم الثاني)</option>
                      <option value="both">ممتدة في الترمين (1 و 2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      وصف المادة (اختياري):
                    </label>
                    <input
                      type="text"
                      value={newSubDesc}
                      onChange={(e) => setNewSubDesc(e.target.value)}
                      placeholder="مثال: ملخصات ومحاضرات معتمدة لمنهج التمريض"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {subjectFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      subjectFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                    }`}
                  >
                    {subjectFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{subjectFeedback.message}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingSubject || !newSubTitle.trim()}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-md shadow-teal-600/20 disabled:opacity-50"
                  >
                    {isAddingSubject ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>إضافة المادة فوراً</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Subjects List & Management Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    <span>المواد والمقررات الحالية ({subjects.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    يمكنك تعديل اسم المادة أو وصفها أو فرقتها أو الفصل الدراسي بضغطة زر!
                  </p>
                </div>

                <button
                  onClick={loadSubjects}
                  disabled={isLoadingSubjects}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  title="تحديث المواد"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSubjects ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingSubjects ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
                  <span>جارِ تحميل المواد...</span>
                </div>
              ) : subjects.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p>لا توجد مواد مسجلة.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-3 px-4">اسم المادة</th>
                        <th className="py-3 px-4">الفرقة الدراسية</th>
                        <th className="py-3 px-4">الفصل الدراسي (تحديد مباشر)</th>
                        <th className="py-3 px-4">عدد المحاضرات</th>
                        <th className="py-3 px-4">الوصف</th>
                        <th className="py-3 px-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {subjects.map((sub) => {
                        const count = lectures.filter((l) => l.subjectId === sub.id).length;
                        const subSem = sub.semester || '1';
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                              {sub.title}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] whitespace-nowrap">
                                {sub.yearName || (sub.yearId === '1' ? 'السنة الأولى' : sub.yearId === '2' ? 'السنة الثانية' : sub.yearId === '3' ? 'السنة الثالثة' : 'السنة الرابعة')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={subSem}
                                onChange={(e) =>
                                  handleUpdateSubjectSemester(sub.id, e.target.value as '1' | '2' | 'both')
                                }
                                className={`px-3 py-1.5 rounded-xl font-black text-[11px] border focus:outline-none focus:ring-2 cursor-pointer transition ${
                                  subSem === '2'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500'
                                    : subSem === 'both'
                                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 focus:ring-amber-500'
                                    : 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800 focus:ring-teal-500'
                                }`}
                              >
                                <option value="1">🌱 سمستر 1 (الترم الأول)</option>
                                <option value="2">⚡ سمستر 2 (الترم الثاني)</option>
                                <option value="both">🔄 الترمين معاً (1 و 2)</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-teal-600 whitespace-nowrap">
                              {count} محاضرة
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                              {sub.description || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditSubjectModal(sub)}
                                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition inline-flex items-center"
                                  title="تعديل بيانات المادة"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <Link
                                  href={`/subject/${sub.id}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition inline-flex items-center"
                                  title="معاينة صفحة المادة"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>

                                <button
                                  onClick={() => handleDeleteSubject(sub.id, sub.title)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition inline-flex items-center"
                                  title="حذف المادة نهائياً"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Edit Subject Modal */}
              {editingSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">تعديل بيانات المادة 📚</h3>
                        <p className="text-xs text-slate-500">{editingSubject.title}</p>
                      </div>
                      <button
                        onClick={() => setEditingSubject(null)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSubjectEdit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          اسم المادة:
                        </label>
                        <input
                          type="text"
                          value={editSubTitle}
                          onChange={(e) => setEditSubTitle(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            الفرقة الدراسية:
                          </label>
                          <select
                            value={editSubYearId}
                            onChange={(e) => setEditSubYearId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="1">السنة الأولى</option>
                            <option value="2">السنة الثانية</option>
                            <option value="3">السنة الثالثة</option>
                            <option value="4">السنة الرابعة</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 mb-1.5">
                            الفصل الدراسي:
                          </label>
                          <select
                            value={editSubSemester}
                            onChange={(e) => setEditSubSemester(e.target.value as '1' | '2' | 'both')}
                            className="w-full px-3 py-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-black focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="1">سمستر 1 (الأول)</option>
                            <option value="2">سمستر 2 (الثاني)</option>
                            <option value="both">الترمين معاً (1 و 2)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          وصف المادة:
                        </label>
                        <textarea
                          rows={3}
                          value={editSubDesc}
                          onChange={(e) => setEditSubDesc(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingSubject(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingSubjectEdit || !editSubTitle.trim()}
                          className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20"
                        >
                          {isSavingSubjectEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>حفظ التعديلات فوراً</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB QUIZZES: Manage Subject Quiz Questions PDF */}
        {activeTab === 'quizzes' && (
          <div className="space-y-8">
            {/* 1. Upload Form for Subject Quizzes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <span>إضافة ورفع ملفات أسئلة الكويزات لكل مادة (يدعم أكثر من ملف كويز للمادة الواحدة)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ارفع ملف أو أكثر من ملفات أسئلة الكويزات والامتحانات والـ MCQ لأي مادة، وحدد الفصل الدراسي (سمستر 1 أو سمستر 2) لكل ملف كويز.
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                  📝 دعم تعدد ملفات الكويزات للمادة الواحدة
                </span>
              </div>

              <form onSubmit={handleUploadQuizFile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Subject Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        المادة الأكاديمية:
                      </label>
                      <button
                        type="button"
                        onClick={() => openQuickAddSubjectModal('quiz')}
                        className="text-[11px] font-black text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-xs hover:bg-amber-100"
                        title="أضف مادة دراسية جديدة من عندك وستظهر فوراً هنا وفي الموقع"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        <span>أضف مادة جديدة من عندك 📚</span>
                      </button>
                    </div>
                    <select
                      value={quizSubjectId}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_SUBJECT__') {
                          openQuickAddSubjectModal('quiz');
                          return;
                        }
                        const val = e.target.value;
                        setQuizSubjectId(val);
                        const currentSubs = subjects.length > 0 ? subjects : MOCK_SUBJECTS;
                        const chosen = currentSubs.find((s) => s.id === val);
                        if (chosen?.semester === '2') setQuizSemester('2');
                        else if (chosen?.semester === '1') setQuizSemester('1');
                      }}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="__NEW_SUBJECT__" className="font-black text-amber-600 bg-amber-50 dark:bg-amber-950">
                        ➕ [ اضغط هنا لإضافة مادة جديدة من عندك 📚 ]
                      </option>
                      {['1', '2', '3', '4'].map((yr) => {
                        const yrSubs = (subjects.length > 0 ? subjects : MOCK_SUBJECTS).filter((s) => s.yearId === yr);
                        if (yrSubs.length === 0) return null;
                        const yrName = yr === '1' ? 'السنة الأولى' : yr === '2' ? 'السنة الثانية' : yr === '3' ? 'السنة الثالثة' : 'السنة الرابعة';
                        return (
                          <optgroup key={yr} label={yrName}>
                            {yrSubs.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.title} {sub.semester === '2' ? '(سمستر 2)' : sub.semester === 'both' ? '(الترمين)' : '(سمستر 1)'}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  {/* Semester Selector */}
                  <div>
                    <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
                      الفصل الدراسي للكويز:
                    </label>
                    <select
                      value={quizSemester}
                      onChange={(e) => setQuizSemester(e.target.value as '1' | '2')}
                      className="w-full px-4 py-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-black text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="1">🌱 سمستر 1 (الترم الأول)</option>
                      <option value="2">⚡ سمستر 2 (الترم الثاني)</option>
                    </select>
                  </div>

                  {/* Quiz Title (Optional - supports multiple quizzes per subject) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      عنوان ملف الكويز (اختياري):
                    </label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="مثال: كويز الميدتيرم / بنك الفاينل..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Questions Count */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      عدد الأسئلة التقريبي في الملف:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quizQuestionsCount}
                      onChange={(e) => setQuizQuestionsCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* PDF Dropzone / Drive Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    ملف أسئلة الكويزات (صيغة PDF):
                  </label>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setQuizUploadMode('file')}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                        quizUploadMode === 'file'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <FileUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>رفع ملف PDF مباشر (حتى 4.5 MB)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuizUploadMode('link')}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                        quizUploadMode === 'link'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>رابط خارجي مباشر (Google Drive / سحابي) - بدون حد للحجم 🚀</span>
                    </button>
                  </div>

                  {quizUploadMode === 'file' ? (
                    <div
                      className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                        quizFile
                          ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => document.getElementById('quiz-pdf-input')?.click()}
                    >
                      <input
                        id="quiz-pdf-input"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setQuizFile(e.target.files[0]);
                          }
                        }}
                      />

                      {quizFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
                            <Check className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{quizFile.name}</p>
                          <p className="text-xs text-slate-500">
                            الحجم: {(quizFile.size / (1024 * 1024)).toFixed(2)} MB • جاهز للرفع والختم
                          </p>
                          <span className="inline-block text-[11px] text-amber-600 dark:text-amber-400 font-bold underline">
                            اضغط لتغيير الملف
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                            <FileUp className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              اضغط هنا لاختيار ملف PDF لأسئلة الكويزات أو اسحبه هنا
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              ملف مجمع للأسئلة والإجابات • الحد الأقصى: 4.5 MB • تطبق العلامة المائية تلقائياً
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        <ExternalLink className="w-4 h-4" />
                        <span>ضع رابط ملف أسئلة الكويزات (Google Drive / Telegram / رابط مباشر):</span>
                      </div>
                      <input
                        type="url"
                        value={quizDriveUrl}
                        onChange={(e) => setQuizDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/.../view أو رابط مباشر"
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                        <p className="font-bold">💡 نصيحة لنشر ملفات Google Drive لأي حجم بدون أي قيود:</p>
                        <p>1. ارفع ملف بنك أسئلة الكويزات على Google Drive من حسابك.</p>
                        <p>2. اضغط كليك يمين على الملف ⬅️ مشاركة (Share) ⬅️ اجعل الوصول العام: <strong>أي شخص لديه الرابط (Anyone with the link)</strong>.</p>
                        <p>3. انسخ الرابط والصقه هنا مباشرة. سيعمل للطلاب فوراً بدون حدود لحجم الملف!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Quiz Explanation / Model Answers File (ملف شرح وتوضيح الإجابات) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>ملف شرح وتوضيح الإجابات (اختياري) 📖</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        إذا كان لديك ملف يشرح الإجابات أو يوفر حلولاً نموذجية للكويز، يمكنك إرفاقه هنا ليظهر بجانب الكويز للطلاب.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ملف شرح إضافي 💡
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        عنوان ملف الشرح (اختياري):
                      </label>
                      <input
                        type="text"
                        value={quizExplanationTitle}
                        onChange={(e) => setQuizExplanationTitle(e.target.value)}
                        placeholder="مثال: ملف شرح وتوضيح الإجابات النموذجية"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        طريقة إضافة ملف الشرح:
                      </label>
                      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setQuizExplanationMode('file')}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            quizExplanationMode === 'file'
                              ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
                          }`}
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>رفع ملف PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizExplanationMode('link')}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            quizExplanationMode === 'link'
                              ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>رابط Google Drive</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {quizExplanationMode === 'file' ? (
                    <div>
                      <input
                        type="file"
                        id="quiz-explanation-file-input"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setQuizExplanationFile(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('quiz-explanation-file-input')?.click()}
                        className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          quizExplanationFile
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {quizExplanationFile ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>تم اختيار: {quizExplanationFile.name} ({(quizExplanationFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                            <span>اختر ملف PDF للشرح والتوضيح (اختياري)</span>
                          </>
                        )}
                      </button>
                      {quizExplanationFile && (
                        <button
                          type="button"
                          onClick={() => setQuizExplanationFile(null)}
                          className="text-[11px] text-rose-500 hover:underline block text-center w-full mt-1 font-bold"
                        >
                          إلغاء ملف الشرح
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={quizExplanationDriveUrl}
                      onChange={(e) => setQuizExplanationDriveUrl(e.target.value)}
                      placeholder="ضع رابط Google Drive لملف الشرح وتوضيح الإجابات..."
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Additional Multimedia Attachments for Quiz (PPT, Audio, Mindmap, Flashcards) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-750 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <span className="text-base">📦</span>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      مرفقات إضافية للكويز (باوربوينت، تسجيل صوتي، خريطة ذهنية، فلاش كاردز):
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PowerPoint */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Presentation className="w-4 h-4" />
                          <span>عرض بوربوينت (PPTX):</span>
                        </label>
                        <div className="flex rounded-lg bg-slate-900 p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setQuizPptUploadMode('file')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizPptUploadMode === 'file' ? 'bg-amber-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            ملف
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizPptUploadMode('link')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizPptUploadMode === 'link' ? 'bg-amber-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            رابط Drive
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={quizPptTitle}
                        onChange={(e) => setQuizPptTitle(e.target.value)}
                        placeholder="عنوان الباوربوينت (اختياري)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                      />

                      {quizPptUploadMode === 'file' ? (
                        <div>
                          <input
                            type="file"
                            id="quiz-ppt-file-input"
                            accept=".ppt,.pptx"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setQuizPptFile(e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('quiz-ppt-file-input')?.click()}
                            className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              quizPptFile
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500'
                            }`}
                          >
                            {quizPptFile ? `تم اختيار: ${quizPptFile.name.slice(0, 20)}` : 'اختر ملف PPTX'}
                          </button>
                          {quizPptFile && (
                            <button
                              type="button"
                              onClick={() => setQuizPptFile(null)}
                              className="text-[10px] text-rose-400 hover:underline block text-center w-full mt-1"
                            >
                              إلغاء الملف
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={quizPptDriveUrl}
                          onChange={(e) => setQuizPptDriveUrl(e.target.value)}
                          placeholder="رابط Google Drive للباوربوينت..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                        />
                      )}
                    </div>

                    {/* Audio Recording */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Headphones className="w-4 h-4" />
                          <span>تسجيل صوتي (ريكورد MP3):</span>
                        </label>
                        <div className="flex rounded-lg bg-slate-900 p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setQuizAudioUploadMode('file')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizAudioUploadMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            ملف
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizAudioUploadMode('link')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizAudioUploadMode === 'link' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            رابط Drive
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={quizAudioTitle}
                        onChange={(e) => setQuizAudioTitle(e.target.value)}
                        placeholder="عنوان التسجيل الصوتي (اختياري)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                      />

                      {quizAudioUploadMode === 'file' ? (
                        <div>
                          <input
                            type="file"
                            id="quiz-audio-file-input"
                            accept="audio/*,.mp3,.m4a,.wav,.ogg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setQuizAudioFile(e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('quiz-audio-file-input')?.click()}
                            className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              quizAudioFile
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500'
                            }`}
                          >
                            {quizAudioFile ? `تم اختيار: ${quizAudioFile.name.slice(0, 20)}` : 'اختر ملف صوتي MP3'}
                          </button>
                          {quizAudioFile && (
                            <button
                              type="button"
                              onClick={() => setQuizAudioFile(null)}
                              className="text-[10px] text-rose-400 hover:underline block text-center w-full mt-1"
                            >
                              إلغاء الملف الصوتي
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={quizAudioDriveUrl}
                          onChange={(e) => setQuizAudioDriveUrl(e.target.value)}
                          placeholder="رابط Google Drive للملف الصوتي..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                        />
                      )}
                    </div>

                    {/* Mindmap */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Network className="w-4 h-4" />
                          <span>خريطة ذهنية (Mindmap):</span>
                        </label>
                        <div className="flex rounded-lg bg-slate-900 p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setQuizMindmapUploadMode('file')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizMindmapUploadMode === 'file' ? 'bg-purple-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            ملف
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizMindmapUploadMode('link')}
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              quizMindmapUploadMode === 'link' ? 'bg-purple-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            رابط Drive
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={quizMindmapTitle}
                        onChange={(e) => setQuizMindmapTitle(e.target.value)}
                        placeholder="عنوان الخريطة الذهنية (اختياري)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                      />

                      {quizMindmapUploadMode === 'file' ? (
                        <div>
                          <input
                            type="file"
                            id="quiz-mindmap-file-input"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setQuizMindmapFile(e.target.files[0]);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('quiz-mindmap-file-input')?.click()}
                            className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              quizMindmapFile
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-purple-500'
                            }`}
                          >
                            {quizMindmapFile ? `تم اختيار: ${quizMindmapFile.name.slice(0, 20)}` : 'اختر ملف PDF أو صورة'}
                          </button>
                          {quizMindmapFile && (
                            <button
                              type="button"
                              onClick={() => setQuizMindmapFile(null)}
                              className="text-[10px] text-rose-400 hover:underline block text-center w-full mt-1"
                            >
                              إلغاء الخريطة
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={quizMindmapDriveUrl}
                          onChange={(e) => setQuizMindmapDriveUrl(e.target.value)}
                          placeholder="رابط Google Drive للخريطة الذهنية..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                        />
                      )}
                    </div>

                    {/* Anki Flashcards */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                      <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>فلاش كاردز Anki (.apkg):</span>
                      </label>
                      <input
                        type="file"
                        id="quiz-anki-file-input"
                        accept=".apkg,.json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setQuizAnkiFile(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('quiz-anki-file-input')?.click()}
                        className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          quizAnkiFile
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
                        }`}
                      >
                        {quizAnkiFile ? `تم اختيار: ${quizAnkiFile.name.slice(0, 20)}` : 'اختر حزمة Anki (.apkg)'}
                      </button>
                      {quizAnkiFile && (
                        <button
                          type="button"
                          onClick={() => setQuizAnkiFile(null)}
                          className="text-[10px] text-rose-400 hover:underline block text-center w-full mt-1"
                        >
                          إلغاء حزمة الفلاش كاردز
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Watermark Toggle */}
                {quizUploadMode === 'file' && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                    <input
                      type="checkbox"
                      id="quiz-watermark-toggle"
                      checked={quizApplyWatermark}
                      onChange={(e) => setQuizApplyWatermark(e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded-lg border-slate-300 focus:ring-amber-500"
                    />
                    <label htmlFor="quiz-watermark-toggle" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      ختم علامة مائية تلقائية باسم "منصة ملخصات تمريض" على جميع صفحات بنك الأسئلة لحفظ الحقوق الفكرية
                    </label>
                  </div>
                )}

                {/* Free vs Locked & Live vs Hidden Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/70 shadow-inner">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 dark:text-slate-200 mb-2">
                      حالة إتاحة الكويز (قفل / فتح):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizIsFree(true)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                          quizIsFree
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                        }`}
                      >
                        <Gift className="w-4 h-4" />
                        <span>متاح مجاناً 🎁</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizIsFree(false)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                          !quizIsFree
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        <span>مقفول باشتراك 🔒</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 dark:text-slate-200 mb-2">
                      حالة ظهور الكويز (إخفاء / إظهار):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizIsLive(true)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                          quizIsLive
                            ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>منشور وظاهر 👁️</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizIsLive(false)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                          !quizIsLive
                            ? 'bg-slate-700 text-white border-slate-600 shadow-md'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                        }`}
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>مسودة مخفية 🙈</span>
                      </button>
                    </div>
                  </div>
                </div>

                {quizUploadFeedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      quizUploadFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                    }`}
                  >
                    {quizUploadFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span>{quizUploadFeedback.message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploadingQuiz || (quizUploadMode === 'file' ? !quizFile : !quizDriveUrl.trim())}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 text-white font-black text-base shadow-xl shadow-amber-600/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploadingQuiz ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جارِ معالجة ملف الكويزات والنشر...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5" />
                      <span>إضافة ونشر ملف أسئلة الكويزات للمادة فوراً 🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 2. List of All Uploaded Quiz Files (supports multiple quizzes per subject) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ملفات أسئلة الكويزات المنشورة ({quizzesList.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    يمكنك تعديل اسم أي كويز، أو مادته، أو الفصل الدراسي، أو عدد الأسئلة، أو استبدال ملف الكويز بضغطة زر!
                  </p>
                </div>
                <button
                  onClick={loadSubjectQuizzes}
                  disabled={isLoadingSubjectQuizzes}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  title="تحديث"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubjectQuizzes ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {quizzesList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-bold">
                  لا توجد ملفات كويزات مرفوعة حالياً. ارفع أول ملف كويز من النموذج بالأعلى!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-3 px-4">المادة</th>
                        <th className="py-3 px-4">عنوان ملف الكويز</th>
                        <th className="py-3 px-4">الفصل الدراسي (اضغط للتبديل)</th>
                        <th className="py-3 px-4">عدد الأسئلة والحجم</th>
                        <th className="py-3 px-4">تاريخ الرفع</th>
                        <th className="py-3 px-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {quizzesList.map((quiz: any) => {
                        const allSubs = subjects.length > 0 ? subjects : MOCK_SUBJECTS;
                        const subObj = allSubs.find((s) => s.id === quiz.subjectId);
                        const qSem = quiz.semester || '1';
                        const qId = quiz.id || quiz.subjectId;
                        return (
                          <tr key={qId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                              {subObj?.title || quiz.subjectId}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{quiz.title}</span>
                                  {quiz.isFree === false && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>مقفول</span>
                                    </span>
                                  )}
                                  {quiz.isLive === false && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                      <EyeOff className="w-2.5 h-2.5" />
                                      <span>مخفي</span>
                                    </span>
                                  )}
                                </div>
                                {quiz.explanationUrl && (
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={quiz.explanationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full hover:underline"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>{quiz.explanationTitle || 'ملف الشرح 📖'}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleQuizSemester(qId, qSem)}
                                className={`px-3 py-1 rounded-full text-[11px] font-black transition inline-flex items-center gap-1.5 border whitespace-nowrap ${
                                  qSem === '2'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                                    : 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                                }`}
                                title="اضغط للتبديل الفوري بين سمستر 1 وسمستر 2"
                              >
                                <span>{qSem === '2' ? '⚡ سمستر 2 (الترم الثاني)' : '🌱 سمستر 1 (الترم الأول)'}</span>
                                <span className="text-[10px] opacity-70">🔄</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 whitespace-nowrap inline-flex items-center gap-1">
                                <span>+{quiz.questionsCount} سؤال</span>
                                <span>•</span>
                                <span>{quiz.fileSize}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{quiz.updatedAt || 'معتمد'}</td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* 1-Click Toggle Free vs Locked */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuizFree(qId, quiz.isFree !== false)}
                                  className={`p-1.5 rounded-lg transition inline-flex items-center ${
                                    quiz.isFree !== false
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100'
                                      : 'bg-amber-50 dark:bg-amber-950 text-amber-600 hover:bg-amber-100'
                                  }`}
                                  title={quiz.isFree !== false ? 'الكويز متاح مجاناً للجميع (اضغط للقفل 🔒)' : 'الكويز مقفول باشتراك (اضغط للفتح 🎁)'}
                                >
                                  {quiz.isFree !== false ? <Gift className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
                                </button>

                                {/* 1-Click Toggle Live vs Hidden */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuizLive(qId, quiz.isLive !== false)}
                                  className={`p-1.5 rounded-lg transition inline-flex items-center ${
                                    quiz.isLive !== false
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={quiz.isLive !== false ? 'الكويز منشور وظاهر للطلاب (اضغط للإخفاء 🙈)' : 'الكويز مخفي عن الطلاب (اضغط للنشر 👁️)'}
                                >
                                  {quiz.isLive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditQuizModal(quiz)}
                                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition inline-flex items-center"
                                  title="تعديل اسم أو بيانات أو ملف الكويز"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <Link
                                  href={`/subject/${quiz.subjectId}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition inline-flex items-center"
                                  title="معاينة صفحة المادة"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuizFile(qId, quiz.title)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition inline-flex items-center"
                                  title="حذف ملف الكويز"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Edit Quiz Modal */}
              {editingQuiz && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">تعديل بيانات وملف الكويز 📝</h3>
                        <p className="text-xs text-slate-500">{editingQuiz.title}</p>
                      </div>
                      <button
                        onClick={() => setEditingQuiz(null)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveQuizEdit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          عنوان ملف الكويز:
                        </label>
                        <input
                          type="text"
                          value={editQuizTitle}
                          onChange={(e) => setEditQuizTitle(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              المادة الأكاديمية:
                            </label>
                            <button
                              type="button"
                              onClick={() => openQuickAddSubjectModal('editQuiz')}
                              className="text-[10px] font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة مادة</span>
                            </button>
                          </div>
                          <select
                            value={editQuizSubjectId}
                            onChange={(e) => {
                              if (e.target.value === '__NEW_SUBJECT__') {
                                openQuickAddSubjectModal('editQuiz');
                                return;
                              }
                              setEditQuizSubjectId(e.target.value);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="__NEW_SUBJECT__" className="font-bold text-amber-600">
                              ➕ [ إضافة مادة جديدة... ]
                            </option>
                            {(subjects.length > 0 ? subjects : MOCK_SUBJECTS).map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1.5">
                            الفصل الدراسي:
                          </label>
                          <select
                            value={editQuizSemester}
                            onChange={(e) => setEditQuizSemester(e.target.value as '1' | '2')}
                            className="w-full px-3 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="1">سمستر 1 (الأول)</option>
                            <option value="2">سمستر 2 (الثاني)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            عدد الأسئلة:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editQuizQuestionsCount}
                            onChange={(e) => setEditQuizQuestionsCount(Number(e.target.value))}
                            required
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          تحديث رابط الكويز أو استبدال ملف الـ PDF (اختياري):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuizDriveUrl}
                            onChange={(e) => setEditQuizDriveUrl(e.target.value)}
                            placeholder="رابط مباشر / Google Drive لملف الكويز..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <FileUp className="w-3.5 h-3.5" />
                            <span>{editQuizFile ? editQuizFile.name.slice(0, 12) : 'استبدال PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) setEditQuizFile(e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Explanation file edit / replacement / removal */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            ملف الشرح وتوضيح الإجابات (اختياري 📖):
                          </label>
                          {(editingQuiz?.explanationUrl || editQuizExplanationDriveUrl || editQuizExplanationFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuizExplanationDriveUrl('');
                                setEditQuizExplanationFile(null);
                                setEditRemoveQuizExplanation(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuizExplanation ? 'سيتم حذف ملف الشرح عند الحفظ 🗑️' : 'حذف ملف الشرح الحالي 🗑️'}
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={editQuizExplanationTitle}
                          onChange={(e) => setEditQuizExplanationTitle(e.target.value)}
                          placeholder="عنوان ملف الشرح (مثال: ملف شرح وتوضيح الإجابات)..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuizExplanationDriveUrl}
                            onChange={(e) => {
                              setEditQuizExplanationDriveUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveQuizExplanation(false);
                            }}
                            placeholder="رابط Google Drive لملف الشرح..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{editQuizExplanationFile ? editQuizExplanationFile.name.slice(0, 10) : 'رفع PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditQuizExplanationFile(e.target.files[0]);
                                  setEditRemoveQuizExplanation(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* PowerPoint in Edit Modal */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Presentation className="w-4 h-4" />
                            <span>عرض تقديمي بوربوينت (PPTX):</span>
                          </label>
                          {(editingQuiz?.pptUrl || editQuizPptDriveUrl || editQuizPptFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuizPptDriveUrl('');
                                setEditQuizPptFile(null);
                                setEditRemoveQuizPpt(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuizPpt ? 'سيتم حذف الباوربوينت عند الحفظ 🗑️' : 'حذف الباوربوينت 🗑️'}
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editQuizPptTitle}
                          onChange={(e) => setEditQuizPptTitle(e.target.value)}
                          placeholder="عنوان الباوربوينت..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuizPptDriveUrl}
                            onChange={(e) => {
                              setEditQuizPptDriveUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveQuizPpt(false);
                            }}
                            placeholder="رابط Google Drive للباوربوينت..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <Presentation className="w-3.5 h-3.5" />
                            <span>{editQuizPptFile ? editQuizPptFile.name.slice(0, 10) : 'رفع PPTX'}</span>
                            <input
                              type="file"
                              accept=".ppt,.pptx"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditQuizPptFile(e.target.files[0]);
                                  setEditRemoveQuizPpt(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Audio in Edit Modal */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Headphones className="w-4 h-4" />
                            <span>تسجيل صوتي (ريكورد MP3):</span>
                          </label>
                          {(editingQuiz?.audioUrl || editQuizAudioDriveUrl || editQuizAudioFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuizAudioDriveUrl('');
                                setEditQuizAudioFile(null);
                                setEditRemoveQuizAudio(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuizAudio ? 'سيتم حذف التسجيل الصوتي 🗑️' : 'حذف التسجيل الصوتي 🗑️'}
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editQuizAudioTitle}
                          onChange={(e) => setEditQuizAudioTitle(e.target.value)}
                          placeholder="عنوان التسجيل الصوتي..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuizAudioDriveUrl}
                            onChange={(e) => {
                              setEditQuizAudioDriveUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveQuizAudio(false);
                            }}
                            placeholder="رابط Google Drive للصوت..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5" />
                            <span>{editQuizAudioFile ? editQuizAudioFile.name.slice(0, 10) : 'رفع MP3'}</span>
                            <input
                              type="file"
                              accept="audio/*,.mp3,.m4a,.wav,.ogg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditQuizAudioFile(e.target.files[0]);
                                  setEditRemoveQuizAudio(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Mindmap in Edit Modal */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Network className="w-4 h-4" />
                            <span>خريطة ذهنية (Mindmap):</span>
                          </label>
                          {(editingQuiz?.mindmapUrl || editQuizMindmapDriveUrl || editQuizMindmapFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuizMindmapDriveUrl('');
                                setEditQuizMindmapFile(null);
                                setEditRemoveQuizMindmap(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuizMindmap ? 'سيتم حذف الخريطة 🗑️' : 'حذف الخريطة الذهنية 🗑️'}
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editQuizMindmapTitle}
                          onChange={(e) => setEditQuizMindmapTitle(e.target.value)}
                          placeholder="عنوان الخريطة الذهنية..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editQuizMindmapDriveUrl}
                            onChange={(e) => {
                              setEditQuizMindmapDriveUrl(e.target.value);
                              if (e.target.value.trim()) setEditRemoveQuizMindmap(false);
                            }}
                            placeholder="رابط Google Drive للخريطة الذهنية..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                          />
                          <label className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer transition flex items-center gap-1">
                            <Network className="w-3.5 h-3.5" />
                            <span>{editQuizMindmapFile ? editQuizMindmapFile.name.slice(0, 10) : 'رفع خريطة'}</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEditQuizMindmapFile(e.target.files[0]);
                                  setEditRemoveQuizMindmap(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Anki Flashcards in Edit Modal */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            <span>فلاش كاردز Anki (.apkg):</span>
                          </label>
                          {(editingQuiz?.flashcards?.length || editQuizAnkiFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditQuizAnkiFile(null);
                                setEditRemoveQuizFlashcards(true);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:underline"
                            >
                              {editRemoveQuizFlashcards ? 'سيتم حذف الفلاش كاردز 🗑️' : 'حذف الفلاش كاردز 🗑️'}
                            </button>
                          )}
                        </div>
                        <label className="w-full py-2.5 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2">
                          <Layers className="w-4 h-4" />
                          <span>{editQuizAnkiFile ? editQuizAnkiFile.name : (editingQuiz?.flashcards?.length ? `تحديث حزمة Anki (${editingQuiz.flashcards.length} بطاقة حالياً)` : 'رفع حزمة Anki (.apkg)')}</span>
                          <input
                            type="file"
                            accept=".apkg,.json"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setEditQuizAnkiFile(e.target.files[0]);
                                setEditRemoveQuizFlashcards(false);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Controls for Free/Locked and Live/Hidden in Edit Modal */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            إتاحة الكويز (مجاني / مقفول):
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditQuizIsFree(true)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                editQuizIsFree
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>مجاني 🎁</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditQuizIsFree(false)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                !editQuizIsFree
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>مقفول 🔒</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            حالة الظهور (نشر / إخفاء):
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditQuizIsLive(true)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                editQuizIsLive
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>منشور 👁️</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditQuizIsLive(false)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                                !editQuizIsLive
                                  ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>مخفي 🙈</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingQuiz(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingQuizEdit || !editQuizTitle.trim()}
                          className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-600/20"
                        >
                          {isSavingQuizEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>حفظ التعديلات فوراً</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Orders & Payments (طلبات الشراء والمدفوعات 💳) */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>طلبات الشراء والتحويلات المالية 💳</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  مراجعة تحويلات فودافون كاش، اعتماد وتفعيل المحاضرات فورياً للطلاب، أو رفض الدفع مع توضيح السبب.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadOrders()}
                  disabled={isLoadingOrders}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  <span>تحديث الطلبات</span>
                </button>
              </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">إجمالي الطلبات</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{orders.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block mb-1">تنتظر المراجعة ⏳</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {orders.filter((o) => o.status === 'pending').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block mb-1">طلبات مقبولة ومفعلة ✅</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {orders.filter((o) => o.status === 'approved').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-xs text-rose-800 dark:text-rose-300 font-bold block mb-1">طلبات مرفوضة ❌</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {orders.filter((o) => o.status === 'rejected').length}
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                الكل ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                }`}
              >
                قيد المراجعة ({orders.filter((o) => o.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                }`}
              >
                المقبولة ({orders.filter((o) => o.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                }`}
              >
                المرفوضة ({orders.filter((o) => o.status === 'rejected').length})
              </button>
            </div>

            {/* Orders List / Table */}
            {isLoadingOrders ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-xs">جاري تحميل طلبات الشراء...</span>
              </div>
            ) : orders.filter((o) => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">لا توجد طلبات شراء في هذا القسم حالياً</p>
                <p className="text-xs text-slate-400">أي طلب تحويل يرسله الطالب سيظهر هنا فوراً مع إشعار تيليجرام.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                      <th className="py-3 px-3">الطالب</th>
                      <th className="py-3 px-3">المحاضرة والمادة</th>
                      <th className="py-3 px-3">المبلغ</th>
                      <th className="py-3 px-3">بيانات التحويل</th>
                      <th className="py-3 px-3">رسالة الطالب</th>
                      <th className="py-3 px-3">الإيصال</th>
                      <th className="py-3 px-3">الحالة</th>
                      <th className="py-3 px-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {orders
                      .filter((o) => orderFilter === 'all' || o.status === orderFilter)
                      .map((order) => {
                        return (
                          <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                            {/* Student */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">{order.studentName}</div>
                              <div className="text-[11px] text-slate-500 font-semibold">{order.studentUniversity}</div>
                              <div className="text-[10px] text-teal-600 font-mono mt-0.5" dir="ltr">
                                {order.studentPhone}
                              </div>
                            </td>

                            {/* Lecture / Bundle */}
                            <td className="py-3.5 px-3 max-w-[200px]">
                              {order.orderType === 'shakib_rakib' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-[10px] mb-1 shadow-sm">
                                  <Crown className="w-3 h-3 text-yellow-200" />
                                  <span>باقة شاكب راكب 🚀</span>
                                </span>
                              )}
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{order.lectureTitle}</div>
                              <div className="text-[11px] text-slate-500 truncate">{order.subjectTitle}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{order.createdAt}</div>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="font-black text-sm text-slate-900 dark:text-white">{order.price || 50}</span>
                              <span className="text-[10px] text-slate-500 font-bold mr-1">ج.م</span>
                            </td>

                            {/* Transfer Info */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="text-[11px] text-slate-700 dark:text-slate-300">
                                <span className="text-slate-400">حول من: </span>
                                <span className="font-mono font-bold text-teal-600" dir="ltr">{order.senderPhone}</span>
                              </div>
                              {order.contactPhone && (
                                <div className="text-[10px] text-slate-500">
                                  <span>تواصل: </span>
                                  <span className="font-mono" dir="ltr">{order.contactPhone}</span>
                                </div>
                              )}
                            </td>

                            {/* Student Message */}
                            <td className="py-3.5 px-3 max-w-[160px]">
                              {order.userMessage ? (
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/60" title={order.userMessage}>
                                  {order.userMessage}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>

                            {/* Screenshot */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {order.screenshotUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingScreenshotUrl(order.screenshotUrl || null)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>معاينة الإيصال</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">بدون صورة</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {order.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>بانتظار التأكيد</span>
                                </span>
                              )}
                              {order.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>مقبول ومفعل 🎓</span>
                                </span>
                              )}
                              {order.status === 'rejected' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                                    <X className="w-3 h-3" />
                                    <span>مرفوض ❌</span>
                                  </span>
                                  {order.rejectionReason && (
                                    <div className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[130px] truncate" title={order.rejectionReason}>
                                      {order.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {order.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveOrder(order.id)}
                                      className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition"
                                      title="قبول وتفعيل المحاضرة فوراً"
                                    >
                                      موافقة وتفعيل ✅
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedOrderForReject(order);
                                        setRejectionReasonInput('لم يتم استلام المبلغ على فودافون كاش - يرجى التأكد من الرقم والتحويل');
                                      }}
                                      className="py-1 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800 transition"
                                      title="رفض الطلب مع ذكر السبب"
                                    >
                                      رفض ❌
                                    </button>
                                  </>
                                )}

                                {order.status === 'approved' && (
                                  <span className="text-emerald-600 text-xs font-bold">مفعل في الحساب</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition"
                                  title="حذف هذا الطلب من السجل"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: Students Accounts (حسابات الطلاب والاشتراكات 👥) */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <span>حسابات الطلاب والاشتراكات 👥</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  إدارة الطلاب المسجلين بالمنصة، تغيير كلمات المرور، وفتح أو قفل المحاضرات على كل طالب بحرية تامة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadStudents()}
                  disabled={isLoadingStudents}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                  <span>تحديث الطلاب</span>
                </button>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف أو الجامعة..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
              />

              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 self-end sm:self-auto">
                إجمالي الطلاب المسجلين: <span className="text-teal-600 font-black">{students.length}</span> طالب
              </div>
            </div>

            {/* Students Table */}
            {isLoadingStudents ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-xs">جاري تحميل بيانات الطلاب...</span>
              </div>
            ) : students.filter(
                (s) =>
                  !studentSearch.trim() ||
                  s.name.includes(studentSearch.trim()) ||
                  s.phone.includes(studentSearch.trim()) ||
                  s.university.includes(studentSearch.trim())
              ).length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">لا يوجد طلاب مسجلين يطابقون البحث</p>
                <p className="text-xs text-slate-400">عندما يقوم أي طالب بإنشاء حساب لشراء المحاضرات، سيظهر هنا مباشرة.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                      <th className="py-3 px-3">الطالب</th>
                      <th className="py-3 px-3">الجامعة</th>
                      <th className="py-3 px-3">رقم الهاتف</th>
                      <th className="py-3 px-3">المحاضرات المفعلة</th>
                      <th className="py-3 px-3 text-center">الأجهزة والجلسات</th>
                      <th className="py-3 px-3">تاريخ التسجيل</th>
                      <th className="py-3 px-3 text-center">التحكم والصلاحيات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {students
                      .filter(
                        (s) =>
                          !studentSearch.trim() ||
                          s.name.includes(studentSearch.trim()) ||
                          s.phone.includes(studentSearch.trim()) ||
                          s.university.includes(studentSearch.trim())
                      )
                      .map((student) => {
                        const purchasedCount = student.purchasedLectureIds?.length || 0;
                        return (
                          <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                            {/* Name & Avatar */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">ID: {student.id.slice(0, 10)}...</div>
                                </div>
                              </div>
                            </td>

                            {/* University */}
                            <td className="py-3.5 px-3">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{student.university}</span>
                            </td>

                            {/* Phone */}
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                              {student.phone}
                            </td>

                            {/* Purchased Lectures Count */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  purchasedCount > 0
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{purchasedCount} محاضرة</span>
                              </span>
                            </td>

                            {/* Devices & Sessions */}
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                    (student.knownDevices?.length || 0) >= 5
                                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                      : (student.knownDevices?.length || 0) > 2
                                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span>📱 {student.knownDevices?.length || 0} / 5 أجهزة</span>
                                  {(student.knownDevices?.length || 0) >= 5 && <span className="text-rose-600 font-bold">(محظور)</span>}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentDevices(student.id, student.name)}
                                  className="text-[10px] text-teal-600 hover:text-teal-500 font-bold underline hover:no-underline transition"
                                  title="تصفير أجهزة الطالب المسجلة"
                                >
                                  🔄 تصفير الأجهزة
                                </button>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {student.createdAt || '-'}
                            </td>

                            {/* Controls */}
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentForLectures(student)}
                                  className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 flex items-center gap-1 transition"
                                  title="فتح أو قفل المحاضرات على هذا الطالب"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>المحاضرات المفتوحة</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentForEdit(student);
                                    setEditStudentName(student.name || '');
                                    setEditStudentPhone(student.phone || '');
                                    setEditStudentUniversity(student.university || '');
                                    setEditStudentPassword(student.password || '');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 flex items-center gap-1 transition"
                                  title="تعديل جميع بيانات الطالب أو تغيير الباسورد"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>تعديل بيانات الطالب</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition"
                                  title="حذف حساب الطالب"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Viewing Screenshot Modal */}
        {viewingScreenshotUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
            dir="rtl"
            onClick={() => setViewingScreenshotUrl(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>معاينة إيصال تحويل فودافون كاش</span>
                </h4>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 hover:bg-teal-100 text-xs font-bold inline-flex items-center gap-1"
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح بالحجم الأصلي</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewingScreenshotUrl(null)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl p-2 min-h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingScreenshotUrl}
                  alt="إيصال التحويل"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Reject Order Modal */}
        {selectedOrderForReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    <span>رفض طلب الدفع ❌</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الطالب: <span className="font-bold">{selectedOrderForReject.studentName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReject(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRejectOrderSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    سبب رفض التحويل (يظهر للطالب):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="اكتب سبب الرفض هنا ليراه الطالب (مثال: لم يتم استلام المبلغ على فودافون كاش، الرقم المحول منه غير صحيح، إلخ)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isRejectingOrder}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isRejectingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    <span>تأكيد الرفض مع إشعار تيليجرام</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForReject(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Full Info Modal */}
        {selectedStudentForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                    <span>تعديل بيانات الطالب ✏️</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الطالب: <span className="font-bold">{selectedStudentForEdit.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForEdit(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateStudentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الطالب (حروف فقط بدون أرقام) *:
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value.replace(/[0-9\u0660-\u0669\u06F0-\u06F9]/g, ''))}
                    placeholder="اسم الطالب الثلاثي أو الرباعي..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    * الحقل يقبل الحروف فقط ولن يسمح بكتابة أي أرقام نهائياً.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف الشخصي (أرقام فقط) *:
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={editStudentPhone}
                    onChange={(e) => setEditStudentPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    * الحقل يقبل الأرقام فقط ولن يسمح بكتابة أي حروف.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الجامعة أو الكلية:
                  </label>
                  <input
                    type="text"
                    value={editStudentUniversity}
                    onChange={(e) => setEditStudentUniversity(e.target.value)}
                    placeholder="مثال: جامعة القاهرة، تمريض المنصورة..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور (الباسورد):
                  </label>
                  <input
                    type="text"
                    value={editStudentPassword}
                    onChange={(e) => setEditStudentPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور جديدة..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    * يمكنك تغيير الباسورد وتسليمه للطالب فوراً.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingStudent || !editStudentName.trim() || !editStudentPhone.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isUpdatingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>حفظ التعديلات فوراً</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForEdit(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Student Lectures Modal */}
        {selectedStudentForLectures && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    <span>إدارة المحاضرات المفتوحة للطالب 🎓</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الطالب: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForLectures.name}</span> ({selectedStudentForLectures.university}) - يمكنك فتح أي محاضرة بضغطة زر أو قفلها وسحبها فوراً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForLectures(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-shrink-0">
                <input
                  type="text"
                  placeholder="ابحث عن محاضرة لفتحها أو قفلها..."
                  value={lectureGrantSearch}
                  onChange={(e) => setLectureGrantSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {lectures
                  .filter(
                    (lec) =>
                      !lectureGrantSearch.trim() ||
                      lec.title.toLowerCase().includes(lectureGrantSearch.toLowerCase().trim()) ||
                      lec.subjectTitle.toLowerCase().includes(lectureGrantSearch.toLowerCase().trim())
                  )
                  .map((lec) => {
                    const isGranted = (selectedStudentForLectures.purchasedLectureIds || []).includes(lec.id);
                    return (
                      <div
                        key={lec.id}
                        className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition ${
                          isGranted
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{lec.title}</span>
                            {!lec.isFree && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                مدفوعة ({lec.price || 50} ج.م)
                              </span>
                            )}
                            {lec.isFree && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                مجانية عامة
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {lec.subjectTitle} • {lec.yearTitle}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStudentLecture(selectedStudentForLectures.id, lec.id, !isGranted)}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
                            isGranted
                              ? 'bg-emerald-600 hover:bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isGranted ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>مفتوحة (اضغط للقفل)</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>مقفولة (اضغط للفتح)</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForLectures(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: باقة شاكب راكب الشهرية الشاملة */}
        {activeTab === 'shakibRakib' && (
          <div className="space-y-8" dir="rtl">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 border-amber-300/40">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black border border-white/30">
                  <Crown className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                  <span>نظام الاشتراك الشهري الشامل</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black">
                  باقة شاكب راكب الشهرية 🚀
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
                  تتيح للطلاب فتح جميع مواد ومحاضرات السنة الدراسية بالكامل لهذا الشهر دفعة واحدة بسعر شهري موحد، مع ظهور بانر ذهبي مميز في الصفحة الرئيسية وصفحات السنوات.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
                  <span className="text-[11px] font-bold text-amber-100 block mb-0.5">المشتركين النشطين</span>
                  <span className="text-3xl font-black text-white">
                    {students.filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now()).length}
                  </span>
                </div>
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
                  <span className="text-[11px] font-bold text-amber-100 block mb-0.5">السعر الشهري</span>
                  <span className="text-3xl font-black text-yellow-300">
                    {shakibPrice} <span className="text-xs font-bold text-white">ج.م</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-600" />
                    <span>إعدادات وتسعير باقة شاكب راكب</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    يمكنك تعديل السعر الشهري (الافتراضي 10 ج.م) ونص شهر الاشتراك وتفعيل أو إيقاف ظهور الباقة للطلاب.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حالة الباقة:</span>
                  <button
                    type="button"
                    onClick={() => setShakibIsEnabled(!shakibIsEnabled)}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition ${
                      shakibIsEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {shakibIsEnabled ? 'مفعلة وتظهر للطلاب 🌟' : 'معطلة ومخفية 🔒'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveShakibConfig} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سعر باقة شاكب راكب الشهرية (جنية مصري) *:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={shakibPrice}
                        onChange={(e) => setShakibPrice(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500"
                        placeholder="10"
                      />
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ج.م</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تسمية الشهر / نطاق الباقة *:
                    </label>
                    <input
                      type="text"
                      required
                      value={shakibMonthLabel}
                      onChange={(e) => setShakibMonthLabel(e.target.value)}
                      placeholder="اشتراك الشهر الحالي (شامل كل المواد)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {shakibFeedback && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold">
                    {shakibFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingShakib}
                  className="py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingShakib ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>حفظ إعدادات وسعر شاكب راكب 🚀</span>
                </button>
              </form>
            </div>

            {/* Quick Grant Subscription Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>تفعيل باقة شاكب راكب لطالب بالاسم أو رقم الهاتف مباشرة ⚡️</span>
              </h4>
              <p className="text-xs text-slate-500">
                ابحث عن أي طالب مسجل وقم بتفعيل أو تمديد باقة شاكب راكب له لمدة 30 يوماً بضغطة واحدة دون الحاجة لتحويله إيصال.
              </p>

              <div className="max-w-md">
                <input
                  type="text"
                  value={shakibStudentSearch}
                  onChange={(e) => setShakibStudentSearch(e.target.value)}
                  placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {shakibStudentSearch.trim() && (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {students
                    .filter(
                      (s) =>
                        s.name.toLowerCase().includes(shakibStudentSearch.toLowerCase()) ||
                        s.phone.includes(shakibStudentSearch)
                    )
                    .slice(0, 8)
                    .map((s) => {
                      const isActive =
                        s.shakibRakibSubscription?.isActive &&
                        new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now();
                      return (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white block">{s.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono" dir="ltr">{s.phone}</span>
                            <span className="text-[11px] text-slate-400 mx-1">•</span>
                            <span className="text-[11px] text-slate-500">{s.university}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <button
                                type="button"
                                disabled={isGrantingShakib}
                                onClick={() => handleRevokeShakib(s.id)}
                                className="py-1 px-3 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold transition"
                              >
                                إلغاء الباقة ❌
                              </button>
                            ) : null}

                            <button
                              type="button"
                              disabled={isGrantingShakib}
                              onClick={() => handleGrantShakib(s.id, 30)}
                              className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                            >
                              <Crown className="w-3.5 h-3.5 text-yellow-200" />
                              <span>{isActive ? 'تمديد 30 يوم 🚀' : 'تفعيل شاكب راكب 30 يوم 🚀'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Active Subscribers List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span>قائمة المشتركين الحاليين في باقة شاكب راكب 🎓</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    الطلاب الذين لديهم اشتراك سارٍ يتيح لهم الوصول الفوري لجميع مواد ومحاضرات هذا الشهر.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300">
                  {students.filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now()).length} مشترك نشط
                </span>
              </div>

              {students.filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now()).length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Crown className="w-10 h-10 mx-auto text-amber-400/40" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">لا يوجد طلاب مشتركون حالياً في باقة شاكب راكب</p>
                  <p className="text-xs text-slate-400">عندما يطلب الطالب الاشتراك وتوافق عليه، أو تقوم بتفعيله يدوياً، سيظهر هنا.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                        <th className="py-3 px-3">الطالب</th>
                        <th className="py-3 px-3">الجامعة</th>
                        <th className="py-3 px-3">الهاتف</th>
                        <th className="py-3 px-3">بداية الاشتراك</th>
                        <th className="py-3 px-3">تاريخ الانتهاء</th>
                        <th className="py-3 px-3">المتبقي</th>
                        <th className="py-3 px-3 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {students
                        .filter((s) => s.shakibRakibSubscription?.isActive && new Date(s.shakibRakibSubscription.expiresAt).getTime() > Date.now())
                        .map((s) => {
                          const sub = s.shakibRakibSubscription!;
                          const daysLeft = Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                          return (
                            <tr key={s.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{s.university}</td>
                              <td className="py-3 px-3 font-mono text-teal-600" dir="ltr">{s.phone}</td>
                              <td className="py-3 px-3 text-slate-500">{new Date(sub.startDate).toLocaleDateString('ar-EG')}</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-bold">{new Date(sub.expiresAt).toLocaleDateString('ar-EG')}</td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                                  <Clock className="w-3 h-3" />
                                  <span>{daysLeft} يوم</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isGrantingShakib}
                                    onClick={() => handleGrantShakib(s.id, 30)}
                                    className="py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-sm transition"
                                  >
                                    تمديد شهر 🚀
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isGrantingShakib}
                                    onClick={() => handleRevokeShakib(s.id)}
                                    className="py-1 px-2.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] transition"
                                  >
                                    إلغاء ❌
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Announcement Bar Settings */}
        {activeTab === 'announcement' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-teal-600" />
                  <span>شريط التنبيهات والإعلانات العلوي (Announcement Bar)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اكتب إعلاناً ترويجياً أو تنبيهاً هاماً (مثل: مواعيد الامتحانات أو المراجعات) وسيظهر فوراً في أعلى كل صفحات الموقع.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حالة الشريط:</span>
                <button
                  type="button"
                  onClick={() => setAnnouncementActive(!announcementActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementActive ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {announcementActive ? 'مفعل 🟢' : 'معطل ⚪'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  نص الإعلان أو التنبيه:
                </label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="مثال: 📢 تنبيه: تم رفع مراجعة الميدتيرم لمادة التشريح والفسيولوجي الآن!"
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    نص الزر الإضافي (اختياري):
                  </label>
                  <input
                    type="text"
                    value={announcementLinkText}
                    onChange={(e) => setAnnouncementLinkText(e.target.value)}
                    placeholder="مثال: انضم لجروب الواتساب"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رابط الزر:
                  </label>
                  <input
                    type="text"
                    value={announcementLinkUrl}
                    onChange={(e) => setAnnouncementLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">معاينة مباشرة لشكل الشريط في الموقع:</span>
                <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-700 text-white text-xs font-medium py-2.5 px-4 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 flex-shrink-0" />
                    <span>{announcementText || 'نص الإعلان سيظهر هنا'}</span>
                    {announcementLinkText && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-teal-800 text-[10px] font-black mr-2">
                        {announcementLinkText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {announcementFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-xs font-bold text-center">
                  {announcementFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {isSavingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                <span>حفظ ونشر التنبيه فوراً في أعلى الموقع 📢</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB: Platform Lockdown & Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span>قفل المنصة ووضع الصيانة (Maintenance Mode)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  يمكنك إغلاق المنصة أمام الطلاب بضغطة زر واحدة أثناء تحديث المذكرات أو الصيانة.
                  المنصة تظل <span className="font-bold text-teal-600 dark:text-teal-400">متاحة لك وحدك للمعاينة</span> كأدمن من أي صفحة!
                </p>
              </div>

              {/* Master Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border shadow-sm ${
                    maintenanceIsEnabled
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      maintenanceIsEnabled ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {maintenanceIsEnabled
                      ? 'المنصة مقفولة حالياً (وضع الصيانة مفعل) 🔒'
                      : 'المنصة مفتوحة وتعمل بشكل طبيعي 🟢'}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div
              className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                maintenanceIsEnabled
                  ? 'bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-slate-900 border-rose-500/40 text-white shadow-lg shadow-rose-950/20'
                  : 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-teal-950/30 border-emerald-500/30 text-white shadow-lg'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      maintenanceIsEnabled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {maintenanceIsEnabled ? '🔒' : '🌟'}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold">
                      {maintenanceIsEnabled
                        ? 'المنصة محجوبة الآن عن الطلاب والزوار'
                        : 'المنصة متاحة للجميع بدون قيود'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {maintenanceIsEnabled
                        ? 'أي زائر يدخل المنصة سيظهر له عنوان الصيانة ورسالتك المخصصة وزر الواتساب. يمكنك تصفح الموقع بحرية للمعاينة.'
                        : 'جميع صفحات المحاضرات والمواد والكويزات تعمل بشكل مباشر لجميع الطلاب.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {maintenanceIsEnabled ? (
                    <button
                      type="button"
                      disabled={isSavingMaintenance}
                      onClick={() => handleSaveMaintenance(false)}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSavingMaintenance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      <span>فتح المنصة للطلاب الآن 🎉</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSavingMaintenance}
                      onClick={() => handleSaveMaintenance(true)}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSavingMaintenance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>قفل المنصة وتفعيل الصيانة 🔒</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Maintenance Settings Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMaintenance();
              }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-teal-600" />
                  <span>تخصيص الرسالة ومحتوى شاشة الصيانة</span>
                </h4>

                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceTitle('المنصة في وضع الصيانة والتحديث المؤقت 🛠️');
                    setMaintenanceMessage(
                      'نقوم حالياً بإجراء تحديثات وتحسينات دورية لإضافة محاضرات ومحتوى تعليمي جديد وتطوير تجربة التعلم لجميع طلاب تمريض. سنعود إليكم خلال وقت قصير بإذن الله.'
                    );
                    setMaintenanceEstimatedReturn('خلال وقت قصير جداً');
                    setMaintenanceWhatsapp('https://chat.whatsapp.com/FMoAgeSYXKsFshfsNm3oti');
                  }}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>استعادة النص المقترح</span>
                </button>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  عنوان شاشة الصيانة:
                </label>
                <input
                  type="text"
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  placeholder="المنصة في وضع الصيانة والتحديث المؤقت 🛠️"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Message Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الرسالة المخصصة للطلاب (تظهر بوضوح في منتصف الشاشة):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {maintenanceMessage.length} حرف
                  </span>
                </div>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="اكتب هنا الرسالة التي تريد أن يراها الطالب عند محاولته دخول المنصة..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
                />
              </div>

              {/* Estimated Return & WhatsApp Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الموعد المتوقع للعودة والافتتاح (اختياري):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={maintenanceEstimatedReturn}
                      onChange={(e) => setMaintenanceEstimatedReturn(e.target.value)}
                      placeholder="مثال: اليوم في تمام الساعة 9:00 مساءً"
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رابط أو رقم واتساب للدعم السريع:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={maintenanceWhatsapp}
                      onChange={(e) => setMaintenanceWhatsapp(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left font-mono"
                      dir="ltr"
                    />
                    <MessageCircle className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              {maintenanceFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 ${
                    maintenanceFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {maintenanceFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>{maintenanceFeedback.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingMaintenance}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSavingMaintenance ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>حفظ وتطبيق إعدادات الصيانة 💾</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMaintenancePreviewModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>معاينة شاشة القفل كما يراها الطالب 👁️</span>
                </button>

                <Link
                  href="/"
                  target="_blank"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>معاينة المنصة كمشرف 🌐</span>
                </Link>
              </div>
            </form>

            {/* Live Visual Preview Box */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>محاكاة مصغرة حية لما سيظهر للطلاب:</span>
                </h4>
                <span className="text-[11px] text-slate-400">تحديث مباشر أثناء الكتابة</span>
              </div>

              <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 text-center relative overflow-hidden shadow-xl max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-teal-400" />
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3">
                  {maintenanceTitle || 'المنصة في وضع الصيانة والتحديث المؤقت 🛠️'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-4 whitespace-pre-line leading-relaxed text-right">
                  {maintenanceMessage || 'نقوم حالياً بإجراء تحديثات وتحسينات دورية...'}
                </p>

                {maintenanceEstimatedReturn && (
                  <div className="inline-flex items-center gap-2 bg-teal-950/60 border border-teal-500/30 text-teal-200 text-xs font-bold px-3 py-1.5 rounded-xl mb-4">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>الموعد المتوقع للعودة: {maintenanceEstimatedReturn}</span>
                  </div>
                )}

                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل مع الدعم عبر واتساب</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Broken Link Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>بلاغات الروابط المعطلة الواردة من الطلاب</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تصلك هذه البلاغات أيضاً فورياً عبر بوت تيليجرام.
                </p>
              </div>

              <button
                onClick={loadReports}
                disabled={isLoadingReports}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingReports ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                <span>جارِ تحميل البلاغات...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد أي بلاغات معلقة حالياً!</p>
                <p className="text-xs">جميع روابط الملخصات والمذكرات تعمل بصورة ممتازة.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                      rep.status === 'resolved'
                        ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {rep.lectureTitle}
                        </span>
                        <span className="text-xs text-slate-500">({rep.subjectTitle})</span>
                        {rep.status === 'resolved' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            تم الإصلاح ✅
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            قيد الانتظار ⚠️
                          </span>
                        )}
                      </div>

                      {rep.userNote && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          📝 ملاحظة الطالب: <i>{rep.userNote}</i>
                        </p>
                      )}

                      {rep.userPhone && (
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-slate-500 text-[11px]">رقم هاتف الطالب:</span>
                          <span className="font-bold text-teal-700 dark:text-teal-400 font-mono" dir="ltr">
                            {rep.userPhone}
                          </span>
                          <a
                            href={`https://wa.me/2${rep.userPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                          >
                            واتساب 💬
                          </a>
                          <a
                            href={`tel:${rep.userPhone}`}
                            className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                          >
                            اتصال 📞
                          </a>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">التوقيت: {rep.createdAt}</p>
                    </div>

                    {rep.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تم الإصلاح ✅</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Section 2: Student Complaints & Messages */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-teal-600" />
                  <span>شكاوى ورسائل الطلاب الواردة بالرقم ({complaints.length})</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  جميع الشكاوى والاستفسارات المرسلة من الطلاب مع أرقام هواتفهم للتواصل والمتابعة المباشرة.
                </p>
              </div>

              {complaints.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">لا توجد شكاوى جديدة حتى الآن</p>
                  <p className="text-[11px]">أي شكوى يرسلها طالب ستظهر هنا وتصلك فوراً على بوت التيليجرام.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((comp) => (
                    <div
                      key={comp.id}
                      className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                        comp.status === 'resolved'
                          ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {comp.name}
                          </span>
                          <span className="text-xs text-slate-500">({comp.year})</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {comp.type}
                          </span>
                          {comp.status === 'resolved' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              تم الرد والحل ✅
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              جديدة وغير محلولة 🔔
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          💬 {comp.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[11px]">رقم الطالب:</span>
                            <span className="font-bold text-teal-700 dark:text-teal-400 font-mono" dir="ltr">
                              {comp.phone}
                            </span>
                          </div>
                          <a
                            href={`https://wa.me/2${comp.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <span>واتساب 💬</span>
                          </a>
                          <a
                            href={`tel:${comp.phone}`}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <span>اتصال 📞</span>
                          </a>
                          <span className="text-[10px] text-slate-400 mr-auto">{comp.createdAt}</span>
                        </div>
                      </div>

                      {comp.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveComplaint(comp.id)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تم الحل والتواصل ✅</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Telegram Integration & Daily Reports */}
        {activeTab === 'telegram' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-600" />
                  <span>تتبع وإشعارات تيليجرام المباشرة (Telegram Integration)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  البوت مربوط ومبرمج لإرسال التنبيهات اللحظية والتقرير اليومي الشامل تلقائياً.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                Bot Active 🤖
              </span>
            </div>

            {/* Telegram Config Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 block">معرف المحادثة (Chat ID):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">8098726389</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 block">توكن البوت (Bot Token):</span>
                <span className="font-mono text-slate-900 dark:text-white">8276648021:AA...bVeciIg</span>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">التنبيهات التلقائية المفعلة في النظام:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-1">
                  <span className="font-bold text-teal-800 dark:text-teal-300 block">1. إشعار دخول زائر جديد</span>
                  <p className="text-slate-600 dark:text-slate-400">يرسل فورا نوع الجهاز، التوقيت، والصفحة التي دخل إليها.</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">2. إشعار تحميل المذكرات</span>
                  <p className="text-slate-600 dark:text-slate-400">يرسل اسم المحاضرة والمادة ونوع الملف المحمّل والتوقيت.</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block">3. إشعار بلاغ عن رابط عطلان</span>
                  <p className="text-slate-600 dark:text-slate-400">تنبيه عاجل مع ملاحظة الطالب لفحص الرابط وإصلاحه.</p>
                </div>
              </div>
            </div>

            {/* Test & Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">اختبار وتوليد التقارير:</h4>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isTestingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال إشعار تجريبي للبوت الآن 🔔</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendDailyReport}
                  disabled={isSendingDailyReport}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSendingDailyReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  <span>إرسال التقرير اليومي الشامل (Daily Summary) لتيليجرام 📊</span>
                </button>
              </div>

              {telegramFeedback && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center animate-in fade-in">
                  {telegramFeedback}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Quick Add Subject Modal (Interactive Modal callable from any form or dropdown) */}
        {isQuickAddSubOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    <span>إضافة مادة دراسية جديدة فوراً 📚</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    أضف أي مادة من عندك وستظهر فوراً في القوائم والموقع بدون ما تفقد أي بيانات أدخلتها!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickAddSubOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المادة بالعربي: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickSubTitle}
                    onChange={(e) => setQuickSubTitle(e.target.value)}
                    placeholder="مثال: تمريض باطني وجراحي / كيمياء حيوية..."
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      الفرقة الدراسية:
                    </label>
                    <select
                      value={quickSubYearId}
                      onChange={(e) => setQuickSubYearId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1">السنة الأولى</option>
                      <option value="2">السنة الثانية</option>
                      <option value="3">السنة الثالثة</option>
                      <option value="4">السنة الرابعة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-700 dark:text-teal-300 mb-1.5">
                      الفصل الدراسي (السمستر):
                    </label>
                    <select
                      value={quickSubSemester}
                      onChange={(e) => setQuickSubSemester(e.target.value as '1' | '2' | 'both')}
                      className="w-full px-3 py-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-black focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1">🌱 سمستر 1 (الترم الأول)</option>
                      <option value="2">⚡ سمستر 2 (الترم الثاني)</option>
                      <option value="both">🔄 الترمين معاً (1 و 2)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المادة بالإنجليزي / رابط المادة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={quickSubEnglishTitle}
                    onChange={(e) => setQuickSubEnglishTitle(e.target.value)}
                    placeholder="مثال: Biochemistry / med-surg"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    وصف مختصر للمادة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={quickSubDesc}
                    onChange={(e) => setQuickSubDesc(e.target.value)}
                    placeholder="مثال: محاضرات وملخصات معتمدة لمنهج التمريض"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {quickSubFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      quickSubFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300'
                    }`}
                  >
                    {quickSubFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{quickSubFeedback.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddSubOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuickSub || !quickSubTitle.trim()}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-teal-600/20 disabled:opacity-50"
                  >
                    {isSubmittingQuickSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>إضافة المادة واختيارها فوراً 🚀</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Screen Student Preview Modal */}
        {showMaintenancePreviewModal && (
          <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30 font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>محاكاة حية لشاشة الطالب أثناء القفل</span>
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  هذا هو بالضبط ما يراه أي طالب أو زائر يدخل المنصة وهي مغلقة
                </span>
              </div>
              <button
                onClick={() => setShowMaintenancePreviewModal(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                إغلاق المعاينة ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MaintenanceScreen
                config={{
                  isEnabled: true,
                  title: maintenanceTitle,
                  message: maintenanceMessage,
                  estimatedReturn: maintenanceEstimatedReturn,
                  contactWhatsapp: maintenanceWhatsapp,
                  updatedAt: new Date().toISOString(),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
