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
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { handleCvUpload, validatePdfMagicBytes } = require('../middlewares/upload.middleware');

// Áp dụng xác thực JWT & phân quyền vai trò 'candidate' cho toàn bộ route
router.use(requireAuth, requireRole('candidate'));

let candidateProfileTableReady = null;
async function ensureCandidateProfilesTable() {
  if (!candidateProfileTableReady) {
    candidateProfileTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_profiles (
        user_id INT PRIMARY KEY,
        preferred_location VARCHAR(60) NULL DEFAULT NULL,
        educations_json LONGTEXT NULL DEFAULT NULL,
        skills_json LONGTEXT NULL DEFAULT NULL,
        portfolio_url VARCHAR(500) NULL DEFAULT NULL,
        github_url VARCHAR(500) NULL DEFAULT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_candidate_profiles_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `).catch(err => {
      candidateProfileTableReady = null;
      throw err;
    });
  }
  return candidateProfileTableReady;
}

function safeJsonArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/**
 * ----------------------------------------------------------------------------
 * 0. THÔNG TIN CÁ NHÂN & THỐNG KÊ DASHBOARD ỨNG VIÊN
 * ----------------------------------------------------------------------------
 */

// GET /api/v1/candidate/profile
router.get('/profile', async (req, res) => {
  try {
    await ensureCandidateProfilesTable();

    const [users] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
              cp.preferred_location, cp.educations_json, cp.skills_json, cp.portfolio_url, cp.github_url
       FROM users u
       LEFT JOIN candidate_profiles cp ON u.user_id = cp.user_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );
    if (!users.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy hồ sơ người dùng.' });
    }

    const row = users[0];
    return sendSuccess(res, {
      message: 'Tải thông tin hồ sơ thành công.',
      data: {
        user_id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: row.status,
        location: row.preferred_location || '',
        educations: safeJsonArray(row.educations_json),
        skills: safeJsonArray(row.skills_json),
        links: {
          portfolio: row.portfolio_url || '',
          github: row.github_url || ''
        }
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải hồ sơ cá nhân: ' + err.message });
  }
});

// PUT /api/v1/candidate/profile
router.put('/profile', async (req, res) => {
  try {
    await ensureCandidateProfilesTable();
    const userId = req.user.user_id;
    const b = req.body || {};

    // Hỗ trợ cập nhật từng phần (học vấn, kỹ năng, liên kết) hoặc toàn bộ thông tin cá nhân
    if (b.full_name !== undefined) {
      if (!String(b.full_name).trim()) {
        return sendError(res, { code: 400, message: 'Họ và tên không được để trống.' });
      }
      await pool.query(
        'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?',
        [String(b.full_name).trim(), b.phone ? String(b.phone).trim() : null, userId]
      );
    }

    // Đảm bảo có dòng trong candidate_profiles trước khi cập nhật các trường được gửi lên
    await pool.query(
      'INSERT IGNORE INTO candidate_profiles (user_id) VALUES (?)',
      [userId]
    );

    const sets = [];
    const params = [];

    if (b.location !== undefined) {
      sets.push('preferred_location = ?');
      params.push(b.location ? String(b.location).trim().slice(0, 60) : null);
    }
    if (Array.isArray(b.educations)) {
      sets.push('educations_json = ?');
      params.push(JSON.stringify(b.educations));
    }
    if (Array.isArray(b.skills)) {
      sets.push('skills_json = ?');
      params.push(JSON.stringify(b.skills));
    }
    if (b.links && typeof b.links === 'object') {
      sets.push('portfolio_url = ?, github_url = ?');
      params.push(
        b.links.portfolio ? String(b.links.portfolio).trim().slice(0, 500) : null,
        b.links.github ? String(b.links.github).trim().slice(0, 500) : null
      );
    }

    if (sets.length > 0) {
      params.push(userId);
      await pool.query(
        `UPDATE candidate_profiles SET ${sets.join(', ')} WHERE user_id = ?`,
        params
      );
    }

    return sendSuccess(res, {
      message: 'Đã lưu hồ sơ ứng viên lên cơ sở dữ liệu.',
      data: { user_id: userId }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi cập nhật hồ sơ cá nhân: ' + err.message });
  }
});

// GET /api/v1/candidate/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[{ totalResumes }]] = await pool.query(
      'SELECT COUNT(*) AS totalResumes FROM resumes WHERE user_id = ?',
      [userId]
    );

    const [[{ totalApplications }]] = await pool.query(
      'SELECT COUNT(*) AS totalApplications FROM applications WHERE user_id = ?',
      [userId]
    );

    const [[{ totalSavedJobs }]] = await pool.query(
      'SELECT COUNT(*) AS totalSavedJobs FROM saved_jobs WHERE user_id = ?',
      [userId]
    );

    const [recentApplications] = await pool.query(
      `SELECT a.application_id, a.job_id, a.status, a.applied_at,
              j.title AS job_title, j.slug AS job_slug,
              c.company_name, c.logo_url
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       INNER JOIN companies c ON j.company_id = c.company_id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC
       LIMIT 5`,
      [userId]
    );

    return sendSuccess(res, {
      message: 'Tải thống kê dashboard ứng viên thành công.',
      data: {
        totalResumes,
        totalApplications,
        totalSavedJobs,
        recentApplications
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải thống kê dashboard: ' + err.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * 1. QUẢN LÝ KHO CV CÁ NHÂN (Bảng `resumes`)
 * ----------------------------------------------------------------------------
 */

// GET /api/v1/candidate/resumes
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

// POST /api/v1/candidate/resumes
router.post('/resumes', handleCvUpload, validatePdfMagicBytes, async (req, res) => {
  let conn = null;
  try {
    const userId = req.user.user_id;
    // Kiểm tra kiểu dữ liệu chuỗi an toàn trước khi gọi trim()
    const rawTitle = req.body && typeof req.body.resume_title === 'string'
      ? req.body.resume_title
      : (typeof req.savedCvOriginalName === 'string' ? req.savedCvOriginalName : '');
    let title = rawTitle.trim();

    if (!title) {
      title = 'Hồ sơ CV';
    }

    // Kiểm tra độ dài tiêu đề CV theo cấu trúc bảng resumes (VARCHAR(150))
    if (title.length > 150) {
      if (req.savedCvPath && fs.existsSync(req.savedCvPath)) {
        try { fs.unlinkSync(req.savedCvPath); } catch (e) {}
      }
      return sendError(res, {
        code: 400,
        message: 'Tên gợi nhớ của CV không được vượt quá 150 ký tự.'
      });
    }

    // Đưa việc lấy connection vào bên trong khối try để bảo đảm luôn dọn tệp rác nếu lấy kết nối thất bại
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Khóa bi quan dòng user để đếm chính xác số lượng CV hiện có
    //    và ngăn chặn race condition khi hai luồng upload đồng thời cùng gán is_default = 1
    await conn.query('SELECT user_id FROM users WHERE user_id = ? FOR UPDATE', [userId]);

    const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM resumes WHERE user_id = ?', [userId]);
    const isDefault = count === 0 ? 1 : 0;

    const [result] = await conn.query(
      'INSERT INTO resumes (user_id, resume_title, file_url, is_default) VALUES (?, ?, ?, ?)',
      [userId, title, req.savedCvUrl, isDefault]
    );

    await conn.commit();

    return sendSuccess(res, {
      code: 201,
      message: 'Tải CV PDF lên kho lưu trữ thành công.',
      data: {
        resume_id: result.insertId,
        resume_title: title,
        file_url: req.savedCvUrl,
        is_default: isDefault
      }
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.warn('[CV UPLOAD ROLLBACK] Lỗi rollback:', rbErr.message);
      }
    }

    // 2. DỌN DẸP TỆP RÁC: Nếu bước kết nối DB hoặc ghi Database thất bại, xóa ngay file PDF vừa tải lên ổ đĩa
    //    để tránh tình trạng rác đĩa khi database không ghi nhận CV này
    if (req.savedCvUrl || req.savedCvPath) {
      try {
        const filePath = req.savedCvPath || path.join(__dirname, '../../', req.savedCvUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.warn('[CV UPLOAD CLEANUP] Không thể xóa tệp rác khi DB lỗi:', cleanupErr.message);
      }
    }

    return sendError(res, { code: 500, message: 'Lỗi lưu CV: ' + err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// PATCH /api/v1/candidate/resumes/:id/default
router.patch('/resumes/:id/default', async (req, res) => {
  let conn = null;
  try {
    const resumeId = Number(req.params.id);
    const userId = req.user.user_id;

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return sendError(res, { code: 400, message: 'Mã định danh CV không hợp lệ.' });
    }

    // Đưa việc lấy connection vào bên trong khối try để bảo đảm giải phóng an toàn
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Khóa bi quan (Pessimistic Locking) trên dòng người dùng trong bảng `users`
    //    Tuần tự hóa (serialize) các thao tác cập nhật của cùng một user,
    //    ngăn chặn hoàn toàn hai yêu cầu đặt CV mặc định đồng thời gây xung đột Race Condition
    //    hoặc vi phạm ràng buộc UNIQUE trên cột ảo default_user_id (ER_DUP_ENTRY).
    const [userLock] = await conn.query(
      'SELECT user_id FROM users WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (userLock.length === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Không tìm thấy tài khoản người dùng.' });
    }

    // 2. Kiểm tra CV mục tiêu có tồn tại trong kho của ứng viên không
    const [targetResume] = await conn.query(
      'SELECT resume_id, is_default FROM resumes WHERE resume_id = ? AND user_id = ?',
      [resumeId, userId]
    );

    if (targetResume.length === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Không tìm thấy CV trong kho lưu trữ của bạn.' });
    }

    // Nếu CV này vốn đã là mặc định thì commit và trả về kết quả ngay
    if (targetResume[0].is_default === 1) {
      await conn.commit();
      return sendSuccess(res, {
        message: 'CV này hiện đã là CV mặc định.',
        data: { resume_id: resumeId, is_default: 1 }
      });
    }

    // 3. Đưa tất cả CV của ứng viên về trạng thái không mặc định (is_default = 0)
    await conn.query('UPDATE resumes SET is_default = 0 WHERE user_id = ?', [userId]);

    // 4. Kích hoạt CV được chọn làm mặc định (is_default = 1)
    await conn.query('UPDATE resumes SET is_default = 1 WHERE resume_id = ? AND user_id = ?', [resumeId, userId]);

    await conn.commit();

    return sendSuccess(res, {
      message: 'Đã đặt làm CV mặc định thành công.',
      data: { resume_id: resumeId, is_default: 1 }
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.warn('[DEFAULT CV ROLLBACK] Lỗi rollback:', rbErr.message);
      }
    }
    return sendError(res, { code: 500, message: 'Lỗi cập nhật CV mặc định: ' + err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// DELETE /api/v1/candidate/resumes/:id
router.delete('/resumes/:id', async (req, res) => {
  let conn = null;
  try {
    const resumeId = Number(req.params.id);
    const userId = req.user.user_id;

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return sendError(res, { code: 400, message: 'Mã định danh CV không hợp lệ.' });
    }

    // Đưa việc lấy connection vào bên trong khối try
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Khóa bi quan trên dòng người dùng để tuần tự hóa toàn bộ thao tác với kho CV
    const [userLock] = await conn.query(
      'SELECT user_id FROM users WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (userLock.length === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Không tìm thấy tài khoản người dùng.' });
    }

    // 2. Kiểm tra CV cần xóa và lấy thông tin file_url, is_default
    const [rows] = await conn.query(
      'SELECT file_url, is_default FROM resumes WHERE resume_id = ? AND user_id = ? FOR UPDATE',
      [resumeId, userId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Không tìm thấy CV hoặc bạn không có quyền xóa CV này.' });
    }

    const { file_url, is_default } = rows[0];

    // 3. Thực hiện xóa dòng CV khỏi bảng `resumes` trong Transaction
    await conn.query('DELETE FROM resumes WHERE resume_id = ? AND user_id = ?', [resumeId, userId]);

    // 4. Nếu vừa xóa CV mặc định, tự động chuyển CV mới nhất còn lại làm mặc định
    //    Tất cả nằm trong CÙNG MỘT TRANSACTION để đảm bảo tính toàn vẹn tuyệt đối (ACID)
    let newDefaultResumeId = null;
    if (is_default === 1) {
      const [remaining] = await conn.query(
        'SELECT resume_id FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1 FOR UPDATE',
        [userId]
      );
      if (remaining.length > 0) {
        newDefaultResumeId = remaining[0].resume_id;
        await conn.query('UPDATE resumes SET is_default = 1 WHERE resume_id = ? AND user_id = ?', [
          newDefaultResumeId,
          userId
        ]);
      }
    }

    // 5. Xác nhận giao dịch thành công (Commit)
    await conn.commit();

    // 6. Xóa tệp vật lý trên ổ đĩa CHỈ KHI không còn đơn ứng tuyển nào tham chiếu tới
    //    (Giúp nhà tuyển dụng tiếp tục mở xem bản chụp CV bất biến của các đơn ứng tuyển trước đây)
    if (file_url) {
      try {
        const [inUseInApplications] = await pool.query(
          'SELECT 1 FROM applications WHERE resume_snapshot_url = ? LIMIT 1',
          [file_url]
        );
        const [inUseInResumes] = await pool.query(
          'SELECT 1 FROM resumes WHERE file_url = ? LIMIT 1',
          [file_url]
        );

        if (inUseInApplications.length === 0 && inUseInResumes.length === 0) {
          const filePath = path.join(__dirname, '../../', file_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } else {
          console.info(`[CV DELETE] Giữ lại file vật lý ${file_url} trên đĩa vì đang được đơn ứng tuyển tham chiếu.`);
        }
      } catch (fileErr) {
        console.warn('[CV DELETE] Lỗi kiểm tra / xóa tệp vật lý trên đĩa:', fileErr.message);
      }
    }

    return sendSuccess(res, {
      message: 'Đã xóa CV khỏi kho lưu trữ thành công.',
      data: {
        deleted_resume_id: resumeId,
        new_default_resume_id: newDefaultResumeId
      }
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.warn('[CV DELETE ROLLBACK] Lỗi rollback:', rbErr.message);
      }
    }
    return sendError(res, { code: 500, message: 'Lỗi xóa CV: ' + err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// GET /api/v1/candidate/resumes/:id/download
// API tải tệp CV có xác thực & kiểm tra quyền sở hữu của ứng viên
router.get('/resumes/:id/download', async (req, res) => {
  try {
    const resumeId = Number(req.params.id);
    const userId = req.user.user_id;

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return sendError(res, { code: 400, message: 'Mã định danh CV không hợp lệ.' });
    }

    const [rows] = await pool.query(
      'SELECT resume_title, file_url FROM resumes WHERE resume_id = ? AND user_id = ? LIMIT 1',
      [resumeId, userId]
    );

    if (rows.length === 0) {
      return sendError(res, { code: 404, message: 'Không tìm thấy CV trong kho lưu trữ của bạn.' });
    }

    const { resume_title, file_url } = rows[0];
    const fileName = path.basename(file_url);
    const filePath = path.join(__dirname, '../../uploads/cv', fileName);

    if (!fs.existsSync(filePath)) {
      return sendError(res, { code: 404, message: 'Tệp CV không tồn tại trên máy chủ lưu trữ.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const safeTitle = (resume_title || 'CV').replace(/[^\w\s\.\-]/gi, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải tệp CV: ' + err.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * 2. LỊCH SỬ ĐƠN ỨNG TUYỂN & TIẾN TRÌNH 4 BƯỚC (Bảng `applications`)
 * ----------------------------------------------------------------------------
 */

// GET /api/v1/candidate/applications
router.get('/applications', async (req, res) => {
  try {
    const { status } = req.query;
    const params = [req.user.user_id];
    let statusFilter = '';

    if (status && ['pending', 'viewed', 'interview', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      statusFilter = 'AND a.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT a.application_id, a.job_id, a.resume_id, a.resume_snapshot_url, a.cover_letter,
              a.status, a.applied_at, a.viewed_at,
              j.title AS job_title, j.slug AS job_slug, j.salary_min, j.salary_max, j.currency,
              j.employment_type, j.experience_level, j.deadline,
              c.company_name, c.logo_url, l.location_name
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       INNER JOIN companies c ON j.company_id = c.company_id
       INNER JOIN locations l ON j.location_id = l.location_id
       WHERE a.user_id = ? ${statusFilter}
       ORDER BY a.applied_at DESC`,
      params
    );

    return sendSuccess(res, { message: 'Tải danh sách đơn ứng tuyển thành công.', data: rows });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải đơn ứng tuyển: ' + err.message });
  }
});

