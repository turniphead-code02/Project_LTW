
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

const { pool } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const {
    requireAuth,
    requireRole,
    ACCESS_SECRET
} = require('../middlewares/auth.middleware');

// ============================================================================
// CẤU HÌNH EMAIL VÀ OTP
// ============================================================================

const OTP_EXPIRES_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true') === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || ACCESS_SECRET;

// ============================================================================
// HÀM HỖ TRỢ
// ============================================================================

function createOtpHash(email, otp) {
    return crypto
        .createHmac('sha256', OTP_HASH_SECRET)
        .update(`${email}:${otp}`)
        .digest('hex');
}

function createMailTransporter() {
    if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
        throw new Error(
            'Chưa cấu hình SMTP_USER, SMTP_PASS hoặc SMTP_FROM trong file .env'
        );
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

function validPassword(password) {
    return (
        typeof password === 'string' &&
        password.length >= 8 &&
        Buffer.byteLength(password, 'utf8') <= 72
    );
}

function normalizeBcryptHash(hash) {
    let normalizedHash = String(hash || '').trim();

    if (normalizedHash.startsWith('$2y$')) {
        normalizedHash = normalizedHash.replace(/^\$2y\$/, '$2a$');
    }

    return normalizedHash;
}

const DEFAULT_SYSTEM_SETTINGS = {
    site_name: 'JobPortal',
    admin_email: 'admin@jobportal.com',
    site_description: 'Nền tảng tuyển dụng đa ngành hàng đầu Việt Nam — kết nối ứng viên và doanh nghiệp uy tín.',
    require_employer_approval: '0',
    require_job_approval: '1'
};

let settingsReadyPromise = null;

async function ensureSettingsTable() {
    if (!settingsReadyPromise) {
        settingsReadyPromise = (async () => {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key VARCHAR(100) PRIMARY KEY,
                    setting_value TEXT NOT NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            for (const [k, v] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
                await pool.query(
                    'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
                    [k, v]
                );
            }
        })().catch(err => {
            settingsReadyPromise = null;
            throw err;
        });
    }
    return settingsReadyPromise;
}

async function getSystemSettingsMap() {
    await ensureSettingsTable();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const result = { ...DEFAULT_SYSTEM_SETTINGS };
    for (const row of rows) {
        result[row.setting_key] = row.setting_value;
    }
    return result;
}

function slugifyCategory(text) {
    return String(text || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);
}

// ============================================================================
// 1. ĐĂNG KÝ TÀI KHOẢN
// ============================================================================

router.post('/auth/register', async (req, res) => {
    let conn;

    try {
        const {
            full_name,
            email,
            password,
            phone = null,
            role = 'candidate',
            company_name
        } = req.body;

        if (!full_name || !email || !password) {
            return sendError(res, {
                code: 400,
                message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.'
            });
        }

        if (!validPassword(String(password))) {
            return sendError(res, {
                code: 400,
                message: 'Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte.'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const safeRole = role === 'employer' ? 'employer' : 'candidate';
        let initialStatus = 'active';
        if (safeRole === 'employer') {
            try {
                const settings = await getSystemSettingsMap();
                if (settings.require_employer_approval === '1') {
                    initialStatus = 'locked';
                }
            } catch (_) {}
        }

        const passwordHash = await bcrypt.hash(String(password), 10);

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [userResult] = await conn.query(
            `INSERT INTO users
            (full_name, email, password_hash, phone, role, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                String(full_name).trim(),
                normalizedEmail,
                passwordHash,
                phone,
                safeRole,
                initialStatus
            ]
        );

        if (safeRole === 'employer') {
            const compName = String(company_name || full_name).trim();

            const slug =
                compName
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9]+/g, '-') +
                '-' +
                userResult.insertId;

            await conn.query(
                `INSERT INTO companies
                (user_id, company_name, slug)
                VALUES (?, ?, ?)`,
                [userResult.insertId, compName, slug]
            );
        }

        await conn.commit();

        return sendSuccess(res, {
            code: 201,
            message: 'Đăng ký tài khoản thành công.',
            data: {
                user_id: userResult.insertId,
                email: normalizedEmail,
                role: safeRole
            }
        });

    } catch (err) {
        if (conn) {
            await conn.rollback();
        }

        console.error('REGISTER ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return sendError(res, {
                code: 400,
                message: 'Email này đã được đăng ký trong hệ thống.'
            });
        }

        return sendError(res, {
            code: 500,
            message: 'Lỗi đăng ký tài khoản: ' + err.message
        });

    } finally {
        if (conn) conn.release();
    }
});

// ============================================================================
// 2. ĐĂNG NHẬP
// ============================================================================

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, {
                code: 400,
                message: 'Vui lòng nhập email và mật khẩu.'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const [users] = await pool.query(
            `SELECT
                user_id,
                full_name,
                email,
                password_hash,
                role,
                status
             FROM users
             WHERE LOWER(TRIM(email)) = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return sendError(res, {
                code: 401,
                message: 'Email hoặc mật khẩu không chính xác.'
            });
        }

        const user = users[0];

        if (!user.password_hash) {
            return sendError(res, {
                code: 401,
                message: 'Tài khoản chưa có mật khẩu hợp lệ.'
            });
        }

        if (user.status !== 'active') {
            return sendError(res, {
                code: 403,
                message: 'Tài khoản hiện không hoạt động hoặc đã bị khóa.'
            });
        }

        const normalizedHash = normalizeBcryptHash(user.password_hash);

        const isMatch = await bcrypt.compare(
            String(password),
            normalizedHash
        );

        if (!isMatch) {
            return sendError(res, {
                code: 401,
                message: 'Email hoặc mật khẩu không chính xác.'
            });
        }

        // Cập nhật dấu thời gian hoạt động gần nhất
        await pool.query(
            'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        ).catch(() => {});

        const accessToken = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            },
            ACCESS_SECRET,
            {
                expiresIn: process.env.JWT_ACCESS_EXPIRES || '24h'
            }
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
        console.error('LOGIN ERROR:', err);

        return sendError(res, {
            code: 500,
            message: 'Lỗi đăng nhập: ' + err.message
        });
    }
});

// ============================================================================
// 3. QUÊN MẬT KHẨU - GỬI OTP VỀ EMAIL
// POST /api/v1/auth/forgot-password
// ============================================================================

router.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (
            !email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
        ) {
            return sendError(res, {
                code: 400,
                message: 'Vui lòng nhập địa chỉ email hợp lệ.'
            });
        }

        const transporter = createMailTransporter();
        const normalizedEmail = String(email).trim().toLowerCase();

        const [users] = await pool.query(
            `SELECT user_id, full_name, email, status
             FROM users
             WHERE LOWER(TRIM(email)) = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        const genericMessage =
            'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn.';

        if (users.length === 0 || users[0].status !== 'active') {
            return sendSuccess(res, {
                message: genericMessage
            });
        }

        const user = users[0];

        // Giới hạn gửi lại OTP
        const [recentOtps] = await pool.query(
            `SELECT otp_id
             FROM password_reset_otps
             WHERE user_id = ?
               AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.user_id, OTP_RESEND_SECONDS]
        );

        if (recentOtps.length > 0) {
            return sendSuccess(res, {
                message: genericMessage
            });
        }

        // Dọn OTP hết hạn lâu
        await pool.query(
            `DELETE FROM password_reset_otps
             WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)`
        );

        const otp = String(crypto.randomInt(100000, 1000000));
        const otpHash = createOtpHash(normalizedEmail, otp);

        const [insertResult] = await pool.query(
            `INSERT INTO password_reset_otps
             (user_id, email, otp_hash, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [
                user.user_id,
                normalizedEmail,
                otpHash,
                OTP_EXPIRES_MINUTES
            ]
        );

        try {
            await transporter.sendMail({
                from: SMTP_FROM,
                to: normalizedEmail,
                subject: 'Mã OTP đặt lại mật khẩu - JobPortal',
                text:
                    `Xin chào ${user.full_name},\n\n` +
                    `Mã OTP đặt lại mật khẩu JobPortal của bạn là: ${otp}\n\n` +
                    `Mã có hiệu lực trong ${OTP_EXPIRES_MINUTES} phút.\n` +
                    'Bạn chỉ được sử dụng mã này một lần.\n\n' +
                    'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#243047">
                        <h2 style="color:#2563eb">JobPortal - Đặt lại mật khẩu</h2>
                        <p>Xin chào <strong>${String(user.full_name).replace(/[<>&"]/g, '')}</strong>,</p>
                        <p>Mã OTP để đặt lại mật khẩu của bạn là:</p>
                        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;padding:16px 0">
                            ${otp}
                        </div>
                        <p>Mã có hiệu lực trong <strong>${OTP_EXPIRES_MINUTES} phút</strong> và chỉ được sử dụng một lần.</p>
                        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                        <hr>
                        <p style="font-size:12px;color:#718096">JobPortal - Cổng thông tin việc làm và tuyển dụng trực tuyến</p>
                    </div>
                `
            });

        } catch (mailError) {
            await pool.query(
                'DELETE FROM password_reset_otps WHERE otp_id = ?',
                [insertResult.insertId]
            );

            throw mailError;
        }

        return sendSuccess(res, {
            message: genericMessage
        });

    } catch (err) {
        console.error('FORGOT PASSWORD ERROR:', err);

        return sendError(res, {
            code: 500,
            message: 'Không thể gửi OTP lúc này. Vui lòng kiểm tra cấu hình email và thử lại.'
        });
    }
});

