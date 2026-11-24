// =====================================================================
//  js/api.js – HÀM GỌI BACKEND DÙNG CHUNG
//  Mọi lời gọi tới /api/... đều đi qua đây -> xử lý lỗi ở 1 chỗ duy nhất.
// =====================================================================

/**
 * Gọi API và trả về dữ liệu JSON.
 * @param {string} path    ví dụ: 'posts?category=beach'
 * @param {object} options { method, body, headers }
 */
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,  // object -> chuỗi JSON
  });
  const data = await res.json().catch(() => ({}));  // phòng khi server trả về rỗng
  if (!res.ok) throw new Error(data.error || `Lỗi kết nối (${res.status})`);
  return data;
}
