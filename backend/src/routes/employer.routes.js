/**
 * ============================================================================
 * MODULE 4: KHÔNG GIAN NHÀ TUYỂN DỤNG & QUẢN LÝ TIN ĐĂNG
 * Thành viên phụ trách: ĐINH DUY DIỄN (MSSV: 051206000952)
 * Nhánh Git: dinh_dien
 * Bảng CSDL sử dụng: companies, jobs, applications, users, categories, locations
 * Giao diện kết nối: employer-dashboard.html, post-job.html, candidate-management.html
  * ============================================================================
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Chỉ tài khoản có vai trò nhà tuyển dụng mới được vào các route bên dưới
router.use(requireAuth, requireRole('employer'));

const ALLOWED_APP_STATUS = ['viewed', 'interview', 'accepted', 'rejected'];
const LATER_THAN_VIEWED = ['interview', 'accepted', 'rejected'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'internship', 'remote'];
const EXPERIENCE_LEVELS = ['intern', 'fresher', 'junior', 'middle', 'senior', 'lead'];

/** Lấy company_id của nhà tuyển dụng đang đăng nhập (null nếu chưa có hồ sơ công ty). */
async function getCompanyId(userId) {
  const [rows] = await pool.query('SELECT company_id FROM companies WHERE user_id = ? LIMIT 1', [userId]);
  return rows.length ? rows[0].company_id : null;
}

/** "Kỹ sư Frontend (React)" -> "ky-su-frontend-react-a8f12d" (không dấu, kebab-case, có hậu tố duy nhất). */
function toSlug(title) {
  const base = String(title)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return (base || 'tin-tuyen-dung') + '-' + crypto.randomBytes(3).toString('hex');
}

function toBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

const NO_COMPANY = { code: 403, message: 'Tài khoản chưa có hồ sơ công ty. Vui lòng liên hệ quản trị viên.' };

async function validateJobPayload(b) {
  const errors = [];
  const title = String(b.title || '').trim();
  if (title.length < 5 || title.length > 200) {
    errors.push({ field: 'title', message: 'Chức danh cần từ 5 đến 200 ký tự.' });
  }

  const categoryId = Number(b.category_id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors.push({ field: 'category_id', message: 'Vui lòng chọn ngành nghề.' });
  }

  const locationId = Number(b.location_id);
  if (!Number.isInteger(locationId) || locationId <= 0) {
    errors.push({ field: 'location_id', message: 'Vui lòng chọn địa điểm làm việc.' });
  }

  const employmentType = String(b.employment_type || 'full_time');
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    errors.push({ field: 'employment_type', message: 'Hình thức làm việc không hợp lệ.' });
  }

  const experienceLevel = String(b.experience_level || 'junior');
  if (!EXPERIENCE_LEVELS.includes(experienceLevel)) {
    errors.push({ field: 'experience_level', message: 'Cấp bậc kinh nghiệm không hợp lệ.' });
  }

  const negotiable = toBool(b.is_negotiable);
  let salaryMin = null;
  let salaryMax = null;
  if (!negotiable) {
    salaryMin = Number(b.salary_min);
    salaryMax = Number(b.salary_max);
    if (!(salaryMin > 0) || !(salaryMax >= salaryMin)) {
      errors.push({ field: 'salary_max', message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.' });
    }
  }

  const deadline = String(b.deadline || '');
  const deadlineDate = new Date(deadline + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(deadlineDate) || deadlineDate <= today) {
    errors.push({ field: 'deadline', message: 'Hạn nộp hồ sơ phải từ ngày mai trở đi.' });
  }

  const description = String(b.description || '').trim();
  if (description.length < 30 || description.length > 10000) {
    errors.push({ field: 'description', message: 'Mô tả cần từ 30 đến 10.000 ký tự.' });
  }

  const requirements = String(b.requirements || '').trim();
  if (requirements.length < 10 || requirements.length > 10000) {
    errors.push({ field: 'requirements', message: 'Yêu cầu ứng viên cần từ 10 đến 10.000 ký tự.' });
  }

  const benefitsRaw = String(b.benefits || '').trim();
  if (benefitsRaw.length > 10000) {
    errors.push({ field: 'benefits', message: 'Quyền lợi tối đa 10.000 ký tự.' });
  }
  const benefits = benefitsRaw || null;

  if (!errors.length) {
    const [cat] = await pool.query('SELECT 1 FROM categories WHERE category_id = ? LIMIT 1', [categoryId]);
    const [loc] = await pool.query('SELECT 1 FROM locations WHERE location_id = ? LIMIT 1', [locationId]);
    if (!cat.length) errors.push({ field: 'category_id', message: 'Ngành nghề không tồn tại.' });
    if (!loc.length) errors.push({ field: 'location_id', message: 'Địa điểm không tồn tại.' });
  }

  return {
    errors,
    data: { title, categoryId, locationId, employmentType, experienceLevel, salaryMin, salaryMax, deadline, description, requirements, benefits }
  };
}

async function getInitialJobStatus() {
  try {
    const [cfg] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'require_job_approval' LIMIT 1"
    );
    if (cfg.length && cfg[0].setting_value === '0') return 'approved';
  } catch (_) {}
  return 'pending';
}

