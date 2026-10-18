'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentUser } from '@/lib/types';

interface StudentAuthContextType {
  student: StudentUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (phone: string, pass: string) => Promise<{
    success: boolean;
    message: string;
    locked?: boolean;
    lockedUntil?: number;
    remainingSeconds?: number;
  }>;
  register: (phone: string, name: string, university: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
  isLecturePurchased: (lectureId: string, yearId?: string) => boolean;
  hasShakibRakib: boolean;
  shakibRakibDaysRemaining: number;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('nursing_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('nursing_device_id', id);
    }
    return id;
  } catch {
    return 'dev_unknown';
  }
}

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshStudent = useCallback(async () => {
    try {
      const res = await fetch('/api/student/auth', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.sessionTerminated) {
        setStudent(null);
        alert(data.message || 'تم إنهاء الجلسة لأن حسابك فُتح من جهاز آخر 🔒');
        return;
      }
      if (data && data.success && data.loggedIn && data.student) {
        setStudent(data.student);
      } else {
        setStudent(null);
      }
    } catch (e) {
      console.warn('[StudentAuth] Check auth notice:', e);
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudent();
  }, [refreshStudent]);

  const login = async (phone: string, pass: string) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone, password: pass, deviceId }),
      });
      const data = await res.json();
      if (data && data.success && data.student) {
        setStudent(data.student);
        setIsAuthModalOpen(false);
        return { success: true, message: data.message };
      }
      return {
        success: false,
        message: data?.message || 'فشل تسجيل الدخول',
        locked: data?.locked,
        lockedUntil: data?.lockedUntil,
        remainingSeconds: data?.remainingSeconds,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في الاتصال' };
    }
  };

  const register = async (phone: string, name: string, university: string, pass: string) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', phone, name, university, password: pass, deviceId }),
      });
      const data = await res.json();
      if (data && data.success && data.student) {
        setStudent(data.student);
        setIsAuthModalOpen(false);
        return { success: true, message: data.message };
      }
      return { success: false, message: data?.message || 'فشل إنشاء الحساب' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في الاتصال' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {}
    setStudent(null);
  };

  const hasShakibRakib = Boolean(
    student?.shakibRakibSubscription?.isActive &&
      new Date(student.shakibRakibSubscription.expiresAt).getTime() > Date.now()
  );

  const shakibRakibDaysRemaining = student?.shakibRakibSubscription?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(student.shakibRakibSubscription.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const isLecturePurchased = useCallback(
    (lectureId: string, yearId?: string) => {
      if (!student) return false;
      // 1. Check Shakib Rakib monthly subscription
      if (student.shakibRakibSubscription?.isActive) {
        const expires = new Date(student.shakibRakibSubscription.expiresAt).getTime();
        if (expires > Date.now()) {
          const subYear = student.shakibRakibSubscription.yearId;
          if (!yearId || !subYear || subYear === 'all' || subYear === yearId) {
            return true;
          }
        }
      }
      // 2. Check individual lecture purchases
      return Array.isArray(student.purchasedLectureIds) && student.purchasedLectureIds.includes(lectureId);
    },
    [student]
  );

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        student,
        isLoading,
        isLoggedIn: !!student,
        login,
        register,
        logout,
        refreshStudent,
        isLecturePurchased,
        hasShakibRakib,
        shakibRakibDaysRemaining,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return ctx;
}
