import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8276648021:AAGP3qGqwry8iFZLonT12jhzEFubhVeciIg';
const TARGET_WEBHOOK_URL = 'https://www.nursingsum.live/api/telegram/webhook';

export async function GET() {
  try {
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
