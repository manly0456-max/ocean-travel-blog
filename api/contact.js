// =====================================================================
//  api/contact.js – FORM LIÊN HỆ
//  POST   /api/contact {name, email, message} -> gửi tin nhắn
//  GET    /api/contact          (admin)       -> xem tin nhắn
//  DELETE /api/contact?id=2     (admin)       -> xoá tin nhắn
// =====================================================================
const { query } = require('../lib/db');
const { sendJson, getBody, isAdmin, cleanText, isEmail, createHandler } = require('../lib/http');

async function sendMessage(req, res) {
  const body = getBody(req);
  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 160).toLowerCase();
  const message = cleanText(body.message, 2000);

  // Gom tất cả lỗi để báo 1 lần cho người dùng
  const errors = [];
  if (name.length < 2) errors.push('Tên quá ngắn');
  if (!isEmail(email)) errors.push('Email không hợp lệ');
  if (message.length < 10) errors.push('Tin nhắn cần ít nhất 10 ký tự');
  if (errors.length) return sendJson(res, 400, { error: errors.join('. ') });

  const rows = await query(
    'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id, created_at',
    [name, email, message]
  );
  return sendJson(res, 201, { message: `Cảm ơn ${name}! Mình sẽ phản hồi sớm nhất.`, id: rows[0].id });
}

async function listMessages(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const contacts = await query('SELECT * FROM contacts ORDER BY created_at DESC');
  return sendJson(res, 200, { contacts });
}

async function deleteMessage(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const rows = await query('DELETE FROM contacts WHERE id = $1 RETURNING id', [parseInt(req.query.id, 10)]);
  if (!rows.length) return sendJson(res, 404, { error: 'Không tìm thấy tin nhắn' });
  return sendJson(res, 200, { deleted: rows[0].id });
}

module.exports = createHandler({ POST: sendMessage, GET: listMessages, DELETE: deleteMessage });
