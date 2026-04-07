@echo off
chcp 65001 >nul
title Finance Server - 10.24.16.77:3001

echo ============================================
echo   KHỞI ĐỘNG HỆ THỐNG TÀI CHÍNH CÔNG ĐOÀN
echo   http://10.24.16.77:3001
echo ============================================
echo.

:: Cấu hình proxy
set HTTP_PROXY=http://hn.proxy.vdb:8080
set HTTPS_PROXY=http://hn.proxy.vdb:8080
set NO_PROXY=localhost,127.0.0.1,10.24.16.77

cd /d "%~dp0"

echo Đang khởi động server...
echo Nhấn Ctrl+C để dừng.
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Server bị lỗi! Kiểm tra:
    echo   - PostgreSQL đã chạy chưa?
    echo   - File .env đã cấu hình đúng chưa?
    echo   - Đã chạy install.bat chưa?
    echo.
    pause
)
