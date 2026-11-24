// =====================================================================
//  dev-server.js – SERVER CHẠY LOCAL (giả lập cách Vercel hoạt động)
//   • /api/xxx  -> gọi hàm trong api/xxx.js
//   • còn lại   -> trả file tĩnh trong public/ (hỗ trợ /admin -> admin.html)
//  Chạy:  npm run dev   rồi mở http://localhost:3000
//  (Hoặc dùng "vercel dev" nếu đã cài Vercel CLI – không cần file này)
// =====================================================================
require('./lib/env').loadEnv();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Bảng MIME: cho trình duyệt biết loại file
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

// Đọc toàn bộ body của request rồi parse JSON (Vercel tự làm việc này)
function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });
}

async function handleApi(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, '').replace(/[^a-z-]/g, '');
  const file = path.join(__dirname, 'api', `${name}.js`);
  if (!fs.existsSync(file)) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'API không tồn tại' }));
  }
  req.query = Object.fromEntries(url.searchParams); // giống req.query của Vercel
  req.body = await readJsonBody(req);                // giống req.body của Vercel
  const handler = require(file);
  return handler(req, res);
}

function serveStatic(res, url) {
  let filePath = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.statusCode = 403; return res.end(); } // chặn ../

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html'; // cleanUrls

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<h1>404 – Không tìm thấy trang</h1>');
  }
  res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`${req.method} ${url.pathname}${url.search}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(res, url);
}).listen(PORT, () => {
  console.log(`🌊 Wanderwave đang chạy tại http://localhost:${PORT}`);
});
