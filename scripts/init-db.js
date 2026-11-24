// =====================================================================
//  scripts/init-db.js – TẠO BẢNG + NẠP DỮ LIỆU MẪU
//  Cách chạy:  npm run db:init           (schema + seed)
//              npm run db:init -- --no-seed  (chỉ tạo bảng)
// =====================================================================
const fs = require('fs');
const path = require('path');
require('../lib/env').loadEnv();          // nạp .env TRƯỚC khi require db
const { getPool } = require('../lib/db');

async function run() {
  const pool = getPool();
  const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, '..', 'sql', 'seed.sql'), 'utf8');

  console.log('⏳ Đang tạo bảng...');
  await pool.query(schema);               // 1 lần gửi nhiều câu lệnh SQL
  console.log('✅ Đã tạo bảng posts, comments, subscribers, contacts');

  if (!process.argv.includes('--no-seed')) {
    console.log('⏳ Đang nạp dữ liệu mẫu...');
    await pool.query(seed);
    const [{ count }] = (await pool.query('SELECT COUNT(*) FROM posts')).rows;
    console.log(`✅ Đã nạp ${count} bài viết mẫu`);
  }
  await pool.end();                       // đóng kết nối để script kết thúc
}

run().catch((err) => {
  console.error('❌ Lỗi khởi tạo database:', err.message);
  process.exit(1);
});
