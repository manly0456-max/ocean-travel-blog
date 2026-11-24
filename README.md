# 🌊 Wanderwave — Personal Travel Blog (Full-stack)

Blog du lịch cá nhân với **rất nhiều hiệu ứng động**, tông **xanh dương biển + mint**, lấy cảm hứng bố cục từ template *Luminary* (TemplateMo 621).

| Tầng | Công nghệ |
|------|-----------|
| Frontend | HTML5, CSS3 (biến CSS, keyframes, Grid/Flex), JavaScript thuần (ES Modules) |
| Backend | Vercel Serverless Functions (Node.js) trong thư mục `api/` |
| Database | PostgreSQL (Neon trên Vercel Marketplace) qua thư viện `pg` |
| Deploy | Vercel |

## Chạy nhanh trên máy

```bash
npm install
cp .env.example .env      # rồi sửa DATABASE_URL, ADMIN_KEY
npm run db:init           # tạo bảng + dữ liệu mẫu
npm run dev               # mở http://localhost:3000
```

## Deploy lên Vercel

1. Đẩy code lên GitHub.
2. Vercel → **Add New → Project** → chọn repo → Framework Preset: **Other** → Deploy.
3. Project → **Storage** → **Create Database** → chọn **Neon** → Connect (Vercel tự thêm `DATABASE_URL`).
4. **Settings → Environment Variables** → thêm `ADMIN_KEY`.
5. Chạy `npm run db:init` một lần (với `DATABASE_URL` của Neon trong `.env`) hoặc dán `sql/schema.sql` + `sql/seed.sql` vào SQL Editor của Neon.
6. **Redeploy**.

## Cấu trúc thư mục

```
ocean-travel-blog/
├── api/                # Backend: mỗi file = 1 endpoint serverless
│   ├── posts.js        # GET/POST/PUT/DELETE bài viết
│   ├── comments.js     # GET/POST bình luận
│   ├── likes.js        # POST thả tim
│   ├── subscribe.js    # POST đăng ký nhận tin, GET (admin)
│   ├── contact.js      # POST liên hệ, GET (admin)
│   └── stats.js        # GET số liệu thống kê
├── lib/
│   ├── db.js           # Kết nối PostgreSQL (connection pool)
│   └── http.js         # Hàm tiện ích: trả JSON, kiểm tra admin, validate
├── sql/
│   ├── schema.sql      # Tạo bảng
│   └── seed.sql        # Dữ liệu mẫu
├── scripts/
│   ├── init-db.js      # Chạy schema + seed
│   └── test-api.js     # Test nhanh các API
├── public/             # Frontend tĩnh (Vercel phục vụ thư mục này)
│   ├── index.html
│   ├── admin.html
│   ├── css/ (style.css, animations.css, admin.css)
│   ├── js/  (main.js, effects.js, blog.js, forms.js, api.js, admin.js)
│   └── assets/img/
├── docs/               # Hướng dẫn code, báo cáo, slide
├── dev-server.js       # Server chạy local giả lập Vercel
└── vercel.json         # Cấu hình Vercel
```

Xem giải thích chi tiết từng dòng code trong **`docs/HUONG_DAN_CODE.md`**.
