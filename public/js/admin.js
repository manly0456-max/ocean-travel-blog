// =====================================================================
//  js/admin.js – TRANG QUẢN TRỊ (CRUD bài viết, xem tin nhắn, subscriber)
//  Mọi request ghi/xoá đều gửi header "x-admin-key" để server xác thực.
// =====================================================================
import { api } from './api.js';
import { $, $$, escapeHtml, formatDate, formatNumber, CATEGORY_LABELS } from './utils.js';
import { showToast } from './effects.js';

const KEY_STORAGE = 'wanderwave_admin_key';
const IMAGES = ['halong', 'sapa', 'hoian', 'phuquoc', 'hagiang', 'kyoto', 'bali', 'bangkok', 'hue', 'santorini', 'about', 'hero'];
let adminKey = sessionStorage.getItem(KEY_STORAGE) || '';   // sessionStorage: đóng tab là mất
let posts = [];

// Gọi API kèm header admin
const adminApi = (path, options = {}) =>
  api(path, { ...options, headers: { 'x-admin-key': adminKey } });

// ---------------------------------------------------------------------
// ĐĂNG NHẬP / ĐĂNG XUẤT
// ---------------------------------------------------------------------
async function tryLogin(key) {
  adminKey = key;
  try {
    await adminApi('subscribe');                 // endpoint cần quyền admin -> sai key sẽ lỗi 401
    sessionStorage.setItem(KEY_STORAGE, key);
    $('#loginView').hidden = true;
    $('#dashView').hidden = false;
    requestAnimationFrame(() => moveInk($('.tab.is-active')));
    loadDashboard();
    return true;
  } catch {
    sessionStorage.removeItem(KEY_STORAGE);
    return false;
  }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ok = await tryLogin($('#adminKey').value.trim());
  if (!ok) {
    const card = $('#loginForm');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    showToast('Sai admin key', 'error');
  }
});
$('#logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(KEY_STORAGE);
  location.reload();
});

// ---------------------------------------------------------------------
// TẢI DỮ LIỆU DASHBOARD
// ---------------------------------------------------------------------
async function loadDashboard() {
  loadStats();
  loadPosts();
  loadContacts();
  loadSubscribers();
}

async function loadStats() {
  const s = await api('stats');
  const items = [
    ['Bài viết', s.posts], ['Quốc gia', s.countries], ['Lượt xem', s.views],
    ['Lượt tim', s.likes], ['Bình luận', s.comments], ['Người đăng ký', s.subscribers],
  ];
  $('#kpis').innerHTML = items.map(([label, value], i) =>
    `<div class="kpi" style="--d:${i * 0.06}s"><strong>${formatNumber(value)}</strong><span>${label}</span></div>`).join('');

  // Biểu đồ cột: chiều rộng = tỉ lệ so với danh mục nhiều bài nhất
  const max = Math.max(...s.byCategory.map((c) => c.total), 1);
  $('#chartBars').innerHTML = s.byCategory.map((c) => `
    <div class="bar"><span>${CATEGORY_LABELS[c.category]}</span>
      <div class="bar__track"><div class="bar__fill" data-w="${(c.total / max) * 100}%"></div></div>
      <b>${c.total}</b></div>`).join('');
  requestAnimationFrame(() => $$('.bar__fill').forEach((b) => { b.style.width = b.dataset.w; })); // chạy animation
}

async function loadPosts() {
  ({ posts } = await api('posts'));
  $('#postRows').innerHTML = posts.map((p) => `
    <tr>
      <td><div class="row-post"><img src="${escapeHtml(p.cover_image)}" alt="" />
        <div><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.location)}, ${escapeHtml(p.country)} ${p.is_featured ? '· ⭐ Nổi bật' : ''}</small></div></div></td>
      <td>${CATEGORY_LABELS[p.category]}</td>
      <td>${formatDate(p.travel_date)}</td>
      <td>${formatNumber(p.likes)}</td>
      <td>${formatNumber(p.views)}</td>
      <td>${p.comment_count}</td>
      <td><div class="row-actions">
        <a class="icon-btn" href="/?post=${encodeURIComponent(p.slug)}" target="_blank">Xem</a>
        <button class="icon-btn" data-edit="${p.slug}">Sửa</button>
        <button class="icon-btn icon-btn--danger" data-delete="${p.id}">Xoá</button>
      </div></td>
    </tr>`).join('');
}

