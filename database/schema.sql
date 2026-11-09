-- ============================================================================
-- DỰ ÁN: CỔNG THÔNG TIN VIỆC LÀM & TUYỂN DỤNG TRỰC TUYẾN (JOB PORTAL)
-- HỌC PHẦN: LẬP TRÌNH WEBSITE (WEB PROGRAMMING) — NHÓM 6 UTH
-- TÀI LIỆU CĂN CỨ: ProjectLTW - Schema.pdf & QTTK.html
-- RDBMS MỤC TIÊU: MySQL 8.0+ / MariaDB 10.5+ (Engine: InnoDB, Charset: utf8mb4)
-- ============================================================================

-- Thiết lập môi trường và cấu hình phiên làm việc chuẩn UTF-8
SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG (users)
-- Quản lý toàn bộ tài khoản trong hệ thống: Ứng viên, Nhà tuyển dụng, Admin
-- ============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã định danh người dùng duy nhất (PK tự động Unique)',
  `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ của người dùng',
  `email` VARCHAR(150) NOT NULL UNIQUE COMMENT 'Email đăng nhập và nhận thông báo hệ thống',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã băm bằng thuật toán bcrypt',
  `phone` VARCHAR(15) NULL DEFAULT NULL COMMENT 'Số điện thoại liên hệ (Chuẩn hóa định dạng +84 ở tầng ứng dụng)',
  `role` ENUM('candidate', 'employer', 'admin') NOT NULL DEFAULT 'candidate' COMMENT 'Phân quyền: Ứng viên, Nhà tuyển dụng, Quản trị viên',
  `status` ENUM('active', 'locked') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái tài khoản (active: Hoạt động, locked: Khóa)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đăng ký tài khoản',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật tài khoản lần cuối'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng người dùng và phân quyền hệ thống';

-- ============================================================================
-- 2. BẢNG TỈNH / THÀNH PHỐ (locations)
-- Danh mục chuẩn hóa địa điểm phục vụ bộ lọc đa tiêu chí chuẩn xác
-- ============================================================================
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `location_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã định danh Tỉnh/Thành phố (Bảng mới giúp lọc địa điểm chuẩn xác)',
  `location_name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên chuẩn Tỉnh/Thành phố (VD: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng)',
  `slug` VARCHAR(120) NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh chuẩn SEO cho Tỉnh/Thành phố (VD: tp-ho-chi-minh)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục chuẩn Tỉnh/Thành phố làm việc';

-- ============================================================================
-- 3. BẢNG DANH MỤC NGÀNH NGHỀ (categories)
-- Phân loại lĩnh vực việc làm chuyên môn (IT, Dữ liệu, UI/UX, SecOps, Cloud...)
-- ============================================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã danh mục ngành nghề',
  `category_name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên ngành nghề (VD: Công nghệ thông tin)',
  `slug` VARCHAR(150) NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh ngành nghề (VD: cong-nghe-thong-tin)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết nhóm ngành nghề'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục phân loại ngành nghề tuyển dụng';

