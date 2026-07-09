import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake } from './gameFx';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';
import GameHelp from './GameHelp';

// --- GAME: BẮN BONG BÓNG (Bubble Shooter) ---
// Ngắm và bắn bong bóng lên; 3 bóng cùng màu chạm nhau -> nổ.
// Nâng cấp: đường ngắm phản xạ tường, particle nổ + số điểm bay lên, combo,
// bóng đặc biệt (bom nổ vùng, cầu vồng ăn mọi màu), lưới tụt dần, nhạc nền.

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
const DROP_EVERY = 6; // sau bao nhiêu phát thì lưới tụt xuống 1 hàng
const P_BOMB = 0.07;
const P_RAINBOW = 0.07;

const rndColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const rndAmmo = () => {
  const r = Math.random();
  if (r < P_BOMB) return 'bomb';
  if (r < P_BOMB + P_RAINBOW) return 'rainbow';
  return rndColor();
};
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

export default function BubbleShooterApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [status, setStatus] = useState('playing');
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [aimF, setAimF] = useState(0.5); // vị trí thanh ngắm 0..1 (cho con trượt)
  const statusRef = useRef('playing');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };
  const musicRef = useRef(false);
  const barRef = useRef(null);
  const draggingRef = useRef(false);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('calm'); } };

  const newGame = () => {
    gRef.current = {
      grid: makeGrid(),
      cur: rndAmmo(),
      next: rndAmmo(),
      fly: null, // {x,y,vx,vy,color}
      angle: -Math.PI / 2,
      shots: 0,
      combo: 0,
      particles: [],
      floaters: [],
      shake: makeShake(),
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
    const g = () => gRef.current;

    const bumpBest = () => {
      if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
    };

    const drawBubble = (x, y, color, r = R) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawAmmo = (x, y, ammo, r = R) => {
      if (ammo === 'bomb' || ammo === 'rainbow') {
        ctx.beginPath();
        ctx.fillStyle = ammo === 'bomb' ? '#334155' : '#f472b6';
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${Math.round(r * 1.4)}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ammo === 'bomb' ? '💣' : '🌈', x, y + 1);
      } else {
        drawBubble(x, y, ammo, r);
      }
    };

    // Đường ngắm có phản xạ 2 vách -> dừng khi chạm bóng/đỉnh.
    const drawAim = (gg) => {
      const lx = W / 2, ly = H - 24;
      let x = lx, y = ly;
      let vx = Math.cos(gg.angle), vy = Math.sin(gg.angle);
      const pts = [[x, y]];
      for (let i = 0; i < 240; i += 1) {
        x += vx * 6; y += vy * 6;
        if (x < R) { x = R; vx = Math.abs(vx); }
        if (x > W - R) { x = W - R; vx = -Math.abs(vx); }
        pts.push([x, y]);
        if (y <= R) break;
        let hit = false;
        for (let r = 0; r < MAXROWS && !hit; r += 1) {
          for (let c = 0; c < COLS; c += 1) {
            if (!gg.grid[r][c]) continue;
            const dx = x - cx(c), dy = y - cy(r);
            if (dx * dx + dy * dy < (2 * R * 0.85) ** 2) { hit = true; break; }
          }
        }
        if (hit) break;
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
      ctx.setLineDash([]);
      // đích ngắm
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.arc(end[0], end[1], R * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake);
      ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220');
      bg.addColorStop(1, '#131c36');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (gg.grid[r][c]) drawBubble(cx(c), cy(r), gg.grid[r][c]);
        }
      }
      const lx = W / 2, ly = H - 24;
      if (!gg.fly) drawAim(gg);
      drawParticles(ctx, gg.particles);
      if (gg.fly) drawAmmo(gg.fly.x, gg.fly.y, gg.fly.color);
      drawAmmo(lx, ly, gg.cur);
      drawAmmo(W - 22, ly + 2, gg.next, R * 0.7);
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
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
        if (g().grid[r][c] !== color) continue;
        out.push([r, c]);
        stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
      }
      return out;
    };

    const removeFloating = () => {
      const gg = g();
      const keep = new Set();
      const stack = [];
      for (let c = 0; c < COLS; c += 1) if (gg.grid[0][c]) stack.push([0, c]);
      while (stack.length) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= MAXROWS || c < 0 || c >= COLS) continue;
        const k = `${r},${c}`;
        if (keep.has(k) || !gg.grid[r][c]) continue;
        keep.add(k);
        stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
      }
      const dropped = [];
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (gg.grid[r][c] && !keep.has(`${r},${c}`)) {
            dropped.push({ x: cx(c), y: cy(r), color: gg.grid[r][c] });
            gg.grid[r][c] = null;
          }
        }
      }
      return dropped;
    };

    const popCells = (cells) => {
      const gg = g();
      cells.forEach(({ r, c, color }) => {
        spawnBurst(gg.particles, cx(c), cy(r), [color, '#ffffff'], 12, { spread: 3.6, gravity: 0.06 });
        gg.grid[r][c] = null;
      });
    };

    const finishLose = () => {
      setStatusBoth('over');
      killMusic();
      if (curScore > best) setNewRecord(true); else playSound('lose');
    };

    const descendGrid = (gg) => {
      // đẩy cả lưới xuống 1 hàng, thêm hàng mới ở trên
      if (gg.grid[MAXROWS - 1].some(Boolean)) { finishLose(); return; }
      for (let r = MAXROWS - 1; r > 0; r -= 1) gg.grid[r] = gg.grid[r - 1];
      gg.grid[0] = Array.from({ length: COLS }, () => rndColor());
      addShake(gg.shake, 5);
    };

    const snapAndResolve = () => {
      const gg = g();
      const { x, y, color } = gg.fly;
      gg.fly = null;
      let col = clamp(Math.round((x - CELL / 2) / CELL), 0, COLS - 1);
      let row = clamp(Math.round((y - CELL / 2) / CELL), 0, MAXROWS - 1);

      // BOM: nổ tung vùng quanh điểm chạm
      if (color === 'bomb') {
        const cleared = [];
        for (let r = 0; r < MAXROWS; r += 1) for (let c = 0; c < COLS; c += 1) {
          if (gg.grid[r][c]) {
            const dr = r - row, dc = c - col;
            if (dr * dr + dc * dc <= 2.4 * 2.4) cleared.push({ r, c, color: gg.grid[r][c] });
          }
        }
        popCells(cleared);
        const dropped = removeFloating();
        popCells(dropped.map((d) => ({ r: Math.round((d.y - CELL / 2) / CELL), c: Math.round((d.x - CELL / 2) / CELL), color: d.color })));
        const gained = (cleared.length + dropped.length) * 10;
        curScore += gained; setScore(curScore); bumpBest();
        addShake(gg.shake, 10);
        playSound('explode');
        if (gained > 0) spawnFloater(gg.floaters, cx(col), cy(row), `+${gained}`, '#fb923c', { size: 18 });
        afterShot(gg);
        return;
      }

      // tìm ô trống để đặt
      if (gg.grid[row][col]) {
        const cand = [[row + 1, col], [row - 1, col], [row, col - 1], [row, col + 1], [row + 1, col - 1], [row + 1, col + 1]];
        let done = false;
        for (const [rr, ccc] of cand) {
          if (rr >= 0 && rr < MAXROWS && ccc >= 0 && ccc < COLS && !gg.grid[rr][ccc]) { row = rr; col = ccc; done = true; break; }
        }
        if (!done) {
          outer: for (let rr = 0; rr < MAXROWS; rr += 1) {
            for (let ccc = 0; ccc < COLS; ccc += 1) if (!gg.grid[rr][ccc]) { row = rr; col = ccc; break outer; }
          }
        }
      }

      // CẦU VỒNG: hóa thành màu cho cụm to nhất quanh nó
      let placeColor = color;
      if (color === 'rainbow') {
        let bestColor = rndColor(); let bestLen = -1;
        const neigh = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]];
        for (const [rr, cc] of neigh) {
          if (rr >= 0 && rr < MAXROWS && cc >= 0 && cc < COLS && gg.grid[rr][cc]) {
            gg.grid[row][col] = gg.grid[rr][cc];
            const len = clusterOf(row, col, gg.grid[rr][cc]).length;
            if (len > bestLen) { bestLen = len; bestColor = gg.grid[rr][cc]; }
            gg.grid[row][col] = null;
          }
        }
        placeColor = bestColor;
      }

      gg.grid[row][col] = placeColor;
      const cl = clusterOf(row, col, placeColor);
      if (cl.length >= 3) {
        popCells(cl.map(([r, c]) => ({ r, c, color: placeColor })));
        const dropped = removeFloating();
        popCells(dropped.map((d) => ({ r: Math.round((d.y - CELL / 2) / CELL), c: Math.round((d.x - CELL / 2) / CELL), color: d.color })));
        gg.combo += 1;
        const base = (cl.length + dropped.length) * 10;
        const gained = base + (gg.combo >= 2 ? gg.combo * 5 : 0);
        curScore += gained; setScore(curScore); bumpBest();
        playSound('break');
        if (gg.combo >= 2) { playSound('combo', gg.combo); spawnFloater(gg.floaters, cx(col), cy(row), `Combo x${gg.combo} +${gained}`, '#f0abfc', { size: 15 }); }
        else spawnFloater(gg.floaters, cx(col), cy(row), `+${gained}`, '#fde047', { size: 16 });
      } else {
        gg.combo = 0;
        playSound('pop');
      }

      // hết bóng -> nạp lưới mới
      if (gg.grid.every((rr) => rr.every((c) => !c))) {
        for (let r = 0; r < START_ROWS; r += 1) for (let c = 0; c < COLS; c += 1) gg.grid[r][c] = rndColor();
        playSound('levelup');
      }

      // thua nếu bóng chạm quá thấp
      let maxRow = -1;
      for (let r = 0; r < MAXROWS; r += 1) for (let c = 0; c < COLS; c += 1) if (gg.grid[r][c]) maxRow = r;
      if (maxRow >= MAXROWS - 1) { finishLose(); return; }

      afterShot(gg);
    };

    const afterShot = (gg) => {
      gg.shots += 1;
      if (gg.shots % DROP_EVERY === 0) { descendGrid(gg); if (statusRef.current === 'over') return; }
      gg.cur = gg.next;
      gg.next = rndAmmo();
    };

    const update = () => {
      const gg = g();
      stepParticles(gg.particles);
      stepFloaters(gg.floaters);
      if (!gg.fly) return;
      gg.fly.x += gg.fly.vx;
      gg.fly.y += gg.fly.vy;
      if (gg.fly.x < R) { gg.fly.x = R; gg.fly.vx = Math.abs(gg.fly.vx); }
      if (gg.fly.x > W - R) { gg.fly.x = W - R; gg.fly.vx = -Math.abs(gg.fly.vx); }
      if (gg.fly.y <= R) { snapAndResolve(); return; }
      for (let r = 0; r < MAXROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (!gg.grid[r][c]) continue;
          const dx = gg.fly.x - cx(c);
          const dy = gg.fly.y - cy(r);
          if (dx * dx + dy * dy < (2 * R * 0.85) ** 2) { snapAndResolve(); return; }
        }
      }
    };

    const loop = () => {
      if (statusRef.current === 'playing') update();
      else { stepParticles(g().particles); stepFloaters(g().floaters); }
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw();
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ngắm bằng THANH KÉO BÊN DƯỚI (không ngắm trên sân để tay không che bóng).
  // Vị trí ngón trên thanh -> góc bắn: trái = ngắm trái, giữa = thẳng lên, phải = ngắm phải.
  const setAimFromX = (clientX) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const f = clamp((clientX - rect.left) / rect.width, 0, 1);
    setAimF(f);
    const ang = -Math.PI + 0.25 + f * (Math.PI - 0.5);
    if (gRef.current) gRef.current.angle = ang;
  };
  const shoot = () => {
    const g = gRef.current;
    if (g.fly || statusRef.current !== 'playing') return;
    ensureMusic();
    g.fly = { x: W / 2, y: H - 24, vx: Math.cos(g.angle) * SPEED, vy: Math.sin(g.angle) * SPEED, color: g.cur };
  };
  const aimDown = (e) => { draggingRef.current = true; setAimFromX(e.clientX); };
  const aimMove = (e) => { if (draggingRef.current) setAimFromX(e.clientX); };
  const aimUp = (e) => { if (draggingRef.current) { setAimFromX(e.clientX); shoot(); } draggingRef.current = false; };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🫧 Bắn bong bóng</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Kéo <b>thanh bên dưới</b> để ngắm (có đường phản xạ tường hiện trên sân), thả tay để bắn — tay không che bóng. Gộp 3+ bóng cùng màu để nổ!</p>
            <ul className="space-y-0.5">
              <li><span style={emojiFont}>💣</span> <b>Bom</b> — nổ tung cả vùng xung quanh</li>
              <li><span style={emojiFont}>🌈</span> <b>Cầu vồng</b> — ăn được mọi màu</li>
            </ul>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
            <Trophy size={15} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-3 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-xl font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
        </div>

        {/* Thanh ngắm bên dưới — kéo qua lại để chỉnh hướng, thả để bắn (tay không che sân) */}
        <div
          ref={barRef}
          onPointerDown={aimDown}
          onPointerMove={aimMove}
          onPointerUp={aimUp}
          onPointerCancel={aimUp}
          className="relative mt-1 flex h-16 w-full max-w-[420px] shrink-0 touch-none select-none items-center justify-center rounded-2xl bg-cyan-400/15"
        >
          <span className="pointer-events-none text-xs font-black text-cyan-100/70">🎯 Kéo qua lại để ngắm · thả để bắn</span>
          <div
            className="pointer-events-none absolute bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow"
            style={{ left: `${aimF * 100}%` }}
          />
        </div>
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
