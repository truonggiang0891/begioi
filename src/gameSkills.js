// Danh mục SKILL / QUÀ TẶNG dùng chung cho các game.
// Chỉ là dữ liệu (emoji, tên, màu, mô tả, loại). Hiệu ứng cụ thể do từng game tự xử lý
// (vì mỗi game áp dụng khác nhau), nhưng icon + tên + mô tả thống nhất toàn app.
//
// kind: 'instant' = ăn là dùng ngay; 'timed' = có hiệu lực trong `dur` ms.

export const SKILLS = {
  // --- Tức thời ---
  life:     { emoji: '❤️', name: 'Thêm mạng',  color: '#fb7185', kind: 'instant', desc: 'Được thêm 1 mạng' },
  points:   { emoji: '⭐', name: 'Điểm thưởng', color: '#fbbf24', kind: 'instant', desc: 'Cộng ngay điểm thưởng' },
  bomb:     { emoji: '💥', name: 'Bom',        color: '#f97316', kind: 'instant', desc: 'Nổ tung, phá cả vùng xung quanh' },
  multiball:{ emoji: '🔴', name: 'Nhiều bóng', color: '#ef4444', kind: 'instant', desc: 'Tách thành nhiều bóng cùng lúc' },

  // --- Có thời hạn ---
  shield:   { emoji: '🛡️', name: 'Khiên',      color: '#38bdf8', kind: 'timed', dur: 8000,  desc: 'Đỡ 1 lần va chạm / không mất mạng' },
  x2:       { emoji: '✖️', name: 'Nhân đôi',   color: '#a78bfa', kind: 'timed', dur: 10000, desc: 'Điểm x2 trong 10 giây' },
  slow:     { emoji: '🐢', name: 'Chậm lại',   color: '#34d399', kind: 'timed', dur: 8000,  desc: 'Mọi thứ chậm lại cho dễ chơi' },
  freeze:   { emoji: '❄️', name: 'Đóng băng',  color: '#67e8f9', kind: 'timed', dur: 6000,  desc: 'Đóng băng thời gian trong giây lát' },
  magnet:   { emoji: '🧲', name: 'Nam châm',   color: '#f472b6', kind: 'timed', dur: 9000,  desc: 'Hút đồ tốt về phía bé' },
  wide:     { emoji: '📏', name: 'Thanh dài',  color: '#22d3ee', kind: 'timed', dur: 10000, desc: 'Thanh chắn dài ra, đỡ bóng dễ hơn' },
  laser:    { emoji: '🔫', name: 'Súng laser', color: '#c084fc', kind: 'timed', dur: 8000,  desc: 'Bắn tia phá gạch' },
  rapid:    { emoji: '⚡', name: 'Bắn nhanh',  color: '#facc15', kind: 'timed', dur: 8000,  desc: 'Bắn nhanh gấp đôi' },
};

export const skillMeta = (id) => SKILLS[id] || { emoji: '🎁', name: 'Quà', color: '#fbbf24', kind: 'instant', desc: 'Phần thưởng' };

// Rút ngẫu nhiên 1 skill từ danh sách id cho trước, theo trọng số tùy chọn.
// weights: object { id: number }. Không truyền -> đều nhau.
export const randomSkill = (ids, weights) => {
  if (!ids || !ids.length) return null;
  if (!weights) return ids[(Math.random() * ids.length) | 0];
  const total = ids.reduce((s, id) => s + (weights[id] || 1), 0);
  let r = Math.random() * total;
  for (const id of ids) {
    r -= (weights[id] || 1);
    if (r <= 0) return id;
  }
  return ids[ids.length - 1];
};
