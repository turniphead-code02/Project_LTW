/**
 * ============================================================================
 * KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL POOL (CONNECTION POOL)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * Căn cứ CSDL: database/schema.sql (10 bảng chuẩn 3NF - InnoDB utf8mb4)
 * ============================================================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_portal_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Kiểm tra kết nối MySQL khi khởi động Server
 */
async function checkDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Kết nối MySQL thành công tới CSDL:', process.env.DB_NAME || 'job_portal_db');
    return true;
  } catch (err) {
    console.warn('[DB] Cảnh báo: Chưa kết nối được MySQL (' + err.message + '). Hãy chạy database/init.sql trước.');
    return false;
  }
}

module.exports = {
  pool,
  checkDatabaseConnection
};
