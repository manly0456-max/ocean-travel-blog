// =====================================================================
//  js/blog.js – PHẦN "FULL-STACK": LẤY DỮ LIỆU TỪ API & HIỂN THỊ
//  Gồm: danh sách bài + lọc + tìm kiếm, showcase, timeline, gallery,
//       modal chi tiết, thả tim, bình luận.
// =====================================================================
import { api } from './api.js';
import { $, $$, escapeHtml, formatDate, formatNumber, debounce, CATEGORY_LABELS } from './utils.js';
import { observeReveal, applyTilt, openLightbox, showToast } from './effects.js';

// Trạng thái bộ lọc hiện tại
const state = { category: 'all', q: '' };

// Danh sách id bài đã thả tim, lưu trong localStorage để nhớ sau khi tải lại trang
const LIKED_KEY = 'wanderwave_liked';
const getLiked = () => JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
const setLiked = (ids) => localStorage.setItem(LIKED_KEY, JSON.stringify(ids));

// ---------------------------------------------------------------------
// 1) THẺ BÀI VIẾT (template string -> HTML)
// ---------------------------------------------------------------------
function cardTemplate(post, index) {
  // escapeHtml cho mọi dữ liệu từ DB để chống XSS
  return `
    <article class="card is-entering" style="--d:${index * 0.07}s" data-slug="${escapeHtml(post.slug)}" tabindex="0">
      <span class="card__glare"></span>
      <div class="card__media">
        <img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        <span class="card__badge">${CATEGORY_LABELS[post.category] || ''}</span>
      </div>
      <div class="card__body">
        <p class="card__loc">📍 ${escapeHtml(post.location)}, ${escapeHtml(post.country)}</p>
        <h3 class="card__title">${escapeHtml(post.title)}</h3>
        <p class="card__excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="card__meta">
          <span>🗓 ${formatDate(post.travel_date)}</span>
          <span>⏱ ${post.read_minutes} phút</span>
          <span>❤️ ${formatNumber(post.likes)}</span>
          <span>💬 ${post.comment_count}</span>
        </div>
      </div>
    </article>`;
}

// Thẻ "khung xương" hiển thị trong lúc chờ API
const skeletonTemplate = () => `
  <div class="card skeleton">
    <div class="card__media"></div>
    <div class="card__body">
      <div class="skeleton__line skeleton__line--short"></div>
      <div class="skeleton__line skeleton__line--mid"></div>
      <div class="skeleton__line"></div>
    </div>
  </div>`;

// ---------------------------------------------------------------------
// 2) TẢI & HIỂN THỊ DANH SÁCH BÀI (có lọc + tìm kiếm)
// ---------------------------------------------------------------------
export async function loadPosts() {
  const grid = $('#postGrid');
  const empty = $('#emptyState');
  grid.innerHTML = skeletonTemplate().repeat(6);

  // URLSearchParams tự mã hoá ký tự đặc biệt/tiếng Việt trong URL
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  if (state.q) params.set('q', state.q);

  try {
    const { posts } = await api(`posts?${params}`);
    grid.innerHTML = posts.map(cardTemplate).join('');
    empty.hidden = posts.length > 0;

    $$('.card', grid).forEach((card) => {
      applyTilt(card);                                            // hiệu ứng nghiêng 3D
      card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });
      card.addEventListener('click', () => openPost(card.dataset.slug));
      card.addEventListener('keydown', (e) => e.key === 'Enter' && openPost(card.dataset.slug));
    });
  } catch (err) {
    grid.innerHTML = '';
    empty.hidden = false;
    empty.textContent = `Không tải được bài viết: ${err.message}`;
  }
}

export function initFilters() {
  // Bấm chip danh mục
  $('#filterChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    state.category = chip.dataset.category;
    loadPosts();
  });
  // Gõ tìm kiếm (debounce 350ms)
  $('#searchInput').addEventListener('input', debounce((e) => {
    state.q = e.target.value.trim();
    loadPosts();
  }, 350));
}

