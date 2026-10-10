import { NextRequest, NextResponse } from 'next/server';
import { notifyComplaint, getArabicFormattedDate } from '@/lib/telegram';
import { CmsService } from '@/lib/cms-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, year, type, message } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مطلوب لتتمكن الإدارة من التواصل معك' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'يرجى كتابة نص الشكوى أو الملاحظة بالتفصيل' },
        { status: 400 }
      );
    }

    const time = getArabicFormattedDate();
    const studentName = (name && name.trim()) || 'طالب تمريض';
    const studentPhone = phone.trim();
    const studentYear = (year && year.trim()) || 'السنة الأولى';
    const complaintType = (type && type.trim()) || 'شكوى أو استفسار';
    const complaintMessage = message.trim();

    // 1. Save in CMS store
    const complaintRecord = await CmsService.addComplaint({
      name: studentName,
      phone: studentPhone,
      year: studentYear,
      type: complaintType,
      message: complaintMessage,
    });

    // 2. Send Realtime Telegram Notification to admin bot
    await notifyComplaint({
      name: studentName,
      phone: studentPhone,
      year: studentYear,
      type: complaintType,
      message: complaintMessage,
      time,
    });

    return NextResponse.json({
      success: true,
      complaint: complaintRecord,
      message: 'تم إرسال شكواك بنجاح! وصل إشعار فوري برقم هاتفك للإدارة عبر تيليجرام وسنتواصل معك قريباً 🩺',
    });
  } catch (err) {
    console.error('[Contact/Complaint API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم أثناء إرسال الشكوى' },
      { status: 500 }
    );
  }
}
