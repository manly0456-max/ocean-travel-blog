// =====================================================================
//  js/main.js – ĐIỂM KHỞI ĐỘNG (entry point)
//  Nhập các module rồi gọi hàm init theo thứ tự hợp lý.
// =====================================================================
import { api } from './api.js';
import { $ } from './utils.js';
import * as fx from './effects.js';
import * as blog from './blog.js';
import { initNewsletter, initContactForm } from './forms.js';

// 1) Hiệu ứng không cần dữ liệu -> chạy ngay
fx.initCursor();
fx.initHeroSpotlight();
fx.initBubbles();
fx.initTyping();
fx.initScrollProgress();
fx.initHeader();
fx.initScrollSpy();
fx.initMobileMenu();
fx.initParallax();
fx.initTilt();
fx.initMagnetic();
fx.initRipple();
fx.initTimelineDraw();
fx.initFaq();
fx.initLightbox();
fx.observeReveal();

// 2) Form & modal
initNewsletter();
initContactForm();
blog.initFilters();
blog.initModal();
$('#year').textContent = new Date().getFullYear();

// 3) Gọi API song song bằng Promise.all -> nhanh hơn gọi lần lượt
async function loadData() {
  const minDelay = new Promise((r) => setTimeout(r, 900));   // preloader hiện ít nhất 0.9s cho đẹp
  try {
    const [stats, { posts }] = await Promise.all([api('stats'), api('posts')]);
    blog.renderShowcase(posts);
    blog.renderTimeline(posts);
    blog.renderGallery(posts);
    await minDelay;
    fx.hidePreloader();
    fx.initCounters(stats);          // đếm số sau khi preloader biến mất
  } catch (err) {
    await minDelay;
    fx.hidePreloader();
    fx.showToast(`Không kết nối được máy chủ: ${err.message}`, 'error');
  }
}

loadData();
blog.loadPosts();                     // danh sách bài (có skeleton riêng)
