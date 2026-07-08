import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Shield } from 'lucide-react';
import { playSound, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';

// --- GAME: CHIM BAY (Flappy Bird kiểu dễ cho bé) ---
// Chạm / click / Space / mũi tên lên để vỗ cánh, bay qua khe giữa các ống.
// Nhặt sao ⭐ để +3 điểm, nhặt khiên 🛡️ để được "cứu" 1 lần khi va chạm.

const W = 320;
const H = 440;
const BEST_KEY = 'game_flappy_best';

const GROUND_H = 24;
const BIRD_X = 70;
const BIRD_R = 14;
const GRAVITY = 0.35;
const FLAP_VY = -6.2;
const PIPE_SPEED = 2.2;
const PIPE_W = 46;
const GAP_H = 120;
const PIPE_EVERY = 95; // số frame giữa 2 ống
const SHIELD_EVERY = 420; // số frame trung bình giữa 2 bong bóng khiên
const MAX_SHIELD = 3;
const INVULN_FRAMES = 45;

const rand = (min, max) => min + Math.random() * (max - min);

const makePipe = (x) => {
  const gapY = rand(46, H - GROUND_H - GAP_H - 46);
  return {
    x,
    gapY,
    passed: false,
    coin: Math.random() < 0.55 ? { x: x + PIPE_W / 2, y: gapY + GAP_H / 2, taken: false } : null,
  };
};

export default function FlappyApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('ready'); // ready | playing | over
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [shields, setShields] = useState(0);
  const statusRef = useRef('ready');
  const bestRef = useRef(best);
  const shieldRef = useRef(0);
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };

  useEffect(() => { bestRef.current = best; }, [best]);

  const newGame = () => {
    gRef.current = {
      bird: { y: H / 2, vy: 0 },
      pipes: [makePipe(W + 60)],
      floats: [], // bong bóng khiên
      frame: 0,
      nextShieldAt: Math.round(rand(SHIELD_EVERY * 0.6, SHIELD_EVERY * 1.4)),
      invuln: 0,
    };
    shieldRef.current = 0;
    setShields(0);
    setScore(0);
    setNewRecord(false);
    setStatusBoth('ready');
  };

  const flap = () => {
    if (statusRef.current === 'over') return;
    const g = gRef.current;
    if (!g) return;
    if (statusRef.current === 'ready') setStatusBoth('playing');
    g.bird.vy = FLAP_VY;
    playSound('pop');
  };

  useEffect(() => {
    newGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let curScore = 0;

    const drawBirdEmoji = (g) => {
      ctx.save();
      ctx.font = `28px ${emojiFont.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const angle = Math.max(-0.4, Math.min(0.9, g.bird.vy * 0.08));
      ctx.translate(BIRD_X, g.bird.y);
      ctx.rotate(angle);
      if (g.invuln > 0 && g.invuln % 10 < 5) ctx.globalAlpha = 0.4;
      ctx.fillText('🐤', 0, 1);
      ctx.restore();
    };

    const draw = () => {
      const g = gRef.current;
      // trời
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7dd3fc');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // mây trang trí
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      [[50, 60, 18], [230, 40, 14], [150, 100, 12]].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.9, cy + 4, r * 0.7, 0, Math.PI * 2);
        ctx.arc(cx - r * 0.9, cy + 4, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      // ống
      g.pipes.forEach((p) => {
        ctx.fillStyle = '#4ade80';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        // ống trên
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.strokeRect(p.x, 0, PIPE_W, p.gapY);
        // ống dưới
        const bottomY = p.gapY + GAP_H;
        ctx.fillRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY);
        ctx.strokeRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY);

        if (p.coin && !p.coin.taken) {
          ctx.font = `22px ${emojiFont.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', p.coin.x, p.coin.y);
        }
      });

      // bong bóng khiên
      g.floats.forEach((f) => {
        if (f.taken) return;
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', f.x, f.y);
      });

      // đất
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, H - GROUND_H, W, 6);

      drawBirdEmoji(g);

      if (statusRef.current === 'ready') {
        ctx.fillStyle = 'rgba(15,23,42,0.55)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chạm để bay 👆', W / 2, H / 2 - 60);
      }
    };

    const endGame = () => {
      setStatusBoth('over');
      if (curScore > bestRef.current) {
        setBest(curScore);
        bestRef.current = curScore;
        try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ }
        setNewRecord(true);
      } else {
        playSound('wrong');
      }
    };

    const hitObstacle = (g) => {
      if (g.invuln > 0) return;
      if (shieldRef.current > 0) {
        shieldRef.current -= 1;
        setShields(shieldRef.current);
        g.invuln = INVULN_FRAMES;
        g.bird.vy = FLAP_VY * 0.7;
        playSound('correct');
      } else {
        endGame();
      }
    };

    const update = () => {
      const g = gRef.current;
      g.frame += 1;

      if (statusRef.current === 'ready') {
        g.bird.y = H / 2 + Math.sin(g.frame * 0.06) * 8;
        return;
      }

      if (g.invuln > 0) g.invuln -= 1;

      // vật lý chim
      g.bird.vy += GRAVITY;
      g.bird.y += g.bird.vy;

      // trần / đất
      if (g.bird.y - BIRD_R <= 0) {
        g.bird.y = BIRD_R;
        g.bird.vy = 0;
        hitObstacle(g);
      }
      if (g.bird.y + BIRD_R >= H - GROUND_H) {
        g.bird.y = H - GROUND_H - BIRD_R;
        g.bird.vy = 0;
        hitObstacle(g);
      }

      // ống di chuyển + sinh ống mới
      g.pipes.forEach((p) => { p.x -= PIPE_SPEED; });
      if (g.pipes.length === 0 || W - g.pipes[g.pipes.length - 1].x >= PIPE_EVERY) {
        g.pipes.push(makePipe(W + 20));
      }
      g.pipes = g.pipes.filter((p) => p.x + PIPE_W > -10);

      // bong bóng khiên di chuyển + sinh mới
      g.floats.forEach((f) => { f.x -= PIPE_SPEED; });
      g.floats = g.floats.filter((f) => f.x > -20 && !f.taken);
      if (g.frame >= g.nextShieldAt && shieldRef.current < MAX_SHIELD) {
        g.floats.push({ x: W + 20, y: rand(60, H - GROUND_H - 60), taken: false });
        g.nextShieldAt = g.frame + Math.round(rand(SHIELD_EVERY * 0.6, SHIELD_EVERY * 1.4));
      }

      // va chạm ống + tính điểm + qua ống
      g.pipes.forEach((p) => {
        const withinX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
        if (withinX) {
          const hitsTop = g.bird.y - BIRD_R < p.gapY;
          const hitsBottom = g.bird.y + BIRD_R > p.gapY + GAP_H;
          if (hitsTop || hitsBottom) hitObstacle(g);
        }
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          curScore += 1;
          setScore(curScore);
        }
        if (p.coin && !p.coin.taken) {
          const dx = p.coin.x - BIRD_X;
          const dy = p.coin.y - g.bird.y;
          if (Math.sqrt(dx * dx + dy * dy) < BIRD_R + 10) {
            p.coin.taken = true;
            curScore += 3;
            setScore(curScore);
            playSound('correct');
          }
        }
      });

      // nhặt khiên
      g.floats.forEach((f) => {
        if (f.taken) return;
        const dx = f.x - BIRD_X;
        const dy = f.y - g.bird.y;
        if (Math.sqrt(dx * dx + dy * dy) < BIRD_R + 10) {
          f.taken = true;
          if (shieldRef.current < MAX_SHIELD) {
            shieldRef.current += 1;
            setShields(shieldRef.current);
          }
          playSound('correct');
        }
      });
    };

    const loop = () => {
      if (statusRef.current !== 'over') update();
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
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🐤 Chim bay</h1>
        <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-sky-400/15 px-5 py-1.5 text-center">
            <Shield size={16} className="text-sky-300" />
            <div className="text-xl font-black text-sky-200">{shields}</div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={flap}
          className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
          style={{ width: 'min(84vw, 320px)', height: 'auto', display: 'block' }}
        />
        <p className="text-xs font-bold text-white/40">Chạm màn hình hoặc bấm Space / ↑ để bay</p>

        {status === 'over' && newRecord && <Fireworks />}
        {status === 'over' && (
          <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
            <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
              <div className="text-4xl">{newRecord ? '🏆' : '🐤'}</div>
              <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Va vào ống rồi!'}</h2>
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
    </div>
  );
}