// ---------------------------------------------------------------------
// 3) SHOWCASE – 3 hành trình nổi bật (is_featured = TRUE)
// ---------------------------------------------------------------------
export function renderShowcase(posts) {
  const featured = posts.filter((p) => p.is_featured).slice(0, 3);
  $('#showcaseList').innerHTML = featured.map((p, i) => `
    <article class="showcase">
      <div class="showcase__media" data-reveal="${i % 2 ? 'right' : 'left'}">
        <img src="${escapeHtml(p.cover_image)}" alt="${escapeHtml(p.title)}" loading="lazy" />
        <span class="showcase__num">0${i + 1}</span>
      </div>
      <div class="showcase__body" data-reveal="up" style="--d:.15s">
        <p class="eyebrow">${CATEGORY_LABELS[p.category]} · ${escapeHtml(p.country)}</p>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt)}</p>
        <div class="showcase__meta">
          <span class="pill">📍 ${escapeHtml(p.location)}</span>
          <span class="pill">🧭 ${formatNumber(p.distance_km)} km</span>
          <span class="pill">👁 ${formatNumber(p.views)} lượt xem</span>
        </div>
        <button class="btn btn--ghost" data-ripple data-open="${escapeHtml(p.slug)}">Đọc câu chuyện <span class="btn__arrow">→</span></button>
      </div>
    </article>`).join('');
  observeReveal($('#showcaseList'));
}

// ---------------------------------------------------------------------
// 4) TIMELINE – sắp xếp theo ngày đi, cũ -> mới
// ---------------------------------------------------------------------
export function renderTimeline(posts) {
  const sorted = [...posts].sort((a, b) => new Date(a.travel_date) - new Date(b.travel_date));
  $('#timelineList').innerHTML = sorted.map((p, i) => `
    <li class="tl-item" data-reveal="${i % 2 ? 'right' : 'left'}">
      <div class="tl-card glass" data-open="${escapeHtml(p.slug)}">
        <img src="${escapeHtml(p.cover_image)}" alt="" loading="lazy" />
        <div>
          <time>${formatDate(p.travel_date)}</time>
          <h4>${escapeHtml(p.title)}</h4>
          <p>📍 ${escapeHtml(p.location)}, ${escapeHtml(p.country)}</p>
        </div>
      </div>
    </li>`).join('');
  observeReveal($('#timelineList'));
}

// ---------------------------------------------------------------------
// 5) GALLERY – lưới ảnh kiểu "masonry" + lightbox
// ---------------------------------------------------------------------
export function renderGallery(posts) {
  const items = posts.map((p) => ({ src: p.cover_image, caption: `${p.location}, ${p.country}` }));
  const grid = $('#gallery-grid');
  grid.innerHTML = items.map((it, i) => `
    <figure class="gallery__item" data-reveal="zoom" style="--d:${(i % 3) * 0.08}s" data-index="${i}">
      <img src="${escapeHtml(it.src)}" alt="${escapeHtml(it.caption)}" loading="lazy" />
      <figcaption>${escapeHtml(it.caption)}</figcaption>
    </figure>`).join('');
  grid.addEventListener('click', (e) => {
    const fig = e.target.closest('.gallery__item');
    if (fig) openLightbox(items, Number(fig.dataset.index));
  });
  observeReveal(grid);
}

// ---------------------------------------------------------------------
// 6) MODAL CHI TIẾT BÀI VIẾT
// ---------------------------------------------------------------------
const modal = $('#postModal');
const modalBody = $('#modalBody');

function openModal() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  history.replaceState(null, '', location.pathname);   // xoá ?post=... khỏi URL
}

function commentTemplate(c) {
  return `
    <li class="comment">
      <span class="comment__avatar">${escapeHtml(c.author_name.charAt(0).toUpperCase())}</span>
      <div>
        <span class="comment__name">${escapeHtml(c.author_name)}</span>
        <span class="comment__time">${formatDate(c.created_at)}</span>
        <p>${escapeHtml(c.content)}</p>
      </div>
    </li>`;
}

