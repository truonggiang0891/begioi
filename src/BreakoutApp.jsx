import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';

// --- GAME: PHÁ GẠCH (Breakout / Arkanoid) ---
// Di thanh chắn để bật bóng lên phá các khối gạch phía trên.

const W = 320;
const H = 440;
const BEST_KEY = 'game_breakout_best';
const ROWS = 5;
const COLS = 8;
const BRICK_COLORS = ['#ef4444', '#fb923c', '#f59e0b', '#34d399', '#60a5fa'];
const MARGIN = 14;
const BRICK_H = 16;
const BRICK_GAP = 4;
const PADDLE_W = 74;
const PADDLE_H = 12;
const BALL_R = 6;

const makeBricks = () => {
  const bricks = [];
  const bw = (W - 2 * MARGIN - (COLS - 1) * BRICK_GAP) / COLS;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      bricks.push({
        x: MARGIN + c * (bw + BRICK_GAP),
        y: 44 + r * (BRICK_H + BRICK_GAP),
        w: bw,
        h: BRICK_H,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        alive: true,
      });
    }
  }
  return bricks;
};

export default function BreakoutApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('ready'); // ready | playing | over
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const statusRef = useRef('ready');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };

  const resetBall = (g) => {
    g.ball = { x: W / 2, y: H - 40, dx: 0, dy: 0, stuck: true };
  };

  const newGame = (keepBest) => {
    const g = {
      paddle: { x: W / 2 - PADDLE_W / 2, y: H - 26 },
      ball: null,
      bricks: makeBricks(),
      speed: 3.4,
    };
    resetBall(g);
    gRef.current = g;
    setScore(0);
    setLives(3);
    setNewRecord(false);
    if (!keepBest) { /* best giữ nguyên */ }
    setStatusBoth('ready');
  };

  const launch = () => {
    const g = gRef.current;
    if (!g || !g.ball || !g.ball.stuck || statusRef.current === 'over') return;
    g.ball.stuck = false;
    g.ball.dx = g.speed * 0.5;
    g.ball.dy = -g.speed;
    setStatusBoth('playing');
  };

  useEffect(() => {
    newGame(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let curScore = 0;
    let curLives = 3;

    const draw = () => {
      const g = gRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);
      // gạch
      g.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(b.x, b.y, b.w, 4);
      });
      // thanh chắn
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(g.paddle.x, g.paddle.y, PADDLE_W, PADDLE_H);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(g.paddle.x, g.paddle.y + PADDLE_H - 3, PADDLE_W, 3);
      // bóng
      ctx.beginPath();
      ctx.fillStyle = '#fde047';
      ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    };

    const update = () => {
      const g = gRef.current;
      const ball = g.ball;
      if (ball.stuck) { ball.x = g.paddle.x + PADDLE_W / 2; return; }

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
      if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
      if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }

      // va thanh chắn
      if (ball.dy > 0 && ball.y + BALL_R >= g.paddle.y && ball.y < g.paddle.y + PADDLE_H
          && ball.x >= g.paddle.x && ball.x <= g.paddle.x + PADDLE_W) {
        const hit = (ball.x - (g.paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        ball.dy = -Math.abs(ball.dy);
        ball.dx = g.speed * hit * 1.1;
        ball.y = g.paddle.y - BALL_R;
      }

      // va gạch
      for (const b of g.bricks) {
        if (!b.alive) continue;
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w
            && ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
          b.alive = false;
          curScore += 10;
          setScore(curScore);
          if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
          playSound('pop');
          // xác định trục bật lại
          const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
          const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
          if (overlapX < overlapY) ball.dx = -ball.dx; else ball.dy = -ball.dy;
          break;
        }
      }

      // qua màn?
      if (g.bricks.every((b) => !b.alive)) {
        g.speed += 0.4;
        g.bricks = makeBricks();
        resetBall(g);
        setStatusBoth('ready');
        playSound('correct');
        return;
      }

      // rơi xuống đáy
      if (ball.y - BALL_R > H) {
        curLives -= 1;
        setLives(curLives);
        if (curLives <= 0) {
          setStatusBoth('over');
          if (curScore > best) { setNewRecord(true); } else { playSound('wrong'); }
        } else {
          resetBall(g);
          setStatusBoth('ready');
        }
      }
    };

    const loop = () => {
      if (statusRef.current === 'playing') update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw(); // vẽ khung hình đầu ngay (phòng khi tab chạy nền)
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // điều khiển thanh chắn: kéo ở vùng bên dưới sân chơi
  const steer = (e) => {
    if (e.type === 'pointermove' && !(e.pointerType === 'touch' || e.buttons)) return;
    const g = gRef.current;
    if (!g) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    g.paddle.x = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    if (e.type === 'pointerdown') launch();
  };

  useEffect(() => {
    const onKey = (e) => {
      const g = gRef.current;
      if (!g) return;
      if (e.key === 'ArrowLeft') g.paddle.x = Math.max(0, g.paddle.x - 24);
      else if (e.key === 'ArrowRight') g.paddle.x = Math.min(W - PADDLE_W, g.paddle.x + 24);
      else if (e.key === ' ') { e.preventDefault(); launch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = () => newGame(false);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🧱 Phá gạch</h1>
        <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-4 py-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <Heart key={i} size={18} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-4 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
        </div>

        <div
          ref={fitRef}
          className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-start pt-1 touch-none"
          onPointerDown={steer}
          onPointerMove={steer}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
          {status === 'ready' && (
            <div
              className="pointer-events-none absolute inset-x-0 text-center"
              style={{ top: Math.max(0, fitSize.h - 64) }}
            >
              <span className="rounded-full bg-black/60 px-4 py-1.5 text-sm font-black text-white">
                Chạm để bắn bóng 👆
              </span>
            </div>
          )}
        </div>
        <div
          onPointerDown={steer}
          onPointerMove={steer}
          className="mx-3 mt-1 flex h-12 w-full max-w-[420px] shrink-0 touch-none items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 text-xs font-black text-cyan-100/70"
        >
          ↔ Kéo ở đây để lái thanh chắn · chạm để bắn bóng
        </div>
      </div>

      {status === 'over' && newRecord && <Fireworks />}
      {status === 'over' && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🧱'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết bóng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-orange-500">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