-- ============================================================================
-- 4. BẢNG DOANH NGHIỆP / CÔNG TY (companies)
-- Thông tin pháp nhân và hồ sơ thương hiệu của Nhà tuyển dụng (Quan hệ 1-1 với users)
-- ============================================================================
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `company_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã định danh doanh nghiệp',
  `user_id` INT NOT NULL UNIQUE COMMENT 'Tài khoản HR sở hữu công ty (Quan hệ 1-1 với users, chặn xóa nhầm HR)',
  `company_name` VARCHAR(150) NOT NULL COMMENT 'Tên chính thức của công ty / doanh nghiệp',
  `slug` VARCHAR(200) NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh chuẩn SEO (VD: fpt-software)',
  `tax_code` VARCHAR(30) NULL DEFAULT NULL UNIQUE COMMENT 'Mã số thuế doanh nghiệp (Duy nhất nếu có nhập)',
  `logo_url` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Đường dẫn ảnh Logo công ty',
  `website` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Địa chỉ website chính thức của công ty',
  `address` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Địa chỉ trụ sở chính',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Bài viết giới thiệu quy mô, văn hóa công ty',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm khởi tạo hồ sơ công ty',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật hồ sơ công ty',
  CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hồ sơ thông tin doanh nghiệp tuyển dụng';

-- ============================================================================
-- 5. BẢNG TIN TUYỂN DỤNG (jobs)
-- Quản lý bài đăng tuyển dụng, hỗ trợ Full-Text Search và bộ lọc đa chiều
-- ============================================================================
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `job_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tin tuyển dụng',
  `company_id` INT NOT NULL COMMENT 'Công ty đăng tuyển (Xóa công ty thì xóa tin tuyển dụng)',
  `category_id` INT NOT NULL COMMENT 'Thuộc danh mục ngành nghề (Không cho xóa danh mục đang có tin)',
  `location_id` INT NOT NULL COMMENT 'Tỉnh/Thành phố làm việc (Thay thế cột VARCHAR tự do để lọc chuẩn)',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề công việc tuyển dụng (Đánh FULLTEXT INDEX cùng description)',
  `slug` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh tin tuyển dụng (VD: lap-trinh-vien-php-102)',
  `description` TEXT NOT NULL COMMENT 'Mô tả chi tiết công việc (Job Description - JD)',
  `requirements` TEXT NOT NULL COMMENT 'Yêu cầu kỹ năng, kinh nghiệm đối với ứng viên',
  `benefits` TEXT NULL DEFAULT NULL COMMENT 'Quyền lợi, chế độ đãi ngộ của công việc',
  `salary_min` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'Mức lương tối thiểu (Để NULL nếu là lương Thỏa thuận)',
  `salary_max` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'Mức lương tối đa (CHECK: salary_max >= salary_min)',
  `currency` ENUM('VND', 'USD') NOT NULL DEFAULT 'VND' COMMENT 'Đơn vị tiền tệ của mức lương (Mặc định ''VND'')',
  `employment_type` ENUM('full_time', 'part_time', 'internship', 'remote') NOT NULL DEFAULT 'full_time' COMMENT 'Hình thức làm việc',
  `experience_level` ENUM('intern', 'fresher', 'junior', 'middle', 'senior', 'lead') NOT NULL DEFAULT 'junior' COMMENT 'Cấp bậc kinh nghiệm yêu cầu (Hỗ trợ bộ lọc ứng viên)',
  `deadline` DATE NOT NULL COMMENT 'Hạn chót nộp hồ sơ (Kết hợp lọc deadline >= CURDATE() khi hiển thị)',
  `status` ENUM('pending', 'approved', 'rejected', 'closed') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái: Chờ duyệt, Đã duyệt, Từ chối, Đã đóng',
  `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Lý do Admin từ chối duyệt tin (Hiển thị cho HR khi status = ''rejected'')',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tin tuyển dụng',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật tin tuyển dụng',
  
  -- Ràng buộc toàn vẹn khóa ngoại
  CONSTRAINT `fk_jobs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_jobs_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Ràng buộc miền giá trị mức lương (CHECK Constraint)
  CONSTRAINT `chk_salary_range` CHECK (`salary_max` IS NULL OR `salary_min` IS NULL OR `salary_max` >= `salary_min`),
  
  -- Chỉ mục Full-Text Search phục vụ tìm kiếm từ khóa tốc độ cao
  FULLTEXT KEY `ft_jobs_search` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tin tuyển dụng việc làm';

