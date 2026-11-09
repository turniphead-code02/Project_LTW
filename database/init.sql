-- ============================================================================
-- DỰ ÁN: CỔNG THÔNG TIN VIỆC LÀM (JOB PORTAL) — NHÓM 6 UTH
-- TỆP KHỞI TẠO TOÀN DIỆN DATABASE (ONE-CLICK INITIALIZATION SCRIPT)
-- TÀI LIỆU CĂN CỨ: ProjectLTW - Schema.pdf
-- HƯỚNG DẪN CHẠY:
--   mysql -u root -p < database/init.sql
-- ============================================================================

-- 1. TẠO CƠ SỞ DỮ LIỆU CHUẨN UTF8MB4
CREATE DATABASE IF NOT EXISTS `job_portal_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `job_portal_db`;

-- 2. NẠP CẤU TRÚC BẢNG (SCHEMA DDL)
SOURCE schema.sql;

-- 3. NẠP DỮ LIỆU MẪU (SEED DATA)
SOURCE seed_data.sql;

-- HIỂN THỊ THÔNG BÁO HOÀN THÀNH
SELECT 'Khởi tạo Cơ sở dữ liệu job_portal_db thành công 10/10 bảng!' AS `Message`;
SHOW TABLES;
