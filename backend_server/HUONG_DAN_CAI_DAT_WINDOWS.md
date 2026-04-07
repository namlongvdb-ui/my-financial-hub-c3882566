# ============================================
# HƯỚNG DẪN CÀI ĐẶT TRÊN WINDOWS
# Hệ thống Quản lý Tài chính Công đoàn
# ============================================

## KIẾN TRÚC HỆ THỐNG

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Cao Bằng      │     │   MÁY CHỦ WINDOWS   │     │              │
│   10.24.x.x     │────▶│   10.24.16.77       │────▶│ PostgreSQL   │
├─────────────────┤     │                     │     │   18         │
│   Bắc Giang     │     │   Node.js API       │     │ (localhost)  │
│   10.42.x.x     │────▶│   Port: 3001        │     │              │
├─────────────────┤     │                     │     └──────────────┘
│   Lạng Sơn      │     │   Nginx (tùy chọn)  │
│   10.30.x.x     │────▶│   Port: 80          │
├─────────────────┤     │                     │
│   Bắc Ninh      │     │                     │
│   10.44.x.x     │────▶│                     │
└─────────────────┘     └─────────────────────┘
```

---

## PHẦN 1: CÀI ĐẶT TRÊN MÁY CHỦ (10.24.16.77)

### 1.1 Cài đặt PostgreSQL 18

1. Tải PostgreSQL 18 cho Windows tại:
   ```
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   ```

2. Chạy file cài đặt (`postgresql-18-windows-x64.exe`):
   - Chọn thư mục cài đặt: `C:\Program Files\PostgreSQL\18`
   - Chọn thư mục dữ liệu: `C:\Program Files\PostgreSQL\18\data`
   - Đặt mật khẩu cho user `postgres` (ghi nhớ mật khẩu này!)
   - Port: `5432` (mặc định)
   - Locale: `Vietnamese, Viet Nam` hoặc `Default`
   - **Bỏ chọn** Stack Builder khi được hỏi

3. Thêm PostgreSQL vào PATH:
   - Mở **System Properties** → **Environment Variables**
   - Trong **System variables**, tìm `Path` → **Edit**
   - Thêm: `C:\Program Files\PostgreSQL\18\bin`
   - Nhấn **OK** để lưu

4. Kiểm tra cài đặt (mở **Command Prompt** hoặc **PowerShell**):
   ```cmd
   psql --version
   ```

### 1.2 Cấu hình PostgreSQL cho phép kết nối

Mở file `C:\Program Files\PostgreSQL\18\data\postgresql.conf` bằng Notepad (Run as Administrator):
```
listen_addresses = '0.0.0.0'
port = 5432
max_connections = 100
```

Mở file `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`, thêm dòng:
```
# Cho phép kết nối từ localhost
host    all    all    127.0.0.1/32    scram-sha-256
```

Khởi động lại PostgreSQL service:
```cmd
net stop postgresql-x64-18
net start postgresql-x64-18
```

### 1.3 Tạo Database

Mở **Command Prompt** (Run as Administrator):
```cmd
psql -U postgres

CREATE USER finance_admin WITH PASSWORD 'MatKhauManh123!';
CREATE DATABASE union_finance ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE union_finance TO finance_admin;
\c union_finance
\i C:/path/to/backend_server/db/init.sql
\q
```

> **Lưu ý:** Trong PostgreSQL trên Windows, dùng dấu `/` thay vì `\` cho đường dẫn file.

---

### 1.4 Cài đặt Node.js

1. Tải Node.js LTS (v20.x) tại:
   ```
   https://nodejs.org/en/download/
   ```

2. Chạy file cài đặt (`node-v20.x.x-x64.msi`):
   - Chọn tất cả mặc định
   - **Tick chọn** "Automatically install the necessary tools" nếu được hỏi

3. Kiểm tra (mở **Command Prompt** mới):
   ```cmd
   node -v
   npm -v
   ```

---

### 1.5 Cài đặt Backend Server

1. Sao chép thư mục project vào máy chủ, ví dụ: `C:\finance-app`

2. Mở **Command Prompt**, di chuyển đến thư mục backend:
   ```cmd
   cd C:\finance-app\backend_server
   ```

3. Tạo file `.env` từ file mẫu:
   ```cmd
   copy .env.example .env
   ```

4. Sửa file `.env` bằng Notepad:
   ```cmd
   notepad .env
   ```

   Nội dung file `.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=union_finance
   DB_USER=finance_admin
   DB_PASSWORD=MatKhauManh123!
   JWT_SECRET=chuoi-bi-mat-rat-dai-va-ngau-nhien-thay-doi-cai-nay
   PORT=3001
   HOST=0.0.0.0
   ALLOWED_ORIGINS=http://10.24.16.77,http://10.24.16.77:5173,http://localhost:5173
   ```

5. Cài đặt dependencies:
   ```cmd
   npm install
   ```

6. Chạy thử:
   ```cmd
   npm start
   ```
   Nếu thấy `Server running on http://0.0.0.0:3001` là thành công!

