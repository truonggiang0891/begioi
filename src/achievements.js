// --- ĐỊNH NGHĨA HUY HIỆU / THÀNH TÍCH ---
// Mỗi huy hiệu là hàm thuần dựa trên stats (statsStore). progress()/target dùng để
// hiện thanh tiến độ cho huy hiệu chưa mở khoá.

const accuracy = (stats) => {
  const total = stats.lifetimeCorrect + stats.lifetimeWrong;
  return total > 0 ? stats.lifetimeCorrect / total : 0;
};

const opCorrect = (stats, op) => stats.byOp?.[op]?.c || 0;

// tier chỉ dùng để tô màu: 'bronze' | 'silver' | 'gold' | 'diamond'
export const BADGES = [
  // --- Cột mốc số câu đúng (chỉ mốc lớn) ---
  { id: 'correct_100', emoji: '🏅', title: 'Giỏi giang', desc: 'Trả lời đúng 100 câu', tier: 'silver',
    target: 100, progress: (s) => s.lifetimeCorrect },
  { id: 'correct_300', emoji: '🏆', title: 'Xuất sắc', desc: 'Trả lời đúng 300 câu', tier: 'gold',
    target: 300, progress: (s) => s.lifetimeCorrect },
  { id: 'correct_500', emoji: '💎', title: 'Siêu sao', desc: 'Trả lời đúng 500 câu', tier: 'diamond',
    target: 500, progress: (s) => s.lifetimeCorrect },
  { id: 'correct_1000', emoji: '👑', title: 'Nhà vô địch', desc: 'Trả lời đúng 1000 câu', tier: 'diamond',
    target: 1000, progress: (s) => s.lifetimeCorrect },

  // --- Thành thạo từng phép tính ---
  { id: 'master_add', emoji: '➕', title: 'Vua phép Cộng', desc: 'Đúng 50 câu phép Cộng', tier: 'silver',
    target: 50, progress: (s) => opCorrect(s, 'add') },
  { id: 'master_subtract', emoji: '➖', title: 'Vua phép Trừ', desc: 'Đúng 50 câu phép Trừ', tier: 'silver',
    target: 50, progress: (s) => opCorrect(s, 'subtract') },
  { id: 'master_multiply', emoji: '✖️', title: 'Vua phép Nhân', desc: 'Đúng 50 câu phép Nhân', tier: 'gold',
    target: 50, progress: (s) => opCorrect(s, 'multiply') },
  { id: 'master_divide', emoji: '➗', title: 'Vua phép Chia', desc: 'Đúng 50 câu phép Chia', tier: 'gold',
    target: 50, progress: (s) => opCorrect(s, 'divide') },

  // --- Chuỗi ngày học ---
  { id: 'streak_3', emoji: '🔥', title: 'Siêng 3 ngày', desc: 'Học 3 ngày liên tiếp', tier: 'bronze',
    target: 3, progress: (s) => s.streak?.best || 0 },
  { id: 'streak_7', emoji: '🌟', title: 'Tuần chăm chỉ', desc: 'Học 7 ngày liên tiếp', tier: 'gold',
    target: 7, progress: (s) => s.streak?.best || 0 },

  // --- Độ chính xác ---
  { id: 'accuracy_90', emoji: '🎯', title: 'Thần bài', desc: 'Đạt 90% chính xác (từ 50 câu)', tier: 'gold',
    target: 100,
    progress: (s) => ((s.lifetimeCorrect + s.lifetimeWrong) >= 50 ? Math.round(accuracy(s) * 100) : 0) },
];

export const BADGE_MAP = BADGES.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

// Huy hiệu coi là "đạt" khi progress >= target.
export const isBadgeUnlocked = (badge, stats) => badge.progress(stats) >= badge.target;

export const unlockedBadgeIds = (stats) =>
  BADGES.filter(b => isBadgeUnlocked(b, stats)).map(b => b.id);

// Danh sách huy hiệu kèm trạng thái + tiến độ, dùng để hiển thị bảng thành tích.
export const computeBadgeBoard = (stats) =>
  BADGES.map((b) => {
    const current = Math.min(b.progress(stats), b.target);
    return {
      ...b,
      unlocked: isBadgeUnlocked(b, stats),
      current,
      ratio: b.target > 0 ? Math.min(1, current / b.target) : 0,
    };
  });
