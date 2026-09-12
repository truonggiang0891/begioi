// --- DỮ LIỆU HẠNG MỤC THÁP QUỶ TOÁN ---
// 10 hạng mục, mỗi hạng mục có 2 ải: ⚔️ Ải Thường (cơ bản) và 🔥 Ải Tinh Anh (nâng cao).
// Cơ chế thi & đề toán cụ thể của từng ải sẽ được bổ sung sau (xem field `exam`).

export const TOWER_ZONES = [
  { id: 'z01', emoji: '👾', name: 'Vùng Đất Quái Số',        rank: 'Tân Binh' },
  { id: 'z02', emoji: '🕷️', name: 'Hang Nhện Tính Toán',      rank: 'Chiến Binh' },
  { id: 'z03', emoji: '👹', name: 'Vực Sâu Phép Tính',        rank: 'Tinh Anh' },
  { id: 'z04', emoji: '🦇', name: 'Rừng Ma Con Số',           rank: 'Thợ Săn' },
  { id: 'z05', emoji: '🐍', name: 'Đầm Lầy Toán Thuật',       rank: 'Cao Thủ' },
  { id: 'z06', emoji: '🦖', name: 'Thung Lũng Tính Nhẩm',     rank: 'Đại Sư' },
  { id: 'z07', emoji: '🔥', name: 'Pháo Đài Toán Quái',       rank: 'Huyền Thoại' },
  { id: 'z08', emoji: '🐉', name: 'Hang Rồng Đại Số',         rank: 'Vua Quái' },
  { id: 'z09', emoji: '👑', name: 'Đấu Trường Toán Vương',    rank: 'Ma Vương' },
  { id: 'z10', emoji: '💀', name: 'Chúa Tể Toán Học',         rank: 'Tối Thượng', isBoss: true },
];

// Hai ải trong mỗi hạng mục.
export const TOWER_TIERS = [
  { id: 'normal', emoji: '⚔️', label: 'Ải Thường',   desc: 'Độ khó cơ bản' },
  { id: 'elite',  emoji: '🔥', label: 'Ải Tinh Anh', desc: 'Độ khó nâng cao' },
];

export const stageKey = (zoneId, tierId) => `${zoneId}:${tierId}`;

// --- TIẾN ĐỘ (lưu máy) ---
const PROGRESS_KEY = 'tower_progress_v1';

export const loadProgress = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
};

export const saveProgress = (p) => {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

export const isCleared = (progress, zoneId, tierId) => Boolean(progress[stageKey(zoneId, tierId)]?.cleared);

// Luật mở khoá (dễ đổi):
// - Hạng mục đầu tiên: Ải Thường luôn mở.
// - Ải Tinh Anh mở khi đã qua Ải Thường của CHÍNH hạng mục đó.
// - Hạng mục kế tiếp mở khi đã qua Ải Thường của hạng mục trước.
export const isUnlocked = (progress, zoneIndex, tierId) => {
  if (tierId === 'elite') {
    return isCleared(progress, TOWER_ZONES[zoneIndex].id, 'normal');
  }
  if (zoneIndex === 0) return true;
  return isCleared(progress, TOWER_ZONES[zoneIndex - 1].id, 'normal');
};