---

### 1.6 Chạy Backend như Windows Service

Để backend tự khởi động cùng Windows, dùng **NSSM** (Non-Sucking Service Manager):

1. Tải NSSM tại: https://nssm.cc/download
2. Giải nén, copy `nssm.exe` vào `C:\nssm\`
3. Mở **Command Prompt** (Run as Administrator):

```cmd
C:\nssm\nssm.exe install FinanceAPI

```

4. Trong cửa sổ NSSM hiện ra, điền:
   - **Path:** `C:\Program Files\nodejs\node.exe`
   - **Startup directory:** `C:\finance-app\backend_server`
   - **Arguments:** `server.js`

5. Chuyển sang tab **Environment**, thêm:
   ```
   NODE_ENV=production
   ```

6. Nhấn **Install service**

7. Khởi động service:
   ```cmd
   C:\nssm\nssm.exe start FinanceAPI
   ```

**Các lệnh quản lý service:**
```cmd
:: Khởi động
C:\nssm\nssm.exe start FinanceAPI

:: Dừng
C:\nssm\nssm.exe stop FinanceAPI

:: Khởi động lại
C:\nssm\nssm.exe restart FinanceAPI

:: Xem trạng thái
C:\nssm\nssm.exe status FinanceAPI

:: Gỡ bỏ service
C:\nssm\nssm.exe remove FinanceAPI confirm
```

---

### 1.7 Build Frontend

1. Mở **Command Prompt**:
   ```cmd
   cd C:\finance-app
   npm install
   npm run build
   ```

2. Sau khi build xong, thư mục `dist` sẽ chứa file tĩnh.

---

### 1.8 Phục vụ Frontend (2 cách)

#### Cách 1: Dùng Node.js serve (đơn giản)

```cmd
npm install -g serve
serve -s dist -l 80
```

Hoặc tạo service với NSSM:
```cmd
C:\nssm\nssm.exe install FinanceFrontend
```
- **Path:** `C:\Users\<username>\AppData\Roaming\npm\serve.cmd`
- **Startup directory:** `C:\finance-app`
- **Arguments:** `-s dist -l 80`

#### Cách 2: Dùng Nginx (khuyến nghị)

1. Tải Nginx cho Windows: https://nginx.org/en/download.html
2. Giải nén vào `C:\nginx\`
3. Sửa file `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    server {
        listen       80;
        server_name  10.24.16.77;

        # Frontend
        root C:/finance-app/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API
        location /api/ {
            proxy_pass http://127.0.0.1:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 30s;
            proxy_read_timeout 60s;
        }
    }
}
```

4. Khởi động Nginx:
   ```cmd
   cd C:\nginx
   nginx.exe
   ```

5. Tạo service cho Nginx (tùy chọn):
   ```cmd
   C:\nssm\nssm.exe install NginxService
   ```
   - **Path:** `C:\nginx\nginx.exe`
   - **Startup directory:** `C:\nginx`

---

## PHẦN 2: CẤU HÌNH WINDOWS FIREWALL

Mở **Command Prompt** (Run as Administrator):

```cmd
:: Cho phép port 80 (HTTP - Nginx)
netsh advfirewall firewall add rule name="Finance HTTP" dir=in action=allow protocol=TCP localport=80

:: Cho phép port 3001 (API - nếu không dùng Nginx proxy)
netsh advfirewall firewall add rule name="Finance API" dir=in action=allow protocol=TCP localport=3001