export async function openPost(slug) {
  modalBody.innerHTML = '<div class="post-detail__body"><div class="skeleton__line skeleton__line--mid"></div><div class="skeleton__line"></div><div class="skeleton__line"></div></div>';
  openModal();
  history.replaceState(null, '', `?post=${encodeURIComponent(slug)}`); // URL chia sẻ được

  try {
    const { post, comments } = await api(`posts?slug=${encodeURIComponent(slug)}`);
    const liked = getLiked().includes(post.id);
    // Nội dung: mỗi đoạn cách nhau bằng dòng trống -> 1 thẻ <p>
    const paragraphs = post.content.split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

    modalBody.innerHTML = `
      <img class="post-detail__cover" src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" />
      <div class="post-detail__body">
        <p class="eyebrow">${CATEGORY_LABELS[post.category]} · ${escapeHtml(post.location)}, ${escapeHtml(post.country)}</p>
        <h2>${escapeHtml(post.title)}</h2>
        <div class="post-detail__meta">
          <span class="pill">🗓 ${formatDate(post.travel_date)}</span>
          <span class="pill">⏱ ${post.read_minutes} phút đọc</span>
          <span class="pill">🧭 ${formatNumber(post.distance_km)} km</span>
          <span class="pill">👁 ${formatNumber(post.views)} lượt xem</span>
        </div>
        <div class="post-detail__content">${paragraphs}</div>

        <button class="like-btn ${liked ? 'is-liked' : ''}" id="likeBtn">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>
          <span id="likeCount">${formatNumber(post.likes)}</span> lượt thích
        </button>

        <section class="comments">
          <h3>💬 Bình luận (<span id="commentCount">${comments.length}</span>)</h3>
          <form class="comment-form" id="commentForm">
            <input name="author_name" placeholder="Tên của bạn" maxlength="60" required />
            <textarea name="content" rows="3" placeholder="Chia sẻ cảm nghĩ..." maxlength="1000" required></textarea>
            <button class="btn btn--primary btn--sm" type="submit" data-ripple>Gửi bình luận</button>
          </form>
          <ul class="comment-list" id="commentList">${comments.map(commentTemplate).join('')}</ul>
        </section>
      </div>`;

    $('#likeBtn').addEventListener('click', (e) => toggleLike(post.id, e.currentTarget));
    $('#commentForm').addEventListener('submit', (e) => submitComment(e, post.id));
  } catch (err) {
    modalBody.innerHTML = `<div class="post-detail__body"><p>😢 ${escapeHtml(err.message)}</p></div>`;
  }
}

// ---------------------------------------------------------------------
// 7) THẢ TIM – cập nhật giao diện NGAY (optimistic UI) rồi mới gọi API
// ---------------------------------------------------------------------
async function toggleLike(postId, btn) {
  const liked = getLiked();
  const isLiked = liked.includes(postId);
  btn.classList.toggle('is-liked', !isLiked);
  btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); // reset animation
  if (!isLiked) burstHearts(btn);

  try {
    const { likes } = await api('likes', { method: 'POST', body: { post_id: postId, action: isLiked ? 'unlike' : 'like' } });
    $('#likeCount').textContent = formatNumber(likes);
    setLiked(isLiked ? liked.filter((id) => id !== postId) : [...liked, postId]);
  } catch (err) {
    btn.classList.toggle('is-liked', isLiked);   // lỗi -> hoàn tác giao diện
    showToast(err.message, 'error');
  }
}

// Tạo 10 hạt nhỏ bay toả ra xung quanh trái tim
function burstHearts(btn) {
  const colors = ['#ff7a9c', '#5ff2c9', '#2a9fd6', '#ffd36b'];
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 10;
    p.className = 'heart-particle';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--tx', `${Math.cos(angle) * 46}px`);
    p.style.setProperty('--ty', `${Math.sin(angle) * 46}px`);
    btn.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ---------------------------------------------------------------------
// 8) GỬI BÌNH LUẬN
// ---------------------------------------------------------------------
async function submitComment(e, postId) {
  e.preventDefault();                          // chặn trình duyệt tải lại trang
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));   // {author_name, content}
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const { comment } = await api('comments', { method: 'POST', body: { post_id: postId, ...data } });
    $('#commentList').insertAdjacentHTML('afterbegin', commentTemplate(comment));
    $('#commentList').firstElementChild.classList.add('is-new'); // trượt vào (animation card-in)
    $('#commentCount').textContent = Number($('#commentCount').textContent) + 1;
    form.reset();
    showToast('Cảm ơn bạn đã bình luận!');
  } catch (err) {
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

// ---------------------------------------------------------------------
// 9) GẮN SỰ KIỆN CHUNG
// ---------------------------------------------------------------------
export function initModal() {
  // Mọi phần tử có data-open="slug" (showcase, timeline) đều mở modal
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) openPost(opener.dataset.open);
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.contains('is-open') && closeModal());

  // Mở sẵn bài nếu URL có ?post=slug (link chia sẻ)
  const slug = new URLSearchParams(location.search).get('post');
  if (slug) openPost(slug);
}
