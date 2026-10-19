import { NextResponse } from 'next/server';
import { PanicEngine } from '@/lib/panic-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const panicMode = await PanicEngine.getPanicMode();
    const isEnabled = Boolean(panicMode?.isEnabled);

    const res = NextResponse.json(
      { isEnabled, panicMode },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );

    if (isEnabled) {
      res.cookies.set('nursing_panic_mode', 'true', {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    } else {
      res.cookies.set('nursing_panic_mode', '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { isEnabled: false, error: err?.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
