// =====================================================================
//  lib/env.js – Đọc file .env khi chạy LOCAL (trên Vercel không cần)
//  Mỗi dòng dạng KEY=VALUE sẽ được nạp vào process.env.
// =====================================================================
const fs = require('fs');
const path = require('path');

function loadEnv(file = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(file)) return;                 // không có .env -> bỏ qua
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // bỏ dòng trống & comment
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value; // không ghi đè biến có sẵn
  }
}

module.exports = { loadEnv };
