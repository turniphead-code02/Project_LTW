/**
 * ============================================================================
 * MODULE 1: TÌM KIẾM, LỌC ĐA TIÊU CHÍ & DANH SÁCH VIỆC LÀM
 * Thành viên phụ trách: NGUYỄN LÊ GIA HÂN (MSSV: 083306010188)
 * File: backend/src/routes/jobs.routes.js
 * Database: MySQL 8+ | Tables: jobs, companies, categories, locations, skills, job_skills
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const ALLOWED_EMPLOYMENT_TYPES = new Set(['full_time', 'part_time', 'internship', 'remote']);
const ALLOWED_EXPERIENCE_LEVELS = new Set(['intern', 'fresher', 'junior', 'middle', 'senior', 'lead']);
const ALLOWED_SORTS = new Set(['newest', 'salary_desc']);

function parsePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} phải là số nguyên dương.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function parseNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} phải là số không âm.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function parseSkillIds(query) {
  const raw = query.skill_ids !== undefined ? query.skill_ids : query.skill_id;
  if (raw === undefined || raw === null || raw === '') return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  const parsedIds = values.map((value) => Number(String(value).trim()));
  if (parsedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    const error = new Error('skill_id/skill_ids phải chứa mã kỹ năng là số nguyên dương.');
    error.statusCode = 400;
    throw error;
  }
  return [...new Set(parsedIds)];
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (character) => `\\${character}`);
}

/**
 * GET /api/v1/jobs/filters
 * Trả về danh sách địa điểm, ngành nghề và kỹ năng để Frontend dựng bộ lọc.
 */
