import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Shield, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake } from './gameFx';
import { useScoreRewards } from './gameRewards';

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

// --- Độ khó tăng dần theo điểm ---
// Khe hẹp lại từ từ (nhưng không dưới GAP_MIN) và ống trôi nhanh hơn chút.
const GAP_MIN = 92;
const SPEED_MAX = 3.4;
const gapForScore = (s) => Math.max(GAP_MIN, GAP_H - Math.floor(s / 4) * 4);
const speedForScore = (s) => Math.min(SPEED_MAX, PIPE_SPEED + s * 0.03);

const makePipe = (x, gap = GAP_H) => {
  const gapY = rand(46, H - GROUND_H - gap - 46);
  return {
    x,
    gapY,
    gap, // mỗi ống nhớ khe riêng để độ khó thay đổi mượt
    passed: false,
    coin: Math.random() < 0.55 ? { x: x + PIPE_W / 2, y: gapY + gap / 2, taken: false } : null,
  };
};

// Huy chương theo điểm cuối màn (đồng / bạc / vàng).
const medalForScore = (s) => {
  if (s >= 30) return { emoji: '🥇', label: 'Huy chương Vàng', color: 'text-amber-500' };
  if (s >= 15) return { emoji: '🥈', label: 'Huy chương Bạc', color: 'text-slate-400' };
  if (s >= 6) return { emoji: '🥉', label: 'Huy chương Đồng', color: 'text-orange-700' };
  return null;
};

export default function FlappyApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const musicRef = useRef(false); // đã bật nhạc nền chưa
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
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
      particles: [], // mảnh vỡ / tia lửa
      floaters: [],  // số điểm bay lên
      shake: makeShake(),
      frame: 0,
      nextShieldAt: Math.round(rand(SHIELD_EVERY * 0.6, SHIELD_EVERY * 1.4)),
      invuln: 0,
    };
    shieldRef.current = 0;
    musicRef.current = false; // cho phép nhạc bật lại ở ván mới
    setShields(0);
    setScore(0);
    setNewRecord(false);
    setStatusBoth('ready');
  };

  // Bật nhạc nền lần tương tác đầu tiên (chính sách autoplay của trình duyệt).
  const ensureMusic = () => {
    if (musicRef.current) return;
    musicRef.current = true;
    startMusic('arcade');
  };

  const flap = () => {
    if (statusRef.current === 'over') return;
    const g = gRef.current;
    if (!g) return;
    ensureMusic();
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
      ctx.save();
      const [ox, oy] = applyShake(g.shake);
      ctx.translate(ox, oy);
      // trời (phủ rộng hơn khung để lúc rung không lộ mép)
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7dd3fc');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(-16, -16, W + 32, H + 32);

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
        const bottomY = p.gapY + p.gap;
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

      // đất (phủ rộng hơn để lúc rung không lộ mép)
      ctx.fillStyle = '#a16207';
      ctx.fillRect(-16, H - GROUND_H, W + 32, GROUND_H + 16);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-16, H - GROUND_H, W + 32, 6);

      drawBirdEmoji(g);

      // particle & số điểm bay lên vẽ sau cùng
      drawParticles(ctx, g.particles);
      drawFloaters(ctx, g.floaters);

      if (statusRef.current === 'ready') {
        ctx.fillStyle = 'rgba(15,23,42,0.55)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chạm để bay 👆', W / 2, H / 2 - 60);
      }

      ctx.restore();
    };

    const endGame = (g) => {
      setStatusBoth('over');
      // nổ tung tại chỗ chim va + rung mạnh
      spawnBurst(g.particles, BIRD_X, g.bird.y, ['#f97316', '#fde047', '#ffffff'], 22, { spread: 5 });
      addShake(g.shake, 14);
      playSound('explode');
      killMusic();
      musicRef.current = false;
      if (curScore > bestRef.current) {
        setBest(curScore);
        bestRef.current = curScore;
        try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ }
        setNewRecord(true);
      } else {
        playSound('lose');
      }
    };

    const hitObstacle = (g) => {
      if (g.invuln > 0) return;
      if (shieldRef.current > 0) {
        shieldRef.current -= 1;
        setShields(shieldRef.current);
        g.invuln = INVULN_FRAMES;
        g.bird.vy = FLAP_VY * 0.7;
        // mất khiên: tia sáng xanh + rung nhẹ
        spawnBurst(g.particles, BIRD_X, g.bird.y, ['#38bdf8', '#ffffff'], 14, { spread: 4 });
        addShake(g.shake, 8);
        playSound('hit');
      } else {
        endGame(g);
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

      // tốc độ trôi tăng dần theo điểm
      const speed = speedForScore(curScore);

      // ống di chuyển + sinh ống mới (khe hẹp dần theo điểm)
      g.pipes.forEach((p) => { p.x -= speed; });
      if (g.pipes.length === 0 || W - g.pipes[g.pipes.length - 1].x >= PIPE_EVERY) {
        g.pipes.push(makePipe(W + 20, gapForScore(curScore)));
      }
      g.pipes = g.pipes.filter((p) => p.x + PIPE_W > -10);

      // bong bóng khiên di chuyển + sinh mới
      g.floats.forEach((f) => { f.x -= speed; });
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
          const hitsBottom = g.bird.y + BIRD_R > p.gapY + p.gap;
          if (hitsTop || hitsBottom) hitObstacle(g);
        }
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          curScore += 1;
          setScore(curScore);
          // vượt ống ghi điểm: âm "coin" + số +1 lấp lánh tại chim
          playSound('coin');
          spawnFloater(g.floaters, BIRD_X, g.bird.y - BIRD_R - 6, '+1', '#fde047', { size: 18 });
          spawnBurst(g.particles, BIRD_X, g.bird.y, ['#fde047', '#ffffff'], 6, { spread: 2.6 });
        }
        if (p.coin && !p.coin.taken) {
          const dx = p.coin.x - BIRD_X;
          const dy = p.coin.y - g.bird.y;
          if (Math.sqrt(dx * dx + dy * dy) < BIRD_R + 10) {
            p.coin.taken = true;
            curScore += 3;
            setScore(curScore);
            playSound('correct');
            spawnFloater(g.floaters, p.coin.x, p.coin.y - 8, '+3', '#facc15', { size: 20 });
            spawnBurst(g.particles, p.coin.x, p.coin.y, ['#facc15', '#fff7ae', '#ffffff'], 14, { spread: 4 });
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
          playSound('powerup');
          spawnFloater(g.floaters, f.x, f.y - 8, 'Khiên!', '#7dd3fc', { size: 15 });
          spawnBurst(g.particles, f.x, f.y, ['#38bdf8', '#bae6fd', '#ffffff'], 14, { spread: 4 });
        }
      });

      // cập nhật hiệu ứng
      stepParticles(g.particles);
      stepFloaters(g.floaters);
    };

    const loop = () => {
      const g = gRef.current;
      if (statusRef.current !== 'over') update();
      else if (g) { stepParticles(g.particles); stepFloaters(g.floaters); } // vẫn chạy hiệu ứng nổ khi kết thúc
      draw();
      raf = requestAnimationFrame(loop);
    };
    draw();
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); };
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
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm màn hình hoặc bấm Space / ↑ để bay
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-3">
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
            onPointerDown={flap}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
        </div>

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
              {(() => {
                const medal = medalForScore(score);
                if (!medal) return null;
                return (
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2">
                    <span className="text-3xl">{medal.emoji}</span>
                    <span className={`text-sm font-black ${medal.color}`}>{medal.label}</span>
                  </div>
                );
              })()}
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