:: KHÔNG mở port 5432 (PostgreSQL) ra ngoài!
```

Hoặc qua giao diện:
1. Mở **Windows Defender Firewall** → **Advanced Settings**
2. **Inbound Rules** → **New Rule**
3. Chọn **Port** → **TCP** → nhập `80` → **Allow** → đặt tên `Finance HTTP`

---

## PHẦN 3: TRUY CẬP TỪ MÁY TRẠM

Các máy trạm chỉ cần mở trình duyệt (Chrome, Edge, Firefox) và truy cập:

```
http://10.24.16.77
```

| Địa điểm   | Dải IP       | Truy cập               |
|------------|-------------|------------------------|
| Cao Bằng   | 10.24.x.x  | http://10.24.16.77     |
| Bắc Giang  | 10.42.x.x  | http://10.24.16.77     |
| Lạng Sơn   | 10.30.x.x  | http://10.24.16.77     |
| Bắc Ninh   | 10.44.x.x  | http://10.24.16.77     |

> **Không cần cài đặt gì trên máy trạm!** Chỉ cần trình duyệt web.

---

## PHẦN 4: THIẾT LẬP TÀI KHOẢN ADMIN

Sau khi cài đặt xong, tạo tài khoản admin đầu tiên.

### Cách 1: Dùng trình duyệt
Truy cập `http://10.24.16.77` và làm theo hướng dẫn trên màn hình.

### Cách 2: Dùng Command Prompt
```cmd
curl -X POST http://10.24.16.77:3001/api/setup-admin ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"admin\", \"password\": \"MatKhauAdmin123!\"}"
```

> **Lưu ý:** Trên Windows dùng `^` để xuống dòng (thay vì `\` trên Linux).

---

## PHẦN 5: BACKUP DATABASE

### Backup thủ công
```cmd
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U finance_admin union_finance > C:\backup\finance_%date:~-4%%date:~3,2%%date:~0,2%.sql
```

### Backup tự động (Task Scheduler)

1. Tạo file `C:\backup\backup.bat`:
   ```bat
   @echo off
   set PGPASSWORD=MatKhauManh123!
   set BACKUP_DIR=C:\backup
   set DATE=%date:~-4%%date:~3,2%%date:~0,2%

   if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

   "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U finance_admin -h 127.0.0.1 union_finance > "%BACKUP_DIR%\finance_%DATE%.sql"

   :: Xóa backup cũ hơn 30 ngày
   forfiles /p "%BACKUP_DIR%" /m *.sql /d -30 /c "cmd /c del @path" 2>nul

   echo Backup completed: %DATE%
   ```

2. Mở **Task Scheduler** (taskschd.msc):
   - **Create Basic Task** → Tên: `Finance DB Backup`
   - **Trigger:** Daily, lúc 02:00 AM
   - **Action:** Start a program → `C:\backup\backup.bat`
   - **Finish:** Tick "Open Properties" → chọn "Run whether user is logged on or not"

---

## PHẦN 6: KHẮC PHỤC SỰ CỐ

### Kiểm tra services đang chạy
```cmd
:: PostgreSQL
sc query postgresql-x64-18

:: Backend API
C:\nssm\nssm.exe status FinanceAPI

:: Nginx
tasklist | findstr nginx
```

### Kiểm tra kết nối
```cmd
:: Test API
curl http://10.24.16.77:3001/api/health

:: Test database
psql -U finance_admin -h 127.0.0.1 -d union_finance -c "SELECT 1"
```

### Xem log
```cmd
:: Log của NSSM service
C:\nssm\nssm.exe edit FinanceAPI
:: (chuyển tab I/O, xem Output/Error file path)

:: Log PostgreSQL
type "C:\Program Files\PostgreSQL\18\data\log\*.log"
```

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|-----|------------|----------------|
| Không kết nối được từ máy trạm | Firewall chặn | Mở port 80 trong Windows Firewall |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL chưa chạy | `net start postgresql-x64-18` |
| `ECONNREFUSED 127.0.0.1:3001` | Backend chưa chạy | `nssm start FinanceAPI` |
| Trang trắng khi truy cập | Frontend chưa build | `npm run build` trong thư mục gốc |
| `CORS error` | IP chưa được phép | Thêm IP vào `ALLOWED_ORIGINS` trong `.env` |

---

## PHẦN 7: CẬP NHẬT CHƯƠNG TRÌNH

Khi có phiên bản mới:

```cmd
:: 1. Dừng services
C:\nssm\nssm.exe stop FinanceAPI

:: 2. Cập nhật code (copy file mới vào C:\finance-app)

:: 3. Cài đặt lại dependencies
cd C:\finance-app
npm install
cd backend_server
npm install

:: 4. Build lại frontend
cd C:\finance-app
npm run build

:: 5. Chạy migration database nếu có
psql -U finance_admin -h 127.0.0.1 -d union_finance -f C:\finance-app\backend_server\db\migration_xxx.sql

:: 6. Khởi động lại
C:\nssm\nssm.exe start FinanceAPI
```
