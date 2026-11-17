# Cổng Thông Tin Việc Làm & Tuyển Dụng Trực Tuyến (Job Portal) — Nhóm 6 UTH

Đồ án học phần **Lập trình Website (Web Programming)** — Khoa Công Nghệ Thông Tin, Trường Đại học Giao thông vận tải TP.HCM (UTH).  
**Giảng viên hướng dẫn:** ThS. Trần Thịnh Mạnh Đức

---

## 1. Thành Viên Thực Hiện & Phân Công

| STT | Họ và Tên | Vai Trò / Phân Hệ |
| :---: | :--- | :--- |
| **1** | **Trần Hữu Thành** | Nhóm trưởng — Core System, Server, DB, Trang chủ (`home.routes.js`) |
| **2** | **Nguyễn Lê Gia Hân** | Module 1 — Tìm kiếm, Lọc đa tiêu chí & Danh sách việc làm (`jobs.routes.js`) |
| **3** | **Hồ Trúc Gia Hân** | Module 2 — Chi tiết việc làm & Nộp hồ sơ CV Transaction (`jobDetail.routes.js`) |
| **4** | **Nguyễn Phú Quang** | Module 3 — Không gian Ứng viên, Kho CV & Bảo mật tệp PDF (`candidate.routes.js`) |
| **5** | **Đinh Duy Diễn** | Module 4 — Không gian Nhà tuyển dụng & Quản lý tin đăng (`employer.routes.js`) |
| **6** | **Lê Hoàng Thiên Hương** | Module 5 — Xác thực đa vai trò, OTP & Bảng điều khiển Admin (`authAdmin.routes.js`) |

---

## 2. Công Nghệ Sử Dụng
- **Frontend:** HTML5, CSS3 (chuẩn hóa theo [QTTK.html](./QTTK.html)), Vanilla JavaScript ES6+ (`api.js`).
- **Backend:** Node.js + Express (`mysql2/promise`, `jsonwebtoken`, `bcryptjs`, `multer`, `nodemailer`).
- **Cơ sở dữ liệu:** MySQL 8.0+ / 9.x (`job_portal_db`, 10 bảng chuẩn 3NF trong [database/schema.sql](./database/schema.sql)).

---

## 3. Hướng Dẫn Cài Đặt & Chạy Dự Án (3 Bước)

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
```bash
cd database
mysql -u root -p < init.sql
```

### Bước 2: Cấu hình và khởi chạy Backend Server
```bash
cd ../backend
cp .env.example .env
# Mở .env chỉnh DB_PASSWORD và đặt PORT=5001 (tránh xung đột AirPlay cổng 5000 trên macOS)
npm install
npm run dev
```

### Bước 3: Truy cập Hệ thống
- **Trang chủ Website:** `http://localhost:5001/index.html`
- **Trang Tra cứu Việc làm:** `http://localhost:5001/jobs.html`
- **Kiểm tra API Healthcheck:** `http://localhost:5001/api/v1/health`

---

## 4. Tài Khoản Mẫu Kiểm Thử (Mật khẩu chung: `123456`)
- **Admin:** `admin@jobportal.vn`
- **Nhà tuyển dụng (VNG HR):** `hr@vng.com.vn`
- **Ứng viên (Sinh viên UTH):** `thanh.tran@student.ut.edu.vn` hoặc `quang.nguyen@student.ut.edu.vn`
