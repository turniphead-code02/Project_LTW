# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU — JOB PORTAL DATABASE
**Căn cứ thiết kế:** Chuẩn hóa 100% theo tài liệu đặc tả `ProjectLTW - Schema.pdf`  
**Học phần:** Lập trình Website (Web Programming) — Đồ án Cuối Khóa Nhóm 6 UTH  
**Hệ quản trị CSDL:** MySQL 8.0+ / MariaDB 10.5+ (Engine: InnoDB, Bảng mã: `utf8mb4_unicode_ci`)

---

## 1. Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    users ||--o| companies : "1-1 (user_id)"
    users ||--o{ resumes : "1-n (user_id)"
    users ||--o{ applications : "1-n (user_id)"
    users ||--o{ saved_jobs : "1-n (user_id)"
    
    locations ||--o{ jobs : "1-n (location_id)"
    categories ||--o{ jobs : "1-n (category_id)"
    companies ||--o{ jobs : "1-n (company_id)"
    
    jobs ||--|{ job_skills : "n-n (job_id)"
    skills ||--|{ job_skills : "n-n (skill_id)"
    
    jobs ||--o{ applications : "1-n (job_id)"
    resumes ||--o{ applications : "1-n (resume_id)"
    jobs ||--o{ saved_jobs : "1-n (job_id)"

    users {
        int user_id PK
        string full_name
        string email UK
        string password_hash
        string phone
        enum role
        enum status
        datetime created_at
        datetime updated_at
    }

    locations {
        int location_id PK
        string location_name UK
        string slug UK
    }

    categories {
        int category_id PK
        string category_name UK
        string slug UK
        text description
    }

    companies {
        int company_id PK
        int user_id FK,UK
        string company_name
        string slug UK
        string tax_code UK
        string logo_url
        string website
        string address
        text description
        datetime created_at
        datetime updated_at
    }

    jobs {
        int job_id PK
        int company_id FK
        int category_id FK
        int location_id FK
        string title
        string slug UK
        text description
        text requirements
        text benefits
        decimal salary_min
        decimal salary_max
        enum currency
        enum employment_type
        enum experience_level
        date deadline
        enum status
        string reject_reason
        datetime created_at
        datetime updated_at
    }

    skills {
        int skill_id PK
        string skill_name UK
        string slug UK
    }

    job_skills {
        int job_id PK,FK
        int skill_id PK,FK
    }

    resumes {
        int resume_id PK
        int user_id FK
        string resume_title
        string file_url
        tinyint is_default
        int default_user_id UK,VIRTUAL
        datetime created_at
    }

    applications {
        int application_id PK
        int job_id FK
        int user_id FK
        int resume_id FK
        string resume_snapshot_url
        text cover_letter
        enum status
        datetime applied_at
        datetime viewed_at
    }

    saved_jobs {
        int user_id PK,FK
        int job_id PK,FK
        datetime saved_at
    }
```

---

## 2. Danh Sách 10 Bảng Dữ Liệu & Giải Thích Chi Tiết

| STT | Tên Bảng | Khóa Chính (PK) | Mục Đích & Nghiệp Vụ Cốt Lõi |
| :---: | :--- | :--- | :--- |
| **1** | `users` | `user_id` (Auto) | Quản lý toàn bộ tài khoản (Ứng viên `candidate`, Nhà tuyển dụng `employer`, Quản trị viên `admin`). |
| **2** | `locations` | `location_id` (Auto) | Danh mục chuẩn Tỉnh/Thành phố phục vụ bộ lọc địa điểm chuẩn xác. |
| **3** | `categories` | `category_id` (Auto) | Danh mục ngành nghề IT (Lập trình, Dữ liệu & AI, UI/UX, An toàn thông tin, DevOps...). |
| **4** | `companies` | `company_id` (Auto) | Hồ sơ doanh nghiệp tuyển dụng. Liên kết 1-1 với tài khoản HR (`users.user_id`). |
| **5** | `jobs` | `job_id` (Auto) | Bài đăng tuyển dụng, hỗ trợ tìm kiếm toàn văn **Full-Text Search** và lọc đa tiêu chí. |
| **6** | `skills` | `skill_id` (Auto) | Bảng từ điển kỹ năng chuyên môn (ReactJS, Node.js, Python, Java, Docker...). |
| **7** | `job_skills` | `(job_id, skill_id)` | Bảng trung gian n-n liên kết kỹ năng yêu cầu cho từng bài đăng việc làm. |
| **8** | `resumes` | `resume_id` (Auto) | Kho lưu trữ các tệp CV cá nhân của ứng viên. |
| **9** | `applications` | `application_id` (Auto) | Quản lý đơn ứng tuyển, theo dõi tiến trình 4 bước và lưu **Bản chụp bất biến (Immutable Snapshot)**. |
| **10** | `saved_jobs` | `(user_id, job_id)` | Danh sách các tin tuyển dụng được ứng viên đánh dấu yêu thích (Bookmark). |

---

## 3. Các Điểm Sáng Kỹ Thuật (Architecture Highlights)

1. **Đảm bảo duy nhất 1 CV mặc định bằng Cột ảo (Generated Virtual Column):**
   ```sql
   `default_user_id` INT GENERATED ALWAYS AS (IF(`is_default` = 1, `user_id`, NULL)) VIRTUAL,
   UNIQUE KEY `uq_default_resume_per_user` (`default_user_id`)
   ```
   *Giải thích:* Trong MySQL, giá trị `NULL` không bị xung đột trong chỉ mục `UNIQUE`. Khi `is_default = 1`, cột ảo nhận giá trị `user_id`, ngăn chặn một người dùng có 2 CV cùng mang cờ mặc định ở cấp độ tầng CSDL (Database Engine Level).

2. **Chống nộp trùng lặp đơn ứng tuyển (Duplicate Application Prevention):**
   ```sql
   UNIQUE KEY `uq_application_job_user` (`job_id`, `user_id`)
   ```
   *Giải thích:* Ràng buộc cặp (`job_id`, `user_id`) triệt tiêu hoàn toàn rủi ro người dùng bấm nộp đơn nhiều lần cho cùng một vị trí.

3. **Cơ chế Bản chụp bất biến (Immutable Snapshot) cho Đơn Ứng Tuyển:**
   ```sql
   `resume_id` INT NULL DEFAULT NULL,
   `resume_snapshot_url` VARCHAR(500) NOT NULL,
   CONSTRAINT `fk_applications_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE SET NULL
   ```
   *Giải thích:* Khi ứng viên xóa CV gốc khỏi kho lưu trữ cá nhân, khóa ngoại tự động chuyển về `NULL` (`ON DELETE SET NULL`) nhưng liên kết `resume_snapshot_url` vẫn giữ nguyên tệp PDF lịch sử tại thời điểm nộp đơn, đảm bảo tính toàn vẹn hồ sơ cho doanh nghiệp xem xét.

4. **Tìm kiếm từ khóa tốc độ cao bằng Chỉ mục Full-Text Search:**
   ```sql
   FULLTEXT KEY `ft_jobs_search` (`title`, `description`)
   ```
   *Giải thích:* Cho phép truy vấn tìm kiếm tự nhiên:
   `SELECT * FROM jobs WHERE MATCH(title, description) AGAINST('React TypeScript' IN NATURAL LANGUAGE MODE);`

5. **Kiểm tra tính hợp lệ khoảng lương (Check Constraint):**
   ```sql
   CONSTRAINT `chk_salary_range` CHECK (`salary_max` IS NULL OR `salary_min` IS NULL OR `salary_max` >= `salary_min`)
   ```

---

## 4. Hướng Dẫn Cài Đặt & Nạp Dữ Liệu (How to Import)

### Cách 1: Nạp bằng dòng lệnh MySQL CLI (Khuyên dùng)
```bash
# Di chuyển vào thư mục database
cd database

# Chạy tệp khởi tạo toàn bộ CSDL và dữ liệu mẫu
mysql -u root -p < init.sql
```

### Cách 2: Nạp qua phpMyAdmin (XAMPP / Laragon / MAMP)
1. Mở trình duyệt truy cập `http://localhost/phpmyadmin`.
2. Tạo CSDL mới tên `job_portal_db` với bảng mã `utf8mb4_unicode_ci`.
3. Nhấp chọn CSDL `job_portal_db` -> Chọn tab **Import (Nhập)**.
4. Chọn tệp [`database/schema.sql`](file:///Users/sinhtran/Project_LTW/database/schema.sql) và bấm **Go (Thực hiện)**.
5. Lặp lại bước Import cho tệp [`database/seed_data.sql`](file:///Users/sinhtran/Project_LTW/database/seed_data.sql).

### Cách 3: Nạp nhanh bằng Docker MySQL
```bash
docker run --name jobportal-mysql -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=job_portal_db -p 3306:3306 -d mysql:8.0
docker exec -i jobportal-mysql mysql -uroot -psecret job_portal_db < database/schema.sql
docker exec -i jobportal-mysql mysql -uroot -psecret job_portal_db < database/seed_data.sql
```

---

## 5. Tài Khoản Đăng Nhập Mẫu Sẵn Có

Mật khẩu mặc định cho toàn bộ các tài khoản bên dưới là: **`123456`**

| Vai trò | Email đăng nhập | Tên người dùng / Đơn vị |
| :--- | :--- | :--- |
| **Quản trị viên** | `admin@jobportal.vn` | Quản Trị Viên Hệ Thống |
| **Nhà tuyển dụng** | `hr@vng.com.vn` | Trần Thị Mai Anh (VNG Corporation) |
| **Nhà tuyển dụng** | `recruitment@fpt.com` | Nguyễn Hoàng Khang (FPT Software) |
| **Nhà tuyển dụng** | `talent@viettelsolutions.vn` | Đoàn Thanh Tùng (Viettel Solutions) |
| **Nhà tuyển dụng** | `duong.le@mservice.com.vn` | Lê Thùy Dương (MoMo Fintech) |
| **Ứng viên IT** | `thanh.tran@student.ut.edu.vn` | Trần Hữu Thành (Lead Nhóm 6) |
| **Ứng viên IT** | `giahan.nguyen@student.ut.edu.vn` | Nguyễn Lê Gia Hân |
| **Ứng viên IT** | `giahan.ho@student.ut.edu.vn` | Hồ Trúc Gia Hân |
