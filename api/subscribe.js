// =====================================================================
//  api/subscribe.js – ĐĂNG KÝ NHẬN BẢN TIN
//  POST /api/subscribe {email}   -> đăng ký
//  GET  /api/subscribe  (admin)  -> danh sách email
// =====================================================================
const { query } = require('../lib/db');
const { sendJson, getBody, isAdmin, cleanText, isEmail, createHandler } = require('../lib/http');

async function subscribe(req, res) {
  const email = cleanText(getBody(req).email, 160).toLowerCase();
  if (!isEmail(email)) return sendJson(res, 400, { error: 'Email không hợp lệ' });

  // ON CONFLICT DO NOTHING: email đã có thì bỏ qua, không báo lỗi
  const rows = await query(
    `INSERT INTO subscribers (email) VALUES ($1)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email]
  );
  if (!rows.length) return sendJson(res, 200, { message: 'Email này đã đăng ký rồi nhé 💙', already: true });
  return sendJson(res, 201, { message: 'Đăng ký thành công! Hẹn gặp bạn ở hành trình tới 🌊' });
}

async function listSubscribers(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const subscribers = await query('SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC');
  return sendJson(res, 200, { subscribers });
}

module.exports = createHandler({ POST: subscribe, GET: listSubscribers });
