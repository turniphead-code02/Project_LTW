/**
 * ============================================================================
 * PHÂN HỆ CORE & TRANG CHỦ: HOME & METADATA API ROUTES
 * Thành viên phụ trách: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * Nhánh Git: main / core_TranHuuThanh
 * Bảng CSDL sử dụng: jobs, companies, categories, locations, users
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/v1/home/overview
 * Trả về số liệu thống kê tổng quan, danh mục ngành nghề, việc làm nổi bật & top công ty
 */
router.get('/overview', async (req, res) => {
  try {
    const [[jobCount]] = await pool.query(
      "SELECT COUNT(*) AS totalJobs FROM jobs WHERE status = 'approved' AND deadline >= CURDATE()"
    );
    const [[companyCount]] = await pool.query('SELECT COUNT(*) AS totalCompanies FROM companies');
    const [[candidateCount]] = await pool.query(
      "SELECT COUNT(*) AS totalCandidates FROM users WHERE role = 'candidate'"
    );
    const [[salaryStats]] = await pool.query(`
      SELECT ROUND(
        AVG((COALESCE(salary_min, salary_max) + COALESCE(salary_max, salary_min)) / 2) / 1000000,
        1
      ) AS avgSalaryMillions
      FROM jobs
      WHERE status = 'approved'
        AND deadline >= CURDATE()
        AND currency = 'VND'
        AND (salary_min IS NOT NULL OR salary_max IS NOT NULL)
    `);
    const [[appStats]] = await pool.query(`
      SELECT COUNT(*) AS totalApplications,
             SUM(CASE WHEN status <> 'submitted' THEN 1 ELSE 0 END) AS respondedApplications
      FROM applications
    `);

    const [categories] = await pool.query(`
      SELECT c.category_id, c.category_name, c.slug, c.description,
             COUNT(j.job_id) AS open_jobs_count
      FROM categories c
      LEFT JOIN jobs j ON j.category_id = c.category_id AND j.status = 'approved' AND j.deadline >= CURDATE()
      GROUP BY c.category_id
      ORDER BY open_jobs_count DESC, c.category_id ASC
    `);

    const [featuredJobs] = await pool.query(`
      SELECT j.job_id, j.title, j.slug, j.salary_min, j.salary_max, j.currency,
             j.employment_type, j.experience_level, j.deadline, j.created_at,
             c.company_id, c.company_name, c.slug AS company_slug, c.logo_url,
             l.location_name, cat.category_name, cat.slug AS category_slug,
             (
               SELECT GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ')
               FROM job_skills js
               INNER JOIN skills s ON s.skill_id = js.skill_id
               WHERE js.job_id = j.job_id
             ) AS skills
      FROM jobs j
      INNER JOIN companies c ON j.company_id = c.company_id
      INNER JOIN locations l ON j.location_id = l.location_id
      INNER JOIN categories cat ON j.category_id = cat.category_id
      WHERE j.status = 'approved' AND j.deadline >= CURDATE()
      ORDER BY j.created_at DESC, j.job_id DESC
      LIMIT 12
    `);

    const [topCompanies] = await pool.query(`
      SELECT c.company_id, c.company_name, c.slug, c.logo_url, c.address,
             COUNT(j.job_id) AS open_positions
      FROM companies c
      LEFT JOIN jobs j ON j.company_id = c.company_id AND j.status = 'approved' AND j.deadline >= CURDATE()
      GROUP BY c.company_id
      ORDER BY open_positions DESC, c.company_id ASC
      LIMIT 6
    `);

    return sendSuccess(res, {
      message: 'Tải dữ liệu trang chủ thành công.',
      data: {
        stats: {
          openJobs: Number(jobCount.totalJobs) || 0,
          companies: Number(companyCount.totalCompanies) || 0,
          candidates: Number(candidateCount.totalCandidates) || 0,
          avgSalaryMillions: salaryStats?.avgSalaryMillions !== null && salaryStats?.avgSalaryMillions !== undefined
            ? Number(salaryStats.avgSalaryMillions)
            : null,
          totalApplications: Number(appStats?.totalApplications) || 0,
          respondedApplications: Number(appStats?.respondedApplications) || 0
        },
        categories,
        featuredJobs,
        topCompanies
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi truy vấn dữ liệu trang chủ: ' + err.message });
  }
});

module.exports = router;
