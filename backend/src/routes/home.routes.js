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
             c.company_id, c.company_name, c.logo_url,
             l.location_name, cat.category_name
      FROM jobs j
      INNER JOIN companies c ON j.company_id = c.company_id
      INNER JOIN locations l ON j.location_id = l.location_id
      INNER JOIN categories cat ON j.category_id = cat.category_id
      WHERE j.status = 'approved' AND j.deadline >= CURDATE()
      ORDER BY j.created_at DESC
      LIMIT 6
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
          openJobs: jobCount.totalJobs,
          companies: companyCount.totalCompanies,
          candidates: candidateCount.totalCandidates
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
