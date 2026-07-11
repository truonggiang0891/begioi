import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, ArrowLeft, ArrowRight, Trophy, Heart, Gem } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import { SoundToggle, SkillHUD, SkillToast } from './gameUI';
import { SKILLS, skillMeta, randomSkill } from './gameSkills';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake , setupCanvas } from './gameFx';
import { useScoreRewards } from './gameRewards';
import { useFitSize } from './useFitSize';

// --- GAME: BẮN GẠCH (Shooter kiểu Space Invaders) ---
// Lái phi thuyền trái/phải, tự động bắn đạn lên phá các khối gạch đang trôi xuống.
// Nâng cấp: 3 mạng, particle + số điểm bay lên, combo, powerup rơi (bắn nhanh, 3 tia,
// khiên, +điểm, +mạng, chậm), nhạc nền, screen-shake.

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
const MAX_LIVES = 5;

const DROP_IDS = ['rapid', 'triple', 'shield', 'points', 'life', 'slow'];
const DROP_WEIGHTS = { points: 5, rapid: 4, triple: 3, slow: 3, shield: 2, life: 1 };
const DROP_CHANCE = 0.14;
const sec = (ms) => Math.round((ms / 1000) * 60);

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

export default function ShooterApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('playing'); // playing | over
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [hud, setHud] = useState([]);
  const [skillToast, setSkillToast] = useState(null);
  const statusRef = useRef('playing');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };
  const moveRef = useRef(0); // -1 trái, 1 phải, 0 đứng
  const steerRef = useRef(null);
  const musicRef = useRef(false);

  const ensureMusic = () => {
    if (musicRef.current) return;
    musicRef.current = true;
    startMusic('arcade');
  };

  const newGame = () => {
    gRef.current = {
      ship: { x: W / 2 - SHIP_W / 2 },
      bullets: [],
      bricks: makeWave(3, 40),
      descend: 0.18,
      frame: 0,
      wave: 1,
      combo: 0,
      particles: [],
      floaters: [],
      drops: [],
      timers: {},
      timersMax: {},
      shake: makeShake(),
    };
    setScore(0);
    setLives(3);
    setNewRecord(false);
    setHud([]);
    setStatusBoth('playing');
  };

  useEffect(() => {
    newGame();
    const ctx = setupCanvas(canvasRef.current, W, H);
    let raf = 0;
    let curScore = 0;
    let curLives = 3;
    let hudTick = 0;
    const g = () => gRef.current;

    const bumpBest = () => {
      if (curScore > best) {
        setBest(curScore);
        try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ }
      }
    };
    const addScore = (n) => { curScore += n; setScore(curScore); bumpBest(); return n; };
    const setTimer = (id, ms) => { const f = sec(ms); g().timers[id] = f; g().timersMax[id] = f; };
    const showToast = (id) => setSkillToast({ id, key: `${id}-${curScore}-${g().drops.length}` });

    const applySkill = (id) => {
      const gg = g();
      playSound('powerup');
      showToast(id);
      if (id === 'life') { curLives = Math.min(MAX_LIVES, curLives + 1); setLives(curLives); }
      else if (id === 'points') {
        const gained = addScore(50);
        spawnFloater(gg.floaters, gg.ship.x + SHIP_W / 2, SHIP_Y - 14, `+${gained}`, '#fbbf24', { size: 20 });
      }
      else if (id === 'rapid') setTimer('rapid', SKILLS.rapid.dur);
      else if (id === 'triple') setTimer('laser', SKILLS.laser.dur); // dùng ô 'laser' làm 3-tia (icon riêng bên dưới)
      else if (id === 'shield') setTimer('shield', SKILLS.shield.dur);
      else if (id === 'slow') setTimer('slow', SKILLS.slow.dur);
    };

    const killBrick = (gg, b, bx, by) => {
      b.alive = false;
      spawnBurst(gg.particles, bx, by, [b.color, '#ffffff'], 13, { spread: 3.8 });
      const gained = addScore(10 + (gg.combo >= 3 ? gg.combo : 0));
      gg.combo += 1;
      playSound('break');
      if (gg.combo >= 3) {
        spawnFloater(gg.floaters, bx, by, `Combo x${gg.combo}`, '#f0abfc', { size: 14 });
        playSound('combo', gg.combo);
      } else {
        spawnFloater(gg.floaters, bx, by, `+${gained}`, '#fde047', { size: 13 });
      }
      if (Math.random() < DROP_CHANCE) {
        gg.drops.push({ x: bx, y: by, vy: 1.8, id: randomSkill(DROP_IDS, DROP_WEIGHTS) });
      }
    };

    const loseLife = (gg) => {
      curLives -= 1;
      setLives(curLives);
      addShake(gg.shake, 12);
      gg.combo = 0;
      if (curLives <= 0) {
        setStatusBoth('over');
        killMusic();
        if (curScore > best) setNewRecord(true); else playSound('lose');
      } else {
        playSound('lose');
        gg.bricks = makeWave(3, 30);
      }
    };

    const tickTimers = (gg) => {
      for (const id of Object.keys(gg.timers)) {
        gg.timers[id] -= 1;
        if (gg.timers[id] <= 0) { delete gg.timers[id]; delete gg.timersMax[id]; }
      }
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake);
      ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220');
      bg.addColorStop(1, '#111a33');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // gạch
      gg.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x, b.y, b.w, 4);
      });
      drawParticles(ctx, gg.particles);
      // đạn
      ctx.fillStyle = gg.timers.rapid > 0 ? '#facc15' : '#fde047';
      gg.bullets.forEach((bl) => ctx.fillRect(bl.x - 2, bl.y - 8, 4, 10));
      // phi thuyền (có quầng khiên nếu đang bật)
      if (gg.timers.shield > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56,189,248,0.8)';
        ctx.lineWidth = 2;
        ctx.arc(gg.ship.x + SHIP_W / 2, SHIP_Y + SHIP_H / 2, SHIP_W, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(gg.ship.x + SHIP_W / 2, SHIP_Y);
      ctx.lineTo(gg.ship.x, SHIP_Y + SHIP_H);
      ctx.lineTo(gg.ship.x + SHIP_W, SHIP_Y + SHIP_H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(gg.ship.x + SHIP_W / 2 - 3, SHIP_Y + 4, 6, 8);
      // drops
      gg.drops.forEach((d) => {
        const m = skillMeta(d.id);
        ctx.beginPath();
        ctx.fillStyle = m.color;
        ctx.globalAlpha = 0.9;
        ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = '15px "Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.emoji, d.x, d.y + 1);
      });
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
    };

    const update = () => {
      const gg = g();
      gg.frame += 1;
      const slow = gg.timers.slow > 0 ? 0.5 : 1;

      // di chuyển thuyền
      gg.ship.x = Math.max(0, Math.min(W - SHIP_W, gg.ship.x + moveRef.current * 4));

      // tự bắn (nhanh gấp đôi khi có 'rapid'; 3 tia khi có 'triple' -> ô 'laser')
      const fireEvery = gg.timers.rapid > 0 ? Math.round(FIRE_EVERY / 2) : FIRE_EVERY;
      if (gg.frame % fireEvery === 0) {
        const cx = gg.ship.x + SHIP_W / 2;
        if (gg.timers.laser > 0) {
          gg.bullets.push({ x: cx, y: SHIP_Y, dx: 0 });
          gg.bullets.push({ x: cx, y: SHIP_Y, dx: -1.6 });
          gg.bullets.push({ x: cx, y: SHIP_Y, dx: 1.6 });
        } else {
          gg.bullets.push({ x: cx, y: SHIP_Y, dx: 0 });
        }
      }
      // di chuyển đạn
      gg.bullets.forEach((bl) => { bl.y -= BULLET_SPEED; bl.x += bl.dx || 0; });
      gg.bullets = gg.bullets.filter((bl) => bl.y > -10 && bl.x > -10 && bl.x < W + 10);

      // gạch trôi xuống
      gg.bricks.forEach((b) => { if (b.alive) b.y += gg.descend * slow; });

      // đạn trúng gạch
      for (const bl of gg.bullets) {
        for (const b of gg.bricks) {
          if (b.alive && bl.x > b.x && bl.x < b.x + b.w && bl.y < b.y + b.h && bl.y > b.y) {
            bl.y = -100;
            killBrick(gg, b, b.x + b.w / 2, b.y + b.h / 2);
            break;
          }
        }
      }
      gg.bullets = gg.bullets.filter((bl) => bl.y > -10);

      // hết gạch -> đợt mới, khó hơn
      if (gg.bricks.every((b) => !b.alive)) {
        gg.descend += 0.06;
        gg.wave += 1;
        gg.bricks = makeWave(3, 30);
        spawnFloater(gg.floaters, W / 2, H / 3, `Đợt ${gg.wave}!`, '#67e8f9', { size: 22, decay: 0.014 });
        playSound('levelup');
      }

      // gạch chạm đáy?
      if (gg.bricks.some((b) => b.alive && b.y + b.h >= SHIP_Y)) {
        if (gg.timers.shield > 0) {
          // khiên đỡ: chỉ đẩy đợt mới, không mất mạng
          delete gg.timers.shield; delete gg.timersMax.shield;
          gg.bricks = makeWave(3, 30);
          addShake(gg.shake, 8);
          playSound('pop');
        } else {
          loseLife(gg);
        }
      }

      // drops rơi -> hứng bằng thuyền
      for (let di = gg.drops.length - 1; di >= 0; di -= 1) {
        const d = gg.drops[di];
        d.y += d.vy;
        if (d.y + 11 >= SHIP_Y && d.x >= gg.ship.x - 8 && d.x <= gg.ship.x + SHIP_W + 8) {
          applySkill(d.id); gg.drops.splice(di, 1);
        } else if (d.y - 12 > H) gg.drops.splice(di, 1);
      }

      tickTimers(gg);
      stepParticles(gg.particles);
      stepFloaters(gg.floaters);

      hudTick += 1;
      if (hudTick % 7 === 0) {
        const arr = Object.keys(gg.timers).map((id) => ({
          id: id === 'laser' ? 'laser' : id,
          remain: gg.timers[id] / (gg.timersMax[id] || 1),
        }));
        setHud(arr);
      }
    };

    const loop = () => {
      if (statusRef.current === 'playing') update();
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
      if (e.key === 'ArrowLeft') { moveRef.current = -1; ensureMusic(); }
      else if (e.key === 'ArrowRight') { moveRef.current = 1; ensureMusic(); }
    };
    const onKeyUp = (e) => {
      if ((e.key === 'ArrowLeft' && moveRef.current === -1) || (e.key === 'ArrowRight' && moveRef.current === 1)) {
        moveRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lái tương đối: kéo ngắn cũng đi được xa.
  const STEER_GAIN = 2.2;
  const steer = (e) => {
    const isDown = e.type === 'pointerdown';
    if (!isDown && !(e.pointerType === 'touch' || e.buttons)) return;
    const g = gRef.current; if (!g) return;
    if (isDown) ensureMusic();
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

  const hold = (v) => ({ onPointerDown: () => { moveRef.current = v; ensureMusic(); }, onPointerUp: () => { moveRef.current = 0; }, onPointerLeave: () => { moveRef.current = 0; } });

  return (
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🚀 Bắn gạch</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Kéo bên dưới để lái thuyền · thuyền tự bắn. Đừng để gạch chạm đáy!</p>
            <p className="mb-1 font-black text-cyan-300">Vật phẩm rơi ra khi phá gạch:</p>
            <ul className="space-y-0.5">
              {DROP_IDS.map((id) => {
                const m = skillMeta(id === 'triple' ? 'laser' : id);
                const name = id === 'triple' ? 'Bắn 3 tia' : m.name;
                return <li key={id}><span style={emojiFont}>{m.emoji}</span> <b>{name}</b> — {id === 'triple' ? 'Bắn 3 tia cùng lúc' : m.desc}</li>;
              })}
            </ul>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 px-3 pt-2">
        <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-2.5 py-1.5">
          {Array.from({ length: Math.max(3, lives) }, (_, i) => (
            <Heart key={i} size={15} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
          ))}
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

      <div
        ref={fitRef}
        className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-start touch-none pt-1"
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
        <SkillHUD active={hud} className="absolute left-2 top-2" />
        <SkillToast show={skillToast} />
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