/**
 * 0. DANH MỤC CHO FORM ĐĂNG TIN (ngành nghề + địa điểm)
 */
router.get('/meta', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT category_id, category_name FROM categories ORDER BY category_name');
    const [locations] = await pool.query('SELECT location_id, location_name FROM locations ORDER BY location_name');
    return sendSuccess(res, { message: 'Tải danh mục thành công.', data: { categories, locations } });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải danh mục: ' + err.message });
  }
});

/**
 * 1. DASHBOARD: COMPANY + KPI + DANH SÁCH TIN + DANH SÁCH HỒ SƠ ỨNG VIÊN
 */
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const [[company]] = await pool.query(
      `SELECT company_id, company_name, slug, tax_code, logo_url, website, address, description
       FROM companies WHERE company_id = ? LIMIT 1`,
      [companyId]
    );

    const [[k]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM jobs WHERE company_id = ? AND status = 'approved' AND deadline >= CURDATE()) AS active_jobs,
         (SELECT COUNT(*) FROM jobs WHERE company_id = ? AND status = 'pending') AS pending_jobs,
         (SELECT COUNT(*) FROM applications a INNER JOIN jobs j ON a.job_id = j.job_id
            WHERE j.company_id = ?) AS total_applications,
         (SELECT COUNT(*) FROM applications a INNER JOIN jobs j ON a.job_id = j.job_id
            WHERE j.company_id = ? AND a.status = 'interview') AS interviews`,
      [companyId, companyId, companyId, companyId]
    );

    const [jobs] = await pool.query(
      `SELECT j.job_id, j.title, j.slug, j.status, j.reject_reason, j.salary_min, j.salary_max,
              j.employment_type, j.experience_level, DATE_FORMAT(j.deadline, '%Y-%m-%d') AS deadline,
              l.location_name, cat.category_name,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
       FROM jobs j
       INNER JOIN locations l ON j.location_id = l.location_id
       LEFT JOIN categories cat ON j.category_id = cat.category_id
       WHERE j.company_id = ?
       ORDER BY j.job_id DESC
       LIMIT 100`,
      [companyId]
    );

    const [applications] = await pool.query(
      `SELECT a.application_id, a.job_id, a.status, a.applied_at, a.viewed_at, a.cover_letter,
              a.resume_snapshot_url,
              j.title AS job_title,
              u.full_name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       INNER JOIN users u ON a.user_id = u.user_id
       WHERE j.company_id = ?
       ORDER BY a.applied_at DESC
       LIMIT 200`,
      [companyId]
    );

    return sendSuccess(res, {
      message: 'Tải bảng điều khiển nhà tuyển dụng thành công.',
      data: {
        company: company || null,
        kpi: {
          activeJobs: Number(k.active_jobs),
          pendingJobs: Number(k.pending_jobs),
          totalApplications: Number(k.total_applications),
          interviews: Number(k.interviews)
        },
        jobs,
        applications
      }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải bảng điều khiển: ' + err.message });
  }
});

/**
 * 2. ĐĂNG TIN, XEM CHI TIẾT, SỬA, ĐÓNG/MỞ LẠI & XÓA TIN TUYỂN DỤNG
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã tin tuyển dụng không hợp lệ.' });
    }
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const [rows] = await pool.query(
      `SELECT job_id, title, category_id, location_id, employment_type, experience_level,
              salary_min, salary_max, DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
              description, requirements, benefits, status, reject_reason
       FROM jobs WHERE job_id = ? AND company_id = ? LIMIT 1`,
      [jobId, companyId]
    );
    if (!rows.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng.' });
    }
    return sendSuccess(res, { message: 'Tải chi tiết tin thành công.', data: rows[0] });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải tin tuyển dụng: ' + err.message });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const { errors, data: v } = await validateJobPayload(req.body || {});
    if (errors.length) {
      return sendError(res, { code: 400, message: 'Dữ liệu gửi lên không hợp lệ.', errors });
    }

    const initialJobStatus = await getInitialJobStatus();

    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = toSlug(v.title);
      try {
        const [result] = await pool.query(
          `INSERT INTO jobs
             (company_id, category_id, location_id, title, slug, description, requirements, benefits,
              salary_min, salary_max, employment_type, experience_level, deadline, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [companyId, v.categoryId, v.locationId, v.title, slug, v.description, v.requirements, v.benefits,
           v.salaryMin, v.salaryMax, v.employmentType, v.experienceLevel, v.deadline, initialJobStatus]
        );
        return sendSuccess(res, {
          code: 201,
          message: initialJobStatus === 'approved'
            ? 'Đã đăng và công khai tin tuyển dụng ngay lập tức.'
            : 'Đã gửi tin tuyển dụng, đang chờ quản trị viên duyệt.',
          data: { job_id: result.insertId, slug, status: initialJobStatus }
        });
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    return sendError(res, { code: 500, message: 'Không tạo được đường dẫn (slug) duy nhất, vui lòng thử lại.' });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi đăng tin: ' + err.message });
  }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã tin tuyển dụng không hợp lệ.' });
    }
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const [existing] = await pool.query(
      'SELECT job_id, status FROM jobs WHERE job_id = ? AND company_id = ? LIMIT 1',
      [jobId, companyId]
    );
    if (!existing.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng.' });
    }

    const { errors, data: v } = await validateJobPayload(req.body || {});
    if (errors.length) {
      return sendError(res, { code: 400, message: 'Dữ liệu cập nhật không hợp lệ.', errors });
    }

    const nextStatus = await getInitialJobStatus();

    await pool.query(
      `UPDATE jobs
       SET category_id = ?, location_id = ?, title = ?, description = ?, requirements = ?, benefits = ?,
           salary_min = ?, salary_max = ?, employment_type = ?, experience_level = ?, deadline = ?,
           status = ?, reject_reason = NULL
       WHERE job_id = ? AND company_id = ?`,
      [v.categoryId, v.locationId, v.title, v.description, v.requirements, v.benefits,
       v.salaryMin, v.salaryMax, v.employmentType, v.experienceLevel, v.deadline,
       nextStatus, jobId, companyId]
    );

    return sendSuccess(res, {
      message: nextStatus === 'approved'
        ? 'Đã cập nhật tin tuyển dụng thành công.'
        : 'Đã cập nhật tin và gửi lại cho quản trị viên duyệt.',
      data: { job_id: jobId, status: nextStatus }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi cập nhật tin: ' + err.message });
  }
});

