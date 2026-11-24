// =====================================================================
//  api/posts.js – CRUD BÀI VIẾT
//  GET    /api/posts                     -> danh sách (lọc ?category=, ?q=, ?featured=1)
//  GET    /api/posts?slug=ha-long        -> chi tiết 1 bài + bình luận (+1 lượt xem)
//  POST   /api/posts            (admin)  -> tạo bài mới
//  PUT    /api/posts?id=3       (admin)  -> sửa bài
//  DELETE /api/posts?id=3       (admin)  -> xoá bài
// =====================================================================
const { query } = require('../lib/db');
const { sendJson, getBody, isAdmin, cleanText, slugify, createHandler } = require('../lib/http');

const CATEGORIES = ['beach', 'mountain', 'city', 'food'];

// Các cột trả về cho danh sách (không lấy "content" cho nhẹ)
const LIST_COLUMNS = `
  p.id, p.slug, p.title, p.excerpt, p.category, p.location, p.country,
  p.cover_image, p.read_minutes, p.distance_km, p.likes, p.views,
  p.travel_date, p.is_featured, p.created_at,
  (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count`;

// ---------- GET ----------
async function getPosts(req, res) {
  const { slug, category, q, featured } = req.query;

  // 1) Lấy CHI TIẾT 1 bài theo slug
  if (slug) {
    // UPDATE ... RETURNING: vừa tăng lượt xem vừa lấy dữ liệu trong 1 câu lệnh.
    // Admin mở bài để sửa thì KHÔNG tính lượt xem.
    const sql = isAdmin(req)
      ? 'SELECT * FROM posts WHERE slug = $1'
      : 'UPDATE posts SET views = views + 1 WHERE slug = $1 RETURNING *';
    const rows = await query(sql, [cleanText(slug, 120)]);
    if (rows.length === 0) return sendJson(res, 404, { error: 'Không tìm thấy bài viết' });

    const comments = await query(
      `SELECT id, author_name, content, created_at
         FROM comments WHERE post_id = $1 ORDER BY created_at DESC`,
      [rows[0].id]
    );
    return sendJson(res, 200, { post: rows[0], comments });
  }

  // 2) Lấy DANH SÁCH – xây câu WHERE động nhưng vẫn dùng tham số $n (an toàn)
  const conditions = [];
  const params = [];

  if (category && CATEGORIES.includes(category)) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (q) {
    params.push(`%${cleanText(q, 80)}%`);
    const i = params.length;
    conditions.push(`(p.title ILIKE $${i} OR p.excerpt ILIKE $${i} OR p.location ILIKE $${i} OR p.country ILIKE $${i})`);
  }
  if (featured === '1') conditions.push('p.is_featured = TRUE');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const posts = await query(
    `SELECT ${LIST_COLUMNS} FROM posts p ${where} ORDER BY p.travel_date DESC NULLS LAST, p.id DESC`,
    params
  );
  return sendJson(res, 200, { posts });
}

// Kiểm tra & chuẩn hoá dữ liệu bài viết gửi lên
function validatePost(body, { partial = false } = {}) {
  const data = {
    title: cleanText(body.title, 200),
    excerpt: cleanText(body.excerpt, 400),
    content: cleanText(body.content, 20000),
    category: cleanText(body.category, 20),
    location: cleanText(body.location, 120),
    country: cleanText(body.country, 80),
    cover_image: cleanText(body.cover_image, 255) || '/assets/img/halong.jpg',
    read_minutes: Math.max(1, parseInt(body.read_minutes, 10) || 5),
    distance_km: Math.max(0, parseInt(body.distance_km, 10) || 0),
    // Chỉ nhận ngày dạng YYYY-MM-DD, sai định dạng -> null
    travel_date: /^\d{4}-\d{2}-\d{2}$/.test(body.travel_date || '') ? body.travel_date : null,
    is_featured: Boolean(body.is_featured),
  };
  if (!partial) {
    const required = ['title', 'excerpt', 'content', 'location', 'country'];
    const missing = required.filter((k) => !data[k]);
    if (missing.length) return { error: `Thiếu trường: ${missing.join(', ')}` };
  }
  if (!CATEGORIES.includes(data.category)) return { error: 'Danh mục không hợp lệ' };
  return { data };
}

// ---------- POST (tạo) ----------
async function createPost(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const { data, error } = validatePost(getBody(req));
  if (error) return sendJson(res, 400, { error });

  const slug = slugify(getBody(req).slug || data.title);
  const rows = await query(
    `INSERT INTO posts (slug, title, excerpt, content, category, location, country,
                        cover_image, read_minutes, distance_km, travel_date, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [slug, data.title, data.excerpt, data.content, data.category, data.location, data.country,
     data.cover_image, data.read_minutes, data.distance_km, data.travel_date, data.is_featured]
  );
  return sendJson(res, 201, { post: rows[0] });
}

// ---------- PUT (sửa) ----------
async function updatePost(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const id = parseInt(req.query.id, 10);
  if (!id) return sendJson(res, 400, { error: 'Thiếu id bài viết' });

  const { data, error } = validatePost(getBody(req));
  if (error) return sendJson(res, 400, { error });

  const rows = await query(
    `UPDATE posts SET title=$1, excerpt=$2, content=$3, category=$4, location=$5, country=$6,
            cover_image=$7, read_minutes=$8, distance_km=$9, travel_date=$10, is_featured=$11
      WHERE id=$12 RETURNING *`,
    [data.title, data.excerpt, data.content, data.category, data.location, data.country,
     data.cover_image, data.read_minutes, data.distance_km, data.travel_date, data.is_featured, id]
  );
  if (rows.length === 0) return sendJson(res, 404, { error: 'Không tìm thấy bài viết' });
  return sendJson(res, 200, { post: rows[0] });
}

// ---------- DELETE (xoá) ----------
async function deletePost(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Bạn cần quyền quản trị' });
  const id = parseInt(req.query.id, 10);
  const rows = await query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
  if (rows.length === 0) return sendJson(res, 404, { error: 'Không tìm thấy bài viết' });
  return sendJson(res, 200, { deleted: rows[0].id });
}

// Gắn mỗi HTTP method với 1 hàm xử lý
module.exports = createHandler({
  GET: getPosts,
  POST: createPost,
  PUT: updatePost,
  DELETE: deletePost,
});
