-- =====================================================================
--  WANDERWAVE – SCHEMA CƠ SỞ DỮ LIỆU (PostgreSQL)
--  Chạy file này 1 lần để tạo bảng. Có "IF NOT EXISTS" nên chạy lại không lỗi.
-- =====================================================================

-- 1) BẢNG BÀI VIẾT (posts) – trái tim của blog
CREATE TABLE IF NOT EXISTS posts (
  id            SERIAL PRIMARY KEY,                 -- khóa chính tự tăng
  slug          VARCHAR(120) NOT NULL UNIQUE,       -- đường dẫn thân thiện: "ha-long-bay"
  title         VARCHAR(200) NOT NULL,              -- tiêu đề
  excerpt       TEXT         NOT NULL,              -- đoạn tóm tắt hiển thị trên thẻ
  content       TEXT         NOT NULL,              -- nội dung đầy đủ (đoạn cách nhau bằng dòng trống)
  category      VARCHAR(20)  NOT NULL
                CHECK (category IN ('beach', 'mountain', 'city', 'food')), -- chỉ cho 4 giá trị
  location      VARCHAR(120) NOT NULL,              -- địa danh: "Quảng Ninh"
  country       VARCHAR(80)  NOT NULL,              -- quốc gia: "Việt Nam"
  cover_image   VARCHAR(255) NOT NULL,              -- đường dẫn ảnh bìa
  read_minutes  INT          NOT NULL DEFAULT 5  CHECK (read_minutes > 0),
  distance_km   INT          NOT NULL DEFAULT 0  CHECK (distance_km >= 0),
  likes         INT          NOT NULL DEFAULT 0  CHECK (likes >= 0),
  views         INT          NOT NULL DEFAULT 0  CHECK (views >= 0),
  travel_date   DATE,                               -- ngày đi
  is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,-- bài nổi bật (hiện ở mục Hành trình)
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2) BẢNG BÌNH LUẬN (comments) – quan hệ 1 bài viết : N bình luận
CREATE TABLE IF NOT EXISTS comments (
  id           SERIAL PRIMARY KEY,
  post_id      INT          NOT NULL REFERENCES posts(id) ON DELETE CASCADE, -- xoá bài -> xoá luôn bình luận
  author_name  VARCHAR(60)  NOT NULL,
  content      VARCHAR(1000) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3) BẢNG NGƯỜI ĐĂNG KÝ NHẬN TIN (subscribers)
CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(160) NOT NULL UNIQUE,         -- UNIQUE: 1 email chỉ đăng ký 1 lần
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4) BẢNG LIÊN HỆ (contacts) – tin nhắn gửi từ form liên hệ
CREATE TABLE IF NOT EXISTS contacts (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  email       VARCHAR(160)  NOT NULL,
  message     VARCHAR(2000) NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 5) CHỈ MỤC (INDEX) – giúp truy vấn lọc/tìm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_posts_category   ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
