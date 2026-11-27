/**
 * ============================================================================
 * KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL POOL (CONNECTION POOL)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * Căn cứ CSDL: database/schema.sql (10 bảng chuẩn 3NF - InnoDB utf8mb4)
 * ============================================================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

function buildDbConfig(overrides = {}) {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'job_portal_db';

  const useSsl =
    process.env.DB_SSL === 'true' ||
    /tidbcloud\.com|aivencloud\.com|psdb\.cloud|ondigitalocean\.com/i.test(host);

  const config = {
    host,
    port,
    user,
    password,
    database,
    charset: 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+07:00',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
    queueLimit: 0,
    ...overrides
  };

  if (useSsl) {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return config;
}

const pool = mysql.createPool(buildDbConfig());

/**
 * Kiểm tra kết nối MySQL khi khởi động Server
 */
async function checkDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(
      '[DB] Kết nối MySQL thành công tới CSDL:',
      process.env.DB_NAME || 'job_portal_db',
      process.env.DB_SSL === 'true' || /tidbcloud\.com/i.test(process.env.DB_HOST || '') ? '(SSL/TLS)' : '(Local)'
    );
    return true;
  } catch (err) {
    console.warn('[DB] Cảnh báo: Chưa kết nối được MySQL (' + err.message + '). Hãy kiểm tra cấu hình .env / Cloud DB.');
    return false;
  }
}

module.exports = {
  pool,
  buildDbConfig,
  checkDatabaseConnection
};
