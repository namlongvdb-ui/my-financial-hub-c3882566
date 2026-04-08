@echo off
chcp 65001 >nul

set PGPASSWORD=MatKhauManh123!
set BACKUP_DIR=C:\backup\finance
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Đang backup database...
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U finance_admin -h 127.0.0.1 -d tai_chinh_cong_doan -F c -f "%BACKUP_DIR%\finance_%TIMESTAMP%.backup"

if %errorlevel% equ 0 (
    echo ✅ Backup thành công: finance_%TIMESTAMP%.backup
) else (
    echo ❌ Backup thất bại!
)

:: Xóa backup cũ hơn 30 ngày
forfiles /p "%BACKUP_DIR%" /m *.backup /d -30 /c "cmd /c del @path" 2>nul
