/**
 * ============================================================================
 * MODULE 4: KHÔNG GIAN NHÀ TUYỂN DỤNG (HR CONSOLE), ĐĂNG TIN & DUYỆT HỒ SƠ
 * Thành viên phụ trách: ĐINH DUY DIỄN (MSSV: 051206000952)
 * Nhánh Git: dinh_dien / module_4_DinhDuyDien
 * Bảng CSDL sử dụng: companies, jobs, applications, users, categories, locations
 * Giao diện kết nối: employer-dashboard.html, post-job.html, candidate-management.html
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth, requireRole('employer', 'admin'));

/**
 * Hàm phụ trợ lấy company_id từ user_id của HR đang đăng nhập
 */
async function getEmployerCompanyId(userId) {
  const [rows] = await pool.query('SELECT company_id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
  return rows.length ? rows[0].company_id : null;
}

/**
 * GET /api/v1/employer/dashboard
 * Thống kê KPI, danh sách tin đang tuyển và hồ sơ ứng viên mới nhận của doanh nghiệp
 */
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = await getEmployerCompanyId(req.user.user_id);
    if (!companyId) {
      return sendError(res, { code: 404, message: 'Tài khoản HR chưa được liên kết với hồ sơ công ty.' });
    }

    const [[activeJobs]] = await pool.query(
      "SELECT COUNT(*) AS count FROM jobs WHERE company_id = ? AND status = 'approved' AND deadline >= CURDATE()",
      [companyId]
    );
    const [[totalApps]] = await pool.query(
      `SELECT COUNT(*) AS count FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       WHERE j.company_id = ?`,
      [companyId]
    );
    const [[interviews]] = await pool.query(
      `SELECT COUNT(*) AS count FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       WHERE j.company_id = ? AND a.status = 'interview'`,
      [companyId]
    );

    const [jobs] = await pool.query(
      `SELECT j.job_id, j.title, j.deadline, j.status, l.location_name,
              COUNT(a.application_id) AS applications_count
       FROM jobs j
       INNER JOIN locations l ON j.location_id = l.location_id
       LEFT JOIN applications a ON a.job_id = j.job_id
       WHERE j.company_id = ?
       GROUP BY j.job_id
       ORDER BY j.created_at DESC`,
      [companyId]
    );

    const [recentApplicants] = await pool.query(
      `SELECT a.application_id, a.status, a.applied_at, a.resume_snapshot_url, a.cover_letter,
              u.full_name, u.email, u.phone,
              j.job_id, j.title AS job_title
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       INNER JOIN users u ON a.user_id = u.user_id
       WHERE j.company_id = ?
       ORDER BY a.applied_at DESC
       LIMIT 10`,
      [companyId]
    );

    return sendSuccess(res, {
      message: 'Tải dữ liệu Bảng điều khiển Nhà tuyển dụng thành công.',
      data: {
        kpis: {
          activeJobs: activeJobs.count,
          newApplications: totalApps.count,
          interviews: interviews.count
        },
        jobs,
        recentApplicants
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải dashboard nhà tuyển dụng: ' + err.message });
  }
});

/**
 * POST /api/v1/employer/jobs
 * Nhà tuyển dụng đăng tin tuyển dụng mới (mặc định status = 'pending' chờ Admin duyệt)
 */
router.post('/jobs', async (req, res) => {
  try {
    const companyId = await getEmployerCompanyId(req.user.user_id);
    if (!companyId) {
      return sendError(res, { code: 404, message: 'Chưa có thông tin công ty cho tài khoản này.' });
    }

    const {
      title,
      category_id = 1,
      location_id = 1,
      description,
      requirements = '',
      benefits = '',
      salary_min = null,
      salary_max = null,
      employment_type = 'full_time',
      experience_level = 'junior',
      deadline
    } = req.body;

    if (!title || !description || !deadline) {
      return sendError(res, { code: 400, message: 'Vui lòng nhập đầy đủ chức danh, mô tả và hạn nộp.' });
    }

    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString().slice(-5);

    const [result] = await pool.query(
      `INSERT INTO jobs
        (company_id, category_id, location_id, title, slug, description, requirements, benefits,
         salary_min, salary_max, employment_type, experience_level, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        companyId,
        Number(category_id),
        Number(location_id),
        title.trim(),
        slug,
        description,
        requirements || description,
        benefits,
        salary_min ? Number(salary_min) : null,
        salary_max ? Number(salary_max) : null,
        employment_type,
        experience_level,
        deadline
      ]
    );

    return sendSuccess(res, {
      code: 201,
      message: 'Đã gửi tin tuyển dụng mới, đang chờ Quản trị viên kiểm duyệt.',
      data: { job_id: result.insertId, slug, status: 'pending' }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi đăng tin tuyển dụng: ' + err.message });
  }
});

/**
 * PATCH /api/v1/employer/applications/:id/status
 * Cập nhật trạng thái hồ sơ ứng viên ('viewed', 'interview', 'accepted', 'rejected')
 */
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    const { status } = req.body;
    const validStatuses = ['pending', 'viewed', 'interview', 'accepted', 'rejected'];

    if (!validStatuses.includes(status)) {
      return sendError(res, { code: 400, message: 'Trạng thái hồ sơ không hợp lệ.' });
    }

    await pool.query(
      'UPDATE applications SET status = ?, viewed_at = COALESCE(viewed_at, NOW()) WHERE application_id = ?',
      [status, applicationId]
    );

    return sendSuccess(res, {
      message: 'Đã cập nhật trạng thái hồ sơ ứng viên.',
      data: { application_id: applicationId, status }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi cập nhật trạng thái ứng viên: ' + err.message });
  }
});

module.exports = router;