-- ============================================================================
-- 6. BẢNG TỪ ĐIỂN KỸ NĂNG (skills)
-- Danh mục kỹ năng công nghệ chuẩn hóa (PHP, React, Node.js, Docker, Python...)
-- ============================================================================
DROP TABLE IF EXISTS `skills`;
CREATE TABLE `skills` (
  `skill_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã kỹ năng chuyên môn (Bảng từ điển kỹ năng/tag)',
  `skill_name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên kỹ năng (VD: PHP, ReactJS, MySQL, Tiếng Anh)',
  `slug` VARCHAR(120) NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh kỹ năng (VD: reactjs)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Từ điển kỹ năng chuyên môn';

-- ============================================================================
-- 7. BẢNG KỸ NĂNG THEO VIỆC LÀM (job_skills)
-- Bảng liên kết n-n giữa việc làm và kỹ năng yêu cầu (Composite Primary Key)
-- ============================================================================
DROP TABLE IF EXISTS `job_skills`;
CREATE TABLE `job_skills` (
  `job_id` INT NOT NULL COMMENT 'Tin tuyển dụng (Khóa chính phức hợp cùng skill_id)',
  `skill_id` INT NOT NULL COMMENT 'Kỹ năng yêu cầu (PRIMARY KEY (job_id, skill_id))',
  PRIMARY KEY (`job_id`, `skill_id`),
  CONSTRAINT `fk_job_skills_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_job_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng trung gian liên kết Kỹ năng cho từng việc làm';

-- ============================================================================
-- 8. BẢNG KHO HỒ SƠ CV CÁ NHÂN (resumes)
-- Lưu trữ các tệp CV của ứng viên, hỗ trợ cột ảo đảm bảo duy nhất 1 CV mặc định
-- ============================================================================
DROP TABLE IF EXISTS `resumes`;
CREATE TABLE `resumes` (
  `resume_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã CV trong kho lưu trữ cá nhân của ứng viên',
  `user_id` INT NOT NULL COMMENT 'Ứng viên sở hữu CV (Xóa ứng viên tự động xóa kho CV)',
  `resume_title` VARCHAR(150) NOT NULL COMMENT 'Tên gợi nhớ của CV (VD: CV Backend Developer 2026)',
  `file_url` VARCHAR(500) NOT NULL COMMENT 'Đường dẫn file PDF lưu trên máy chủ',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Đánh dấu CV mặc định (1: Mặc định, 0: Thường)',
  `default_user_id` INT GENERATED ALWAYS AS (IF(`is_default` = 1, `user_id`, NULL)) VIRTUAL COMMENT 'Cột ảo hỗ trợ UNIQUE đảm bảo mỗi ứng viên chỉ có tối đa 1 CV mặc định',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tải CV lên hệ thống',
  
  CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uq_default_resume_per_user` (`default_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kho lưu trữ CV cá nhân của ứng viên';

-- ============================================================================
-- 9. BẢNG ĐƠN ỨNG TUYỂN (applications)
-- Quản lý tiến trình nộp hồ sơ và lưu bản chụp bất biến (Immutable Snapshot)
-- ============================================================================
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `application_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã đơn ứng tuyển',
  `job_id` INT NOT NULL COMMENT 'Tin tuyển dụng ứng tuyển (Kết hợp user_id làm Unique cặp)',
  `user_id` INT NOT NULL COMMENT 'Ứng viên nộp đơn (UNIQUE(job_id, user_id) chống nộp 2 lần)',
  `resume_id` INT NULL DEFAULT NULL COMMENT 'Tham chiếu CV gốc (ON DELETE SET NULL khi ứng viên xóa CV)',
  `resume_snapshot_url` VARCHAR(500) NOT NULL COMMENT 'Bản sao đường dẫn file PDF đóng băng tại thời điểm nộp',
  `cover_letter` TEXT NULL DEFAULT NULL COMMENT 'Tâm thư / Lời giới thiệu gửi nhà tuyển dụng',
  `status` ENUM('pending', 'viewed', 'interview', 'accepted', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Tiến trình: Đã nộp → Đã xem → Phỏng vấn → Kết quả',
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ứng viên bấm nộp hồ sơ',
  `viewed_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm Nhà tuyển dụng mở xem CV lần đầu tiên',
  
  -- Chống nộp trùng lặp 1 việc làm 2 lần
  UNIQUE KEY `uq_application_job_user` (`job_id`, `user_id`),
  
  CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`resume_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn ứng tuyển việc làm và tiến trình 4 bước';

-- ============================================================================
-- 10. BẢNG VIỆC LÀM ĐÃ LƯU (saved_jobs)
-- Quản lý danh sách việc làm yêu thích của ứng viên (Composite Primary Key)
-- ============================================================================
DROP TABLE IF EXISTS `saved_jobs`;
CREATE TABLE `saved_jobs` (
  `user_id` INT NOT NULL COMMENT 'Ứng viên bấm lưu tin (Khóa chính phức hợp cùng job_id, tự động Unique)',
  `job_id` INT NOT NULL COMMENT 'Tin tuyển dụng được lưu (PRIMARY KEY (user_id, job_id))',
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bấm lưu tin tuyển dụng',
  PRIMARY KEY (`user_id`, `job_id`),
  CONSTRAINT `fk_saved_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_jobs_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách việc làm đã lưu yêu thích của ứng viên';

-- Kích hoạt lại kiểm tra khóa ngoại sau khi khởi tạo toàn bộ bảng
SET foreign_key_checks = 1;
