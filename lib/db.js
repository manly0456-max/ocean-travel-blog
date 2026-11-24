// =====================================================================
//  lib/db.js – KẾT NỐI POSTGRESQL
//  Dùng "connection pool": giữ sẵn vài kết nối để tái sử dụng, khỏi mở mới mỗi request.
// =====================================================================
const { Pool, types } = require('pg');

// Kiểu DATE (mã 1082) trả về chuỗi 'YYYY-MM-DD' thay vì đối tượng Date
// -> tránh lệch 1 ngày do múi giờ khi chuyển sang JSON.
types.setTypeParser(1082, (value) => value);

// Vercel + Neon tự tạo DATABASE_URL (một số bản cũ dùng POSTGRES_URL)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Database trên cloud (Neon) bắt buộc SSL; Postgres trên máy (localhost) thì không.
const isLocal = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);

// Serverless có thể chạy lại file này nhiều lần -> lưu pool vào globalThis để dùng lại.
function getPool() {
  if (!connectionString) {
    throw new Error('Thiếu biến môi trường DATABASE_URL');
  }
  if (!globalThis._wanderwavePool) {
    globalThis._wanderwavePool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,                     // tối đa 5 kết nối đồng thời
      idleTimeoutMillis: 10000,   // kết nối rảnh 10s thì đóng
    });
  }
  return globalThis._wanderwavePool;
}

/**
 * Chạy 1 câu SQL có tham số.
 * @param {string} text   Câu SQL, dùng $1, $2... làm chỗ giữ tham số
 * @param {Array}  params Giá trị cho $1, $2... (pg tự escape -> chống SQL Injection)
 * @returns {Promise<Array>} Mảng các dòng kết quả
 */
async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result.rows;
}

module.exports = { query, getPool };
