/**
 * ============================================================================
 * MODULE 1: TÌM KIẾM, LỌC ĐA TIÊU CHÍ & DANH SÁCH VIỆC LÀM
 * Thành viên phụ trách: NGUYỄN LÊ GIA HÂN (MSSV: 052305001614)
 * Nhánh Git: module_1_NguyenLeGiaHan
 * Bảng CSDL sử dụng: jobs, companies, categories, locations, skills, job_skills
 * Giao diện kết nối: job-portal/jobs.html & job-portal/assets/js/jobs.js
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/v1/jobs/filters
 * Lấy danh sách Tỉnh/Thành phố, Ngành nghề và Kỹ năng cho cột Sidebar Filter
 */
router.get('/filters', async (req, res) => {
  try {
    const [locations] = await pool.query('SELECT location_id, location_name, slug FROM locations ORDER BY location_id ASC');
    const [categories] = await pool.query('SELECT category_id, category_name, slug FROM categories ORDER BY category_id ASC');
    const [skills] = await pool.query('SELECT skill_id, skill_name, slug FROM skills ORDER BY skill_name ASC');

    return sendSuccess(res, {
      message: 'Tải danh mục bộ lọc thành công.',
      data: { locations, categories, skills }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải bộ lọc: ' + err.message });
  }
});

/**
 * GET /api/v1/jobs
 * Tìm kiếm từ khóa (FULLTEXT / LIKE), lọc đa tiêu chí và phân trang
 * Query params: keyword, category_id, location_id, employment_type, experience_level, salary_min, salary_max, sort, page, pageSize
 */
router.get('/', async (req, res) => {
  try {
    const {
      keyword = '',
      category_id,
      location_id,
      employment_type,
      experience_level,
      salary_min,
      salary_max,
      sort = 'newest',
      page = 1,
      pageSize = 6
    } = req.query;

    const conditions = ["j.status = 'approved'", 'j.deadline >= CURDATE()'];
    const params = [];

    if (keyword.trim()) {
      conditions.push('(j.title LIKE ? OR j.description LIKE ? OR c.company_name LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }
    if (category_id) {
      conditions.push('j.category_id = ?');
      params.push(Number(category_id));
    }
    if (location_id) {
      conditions.push('j.location_id = ?');
      params.push(Number(location_id));
    }
    if (employment_type) {
      conditions.push('j.employment_type = ?');
      params.push(employment_type);
    }
    if (experience_level) {
      conditions.push('j.experience_level = ?');
      params.push(experience_level);
    }
    if (salary_min) {
      conditions.push('(j.salary_max >= ? OR j.salary_min >= ?)');
      params.push(Number(salary_min), Number(salary_min));
    }
    if (salary_max) {
      conditions.push('j.salary_min <= ?');
      params.push(Number(salary_max));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'salary_desc'
      ? 'ORDER BY j.salary_max DESC, j.created_at DESC'
      : 'ORDER BY j.created_at DESC';

    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(50, Math.max(1, Number(pageSize) || 6));
    const offset = (currentPage - 1) * limit;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM jobs j
       INNER JOIN companies c ON j.company_id = c.company_id
       ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT j.job_id, j.title, j.slug, j.salary_min, j.salary_max, j.currency,
              j.employment_type, j.experience_level, j.deadline, j.created_at,
              c.company_id, c.company_name, c.logo_url,
              l.location_id, l.location_name,
              cat.category_id, cat.category_name
       FROM jobs j
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       INNER JOIN categories cat ON j.category_id = cat.category_id
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return sendSuccess(res, {
      message: 'Tra cứu danh sách việc làm thành công.',
      data: rows,
      meta: {
        page: currentPage,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tìm kiếm việc làm: ' + err.message });
  }
});

module.exports = router;
