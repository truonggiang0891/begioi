import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';

// --- GAME: BẮN PHÁO (Ném bóng theo đường bay có trọng lực) ---
// Kéo để ngắm góc + lực, thả để bắn bóng trúng mục tiêu. Trượt 3 lần -> thua.

const W = 340;
const H = 440;
const GRAV = 0.18;
const BALL_R = 9;
const TARGET_R = 20;
const CX = 34;
const CY = H - 30;
const BEST_KEY = 'game_cannon_best';

const randTarget = () => ({
  x: 150 + Math.random() * (W - 190),
  y: 70 + Math.random() * (H - 200),
  r: TARGET_R,
});

export default function CannonApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };

  const newGame = () => {
    gRef.current = { ball: null, target: randTarget(), aim: null };
    setScore(0);
    setLives(3);
    setNewRecord(false);
    setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let curScore = 0;
    let curLives = 3;

    const draw = () => {
      const g = gRef.current;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);
      // đất
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, H - 14, W, 14);
      // mục tiêu (bóng bay đích)
      ctx.beginPath();
      ctx.fillStyle = '#f472b6';
      ctx.arc(g.target.x, g.target.y, g.target.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.arc(g.target.x - 6, g.target.y - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(g.target.x, g.target.y + g.target.r);
      ctx.lineTo(g.target.x, g.target.y + g.target.r + 12);
      ctx.stroke();
      // đại bác
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(CX, CY, 16, 0, Math.PI * 2);
      ctx.fill();
      // đường ngắm
      if (g.aim) {
        ctx.strokeStyle = 'rgba(253,224,71,0.6)';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(g.aim.x, g.aim.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // bóng
      if (g.ball) {
        ctx.beginPath();
        ctx.fillStyle = '#fde047';
        ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const update = () => {
      const g = gRef.current;
      if (!g.ball) return;
      g.ball.x += g.ball.vx;
      g.ball.y += g.ball.vy;
      g.ball.vy += GRAV;

      // trúng mục tiêu?
      const dx = g.ball.x - g.target.x;
      const dy = g.ball.y - g.target.y;
      if (dx * dx + dy * dy < (g.target.r + BALL_R) ** 2) {
        curScore += 1;
        setScore(curScore);
        if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
        playSound('correct');
        g.ball = null;
        g.target = randTarget();
        return;
      }
      // trượt (ra ngoài / chạm đất)
      if (g.ball.x > W + 20 || g.ball.x < -20 || g.ball.y > H - 14) {
        g.ball = null;
        curLives -= 1;
        setLives(curLives);
        playSound('wrong');
        if (curLives <= 0) {
          setOverBoth(true);
          if (curScore > best) setNewRecord(true);
        }
      }
    };

    const loop = () => {
      if (!overRef.current) update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toLocal = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width * W,
      y: (e.clientY - rect.top) / rect.height * H,
    };
  };
  const onPointerDown = (e) => {
    const g = gRef.current;
    if (g.ball || overRef.current) return;
    g.aim = toLocal(e);
  };
  const onPointerMove = (e) => {
    const g = gRef.current;
    if (!g.aim) return;
    g.aim = toLocal(e);
  };
  const onPointerUp = (e) => {
    const g = gRef.current;
    if (!g.aim || g.ball || overRef.current) { if (g) g.aim = null; return; }
    const p = toLocal(e);
    const vx = (p.x - CX) * 0.15;
    const vy = (p.y - CY) * 0.15;
    // giới hạn lực
    const sp = Math.hypot(vx, vy);
    const max = 15;
    const k = sp > max ? max / sp : 1;
    g.ball = { x: CX, y: CY, vx: vx * k, vy: vy * k };
    g.aim = null;
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">💥 Bắn pháo</h1>
        <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
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
        <p className="shrink-0 text-xs font-bold text-white/40">Kéo từ khẩu pháo để ngắm · thả để bắn</p>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '💥'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết lượt rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé bắn trúng <span className="text-orange-500">{score}</span>
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