router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const nextStatus = String((req.body || {}).status || '').trim();
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã tin tuyển dụng không hợp lệ.' });
    }
    if (!['closed', 'approved'].includes(nextStatus)) {
      return sendError(res, { code: 400, message: 'Chỉ hỗ trợ đóng tin hoặc mở lại tin.' });
    }
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const [rows] = await pool.query(
      'SELECT job_id, status FROM jobs WHERE job_id = ? AND company_id = ? LIMIT 1',
      [jobId, companyId]
    );
    if (!rows.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng.' });
    }
    if (nextStatus === 'approved' && rows[0].status === 'rejected') {
      return sendError(res, { code: 400, message: 'Tin bị từ chối cần chỉnh sửa nội dung trước khi gửi duyệt lại.' });
    }

    const finalStatus = nextStatus === 'approved' ? await getInitialJobStatus() : 'closed';
    await pool.query(
      'UPDATE jobs SET status = ? WHERE job_id = ? AND company_id = ?',
      [finalStatus, jobId, companyId]
    );

    return sendSuccess(res, {
      message: finalStatus === 'closed' ? 'Đã đóng tin tuyển dụng.' : 'Đã mở lại tin tuyển dụng.',
      data: { job_id: jobId, status: finalStatus }
    });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi đổi trạng thái tin: ' + err.message });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return sendError(res, { code: 400, message: 'Mã tin tuyển dụng không hợp lệ.' });
    }
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const [result] = await pool.query(
      'DELETE FROM jobs WHERE job_id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (result.affectedRows === 0) {
      return sendError(res, { code: 404, message: 'Không tìm thấy tin tuyển dụng để xóa.' });
    }
    return sendSuccess(res, { message: 'Đã xóa tin tuyển dụng.', data: { job_id: jobId } });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi xóa tin tuyển dụng: ' + err.message });
  }
});

