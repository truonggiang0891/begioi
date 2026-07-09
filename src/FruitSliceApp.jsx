import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Heart, Gem } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound, startMusic, killMusic } from './gameAudio';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, makeShake, addShake, applyShake } from './gameFx';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';

// --- GAME: CHÉM HOA QUẢ (Fruit Slice / Fruit Ninja kiểu đơn giản) ---
// Trái cây được bắn lên từ dưới theo đường cầu vồng, bé vuốt ngón tay/chuột
// qua để chém. Có bom (mất mạng), quả vàng (thưởng điểm) và quả băng (làm
// chậm thời gian).

const W = 320;
const H = 440;
const BEST_KEY = 'game_fruit_best';
const GRAVITY = 0.12;
// Màu quả rực rỡ, tương phản mạnh với nền tối để không bị chìm.
const FRUIT_COLORS = ['#ff3b3b', '#ff8a00', '#ffd000', '#7cf03a', '#00d9c0', '#ff4fa3', '#b15bff'];
const FRUIT_R = 22;
const FREEZE_MS = 3000;
const FREEZE_FACTOR = 0.35;
// Chế độ FRENZY: khi chuỗi chém trong 1 cú vuốt đủ dài -> vài giây nhiều quả + x2 điểm.
const FRENZY_COMBO = 6;
const FRENZY_MS = 4500;

// Trộn màu với trắng/đen theo tỉ lệ p (âm = tối đi).
const shade = (hex, p) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = p < 0 ? 0 : 255;
  const a = Math.abs(p);
  r = Math.round((t - r) * a + r);
  g = Math.round((t - g) * a + g);
  b = Math.round((t - b) * a + b);
  return `rgb(${r},${g},${b})`;
};

// Độ sáng tương đối của màu (0 tối → 1 sáng).
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Vẽ một quả tròn rực rỡ (bóng sáng góc trên + viền + cuống lá).
// Quả tối màu -> viền vàng nổi bật để không chìm vào nền.
const drawBall = (ctx, r, color) => {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.2, 0, 0, r);
  grad.addColorStop(0, shade(color, 0.45));
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, shade(color, -0.22));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (luminance(color) < 0.58) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffe14d'; // viền vàng cho quả tối
  } else {
    ctx.lineWidth = 2;
    ctx.strokeStyle = shade(color, -0.35);
  }
  ctx.stroke();
  // lá xanh nhỏ
  ctx.fillStyle = '#37c25a';
  ctx.beginPath();
  ctx.ellipse(r * 0.25, -r * 0.92, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // đốm sáng
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.32, r * 0.24, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
};

// Vẽ nửa quả đã bị chém (side +1/-1): vỏ màu + ruột sáng ở mặt cắt.
const drawHalf = (ctx, r, color, side) => {
  ctx.beginPath();
  if (side > 0) ctx.arc(0, 0, r, 0, Math.PI);
  else ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = shade(color, -0.3);
  ctx.stroke();
  // ruột quả (sáng hơn) ở mặt cắt
  ctx.beginPath();
  if (side > 0) ctx.arc(0, 0, r * 0.72, 0, Math.PI);
  else ctx.arc(0, 0, r * 0.72, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = shade(color, 0.55);
  ctx.fill();
};

// Khoảng cách từ 1 điểm tới đoạn thẳng (dùng để kiểm tra lưỡi dao có chạm quả không).
const distToSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
};

const rand = (min, max) => min + Math.random() * (max - min);

const makeFruit = () => {
  const roll = Math.random();
  let type = 'fruit';
  let emoji = null;
  let color = FRUIT_COLORS[Math.floor(Math.random() * FRUIT_COLORS.length)];
  if (roll < 0.12) {
    type = 'bomb';
    emoji = '💣';
  } else if (roll < 0.18) {
    type = 'golden';
    emoji = '⭐';
  } else if (roll < 0.24) {
    type = 'freeze';
    emoji = '❄️';
  }
  return {
    id: Math.random(),
    type,
    emoji,
    color,
    x: rand(36, W - 36),
    y: H + 24,
    vx: rand(-1, 1),
    vy: rand(-6.6, -5),
    r: FRUIT_R,
    rot: 0,
    rotSpeed: rand(-0.05, 0.05),
    sliced: false,
  };
};

