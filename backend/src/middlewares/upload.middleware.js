/**
 * ============================================================================
 * MIDDLEWARE KIỂM ĐỊNH TỆP CV PDF AN TOÀN (MỤC 5.1 ĐẶC TẢ KỸ THUẬT)
 * Kiểm tra định dạng .pdf, kích thước <= 5MB và Magic Bytes nhị phân "%PDF-"
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { sendError } = require('../utils/response');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/cv');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Tối đa 5MB
});

/**
 * Kiểm tra 5 byte đầu tiên của Buffer có đúng chữ ký "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
 */
function validatePdfMagicBytes(req, res, next) {
  if (!req.file) {
    return sendError(res, { code: 400, message: 'Vui lòng đính kèm tệp CV định dạng PDF.' });
  }

  const ext = path.extname(req.file.originalname || '').toLowerCase();
  if (ext !== '.pdf' || req.file.mimetype !== 'application/pdf') {
    return sendError(res, { code: 400, message: 'Chỉ chấp nhận tệp có định dạng .pdf chuẩn.' });
  }

  const headerSignature = req.file.buffer.subarray(0, 5).toString('ascii');
  if (headerSignature !== '%PDF-') {
    return sendError(res, {
      code: 400,
      message: 'Tệp tải lên không hợp lệ (không đúng chữ ký nhị phân %PDF-).'
    });
  }

  // Lưu tệp với tên ngẫu nhiên chống ghi đè & chống RCE
  const safeFileName = `cv_${crypto.randomUUID()}.pdf`;
  const fullPath = path.join(UPLOAD_DIR, safeFileName);
  fs.writeFileSync(fullPath, req.file.buffer);

  req.savedCvUrl = `/uploads/cv/${safeFileName}`;
  req.savedCvOriginalName = req.file.originalname;
  return next();
}

module.exports = {
  uploadMemory,
  validatePdfMagicBytes
};
