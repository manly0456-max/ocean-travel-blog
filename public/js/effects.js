// =====================================================================
//  js/effects.js – TẤT CẢ HIỆU ỨNG ĐỘNG
//  Mỗi hiệu ứng là 1 hàm độc lập, đánh số #1 -> #20 để dễ thuyết trình.
//  Ý tưởng chung: JS chỉ "đo" (vị trí chuột, % cuộn...) rồi gán vào
//  biến CSS hoặc thêm/bớt class; còn việc "vẽ" chuyển động do CSS làm.
// =====================================================================
import { $, $$, canHover, reduceMotion, formatNumber } from './utils.js';

// ---------------------------------------------------------------------
// #1 PRELOADER – ẩn màn hình chờ khi trang đã tải xong
// ---------------------------------------------------------------------
export function hidePreloader() {
  $('#preloader')?.classList.add('is-done');
  document.body.classList.remove('is-loading');
}

// ---------------------------------------------------------------------
// #2 CON TRỎ TUỲ CHỈNH – chấm nhỏ bám sát chuột, vòng tròn đuổi theo "trễ"
//     Kỹ thuật LERP (nội suy tuyến tính): mỗi khung hình vòng tròn đi
//     thêm 15% quãng đường còn lại -> chuyển động mềm, có quán tính.
// ---------------------------------------------------------------------
export function initCursor() {
  if (!canHover()) return;
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  (function loop() {
    ringX += (mouseX - ringX) * 0.15;   // lerp
    ringY += (mouseY - ringY) * 0.15;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);         // gọi lại ở khung hình kế tiếp (~60 lần/giây)
  })();

  // Phóng to vòng tròn khi rê lên phần tử bấm được (dùng event delegation)
  document.addEventListener('mouseover', (e) => {
    ring.classList.toggle('is-hover', !!e.target.closest('a, button, .card, .gallery__item, input, textarea'));
  });
}

// ---------------------------------------------------------------------
// #3 HERO GRID SPOTLIGHT – lưới sáng lên tại vị trí chuột (Luminary)
//     JS chỉ cập nhật 2 biến CSS --mx, --my; CSS mask-image lo phần vẽ.
// ---------------------------------------------------------------------
export function initHeroSpotlight() {
  const hero = $('.hero');
  const grid = $('#heroGrid');
  if (!hero || !grid) return;
  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    grid.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    grid.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
}

// ---------------------------------------------------------------------
// #4 BONG BÓNG NƯỚC (Canvas 2D) – các hạt tròn nổi dần lên như dưới biển
// ---------------------------------------------------------------------
export function initBubbles() {
  const canvas = $('#bubbles');
  if (!canvas || reduceMotion()) return;
  const ctx = canvas.getContext('2d');
  let w, h, bubbles = [];

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    // Số bong bóng tỉ lệ với diện tích màn hình
    bubbles = Array.from({ length: Math.round((w * h) / 22000) }, () => createBubble(true));
  }
  function createBubble(randomY = false) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 20,
      r: Math.random() * 3 + 1,              // bán kính 1–4px
      speed: Math.random() * 0.6 + 0.2,      // tốc độ nổi lên
      drift: Math.random() * Math.PI * 2,    // pha dao động ngang
      alpha: Math.random() * 0.5 + 0.2,
    };
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const b of bubbles) {
      b.y -= b.speed;
      b.drift += 0.02;
      b.x += Math.sin(b.drift) * 0.3;        // lắc lư nhẹ theo hình sin
      if (b.y < -10) Object.assign(b, createBubble());
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 245, 223, ${b.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  draw();
}

// ---------------------------------------------------------------------
// #5 HIỆU ỨNG GÕ CHỮ – lần lượt gõ / xoá tên các điểm đến
// ---------------------------------------------------------------------
export function initTyping(words = ['Hạ Long', 'Sa Pa', 'Hội An', 'Kyoto', 'Santorini', 'Bali']) {
  const el = $('#typed');
  if (!el) return;
  let wordIndex = 0, charIndex = words[0].length, deleting = true;

  function tick() {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = word.slice(0, charIndex);

    let delay = deleting ? 60 : 120;                         // xoá nhanh hơn gõ
    if (!deleting && charIndex === word.length) { delay = 1800; deleting = true; } // gõ xong: dừng ngắm
    else if (deleting && charIndex === 0) {                   // xoá hết: sang từ mới
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 300;
    }
    setTimeout(tick, delay);
  }
  setTimeout(tick, 2200);
}

// ---------------------------------------------------------------------
// #6 SCROLL REVEAL – phần tử hiện dần khi cuộn tới
//     IntersectionObserver báo khi phần tử lọt vào màn hình
//     (hiệu quả hơn nhiều so với lắng nghe sự kiện scroll).
// ---------------------------------------------------------------------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);   // hiện 1 lần rồi thôi theo dõi
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

/** Theo dõi mọi [data-reveal] trong `root` (gọi lại sau khi JS chèn HTML mới) */
export function observeReveal(root = document) {
  $$('[data-reveal]:not(.is-visible)', root).forEach((el) => revealObserver.observe(el));
}

// ---------------------------------------------------------------------
// #7 BỘ ĐẾM SỐ – chạy từ 0 đến giá trị thật với hàm easing
// ---------------------------------------------------------------------
function animateCount(el, target, duration = 2000) {
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);   // 0 -> 1
    const eased = 1 - Math.pow(1 - progress, 4);              // easeOutQuart: nhanh rồi chậm dần
    el.textContent = formatNumber(Math.round(target * eased)) + (progress === 1 ? suffix : '');
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/** Nhận object thống kê từ API, gán vào các thẻ [data-stat] và chạy khi thấy */
export function initCounters(stats) {
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target, Number(entry.target.dataset.count));
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  $$('[data-stat]').forEach((el) => {
    el.dataset.count = stats[el.dataset.stat] ?? 0;
    counterObserver.observe(el);
  });
}

