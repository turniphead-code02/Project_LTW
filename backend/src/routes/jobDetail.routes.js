/**
 * ============================================================================
 * MODULE 2: CHI TIẾT VIỆC LÀM & NỘP ĐƠN ỨNG TUYỂN (IMMUTABLE SNAPSHOT)
 * Thành viên phụ trách: HỒ TRÚC GIA HÂN (MSSV: 079306008116)
 * Nhánh Git: module_2_HoTrucGiaHan
 * Bảng CSDL sử dụng: jobs, companies, locations, categories, job_skills, skills, applications, resumes
 * Giao diện kết nối: job-portal/job-detail.html & job-portal/assets/js/job-detail.js
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { uploadMemory, validatePdfMagicBytes } = require('../middlewares/upload.middleware');

/**
 * GET /api/v1/job-detail/:id
 * Lấy chi tiết công việc theo job_id (hoặc slug), kèm kỹ năng yêu cầu và việc làm liên quan
 */
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const isNumeric = /^\d+$/.test(param);

    const [jobs] = await pool.query(
      `SELECT j.*,
              c.company_name, c.slug AS company_slug, c.logo_url, c.website, c.address, c.description AS company_description,
              l.location_name,
              cat.category_name
       FROM jobs j
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       INNER JOIN categories cat ON j.category_id = cat.category_id
       WHERE ${isNumeric ? 'j.job_id = ?' : 'j.slug = ?'}
       LIMIT 1`,
      [isNumeric ? Number(param) : param]
    );

    if (!jobs.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng này.' });
    }

    const job = jobs[0];

    const [skills] = await pool.query(
      `SELECT s.skill_id, s.skill_name, s.slug
       FROM job_skills js
       INNER JOIN skills s ON js.skill_id = s.skill_id
       WHERE js.job_id = ?`,
      [job.job_id]
    );

    const [relatedJobs] = await pool.query(
      `SELECT j.job_id, j.title, j.slug, j.salary_min, j.salary_max, j.currency,
              j.employment_type, j.deadline, c.company_name, c.logo_url, l.location_name
       FROM jobs j
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       WHERE j.category_id = ? AND j.job_id != ? AND j.status = 'approved' AND j.deadline >= CURDATE()
       ORDER BY j.created_at DESC
       LIMIT 3`,
      [job.category_id, job.job_id]
    );

    return sendSuccess(res, {
      message: 'Tải chi tiết việc làm thành công.',
      data: {
        ...job,
        skills,
        relatedJobs
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải chi tiết việc làm: ' + err.message });
  }
});

/**
 * POST /api/v1/job-detail/:id/apply
 * Ứng viên nộp hồ sơ ứng tuyển (Hỗ trợ chọn CV có sẵn hoặc tải lên tệp PDF mới kiểm tra %PDF-)
 * Lưu bản chụp bất biến vào cột `resume_snapshot_url` của bảng `applications`
 */
router.post(
  '/:id/apply',
  requireAuth,
  requireRole('candidate'),
  uploadMemory.single('cvFile'),
  async (req, res, next) => {
    if (req.file) {
      return validatePdfMagicBytes(req, res, next);
    }
    return next();
  },
  async (req, res) => {
    try {
      const jobId = Number(req.params.id);
      const userId = req.user.user_id;
      const { resume_id, cover_letter = '' } = req.body;

      let snapshotUrl = req.savedCvUrl || null;
      let resumeIdToSave = resume_id ? Number(resume_id) : null;

      // Nếu người dùng tải CV mới lên khi ứng tuyển thì lưu vào bảng resumes trước
      if (snapshotUrl) {
        const [insResume] = await pool.query(
          'INSERT INTO resumes (user_id, resume_title, file_url, is_default) VALUES (?, ?, ?, 0)',
          [userId, req.savedCvOriginalName || 'CV Ứng Tuyển', snapshotUrl]
        );
        resumeIdToSave = insResume.insertId;
      } else if (resumeIdToSave) {
        const [rows] = await pool.query(
          'SELECT file_url FROM resumes WHERE resume_id = ? AND user_id = ? LIMIT 1',
          [resumeIdToSave, userId]
        );
        if (!rows.length) {
          return sendError(res, { code: 400, message: 'Không tìm thấy CV đã chọn trong kho lưu trữ.' });
        }
        snapshotUrl = rows[0].file_url;
      } else {
        return sendError(res, { code: 400, message: 'Vui lòng chọn CV từ kho hoặc tải lên tệp PDF mới.' });
      }

      await pool.query(
        `INSERT INTO applications (job_id, user_id, resume_id, resume_snapshot_url, cover_letter, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [jobId, userId, resumeIdToSave, snapshotUrl, cover_letter]
      );

      return sendSuccess(res, {
        code: 201,
        message: 'Nộp hồ sơ ứng tuyển thành công!',
        data: { job_id: jobId, resume_snapshot_url: snapshotUrl, status: 'pending' }
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, { code: 400, message: 'Bạn đã nộp đơn ứng tuyển cho vị trí này trước đó.' });
      }
      return sendError(res, { code: 500, message: 'Lỗi nộp hồ sơ ứng tuyển: ' + err.message });
    }
  }
);

module.exports = router;
