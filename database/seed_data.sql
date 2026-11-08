-- ============================================================================
-- DỰ ÁN: CỔNG THÔNG TIN VIỆC LÀM & TUYỂN DỤNG TRỰC TUYẾN (JOB PORTAL)
-- HỌC PHẦN: LẬP TRÌNH WEBSITE (WEB PROGRAMMING) — NHÓM 6 UTH
-- TÀI LIỆU CĂN CỨ: ProjectLTW - Schema.pdf
-- TỆP DỮ LIỆU MẪU (SEED DATA SẴN SÀNG CHẠY NGHIỆP VỤ)
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;

-- ----------------------------------------------------------------------------
-- 1. NẠP DỮ LIỆU BẢNG: locations (Tỉnh / Thành phố trọng điểm)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `locations`;
INSERT INTO `locations` (`location_id`, `location_name`, `slug`) VALUES
(1, 'TP. Hồ Chí Minh', 'tp-ho-chi-minh'),
(2, 'Hà Nội', 'ha-noi'),
(3, 'Đà Nẵng', 'da-nang'),
(4, 'Cần Thơ', 'can-tho'),
(5, 'Hải Phòng', 'hai-phong'),
(6, 'Bình Dương', 'binh-duong'),
(7, 'Toàn quốc (Làm từ xa / Remote)', 'remote');

-- ----------------------------------------------------------------------------
-- 2. NẠP DỮ LIỆU BẢNG: categories (Danh mục ngành nghề IT & Công nghệ)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `categories`;
INSERT INTO `categories` (`category_id`, `category_name`, `slug`, `description`) VALUES
(1, 'Lập Trình & Phát Triển Phần Mềm', 'lap-trinh-phan-mem', 'Phát triển ứng dụng Web, Mobile, Desktop, Hệ thống phân tán và dịch vụ Microservices.'),
(2, 'Khoa Học Dữ Liệu & Trí Tuệ Nhân Tạo (AI/ML)', 'khoa-hoc-du-lieu-ai', 'Xây dựng mô hình Machine Learning, Deep Learning, Phân tích dữ liệu lớn và trực quan hóa Dashboard.'),
(3, 'Thiết Kế Trải Nghiệm & Giao Diện (UI/UX Design)', 'thiet-ke-ui-ux', 'Nghiên cứu hành vi người dùng, xây dựng Wireframe, Prototype và hệ thống Design System chuẩn mực.'),
(4, 'An Toàn Thông Tin & Giám Sát Bảo Mật (SecOps)', 'an-toan-thong-tin', 'Bảo vệ hệ thống hạ tầng mạng, ứng phó sự cố an ninh mạng, phân tích mã độc và kiểm thử xâm nhập.'),
(5, 'Hạ Tầng Điện Toán Đám Mây & DevOps', 'cloud-devops', 'Tự động hóa CI/CD, vận hành cụm Kubernetes/Docker và quản trị hạ tầng điện toán đám mây AWS/GCP/Azure.'),
(6, 'Kiểm Thử Phần Mềm & Đảm Bảo Chất Lượng (QA/QC)', 'kiem-thu-phan-mem-qa', 'Kiểm thử thủ công và tự động hóa phần mềm (Automation Testing), xây dựng Test Plan và quản lý lỗi.');

-- ----------------------------------------------------------------------------
-- 3. NẠP DỮ LIỆU BẢNG: skills (Từ điển kỹ năng công nghệ)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `skills`;
INSERT INTO `skills` (`skill_id`, `skill_name`, `slug`) VALUES
(1, 'ReactJS', 'reactjs'),
(2, 'Node.js', 'nodejs'),
(3, 'TypeScript', 'typescript'),
(4, 'Java', 'java'),
(5, 'Spring Boot', 'spring-boot'),
(6, 'Python', 'python'),
(7, 'SQL', 'sql'),
(8, 'PostgreSQL', 'postgresql'),
(9, 'Docker', 'docker'),
(10, 'Kubernetes', 'kubernetes'),
(11, 'AWS', 'aws'),
(12, 'Figma', 'figma'),
(13, 'TailwindCSS', 'tailwindcss'),
(14, 'NestJS', 'nestjs'),
(15, 'Redis', 'redis'),
(16, 'Power BI', 'power-bi'),
(17, 'Flutter', 'flutter'),
(18, 'C/C++', 'c-cpp'),
(19, '.NET Core', 'dotnet-core'),
(20, 'Manual Testing', 'manual-testing');

