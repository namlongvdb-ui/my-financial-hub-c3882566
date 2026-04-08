@echo off
chcp 65001 >nul
title Tạo Database - Tài chính Công đoàn

echo ============================================
echo   TẠO CƠ SỞ DỮ LIỆU POSTGRESQL 18
echo ============================================
echo.

:: Kiểm tra psql
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Không tìm thấy psql! Hãy thêm PostgreSQL vào PATH:
    echo    C:\Program Files\PostgreSQL\18\bin
    pause
    exit /b 1
)

echo Nhập mật khẩu của user 'postgres' khi được hỏi.
echo.

:: Tạo user và database
echo [1/3] Tạo user finance_admin...
psql -U postgres -c "CREATE USER finance_admin WITH PASSWORD 'MatKhauManh123!';"
if %errorlevel% neq 0 (
    echo ⚠️  User có thể đã tồn tại, tiếp tục...
)

echo.
echo [2/3] Tạo database tai_chinh_cong_doan...
psql -U postgres -c "CREATE DATABASE tai_chinh_cong_doan ENCODING 'UTF8';"
if %errorlevel% neq 0 (
    echo ⚠️  Database có thể đã tồn tại, tiếp tục...
)

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tai_chinh_cong_doan TO finance_admin;"

echo.
echo [3/3] Khởi tạo bảng dữ liệu...
psql -U finance_admin -d tai_chinh_cong_doan -f "%~dp0db\init.sql"
if %errorlevel% neq 0 (
    echo ❌ Lỗi khởi tạo bảng!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   ✅ TẠO DATABASE THÀNH CÔNG!
echo ============================================
echo.
echo Database: tai_chinh_cong_doan
echo User: finance_admin
echo.
echo Bây giờ chạy start.bat để khởi động server.
echo.
pause