// DELETE /api/v1/candidate/applications/:id (Rút đơn ứng tuyển — Cập nhật trạng thái 'withdrawn' để lưu giữ lịch sử)
const handleWithdrawApplication = async (req, res) => {
  let conn = null;
  try {
    const applicationId = Number(req.params.id);
    const userId = req.user.user_id;

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return sendError(res, { code: 400, message: 'Mã đơn ứng tuyển không hợp lệ.' });
    }

    // Đưa việc rút đơn vào MySQL Transaction và khóa bi quan dòng đơn ứng tuyển
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Khóa dòng đơn ứng tuyển bằng SELECT ... FOR UPDATE
    // Ngăn ngừa xung đột đồng thời (Race Condition) khi nhà tuyển dụng đang đồng thời xét duyệt đơn sang accepted/rejected
    const [rows] = await conn.query(
      'SELECT application_id, status FROM applications WHERE application_id = ? AND user_id = ? FOR UPDATE',
      [applicationId, userId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Không tìm thấy đơn ứng tuyển để rút.' });
    }

    const currentStatus = rows[0].status;
    if (currentStatus === 'withdrawn') {
      await conn.rollback();
      return sendError(res, { code: 400, message: 'Đơn ứng tuyển này đã được rút trước đó.' });
    }

    if (currentStatus === 'accepted' || currentStatus === 'rejected') {
      await conn.rollback();
      return sendError(res, {
        code: 400,
        message: 'Đơn ứng tuyển đã hoàn tất xét duyệt (' + (currentStatus === 'accepted' ? 'Trúng tuyển' : 'Chưa phù hợp') + '), không thể rút đơn.'
      });
    }

    // Cập nhật trạng thái 'withdrawn' để lưu giữ lịch sử theo thống nhất của nhóm trong cùng Transaction
    const [result] = await conn.query(
      'UPDATE applications SET status = ? WHERE application_id = ? AND user_id = ?',
      ['withdrawn', applicationId, userId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return sendError(res, { code: 404, message: 'Rút đơn ứng tuyển không thành công.' });
    }

    await conn.commit();

    return sendSuccess(res, {
      message: 'Đã rút đơn ứng tuyển thành công. Đơn được lưu vào lịch sử với trạng thái Đã rút.',
      data: { application_id: applicationId, status: 'withdrawn' }
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.warn('[WITHDRAW APPLICATION ROLLBACK] Lỗi rollback:', rbErr.message);
      }
    }
    return sendError(res, { code: 500, message: 'Lỗi rút đơn ứng tuyển: ' + err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

router.delete('/applications/:id', handleWithdrawApplication);
router.patch('/applications/:id/withdraw', handleWithdrawApplication);

/**
 * ----------------------------------------------------------------------------
 * 3. DANH SÁCH VIỆC LÀM ĐÃ LƯU (Bảng `saved_jobs`)
 * ----------------------------------------------------------------------------
 */

// GET /api/v1/candidate/saved-jobs
router.get('/saved-jobs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.job_id, s.saved_at,
              j.title, j.slug, j.salary_min, j.salary_max, j.currency,
              j.employment_type, j.experience_level, j.deadline, j.status AS job_status,
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

// POST /api/v1/candidate/saved-jobs/:jobId
router.post('/saved-jobs/:jobId', async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user.user_id;

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã việc làm không hợp lệ.' });
    }

    const [jobRows] = await pool.query('SELECT job_id FROM jobs WHERE job_id = ? LIMIT 1', [jobId]);
    if (jobRows.length === 0) {
      return sendError(res, { code: 404, message: 'Việc làm không tồn tại.' });
    }

    // Kiểm tra trường hợp lưu trùng việc làm
    const [existing] = await pool.query(
      'SELECT 1 FROM saved_jobs WHERE user_id = ? AND job_id = ? LIMIT 1',
      [userId, jobId]
    );

    if (existing.length > 0) {
      return sendSuccess(res, {
        code: 200,
        message: 'Bạn đã lưu việc làm này vào danh sách yêu thích trước đó.',
        data: { job_id: jobId, is_already_saved: true }
      });
    }

    await pool.query('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [userId, jobId]);

    return sendSuccess(res, {
      code: 201,
      message: 'Đã lưu việc làm vào danh sách yêu thích thành công.',
      data: { job_id: jobId }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendSuccess(res, {
        code: 200,
        message: 'Bạn đã lưu việc làm này vào danh sách yêu thích trước đó.',
        data: { job_id: Number(req.params.jobId), is_already_saved: true }
      });
    }
    return sendError(res, { code: 500, message: 'Lỗi lưu việc làm: ' + err.message });
  }
});

// DELETE /api/v1/candidate/saved-jobs/:jobId
router.delete('/saved-jobs/:jobId', async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user.user_id;

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã việc làm không hợp lệ.' });
    }

    const [result] = await pool.query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId]);

    if (result.affectedRows === 0) {
      return sendError(res, { code: 404, message: 'Việc làm này chưa có trong danh sách lưu.' });
    }

    return sendSuccess(res, { message: 'Đã bỏ lưu việc làm thành công.', data: { job_id: jobId } });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi bỏ lưu việc làm: ' + err.message });
  }
});

module.exports = router;
