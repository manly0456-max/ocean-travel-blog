// =====================================================================
//  api/stats.js – SỐ LIỆU THỐNG KÊ (dùng cho bộ đếm động ở Hero & trang admin)
//  GET /api/stats
// =====================================================================
const { query } = require('../lib/db');
const { sendJson, createHandler } = require('../lib/http');

async function getStats(req, res) {
  // Hàm tổng hợp (aggregate): COUNT, SUM, COUNT(DISTINCT ...)
  const [totals] = await query(`
    SELECT
      COUNT(*)::int                         AS posts,
      COUNT(DISTINCT country)::int          AS countries,
      COALESCE(SUM(distance_km), 0)::int    AS kilometers,
      COALESCE(SUM(likes), 0)::int          AS likes,
      COALESCE(SUM(views), 0)::int          AS views,
      (SELECT COUNT(*)::int FROM comments)    AS comments,
      (SELECT COUNT(*)::int FROM subscribers) AS subscribers
    FROM posts
  `);

  // GROUP BY: đếm số bài theo từng danh mục
  const byCategory = await query(`
    SELECT category, COUNT(*)::int AS total
      FROM posts GROUP BY category ORDER BY total DESC
  `);

  return sendJson(res, 200, { ...totals, byCategory });
}

module.exports = createHandler({ GET: getStats });
