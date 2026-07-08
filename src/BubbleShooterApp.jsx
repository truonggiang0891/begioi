import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';

// --- GAME: BẮN BONG BÓNG (Bubble Shooter) ---
// Ngắm và bắn bong bóng lên; 3 bóng cùng màu chạm nhau -> nổ.

const W = 322;
const H = 440;
const COLS = 7;
const CELL = W / COLS;
const R = CELL / 2 * 0.92;
const MAXROWS = Math.floor((H - 60) / CELL);
const START_ROWS = 4;
const SPEED = 7;
const BEST_KEY = 'game_bubble_best';
const COLORS = ['#ef4444', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa'];

const rndColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const cx = (c) => c * CELL + CELL / 2;
const cy = (r) => r * CELL + CELL / 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const makeGrid = () => {
  const grid = Array.from({ length: MAXROWS }, () => Array(COLS).fill(null));
  for (let r = 0; r < START_ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) grid[r][c] = rndColor();
  }
  return grid;
};

export default function BubbleShooterApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('playing');
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const statusRef = useRef('playing');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };

  const newGame = () => {
    gRef.current = {
      grid: makeGrid(),
      cur: rndColor(),
      next: rndColor(),
      fly: null, // {x,y,vx,vy,color}
      angle: -Math.PI / 2,
      shots: 0,
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

    const bubble = (x, y, color, r = R) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      const g = gRef.current;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);
      // lưới bong bóng
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (g.grid[r][c]) bubble(cx(c), cy(r), g.grid[r][c]);
        }
      }
      const lx = W / 2;
      const ly = H - 24;
      // đường ngắm
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(g.angle) * 120, ly + Math.sin(g.angle) * 120);
      ctx.stroke();
      ctx.setLineDash([]);
      // bóng đang bay
      if (g.fly) bubble(g.fly.x, g.fly.y, g.fly.color);
      // bóng chờ bắn + bóng kế
      bubble(lx, ly, g.cur);
      bubble(W - 22, ly + 2, g.next, R * 0.7);
    };

    const clusterOf = (row, col, color) => {
      const seen = new Set();
      const stack = [[row, col]];
      const out = [];
      while (stack.length) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= MAXROWS || c < 0 || c >= COLS) continue;
        const k = `${r},${c}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (gRef.current.grid[r][c] !== color) continue;
        out.push([r, c]);
        stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
      }
      return out;
    };

    const removeFloating = () => {
      const g = gRef.current;
      const keep = new Set();
      const stack = [];
      for (let c = 0; c < COLS; c += 1) if (g.grid[0][c]) stack.push([0, c]);
      while (stack.length) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= MAXROWS || c < 0 || c >= COLS) continue;
        const k = `${r},${c}`;
        if (keep.has(k) || !g.grid[r][c]) continue;
        keep.add(k);
        stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
      }
      let removed = 0;
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (g.grid[r][c] && !keep.has(`${r},${c}`)) { g.grid[r][c] = null; removed += 1; }
        }
      }
      return removed;
    };

    const snapAndResolve = () => {
      const g = gRef.current;
      const { x, y, color } = g.fly;
      let col = clamp(Math.round((x - CELL / 2) / CELL), 0, COLS - 1);
      let row = clamp(Math.round((y - CELL / 2) / CELL), 0, MAXROWS - 1);
      if (g.grid[row][col]) {
        const cand = [[row + 1, col], [row - 1, col], [row, col - 1], [row, col + 1], [row + 1, col - 1], [row + 1, col + 1]];
        let done = false;
        for (const [rr, ccc] of cand) {
          if (rr >= 0 && rr < MAXROWS && ccc >= 0 && ccc < COLS && !g.grid[rr][ccc]) { row = rr; col = ccc; done = true; break; }
        }
        if (!done) {
          outer: for (let rr = 0; rr < MAXROWS; rr += 1) {
            for (let ccc = 0; ccc < COLS; ccc += 1) if (!g.grid[rr][ccc]) { row = rr; col = ccc; break outer; }
          }
        }
      }
      g.grid[row][col] = color;
      g.fly = null;

      const cl = clusterOf(row, col, color);
      if (cl.length >= 3) {
        cl.forEach(([r, c]) => { g.grid[r][c] = null; });
        const extra = removeFloating();
        curScore += (cl.length + extra) * 10;
        setScore(curScore);
        if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
        playSound('correct');
      } else {
        playSound('pop');
      }

      // hết bóng -> nạp lưới mới
      if (g.grid.every((rr) => rr.every((c) => !c))) {
        for (let r = 0; r < START_ROWS; r += 1) for (let c = 0; c < COLS; c += 1) g.grid[r][c] = rndColor();
      }

      // thua nếu bóng chạm quá thấp
      let maxRow = -1;
      for (let r = 0; r < MAXROWS; r += 1) for (let c = 0; c < COLS; c += 1) if (g.grid[r][c]) maxRow = r;
      if (maxRow >= MAXROWS - 1) {
        setStatusBoth('over');
        if (curScore > best) setNewRecord(true); else playSound('wrong');
        return;
      }

      g.cur = g.next;
      g.next = rndColor();
    };

    const update = () => {
      const g = gRef.current;
      if (!g.fly) return;
      g.fly.x += g.fly.vx;
      g.fly.y += g.fly.vy;
      if (g.fly.x < R) { g.fly.x = R; g.fly.vx = Math.abs(g.fly.vx); }
      if (g.fly.x > W - R) { g.fly.x = W - R; g.fly.vx = -Math.abs(g.fly.vx); }
      if (g.fly.y <= R) { snapAndResolve(); return; }
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (!g.grid[r][c]) continue;
          const dx = g.fly.x - cx(c);
          const dy = g.fly.y - cy(r);
          if (dx * dx + dy * dy < (2 * R * 0.85) ** 2) { snapAndResolve(); return; }
        }
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

  const aimAt = (clientX, clientY) => {
    const g = gRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * W;
    const y = (clientY - rect.top) / rect.height * H;
    let ang = Math.atan2(y - (H - 24), x - W / 2);
    // chỉ cho ngắm lên trên
    ang = clamp(ang, -Math.PI + 0.25, -0.25);
    g.angle = ang;
  };
  const shoot = () => {
    const g = gRef.current;
    if (g.fly || statusRef.current !== 'playing') return;
    g.fly = { x: W / 2, y: H - 24, vx: Math.cos(g.angle) * SPEED, vy: Math.sin(g.angle) * SPEED, color: g.cur };
    g.shots += 1;
  };
  const onPointerDown = (e) => { aimAt(e.clientX, e.clientY); };
  const onPointerMove = (e) => { if (e.buttons || e.pointerType === 'touch') aimAt(e.clientX, e.clientY); };
  const onPointerUp = (e) => { aimAt(e.clientX, e.clientY); shoot(); };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🫧 Bắn bong bóng</h1>
        <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
        </div>

        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
        </div>
        <p className="shrink-0 text-xs font-bold text-white/40">Kéo để ngắm · thả để bắn</p>
      </div>

      {status === 'over' && newRecord && <Fireworks />}
      {status === 'over' && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🫧'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Đầy mất rồi!'}</h2>
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
