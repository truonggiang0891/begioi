import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Heart } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';

// --- GAME: CHÉM HOA QUẢ (Fruit Slice / Fruit Ninja kiểu đơn giản) ---
// Trái cây được bắn lên từ dưới theo đường cầu vồng, bé vuốt ngón tay/chuột
// qua để chém. Có bom (mất mạng), quả vàng (thưởng điểm) và quả băng (làm
// chậm thời gian).

const W = 320;
const H = 440;
const BEST_KEY = 'game_fruit_best';
const GRAVITY = 0.12;
const FRUIT_EMOJIS = ['🍎', '🍉', '🍊', '🍓', '🍇', '🥝', '🍍'];
const FRUIT_R = 20;
const FREEZE_MS = 3000;
const FREEZE_FACTOR = 0.35;

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
  let emoji = FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
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

export default function FruitSliceApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
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

  const [score, setScore] = useState(0);
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

  bestRef.current = best;

  const setStatusBoth = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  const addScore = (n) => {
    setScore((s) => {
      const ns = s + n;
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

  const newGame = () => {
    gRef.current = { fruits: [], frame: 0, spawnTimer: 30, spawnEvery: 75, waveCount: 0 };
    trailRef.current = [];
    pointerDownRef.current = false;
    lastPointRef.current = null;
    sliceRunRef.current = 0;
    clearTimeout(freezeTimeoutRef.current);
    clearTimeout(comboTimeoutRef.current);
    freezeUntilRef.current = 0;
    setFreezeActive(false);
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
      const count = scoreRef.current > 25 && Math.random() < 0.4 ? 2 : 1;
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
    };

    const draw = () => {
      const g = gRef.current;
      // nền
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0c1a2e');
      grad.addColorStop(1, '#132743');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // hào quang khi đóng băng
      if (performance.now() < freezeUntilRef.current) {
        ctx.fillStyle = 'rgba(125,211,252,0.08)';
        ctx.fillRect(0, 0, W, H);
      }

      // trái cây
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      g.fruits.forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        if (f.type === 'golden' || f.type === 'freeze') {
          ctx.shadowColor = f.type === 'golden' ? 'rgba(250,204,21,0.9)' : 'rgba(125,211,252,0.9)';
          ctx.shadowBlur = 18;
        }
        ctx.font = '32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
      });

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
    };

    const loop = () => {
      if (statusRef.current === 'playing') update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sliceFruit = (f) => {
    const g = gRef.current;
    g.fruits = g.fruits.filter((x) => x !== f);
    if (f.type === 'bomb') {
      sliceRunRef.current = 0;
      loseLife();
      return;
    }
    playSound('pop');
    addScore(1);
    sliceRunRef.current += 1;
    if (f.type === 'golden') {
      addScore(5);
      playSound('correct');
    } else if (f.type === 'freeze') {
      triggerFreeze();
    }
    if (sliceRunRef.current >= 3) {
      addScore(sliceRunRef.current);
      triggerCombo(sliceRunRef.current);
    }
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
    canvasRef.current?.setPointerCapture?.(e.pointerId);
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
      g.fruits.forEach((f) => {
        if (f.sliced) return;
        const d = distToSegment(f.x, f.y, prev.x, prev.y, p.x, p.y);
        if (d < f.r + 12) {
          f.sliced = true;
          sliceFruit(f);
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
        <button
          type="button"
          onClick={newGame}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-3 py-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
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
        </div>

        {freezeActive && (
          <div className="rounded-full bg-sky-400/20 px-4 py-1 text-xs font-black text-sky-300">
            ❄️ Đóng băng — chậm lại!
          </div>
        )}

        <div className="relative">
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
            style={{ width: 'min(84vw, 320px)', height: 'auto', display: 'block' }}
          />
          {comboText && (
            <div className="pointer-events-none absolute inset-x-0 top-6 text-center text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {comboText}
            </div>
          )}
        </div>

        <p className="max-w-xs text-center text-xs font-bold text-white/40">
          Vuốt qua trái cây để chém · né 💣 · ⭐ +5 điểm · ❄️ làm chậm thời gian
        </p>
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
