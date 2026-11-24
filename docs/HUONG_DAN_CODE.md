# 📘 HƯỚNG DẪN CODE CHI TIẾT — WANDERWAVE TRAVEL BLOG

> Tài liệu giải thích **từng bước, từng file, từng kỹ thuật** của dự án *Wanderwave – Personal Travel Blog* (full-stack: HTML/CSS/JS + Vercel Serverless API + PostgreSQL).
> Đọc theo thứ tự từ Bước 0 → Bước 12, mỗi bước tương ứng với 1 (hoặc vài) commit trong lịch sử Git.

---

## MỤC LỤC

0. [Tổng quan & kiến trúc](#bước-0--tổng-quan--kiến-trúc)
1. [Chuẩn bị môi trường](#bước-1--chuẩn-bị-môi-trường)
2. [Khởi tạo dự án](#bước-2--khởi-tạo-dự-án-commit-1)
3. [Cơ sở dữ liệu PostgreSQL](#bước-3--cơ-sở-dữ-liệu-postgresql-commit-2)
4. [Backend REST API](#bước-4--backend-rest-api-commit-3)
5. [Dev server & kiểm thử API](#bước-5--dev-server--kiểm-thử-api-commit-4)
6. [Ảnh minh hoạ & HTML](#bước-6--ảnh-minh-hoạ--cấu-trúc-html-commit-5-6)
7. [CSS giao diện](#bước-7--css-giao-diện-commit-7)
8. [CSS animations](#bước-8--css-animations-commit-8)
9. [JavaScript: 20 hiệu ứng động](#bước-9--javascript-20-hiệu-ứng-động-commit-9-10)
10. [JavaScript: kết nối backend](#bước-10--javascript-kết-nối-backend-commit-11-12)
11. [Trang quản trị (Admin)](#bước-11--trang-quản-trị-commit-14)
12. [Deploy lên Vercel](#bước-12--deploy-lên-vercel)
13. [Lịch sử commit](#lịch-sử-commit)
14. [Câu hỏi vấn đáp khi bảo vệ đồ án](#câu-hỏi-vấn-đáp-khi-bảo-vệ)

---

## BƯỚC 0 — TỔNG QUAN & KIẾN TRÚC

### 0.1. Website làm được gì?

| Chức năng | Người dùng | Ghi chú |
|-----------|-----------|---------|
| Xem danh sách bài viết du lịch | Khách | Dữ liệu lấy từ PostgreSQL |
| Lọc theo danh mục, tìm kiếm | Khách | Biển đảo / Núi rừng / Phố thị / Ẩm thực |
| Đọc chi tiết bài (modal) | Khách | Tự tăng lượt xem |
| Thả tim / bỏ tim | Khách | Lưu trạng thái ở localStorage |
| Bình luận | Khách | Lưu vào bảng `comments` |
| Đăng ký nhận tin | Khách | Bảng `subscribers`, không trùng email |
| Gửi liên hệ | Khách | Bảng `contacts` |
| Thêm / sửa / xoá bài, xem tin nhắn | Admin | Bảo vệ bằng `ADMIN_KEY` |

### 0.2. Kiến trúc 3 tầng

```
┌────────────────────────── TRÌNH DUYỆT (Frontend) ──────────────────────────┐
│ index.html + style.css + animations.css + JS modules (main, effects, blog) │
│                        fetch('/api/...')  (JSON)                           │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTPS
┌─────────────────────── VERCEL SERVERLESS (Backend) ────────────────────────┐
│ api/posts.js  api/comments.js  api/likes.js  api/subscribe.js              │
│ api/contact.js  api/stats.js   ─── dùng chung lib/http.js, lib/db.js       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ SQL có tham số ($1, $2...)
┌──────────────────────── NEON POSTGRESQL (Database) ────────────────────────┐
│ posts ─1:N─ comments        subscribers        contacts                    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Serverless là gì?** Mỗi file trong thư mục `api/` là một *hàm* (function). Khi có request tới `/api/posts`, Vercel "đánh thức" hàm `api/posts.js`, chạy xong thì tắt. Ta **không phải tự thuê/quản lý server**, chỉ trả theo lượt dùng (gói Hobby miễn phí).

### 0.3. Cấu trúc thư mục

```
ocean-travel-blog/
├── api/            ← BACKEND: 6 endpoint serverless
├── lib/            ← code dùng chung cho backend (db, http, env)
├── sql/            ← schema.sql (tạo bảng) + seed.sql (dữ liệu mẫu)
├── scripts/        ← init-db.js, test-api.js, generate-images.py
├── public/         ← FRONTEND: Vercel phục vụ nguyên thư mục này
│   ├── index.html, admin.html
│   ├── css/  style.css, animations.css, admin.css
│   ├── js/   main.js, effects.js, blog.js, forms.js, api.js, utils.js, admin.js
│   └── assets/img/
├── docs/           ← tài liệu này, báo cáo, slide, ảnh chụp màn hình
├── dev-server.js   ← server chạy local giả lập Vercel
├── vercel.json     ← cấu hình deploy
└── package.json
```

---

## BƯỚC 1 — CHUẨN BỊ MÔI TRƯỜNG

1. Cài **Node.js ≥ 18** (khuyên dùng bản LTS 22): kiểm tra bằng `node -v`.
2. Cài **Git**: `git --version`.
3. Editor: **VS Code** (+ extension *Live Server* không cần thiết vì đã có `dev-server.js`).
4. Tạo tài khoản **GitHub** và **Vercel** (đăng nhập Vercel bằng GitHub cho tiện).
5. Database: dùng **Neon** qua Vercel Marketplace (miễn phí) – hướng dẫn ở Bước 12. Muốn chạy hoàn toàn offline thì cài PostgreSQL trên máy.

---

## BƯỚC 2 — KHỞI TẠO DỰ ÁN (commit 1)

```bash
mkdir ocean-travel-blog && cd ocean-travel-blog
git init -b main
npm init -y
npm install pg
```

### `package.json` – các lệnh tắt

```json
"scripts": {
  "dev": "node dev-server.js",      // npm run dev      -> chạy web local
  "db:init": "node scripts/init-db.js", // npm run db:init -> tạo bảng + dữ liệu
  "test:api": "node scripts/test-api.js" // npm run test:api -> kiểm thử API
},
"dependencies": { "pg": "^8.13.0" }  // thư viện DUY NHẤT: driver PostgreSQL
```

> 💡 **Điểm cộng khi thuyết trình:** dự án chỉ có **1 dependency** (`pg`). Toàn bộ hiệu ứng được viết bằng CSS + JavaScript thuần, không dùng jQuery, GSAP hay framework nào.

### `vercel.json` – cấu hình Vercel

```json
{
  "outputDirectory": "public",   // thư mục chứa web tĩnh
  "cleanUrls": true,             // /admin tự hiểu là /admin.html
  "functions": { "api/*.js": { "maxDuration": 10 } }, // mỗi hàm chạy tối đa 10s
  "headers": [ ... ]             // không cache API, cache ảnh 7 ngày
}
```

### `.env.example` – mẫu biến môi trường

| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_URL` | Chuỗi kết nối Postgres (`postgres://user:pass@host/db`) |
| `ADMIN_KEY` | "Mật khẩu" vào trang /admin |
| `PORT` | Cổng chạy local (mặc định 3000) |

File `.env` thật **không được commit** (đã có trong `.gitignore`) vì chứa mật khẩu.

---

## BƯỚC 3 — CƠ SỞ DỮ LIỆU POSTGRESQL (commit 2)

### 3.1. Sơ đồ quan hệ (ERD)

```
┌──────────────────────┐          ┌─────────────────────┐
│        posts         │          │      comments       │
├──────────────────────┤          ├─────────────────────┤
│ PK id         SERIAL │◄────┐    │ PK id        SERIAL │
│    slug  UNIQUE      │     └────┤ FK post_id      INT │
│    title, excerpt    │   1 : N  │    author_name      │
│    content           │          │    content          │
│    category CHECK    │          │    created_at       │
│    location, country │          └─────────────────────┘
│    cover_image       │
│    read_minutes      │   ┌───────────────────┐  ┌─────────────────────┐
│    distance_km       │   │    subscribers    │  │      contacts       │
│    likes, views      │   ├───────────────────┤  ├─────────────────────┤
│    travel_date       │   │ PK id             │  │ PK id               │
│    is_featured       │   │    email UNIQUE   │  │    name, email      │
│    created_at        │   │    created_at     │  │    message          │
└──────────────────────┘   └───────────────────┘  │    created_at       │
                                                  └─────────────────────┘
```

### 3.2. `sql/schema.sql` – giải thích từng ràng buộc

```sql
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,           -- số nguyên tự tăng 1,2,3...
  slug        VARCHAR(120) NOT NULL UNIQUE, -- "ha-long-vinh-ngoc", dùng trên URL
  category    VARCHAR(20) NOT NULL
              CHECK (category IN ('beach','mountain','city','food')),
  likes       INT NOT NULL DEFAULT 0 CHECK (likes >= 0),
  ...
);
```

| Ràng buộc | Tác dụng |
|-----------|----------|
| `PRIMARY KEY` | Định danh duy nhất mỗi dòng |
| `NOT NULL` | Bắt buộc có giá trị |
| `UNIQUE` | Không trùng (slug, email) |
| `CHECK` | Giá trị phải thoả điều kiện (danh mục hợp lệ, số tim ≥ 0) |
| `DEFAULT` | Giá trị mặc định khi không truyền |
| `REFERENCES posts(id) ON DELETE CASCADE` | Khoá ngoại: bình luận phải thuộc 1 bài có thật; xoá bài → xoá luôn bình luận |
| `CREATE INDEX` | Tăng tốc truy vấn lọc theo `category`, sắp theo `created_at`, tìm bình luận theo `post_id` |

`IF NOT EXISTS` giúp chạy lại file bao nhiêu lần cũng không lỗi.

### 3.3. `sql/seed.sql` – dữ liệu mẫu

```sql
TRUNCATE comments, posts, subscribers, contacts RESTART IDENTITY CASCADE;
INSERT INTO posts (...) VALUES (...), (...);
```
- `TRUNCATE ... RESTART IDENTITY` xoá sạch dữ liệu và đặt lại bộ đếm id về 1 → seed lại không bị trùng.
- 10 bài viết (7 Việt Nam + Nhật, Indonesia, Thái Lan, Hy Lạp), 7 bình luận, 1 subscriber.

### 3.4. `lib/db.js` – kết nối bằng Connection Pool

```js
const { Pool, types } = require('pg');
types.setTypeParser(1082, (value) => value);  // DATE -> chuỗi 'YYYY-MM-DD'

function getPool() {
  if (!globalThis._wanderwavePool) {
    globalThis._wanderwavePool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalThis._wanderwavePool;
}

async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result.rows;
}
```

Giải thích:
- **Pool** giữ sẵn tối đa 5 kết nối để dùng lại → không phải "bắt tay" với database mỗi request (rất chậm).
- Lưu pool vào **`globalThis`**: trên serverless, cùng một "container" có thể xử lý nhiều request liên tiếp → dùng lại pool cũ.
- **SSL**: Neon bắt buộc kết nối mã hoá; Postgres trên máy (localhost) thì không.
- `setTypeParser(1082)`: mặc định `pg` đổi cột DATE thành đối tượng `Date` lúc 00:00 giờ máy, khi chuyển sang JSON (UTC) sẽ **lùi 1 ngày** ở Việt Nam (UTC+7). Trả về chuỗi gốc để tránh lỗi này.
- **`query(text, params)`**: dùng `$1, $2` làm chỗ giữ tham số → thư viện tự escape → **chống SQL Injection**.

> ❌ Sai (bị SQL Injection): ``query(`SELECT * FROM posts WHERE slug = '${slug}'`)``
> ✅ Đúng: `query('SELECT * FROM posts WHERE slug = $1', [slug])`

### 3.5. `scripts/init-db.js`

Đọc 2 file SQL rồi gửi lên database. Gọi `loadEnv()` **trước** khi `require('../lib/db')` vì `db.js` đọc `process.env.DATABASE_URL` ngay lúc được nạp.

```bash
npm run db:init            # tạo bảng + seed
npm run db:init -- --no-seed  # chỉ tạo bảng
```

---

## BƯỚC 4 — BACKEND REST API (commit 3)

### 4.1. Bảng endpoint

| Method | URL | Quyền | Mô tả | Mã trả về |
|--------|-----|-------|-------|-----------|
| GET | `/api/posts` | Khách | Danh sách, hỗ trợ `?category=`, `?q=`, `?featured=1` | 200 |
| GET | `/api/posts?slug=xxx` | Khách | Chi tiết + bình luận, +1 view | 200 / 404 |
| POST | `/api/posts` | Admin | Tạo bài | 201 / 400 / 401 / 409 |
| PUT | `/api/posts?id=1` | Admin | Sửa bài | 200 / 404 |
| DELETE | `/api/posts?id=1` | Admin | Xoá bài | 200 / 404 |
| GET | `/api/comments?post_id=1` | Khách | Bình luận của bài | 200 |
| POST | `/api/comments` | Khách | Thêm bình luận | 201 / 400 / 404 |
| POST | `/api/likes` | Khách | `{post_id, action}` thả/bỏ tim | 200 |
| POST | `/api/subscribe` | Khách | Đăng ký email | 201 / 200 (đã có) / 400 |
| GET | `/api/subscribe` | Admin | Danh sách email | 200 / 401 |
| POST | `/api/contact` | Khách | Gửi liên hệ | 201 / 400 |
| GET / DELETE | `/api/contact` | Admin | Xem / xoá tin nhắn | 200 / 401 |
| GET | `/api/stats` | Khách | Số liệu tổng hợp | 200 |

### 4.2. `lib/http.js` – "bộ đồ nghề" dùng chung

**a) `createHandler` – mẫu thiết kế gom method + bắt lỗi**

```js
function createHandler(methods) {
  return async function handler(req, res) {
    const fn = methods[req.method];          // tìm hàm theo GET/POST/...
    if (!fn) return sendJson(res, 405, {...}); // method không hỗ trợ
    try {
      await fn(req, res);
    } catch (err) {
      if (err.code === '23505') return sendJson(res, 409, ...); // trùng UNIQUE
      if (err.code === '23503') return sendJson(res, 404, ...); // sai khoá ngoại
      return sendJson(res, 500, ...);
    }
  };
}
```
Nhờ vậy mỗi file API chỉ cần khai báo:
```js
module.exports = createHandler({ GET: getPosts, POST: createPost, PUT: updatePost, DELETE: deletePost });
```

**b) `isAdmin(req)`** – so sánh header `x-admin-key` với biến môi trường bằng `crypto.timingSafeEqual` (thời gian so sánh không đổi → kẻ tấn công không đoán được mật khẩu dựa trên thời gian phản hồi).

**c) `cleanText(value, max)`** – ép về chuỗi, cắt khoảng trắng, giới hạn độ dài.

**d) `slugify(text)`** – bỏ dấu tiếng Việt:
```js
.normalize('NFD').replace(/[̀-ͯ]/g, '')  // "Hạ" -> "Ha" + dấu tách rời -> xoá dấu
.replace(/đ/g, 'd')                                  // đ không tách được nên thay tay
.replace(/[^a-z0-9]+/g, '-')                         // ký tự khác -> "-"
```

### 4.3. `api/posts.js` – điểm đáng chú ý

**Câu WHERE động nhưng vẫn an toàn:**
```js
const conditions = [], params = [];
if (category && CATEGORIES.includes(category)) {
  params.push(category);
  conditions.push(`p.category = $${params.length}`);   // -> "p.category = $1"
}
if (q) {
  params.push(`%${q}%`);
  conditions.push(`(p.title ILIKE $2 OR ...)`);        // ILIKE: không phân biệt hoa thường
}
```
Giá trị người dùng nhập **không bao giờ** được nối thẳng vào chuỗi SQL, chỉ có *số thứ tự* `$1, $2` được nối.

**Đếm bình luận bằng subquery:**
```sql
(SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
```
`::int` ép kiểu vì COUNT trả về `bigint` (thư viện pg sẽ đổi thành chuỗi).

**Tăng lượt xem & lấy dữ liệu trong 1 câu:**
```sql
UPDATE posts SET views = views + 1 WHERE slug = $1 RETURNING *
```

### 4.4. `api/likes.js` – tránh "race condition"

```sql
UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes
```
Nếu làm kiểu *đọc số tim → cộng 1 trong JS → ghi lại*, hai người bấm cùng lúc sẽ mất 1 lượt. Cộng trực tiếp trong SQL là **nguyên tử** (atomic). `GREATEST(likes - 1, 0)` đảm bảo không bao giờ âm.

### 4.5. `api/subscribe.js` – `ON CONFLICT`

```sql
INSERT INTO subscribers (email) VALUES ($1)
ON CONFLICT (email) DO NOTHING
RETURNING id
```
Email đã tồn tại → không chèn, không báo lỗi, `RETURNING` trả mảng rỗng → API trả "Email này đã đăng ký rồi".

### 4.6. `api/stats.js` – hàm tổng hợp

```sql
SELECT COUNT(*) AS posts, COUNT(DISTINCT country) AS countries,
       COALESCE(SUM(distance_km), 0) AS kilometers, ...
FROM posts;

SELECT category, COUNT(*) AS total FROM posts GROUP BY category;
```
`COALESCE(x, 0)`: nếu bảng rỗng thì SUM trả NULL → đổi thành 0.

---

## BƯỚC 5 — DEV SERVER & KIỂM THỬ API (commit 4)

### 5.1. `dev-server.js`

Vercel tự làm 2 việc mà Node thuần không có: phục vụ file tĩnh và gọi hàm trong `api/`. File này giả lập lại:

```js
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(res, url);
}).listen(PORT);
```
- `handleApi`: lấy tên sau `/api/`, `require('./api/<tên>.js')`, gắn `req.query` (từ URL) và `req.body` (parse JSON) **giống hệt Vercel**, rồi gọi hàm.
- `serveStatic`: đọc file trong `public/`, đặt `Content-Type` theo đuôi file (bảng MIME), chặn `../` (path traversal), hỗ trợ `cleanUrls`.

> Có thể thay bằng `npx vercel dev` nếu đã cài Vercel CLI.

### 5.2. `scripts/test-api.js` – 17 test case

```bash
npm run dev          # terminal 1
npm run test:api     # terminal 2
```
Kiểm tra: lấy danh sách, lọc, tìm kiếm, chi tiết, 404, thả tim, bình luận hợp lệ/thiếu dữ liệu, email đúng/sai, liên hệ, thống kê, tạo bài không có key (401), tạo/sửa/xoá bài với key, method không hỗ trợ (405). Kết quả: **17/17 đạt**.

Test bản đã deploy: `BASE_URL=https://ten-du-an.vercel.app npm run test:api`.

---

## BƯỚC 6 — ẢNH MINH HOẠ & CẤU TRÚC HTML (commit 5, 6)

### 6.1. Ảnh tự sinh – `scripts/generate-images.py`

Để không vi phạm bản quyền ảnh, 12 ảnh phong cảnh được **vẽ bằng code Python (thư viện Pillow)**:
- `gradient()` – bầu trời chuyển màu.
- `ridge()` – dãy núi bằng thuật toán **midpoint displacement** (chia đôi đoạn thẳng, dịch điểm giữa ngẫu nhiên, lặp lại với biên độ giảm dần).
- `sea()` – mặt biển + vệt sóng lấp lánh tập trung dưới mặt trời.
- `glow()` – mặt trời/đèn lồng có quầng sáng (Gaussian blur).

Muốn dùng ảnh thật: chép ảnh vào `public/assets/img/` với cùng tên file.

### 6.2. `public/index.html` – bố cục

| # | Khối | Vai trò |
|---|------|---------|
| 1 | `.preloader` | Màn hình chờ với 5 cột sóng |
| 2 | `.cursor-dot`, `.cursor-ring` | Con trỏ tuỳ chỉnh |
| 3 | `.side-panel` trái/phải | Thanh tiến độ cuộn & chấm chỉ mục (học từ Luminary) |
| 4 | `.header` | Logo, menu, nút CTA, nút burger |
| 5 | `.hero` | Ảnh nền, lưới spotlight, canvas bong bóng, chữ gõ, bộ đếm, sóng SVG |
| 6 | `.ticker` | Dải tên điểm đến chạy vô hạn |
| 7 | `#journeys` | 3 hành trình nổi bật, ảnh xen kẽ trái/phải |
| 8 | `#blog` | Chip lọc, ô tìm kiếm, lưới thẻ bài viết |
| 9 | `#timeline` | Dòng thời gian tự vẽ |
| 10 | `#gallery` | Lưới ảnh masonry + lightbox |
| 11 | `#about` | Giới thiệu + thanh kỹ năng |
| 12 | `#tips` | FAQ accordion |
| 13 | `#contact` | Form newsletter + liên hệ |
| 15–17 | modal, lightbox, toast, nút lên đầu | Thành phần nổi |

**Quy ước `data-*` để JS/CSS nhận diện:**

| Thuộc tính | Ý nghĩa |
|-----------|---------|
| `data-reveal="up/left/right/zoom"` | Hiện dần khi cuộn tới |
| `style="--d:.2s"` | Độ trễ để xuất hiện so le |
| `data-magnetic` | Nút nam châm |
| `data-ripple` | Gợn sóng khi click |
| `data-tilt` | Nghiêng 3D theo chuột |
| `data-speed="0.3"` | Tốc độ parallax |
| `data-stat="posts"` | Ô đếm số lấy từ `/api/stats` |
| `data-section` | Section được scrollspy theo dõi |
| `data-open="slug"` | Bấm để mở modal bài viết |

`<script type="module" src="js/main.js">`: **ES Modules** – cho phép `import/export` giữa các file, tự động `defer` (chạy sau khi HTML tải xong).

---

## BƯỚC 7 — CSS GIAO DIỆN (commit 7)

### 7.1. Biến màu (CSS Custom Properties)

```css
:root {
  --ocean-900: #031a2f;   /* nền chính – xanh biển sâu */
  --ocean-400: #2a9fd6;   /* xanh biển sáng */
  --mint-400:  #5ff2c9;   /* mint – màu nhấn */
  --grad: linear-gradient(135deg, var(--ocean-400), var(--mint-400));
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```
Đổi tông màu cả website chỉ cần sửa ở đây. `--ease` là đường cong "easeOutQuint": bắt đầu nhanh, kết thúc rất êm.

### 7.2. Glassmorphism (kính mờ)

```css
.glass {
  background: rgba(10, 58, 95, 0.35);       /* nền bán trong suốt */
  border: 1px solid rgba(168, 245, 223, .14);
  backdrop-filter: blur(14px);               /* làm mờ những gì phía sau */
}
```

### 7.3. Lưới spotlight của Hero (kỹ thuật chính học từ Luminary)

```css
.hero__grid {
  background-image:
    linear-gradient(rgba(95,242,201,.16) 1px, transparent 1px),        /* kẻ ngang */
    linear-gradient(90deg, rgba(95,242,201,.16) 1px, transparent 1px); /* kẻ dọc */
  background-size: 56px 56px;
  mask-image: radial-gradient(320px circle at var(--mx) var(--my), #000, transparent 70%);
}
```
- 2 `linear-gradient` tạo lưới ô vuông 56px.
- `mask-image` hình tròn: chỉ phần lưới **bên trong vòng tròn** hiện ra.
- Tâm vòng tròn là `--mx, --my` → JS cập nhật theo chuột → lưới "sáng" lên đúng chỗ con trỏ.

### 7.4. Các kỹ thuật bố cục khác

| Kỹ thuật | Ở đâu | Giải thích |
|----------|-------|-----------|
| `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))` | Lưới bài viết | Tự chia số cột theo độ rộng màn hình, không cần media query |
| `columns: 3 260px` + `break-inside: avoid` | Gallery | Bố cục masonry (gạch so le) thuần CSS |
| `:nth-child(even) .showcase__media { order: 2 }` | Showcase | Ảnh xen kẽ trái/phải |
| `clip-path: circle(0% → 150%)` | Menu mobile | Menu "loang" ra từ nút burger |
| `input:not(:placeholder-shown) + label` | Form liên hệ | Floating label: nhãn nổi lên khi ô có chữ |
| `grid-template-rows: 0fr → 1fr` | FAQ | Animate chiều cao `auto` mượt mà (trước đây CSS không làm được) |
| `writing-mode: vertical-rl` | Side panel | Chữ "SCROLL" xoay dọc |
| `@media (hover: none)` | Con trỏ | Ẩn con trỏ tuỳ chỉnh trên điện thoại ("hover guard") |
| `clamp(2.6rem, 7vw, 5.4rem)` | Tiêu đề | Cỡ chữ co giãn theo màn hình, có min/max |
| `[hidden] { display:none !important }` | Reset | Thuộc tính `hidden` luôn thắng `display: grid` |

### 7.5. Responsive

- `≤ 1200px`: ẩn side panels.
- `≤ 960px`: ẩn menu ngang, hiện burger; các khối 2 cột thành 1 cột; timeline dồn sang trái.
- `≤ 600px`: giảm padding, lưới bài 1 cột.

---

## BƯỚC 8 — CSS ANIMATIONS (commit 8)

Tất cả `@keyframes` nằm trong `animations.css`:

| Nhóm | Keyframes | Mô tả |
|------|-----------|-------|
| A | (transition) | Scroll reveal: `opacity 0 → 1`, `translateY(50px) → 0` |
| B | `wave-bar` | 5 cột preloader co giãn `scaleY` lệch pha |
| C | `wave-move` | SVG rộng 200% dịch `-50%` lặp vô hạn → sóng chạy liền mạch; 3 lớp tốc độ khác nhau tạo chiều sâu |
| D | `gradient-shift` | Dịch `background-position` của chữ gradient → lấp lánh |
| E | `blink` | Con trỏ `|` nhấp nháy (dùng `steps(1)` để bật/tắt dứt khoát) |
| F | `ticker` | Dải chữ nhân đôi, dịch -50% |
| G | `scroll-dot` | Chấm trong biểu tượng chuột trượt xuống |
| H | `float` | Huy hiệu "5+ năm" bồng bềnh |
| I | `shimmer` | Skeleton loading ánh sáng chạy qua |
| J | `ripple` | Vòng tròn `scale(0 → 4)` mờ dần |
| K | `heart-pop`, `particle` | Trái tim phóng to + 10 hạt bay toả tròn |
| L | `card-in` | Thẻ bài viết hiện so le khi lọc |
| M | `toast-in/out` | Thông báo trượt vào/ra |
| N | `shake` | Rung form khi nhập sai |
| O | `pulse-ring` | Vòng sáng "nhịp thở" quanh nút Liên hệ |
| P | `prefers-reduced-motion` | Tắt animation cho người dùng nhạy cảm chuyển động (accessibility) |

**Vì sao chỉ animate `transform` và `opacity`?** Hai thuộc tính này được GPU xử lý, không làm trình duyệt tính lại bố cục (layout) → mượt 60fps.

---

## BƯỚC 9 — JAVASCRIPT: 20 HIỆU ỨNG ĐỘNG (commit 9, 10)

**Nguyên tắc chung:** JS chỉ **đo** (vị trí chuột, % cuộn, phần tử có trong màn hình không) rồi **gán biến CSS hoặc thêm class**; CSS lo phần **vẽ chuyển động**. Code ngắn, dễ giải thích, hiệu năng tốt.

### `utils.js` & `api.js`
- `$`, `$$`: viết tắt `querySelector(All)`.
- `escapeHtml`: chống XSS (xem Bước 10).
- `debounce(fn, 300)`: chỉ chạy khi người dùng ngừng gõ 300ms.
- `canHover()`, `reduceMotion()`: dùng `matchMedia` kiểm tra thiết bị/thiết lập người dùng.
- `api(path, options)`: bọc `fetch`, tự `JSON.stringify` body, tự ném lỗi khi `!res.ok`.

### Các hiệu ứng trong `effects.js`

**#1 Preloader** – thêm class `.is-done` → CSS làm mờ dần.

**#2 Con trỏ tuỳ chỉnh – kỹ thuật LERP**
```js
ringX += (mouseX - ringX) * 0.15;   // đi thêm 15% quãng còn lại mỗi khung hình
requestAnimationFrame(loop);
```
Vòng tròn đuổi theo chuột có "quán tính". `requestAnimationFrame` gọi hàm ~60 lần/giây, đồng bộ với tần số màn hình.

**#3 Hero spotlight** – `pointermove` → `grid.style.setProperty('--mx', x + 'px')`.

**#4 Bong bóng Canvas** – mỗi bong bóng là object `{x, y, r, speed, drift}`; mỗi khung hình: `y -= speed`, `x += sin(drift) * 0.3` (lắc lư), vượt mép trên thì sinh lại ở đáy. Số bong bóng tỉ lệ diện tích màn hình.

**#5 Gõ chữ** – `setTimeout` đệ quy: tăng/giảm `charIndex`, gõ 120ms/ký tự, xoá 60ms, dừng 1.8s khi gõ xong.

**#6 Scroll reveal – IntersectionObserver**
```js
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.15 });
```
Trình duyệt tự báo khi phần tử vào màn hình → hiệu quả hơn nghe sự kiện `scroll`. `observeReveal(root)` được gọi lại sau khi JS chèn HTML mới (showcase, timeline...).

**#7 Bộ đếm số – easing**
```js
const progress = Math.min((now - start) / duration, 1); // 0 → 1
const eased = 1 - Math.pow(1 - progress, 4);            // easeOutQuart
el.textContent = formatNumber(Math.round(target * eased));
```

**Tiện ích `onScroll`** – gom mọi tác vụ cuộn vào **một** `requestAnimationFrame` → tối đa 1 lần cập nhật/khung hình (kỹ thuật *throttle*).

**#8–#9 Thanh tiến độ & vòng tròn nút lên đầu**
```js
const progress = scrollY / (scrollHeight - innerHeight);
bar.style.transform = `scaleY(${progress})`;
ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
```
Vòng tròn SVG: `stroke-dasharray = chu vi (2πr ≈ 132)`; giảm `stroke-dashoffset` từ 132 → 0 thì nét vẽ dài dần.

**#10 Header thông minh** – so sánh `y` với `lastY`: cuộn xuống → ẩn, cuộn lên → hiện.

**#11 Scrollspy** – IntersectionObserver với `rootMargin: '-45% 0px -50% 0px'` (chỉ dải giữa màn hình được tính) → section nào nằm giữa thì chấm tương ứng sáng.

**#12 Menu mobile** – toggle class `is-open` cho burger (3 gạch → X) và menu (`clip-path`), khoá cuộn trang.

**#13 Parallax** – nền hero `translateY(scrollY * 0.3)`; ảnh showcase dịch theo khoảng cách từ tâm ảnh tới tâm màn hình.

**#14 Thẻ nghiêng 3D**
```js
const px = (e.clientX - rect.left) / rect.width;   // 0..1
el.style.setProperty('--ry', `${(px - 0.5) * 16}deg`); // -8° .. +8°
```
CSS: `transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry))` + lớp `.card__glare` (radial-gradient trắng) tại `--gx, --gy`.

**#15 Nút nam châm** – dịch nút 25–35% khoảng cách từ tâm nút tới con trỏ.

**#16 Ripple – Event delegation**: 1 listener trên `document` cho mọi `[data-ripple]`, kể cả nút sinh ra sau này. Tạo `<span class="ripple">` tại điểm click, xoá khi `animationend`.

**#17 Timeline tự vẽ** – `progress = (0.7*innerHeight - rect.top) / rect.height` → `scaleY(progress)`.

**#18 FAQ** – toggle `.is-open` (CSS grid-rows), nút "Mở tất cả" dùng `every()` kiểm tra trạng thái.

**#19 Lightbox** – lưu mảng ảnh + chỉ số; `(index + step + length) % length` để quay vòng; hỗ trợ phím ← → Esc.

**#20 Toast** – tạo `div.toast`, gán nội dung bằng `textContent` (an toàn), sau 3.5s thêm `.is-leaving` rồi xoá.

---

## BƯỚC 10 — JAVASCRIPT: KẾT NỐI BACKEND (commit 11, 12)

### 10.1. Luồng tải trang (`main.js`)

```
main.js
 ├─ init các hiệu ứng (không cần dữ liệu)
 ├─ init form, filter, modal
 ├─ Promise.all([api('stats'), api('posts')])   ← gọi SONG SONG
 │     ├─ renderShowcase(posts)
 │     ├─ renderTimeline(posts)
 │     ├─ renderGallery(posts)
 │     ├─ hidePreloader()
 │     └─ initCounters(stats)
 └─ blog.loadPosts()   ← lưới bài viết có skeleton riêng
```
`Promise.all` chạy 2 request cùng lúc → tổng thời gian = request chậm nhất, thay vì cộng dồn.

### 10.2. Render bằng Template String + `escapeHtml`

```js
`<h3 class="card__title">${escapeHtml(post.title)}</h3>`
```
**Vì sao phải escape?** Nếu ai đó bình luận `<img src=x onerror="alert(1)">`, chèn thẳng vào `innerHTML` sẽ **chạy code độc** (tấn công XSS). `escapeHtml` biến `<` thành `&lt;` → chỉ hiện ra chữ.

### 10.3. Lọc & tìm kiếm

- Chip danh mục: event delegation trên `#filterChips`, cập nhật `state.category`, gọi lại `loadPosts()`.
- Ô tìm kiếm: `debounce(…, 350)`.
- `URLSearchParams` tự mã hoá tiếng Việt trong URL: `?q=Sa%20Pa`.
- Trong lúc chờ: 6 thẻ **skeleton** có hiệu ứng shimmer.
- Thẻ mới có class `is-entering` (animation so le `--d: index*0.07s`), xoá class khi `animationend` để không đè lên `transform` của hiệu ứng nghiêng.

### 10.4. Modal chi tiết

- `openPost(slug)`: hiện modal + skeleton → `api('posts?slug=…')` → render.
- `history.replaceState(null, '', '?post=slug')`: URL đổi theo bài → **chia sẻ link được**; tải trang với `?post=` sẽ tự mở modal.
- Nội dung: `content.split(/\n\s*\n/)` → mỗi đoạn một thẻ `<p>`; chữ cái đầu to (`::first-letter`, drop cap).

### 10.5. Thả tim – Optimistic UI

```js
btn.classList.toggle('is-liked', !isLiked);     // 1. đổi giao diện NGAY
try {
  const { likes } = await api('likes', {...});  // 2. gọi server
  likeCount.textContent = likes;
} catch {
  btn.classList.toggle('is-liked', isLiked);    // 3. lỗi -> hoàn tác
}
```
Người dùng thấy phản hồi tức thì, không phải đợi mạng. Danh sách bài đã tim lưu trong `localStorage`.

`void btn.offsetWidth;` – mẹo "reset animation": buộc trình duyệt tính lại layout để animation `pop` chạy lại dù class vừa bị xoá rồi thêm.

### 10.6. Bình luận & Form (`forms.js`)

- `new FormData(form)` + `Object.fromEntries` → object `{author_name, content}` gọn gàng.
- `e.preventDefault()` chặn trình duyệt tải lại trang.
- **Kiểm tra 2 lớp:** trình duyệt kiểm tra trước (phản hồi nhanh, viền đỏ, rung form), **server kiểm tra lại** (vì người dùng có thể bỏ qua JS và gọi API trực tiếp).
- `form.elements[field]` thay vì `form[field]` – vì `form.name` là thuộc tính *tên của form*, không phải ô input `name`.
- Nút bị `disabled` khi đang gửi → tránh bấm 2 lần.

---

## BƯỚC 11 — TRANG QUẢN TRỊ (commit 14)

`public/admin.html` + `css/admin.css` + `js/admin.js`.

| Thành phần | Kỹ thuật |
|-----------|----------|
| Đăng nhập | Gọi thử `GET /api/subscribe` (cần quyền) với key nhập vào; 200 → đúng, 401 → sai. Key lưu `sessionStorage` (đóng tab là mất) |
| KPI | 6 thẻ số liệu từ `/api/stats`, xuất hiện so le |
| Biểu đồ cột | Thuần CSS: `width = total / max * 100%`, có `transition` |
| Tabs | Thanh gạch chân trượt: `translateX(tab.offsetLeft)` + `width = tab.offsetWidth` |
| Bảng bài viết | Nút Xem / Sửa / Xoá (event delegation) |
| Thêm / sửa | Drawer trượt từ phải; khi sửa, đổ dữ liệu vào form theo `form.elements[key]`; có `id` → `PUT`, không có → `POST` |
| Xoá | Bấm 2 lần để xác nhận ("Chắc chưa?") – không dùng hộp thoại `confirm()` |
| Mọi request ghi | Header `x-admin-key` |

Khi admin mở bài để sửa, API **không tăng lượt xem** (kiểm tra `isAdmin(req)`).

---

## BƯỚC 12 — DEPLOY LÊN VERCEL

### 12.1. Đẩy code lên GitHub

```bash
git remote add origin https://github.com/<tai-khoan>/ocean-travel-blog.git
git push -u origin main
```

### 12.2. Tạo project trên Vercel

1. Vào **vercel.com → Add New… → Project**.
2. **Import** repo `ocean-travel-blog`.
3. Framework Preset: **Other**. Build Command: để trống. Output Directory: `public` (đã khai báo trong `vercel.json`).
4. Bấm **Deploy** (lần đầu API sẽ lỗi vì chưa có database – bình thường).

### 12.3. Tạo database Neon

1. Trong project → tab **Storage** → **Create Database** (hoặc **Marketplace**) → chọn **Neon** (Postgres).
2. Chọn region gần (Singapore) → **Create** → **Connect** với project.
3. Vercel tự thêm biến **`DATABASE_URL`** (và một số biến khác) vào *Settings → Environment Variables*.

### 12.4. Thêm `ADMIN_KEY`

*Settings → Environment Variables* → Key: `ADMIN_KEY`, Value: mật khẩu tự đặt → Save.

### 12.5. Tạo bảng + dữ liệu mẫu (chọn 1 trong 2 cách)

**Cách A – từ máy:**
```bash
# copy giá trị DATABASE_URL trên Vercel vào file .env
npm run db:init
```
**Cách B – trên web Neon:** mở **SQL Editor** của Neon → dán nội dung `sql/schema.sql` → Run → dán `sql/seed.sql` → Run.

### 12.6. Redeploy & kiểm tra

- *Deployments* → bản mới nhất → **⋯ → Redeploy** (để nhận biến môi trường mới).
- Mở `https://<ten-du-an>.vercel.app` → kiểm tra bài viết hiện ra.
- Mở `/api/stats` → thấy JSON.
- Mở `/admin` → nhập `ADMIN_KEY`.
- Chạy `BASE_URL=https://<ten-du-an>.vercel.app npm run test:api`.

### 12.7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân & cách sửa |
|-----------|------------------------|
| API trả 500, log "Thiếu biến môi trường DATABASE_URL" | Chưa connect Neon hoặc chưa redeploy |
| `relation "posts" does not exist` | Chưa chạy schema.sql (Bước 12.5) |
| Admin luôn báo sai key | Chưa thêm `ADMIN_KEY` hoặc chưa redeploy |
| Trang trắng, console báo lỗi module | Mở file `index.html` trực tiếp bằng `file://` – phải chạy qua `npm run dev` hoặc Vercel |
| Ngày lệch 1 ngày | Đã xử lý bằng `types.setTypeParser(1082)` trong `lib/db.js` |

---

## LỊCH SỬ COMMIT

Mỗi task = 1 commit (theo chuẩn *Conventional Commits*: `feat`, `fix`, `docs`, `test`, `chore`). Xem bằng `git log --oneline`.

| # | Commit | Nội dung |
|---|--------|---------|
| 1 | `chore: khởi tạo cấu trúc dự án` | package.json, vercel.json, .env.example, README |
| 2 | `feat(db): thiết kế CSDL PostgreSQL` | schema, seed, db.js, init-db.js |
| 3 | `feat(api): REST API serverless` | 6 endpoint + lib/http.js |
| 4 | `feat(dev): dev-server giả lập Vercel + script kiểm thử` | dev-server.js, test-api.js |
| 5 | `feat(assets): ảnh minh hoạ tự sinh` | generate-images.py, 12 ảnh, favicon |
| 6 | `feat(ui): cấu trúc HTML trang chủ` | index.html |
| 7 | `feat(ui): style.css` | theme, glassmorphism, responsive |
| 8 | `feat(fx): animations.css` | 16 nhóm keyframes |
| 9 | `feat(js): module api.js + utils.js` | fetch wrapper, tiện ích |
| 10 | `feat(fx): effects.js – 20 hiệu ứng` | toàn bộ hiệu ứng động |
| 11 | `feat(js): blog.js` | hiển thị dữ liệu, modal, like, comment |
| 12 | `feat(js): forms.js + main.js` | form & điểm khởi động |
| 13 | `fix(ui): …` | sửa modal, menu mobile, logo |
| 14 | `feat(admin): trang quản trị` | CRUD bài viết |
| 15 | `fix: DATE trả về chuỗi, [hidden]` | sửa lỗi múi giờ |
| 16 | `test: kiểm thử end-to-end + ảnh chụp màn hình` | 17/17 test pass |
| 17 | `docs: hướng dẫn code step-by-step` | tài liệu này |
| 18 | `docs: báo cáo đồ án + slide thuyết trình` | .docx, .pptx |

---

## CÂU HỎI VẤN ĐÁP KHI BẢO VỆ

**1. Vì sao gọi là full-stack?**
Có đủ 3 tầng: giao diện (HTML/CSS/JS) – xử lý nghiệp vụ trên server (Node.js serverless trong `api/`) – lưu trữ (PostgreSQL). Frontend không truy cập DB trực tiếp mà đi qua REST API.

**2. Serverless khác server truyền thống thế nào?**
Không có tiến trình chạy 24/7; mỗi request khởi động một hàm, tự co giãn theo lượng truy cập, không phải quản lý hệ điều hành. Nhược điểm: "cold start" (lần gọi đầu chậm hơn) – giảm bớt bằng cách tái sử dụng pool trong `globalThis`.

**3. Làm sao chống SQL Injection?**
Mọi giá trị đều truyền qua tham số `$1, $2…` của thư viện `pg`; không bao giờ nối chuỗi người dùng nhập vào câu SQL. Danh mục còn được kiểm tra bằng whitelist `CATEGORIES.includes()` và ràng buộc `CHECK` trong DB.

**4. Làm sao chống XSS?**
Mọi dữ liệu từ DB được `escapeHtml()` trước khi chèn vào HTML; toast dùng `textContent`.

**5. Bảo mật trang admin?**
API ghi/xoá yêu cầu header `x-admin-key` khớp biến môi trường `ADMIN_KEY` (không nằm trong code), so sánh bằng `timingSafeEqual`. Hạn chế: chưa có tài khoản/phân quyền nhiều người – hướng phát triển dùng JWT hoặc Auth.js.

**6. Tại sao thả tim cập nhật bằng `likes = likes + 1` trong SQL?**
Để tránh race condition khi nhiều người bấm cùng lúc (phép cộng nguyên tử trong DB).

**7. IntersectionObserver tốt hơn sự kiện scroll ở điểm nào?**
Trình duyệt tự tính toán bất đồng bộ, không chạy code mỗi pixel cuộn → tiết kiệm CPU, pin.

**8. Vì sao animation mượt?**
Chỉ animate `transform`/`opacity` (GPU), gom cập nhật vào `requestAnimationFrame`, dùng `passive: true` cho scroll listener, tôn trọng `prefers-reduced-motion`.

**9. Học gì từ template Luminary?**
Bố cục side panel cố định (thanh tiến độ cuộn + chấm chỉ mục), lưới hero có spotlight theo chuột, bộ đếm số động, scroll reveal so le, ticker vô hạn, showcase xen kẽ, FAQ accordion bằng CSS Grid, menu mobile toàn màn hình, hover guard cho thiết bị cảm ứng. Toàn bộ được viết lại theo chủ đề du lịch với tông xanh biển + mint thay cho tông graphite tối.

**10. Hướng phát triển?**
Upload ảnh thật (Vercel Blob), soạn bài bằng Markdown, đăng nhập Google, tìm kiếm không dấu (extension `unaccent`), phân trang, bản đồ Leaflet, đa ngôn ngữ, PWA offline.
