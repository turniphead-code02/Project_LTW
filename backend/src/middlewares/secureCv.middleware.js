/**
 * ============================================================================
 * MIDDLEWARE BẢO MẬT TỆP CV RIÊNG TƯ (MỤC 2.2 & 5.1 ĐẶC TẢ KỸ THUẬT)
 * Ngăn chặn truy cập công khai không xác thực vào thư mục /uploads/cv/
 * Kiểm soát quyền truy cập chi tiết theo vai trò (RBAC):
 *   - Admin: Toàn quyền truy cập mọi tệp CV
 *   - Candidate: Chỉ xem được CV trong kho của mình hoặc bản chụp đơn ứng tuyển của chính mình
 *   - Employer: Chỉ xem được CV thuộc các đơn ứng tuyển nộp vào vị trí việc làm của công ty mình
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { sendError } = require('../utils/response');
const { ACCESS_SECRET } = require('./auth.middleware');

const UPLOAD_CV_DIR = path.join(__dirname, '../../uploads/cv');

/**
 * Trích xuất Access Token từ nhiều nguồn:
 * 1. Header `Authorization: Bearer <token>`
 * 2. Query param `?token=<token>` (hỗ trợ khi mở qua thẻ <a> hoặc window.open trên tab mới)
 * 3. Cookie `req.cookies.jobportal_access_token` hoặc `req.cookies.token`
 */
function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.query && req.query.token) {
    return String(req.query.token).trim();
  }
  if (req.cookies) {
    return req.cookies.jobportal_access_token || req.cookies.token || null;
  }
  return null;
}

/**
 * Handler bảo mật phục vụ tệp CV có xác thực và phân quyền
 */
async function serveSecureCv(req, res) {
  // 1. Trích xuất token xác thực
  const token = extractToken(req);
  if (!token) {
    return sendError(res, {
      code: 401,
      message: 'Vui lòng đăng nhập để xem hoặc tải tệp CV.'
    });
  }

  // 2. Xác thực tính hợp lệ của JWT
  let user;
  try {
    user = jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return sendError(res, {
      code: 401,
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.'
    });
  }

  // 3. Vệ sinh tên tệp chống tấn công Path Traversal (Directory Traversal)
  const rawFileName = req.params.fileName || req.path.replace(/^\//, '');
  const fileName = path.basename(rawFileName);

  if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
    return sendError(res, {
      code: 400,
      message: 'Tên tệp CV không hợp lệ hoặc không phải định dạng PDF.'
    });
  }

  // 4. Kiểm tra tệp vật lý có tồn tại trên máy chủ lưu trữ không
  const filePath = path.join(UPLOAD_CV_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return sendError(res, {
      code: 404,
      message: 'Không tìm thấy tệp CV trên máy chủ lưu trữ.'
    });
  }

  // 5. Kiểm tra quyền sở hữu & phân quyền dữ liệu (RBAC) trong CSDL
  try {
    // A. Quản trị viên hệ thống (Admin): Có toàn quyền xem và kiểm duyệt CV
    if (user.role === 'admin') {
      return sendPdf(res, filePath, fileName);
    }

    const filePattern = `%${fileName}%`;

    // B. Ứng viên (Candidate): Chỉ xem CV thuộc kho CV của mình hoặc bản chụp đơn ứng tuyển của chính mình
    if (user.role === 'candidate') {
      const [owned] = await pool.query(
        `SELECT 1 FROM resumes WHERE user_id = ? AND file_url LIKE ?
         UNION
         SELECT 1 FROM applications WHERE user_id = ? AND resume_snapshot_url LIKE ?
         LIMIT 1`,
        [user.user_id, filePattern, user.user_id, filePattern]
      );

      if (owned.length === 0) {
        return sendError(res, {
          code: 403,
          message: 'Bạn không có quyền truy cập tệp CV này.'
        });
      }

      return sendPdf(res, filePath, fileName);
    }

    // C. Nhà tuyển dụng (Employer): Chỉ xem CV nộp vào tin tuyển dụng thuộc công ty của mình
    if (user.role === 'employer') {
      const [allowed] = await pool.query(
        `SELECT 1
         FROM applications a
         INNER JOIN jobs j ON a.job_id = j.job_id
         INNER JOIN companies c ON j.company_id = c.company_id
         WHERE c.user_id = ? AND a.resume_snapshot_url LIKE ?
         LIMIT 1`,
        [user.user_id, filePattern]
      );

      if (allowed.length === 0) {
        return sendError(res, {
          code: 403,
          message: 'Bạn không có quyền xem tệp CV thuộc đơn ứng tuyển này.'
        });
      }

      return sendPdf(res, filePath, fileName);
    }

    return sendError(res, { code: 403, message: 'Vai trò tài khoản không có quyền truy cập tệp CV này.' });
  } catch (dbErr) {
    return sendError(res, { code: 500, message: 'Lỗi kiểm tra quyền truy cập CV: ' + dbErr.message });
  }
}

/**
 * Gửi file PDF về cho trình duyệt với các HTTP Headers an toàn
 */
function sendPdf(res, filePath, fileName) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
}

module.exports = {
  serveSecureCv,
  extractToken
};
