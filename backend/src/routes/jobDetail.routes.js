/**
 * ============================================================================
 * MODULE 2: CHI TIẾT VIỆC LÀM & NỘP ĐƠN ỨNG TUYỂN (IMMUTABLE SNAPSHOT)
 * Thành viên phụ trách: HỒ TRÚC GIA HÂN (MSSV: 079306008116)
 * Nhánh Git: module_2_HoTrucGiaHan
 * Bảng CSDL sử dụng: jobs, companies, locations, categories, job_skills, skills, applications, resumes
 * Giao diện kết nối: job-portal/job-detail.html & job-portal/assets/js/job-detail.js
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { uploadMemory, validatePdfMagicBytes, handleCvUpload } = require('../middlewares/upload.middleware');

const UPLOAD_CV_DIR = path.join(__dirname, '../../uploads/cv');
if (!fs.existsSync(UPLOAD_CV_DIR)) {
  fs.mkdirSync(UPLOAD_CV_DIR, { recursive: true });
}

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
 * Ứng viên nộp hồ sơ ứng tuyển:
 *   - Hỗ trợ chọn CV có sẵn từ kho hoặc tải lên tệp PDF mới kiểm tra %PDF-
 *   - Thực hiện toàn bộ quy trình trong MySQL Transaction (ACID)
 *   - Tạo bản sao PDF vật lý độc lập (True Immutable Snapshot) lưu vào `resume_snapshot_url`
 *   - Tự động dọn dẹp tệp rác trên ổ đĩa nếu giao dịch thất bại
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
    let conn = null;
    const createdFiles = [];
    try {
      const jobId = Number(req.params.id);
      const userId = req.user.user_id;
      const { resume_id, cover_letter = '' } = req.body;

      if (!Number.isInteger(jobId) || jobId <= 0) {
        return sendError(res, { code: 400, message: 'Mã việc làm không hợp lệ.' });
      }

      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 1. Khóa và kiểm tra tin tuyển dụng có tồn tại & đang mở nhận đơn (status = 'approved')
      const [jobs] = await conn.query(
        'SELECT job_id, title, status, deadline FROM jobs WHERE job_id = ? FOR UPDATE',
        [jobId]
      );
      if (!jobs.length) {
        await conn.rollback();
        return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng này.' });
      }

      if (jobs[0].status !== 'approved') {
        await conn.rollback();
        return sendError(res, { code: 400, message: 'Tin tuyển dụng hiện không nhận đơn ứng tuyển.' });
      }

      // 2. Khóa và kiểm tra ứng viên đã nộp đơn cho vị trí này trước đó hay chưa
      const [existing] = await conn.query(
        'SELECT application_id FROM applications WHERE job_id = ? AND user_id = ? FOR UPDATE',
        [jobId, userId]
      );
      if (existing.length > 0) {
        await conn.rollback();
        return sendError(res, { code: 400, message: 'Bạn đã nộp đơn ứng tuyển cho vị trí này trước đó.' });
      }

      let snapshotUrl = null;
      let resumeIdToSave = resume_id ? Number(resume_id) : null;

      // 3. Xử lý CV: Tải lên tệp mới HOẶC Chọn CV có sẵn từ kho lưu trữ
      if (req.savedCvUrl && req.savedCvPath) {
        // A. Ứng viên tải lên tệp PDF mới:
        createdFiles.push(req.savedCvPath);

        const resumeTitle = (typeof req.savedCvOriginalName === 'string' && req.savedCvOriginalName.trim())
          ? req.savedCvOriginalName.trim().slice(0, 150)
          : 'CV Ứng Tuyển';

        // Lưu CV mới vào kho resumes trong cùng Transaction
        const [insResume] = await conn.query(
          'INSERT INTO resumes (user_id, resume_title, file_url, is_default) VALUES (?, ?, ?, 0)',
          [userId, resumeTitle, req.savedCvUrl]
        );
        resumeIdToSave = insResume.insertId;

        // Tạo bản chụp PDF vật lý độc lập (True Immutable Snapshot) dành riêng cho đơn ứng tuyển
        const snapshotFileName = `snapshot_cv_${crypto.randomUUID()}.pdf`;
        const snapshotFullPath = path.join(UPLOAD_CV_DIR, snapshotFileName);
        fs.copyFileSync(req.savedCvPath, snapshotFullPath);
        createdFiles.push(snapshotFullPath);
        snapshotUrl = `/uploads/cv/${snapshotFileName}`;
      } else if (resumeIdToSave) {
        // B. Ứng viên chọn CV có sẵn từ kho lưu trữ:
        const [resumes] = await conn.query(
          'SELECT resume_id, file_url, resume_title FROM resumes WHERE resume_id = ? AND user_id = ? FOR UPDATE',
          [resumeIdToSave, userId]
        );
        if (!resumes.length) {
          await conn.rollback();
          return sendError(res, { code: 400, message: 'Không tìm thấy CV đã chọn trong kho lưu trữ của bạn.' });
        }

        const sourceFileUrl = resumes[0].file_url;
        const sourceFileName = path.basename(sourceFileUrl);
        const sourceFilePath = path.join(UPLOAD_CV_DIR, sourceFileName);

        if (!fs.existsSync(sourceFilePath)) {
          await conn.rollback();
          return sendError(res, { code: 404, message: 'Tệp CV gốc không tồn tại trên hệ thống lưu trữ.' });
        }

        // Tạo bản sao PDF vật lý độc lập (True Immutable Snapshot)
        // Đảm bảo nhà tuyển dụng luôn xem được hồ sơ tại thời điểm nộp đơn,
        // ngay cả khi ứng viên sau này sửa đổi hoặc xóa CV khỏi kho cá nhân
        const snapshotFileName = `snapshot_cv_${crypto.randomUUID()}.pdf`;
        const snapshotFullPath = path.join(UPLOAD_CV_DIR, snapshotFileName);
        fs.copyFileSync(sourceFilePath, snapshotFullPath);
        createdFiles.push(snapshotFullPath);
        snapshotUrl = `/uploads/cv/${snapshotFileName}`;
      } else {
        await conn.rollback();
        return sendError(res, { code: 400, message: 'Vui lòng chọn CV từ kho hoặc tải lên tệp PDF mới.' });
      }

      // 4. Tạo bản ghi đơn ứng tuyển trong cùng Transaction
      const safeCoverLetter = typeof cover_letter === 'string' ? cover_letter.trim() : '';
      const [appResult] = await conn.query(
        `INSERT INTO applications (job_id, user_id, resume_id, resume_snapshot_url, cover_letter, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [jobId, userId, resumeIdToSave, snapshotUrl, safeCoverLetter]
      );

      // 5. Xác nhận giao dịch thành công (Commit)
      await conn.commit();

      return sendSuccess(res, {
        code: 201,
        message: 'Nộp hồ sơ ứng tuyển thành công!',
        data: {
          application_id: appResult.insertId,
          job_id: jobId,
          resume_snapshot_url: snapshotUrl,
          status: 'pending'
        }
      });
    } catch (err) {
      if (conn) {
        try {
          await conn.rollback();
        } catch (rbErr) {
          console.warn('[APPLY ROLLBACK] Lỗi rollback:', rbErr.message);
        }
      }

      // Dọn dẹp tệp vật lý rác trên ổ đĩa nếu nộp đơn thất bại (ngăn ngừa rác đĩa)
      for (const filePath of createdFiles) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          console.warn('[APPLY CLEANUP] Không thể xóa tệp rác:', cleanupErr.message);
        }
      }

      if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, { code: 400, message: 'Bạn đã nộp đơn ứng tuyển cho vị trí này trước đó.' });
      }
      return sendError(res, { code: 500, message: 'Lỗi nộp hồ sơ ứng tuyển: ' + err.message });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
);

module.exports = router;
