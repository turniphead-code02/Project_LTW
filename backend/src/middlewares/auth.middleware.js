/**
 * ============================================================================
 * MIDDLEWARE XÁC THỰC JWT & PHÂN QUYỀN ĐA VAI TRÒ (RBAC)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003) & LÊ HOÀNG THIÊN HƯƠNG (042303000056)
 * Hỗ trợ 3 vai trò trong bảng `users`: 'candidate', 'employer', 'admin'
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'uth_nhom6_jobportal_access_secret_2026';

/**
 * Xác thực người dùng đã đăng nhập qua Header `Authorization: Bearer <token>`
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return sendError(res, {
      code: 401,
      message: 'Vui lòng đăng nhập để thực hiện thao tác này.'
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; // { user_id, email, role, full_name }
    return next();
  } catch (err) {
    return sendError(res, {
      code: 401,
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.'
    });
  }
}

/**
 * Kiểm tra phân quyền theo danh sách vai trò cho phép
 * Ví dụ: requireRole('employer', 'admin')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { code: 401, message: 'Chưa xác thực người dùng.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        code: 403,
        message: 'Bạn không có quyền truy cập tài nguyên này.'
      });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  ACCESS_SECRET
};
