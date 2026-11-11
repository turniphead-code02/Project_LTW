/**
 * ============================================================================
 * MODULE 5: XÁC THỰC ĐA VAI TRÒ (AUTH) & BẢNG ĐIỀU KHIỂN QUẢN TRỊ (ADMIN PORTAL)
 * Thành viên phụ trách: LÊ HOÀNG THIÊN HƯƠNG (MSSV: 042303000056)
 * Nhánh Git: feature/module5-auth-admin
 * Bảng CSDL sử dụng: users, companies, jobs
 * Giao diện kết nối: auth.html, admin-portal.html, auth-validation.js, admin.js
 * ============================================================================
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole, ACCESS_SECRET } = require('../middlewares/auth.middleware');

/**
 * 1. PHÂN HỆ XÁC THỰC (`/api/v1/auth/*`)
 */
router.post('/auth/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { full_name, email, password, phone = null, role = 'candidate', company_name } = req.body;
    if (!full_name || !email || !password) {
      return sendError(res, { code: 400, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.' });
    }

    const safeRole = role === 'employer' ? 'employer' : 'candidate';
    const passwordHash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();
    const [userRes] = await conn.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.trim().toLowerCase(), passwordHash, phone, safeRole, 'active']
    );

    if (safeRole === 'employer') {
      const compName = (company_name || full_name).trim();
      const slug =
        compName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-') +
        '-' +
        userRes.insertId;

      await conn.query(
        'INSERT INTO companies (user_id, company_name, slug) VALUES (?, ?, ?)',
        [userRes.insertId, compName, slug]
      );
    }

    await conn.commit();
    return sendSuccess(res, {
      code: 201,
      message: 'Đăng ký tài khoản thành công.',
      data: { user_id: userRes.insertId, email: email.trim().toLowerCase(), role: safeRole }
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, { code: 400, message: 'Email này đã được đăng ký trong hệ thống.' });
    }
    return sendError(res, { code: 500, message: 'Lỗi đăng ký tài khoản: ' + err.message });
  } finally {
    conn.release();
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, { code: 400, message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const [users] = await pool.query(
      'SELECT user_id, full_name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if (!users.length) {
      return sendError(res, { code: 401, message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = users[0];
    if (user.status === 'locked') {
      return sendError(res, { code: 403, message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.' });
    }

    // Hỗ trợ tương thích cả hash $2y$ của PHP/MySQL seed_data.sql và $2a$/$2b$ của Node.js
    const normalizedHash = user.password_hash.replace(/^\$2y\$/, '$2a$');
    const isMatch = await bcrypt.compare(password, normalizedHash);
    if (!isMatch) {
      return sendError(res, { code: 401, message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
      ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '24h' }
    );

    return sendSuccess(res, {
      message: 'Đăng nhập thành công.',
      data: {
        accessToken,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi đăng nhập: ' + err.message });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  return sendSuccess(res, { message: 'Thông tin phiên đăng nhập hiện tại.', data: req.user });
});

/**
 * 2. PHÂN HỆ QUẢN TRỊ HỆ THỐNG (`/api/v1/admin/*`)
 */
router.get('/admin/overview', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [employers] = await pool.query(`
      SELECT c.company_id, c.company_name, c.tax_code, c.website, c.created_at,
             u.user_id, u.full_name, u.email, u.status AS user_status
      FROM companies c
      INNER JOIN users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
    `);

    const [jobs] = await pool.query(`
      SELECT j.job_id, j.title, j.salary_min, j.salary_max, j.status, j.reject_reason, j.created_at,
             c.company_name
      FROM jobs j
      INNER JOIN companies c ON j.company_id = c.company_id
      ORDER BY j.created_at DESC
    `);

    return sendSuccess(res, {
      message: 'Tải dữ liệu quản trị hệ thống thành công.',
      data: { employers, jobs }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải dữ liệu Admin: ' + err.message });
  }
});

router.patch('/admin/jobs/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const { status, reject_reason = null } = req.body;
    if (!['approved', 'rejected', 'pending', 'closed'].includes(status)) {
      return sendError(res, { code: 400, message: 'Trạng thái duyệt tin không hợp lệ.' });
    }

    await pool.query('UPDATE jobs SET status = ?, reject_reason = ? WHERE job_id = ?', [
      status,
      status === 'rejected' ? reject_reason : null,
      jobId
    ]);

    return sendSuccess(res, {
      message: status === 'approved' ? 'Đã phê duyệt tin tuyển dụng.' : 'Đã từ chối tin tuyển dụng.',
      data: { job_id: jobId, status, reject_reason }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi kiểm duyệt tin tuyển dụng: ' + err.message });
  }
});

router.patch('/admin/users/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;
    if (!['active', 'locked'].includes(status)) {
      return sendError(res, { code: 400, message: 'Trạng thái tài khoản không hợp lệ.' });
    }

    await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    return sendSuccess(res, {
      message: 'Đã cập nhật trạng thái tài khoản.',
      data: { user_id: userId, status }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi cập nhật tài khoản: ' + err.message });
  }
});

module.exports = router;
