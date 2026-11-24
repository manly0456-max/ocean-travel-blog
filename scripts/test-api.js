// =====================================================================
//  scripts/test-api.js – KIỂM THỬ NHANH CÁC API
//  Bước 1: npm run dev   (ở 1 terminal)
//  Bước 2: npm run test:api  (ở terminal khác)
//  Có thể test bản đã deploy:  BASE_URL=https://ten-du-an.vercel.app npm run test:api
// =====================================================================
require('../lib/env').loadEnv();
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const ADMIN = process.env.ADMIN_KEY;

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name} -> ${e.message}`); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }

async function call(method, path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

(async () => {
  console.log(`🧪 Test API tại ${BASE}\n`);
  let postId, slug, newId;

  await check('GET /api/posts trả danh sách', async () => {
    const r = await call('GET', '/api/posts');
    expect(r.status === 200 && r.data.posts.length > 0, 'không có bài viết');
    postId = r.data.posts[0].id; slug = r.data.posts[0].slug;
  });
  await check('GET /api/posts?category=beach chỉ có bài biển', async () => {
    const r = await call('GET', '/api/posts?category=beach');
    expect(r.data.posts.every((p) => p.category === 'beach'), 'lọc sai');
  });
  await check('GET /api/posts?q=sa pa tìm kiếm', async () => {
    const r = await call('GET', '/api/posts?q=' + encodeURIComponent('Sa Pa'));
    expect(r.data.posts.length >= 1, 'không tìm thấy');
  });
  await check('GET /api/posts?slug= chi tiết + bình luận', async () => {
    const r = await call('GET', `/api/posts?slug=${slug}`);
    expect(r.status === 200 && r.data.post.content && Array.isArray(r.data.comments), 'thiếu dữ liệu');
  });
  await check('GET slug không tồn tại -> 404', async () => {
    const r = await call('GET', '/api/posts?slug=khong-co');
    expect(r.status === 404, `status ${r.status}`);
  });
  await check('POST /api/likes tăng tim', async () => {
    const r = await call('POST', '/api/likes', { post_id: postId });
    expect(r.status === 200 && typeof r.data.likes === 'number', 'không tăng');
  });
  await check('POST /api/comments thêm bình luận', async () => {
    const r = await call('POST', '/api/comments', { post_id: postId, author_name: 'Tester', content: 'Bài viết hay quá!' });
    expect(r.status === 201, `status ${r.status}`);
  });
  await check('POST /api/comments thiếu dữ liệu -> 400', async () => {
    const r = await call('POST', '/api/comments', { post_id: postId });
    expect(r.status === 400, `status ${r.status}`);
  });
  await check('POST /api/subscribe email hợp lệ', async () => {
    const r = await call('POST', '/api/subscribe', { email: `test${Date.now()}@mail.com` });
    expect(r.status === 201, `status ${r.status}`);
  });
  await check('POST /api/subscribe email sai -> 400', async () => {
    const r = await call('POST', '/api/subscribe', { email: 'abc' });
    expect(r.status === 400, `status ${r.status}`);
  });
  await check('POST /api/contact gửi tin nhắn', async () => {
    const r = await call('POST', '/api/contact', { name: 'Tester', email: 'a@b.com', message: 'Xin chào, mình muốn hợp tác!' });
    expect(r.status === 201, `status ${r.status}`);
  });
  await check('GET /api/stats có số liệu', async () => {
    const r = await call('GET', '/api/stats');
    expect(r.data.posts > 0 && r.data.countries > 0, 'sai số liệu');
  });
  await check('POST /api/posts không có key -> 401', async () => {
    const r = await call('POST', '/api/posts', { title: 'x' });
    expect(r.status === 401, `status ${r.status}`);
  });
  await check('POST /api/posts (admin) tạo bài', async () => {
    const r = await call('POST', '/api/posts', {
      title: 'Bài test Đà Lạt', excerpt: 'Tóm tắt', content: 'Nội dung', category: 'mountain',
      location: 'Lâm Đồng', country: 'Việt Nam', slug: `test-${Date.now()}`,
    }, { 'x-admin-key': ADMIN });
    expect(r.status === 201, `status ${r.status}`);
    newId = r.data.post.id;
  });
  await check('PUT /api/posts (admin) sửa bài', async () => {
    const r = await call('PUT', `/api/posts?id=${newId}`, {
      title: 'Bài test Đà Lạt (đã sửa)', excerpt: 'Tóm tắt', content: 'Nội dung', category: 'city',
      location: 'Lâm Đồng', country: 'Việt Nam',
    }, { 'x-admin-key': ADMIN });
    expect(r.status === 200 && r.data.post.category === 'city', `status ${r.status}`);
  });
  await check('DELETE /api/posts (admin) xoá bài', async () => {
    const r = await call('DELETE', `/api/posts?id=${newId}`, null, { 'x-admin-key': ADMIN });
    expect(r.status === 200, `status ${r.status}`);
  });
  await check('PATCH /api/posts -> 405', async () => {
    const r = await call('PATCH', '/api/posts');
    expect(r.status === 405, `status ${r.status}`);
  });

  console.log(`\nKết quả: ${passed} đạt, ${failed} lỗi`);
  process.exit(failed ? 1 : 0);
})();
