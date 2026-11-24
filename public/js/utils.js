// =====================================================================
//  js/utils.js – HÀM TIỆN ÍCH NHỎ
// =====================================================================

/** Tên hiển thị của từng danh mục (giá trị lưu trong DB là tiếng Anh) */
export const CATEGORY_LABELS = {
  beach: '🏝 Biển đảo',
  mountain: '⛰ Núi rừng',
  city: '🏮 Phố thị',
  food: '🍜 Ẩm thực',
};

/**
 * Chống XSS: biến ký tự đặc biệt thành dạng an toàn trước khi chèn vào HTML.
 * VD: "<script>" -> "&lt;script&gt;" (hiện ra chữ chứ không chạy code)
 */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "2025-03-14" -> "14 thg 3, 2025" */
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Định dạng số kiểu Việt Nam: 12500 -> "12.500" */
export const formatNumber = (n) => Number(n || 0).toLocaleString('vi-VN');

/**
 * Debounce: chỉ chạy hàm sau khi người dùng NGỪNG gõ `wait` ms.
 * Dùng cho ô tìm kiếm để không gọi API liên tục mỗi lần gõ phím.
 */
export function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Rút gọn document.querySelector / querySelectorAll */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** true nếu thiết bị có chuột (không phải màn hình cảm ứng) */
export const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** true nếu người dùng bật "giảm chuyển động" trong hệ điều hành */
export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