router.get('/filters', async (req, res) => {
  try {
    const [locationsResult, categoriesResult, skillsResult] = await Promise.all([
      pool.query(
        'SELECT location_id, location_name, slug FROM locations ORDER BY location_name ASC'
      ),
      pool.query(
        'SELECT category_id, category_name, slug FROM categories ORDER BY category_name ASC'
      ),
      pool.query(
        'SELECT skill_id, skill_name, slug FROM skills ORDER BY skill_name ASC'
      )
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    return sendSuccess(res, {
      message: 'Tải danh mục bộ lọc thành công.',
      data: {
        locations: locationsResult[0],
        categories: categoriesResult[0],
        skills: skillsResult[0]
      }
    });
  } catch (error) {
    console.error('[Module 1] GET /jobs/filters:', error);
    return sendError(res, {
      code: 500,
      message: 'Không thể tải danh mục bộ lọc. Vui lòng thử lại sau.'
    });
  }
});

/**
 * GET /api/v1/jobs
 * Query params:
 * keyword, category_id, location_id, employment_type, experience_level,
 * salary_min, salary_max, skill_id/skill_ids, sort, page, pageSize.
 * salary_min/salary_max dùng đơn vị tiền tệ lưu trong DB (VND hoặc USD).
 */
router.get('/', async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const categoryId = parsePositiveInteger(req.query.category_id, 'category_id');
    const locationId = parsePositiveInteger(req.query.location_id, 'location_id');
    const salaryMin = parseNonNegativeNumber(req.query.salary_min, 'salary_min');
    const salaryMax = parseNonNegativeNumber(req.query.salary_max, 'salary_max');
    const skillIds = parseSkillIds(req.query);

    const employmentType = req.query.employment_type ? String(req.query.employment_type) : '';
    const experienceLevel = req.query.experience_level ? String(req.query.experience_level) : '';
    const sort = String(req.query.sort || 'newest');

    if (employmentType && !ALLOWED_EMPLOYMENT_TYPES.has(employmentType)) {
      return sendError(res, { code: 400, message: 'employment_type không hợp lệ.' });
    }
    if (experienceLevel && !ALLOWED_EXPERIENCE_LEVELS.has(experienceLevel)) {
      return sendError(res, { code: 400, message: 'experience_level không hợp lệ.' });
    }
    if (!ALLOWED_SORTS.has(sort)) {
      return sendError(res, { code: 400, message: 'sort chỉ nhận newest hoặc salary_desc.' });
    }
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      return sendError(res, { code: 400, message: 'salary_min không được lớn hơn salary_max.' });
    }

    const currentPage = parsePositiveInteger(req.query.page, 'page') || 1;
    const pageSize = Math.min(parsePositiveInteger(req.query.pageSize, 'pageSize') || 6, 50);
    const offset = (currentPage - 1) * pageSize;

    // Điều kiện mặc định: chỉ tin đã duyệt và còn hạn nộp hồ sơ.
    const conditions = [
      "j.status = 'approved'",
      'j.deadline >= CURDATE()'
    ];
    const params = [];

    if (keyword) {
      const pattern = `%${escapeLike(keyword)}%`;
      conditions.push(`(
        j.title LIKE ? ESCAPE '\\\\'
        OR j.description LIKE ? ESCAPE '\\\\'
        OR j.requirements LIKE ? ESCAPE '\\\\'
        OR c.company_name LIKE ? ESCAPE '\\\\'
        OR EXISTS (
          SELECT 1
          FROM job_skills search_js
          INNER JOIN skills search_s ON search_s.skill_id = search_js.skill_id
          WHERE search_js.job_id = j.job_id
            AND search_s.skill_name LIKE ? ESCAPE '\\\\'
        )
      )`);
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (categoryId !== null) {
      conditions.push('j.category_id = ?');
      params.push(categoryId);
    }
    if (locationId !== null) {
      conditions.push('j.location_id = ?');
      params.push(locationId);
    }
    if (employmentType) {
      conditions.push('j.employment_type = ?');
      params.push(employmentType);
    }
    if (experienceLevel) {
      conditions.push('j.experience_level = ?');
      params.push(experienceLevel);
    }

    // Lọc giao nhau giữa khoảng lương của tin tuyển dụng và khoảng lương người dùng chọn.
    if (salaryMin !== null) {
      conditions.push('j.salary_max IS NOT NULL AND j.salary_max >= ?');
      params.push(salaryMin);
    }
    if (salaryMax !== null) {
      conditions.push('j.salary_min IS NOT NULL AND j.salary_min <= ?');
      params.push(salaryMax);
    }

    // Nếu có nhiều skill_ids, tin phải có ít nhất một kỹ năng được chọn.
    if (skillIds.length) {
      const placeholders = skillIds.map(() => '?').join(', ');
      conditions.push(`EXISTS (
        SELECT 1 FROM job_skills filter_js
        WHERE filter_js.job_id = j.job_id
          AND filter_js.skill_id IN (${placeholders})
      )`);
      params.push(...skillIds);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const orderBy = sort === 'salary_desc'
      ? 'ORDER BY j.salary_max IS NULL ASC, j.salary_max DESC, j.created_at DESC'
      : 'ORDER BY j.created_at DESC, j.job_id DESC';

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM jobs j
       INNER JOIN companies c ON c.company_id = j.company_id
       ${whereClause}`,
      params
    );
    const total = Number(countRow.total) || 0;

    const [jobs] = await pool.query(
      `SELECT
          j.job_id,
          j.title,
          j.slug,
          j.description,
          j.salary_min,
          j.salary_max,
          j.currency,
          j.employment_type,
          j.experience_level,
          j.deadline,
          j.created_at,
          c.company_id,
          c.company_name,
          c.logo_url,
          cat.category_id,
          cat.category_name,
          loc.location_id,
          loc.location_name,
          (
            SELECT GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ')
            FROM job_skills js
            INNER JOIN skills s ON s.skill_id = js.skill_id
            WHERE js.job_id = j.job_id
          ) AS skills
       FROM jobs j
       INNER JOIN companies c ON c.company_id = j.company_id
       INNER JOIN categories cat ON cat.category_id = j.category_id
       INNER JOIN locations loc ON loc.location_id = j.location_id
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const totalPages = Math.ceil(total / pageSize);
    return sendSuccess(res, {
      message: 'Tra cứu danh sách việc làm thành công.',
      data: jobs,
      meta: {
        page: currentPage,
        pageSize,
        total,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages
      }
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, { code: 400, message: error.message });
    }
    console.error('[Module 1] GET /jobs:', error);
    return sendError(res, {
      code: 500,
      message: 'Không thể tải danh sách việc làm. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;