async function loadContacts() {
  const { contacts } = await adminApi('contact');
  $('#contactList').innerHTML = contacts.length
    ? contacts.map((c) => `
      <article class="msg">
        <header><b>${escapeHtml(c.name)} · <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></b><small>${formatDate(c.created_at)}</small></header>
        <p>${escapeHtml(c.message)}</p>
        <button class="icon-btn icon-btn--danger" data-delete-contact="${c.id}">Xoá</button>
      </article>`).join('')
    : '<p class="muted">Chưa có tin nhắn nào.</p>';
}

async function loadSubscribers() {
  const { subscribers } = await adminApi('subscribe');
  $('#subRows').innerHTML = subscribers.map((s, i) =>
    `<tr><td>${i + 1}</td><td>${escapeHtml(s.email)}</td><td>${formatDate(s.created_at)}</td></tr>`).join('')
    || '<tr><td colspan="3" class="muted">Chưa có ai đăng ký.</td></tr>';
}

// ---------------------------------------------------------------------
// TABS – thanh gạch chân trượt tới tab đang chọn
// ---------------------------------------------------------------------
function moveInk(tab) {
  const ink = $('#tabInk');
  ink.style.width = `${tab.offsetWidth}px`;
  ink.style.transform = `translateX(${tab.offsetLeft}px)`;
}
$('#tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t === tab));
  $$('.panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  moveInk(tab);
});

// ---------------------------------------------------------------------
// FORM THÊM / SỬA BÀI (drawer)
// ---------------------------------------------------------------------
const drawer = $('#drawer');
const form = $('#postForm');
$('#coverSelect').innerHTML = IMAGES.map((n) => `<option value="/assets/img/${n}.jpg">${n}.jpg</option>`).join('');

function openDrawer(post = null) {
  form.reset();
  $('#drawerTitle').textContent = post ? 'Sửa bài viết' : 'Thêm bài viết';
  if (post) {
    // Đổ dữ liệu bài vào từng ô theo name
    for (const [key, value] of Object.entries(post)) {
      const field = form.elements[key];
      if (!field) continue;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else if (key === 'travel_date' && value) field.value = String(value).slice(0, 10);
      else field.value = value ?? '';
    }
  } else {
    form.elements.id.value = '';
  }
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
}
const closeDrawer = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); };

$('#newPostBtn').addEventListener('click', () => openDrawer());
$$('[data-close-drawer]').forEach((el) => el.addEventListener('click', closeDrawer));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.is_featured = form.elements.is_featured.checked;
  const id = data.id;
  delete data.id;
  try {
    if (id) await adminApi(`posts?id=${id}`, { method: 'PUT', body: data });   // SỬA
    else await adminApi('posts', { method: 'POST', body: data });             // THÊM
    showToast(id ? 'Đã cập nhật bài viết' : 'Đã thêm bài viết mới');
    closeDrawer();
    loadPosts();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ---------------------------------------------------------------------
// SỬA / XOÁ – event delegation; xoá cần bấm 2 lần để xác nhận
// ---------------------------------------------------------------------
function confirmTwice(btn) {
  if (btn.classList.contains('is-confirm')) return true;
  btn.classList.add('is-confirm');
  btn.textContent = 'Chắc chưa?';
  setTimeout(() => { btn.classList.remove('is-confirm'); btn.textContent = 'Xoá'; }, 3000);
  return false;
}

document.addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-delete]');
  const delContact = e.target.closest('[data-delete-contact]');
  try {
    if (edit) {
      const { post } = await adminApi(`posts?slug=${encodeURIComponent(edit.dataset.edit)}`);
      openDrawer(post);
    }
    if (del && confirmTwice(del)) {
      await adminApi(`posts?id=${del.dataset.delete}`, { method: 'DELETE' });
      showToast('Đã xoá bài viết');
      loadPosts(); loadStats();
    }
    if (delContact && confirmTwice(delContact)) {
      await adminApi(`contact?id=${delContact.dataset.deleteContact}`, { method: 'DELETE' });
      showToast('Đã xoá tin nhắn');
      loadContacts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

// Tự đăng nhập lại nếu đã có key trong phiên
if (adminKey) tryLogin(adminKey);
requestAnimationFrame(() => moveInk($('.tab.is-active')));
window.addEventListener('resize', () => moveInk($('.tab.is-active')));
