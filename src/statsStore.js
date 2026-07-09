// --- KHO DỮ LIỆU HỌC TẬP (thành tích + báo cáo phụ huynh) ---
// Lưu tích luỹ theo thời gian, không reset mỗi phiên (khác với correctTotal của 1 phiên).
import { unlockedBadgeIds } from './achievements';

export const LEARN_STATS_KEY = 'math_learnStats_v1';

const OP_IDS = ['add', 'subtract', 'multiply', 'divide', 'custom'];
const MAX_DAILY_KEYS = 120; // giữ ~4 tháng gần nhất

const emptyOp = () => ({ c: 0, w: 0 });

export const createEmptyStats = () => ({
  lifetimeCorrect: 0,
  lifetimeWrong: 0,
  lifetimeTimeSec: 0,
  byOp: OP_IDS.reduce((acc, id) => { acc[id] = emptyOp(); return acc; }, {}),
  daily: {},                 // { 'YYYY-MM-DD': { c, w, timeSec } }
  streak: { current: 0, best: 0, lastDay: null },
  unlockedBadges: [],        // id huy hiệu đã mở khoá
  seenBadges: [],            // id huy hiệu đã hiện chúc mừng
});

const clampInt = (value, min, max) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
};

const todayKey = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dayDiff = (aKey, bKey) => {
  if (!aKey || !bKey) return Infinity;
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
};

// Chuẩn hoá dữ liệu đọc từ localStorage để tránh lỗi khi cấu trúc cũ/hỏng.
export const normalizeStats = (raw) => {
  const base = createEmptyStats();
  if (!raw || typeof raw !== 'object') return base;

  base.lifetimeCorrect = clampInt(raw.lifetimeCorrect, 0, 9_999_999);
  base.lifetimeWrong = clampInt(raw.lifetimeWrong, 0, 9_999_999);
  base.lifetimeTimeSec = clampInt(raw.lifetimeTimeSec, 0, 9_999_999_999);

  if (raw.byOp && typeof raw.byOp === 'object') {
    OP_IDS.forEach((id) => {
      const op = raw.byOp[id];
      base.byOp[id] = {
        c: clampInt(op?.c, 0, 9_999_999),
        w: clampInt(op?.w, 0, 9_999_999),
      };
    });
  }

  if (raw.daily && typeof raw.daily === 'object') {
    const keys = Object.keys(raw.daily)
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .sort()
      .slice(-MAX_DAILY_KEYS);
    keys.forEach((k) => {
      const day = raw.daily[k];
      base.daily[k] = {
        c: clampInt(day?.c, 0, 9_999_999),
        w: clampInt(day?.w, 0, 9_999_999),
        timeSec: clampInt(day?.timeSec, 0, 86_400),
      };
    });
  }

  if (raw.streak && typeof raw.streak === 'object') {
    base.streak = {
      current: clampInt(raw.streak.current, 0, 100_000),
      best: clampInt(raw.streak.best, 0, 100_000),
      lastDay: /^\d{4}-\d{2}-\d{2}$/.test(raw.streak.lastDay) ? raw.streak.lastDay : null,
    };
  }

  base.seenBadges = Array.isArray(raw.seenBadges)
    ? [...new Set(raw.seenBadges.filter(id => typeof id === 'string'))]
    : [];

  // Luôn tính lại huy hiệu đã mở khoá từ số liệu (nguồn sự thật), tránh lệch khi
  // dữ liệu lưu cũ/thiếu.
  base.unlockedBadges = unlockedBadgeIds(base);

  return base;
};

export const loadStats = () => {
  try {
    const saved = localStorage.getItem(LEARN_STATS_KEY);
    return saved ? normalizeStats(JSON.parse(saved)) : createEmptyStats();
  } catch {
    return createEmptyStats();
  }
};

export const saveStats = (stats) => {
  try {
    localStorage.setItem(LEARN_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Bỏ qua nếu localStorage đầy/không dùng được.
  }
};

// Cập nhật chuỗi ngày học liên tiếp khi có hoạt động trong ngày.
const touchStreak = (streak, key) => {
  if (streak.lastDay === key) return streak;
  const diff = dayDiff(streak.lastDay, key);
  const current = diff === 1 ? streak.current + 1 : 1;
  return {
    current,
    best: Math.max(streak.best, current),
    lastDay: key,
  };
};

const ensureDay = (daily, key) => {
  if (!daily[key]) daily[key] = { c: 0, w: 0, timeSec: 0 };
  // Cắt bớt nếu vượt quá số ngày lưu tối đa.
  const keys = Object.keys(daily);
  if (keys.length > MAX_DAILY_KEYS) {
    keys.sort().slice(0, keys.length - MAX_DAILY_KEYS).forEach(k => { delete daily[k]; });
  }
  return daily[key];
};

// Reducer thuần: nhận stats cũ -> trả stats mới sau 1 câu trả lời.
export const applyAnswer = (prev, lessonType, isCorrect, now = new Date()) => {
  const stats = normalizeStats(prev);
  const op = OP_IDS.includes(lessonType) ? lessonType : 'custom';
  const key = todayKey(now);

  if (isCorrect) {
    stats.lifetimeCorrect += 1;
    stats.byOp[op].c += 1;
  } else {
    stats.lifetimeWrong += 1;
    stats.byOp[op].w += 1;
  }

  const day = ensureDay(stats.daily, key);
  if (isCorrect) day.c += 1; else day.w += 1;

  stats.streak = touchStreak(stats.streak, key);
  stats.unlockedBadges = unlockedBadgeIds(stats);
  return stats;
};

// Cộng thời gian học (giây) vào ngày hôm nay + tổng tích luỹ.
export const applyStudyTime = (prev, seconds, now = new Date()) => {
  const stats = normalizeStats(prev);
  const sec = clampInt(seconds, 0, 86_400);
  if (sec <= 0) return stats;
  stats.lifetimeTimeSec += sec;
  const day = ensureDay(stats.daily, todayKey(now));
  day.timeSec = Math.min(86_400, day.timeSec + sec);
  stats.streak = touchStreak(stats.streak, todayKey(now));
  stats.unlockedBadges = unlockedBadgeIds(stats);
  return stats;
};

// Trả về mảng ngày gần nhất (mới -> cũ) đã điền đủ chỗ trống, để vẽ biểu đồ.
export const getRecentDays = (stats, count = 7, now = new Date()) => {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = todayKey(d);
    const day = stats.daily?.[key] || { c: 0, w: 0, timeSec: 0 };
    out.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, ...day });
  }
  return out; // [hôm nay, hôm qua, ...]
};

export const OP_LABELS = {
  add: 'Cộng',
  subtract: 'Trừ',
  multiply: 'Nhân',
  divide: 'Chia',
  custom: 'Tự nhập',
};

export { OP_IDS, todayKey };
