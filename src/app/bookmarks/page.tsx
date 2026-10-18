import React from 'react';
import { Metadata } from 'next';
import { CmsService } from '@/lib/cms-db';
import BookmarksClientView from '@/components/BookmarksClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'محفوظاتي ليلة الامتحان 🔖 | منصة ملخصات تمريض',
  description: 'المراجعة السريعة المركزة ليلة الامتحان: بنكك الخاص لأهم المحاضرات، الأسئلة المعقدة، والتريكات السريرية.',
};

export default async function BookmarksPage() {
  const allLectures = await CmsService.getLiveLectures();
  return <BookmarksClientView allLectures={allLectures} />;
}
