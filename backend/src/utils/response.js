/**
 * ============================================================================
 * TIỆN ÍCH ĐÓNG GÓI PHẢN HỒI CHUẨN JSON ENVELOPE (MỤC 4.1 ĐẶC TẢ KỸ THUẬT)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * ============================================================================
 */

function sendSuccess(res, { code = 200, message = 'Thành công', data = null, meta = null }) {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
    errors: null,
    meta
  });
}

function sendError(res, { code = 400, message = 'Yêu cầu không hợp lệ', errors = null }) {
  return res.status(code).json({
    success: false,
    code,
    message,
    data: null,
    errors,
    meta: null
  });
}

module.exports = {
  sendSuccess,
  sendError
};
