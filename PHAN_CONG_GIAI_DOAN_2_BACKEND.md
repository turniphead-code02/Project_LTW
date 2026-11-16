# BẢNG PHÂN CÔNG NHIỆM VỤ GIAI ĐOẠN 2: BACKEND API & TÍCH HỢP CSDL MYSQL
**Dự án:** Cổng Thông Tin Việc Làm & Tuyển Dụng Trực Tuyến (Job Portal)  
**Đơn vị:** Nhóm 6 — Khoa Công Nghệ Thông Tin — Trường ĐH Giao Thông Vận Tải TP.HCM (UTH)  
**Học phần:** Lập trình Website (Web Programming) — **GVHD:** ThS. Trần Thịnh Mạnh Đức  
**Công nghệ sử dụng:** Node.js + Express (`mysql2/promise`, `jsonwebtoken`, `bcryptjs`, `multer`) + MySQL 8.0 (`job_portal_db`)

---

## 1. Cấu Trúc Thư Mục Backend Đã Khởi Tạo Trên `main`

Để **6 thành viên làm việc song song không bị xung đột Git (Zero Merge Conflict)**, Nhóm trưởng đã dựng sẵn khung `backend/` và tách riêng **6 file Route** tương ứng với đúng 6 thành viên:

```text
Project_LTW/
├── database/
│   ├── init.sql                       # Chạy 1 lệnh tạo đủ 10 bảng + nạp dữ liệu mẫu
│   ├── schema.sql                     # Thiết kế 10 bảng chuẩn 3NF (khớp ProjectLTW - Schema.pdf)
│   └── seed_data.sql                  # Dữ liệu mẫu (VNG, FPT, Viettel, MoMo, Shopee, KMS)
├── backend/
│   ├── package.json                   # Khai báo thư viện: express, mysql2, jsonwebtoken, bcryptjs, multer
│   ├── .env.example                   # Mẫu cấu hình kết nối MySQL (copy thành .env)
│   └── src/
│       ├── server.js                  # Khởi chạy Express Server (Port 5000) & gắn các nhánh API
│       ├── config/
│       │   └── db.js                  # Connection Pool kết nối MySQL (job_portal_db)
│       ├── middlewares/
│       │   ├── auth.middleware.js     # Kiểm tra JWT Token & phân quyền RBAC (candidate/employer/admin)
│       │   └── upload.middleware.js   # Kiểm tra file PDF <= 5MB & chữ ký nhị phân %PDF- chống RCE
│       ├── utils/
│       │   └── response.js            # Đóng gói JSON Envelope chuẩn ({ success, code, message, data, meta })
│       └── routes/                    # 👉 MỖI THÀNH VIÊN PHỤ TRÁCH 1 FILE RIÊNG BIỆT TẠI ĐÂY:
│           ├── home.routes.js         # [1] Trần Hữu Thành (044206000003)
│           ├── jobs.routes.js         # [2] Nguyễn Lê Gia Hân (052305001614)
│           ├── jobDetail.routes.js    # [3] Hồ Trúc Gia Hân (079306008116)
│           ├── candidate.routes.js    # [4] Nguyễn Phú Quang (036206029474)
│           ├── employer.routes.js     # [5] Đinh Duy Diễn (051206000952)
│           └── authAdmin.routes.js    # [6] Lê Hoàng Thiên Hương (042303000056)
└── job-portal/
    └── assets/js/
        └── api.js                     # Bộ hàm gọi API dùng chung (window.JobPortalAPI)
```

---

## 2. Phân Công Chi Tiết Cho 6 Thành Viên

### [1] Trần Hữu Thành — MSSV: `044206000003` (Nhóm Trưởng — Core System & Trang Chủ)
* **File Backend phụ trách:** `backend/src/server.js`, `backend/src/config/db.js`, `backend/src/middlewares/*`, `backend/src/routes/home.routes.js`
* **File Frontend phụ trách:** `job-portal/index.html`, `job-portal/assets/js/api.js`, `job-portal/assets/js/home.js`
* **Nhiệm vụ cụ thể:**
  1. Quản lý cấu hình kết nối MySQL (`db.js`), chuẩn hóa JSON Envelope (`response.js`), Middleware bảo mật JWT & kiểm tra chữ ký `%PDF-`.
  2. Hoàn thiện API `GET /api/v1/home/overview` trả về thống kê số lượng việc làm thật, danh mục ngành nghề kèm số lượng tin đang mở, 6 việc làm nổi bật mới nhất và 6 doanh nghiệp hàng đầu.
  3. Tích hợp `JobPortalAPI.get('/home/overview')` vào `job-portal/assets/js/home.js` để hiển thị dữ liệu động từ MySQL lên Trang chủ.

