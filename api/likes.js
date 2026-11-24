// =====================================================================
//  api/likes.js – THẢ TIM / BỎ TIM
//  POST /api/likes  {post_id, action: "like" | "unlike"}
// =====================================================================
const { query } = require('../lib/db');
const { sendJson, getBody, createHandler } = require('../lib/http');

async function toggleLike(req, res) {
  const { post_id, action = 'like' } = getBody(req);
  const id = parseInt(post_id, 10);
  if (!id) return sendJson(res, 400, { error: 'Thiếu post_id' });

  // Tăng/giảm ngay trong SQL -> an toàn khi nhiều người bấm cùng lúc (không bị "mất" lượt)
  // GREATEST(..., 0) đảm bảo số tim không bao giờ âm
  const sql = action === 'unlike'
    ? 'UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = $1 RETURNING likes'
    : 'UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes';

  const rows = await query(sql, [id]);
  if (!rows.length) return sendJson(res, 404, { error: 'Không tìm thấy bài viết' });
  return sendJson(res, 200, { likes: rows[0].likes });
}

module.exports = createHandler({ POST: toggleLike });
