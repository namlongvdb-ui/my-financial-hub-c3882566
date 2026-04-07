@echo off
chcp 65001 >nul
title Cài đặt Windows Service - Tài chính Công đoàn

echo ============================================
echo   CÀI ĐẶT CHƯƠNG TRÌNH NHƯ WINDOWS SERVICE
echo   (Tự khởi động cùng Windows)
echo ============================================
echo.

:: Kiểm tra quyền Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Cần chạy với quyền Administrator!
    echo    Click chuột phải → Run as administrator
    pause
    exit /b 1
)

:: Kiểm tra NSSM
if not exist "C:\nssm\nssm.exe" (
    echo ❌ Chưa cài NSSM!
    echo    1. Tải từ: https://nssm.cc/download
    echo    2. Giải nén nssm.exe vào C:\nssm\
    echo    3. Chạy lại file này
    pause
    exit /b 1
)

echo Đang cài đặt service FinanceServer...
echo.

:: Xóa service cũ nếu có
C:\nssm\nssm.exe stop FinanceServer >nul 2>&1
C:\nssm\nssm.exe remove FinanceServer confirm >nul 2>&1

:: Lấy đường dẫn Node.js
for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i

:: Cài service mới
C:\nssm\nssm.exe install FinanceServer "%NODE_PATH%" "server.js"
C:\nssm\nssm.exe set FinanceServer AppDirectory "%~dp0"
C:\nssm\nssm.exe set FinanceServer AppEnvironmentExtra "NODE_ENV=production" "HTTP_PROXY=http://hn.proxy.vdb:8080" "HTTPS_PROXY=http://hn.proxy.vdb:8080" "NO_PROXY=localhost,127.0.0.1,10.24.16.77"
C:\nssm\nssm.exe set FinanceServer DisplayName "Finance Server - Tai chinh Cong doan"
C:\nssm\nssm.exe set FinanceServer Description "He thong quan ly tai chinh cong doan - Port 3001"
C:\nssm\nssm.exe set FinanceServer Start SERVICE_AUTO_START
C:\nssm\nssm.exe set FinanceServer AppStdout "%~dp0logs\service.log"
C:\nssm\nssm.exe set FinanceServer AppStderr "%~dp0logs\error.log"
C:\nssm\nssm.exe set FinanceServer AppRotateFiles 1
C:\nssm\nssm.exe set FinanceServer AppRotateBytes 5242880

:: Tạo thư mục logs
if not exist "%~dp0logs" mkdir "%~dp0logs"

:: Khởi động service
C:\nssm\nssm.exe start FinanceServer

echo.
echo ============================================
echo   ✅ ĐÃ CÀI SERVICE THÀNH CÔNG!
echo ============================================
echo.
echo Service: FinanceServer
echo Trạng thái: Đang chạy
echo Tự khởi động: Có (cùng Windows)
echo.
echo Truy cập: http://10.24.16.77:3001
echo.
echo Quản lý service:
echo   Khởi động:  C:\nssm\nssm.exe start FinanceServer
echo   Dừng:       C:\nssm\nssm.exe stop FinanceServer
echo   Trạng thái: C:\nssm\nssm.exe status FinanceServer
echo   Gỡ bỏ:     C:\nssm\nssm.exe remove FinanceServer confirm
echo.
pause