-- ----------------------------------------------------------------------------
-- 4. NẠP DỮ LIỆU BẢNG: users (Người dùng: Admin, Tuyển dụng, Ứng viên)
-- Mật khẩu băm mẫu là bcrypt cho chuỗi "123456" ($2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `users`;
INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `phone`, `role`, `status`, `created_at`) VALUES
-- Quản trị viên tối cao (Admin)
(1, 'Quản Trị Viên Hệ Thống', 'admin@jobportal.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0901234567', 'admin', 'active', NOW()),

-- Đại diện Nhà tuyển dụng (Employer HR)
(2, 'Trần Thị Mai Anh (VNG HR)', 'hr@vng.com.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0912345678', 'employer', 'active', NOW()),
(3, 'Nguyễn Hoàng Khang (FPT Software)', 'recruitment@fpt.com', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0923456789', 'employer', 'active', NOW()),
(4, 'Đoàn Thanh Tùng (Viettel Solutions)', 'talent@viettelsolutions.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0934567890', 'employer', 'active', NOW()),
(5, 'Lê Thùy Dương (MoMo HR)', 'duong.le@mservice.com.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0945678901', 'employer', 'active', NOW()),
(6, 'Phan Bích Ngọc (Shopee HR)', 'careers@shopee.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0956789012', 'employer', 'active', NOW()),
(7, 'Võ Quốc Bảo (KMS Technology)', 'recruiter@kms-technology.com', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0967890123', 'employer', 'active', NOW()),

-- Ứng viên tìm việc (Candidates)
(8, 'Trần Hữu Thành', 'thanh.tran@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0812345678', 'candidate', 'active', NOW()),
(9, 'Nguyễn Lê Gia Hân', 'giahan.nguyen@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0823456789', 'candidate', 'active', NOW()),
(10, 'Hồ Trúc Gia Hân', 'giahan.ho@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0834567890', 'candidate', 'active', NOW()),
(11, 'Nguyễn Phú Quang', 'quang.nguyen@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0845678901', 'candidate', 'active', NOW()),
(12, 'Đinh Duy Diện', 'dien.dinh@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0856789012', 'candidate', 'active', NOW()),
(13, 'Lê Hoàng Thiên Hương', 'thienhuong.le@student.ut.edu.vn', '$2y$10$eACCYoNOHEqgkPz9vjU0UeW5r.zB4a1W4GqXzD3Nl8q2V9Y2mE6mO', '0867890123', 'candidate', 'active', NOW());

-- ----------------------------------------------------------------------------
-- 5. NẠP DỮ LIỆU BẢNG: companies (Doanh nghiệp tuyển dụng hàng đầu)
-- Quan hệ 1-1 với các tài khoản HR ở bảng users
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `companies`;
INSERT INTO `companies` (`company_id`, `user_id`, `company_name`, `slug`, `tax_code`, `logo_url`, `website`, `address`, `description`, `created_at`) VALUES
(1, 2, 'Công Ty Cổ Phần Công Nghệ VNG', 'vng-corporation', '0303524225', 'https://vng.com.vn/assets/images/logo.png', 'https://vng.com.vn', 'VNG Campus, Đường số 13, KCX Tân Thuận, Quận 7, TP.HCM', 'VNG là kỳ lân công nghệ đầu tiên tại Việt Nam, sở hữu hệ sinh thái Zalo, Zing MP3, ZaloPay và các tựa game toàn cầu.', NOW()),
(2, 3, 'Công Ty TNHH Phần Mềm FPT (FPT Software)', 'fpt-software', '0101778163', 'https://fptsoftware.com/assets/images/fpt-logo.svg', 'https://fptsoftware.com', 'F-Town 3, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM', 'Công ty dịch vụ phần mềm và chuyển đổi số hàng đầu Đông Nam Á với hơn 30.000 cán bộ nhân viên toàn cầu.', NOW()),
(3, 4, 'Tổng Công Ty Giải Pháp Doanh Nghiệp Viettel', 'viettel-solutions', '0100109106-099', 'https://viettelsolutions.vn/logo.png', 'https://viettelsolutions.vn', 'Số 1 Giang Văn Minh, Ba Đình, Hà Nội', 'Đơn vị chủ lực của Tập đoàn Viettel trong việc triển khai Chính phủ số, Đô thị thông minh và chuyển đổi số.', NOW()),
(4, 5, 'Công Ty Cổ Phần Dịch Vụ Di Động Trực Tuyến (MoMo)', 'momo-fintech', '0305364967', 'https://momo.vn/favicon.ico', 'https://momo.vn', 'Tòa nhà Phú Mỹ Hưng, Tân Phú, Quận 7, TP.HCM', 'Siêu ứng dụng tài chính số 1 Việt Nam phục vụ thanh toán, chuyển tiền, tiết kiệm và đầu tư trực tuyến.', NOW()),
(5, 6, 'Công Ty TNHH Shopee Vietnam', 'shopee-vietnam', '0313339965', 'https://shopee.vn/favicon.ico', 'https://careers.shopee.vn', 'Tòa nhà Saigon Centre, 67 Lê Lợi, Quận 1, TP.HCM', 'Sàn thương mại điện tử dẫn đầu Đông Nam Á và Đài Loan.', NOW()),
(6, 7, 'Công Ty TNHH Phần Mềm KMS Technology', 'kms-technology', '0309139369', 'https://kms-technology.com/logo.png', 'https://kms-technology.com', 'Số 2 Tản Viên, Phường 2, Tân Bình, TP.HCM', 'Doanh nghiệp phát triển phần mềm và dịch vụ công nghệ tiêu chuẩn quốc tế có trụ sở tại Hoa Kỳ và Việt Nam.', NOW());

-- ----------------------------------------------------------------------------
-- 6. NẠP DỮ LIỆU BẢNG: jobs (Tin tuyển dụng chuẩn thực tế)
-- Khớp hoàn toàn với cơ sở dữ liệu trên frontend jobs.js & job-detail.js
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `jobs`;
INSERT INTO `jobs` (`job_id`, `company_id`, `category_id`, `location_id`, `title`, `slug`, `description`, `requirements`, `benefits`, `salary_min`, `salary_max`, `currency`, `employment_type`, `experience_level`, `deadline`, `status`, `created_at`) VALUES
(1, 1, 1, 1, 'Frontend React Developer (Junior / Middle)', 'frontend-react-developer-vng-01',
'Phát triển và tối ưu hóa giao diện ứng dụng Zalo Web và Zalo Mini App. Xây dựng giao diện Responsive chuẩn WCAG 2.1 AA.',
'Có từ 1 - 3 năm kinh nghiệm React, TypeScript, Redux Toolkit. Thành thạo HTML5 Semantic và CSS3 Flexbox/Grid.',
'Thu nhập 15 - 22 triệu + Lương tháng 13. MacBook Pro M3 mới 100%. Bảo hiểm VNG Care toàn diện. Phòng Gym & Hồ bơi miễn phí.',
15000000.00, 22000000.00, 'VND', 'full_time', 'junior', '2026-11-25', 'approved', NOW()),

(2, 2, 1, 1, 'Junior Backend Node.js / NestJS Engineer', 'junior-backend-nodejs-fpt-02',
'Xây dựng các RESTful API và Microservices hiệu năng cao phục vụ chuyển đổi số ngân hàng Nhật Bản và Bắc Mỹ.',
'Thành thạo Node.js, NestJS, TypeScript, PostgreSQL và Docker. Hiểu biết về Redis Caching và CI/CD cơ bản.',
'Mức lương 14 - 20 triệu/tháng. Xe đưa đón F-Town miễn phí. Cơ hội đi Onsite làm việc tại Nhật Bản hoặc Hoa Kỳ.',
14000000.00, 20000000.00, 'VND', 'full_time', 'junior', '2026-11-30', 'approved', NOW()),

(3, 3, 1, 2, 'Thực Tập Sinh Lập Trình Java / Spring Boot', 'thuc-tap-sinh-java-viettel-03',
'Chương trình đào tạo Viettel Digital Talent 2026. Trực tiếp tham gia phát triển phân hệ Smart City với Java Spring Boot.',
'Sinh viên năm 3, năm 4 hoặc mới tốt nghiệp khối ngành CNTT. GPA từ 2.8/4.0 trở lên. Nắm vững Java OOP và SQL.',
'Phụ cấp thực tập 6 - 8 triệu/tháng. Cơ hội ký hợp đồng kỹ sư chính thức sau 3 tháng. Được Mentor cấp cao kèm cặp 1-1.',
6000000.00, 8000000.00, 'VND', 'internship', 'fresher', '2026-12-15', 'approved', NOW()),

(4, 4, 2, 1, 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)', 'chuyen-vien-data-analyst-momo-04',
'Khai phá dữ liệu hành vi người dùng trên siêu ứng dụng MoMo. Xây dựng Dashboard báo cáo quản trị tự động trên Power BI.',
'Có 1 - 3 năm kinh nghiệm SQL nâng cao, Python phân tích số liệu (Pandas, NumPy) và Power BI/Tableau.',
'Lương 16 - 24 triệu/tháng + Thưởng hiệu quả kinh doanh. Cơ hội nhận cổ phiếu ESOP ưu đãi. Môi trường Agile năng động.',
16000000.00, 24000000.00, 'VND', 'full_time', 'middle', '2026-11-20', 'approved', NOW()),

(5, 5, 3, 1, 'UI/UX Product Designer (Mobile & Web App)', 'ui-ux-product-designer-shopee-05',
'Thiết kế trải nghiệm người dùng luồng giỏ hàng và thanh toán trên ứng dụng Shopee. Duy trì bộ Design System chuyên nghiệp.',
'Ít nhất 2 năm kinh nghiệm thiết kế UI/UX trên Figma. Có Portfolio sản phẩm thực tế chứng minh tư duy thiết kế.',
'Thu nhập 18 - 28 triệu/tháng. Môi trường làm việc đa văn hóa quốc tế. Bữa ăn nhẹ và đồ uống miễn phí hàng ngày.',
18000000.00, 28000000.00, 'VND', 'full_time', 'middle', '2026-11-28', 'approved', NOW()),

(6, 6, 5, 3, 'DevOps & Cloud Engineer (AWS / Kubernetes)', 'devops-cloud-engineer-kms-06',
'Quản trị hạ tầng Cloud AWS quy mô lớn cho đối tác Mỹ. Tự động hóa triển khai phần mềm không gián đoạn (Zero Downtime).',
'Có từ 3 - 5 năm kinh nghiệm quản trị Linux, AWS, Kubernetes, Terraform và xây dựng pipeline CI/CD Jenkins/GitLab.',
'Lương 25 - 38 triệu/tháng. Xem xét tăng lương 2 lần/năm. Thưởng nóng các chứng chỉ quốc tế AWS Solutions Architect.',
25000000.00, 38000000.00, 'VND', 'full_time', 'senior', '2026-12-05', 'approved', NOW());

-- ----------------------------------------------------------------------------
-- 7. NẠP DỮ LIỆU BẢNG: job_skills (Gắn kỹ năng vào việc làm)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `job_skills`;
INSERT INTO `job_skills` (`job_id`, `skill_id`) VALUES
-- Job 1 (React Frontend VNG): ReactJS, TypeScript, TailwindCSS
(1, 1), (1, 3), (1, 13),
-- Job 2 (Node.js Backend FPT): Node.js, NestJS, PostgreSQL, Docker, Redis
(2, 2), (2, 8), (2, 9), (2, 14), (2, 15),
-- Job 3 (Java Intern Viettel): Java, Spring Boot, SQL
(3, 4), (3, 5), (3, 7),
-- Job 4 (Data Analyst MoMo): SQL, Python, Power BI
(4, 6), (4, 7), (4, 16),
-- Job 5 (UI/UX Shopee): Figma
(5, 12),
-- Job 6 (DevOps KMS): Docker, Kubernetes, AWS
(6, 9), (6, 10), (6, 11);

-- ----------------------------------------------------------------------------
-- 8. NẠP DỮ LIỆU BẢNG: resumes (Hồ sơ CV của ứng viên)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `resumes`;
INSERT INTO `resumes` (`resume_id`, `user_id`, `resume_title`, `file_url`, `is_default`, `created_at`) VALUES
(1, 8, 'CV Kỹ Sư Lập Trình Frontend — Trần Hữu Thành', 'https://jobportal.vn/uploads/cv/cv_thanh_frontend.pdf', 1, NOW()),
(2, 9, 'CV Thực Tập Sinh Lập Trình Web — Nguyễn Lê Gia Hân', 'https://jobportal.vn/uploads/cv/cv_giahan_web.pdf', 1, NOW()),
(3, 10, 'CV UI/UX & Frontend Designer — Hồ Trúc Gia Hân', 'https://jobportal.vn/uploads/cv/cv_truchan_uiux.pdf', 1, NOW()),
(4, 11, 'CV Kỹ Sư Backend Node.js — Nguyễn Phú Quang', 'https://jobportal.vn/uploads/cv/cv_quang_backend.pdf', 1, NOW()),
(5, 12, 'CV Data Analyst & BI — Đinh Duy Diện', 'https://jobportal.vn/uploads/cv/cv_dien_data.pdf', 1, NOW()),
(6, 13, 'CV An Toàn Thông Tin & SecOps — Lê Hoàng Thiên Hương', 'https://jobportal.vn/uploads/cv/cv_huong_secops.pdf', 1, NOW());

-- ----------------------------------------------------------------------------
-- 9. NẠP DỮ LIỆU BẢNG: applications (Đơn ứng tuyển mẫu có đủ các trạng thái)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `applications`;
INSERT INTO `applications` (`application_id`, `job_id`, `user_id`, `resume_id`, `resume_snapshot_url`, `cover_letter`, `status`, `applied_at`, `viewed_at`) VALUES
(1, 1, 8, 1, 'https://jobportal.vn/uploads/snapshots/app_01_snap.pdf', 'Em rất mong muốn được thử sức với môi trường công nghệ tại VNG Zalo Web.', 'interview', '2026-10-25 09:15:00', '2026-10-25 14:30:00'),
(2, 2, 11, 4, 'https://jobportal.vn/uploads/snapshots/app_02_snap.pdf', 'Em có nền tảng vững chắc về Node.js và NestJS, mong muốn đóng góp cho dự án FPT Software.', 'viewed', '2026-10-26 10:20:00', '2026-10-26 16:00:00'),
(3, 3, 9, 2, 'https://jobportal.vn/uploads/snapshots/app_03_snap.pdf', 'Em là sinh viên năm cuối UTH, mong muốn ứng tuyển thực tập sinh tại Viettel Solutions.', 'pending', '2026-10-27 08:45:00', NULL),
(4, 4, 12, 5, 'https://jobportal.vn/uploads/snapshots/app_04_snap.pdf', 'Em đam mê phân tích dữ liệu và đã có kinh nghiệm xây dựng Dashboard Power BI.', 'accepted', '2026-10-24 11:00:00', '2026-10-24 15:00:00'),
(5, 5, 10, 3, 'https://jobportal.vn/uploads/snapshots/app_05_snap.pdf', 'Em mong muốn ứng tuyển vị trí UI/UX Product Designer tại Shopee Vietnam.', 'pending', '2026-10-28 14:10:00', NULL);

-- ----------------------------------------------------------------------------
-- 10. NẠP DỮ LIỆU BẢNG: saved_jobs (Việc làm yêu thích của ứng viên)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE `saved_jobs`;
INSERT INTO `saved_jobs` (`user_id`, `job_id`, `saved_at`) VALUES
(8, 1, NOW()),
(8, 2, NOW()),
(9, 3, NOW()),
(10, 5, NOW()),
(11, 2, NOW()),
(12, 4, NOW());

SET foreign_key_checks = 1;
