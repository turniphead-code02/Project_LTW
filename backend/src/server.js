/**
 * ============================================================================
 * KHỞI TẠO EXPRESS SERVER — DỰ ÁN JOB PORTAL (NHÓM 6 UTH)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * ============================================================================
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { pool, checkDatabaseConnection } = require('./config/db');
const { ensureDatabaseReady } = require('./scripts/initCloudDb');
const { ensureMultiIndustryData } = require('./scripts/seedMultiIndustry');
const { sendError } = require('./utils/response');
const { handleMulterError } = require('./middlewares/upload.middleware');
const { serveSecureCv } = require('./middlewares/secureCv.middleware');

// Import 6 phân hệ Route tương ứng với 6 thành viên trong nhóm
const homeRoutes = require('./routes/home.routes');           // Core: Trần Hữu Thành
const jobsRoutes = require('./routes/jobs.routes');           // Module 1: Nguyễn Lê Gia Hân
const jobDetailRoutes = require('./routes/jobDetail.routes'); // Module 2: Hồ Trúc Gia Hân
const candidateRoutes = require('./routes/candidate.routes'); // Module 3: Nguyễn Phú Quang
const employerRoutes = require('./routes/employer.routes');   // Module 4: Đinh Duy Diễn
const authAdminRoutes = require('./routes/authAdmin.routes'); // Module 5: Lê Hoàng Thiên Hương

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// 1. Cấu hình Middleware cơ bản & Security Headers (Mục 2.2 Đặc tả kỹ thuật)
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://portaljob-six.vercel.app')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === 'null') return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. Bảo mật tệp CV cá nhân: Chặn truy cập công khai qua express.static
// Tất cả yêu cầu xem/tải tệp CV đều bắt buộc xác thực JWT và kiểm tra quyền sở hữu (RBAC)
app.get('/uploads/cv/:fileName', serveSecureCv);
app.all('/uploads/cv*', (req, res) => {
  return sendError(res, { code: 403, message: 'Từ chối truy cập trực tiếp vào thư mục CV.' });
});

// Phục vụ tệp tĩnh công khai (logo công ty, banner, giao diện Frontend tĩnh)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/portfolios', express.static(path.join(__dirname, '../../portfolios')));
app.use('/job-portal', express.static(path.join(__dirname, '../../job-portal')));
app.use('/', express.static(path.join(__dirname, '../../job-portal')));

// 3. Đăng ký các nhánh RESTful API (/api/v1/...)
app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/job-detail', jobDetailRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/employer', employerRoutes);
app.use('/api/v1', authAdminRoutes); // Gồm /api/v1/auth/* và /api/v1/admin/*

// 4. Route kiểm tra sức khỏe hệ thống (Healthcheck)
let lastDbInitResult = null;
app.get('/api/v1/health', async (req, res) => {
  let dbConnected = false;
  let dbError = null;
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {
    dbError = err.message;
  }

  res.json({
    success: true,
    code: 200,
    message: 'JobPortal Backend API đang hoạt động.',
    data: {
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      dbError: dbConnected ? undefined : dbError,
      dbInit: lastDbInitResult
    }
  });
});

// 5. Xử lý lỗi 404 cho các API không tồn tại
app.use('/api/*', (req, res) => {
  return sendError(res, { code: 404, message: `Không tìm thấy API endpoint: ${req.originalUrl}` });
});

// 6. Middleware bắt lỗi tải file Multer (trả về 413 hoặc 400)
app.use(handleMulterError);

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  return sendError(res, {
    code: err.status || 500,
    message: err.message || 'Lỗi máy chủ nội bộ (Internal Server Error).'
  });
});

app.listen(PORT, async () => {
  console.log(`================================================================`);
  console.log(`🚀 JobPortal Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📂 Giao diện Frontend:            http://localhost:${PORT}/index.html`);
  console.log(`🔌 Điểm cuối REST API:            http://localhost:${PORT}/api/v1/health`);
  console.log(`================================================================`);
  lastDbInitResult = await ensureDatabaseReady();
  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    await ensureMultiIndustryData();
  }
});
