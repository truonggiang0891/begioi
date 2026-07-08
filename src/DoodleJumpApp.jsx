import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, ArrowLeft, ArrowRight, Trophy, Rocket } from 'lucide-react';
import { playSound, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';
import GameHelp from './GameHelp';

// --- GAME: NHẢY CAO (kiểu Doodle Jump) ---
// Nhân vật tự nảy lên nhờ trọng lực + bệ đỡ. Bé lái trái/phải để nhân vật rơi
// trúng các bệ, càng lên cao càng nhiều điểm. Có lò xo (nảy siêu cao), sao
// (cộng điểm) và ba lô phản lực (bay thẳng lên một lúc không cần bệ).

const W = 320;
const H = 460;
const BEST_KEY = 'game_doodle_best';

const GRAVITY = 0.32;
const MAX_FALL = 9;
const BOUNCE_VY = -9.5;
const SPRING_VY = -16;
const JETPACK_VY = -7.5;
const JETPACK_FRAMES = 90; // ~1.5s ở 60fps

const PLAYER_W = 30;
const PLAYER_H = 32;
const PLAT_W = 58;
const PLAT_H = 12;
const MOVE_SPEED = 3.6;
const SCROLL_Y = H * 0.42;

const rand = (min, max) => min + Math.random() * (max - min);

export default function DoodleJumpApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const moveRef = useRef(0); // -1 trái, 1 phải, 0 đứng yên
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [status, setStatus] = useState('playing'); // playing | over
  const [newRecord, setNewRecord] = useState(false);
  const [starsCollected, setStarsCollected] = useState(0);
  const [jetpackLeft, setJetpackLeft] = useState(0); // giây còn lại (hiển thị HUD)
  const statusRef = useRef('playing');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };

  // Sinh một bệ mới phía trên bệ cao nhất hiện có.
  const spawnPlatform = (g, fromY, difficulty) => {
    const y = fromY - rand(52, 78);
    const x = rand(0, W - PLAT_W);
    const movingChance = Math.min(0.32, 0.08 + difficulty / 3000);
    const isMoving = difficulty > 150 && Math.random() < movingChance;
    const isSpring = !isMoving && Math.random() < 0.14;
    g.platforms.push({
      x, y, w: PLAT_W, h: PLAT_H,
      moving: isMoving,
      vx: isMoving ? (Math.random() < 0.5 ? -1 : 1) * rand(1, 1 + Math.min(2, difficulty / 900)) : 0,
      spring: isSpring,
    });
    // Sao trôi nổi giữa 2 bệ.
    if (Math.random() < 0.35) {
      g.stars.push({ x: rand(16, W - 16), y: fromY - rand(18, 45), taken: false });
    }
    // Ba lô phản lực hiếm.
    if (difficulty > 200 && !g.jetpacks.some((j) => !j.taken) && Math.random() < 0.035) {
      g.jetpacks.push({ x: rand(16, W - 16), y: y - rand(10, 30), taken: false });
    }
    return y;
  };

  const newGame = () => {
    const startPlatY = H - 46;
    const g = {
      player: {
        x: W / 2 - PLAYER_W / 2,
        y: startPlatY - PLAYER_H,
        vy: 0,
        prevBottom: startPlatY,
      },
      platforms: [{ x: W / 2 - PLAT_W / 2, y: startPlatY, w: PLAT_W, h: PLAT_H, moving: false, vx: 0, spring: false }],
      stars: [],
      jetpacks: [],
      jetpackFrames: 0,
      distance: 0,
      frame: 0,
    };
    let topY = startPlatY;
    while (topY > -60) {
      topY = spawnPlatform(g, topY, 0);
    }
    gRef.current = g;
    setScore(0);
    setStarsCollected(0);
    setJetpackLeft(0);
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
      // bầu trời
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7dd3fc');
      sky.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // mây trang trí (song song thị sai theo khoảng cách đã leo)
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 4; i += 1) {
        const cy = ((i * 140 - g.distance * 0.3) % (H + 160) + (H + 160)) % (H + 160) - 80;
        ctx.fillText('☁️', 40 + i * 80, cy);
      }
      ctx.globalAlpha = 1;

      // bệ
      g.platforms.forEach((p) => {
        ctx.fillStyle = p.spring ? '#c084fc' : p.moving ? '#fb923c' : '#4ade80';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 3);
        if (p.spring) {
          ctx.font = '20px sans-serif';
          ctx.fillStyle = '#111';
          ctx.fillText('🌀', p.x + p.w / 2, p.y - 6);
        }
      });

      // sao
      ctx.font = '22px sans-serif';
      g.stars.forEach((s) => { if (!s.taken) ctx.fillText('⭐', s.x, s.y); });

      // ba lô phản lực
      ctx.font = '24px sans-serif';
      g.jetpacks.forEach((j) => { if (!j.taken) ctx.fillText('🚀', j.x, j.y); });

      // nhân vật
      ctx.font = `${PLAYER_H}px ${emojiFont.fontFamily}`;
      ctx.fillText(g.jetpackFrames > 0 ? '🚀' : '🦘', g.player.x + PLAYER_W / 2, g.player.y + PLAYER_H / 2);
    };

    const update = () => {
      const g = gRef.current;
      g.frame += 1;
      const p = g.player;

      // di chuyển trái/phải + quấn vòng
      p.x += moveRef.current * MOVE_SPEED;
      if (p.x + PLAYER_W < 0) p.x = W;
      else if (p.x > W) p.x = -PLAYER_W;

      const prevBottom = p.y + PLAYER_H;

      // trọng lực hoặc ba lô phản lực
      if (g.jetpackFrames > 0) {
        g.jetpackFrames -= 1;
        p.vy = JETPACK_VY;
        if (g.frame % 6 === 0 || g.jetpackFrames === 0) {
          setJetpackLeft(Math.max(0, Math.round((g.jetpackFrames / 60) * 10) / 10));
        }
      } else {
        p.vy = Math.min(MAX_FALL, p.vy + GRAVITY);
      }
      p.y += p.vy;

      // bệ di chuyển ngang
      g.platforms.forEach((plat) => {
        if (plat.moving) {
          plat.x += plat.vx;
          if (plat.x <= 0) { plat.x = 0; plat.vx = Math.abs(plat.vx); }
          else if (plat.x + plat.w >= W) { plat.x = W - plat.w; plat.vx = -Math.abs(plat.vx); }
        }
      });

      // va chạm bệ (chỉ khi đang rơi xuống)
      if (p.vy > 0) {
        for (const plat of g.platforms) {
          const bottom = p.y + PLAYER_H;
          if (
            prevBottom <= plat.y + 6 &&
            bottom >= plat.y &&
            bottom <= plat.y + plat.h + 10 &&
            p.x + PLAYER_W > plat.x + 4 &&
            p.x < plat.x + plat.w - 4
          ) {
            p.vy = plat.spring ? SPRING_VY : BOUNCE_VY;
            playSound(plat.spring ? 'correct' : 'pop');
            break;
          }
        }
      }

      // ăn sao
      g.stars.forEach((s) => {
        if (!s.taken && Math.abs((p.x + PLAYER_W / 2) - s.x) < 22 && Math.abs((p.y + PLAYER_H / 2) - s.y) < 22) {
          s.taken = true;
          curScore += 5;
          setScore(curScore);
          setStarsCollected((n) => n + 1);
          playSound('correct');
          if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
        }
      });

      // nhặt ba lô phản lực
      g.jetpacks.forEach((j) => {
        if (!j.taken && Math.abs((p.x + PLAYER_W / 2) - j.x) < 24 && Math.abs((p.y + PLAYER_H / 2) - j.y) < 24) {
          j.taken = true;
          g.jetpackFrames = JETPACK_FRAMES;
          setJetpackLeft(Math.round((JETPACK_FRAMES / 60) * 10) / 10);
          playSound('win');
        }
      });

      // cuộn thế giới xuống khi nhân vật lên quá nửa màn hình
      if (p.y < SCROLL_Y) {
        const scrollAmt = SCROLL_Y - p.y;
        p.y = SCROLL_Y;
        g.platforms.forEach((plat) => { plat.y += scrollAmt; });
        g.stars.forEach((s) => { s.y += scrollAmt; });
        g.jetpacks.forEach((j) => { j.y += scrollAmt; });
        g.distance += scrollAmt;
        curScore += Math.round(scrollAmt / 4);
        setScore(curScore);
        if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
      }

      // dọn dẹp & sinh thêm bệ/vật phẩm phía trên
      g.platforms = g.platforms.filter((plat) => plat.y < H + 20);
      g.stars = g.stars.filter((s) => s.y < H + 20 && !s.taken);
      g.jetpacks = g.jetpacks.filter((j) => j.y < H + 20 && !j.taken);
      let topY = g.platforms.length ? Math.min(...g.platforms.map((plat) => plat.y)) : 0;
      while (topY > -60) {
        topY = spawnPlatform(g, topY, curScore);
      }

      // rơi khỏi màn hình -> thua
      if (p.y > H + PLAYER_H) {
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

  // kéo trên canvas để lái nhân vật trực tiếp
  const onPointerMove = (e) => {
    if (!(e.buttons || e.pointerType === 'touch')) return;
    const g = gRef.current;
    if (!g) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    g.player.x = x - PLAYER_W / 2;
  };

  const hold = (v) => ({ onPointerDown: () => { moveRef.current = v; }, onPointerUp: () => { moveRef.current = 0; }, onPointerLeave: () => { moveRef.current = 0; } });

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🦘 Nhảy cao</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Giữ nút, gõ phím ← → hoặc kéo trên màn hình để lái
          </GameHelp>
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div className="text-xl font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-yellow-300/15 px-4 py-1.5 text-center">
            <span className="text-base">⭐</span>
            <div className="text-lg font-black text-yellow-300">{starsCollected}</div>
          </div>
          {jetpackLeft > 0 && (
            <div className="flex items-center gap-1.5 rounded-2xl bg-sky-400/20 px-4 py-1.5 text-center">
              <Rocket size={16} className="text-sky-300" />
              <div className="text-lg font-black text-sky-300">{jetpackLeft.toFixed(1)}s</div>
            </div>
          )}
        </div>

        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerMove={onPointerMove}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button type="button" aria-label="Trái" {...hold(-1)}
            className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowLeft size={28} />
          </button>
          <button type="button" aria-label="Phải" {...hold(1)}
            className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowRight size={28} />
          </button>
        </div>

        {status === 'over' && newRecord && <Fireworks />}
        {status === 'over' && (
          <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
            <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
              <div className="text-4xl">{newRecord ? '🏆' : '🦘'}</div>
              <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Rơi mất rồi!'}</h2>
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
