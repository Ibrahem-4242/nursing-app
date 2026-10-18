import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  requestHeaders.set('x-pathname', pathname);

  // Check if panic camouflage mode cookie is set
  const panicCookie = request.cookies.get('nursing_panic_mode')?.value;
  const isPanicActive = panicCookie === 'true';

  // Never redirect or rewrite admin, status, files, static assets, or store routes
  const isExcluded =
    pathname.startsWith('/admin-dashboard') ||
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/panic-status') ||
    pathname.startsWith('/store') ||
    pathname.startsWith('/product') ||
    pathname.startsWith('/api/files') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.');

  if (isPanicActive && !isExcluded) {
    // Rewrite all nursing paths directly to /store so the visitor sees Al-Khair Dairy Store
    const url = request.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
