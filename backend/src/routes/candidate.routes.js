/**
 * ============================================================================
 * MODULE 3: KHÔNG GIAN ỨNG VIÊN, KHO HỒ SƠ CV, ĐƠN ỨNG TUYỂN & VIỆC LÀM ĐÃ LƯU
 * Thành viên phụ trách: NGUYỄN PHÚ QUANG (MSSV: 036206029474)
 * Nhánh Git: module_3_NguyenPhuQuang
 * Bảng CSDL sử dụng: users, resumes, applications, saved_jobs, jobs, companies, locations
 * Giao diện kết nối: candidate-dashboard.html, my-applications.html, saved-jobs.html
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { uploadMemory, validatePdfMagicBytes } = require('../middlewares/upload.middleware');

router.use(requireAuth, requireRole('candidate'));

/**
 * 1. QUẢN LÝ KHO CV CÁ NHÂN (Bảng `resumes`)
 */
router.get('/resumes', async (req, res) => {
  try {
    const [resumes] = await pool.query(
      'SELECT resume_id, resume_title, file_url, is_default, created_at FROM resumes WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.user_id]
    );
    return sendSuccess(res, { message: 'Tải danh sách CV thành công.', data: resumes });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải kho CV: ' + err.message });
  }
});

router.post('/resumes', uploadMemory.single('cvFile'), validatePdfMagicBytes, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const title = (req.body.resume_title || req.savedCvOriginalName || 'Hồ sơ CV').trim();

    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM resumes WHERE user_id = ?', [userId]);
    const isDefault = count === 0 ? 1 : 0;

    const [result] = await pool.query(
      'INSERT INTO resumes (user_id, resume_title, file_url, is_default) VALUES (?, ?, ?, ?)',
      [userId, title, req.savedCvUrl, isDefault]
    );

    return sendSuccess(res, {
      code: 201,
      message: 'Tải CV PDF lên kho lưu trữ thành công.',
      data: { resume_id: result.insertId, resume_title: title, file_url: req.savedCvUrl, is_default: isDefault }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi lưu CV: ' + err.message });
  }
});

router.patch('/resumes/:id/default', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const resumeId = Number(req.params.id);
    const userId = req.user.user_id;

    await conn.beginTransaction();
    await conn.query('UPDATE resumes SET is_default = 0 WHERE user_id = ?', [userId]);
    await conn.query('UPDATE resumes SET is_default = 1 WHERE resume_id = ? AND user_id = ?', [resumeId, userId]);
    await conn.commit();

    return sendSuccess(res, { message: 'Đã đặt làm CV mặc định.' });
  } catch (err) {
    await conn.rollback();
    return sendError(res, { code: 500, message: 'Lỗi cập nhật CV mặc định: ' + err.message });
  } finally {
    conn.release();
  }
});

router.delete('/resumes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM resumes WHERE resume_id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.user_id
    ]);
    return sendSuccess(res, { message: 'Đã xóa CV khỏi kho lưu trữ.' });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi xóa CV: ' + err.message });
  }
});

/**
 * 2. LỊCH SỬ ĐƠN ỨNG TUYỂN & TIẾN TRÌNH 4 BƯỚC (Bảng `applications`)
 */
router.get('/applications', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.application_id, a.job_id, a.resume_id, a.resume_snapshot_url, a.cover_letter,
              a.status, a.applied_at, a.viewed_at,
              j.title AS job_title, j.slug AS job_slug, j.salary_min, j.salary_max, j.employment_type,
              c.company_name, c.logo_url, l.location_name
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.user_id]
    );
    return sendSuccess(res, { message: 'Tải danh sách đơn ứng tuyển thành công.', data: rows });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải đơn ứng tuyển: ' + err.message });
  }
});

router.delete('/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE application_id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.user_id
    ]);
    return sendSuccess(res, { message: 'Đã rút đơn ứng tuyển thành công.' });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi rút đơn ứng tuyển: ' + err.message });
  }
});

/**
 * 3. DANH SÁCH VIỆC LÀM ĐÃ LƯU (Bảng `saved_jobs`)
 */
router.get('/saved-jobs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.job_id, s.saved_at,
              j.title, j.slug, j.salary_min, j.salary_max, j.employment_type, j.deadline,
              c.company_name, c.logo_url, l.location_name
       FROM saved_jobs s
       INNER JOIN jobs j ON s.job_id = j.job_id
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       WHERE s.user_id = ?
       ORDER BY s.saved_at DESC`,
      [req.user.user_id]
    );
    return sendSuccess(res, { message: 'Tải việc làm đã lưu thành công.', data: rows });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải việc làm đã lưu: ' + err.message });
  }
});

router.post('/saved-jobs/:jobId', async (req, res) => {
  try {
    await pool.query('INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [
      req.user.user_id,
      Number(req.params.jobId)
    ]);
    return sendSuccess(res, { code: 201, message: 'Đã lưu việc làm vào danh sách yêu thích.' });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi lưu việc làm: ' + err.message });
  }
});

router.delete('/saved-jobs/:jobId', async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [
      req.user.user_id,
      Number(req.params.jobId)
    ]);
    return sendSuccess(res, { message: 'Đã bỏ lưu việc làm.' });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi bỏ lưu việc làm: ' + err.message });
  }
});

module.exports = router;
