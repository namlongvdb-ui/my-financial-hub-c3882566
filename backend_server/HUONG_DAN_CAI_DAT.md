# ============================================
# HƯỚNG DẪN CÀI ĐẶT VÀ CẤU HÌNH
# Hệ thống Quản lý Tài chính Công đoàn
# ============================================

## KIẾN TRÚC HỆ THỐNG

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Cao Bằng      │     │   MÁY CHỦ           │     │              │
│   10.24.x.x     │────▶│   10.24.16.77       │────▶│ PostgreSQL   │
├─────────────────┤     │                     │     │   18         │
│   Bắc Giang     │     │   Node.js API       │     │ (localhost)  │
│   10.42.x.x     │────▶│   Port: 3001        │     │              │
├─────────────────┤     │                     │     └──────────────┘
│   Lạng Sơn      │     │   Frontend (Vite)   │
│   10.30.x.x     │────▶│   Port: 5173        │
├─────────────────┤     │                     │
│   Bắc Ninh      │     │                     │
│   10.44.x.x     │────▶│                     │
└─────────────────┘     └─────────────────────┘
```

## 1. CÀI ĐẶT TRÊN MÁY CHỦ (10.24.16.77)

### 1.1 Cài đặt PostgreSQL 18
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-18

# CentOS/RHEL
sudo dnf install postgresql18-server
sudo postgresql-18-setup --initdb
sudo systemctl start postgresql-18
sudo systemctl enable postgresql-18
```

### 1.2 Cấu hình PostgreSQL cho phép kết nối WAN
Sửa file `postgresql.conf`:
```
listen_addresses = '0.0.0.0'
port = 5432
max_connections = 100
```

Sửa file `pg_hba.conf` (thêm các dòng sau):
```
# Cho phép kết nối từ localhost
host    all    all    127.0.0.1/32    scram-sha-256
# KHÔNG cho phép kết nối trực tiếp từ bên ngoài (chỉ qua API)
```

### 1.3 Tạo Database
```bash
sudo -u postgres psql

CREATE USER finance_admin WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE union_finance ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE union_finance TO finance_admin;
\c union_finance
# Chạy file init.sql
\i /path/to/backend_server/db/init.sql
```

### 1.4 Cài đặt Node.js
```bash
# Sử dụng NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Kiểm tra
node -v
npm -v
```

### 1.5 Cài đặt Backend
```bash
cd /opt/finance-app/backend_server
cp .env.example .env
# Sửa file .env với mật khẩu thực tế
nano .env

npm install
npm start
```

### 1.6 Chạy Backend như service (systemd)
```bash
sudo nano /etc/systemd/system/finance-api.service
```

Nội dung:
```ini
[Unit]
Description=Finance API Server
After=network.target postgresql.service

[Service]
Type=simple
User=finance
WorkingDirectory=/opt/finance-app/backend_server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable finance-api
sudo systemctl start finance-api
```

### 1.7 Build và phục vụ Frontend
```bash
cd /opt/finance-app
npm install
npm run build

# Cài nginx để phục vụ file tĩnh
sudo apt install nginx
```

Cấu hình nginx (`/etc/nginx/sites-available/finance`):
```nginx
server {
    listen 80;
    server_name 10.24.16.77;

    root /opt/finance-app/dist;
    index index.html;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/finance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 2. CẤU HÌNH FRONTEND

Sửa file `.env` của project frontend:
```env
VITE_API_URL=http://10.24.16.77:3001
```

Nếu dùng nginx proxy (khuyến nghị), đặt:
```env
VITE_API_URL=
```
(để trống, frontend sẽ gọi cùng domain, nginx sẽ proxy `/api/` đến backend)

## 3. TRUY CẬP TỪ CÁC MÁY TRẠM

Tất cả máy trạm chỉ cần mở trình duyệt và truy cập:
```
http://10.24.16.77
```

- Cao Bằng (10.24.x.x): http://10.24.16.77
- Bắc Giang (10.42.x.x): http://10.24.16.77
- Lạng Sơn (10.30.x.x): http://10.24.16.77
- Bắc Ninh (10.44.x.x): http://10.24.16.77

## 4. THIẾT LẬP TÀI KHOẢN ADMIN LẦN ĐẦU

Sau khi cài đặt, truy cập URL và tạo tài khoản admin đầu tiên.
Hoặc dùng curl:
```bash
curl -X POST http://10.24.16.77:3001/api/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YourPassword123"}'
```

## 5. FIREWALL

Mở port cần thiết:
```bash
sudo ufw allow 80/tcp    # Nginx (HTTP)
sudo ufw allow 3001/tcp  # API (nếu không dùng nginx proxy)
# KHÔNG mở port 5432 ra ngoài!
```

## 6. BACKUP DATABASE

```bash
# Backup hàng ngày
pg_dump -U finance_admin union_finance > /backup/finance_$(date +%Y%m%d).sql

# Crontab
0 2 * * * pg_dump -U finance_admin union_finance > /backup/finance_$(date +\%Y\%m\%d).sql
```