export default function FruitSliceApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const trailRef = useRef([]);
  const pointerDownRef = useRef(false);
  const lastPointRef = useRef(null);
  const sliceRunRef = useRef(0);
  const statusRef = useRef('playing');
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const bestRef = useRef(0);
  const prevBestRef = useRef(0);
  const freezeUntilRef = useRef(0);
  const freezeTimeoutRef = useRef(null);
  const comboTimeoutRef = useRef(null);
  const musicRef = useRef(false);       // đã bật nhạc nền chưa
  const whooshRef = useRef(0);          // chặn phát 'whoosh' quá dày
  const frenzyUntilRef = useRef(0);     // thời điểm hết FRENZY
  const frenzyTimeoutRef = useRef(null);

  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(() => {
    try {
      return parseInt(localStorage.getItem(BEST_KEY), 10) || 0;
    } catch {
      return 0;
    }
  });
  const [status, setStatus] = useState('playing');
  const [newRecord, setNewRecord] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [comboText, setComboText] = useState('');
  const [frenzyActive, setFrenzyActive] = useState(false);

  bestRef.current = best;

  const setStatusBoth = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  // Bật nhạc nền ở lần tương tác đầu (theo yêu cầu autoplay của trình duyệt).
  const ensureMusic = () => {
    if (musicRef.current) return;
    musicRef.current = true;
    startMusic('arcade');
  };

  const addScore = (n) => {
    // FRENZY -> nhân đôi điểm.
    const mult = performance.now() < frenzyUntilRef.current ? 2 : 1;
    setScore((s) => {
      const ns = s + n * mult;
      scoreRef.current = ns;
      if (ns > bestRef.current) {
        bestRef.current = ns;
        setBest(ns);
        try {
          localStorage.setItem(BEST_KEY, String(ns));
        } catch {
          // Bỏ qua nếu không lưu được.
        }
      }
      return ns;
    });
  };

  const endGame = () => {
    setStatusBoth('over');
    setNewRecord(scoreRef.current > prevBestRef.current);
    killMusic();
    musicRef.current = false; // để lần chơi sau bật lại nhạc
  };

  const loseLife = () => {
    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    playSound('wrong');
    if (livesRef.current <= 0) endGame();
  };

  const triggerCombo = (n) => {
    playSound('correct');
    setComboText(`Combo x${n}! 🔥`);
    clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = setTimeout(() => setComboText(''), 900);
  };

  const triggerFreeze = () => {
    freezeUntilRef.current = performance.now() + FREEZE_MS;
    setFreezeActive(true);
    clearTimeout(freezeTimeoutRef.current);
    freezeTimeoutRef.current = setTimeout(() => setFreezeActive(false), FREEZE_MS);
  };

  // Kích hoạt FRENZY: vài giây nhiều quả hơn + x2 điểm + chữ "FRENZY!".
  const triggerFrenzy = () => {
    const already = performance.now() < frenzyUntilRef.current;
    frenzyUntilRef.current = performance.now() + FRENZY_MS;
    setFrenzyActive(true);
    if (!already) playSound('powerup');
    clearTimeout(frenzyTimeoutRef.current);
    frenzyTimeoutRef.current = setTimeout(() => setFrenzyActive(false), FRENZY_MS);
  };

  const newGame = () => {
    gRef.current = {
      fruits: [], halves: [], particles: [], frame: 0,
      spawnTimer: 30, spawnEvery: 75, waveCount: 0,
      shake: makeShake(), flash: 0, // flash: cường độ chớp trắng khi nổ bom
    };
    trailRef.current = [];
    pointerDownRef.current = false;
    lastPointRef.current = null;
    sliceRunRef.current = 0;
    clearTimeout(freezeTimeoutRef.current);
    clearTimeout(comboTimeoutRef.current);
    clearTimeout(frenzyTimeoutRef.current);
    freezeUntilRef.current = 0;
    frenzyUntilRef.current = 0;
    setFreezeActive(false);
    setFrenzyActive(false);
    setComboText('');
    prevBestRef.current = bestRef.current;
    livesRef.current = 3;
    setLives(3);
    scoreRef.current = 0;
    setScore(0);
    setNewRecord(false);
    setStatusBoth('playing');
  };

  useEffect(() => {
    newGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;

    const spawnWave = (g) => {
      let count = scoreRef.current > 25 && Math.random() < 0.4 ? 2 : 1;
      // FRENZY -> tung thêm quả cho rộn ràng.
      if (performance.now() < frenzyUntilRef.current) count += 2;
      for (let i = 0; i < count; i += 1) g.fruits.push(makeFruit());
    };

    const update = () => {
      const g = gRef.current;
      g.frame += 1;

      g.spawnTimer -= 1;
      if (g.spawnTimer <= 0) {
        spawnWave(g);
        g.waveCount += 1;
        g.spawnTimer = g.spawnEvery + Math.floor(rand(-8, 8));
        if (g.waveCount % 5 === 0) g.spawnEvery = Math.max(40, g.spawnEvery - 4);
      }

      const frozen = performance.now() < freezeUntilRef.current;
      const factor = frozen ? FREEZE_FACTOR : 1;

      g.fruits.forEach((f) => {
        f.vy += GRAVITY * factor;
        f.x += f.vx * factor;
        f.y += f.vy * factor;
        f.rot += f.rotSpeed * factor;
      });
      g.fruits = g.fruits.filter((f) => f.y < H + 40);

      // Nửa quả bay ra sau khi chém.
      g.halves.forEach((h) => {
        h.vy += GRAVITY * factor;
        h.x += h.vx * factor;
        h.y += h.vy * factor;
        h.rot += h.rotSpeed * factor;
        h.life -= 0.016;
      });
      g.halves = g.halves.filter((h) => h.life > 0 && h.y < H + 60);

      // vụn nước/giọt màu + chớp trắng khi nổ bom
      stepParticles(g.particles);
      if (g.flash > 0) g.flash = Math.max(0, g.flash - 0.05);
    };

    const draw = () => {
      const g = gRef.current;
      ctx.save();
      const [ox, oy] = applyShake(g.shake); // rung màn hình khi nổ bom
      ctx.translate(ox, oy);
      // nền (phủ rộng hơn khung để lúc rung không lộ mép)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0c1a2e');
      grad.addColorStop(1, '#132743');
      ctx.fillStyle = grad;
      ctx.fillRect(-16, -16, W + 32, H + 32);

      // hào quang khi đóng băng
      if (performance.now() < freezeUntilRef.current) {
        ctx.fillStyle = 'rgba(125,211,252,0.08)';
        ctx.fillRect(0, 0, W, H);
      }

      // nửa quả đã chém (vẽ trước, nằm dưới)
      g.halves.forEach((h) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, h.life));
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        drawHalf(ctx, h.r, h.color, h.side);
        ctx.restore();
      });

      // trái cây
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      g.fruits.forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        if (f.type === 'fruit') {
          drawBall(ctx, f.r, f.color);
        } else {
          if (f.type === 'bomb') {
            // vòng trắng + quầng sáng để bom không chìm vào nền tối
            ctx.beginPath();
            ctx.arc(0, 0, f.r + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.14)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            ctx.shadowColor = 'rgba(255,255,255,0.95)';
            ctx.shadowBlur = 10;
          } else if (f.type === 'golden' || f.type === 'freeze') {
            ctx.shadowColor = f.type === 'golden' ? 'rgba(250,204,21,0.9)' : 'rgba(125,211,252,0.9)';
            ctx.shadowBlur = 18;
          }
          ctx.font = '34px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
          ctx.fillText(f.emoji, 0, 0);
        }
        ctx.restore();
      });

      // vụn nước/giọt màu bắn ra khi chém (vẽ trên quả)
      drawParticles(ctx, g.particles);

      // vệt lưỡi dao
      const trail = trailRef.current;
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i += 1) {
          const a = trail[i - 1];
          const b = trail[i];
          const t = i / trail.length;
          ctx.strokeStyle = `rgba(224,242,254,${0.15 + t * 0.7})`;
          ctx.lineWidth = 2 + t * 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // làm mờ dần vệt dao
      trail.forEach((p) => {
        p.age += 1;
      });
      trailRef.current = trail.filter((p) => p.age < 10);

      ctx.restore();

      // chớp trắng toàn màn (không rung theo) khi nổ bom
      if (g.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const loop = () => {
      if (statusRef.current === 'playing') update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw();
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); musicRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sliceFruit = (f, angle = 0) => {
    const g = gRef.current;
    g.fruits = g.fruits.filter((x) => x !== f);
    if (f.type === 'bomb') {
      // Chém trúng bom: nổ, rung màn hình + chớp trắng.
      sliceRunRef.current = 0;
      addShake(g.shake, 14);
      g.flash = 1;
      spawnBurst(g.particles, f.x, f.y, ['#ff8a00', '#ffd000', '#333333', '#777777'], 22, { spread: 6 });
      playSound('explode');
      loseLife();
      return;
    }
    // Tách đôi: 2 nửa bay ngược nhau theo phương vuông góc lưỡi dao.
    if (f.type === 'fruit') {
      const px = Math.cos(angle + Math.PI / 2);
      const py = Math.sin(angle + Math.PI / 2);
      const push = 1.8;
      [1, -1].forEach((side) => {
        g.halves.push({
          x: f.x,
          y: f.y,
          vx: f.vx * 0.4 + px * push * side,
          vy: f.vy * 0.4 + py * push * side - 0.6,
          r: f.r,
          color: f.color,
          rot: angle,
          rotSpeed: 0.06 * side,
          side,
          life: 1,
        });
      });
    }
    // Vụn nước/giọt màu theo màu quả (bổ sung cho 2 nửa quả).
    const juice = f.type === 'fruit'
      ? [f.color, shade(f.color, 0.5), '#ffffff']
      : ['#ffffff', shade(f.color || '#7cf03a', 0.4)];
    spawnBurst(g.particles, f.x, f.y, juice, 12, { spread: 5 });
    playSound('break'); // tiếng chém quả
    addScore(1);
    sliceRunRef.current += 1;
    if (f.type === 'golden') {
      addScore(5);
      playSound('coin'); // quả vàng
    } else if (f.type === 'freeze') {
      triggerFreeze();
    }
    if (sliceRunRef.current >= 3) {
      addScore(sliceRunRef.current);
      triggerCombo(sliceRunRef.current);
    }
    // Chuỗi chém đủ dài trong 1 cú vuốt -> FRENZY!
    if (sliceRunRef.current >= FRENZY_COMBO) triggerFrenzy();
  };

  const toCanvasXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onPointerDown = (e) => {
    if (statusRef.current !== 'playing') return;
    ensureMusic(); // lần vuốt đầu -> bật nhạc nền
    try { canvasRef.current?.setPointerCapture?.(e.pointerId); } catch { /* pointer id không hợp lệ -> bỏ qua */ }
    const p = toCanvasXY(e);
    pointerDownRef.current = true;
    sliceRunRef.current = 0;
    lastPointRef.current = p;
    trailRef.current.push({ ...p, age: 0 });
  };

  const onPointerMove = (e) => {
    if (!pointerDownRef.current || statusRef.current !== 'playing') return;
    const p = toCanvasXY(e);
    const prev = lastPointRef.current;
    trailRef.current.push({ ...p, age: 0 });
    if (trailRef.current.length > 16) trailRef.current.shift();

    const g = gRef.current;
    if (g && prev) {
      // Âm 'whoosh' theo cú vuốt (chặn phát quá dày, chỉ khi vuốt đủ nhanh).
      const speed = Math.hypot(p.x - prev.x, p.y - prev.y);
      const now = performance.now();
      if (speed > 14 && now - whooshRef.current > 160) {
        whooshRef.current = now;
        playSound('whoosh');
      }
      const angle = Math.atan2(p.y - prev.y, p.x - prev.x);
      g.fruits.forEach((f) => {
        if (f.sliced) return;
        const d = distToSegment(f.x, f.y, prev.x, prev.y, p.x, p.y);
        if (d < f.r + 12) {
          f.sliced = true;
          sliceFruit(f, angle);
        }
      });
    }
    lastPointRef.current = p;
  };

  const onPointerEnd = () => {
    pointerDownRef.current = false;
    sliceRunRef.current = 0;
    lastPointRef.current = null;
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🍉 Chém hoa quả</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Vuốt qua trái cây để chém · né 💣 · ⭐ +5 điểm · ❄️ làm chậm thời gian · chém liền tay để vào FRENZY x2! 🔥
          </GameHelp>
          <SoundToggle />
          <button
            type="button"
            onClick={newGame}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
          >
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-4 py-2">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={18}
                className={i < lives ? 'fill-red-500 text-red-500' : 'text-white/20'}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-4 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-xl font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        {freezeActive && (
          <div className="shrink-0 rounded-full bg-sky-400/20 px-4 py-1 text-xs font-black text-sky-300">
            ❄️ Đóng băng — chậm lại!
          </div>
        )}
        {frenzyActive && (
          <div className="shrink-0 animate-pulse rounded-full bg-orange-500/25 px-4 py-1 text-xs font-black text-orange-300">
            🔥 FRENZY! Nhiều quả — điểm x2!
          </div>
        )}

        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
          <div className="relative" style={{ width: fitSize.w, height: fitSize.h }}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerLeave={onPointerEnd}
              onPointerCancel={onPointerEnd}
              className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
              style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
            />
            {comboText && (
              <div className="pointer-events-none absolute inset-x-0 top-6 text-center text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {comboText}
              </div>
            )}
            {frenzyActive && (
              <div className="pointer-events-none absolute inset-x-0 top-1/3 animate-bounce text-center text-4xl font-black tracking-wider text-orange-400 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]">
                FRENZY! 🔥
              </div>
            )}
          </div>
        </div>

      </div>

      {status === 'over' && newRecord && <Fireworks />}
      {status === 'over' && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🍉'}</div>
            <h2 className="text-2xl font-black text-slate-700">
              {newRecord ? 'Kỷ lục mới!' : 'Bé đã hết mạng!'}
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-orange-500">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button
              type="button"
              onClick={newGame}
              className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5"
            >
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
