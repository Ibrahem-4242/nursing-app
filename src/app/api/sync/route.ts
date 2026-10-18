import { NextResponse } from 'next/server';
import { DataService } from '@/lib/data-service';
import { BOT_CONFIG } from '@/lib/mock-data';
import { CmsService } from '@/lib/cms-db';

export async function GET() {
  try {
    const panicMode = await CmsService.getPanicMode();
    if (panicMode.isEnabled) {
      return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 });
    }

    const syncResult = await DataService.syncWithGoogleSheets();
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      syncResult,
      endpoint: BOT_CONFIG.appsScriptWebhookUrl,
      cachedYearsCount: DataService.getAcademicYears().length,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to sync with Google Apps Script' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Simulate updating or appending a new user or purchase request from Web App to Google Sheets
    return NextResponse.json({
      status: 'success',
      message: 'تم إرسال الطلب وحفظه في شيت البوت بنجاح',
      receivedData: body,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid payload' },
      { status: 400 }
    );
  }
}
