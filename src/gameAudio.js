// Âm thanh dùng chung cho các game (Web Audio API — không cần file ngoài).
// Tách riêng để 2 game tự chạy độc lập, không phụ thuộc App.jsx.

const BASE_VOLUME = 0.22;

const getCtx = () => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  return new AC();
};

const tone = (ctx, freq, start, dur, type = 'sine', vol = BASE_VOLUME) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
};

// type: 'pop' | 'correct' | 'wrong' | 'win'
export const playSound = (type) => {
  try {
    const ctx = getCtx();
    if (!ctx) return;

    if (type === 'pop') {
      tone(ctx, 440, 0, 0.12, 'sine', 0.18);
    } else if (type === 'correct') {
      tone(ctx, 523.25, 0, 0.14, 'sine');      // Đô
      tone(ctx, 659.25, 0.1, 0.16, 'sine');    // Mi
    } else if (type === 'wrong') {
      tone(ctx, 300, 0, 0.18, 'triangle', 0.16);
      tone(ctx, 200, 0.12, 0.2, 'triangle', 0.16);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Đô - Mi - Sol - Đô cao
      notes.forEach((f, i) => tone(ctx, f, i * 0.14, 0.35, 'sine'));
    }
  } catch {
    // Bỏ qua nếu trình duyệt không hỗ trợ.
  }
};

export const emojiFont = {
  fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
};

// --- Lưu tiến độ mở khóa mức (localStorage) ---
// Trả về chỉ số mức cao nhất đã mở khóa (0 = chỉ mức dễ nhất).
export const loadUnlocked = (key) => {
  try {
    const v = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
};

export const saveUnlocked = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Bỏ qua nếu không lưu được.
  }
};
