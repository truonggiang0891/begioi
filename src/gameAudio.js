// Âm thanh dùng chung cho các game (Web Audio API — không cần file ngoài).
// Tách riêng để mỗi game tự chạy độc lập, không phụ thuộc App.jsx.

const BASE_VOLUME = 0.22;
const MUTE_KEY = 'game_muted';

// --- Một AudioContext dùng chung cho cả SFX lẫn nhạc nền (đỡ tạo mới mỗi lần) ---
let _ctx = null;
const getCtx = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!_ctx) _ctx = new AC();
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
};

// --- Tắt/mở tiếng (lưu localStorage, dùng chung mọi game) ---
let _muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();
export const isMuted = () => _muted;
export const setMuted = (v) => {
  _muted = !!v;
  try { localStorage.setItem(MUTE_KEY, _muted ? '1' : '0'); } catch { /* ignore */ }
  if (_muted) stopMusic();
  else if (_pendingTrack) startMusic(_pendingTrack);
};
export const toggleMuted = () => { setMuted(!_muted); return _muted; };

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

// Tiếng "trượt" nhanh (dùng cho whoosh/laser) — quét tần số.
const sweep = (ctx, f0, f1, start, dur, type = 'sawtooth', vol = 0.12) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(f0, ctx.currentTime + start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ctx.currentTime + start + dur);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
};

// Tiếng nhiễu ngắn (nổ/va chạm) qua buffer trắng.
const noise = (ctx, start, dur, vol = 0.14, hp = 400) => {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hp;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime + start);
  src.stop(ctx.currentTime + start + dur + 0.02);
};

// type: 'pop'|'correct'|'wrong'|'win'|'shoot'|'explode'|'coin'|'powerup'|'combo'
//      |'levelup'|'lose'|'jump'|'whoosh'|'hit'|'gift'
// Tham số thứ 2 (opt): với 'combo' truyền số bậc combo để cao độ tăng dần.
export const playSound = (type, opt) => {
  if (_muted) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;

    switch (type) {
      case 'pop':
        tone(ctx, 440, 0, 0.12, 'sine', 0.18);
        break;
      case 'correct':
        tone(ctx, 523.25, 0, 0.14, 'sine');
        tone(ctx, 659.25, 0.1, 0.16, 'sine');
        break;
      case 'wrong':
        tone(ctx, 300, 0, 0.18, 'triangle', 0.16);
        tone(ctx, 200, 0.12, 0.2, 'triangle', 0.16);
        break;
      case 'win': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => tone(ctx, f, i * 0.14, 0.35, 'sine'));
        break;
      }
      case 'shoot':
        sweep(ctx, 900, 500, 0, 0.09, 'square', 0.07);
        break;
      case 'explode':
        noise(ctx, 0, 0.32, 0.2, 250);
        tone(ctx, 120, 0, 0.28, 'triangle', 0.14);
        break;
      case 'hit':
        tone(ctx, 330, 0, 0.07, 'square', 0.1);
        break;
      case 'break': // phá vỡ gạch — to, đanh, có tiếng "rắc"
        tone(ctx, 180, 0, 0.13, 'square', 0.32);
        tone(ctx, 440, 0, 0.1, 'triangle', 0.26);
        noise(ctx, 0, 0.17, 0.3, 260);
        break;
      case 'coin':
        tone(ctx, 987.77, 0, 0.08, 'square', 0.12);
        tone(ctx, 1318.5, 0.07, 0.14, 'square', 0.12);
        break;
      case 'powerup': {
        const up = [392, 523.25, 659.25, 783.99];
        up.forEach((f, i) => tone(ctx, f, i * 0.06, 0.16, 'triangle', 0.13));
        break;
      }
      case 'combo': {
        // Cao độ tăng theo bậc combo (opt) — càng combo cao càng "leo thang".
        const step = Math.max(0, Math.min(12, (opt || 1) - 1));
        const base = 523.25 * Math.pow(2, step / 12);
        tone(ctx, base, 0, 0.1, 'square', 0.11);
        tone(ctx, base * 1.5, 0.05, 0.12, 'square', 0.09);
        break;
      }
      case 'levelup': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((f, i) => tone(ctx, f, i * 0.09, 0.24, 'triangle', 0.13));
        break;
      }
      case 'lose':
        sweep(ctx, 500, 90, 0, 0.5, 'sawtooth', 0.14);
        break;
      case 'jump':
        sweep(ctx, 320, 620, 0, 0.14, 'sine', 0.12);
        break;
      case 'whoosh':
        noise(ctx, 0, 0.14, 0.08, 800);
        break;
      case 'gift': {
        const notes = [659.25, 783.99, 987.77, 1318.5];
        notes.forEach((f, i) => tone(ctx, f, i * 0.08, 0.2, 'sine', 0.14));
        break;
      }
      default:
        break;
    }
  } catch {
    // Bỏ qua nếu trình duyệt không hỗ trợ.
  }
};