/**
 * 2B. HỒ SƠ DOANH NGHIỆP (Cập nhật thông tin công ty)
 */
router.get('/company', async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);
    const [rows] = await pool.query(
      `SELECT company_id, company_name, slug, tax_code, logo_url, website, address, description
       FROM companies WHERE company_id = ? LIMIT 1`,
      [companyId]
    );
    return sendSuccess(res, { message: 'Tải hồ sơ công ty thành công.', data: rows[0] || null });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi tải hồ sơ công ty: ' + err.message });
  }
});

router.put('/company', async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    const b = req.body || {};
    const companyName = String(b.company_name || '').trim();
    if (companyName.length < 2 || companyName.length > 150) {
      return sendError(res, { code: 400, message: 'Tên doanh nghiệp cần từ 2 đến 150 ký tự.' });
    }

    const taxCode = String(b.tax_code || '').trim().slice(0, 30) || null;
    const website = String(b.website || '').trim().slice(0, 255) || null;
    const address = String(b.address || '').trim().slice(0, 255) || null;
    const logoUrl = String(b.logo_url || '').trim().slice(0, 500) || null;
    const description = String(b.description || '').trim().slice(0, 5000) || null;

    await pool.query(
      `UPDATE companies
       SET company_name = ?, tax_code = ?, website = ?, address = ?, logo_url = ?, description = ?
       WHERE company_id = ?`,
      [companyName, taxCode, website, address, logoUrl, description, companyId]
    );

    const [[updated]] = await pool.query(
      `SELECT company_id, company_name, slug, tax_code, logo_url, website, address, description
       FROM companies WHERE company_id = ? LIMIT 1`,
      [companyId]
    );

    return sendSuccess(res, {
      message: 'Đã cập nhật hồ sơ doanh nghiệp thành công.',
      data: updated
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, { code: 400, message: 'Mã số thuế này đã được đăng ký bởi doanh nghiệp khác.' });
    }
    return sendError(res, { code: 500, message: 'Lỗi cập nhật hồ sơ doanh nghiệp: ' + err.message });
  }
});

/**
 * 3. ĐỔI TRẠNG THÁI HỒ SƠ ỨNG VIÊN (tự ghi nhận viewed_at lần đầu HR xử lý)
 */
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const appId = Number(req.params.id);
    const status = String((req.body || {}).status || '').trim();

    if (!Number.isInteger(appId) || appId <= 0) {
      return sendError(res, { code: 400, message: 'Mã hồ sơ không hợp lệ.' });
    }
    if (!ALLOWED_APP_STATUS.includes(status)) {
      return sendError(res, {
        code: 400,
        message: 'Trạng thái không hợp lệ.',
        errors: [{ field: 'status', message: 'Chỉ chấp nhận: ' + ALLOWED_APP_STATUS.join(', ') }]
      });
    }

    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return sendError(res, NO_COMPANY);

    // Kiểm tra quyền sở hữu: hồ sơ phải thuộc tin của công ty mình
    const [rows] = await pool.query(
      `SELECT a.application_id, a.status, a.viewed_at
       FROM applications a
       INNER JOIN jobs j ON a.job_id = j.job_id
       WHERE a.application_id = ? AND j.company_id = ?`,
      [appId, companyId]
    );
    if (!rows.length) {
      return sendError(res, { code: 404, message: 'Không tìm thấy hồ sơ ứng tuyển.' });
    }
    const current = rows[0];

    // Không cho "lùi" từ bước sau (phỏng vấn / duyệt / từ chối) về "đã xem"
    if (status === 'viewed' && LATER_THAN_VIEWED.includes(current.status)) {
      return sendSuccess(res, { message: 'Hồ sơ đã ở bước sau, giữ nguyên trạng thái.', data: current });
    }

    await pool.query(
      'UPDATE applications SET status = ?, viewed_at = COALESCE(viewed_at, NOW()) WHERE application_id = ?',
      [status, appId]
    );
    const [[updated]] = await pool.query(
      'SELECT application_id, status, viewed_at FROM applications WHERE application_id = ?',
      [appId]
    );

    // TODO (theo Mục 5.2 đặc tả): đẩy sự kiện vào hàng đợi để gửi email báo trạng thái cho ứng viên.
    return sendSuccess(res, { message: 'Đã cập nhật trạng thái hồ sơ.', data: updated });
  } catch (err) {
    return sendError(res, { code: 500, message: 'Lỗi cập nhật trạng thái: ' + err.message });
  }
});

module.exports = router;
