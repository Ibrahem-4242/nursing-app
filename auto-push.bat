@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   🔄 تحديث ورفع التعديلات تلقائياً إلى GitHub و Vercel
echo ============================================================
set /p commit_msg="✍️ اكتب رسالة التعديل (أو اضغط Enter لرسالة تلقائية): "
if "%commit_msg%"=="" set commit_msg="Update nursing app codebase"
git add .
git commit -m "%commit_msg%"
git push origin main
echo.
echo ============================================================
echo   ✅ تم حفظ التعديلات ودفعها إلى GitHub بنجاح!
echo   Vercel سيقوم بتحديث الموقع مباشرة في ثوانٍ ⚡️
echo ============================================================
pause