// ============================================================================
// 4. ĐẶT LẠI MẬT KHẨU
// Có kiểm tra mật khẩu mới không được trùng mật khẩu hiện tại
// POST /api/v1/auth/reset-password
// ============================================================================

router.post('/auth/reset-password', async (req, res) => {
    let conn;

    try {
        const { email, otp, new_password } = req.body;

        if (!email || !otp || !new_password) {
            return sendError(res, {
                code: 400,
                message: 'Vui lòng nhập email, mã OTP và mật khẩu mới.'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedOtp = String(otp).trim();

        if (!/^\d{6}$/.test(normalizedOtp)) {
            return sendError(res, {
                code: 400,
                message: 'Mã OTP phải gồm đúng 6 chữ số.'
            });
        }

        if (!validPassword(new_password)) {
            return sendError(res, {
                code: 400,
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự và tối đa 72 byte.'
            });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Lấy OTP mới nhất
        const [otpRows] = await conn.query(
            `SELECT
                otp_id,
                user_id,
                email,
                otp_hash,
                expires_at,
                attempts,
                used_at,
                (expires_at <= NOW()) AS is_expired
             FROM password_reset_otps
             WHERE email = ?
             ORDER BY created_at DESC, otp_id DESC
             LIMIT 1
             FOR UPDATE`,
            [normalizedEmail]
        );

        if (otpRows.length === 0) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'OTP không hợp lệ hoặc chưa được gửi.'
            });
        }

        const otpRecord = otpRows[0];

        if (otpRecord.used_at) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới.'
            });
        }

        if (Number(otpRecord.is_expired) === 1) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'
            });
        }

        if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
            await conn.rollback();

            return sendError(res, {
                code: 429,
                message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.'
            });
        }

        // 2. Xác thực OTP
        const expectedHash = createOtpHash(
            normalizedEmail,
            normalizedOtp
        );

        const storedHashBuffer = Buffer.from(
            otpRecord.otp_hash,
            'hex'
        );

        const expectedHashBuffer = Buffer.from(
            expectedHash,
            'hex'
        );

        const isOtpMatch =
            storedHashBuffer.length === expectedHashBuffer.length &&
            crypto.timingSafeEqual(
                storedHashBuffer,
                expectedHashBuffer
            );

        if (!isOtpMatch) {
            await conn.query(
                `UPDATE password_reset_otps
                 SET attempts = attempts + 1
                 WHERE otp_id = ?`,
                [otpRecord.otp_id]
            );

            await conn.commit();

            return sendError(res, {
                code: 400,
                message: `Mã OTP không chính xác. Bạn còn ${OTP_MAX_ATTEMPTS - otpRecord.attempts - 1} lần thử.`
            });
        }

        // 3. Lấy mật khẩu hiện tại
        const [users] = await conn.query(
            `SELECT user_id, password_hash
             FROM users
             WHERE user_id = ?
               AND email = ?
               AND status = 'active'
             LIMIT 1
             FOR UPDATE`,
            [
                otpRecord.user_id,
                normalizedEmail
            ]
        );

        if (users.length === 0 || !users[0].password_hash) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'Không thể đặt lại mật khẩu cho tài khoản này.'
            });
        }

        const currentPasswordHash = normalizeBcryptHash(
            users[0].password_hash
        );

        // 4. Không cho phép mật khẩu mới trùng mật khẩu hiện tại
        const isSamePassword = await bcrypt.compare(
            String(new_password),
            currentPasswordHash
        );

        if (isSamePassword) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại. Vui lòng chọn mật khẩu khác.'
            });
        }

        // 5. Mã hóa và cập nhật mật khẩu mới
        const passwordHash = await bcrypt.hash(
            String(new_password),
            10
        );

        const [userResult] = await conn.query(
            `UPDATE users
             SET password_hash = ?
             WHERE user_id = ?
               AND email = ?
               AND status = 'active'`,
            [
                passwordHash,
                otpRecord.user_id,
                normalizedEmail
            ]
        );

        if (userResult.affectedRows === 0) {
            await conn.rollback();

            return sendError(res, {
                code: 400,
                message: 'Không thể đặt lại mật khẩu cho tài khoản này.'
            });
        }

        // 6. Đánh dấu tất cả OTP chưa sử dụng là đã sử dụng
        await conn.query(
            `UPDATE password_reset_otps
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [otpRecord.user_id]
        );

        await conn.commit();

        return sendSuccess(res, {
            message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
        });

    } catch (err) {
        if (conn) {
            await conn.rollback();
        }

        console.error('RESET PASSWORD ERROR:', err);

        return sendError(res, {
            code: 500,
            message: 'Lỗi đặt lại mật khẩu. Vui lòng thử lại.'
        });

    } finally {
        if (conn) conn.release();
    }
});

// ============================================================================
// 5. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
// ============================================================================

router.get('/auth/me', requireAuth, async (req, res) => {
    return sendSuccess(res, {
        message: 'Thông tin phiên đăng nhập hiện tại.',
        data: req.user
    });
});

// ============================================================================
// 6. ADMIN - TỔNG QUAN HỆ THỐNG (ĐA VAI TRÒ & ĐẦY ĐỦ DỮ LIỆU KIỂM DUYỆT)
// ============================================================================

router.get(
    '/admin/overview',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const [employers] = await pool.query(`
                SELECT
                    c.company_id,
                    c.company_name,
                    c.tax_code,
                    c.website,
                    c.logo_url,
                    c.created_at,
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.status AS user_status,
                    u.updated_at AS last_active_at,
                    (SELECT COUNT(*) FROM jobs j2 WHERE j2.company_id = c.company_id) AS job_count
                FROM companies c
                INNER JOIN users u ON c.user_id = u.user_id
                ORDER BY c.created_at DESC
            `);

            const [candidates] = await pool.query(`
                SELECT
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.status AS user_status,
                    u.created_at,
                    u.updated_at AS last_active_at,
                    (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.user_id) AS resume_count,
                    (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.user_id) AS application_count
                FROM users u
                WHERE u.role = 'candidate'
                ORDER BY u.created_at DESC
            `);

            const [jobs] = await pool.query(`
                SELECT
                    j.job_id,
                    j.title,
                    j.slug,
                    j.description,
                    j.requirements,
                    j.benefits,
                    j.salary_min,
                    j.salary_max,
                    j.currency,
                    j.employment_type,
                    j.experience_level,
                    DATE_FORMAT(j.deadline, '%Y-%m-%d') AS deadline,
                    j.status,
                    j.reject_reason,
                    j.created_at,
                    DATEDIFF(CURDATE(), DATE(j.created_at)) AS age_days,
                    (j.deadline < CURDATE()) AS is_expired,
                    c.company_name,
                    c.logo_url,
                    cat.category_id,
                    cat.category_name,
                    loc.location_name,
                    (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
                FROM jobs j
                INNER JOIN companies c ON j.company_id = c.company_id
                LEFT JOIN categories cat ON j.category_id = cat.category_id
                LEFT JOIN locations loc ON j.location_id = loc.location_id
                ORDER BY j.created_at DESC
            `);

            const [categories] = await pool.query(`
                SELECT
                    cat.category_id,
                    cat.category_name,
                    cat.slug,
                    cat.description,
                    COUNT(j.job_id) AS job_count
                FROM categories cat
                LEFT JOIN jobs j ON j.category_id = cat.category_id
                GROUP BY cat.category_id, cat.category_name, cat.slug, cat.description
                ORDER BY job_count DESC, cat.category_name ASC
            `);

            const [[appAgg]] = await pool.query(
                'SELECT COUNT(*) AS totalApplications FROM applications'
            );

            const settings = await getSystemSettingsMap();

            return sendSuccess(res, {
                message: 'Tải dữ liệu quản trị hệ thống thành công.',
                data: {
                    employers,
                    candidates,
                    jobs,
                    categories,
                    totalApplications: Number(appAgg?.totalApplications || 0),
                    settings
                }
            });

        } catch (err) {
            console.error('ADMIN OVERVIEW ERROR:', err);

            return sendError(res, {
                code: 500,
                message: 'Lỗi tải dữ liệu Admin: ' + err.message
            });
        }
    }
);

// ============================================================================
// 7. ADMIN - DUYỆT / TỪ CHỐI / ĐÓNG TIN & XÓA TIN TUYỂN DỤNG CŨ
// ============================================================================

router.patch(
    '/admin/jobs/:id/status',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const jobId = Number(req.params.id);
            const { status, reject_reason = null } = req.body;

            if (!Number.isInteger(jobId) || jobId <= 0) {
                return sendError(res, {
                    code: 400,
                    message: 'ID tin tuyển dụng không hợp lệ.'
                });
            }

            if (!['approved', 'rejected', 'pending', 'closed'].includes(status)) {
                return sendError(res, {
                    code: 400,
                    message: 'Trạng thái duyệt tin không hợp lệ.'
                });
            }

            const [result] = await pool.query(
                `UPDATE jobs
                 SET status = ?, reject_reason = ?
                 WHERE job_id = ?`,
                [
                    status,
                    status === 'rejected' ? reject_reason : null,
                    jobId
                ]
            );

            if (result.affectedRows === 0) {
                return sendError(res, {
                    code: 404,
                    message: 'Không tìm thấy tin tuyển dụng.'
                });
            }

            return sendSuccess(res, {
                message: 'Đã cập nhật trạng thái tin tuyển dụng.',
                data: {
                    job_id: jobId,
                    status,
                    reject_reason
                }
            });

        } catch (err) {
            console.error('ADMIN JOB STATUS ERROR:', err);

            return sendError(res, {
                code: 500,
                message: 'Lỗi kiểm duyệt tin tuyển dụng: ' + err.message
            });
        }
    }
);

router.delete(
    '/admin/jobs/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const jobId = Number(req.params.id);

            if (!Number.isInteger(jobId) || jobId <= 0) {
                return sendError(res, {
                    code: 400,
                    message: 'ID tin tuyển dụng không hợp lệ.'
                });
            }

            const [result] = await pool.query(
                'DELETE FROM jobs WHERE job_id = ?',
                [jobId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, {
                    code: 404,
                    message: 'Không tìm thấy tin tuyển dụng để xóa.'
                });
            }

            return sendSuccess(res, {
                message: 'Đã xóa vĩnh viễn tin tuyển dụng khỏi hệ thống.',
                data: { job_id: jobId }
            });
        } catch (err) {
            console.error('ADMIN DELETE JOB ERROR:', err);
            return sendError(res, {
                code: 500,
                message: 'Lỗi xóa tin tuyển dụng: ' + err.message
            });
        }
    }
);

router.post(
    '/admin/jobs/cleanup',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const {
                mode = 'expired_or_old',
                minAgeDays = 30
            } = req.body || {};

            const safeDays = Math.max(1, Math.min(3650, Number(minAgeDays) || 30));
            let whereClause = '';
            let params = [];

            if (mode === 'expired') {
                whereClause = 'deadline < CURDATE()';
            } else if (mode === 'old') {
                whereClause = 'DATEDIFF(CURDATE(), DATE(created_at)) >= ?';
                params = [safeDays];
            } else if (mode === 'closed_rejected') {
                whereClause = "status IN ('closed', 'rejected')";
            } else {
                whereClause = '(deadline < CURDATE() OR DATEDIFF(CURDATE(), DATE(created_at)) >= ?)';
                params = [safeDays];
            }

            const [result] = await pool.query(
                `DELETE FROM jobs WHERE ${whereClause}`,
                params
            );

            return sendSuccess(res, {
                message: `Đã dọn dẹp ${result.affectedRows} tin tuyển dụng lâu ngày / hết hạn.`,
                data: {
                    deletedCount: Number(result.affectedRows || 0)
                }
            });
        } catch (err) {
            console.error('ADMIN CLEANUP JOBS ERROR:', err);
            return sendError(res, {
                code: 500,
                message: 'Lỗi dọn dẹp tin tuyển dụng: ' + err.message
            });
        }
    }
);

// ============================================================================
// 8. ADMIN - KHÓA / MỞ KHÓA TÀI KHOẢN (CHẶN TỰ KHÓA HOẶC KHÓA ADMIN)
// ============================================================================

router.patch(
    '/admin/users/:id/status',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const userId = Number(req.params.id);
            const { status } = req.body;

            if (!Number.isInteger(userId) || userId <= 0) {
                return sendError(res, {
                    code: 400,
                    message: 'ID tài khoản không hợp lệ.'
                });
            }

            if (!['active', 'locked'].includes(status)) {
                return sendError(res, {
                    code: 400,
                    message: 'Trạng thái tài khoản không hợp lệ.'
                });
            }

            if (userId === Number(req.user.user_id)) {
                return sendError(res, {
                    code: 400,
                    message: 'Không thể tự khóa tài khoản quản trị viên đang đăng nhập.'
                });
            }

            const [targetRows] = await pool.query(
                'SELECT user_id, role FROM users WHERE user_id = ? LIMIT 1',
                [userId]
            );

            if (targetRows.length === 0) {
                return sendError(res, {
                    code: 404,
                    message: 'Không tìm thấy tài khoản.'
                });
            }

            if (targetRows[0].role === 'admin') {
                return sendError(res, {
                    code: 403,
                    message: 'Không thể thay đổi trạng thái tài khoản quản trị viên khác.'
                });
            }

            await pool.query(
                'UPDATE users SET status = ? WHERE user_id = ?',
                [status, userId]
            );

            return sendSuccess(res, {
                message: status === 'locked'
                    ? 'Đã khóa tài khoản thành công.'
                    : 'Đã mở khóa tài khoản thành công.',
                data: {
                    user_id: userId,
                    status
                }
            });

        } catch (err) {
            console.error('ADMIN USER STATUS ERROR:', err);

            return sendError(res, {
                code: 500,
                message: 'Lỗi cập nhật tài khoản: ' + err.message
            });
        }
    }
);

// ============================================================================
// 9. ADMIN - QUẢN LÝ DANH MỤC NGÀNH NGHỀ
// ============================================================================

router.post(
    '/admin/categories',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const name = String((req.body || {}).category_name || '').trim();
            const description = String((req.body || {}).description || '').trim() || null;

            if (name.length < 2 || name.length > 100) {
                return sendError(res, {
                    code: 400,
                    message: 'Tên ngành nghề cần từ 2 đến 100 ký tự.'
                });
            }

            const slug = slugifyCategory(name) || `category-${Date.now()}`;
            const [result] = await pool.query(
                'INSERT INTO categories (category_name, slug, description) VALUES (?, ?, ?)',
                [name, slug, description]
            );

            return sendSuccess(res, {
                code: 201,
                message: 'Đã thêm ngành nghề mới.',
                data: {
                    category_id: result.insertId,
                    category_name: name,
                    slug,
                    description
                }
            });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return sendError(res, {
                    code: 400,
                    message: 'Tên hoặc slug ngành nghề này đã tồn tại.'
                });
            }
            return sendError(res, {
                code: 500,
                message: 'Lỗi thêm ngành nghề: ' + err.message
            });
        }
    }
);

router.delete(
    '/admin/categories/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            const catId = Number(req.params.id);
            if (!Number.isInteger(catId) || catId <= 0) {
                return sendError(res, { code: 400, message: 'ID ngành nghề không hợp lệ.' });
            }

            const [[ref]] = await pool.query(
                'SELECT COUNT(*) AS cnt FROM jobs WHERE category_id = ?',
                [catId]
            );

            if (Number(ref?.cnt || 0) > 0) {
                return sendError(res, {
                    code: 400,
                    message: `Không thể xóa ngành nghề đang có ${ref.cnt} tin tuyển dụng.`
                });
            }

            const [result] = await pool.query(
                'DELETE FROM categories WHERE category_id = ?',
                [catId]
            );

            if (result.affectedRows === 0) {
                return sendError(res, { code: 404, message: 'Không tìm thấy ngành nghề.' });
            }

            return sendSuccess(res, {
                message: 'Đã xóa ngành nghề.',
                data: { category_id: catId }
            });
        } catch (err) {
            return sendError(res, {
                code: 500,
                message: 'Lỗi xóa ngành nghề: ' + err.message
            });
        }
    }
);

// ============================================================================
// 10. ADMIN - LƯU CẤU HÌNH HỆ THỐNG VÀO CSDL
// ============================================================================

router.put(
    '/admin/settings',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        try {
            await ensureSettingsTable();
            const body = req.body || {};

            const updates = {
                site_name: String(body.site_name || DEFAULT_SYSTEM_SETTINGS.site_name).trim().slice(0, 120),
                admin_email: String(body.admin_email || DEFAULT_SYSTEM_SETTINGS.admin_email).trim().slice(0, 150),
                site_description: String(body.site_description || '').trim().slice(0, 1000),
                require_employer_approval: body.require_employer_approval ? '1' : '0',
                require_job_approval: body.require_job_approval ? '1' : '0'
            };

            for (const [k, v] of Object.entries(updates)) {
                await pool.query(
                    `INSERT INTO system_settings (setting_key, setting_value)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [k, v]
                );
            }

            return sendSuccess(res, {
                message: 'Đã lưu cài đặt hệ thống vào cơ sở dữ liệu.',
                data: updates
            });
        } catch (err) {
            return sendError(res, {
                code: 500,
                message: 'Lỗi lưu cài đặt hệ thống: ' + err.message
            });
        }
    }
);

module.exports = router;