---

### [2] Nguyễn Lê Gia Hân — MSSV: `052305001614` (Module 1: Tìm Kiếm, Lọc Đa Tiêu Chí & Danh Sách Việc Làm)
* **File Backend phụ trách:** `backend/src/routes/jobs.routes.js`
* **File Frontend phụ trách:** `job-portal/jobs.html`, `job-portal/assets/js/jobs.js`
* **Bảng CSDL thao tác:** `jobs`, `companies`, `categories`, `locations`, `skills`, `job_skills`
* **Nhiệm vụ cụ thể:**
  1. Hoàn thiện API `GET /api/v1/jobs/filters`: Trả về danh sách Tỉnh/Thành phố (`locations`), Ngành nghề (`categories`) và Kỹ năng (`skills`) từ MySQL.
  2. Hoàn thiện API `GET /api/v1/jobs`: Xử lý tìm kiếm theo từ khóa (`keyword`), lọc theo `category_id`, `location_id`, `employment_type`, `experience_level`, khoảng lương (`salary_min`, `salary_max`), sắp xếp (`newest`, `salary_desc`) và phân trang (`page`, `pageSize`). Chỉ lấy tin `status = 'approved' AND deadline >= CURDATE()`.
  3. Cập nhật `job-portal/assets/js/jobs.js`: Gọi API `/api/v1/jobs` khi người dùng lọc hoặc chuyển trang (có fallback về dữ liệu mẫu nếu chưa bật MySQL để trang không bao giờ bị trắng).

---

### [3] Hồ Trúc Gia Hân — MSSV: `079306008116` (Module 2: Chi Tiết Việc Làm & Luồng Nộp Đơn Ứng Tuyển)
* **File Backend phụ trách:** `backend/src/routes/jobDetail.routes.js`
* **File Frontend phụ trách:** `job-portal/job-detail.html`, `job-portal/assets/js/job-detail.js`
* **Bảng CSDL thao tác:** `jobs`, `companies`, `locations`, `categories`, `job_skills`, `skills`, `applications`, `resumes`
* **Nhiệm vụ cụ thể:**
  1. Hoàn thiện API `GET /api/v1/job-detail/:id`: Truy vấn chi tiết công việc theo `job_id` hoặc `slug` (JOIN với `companies`, `locations`, `categories`), lấy mảng kỹ năng yêu cầu từ `job_skills` và 3 việc làm tương tự cùng ngành nghề.
  2. Hoàn thiện API `POST /api/v1/job-detail/:id/apply`: Nhận hồ sơ ứng tuyển từ ứng viên, thẩm định file PDF bằng `validatePdfMagicBytes` (`%PDF-`), lưu bản chụp bất biến vào cột `resume_snapshot_url` của bảng `applications` và bắt lỗi trùng lặp `ER_DUP_ENTRY` (chống nộp 2 lần cho cùng 1 công việc).
  3. Cập nhật `job-portal/assets/js/job-detail.js`: Đọc `?id=` trên URL để gọi `GET /api/v1/job-detail/:id` và gửi form ứng tuyển qua `POST /api/v1/job-detail/:id/apply`.

---

### [4] Nguyễn Phú Quang — MSSV: `036206029474` (Module 3: Không Gian Ứng Viên & Quản Lý Hồ Sơ CV)
* **File Backend phụ trách:** `backend/src/routes/candidate.routes.js`
* **File Frontend phụ trách:** `job-portal/candidate-dashboard.html`, `job-portal/my-applications.html`, `job-portal/saved-jobs.html`, `job-portal/assets/js/candidate.js`, `job-portal/assets/js/my-applications.js`, `job-portal/assets/js/saved-jobs.js`
* **Bảng CSDL thao tác:** `users`, `resumes`, `applications`, `saved_jobs`, `jobs`, `companies`
* **Nhiệm vụ cụ thể:**
  1. Hoàn thiện nhóm API Quản lý kho CV (`/api/v1/candidate/resumes`): Lấy danh sách CV, tải lên CV PDF mới, đặt CV mặc định (`PATCH /resumes/:id/default` sử dụng Transaction đảm bảo cột ảo `default_user_id` trong MySQL không bị xung đột), xóa CV.
  2. Hoàn thiện nhóm API Đơn ứng tuyển (`/api/v1/candidate/applications`): Lấy danh sách việc làm đã ứng tuyển kèm trạng thái 4 bước (`pending` -> `viewed` -> `interview` -> `accepted`/`rejected`) và rút đơn ứng tuyển.
  3. Hoàn thiện nhóm API Việc làm đã lưu (`/api/v1/candidate/saved-jobs`): Xem danh sách lưu, thêm lưu mới và bỏ lưu.
  4. Kết nối 3 file JS (`candidate.js`, `my-applications.js`, `saved-jobs.js`) với các API trên.

