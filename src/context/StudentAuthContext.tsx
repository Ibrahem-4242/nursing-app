'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentUser } from '@/lib/types';

interface StudentAuthContextType {
  student: StudentUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (phone: string, pass: string) => Promise<{ success: boolean; message: string }>;
  register: (phone: string, name: string, university: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
  isLecturePurchased: (lectureId: string) => boolean;
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
      return { success: false, message: data?.message || 'فشل تسجيل الدخول' };
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

  const isLecturePurchased = useCallback(
    (lectureId: string) => {
      if (!student) return false;
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
