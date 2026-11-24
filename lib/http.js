// =====================================================================
//  lib/http.js – CÁC HÀM TIỆN ÍCH DÙNG CHUNG CHO MỌI API
// =====================================================================
const crypto = require('crypto');

/** Trả về JSON với mã trạng thái HTTP (200, 201, 400, 404, 500...) */
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/** Lấy body của request. Vercel đã tự parse JSON vào req.body. */
function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

/** Kiểm tra request có header x-admin-key đúng với ADMIN_KEY hay không */
function isAdmin(req) {
  const expected = process.env.ADMIN_KEY || '';
  const given = String(req.headers['x-admin-key'] || '');
  if (!expected || given.length !== expected.length) return false;
  // timingSafeEqual: so sánh "thời gian không đổi" -> chống đoán mật khẩu qua thời gian phản hồi
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Làm sạch chuỗi: ép kiểu, cắt khoảng trắng, giới hạn độ dài */
function cleanText(value, maxLength = 255) {
  return String(value ?? '').trim().slice(0, maxLength);
}

/** Kiểm tra định dạng email đơn giản */
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Chuyển "Hạ Long Bay!" -> "ha-long-bay" (bỏ dấu tiếng Việt) */
function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tách & bỏ dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')                         // ký tự lạ -> "-"
    .replace(/^-+|-+$/g, '')                             // bỏ "-" ở 2 đầu
    .slice(0, 100);
}

/**
 * Bọc handler để:
 *  1) chỉ cho phép các method được khai báo (GET, POST...)
 *  2) bắt mọi lỗi và trả JSON 500 thay vì làm sập function
 */
function createHandler(methods) {
  return async function handler(req, res) {
    const fn = methods[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '));
      return sendJson(res, 405, { error: `Phương thức ${req.method} không được hỗ trợ` });
    }
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[API ERROR]', err);
      // Mã lỗi riêng của PostgreSQL
      if (err.code === '23505') return sendJson(res, 409, { error: 'Dữ liệu đã tồn tại (trùng lặp)' });
      if (err.code === '23503') return sendJson(res, 404, { error: 'Không tìm thấy dữ liệu liên quan' });
      if (['23514', '22P02', '22007', '22008'].includes(err.code)) {
        return sendJson(res, 400, { error: 'Dữ liệu không hợp lệ' });
      }
      return sendJson(res, 500, { error: 'Lỗi máy chủ, vui lòng thử lại sau' });
    }
  };
}

module.exports = { sendJson, getBody, isAdmin, cleanText, isEmail, slugify, createHandler };
