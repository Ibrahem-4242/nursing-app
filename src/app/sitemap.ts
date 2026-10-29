import { MetadataRoute } from 'next';
import { CmsService } from '@/lib/cms-db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.nursingsum.live';

  // 1. Core static marketing & policy pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/year/1`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  try {
    const [lectures, subjects] = await Promise.all([
      CmsService.getAllLectures().catch(() => []),
      CmsService.getAllSubjects().catch(() => []),
    ]);

    const subjectRoutes: MetadataRoute.Sitemap = (subjects || []).map((sub) => ({
      url: `${baseUrl}/subject/${sub.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    const lectureRoutes: MetadataRoute.Sitemap = (lectures || []).map((lec) => ({
      url: `${baseUrl}/lecture/${lec.id}`,
      lastModified: lec.lastModified ? new Date(lec.lastModified) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...subjectRoutes, ...lectureRoutes];
  } catch (e) {
    console.warn('[Sitemap] Dynamic routes fallback:', e);
    return staticRoutes;
  }
}
