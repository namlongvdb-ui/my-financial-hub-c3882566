@echo off
chcp 65001 >nul
title Cài đặt Hệ thống Tài chính Công đoàn

echo ============================================
echo   CÀI ĐẶT HỆ THỐNG TÀI CHÍNH CÔNG ĐOÀN
echo   Máy chủ: 10.24.16.77:3001
echo   Proxy: hn.proxy.vdb:8080
echo ============================================
echo.

:: Cấu hình proxy cho npm
echo [1/5] Cấu hình proxy mạng...
set HTTP_PROXY=http://hn.proxy.vdb:8080
set HTTPS_PROXY=http://hn.proxy.vdb:8080
set NO_PROXY=localhost,127.0.0.1,10.24.16.77
npm config set proxy http://hn.proxy.vdb:8080
npm config set https-proxy http://hn.proxy.vdb:8080
echo ✅ Đã cấu hình proxy

:: Kiểm tra Node.js
echo.
echo [2/5] Kiểm tra Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Chưa cài Node.js! Hãy tải và cài từ https://nodejs.org
    echo    Sau khi cài xong, chạy lại file này.
    pause
    exit /b 1
)
echo ✅ Node.js đã cài: 
node -v

:: Kiểm tra PostgreSQL
echo.
echo [3/5] Kiểm tra PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Không tìm thấy psql trong PATH.
    echo    Nếu đã cài PostgreSQL, hãy thêm đường dẫn vào PATH:
    echo    C:\Program Files\PostgreSQL\18\bin
    echo.
    echo    Hoặc bỏ qua nếu bạn sẽ tạo database thủ công.
) else (
    echo ✅ PostgreSQL đã cài:
    psql --version
)

:: Cài đặt dependencies cho backend
echo.
echo [4/5] Cài đặt dependencies backend...
cd /d "%~dp0"
npm install
if %errorlevel% neq 0 (
    echo ❌ Lỗi cài đặt dependencies backend!
    pause
    exit /b 1
)
echo ✅ Đã cài dependencies backend

:: Build frontend
echo.
echo [5/5] Build frontend...
cd /d "%~dp0.."
npm install
npm run build
if %errorlevel% neq 0 (
    echo ❌ Lỗi build frontend!
    pause
    exit /b 1
)
echo ✅ Đã build frontend vào thư mục dist/

echo.
echo ============================================
echo   CÀI ĐẶT HOÀN TẤT!
echo ============================================
echo.
echo Bước tiếp theo:
echo   1. Tạo database PostgreSQL (xem file HUONG_DAN.md)
echo   2. Sửa file backend_server\.env nếu cần
echo   3. Chạy file start.bat để khởi động
echo.
echo Hoặc tạo database bằng lệnh:
echo   psql -U postgres
echo   CREATE USER finance_admin WITH PASSWORD 'MatKhauManh123!';
echo   CREATE DATABASE union_finance ENCODING 'UTF8';
echo   GRANT ALL PRIVILEGES ON DATABASE union_finance TO finance_admin;
echo   \c union_finance
echo   \i %~dp0db/init.sql
echo.
pause