---

### [5] Đinh Duy Diễn — MSSV: `051206000952` (Module 4: Không Gian Nhà Tuyển Dụng & Quản Lý Tin Đăng)
* **File Backend phụ trách:** `backend/src/routes/employer.routes.js`
* **File Frontend phụ trách:** `job-portal/employer-dashboard.html`, `job-portal/post-job.html`, `job-portal/candidate-management.html`, `job-portal/assets/js/employer-table.js`
* **Bảng CSDL thao tác:** `companies`, `jobs`, `applications`, `users`, `categories`, `locations`
* **Nhiệm vụ cụ thể:**
  1. Hoàn thiện API `GET /api/v1/employer/dashboard`: Thống kê KPI của doanh nghiệp (số tin đang chạy, tổng CV nhận được, số lịch phỏng vấn), danh sách tin tuyển dụng của công ty và danh sách ứng viên nộp hồ sơ.
  2. Hoàn thiện API `POST /api/v1/employer/jobs`: Cho phép HR đăng tin tuyển dụng mới (tự động sinh `slug` không dấu và đặt trạng thái mặc định `status = 'pending'` chờ Admin duyệt).
  3. Hoàn thiện API `PATCH /api/v1/employer/applications/:id/status`: Cho phép HR chuyển trạng thái hồ sơ ứng viên (`viewed`, `interview`, `accepted`, `rejected`) và tự động ghi nhận thời điểm `viewed_at`.
  4. Kết nối `job-portal/assets/js/employer-table.js` với 3 API trên.

---

### [6] Lê Hoàng Thiên Hương — MSSV: `042303000056` (Module 5: Xác Thực Đa Vai Trò & Bảng Điều Khiển Admin)
* **File Backend phụ trách:** `backend/src/routes/authAdmin.routes.js`
* **File Frontend phụ trách:** `job-portal/auth.html`, `job-portal/admin-portal.html`, `job-portal/assets/js/auth-validation.js`, `job-portal/assets/js/admin.js`, `job-portal/assets/js/account-nav.js`
* **Bảng CSDL thao tác:** `users`, `companies`, `jobs`
* **Nhiệm vụ cụ thể:**
  1. Hoàn thiện nhóm API Xác thực (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`): Băm mật khẩu bằng `bcryptjs`, kiểm tra đăng nhập với bảng `users` (hỗ trợ cả tài khoản mẫu trong `seed_data.sql` có mật khẩu `123456`), cấp JWT Access Token và trả về vai trò (`candidate`, `employer`, `admin`).
  2. Hoàn thiện nhóm API Quản trị viên (`/api/v1/admin/overview`, `PATCH /api/v1/admin/jobs/:id/status`, `PATCH /api/v1/admin/users/:id/status`): Duyệt hoặc từ chối bài đăng tuyển dụng (lưu `reject_reason`), mở hoặc khóa tài khoản người dùng/doanh nghiệp (`active` / `locked`).
  3. Kết nối `auth-validation.js` và `admin.js` để đăng nhập thật với MySQL và lưu token qua `window.JobPortalAPI.setAuthSession(token, user)`.

---

## 3. Hướng Dẫn Chạy Dự Án Dành Cho Tất Cả Thành Viên (3 Bước)

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
Mở MySQL (XAMPP / Laragon / MySQL Workbench / Docker) và chạy tệp khởi tạo:
```bash
mysql -u root -p < database/init.sql
```
*(Tệp này sẽ tự động tạo database `job_portal_db`, tạo đủ 10 bảng trong `schema.sql` và nạp sẵn dữ liệu mẫu trong `seed_data.sql`. Mật khẩu của mọi tài khoản mẫu là `123456`).*

### Bước 2: Cài đặt và chạy Backend Server
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Bước 3: Truy cập trên trình duyệt
* **Giao diện Website:** `http://localhost:5000/index.html`
* **Kiểm tra trạng thái API:** `http://localhost:5000/api/v1/health`
* **API Trang chủ:** `http://localhost:5000/api/v1/home/overview`
* **API Danh sách việc làm:** `http://localhost:5000/api/v1/jobs`