// ---------------------------------------------------------------------
// Tiện ích: gom mọi việc cần làm khi cuộn vào 1 vòng requestAnimationFrame
// -> tối đa 1 lần cập nhật / khung hình, cuộn mượt không giật.
// ---------------------------------------------------------------------
const scrollTasks = [];
let ticking = false;
export function onScroll(task) {
  scrollTasks.push(task);
  task(window.scrollY);
}
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    scrollTasks.forEach((task) => task(window.scrollY));
    ticking = false;
  });
}, { passive: true });

// ---------------------------------------------------------------------
// #8 THANH TIẾN ĐỘ CUỘN (side panel trái) + #9 VÒNG TRÒN NÚT LÊN ĐẦU TRANG
// ---------------------------------------------------------------------
export function initScrollProgress() {
  const bar = $('#scrollBar');
  const percentEl = $('#scrollPercent');
  const toTop = $('#toTop');
  const ring = $('#toTopRing');
  const CIRCUMFERENCE = 2 * Math.PI * 21;        // chu vi vòng tròn r = 21

  onScroll((y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? y / max : 0;       // 0 -> 1
    bar.style.transform = `scaleY(${progress})`;
    percentEl.textContent = `${Math.round(progress * 100)}%`;
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress); // vẽ dần vòng tròn
    toTop.classList.toggle('is-visible', y > 600);
  });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ---------------------------------------------------------------------
// #10 HEADER THÔNG MINH – nền kính mờ khi cuộn, ẩn khi cuộn xuống, hiện khi cuộn lên
// ---------------------------------------------------------------------
export function initHeader() {
  const header = $('#header');
  let lastY = 0;
  onScroll((y) => {
    header.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY && y > 400;
    if (!document.body.classList.contains('no-scroll')) header.classList.toggle('is-hidden', goingDown);
    lastY = y;
  });
}

// ---------------------------------------------------------------------
// #11 SCROLLSPY – tô sáng chấm bên phải & link menu của section đang xem
// ---------------------------------------------------------------------
export function initScrollSpy() {
  const links = $$('#sideDots a, .nav__link');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });   // "vùng kích hoạt" là dải giữa màn hình
  $$('[data-section]').forEach((s) => spy.observe(s));
}

// ---------------------------------------------------------------------
// #12 MENU TOÀN MÀN HÌNH (mobile) – clip-path hình tròn lan rộng
// ---------------------------------------------------------------------
export function initMobileMenu() {
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  const toggle = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('no-scroll', open);
  };
  burger.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && toggle(false));
}

// ---------------------------------------------------------------------
// #13 PARALLAX – lớp nền di chuyển chậm hơn nội dung tạo chiều sâu
// ---------------------------------------------------------------------
export function initParallax() {
  if (reduceMotion()) return;
  onScroll((y) => {
    // Nền hero: dịch xuống theo tỉ lệ data-speed
    $$('[data-speed]').forEach((el) => {
      el.style.transform = `translateY(${y * Number(el.dataset.speed)}px)`;
    });
    // Ảnh trong showcase: dịch theo vị trí khung ảnh so với giữa màn hình
    $$('.showcase__media').forEach((media) => {
      const rect = media.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;           // ngoài màn hình thì bỏ qua
      const offset = (rect.top + rect.height / 2 - innerHeight / 2) * -0.12;
      media.querySelector('img').style.setProperty('--parallax', `${offset - 40}px`);
    });
  });
}

