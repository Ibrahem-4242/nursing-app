import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';
const TARGET_WEBHOOK_URL = 'https://www.nursingsum.live/api/telegram/webhook';

export async function GET() {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value ===
      'secret_session_5143545638_verified';
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch current webhook info
    const infoRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const info = await infoRes.json();

    // 2. If url does not match TARGET_WEBHOOK_URL, auto-fix it
    let updateResult = null;
    if (info.result?.url !== TARGET_WEBHOOK_URL) {
      const setRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(
          TARGET_WEBHOOK_URL
        )}`
      );
      updateResult = await setRes.json();
    }

    return NextResponse.json({
      success: true,
      targetWebhookUrl: TARGET_WEBHOOK_URL,
      currentWebhook: info.result,
      updated: updateResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cookieStore = cookies();
    const isAdmin =
      cookieStore.get('nursing_admin_token')?.value ===
      'secret_session_5143545638_verified';
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const setRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(
        TARGET_WEBHOOK_URL
      )}&drop_pending_updates=true`
    );
    const result = await setRes.json();

    return NextResponse.json({
      success: result.ok,
      targetWebhookUrl: TARGET_WEBHOOK_URL,
      telegramResponse: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
