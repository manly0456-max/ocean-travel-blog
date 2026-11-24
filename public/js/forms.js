// =====================================================================
//  js/forms.js – FORM ĐĂNG KÝ NHẬN TIN & FORM LIÊN HỆ
//  Kiểm tra dữ liệu ở trình duyệt (cho nhanh) + server kiểm tra lại (cho chắc).
// =====================================================================
import { api } from './api.js';
import { $, $$ } from './utils.js';
import { showToast } from './effects.js';

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Rung form khi có lỗi
function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;                // "đọc" layout để trình duyệt reset animation
  el.classList.add('shake');
}

// Hàm dùng chung: khoá nút, gọi API, báo kết quả, mở khoá nút
async function submitTo(form, endpoint, body) {
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Đang gửi…';
  try {
    const res = await api(endpoint, { method: 'POST', body });
    showToast(res.message);
    form.reset();
  } catch (err) {
    shake(form);
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export function initNewsletter() {
  const form = $('#newsletterForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.elements.email.value.trim();
    if (!isEmail(email)) { shake(form); return showToast('Email chưa đúng định dạng', 'error'); }
    submitTo(form, 'subscribe', { email });
  });
}

export function initContactForm() {
  const form = $('#contactForm');

  // Luật kiểm tra cho từng ô
  const rules = {
    name: (v) => v.length >= 2,
    email: isEmail,
    message: (v) => v.length >= 10,
  };

  // Bỏ viền đỏ ngay khi người dùng sửa lại
  $$('input, textarea', form).forEach((input) =>
    input.addEventListener('input', () => input.parentElement.classList.remove('is-invalid')));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let valid = true;
    for (const [field, check] of Object.entries(rules)) {
      const ok = check((data[field] || '').trim());
      form.elements[field].parentElement.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    }
    if (!valid) { shake(form); return showToast('Vui lòng kiểm tra lại các ô màu đỏ', 'error'); }
    submitTo(form, 'contact', data);
  });
}