// ----------------------------------------------------------------------------
// NHẠC NỀN procedural (không cần file). Vòng lặp giai điệu ngũ cung (pentatonic)
// nên luôn nghe vui tai, nhẹ nhàng. Bật/tắt theo nút tắt tiếng chung.
// ----------------------------------------------------------------------------
const SCALE = { // tần số nốt (ngũ cung Đô trưởng, quãng an toàn cho trẻ)
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
};
const S = SCALE;

// Mỗi track: bpm + melody (nốt hoặc null = nghỉ) + bass tùy chọn.
const TRACKS = {
  arcade: {
    bpm: 132,
    melody: [S.C5, S.E5, S.G5, S.E5, S.A4, S.C5, S.E5, S.C5, S.D5, S.G4, S.D5, S.G5, S.E5, S.C5, S.G4, null],
    bass: [S.C4, null, S.G4, null, S.A4, null, S.G4, null, S.C4, null, S.G4, null, S.E4, null, S.G4, null],
  },
  calm: {
    bpm: 92,
    melody: [S.C5, null, S.E5, null, S.G4, null, S.A4, null, S.G5, null, S.E5, null, S.D5, null, S.C5, null],
    bass: [S.C4, null, null, null, S.A4, null, null, null, S.G4, null, null, null, S.E4, null, null, null],
  },
  tense: {
    bpm: 150,
    melody: [S.A4, S.C5, S.A4, S.E5, S.A4, S.C5, S.D5, S.C5, S.G4, S.A4, S.C5, S.A4, S.G4, S.E4, S.G4, null],
    bass: [S.A4, S.A4, S.G4, S.G4, S.A4, S.A4, S.E4, S.E4, S.A4, S.A4, S.G4, S.G4, S.A4, S.A4, S.E4, S.E4],
  },
};

let _musicTimer = null;
let _musicGain = null;
let _pendingTrack = null; // track đang muốn phát (để mở lại khi bỏ tắt tiếng)
let _step = 0;

const playMusicNote = (ctx, freq, dur, vol, type) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(_musicGain);
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

// Bắt đầu nhạc nền. name: 'arcade'|'calm'|'tense'. Gọi lại với track khác sẽ đổi bài.
export const startMusic = (name = 'arcade') => {
  _pendingTrack = name;
  if (_muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const track = TRACKS[name] || TRACKS.arcade;
  stopMusicTimer();
  if (!_musicGain) {
    _musicGain = ctx.createGain();
    _musicGain.gain.value = 0.5;
    _musicGain.connect(ctx.destination);
  }
  _step = 0;
  const beat = 60000 / track.bpm / 2; // mỗi ô = nửa phách (nốt móc đơn)
  const tick = () => {
    const c = getCtx();
    if (!c || _muted) return;
    const i = _step % track.melody.length;
    const mel = track.melody[i];
    if (mel) playMusicNote(c, mel, beat / 1000 * 0.9, 0.06, 'triangle');
    const bass = track.bass && track.bass[i];
    if (bass) playMusicNote(c, bass / 2, beat / 1000 * 1.4, 0.05, 'sine');
    _step += 1;
  };
  tick();
  _musicTimer = setInterval(tick, beat);
};

const stopMusicTimer = () => {
  if (_musicTimer) { clearInterval(_musicTimer); _musicTimer = null; }
};

// Dừng nhạc nền (giữ _pendingTrack để nút bật tiếng mở lại đúng bài).
export const stopMusic = () => {
  stopMusicTimer();
};

// Dừng hẳn & quên bài (gọi khi thoát game).
export const killMusic = () => {
  stopMusicTimer();
  _pendingTrack = null;
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
