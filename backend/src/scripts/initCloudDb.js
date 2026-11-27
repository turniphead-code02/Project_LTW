/**
 * ============================================================================
 * TỰ ĐỘNG KHỞI TẠO & NẠP DỮ LIỆU MẪU CHO CLOUD MYSQL (TIDB CLOUD / MYSQL 8)
 * - Chạy thủ công: npm run init-db
 * - Tự động chạy khi Server khởi động nếu CSDL đích chưa có bảng `users`
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { pool, buildDbConfig } = require('../config/db');

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        current += '\n';
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-' && /\s/.test(sql[i + 2] || ' ')) {
        inLineComment = true;
        i += 1;
        continue;
      }
      if (ch === '#') {
        inLineComment = true;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    if (ch === "'" && !inDouble && !inBacktick) {
      if (inSingle && next === "'") {
        current += "''";
        i += 1;
        continue;
      }
      if (sql[i - 1] !== '\\') inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inBacktick && sql[i - 1] !== '\\') {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
    }

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function sanitizeSchemaForCloud(rawSql) {
  return rawSql
    // Một số Cloud MySQL (TiDB Serverless) không hỗ trợ FULLTEXT INDEX mặc định; backend dùng LIKE
    .replace(/,\s*(?:--[^\n]*\n\s*)*FULLTEXT\s+KEY\s+`?ft_jobs_search`?\s*\([^)]*\)/gi, '')
    .replace(/SET\s+sql_mode\s*=[^;]+;/gi, '');
}

async function initDatabase(options = {}) {
  const { force = false } = options;
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed_data.sql');

  const conn = await mysql.createConnection(buildDbConfig({ multipleStatements: false }));

  try {
    const dbName = (process.env.DB_NAME || 'job_portal_db').replace(/`/g, '');
    try {
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await conn.query(`USE \`${dbName}\``);
    } catch (_) {
      // Một số Cloud DB dùng sẵn schema được cấp phát trong DB_NAME
    }

    if (!force) {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'users'`
      );
      if (Number(rows[0]?.cnt) > 0) {
        return { initialized: false, reason: 'already_exists' };
      }
    }

    console.log('[DB Init] Đang khởi tạo lược đồ 10 bảng & dữ liệu mẫu lên MySQL...');

    const schemaSql = sanitizeSchemaForCloud(fs.readFileSync(schemaPath, 'utf8'));
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await conn.query('SET foreign_key_checks = 0');

    for (const stmt of splitSqlStatements(schemaSql)) {
      if (/^SET\s+(?:time_zone|foreign_key_checks|NAMES)/i.test(stmt)) continue;
      await conn.query(stmt);
    }

    for (const stmt of splitSqlStatements(seedSql)) {
      if (/^SET\s+(?:time_zone|foreign_key_checks|NAMES)/i.test(stmt)) continue;
      if (/^TRUNCATE\s+TABLE/i.test(stmt)) continue;
      await conn.query(stmt);
    }

    // Đảm bảo các tin mẫu luôn còn hạn hiển thị khi khởi tạo mới trên Cloud
    await conn.query(
      'UPDATE jobs SET deadline = DATE_ADD(CURDATE(), INTERVAL 30 DAY) WHERE deadline < CURDATE()'
    );
    await conn.query('SET foreign_key_checks = 1');

    console.log('[DB Init] Khởi tạo CSDL & nạp dữ liệu mẫu thành công.');
    return { initialized: true };
  } finally {
    await conn.end();
  }
}

async function ensureDatabaseReady() {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'users'`
    );
    if (Number(rows[0]?.cnt) === 0) {
      await initDatabase({ force: false });
    }
  } catch (err) {
    console.warn('[DB Init] Bỏ qua tự động khởi tạo CSDL:', err.message);
  }
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  initDatabase({ force })
    .then((res) => {
      console.log('[DB Init] Kết quả:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init] Lỗi:', err.message);
      process.exit(1);
    });
}

module.exports = {
  initDatabase,
  ensureDatabaseReady
};