// ---------------------------------------------------------------------
// #14 THẺ NGHIÊNG 3D + VỆT SÁNG (tilt & glare)
//     Tính vị trí chuột trong thẻ (0..1) -> đổi thành góc xoay ±8 độ.
// ---------------------------------------------------------------------
export function applyTilt(el, maxDeg = 8) {
  if (!canHover()) return;
  el.addEventListener('pointermove', (e) => {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0 (trái) -> 1 (phải)
    const py = (e.clientY - rect.top) / rect.height;   // 0 (trên) -> 1 (dưới)
    el.style.setProperty('--ry', `${(px - 0.5) * maxDeg * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * maxDeg * 2}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  });
  el.addEventListener('pointerleave', () => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
}
export function initTilt() { $$('[data-tilt]').forEach((el) => applyTilt(el, 6)); }

// ---------------------------------------------------------------------
// #15 NÚT NAM CHÂM – nút bị "hút" nhẹ theo con trỏ
// ---------------------------------------------------------------------
export function initMagnetic() {
  if (!canHover()) return;
  $$('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

// ---------------------------------------------------------------------
// #16 RIPPLE – gợn sóng lan ra tại điểm click (event delegation)
// ---------------------------------------------------------------------
export function initRipple() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ripple]');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove()); // dọn dẹp khi xong
  });
}

// ---------------------------------------------------------------------
// #17 TIMELINE TỰ VẼ – đường trục dài ra theo tiến độ cuộn qua section
// ---------------------------------------------------------------------
export function initTimelineDraw() {
  const wrap = $('#timelineWrap');
  const fill = $('#timelineFill');
  if (!wrap) return;
  onScroll(() => {
    const rect = wrap.getBoundingClientRect();
    const start = innerHeight * 0.7;                              // bắt đầu vẽ khi đỉnh timeline tới 70% màn hình
    const progress = Math.min(Math.max((start - rect.top) / rect.height, 0), 1);
    fill.style.transform = `scaleY(${progress})`;
  });
}

// ---------------------------------------------------------------------
// #18 FAQ ACCORDION – mở/đóng từng câu + nút "Mở tất cả"
// ---------------------------------------------------------------------
export function initFaq() {
  const items = $$('.faq__item');
  const toggleAllBtn = $('#toggleAll');
  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__q').setAttribute('aria-expanded', open);
  };
  items.forEach((item) => {
    item.querySelector('.faq__q').addEventListener('click', () => setOpen(item, !item.classList.contains('is-open')));
  });
  toggleAllBtn?.addEventListener('click', () => {
    const openAll = !items.every((i) => i.classList.contains('is-open'));
    items.forEach((i) => setOpen(i, openAll));
    toggleAllBtn.textContent = openAll ? 'Đóng tất cả' : 'Mở tất cả';
  });
}

// ---------------------------------------------------------------------
// #19 LIGHTBOX – xem ảnh lớn, chuyển ảnh bằng nút hoặc phím ← →
// ---------------------------------------------------------------------
let lightboxItems = [];
let lightboxIndex = 0;
export function openLightbox(items, index) {
  lightboxItems = items;
  lightboxIndex = index;
  renderLightbox();
  $('#lightbox').classList.add('is-open');
  document.body.classList.add('no-scroll');
}
function renderLightbox() {
  const item = lightboxItems[lightboxIndex];
  $('#lightboxImg').src = item.src;
  $('#lightboxImg').alt = item.caption;
  $('#lightboxCap').textContent = item.caption;
}
export function initLightbox() {
  const box = $('#lightbox');
  const close = () => { box.classList.remove('is-open'); document.body.classList.remove('no-scroll'); };
  const go = (step) => {
    lightboxIndex = (lightboxIndex + step + lightboxItems.length) % lightboxItems.length; // vòng tròn
    renderLightbox();
  };
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__nav--prev', box).addEventListener('click', () => go(-1));
  $('.lightbox__nav--next', box).addEventListener('click', () => go(1));
  box.addEventListener('click', (e) => e.target === box && close());
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
}

// ---------------------------------------------------------------------
// #20 TOAST – thông báo nhỏ trượt vào góc màn hình rồi tự biến mất
// ---------------------------------------------------------------------
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '🌊' : '⚠️'}</span><span></span>`;
  toast.lastChild.textContent = message;          // textContent -> an toàn, không chèn HTML
  $('#toastStack').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
