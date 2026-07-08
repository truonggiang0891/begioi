import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import { useScoreRewards } from './gameRewards';
import { useFitSize } from './useFitSize';

// --- GAME: BẮN GẠCH (Shooter kiểu Space Invaders) ---
// Lái phi thuyền trái/phải, tự động bắn đạn lên phá các khối gạch đang trôi xuống.

const W = 320;
const H = 440;
const BEST_KEY = 'game_shooter_best';
const COLS = 6;
const BRICK_COLORS = ['#ef4444', '#fb923c', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa'];
const MARGIN = 16;
const BRICK_H = 18;
const BRICK_GAP = 6;
const SHIP_W = 34;
const SHIP_H = 18;
const SHIP_Y = H - 30;
const BULLET_SPEED = 6;
const FIRE_EVERY = 18; // số frame giữa 2 viên đạn

const brickW = (W - 2 * MARGIN - (COLS - 1) * BRICK_GAP) / COLS;

const makeWave = (rows, startY) => {
  const bricks = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      bricks.push({
        x: MARGIN + c * (brickW + BRICK_GAP),
        y: startY + r * (BRICK_H + BRICK_GAP),
        w: brickW,
        h: BRICK_H,
        color: BRICK_COLORS[(r + c) % BRICK_COLORS.length],
        alive: true,
      });
    }
  }
  return bricks;
};

export default function ShooterApp({ onBack, onReward }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [status, setStatus] = useState('playing'); // playing | over
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const statusRef = useRef('playing');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };
  const moveRef = useRef(0); // -1 trái, 1 phải, 0 đứng
  const steerRef = useRef(null); // mốc kéo tương đối {startX, startShipX}

  const newGame = () => {
    gRef.current = {
      ship: { x: W / 2 - SHIP_W / 2 },
      bullets: [],
      bricks: makeWave(3, 40),
      descend: 0.18,
      frame: 0,
    };
    setScore(0);
    setNewRecord(false);
    setStatusBoth('playing');
  };

  useEffect(() => {
    newGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let curScore = 0;

    const draw = () => {
      const g = gRef.current;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);
      // gạch
      g.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x, b.y, b.w, 4);
      });
      // đạn
      ctx.fillStyle = '#fde047';
      g.bullets.forEach((bl) => ctx.fillRect(bl.x - 2, bl.y - 8, 4, 10));
      // phi thuyền
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(g.ship.x + SHIP_W / 2, SHIP_Y);
      ctx.lineTo(g.ship.x, SHIP_Y + SHIP_H);
      ctx.lineTo(g.ship.x + SHIP_W, SHIP_Y + SHIP_H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(g.ship.x + SHIP_W / 2 - 3, SHIP_Y + 4, 6, 8);
    };

    const update = () => {
      const g = gRef.current;
      g.frame += 1;

      // di chuyển thuyền
      g.ship.x = Math.max(0, Math.min(W - SHIP_W, g.ship.x + moveRef.current * 4));

      // tự bắn
      if (g.frame % FIRE_EVERY === 0) {
        g.bullets.push({ x: g.ship.x + SHIP_W / 2, y: SHIP_Y });
      }
      // di chuyển đạn
      g.bullets.forEach((bl) => { bl.y -= BULLET_SPEED; });
      g.bullets = g.bullets.filter((bl) => bl.y > -10);

      // gạch trôi xuống
      g.bricks.forEach((b) => { if (b.alive) b.y += g.descend; });

      // đạn trúng gạch
      for (const bl of g.bullets) {
        for (const b of g.bricks) {
          if (b.alive && bl.x > b.x && bl.x < b.x + b.w && bl.y < b.y + b.h && bl.y > b.y) {
            b.alive = false;
            bl.y = -100; // đánh dấu để lọc bỏ
            curScore += 10;
            setScore(curScore);
            if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
            playSound('pop');
            break;
          }
        }
      }
      g.bullets = g.bullets.filter((bl) => bl.y > -10);

      // hết gạch -> đợt mới, khó hơn
      if (g.bricks.every((b) => !b.alive)) {
        g.descend += 0.06;
        g.bricks = makeWave(3, 30);
        playSound('correct');
      }

      // gạch chạm đáy?
      if (g.bricks.some((b) => b.alive && b.y + b.h >= SHIP_Y)) {
        setStatusBoth('over');
        if (curScore > best) setNewRecord(true); else playSound('wrong');
      }
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') moveRef.current = -1;
      else if (e.key === 'ArrowRight') moveRef.current = 1;
    };
    const onKeyUp = (e) => {
      if ((e.key === 'ArrowLeft' && moveRef.current === -1) || (e.key === 'ArrowRight' && moveRef.current === 1)) {
        moveRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  // Lái tương đối: kéo ngắn cũng đi được xa (nhân độ nhạy) -> đỡ phải rê tay cả màn hình.
  const STEER_GAIN = 2.2;
  const steer = (e) => {
    const isDown = e.type === 'pointerdown';
    if (!isDown && !(e.pointerType === 'touch' || e.buttons)) return;
    const g = gRef.current; if (!g) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = rect.width ? W / rect.width : 1;
    if (isDown || !steerRef.current) {
      steerRef.current = { startX: e.clientX, startShipX: g.ship.x };
      if (isDown) return;
    }
    const dx = (e.clientX - steerRef.current.startX) * scale * STEER_GAIN;
    g.ship.x = Math.max(0, Math.min(W - SHIP_W, steerRef.current.startShipX + dx));
  };
  const endSteer = () => { steerRef.current = null; };

  const hold = (v) => ({ onPointerDown: () => { moveRef.current = v; }, onPointerUp: () => { moveRef.current = 0; }, onPointerLeave: () => { moveRef.current = 0; } });

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🚀 Bắn gạch</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Kéo bên dưới để lái thuyền · thuyền tự bắn
          </GameHelp>
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 px-3 pt-2">
        <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
          <Trophy size={16} className="text-amber-400" />
          <div className="text-xl font-black text-amber-300">{best}</div>
        </div>
      </div>

      <div
        ref={fitRef}
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-start touch-none pt-1"
        onPointerDown={steer}
        onPointerMove={steer}
        onPointerUp={endSteer}
        onPointerCancel={endSteer}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
          style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
        />
      </div>

      <div
        onPointerDown={steer}
        onPointerMove={steer}
        onPointerUp={endSteer}
        onPointerCancel={endSteer}
        className="mx-3 mt-1 flex h-14 shrink-0 touch-none items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 text-xs font-black text-cyan-100/70"
      >
        ↔ Kéo qua lại để lái (kéo ngắn cũng đi xa)
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 px-3 pb-3">
        {/* Nút lái (tự động bắn) */}
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Trái" {...hold(-1)}
            className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowLeft size={28} />
          </button>
          <button type="button" aria-label="Phải" {...hold(1)}
            className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowRight size={28} />
          </button>
        </div>
      </div>

      {status === 'over' && newRecord && <Fireworks />}
      {status === 'over' && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🚀'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Gạch chạm đáy rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-orange-500">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={newGame} className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
