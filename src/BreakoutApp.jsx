import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle, SkillHUD, SkillToast } from './gameUI';
import { SKILLS, skillMeta, randomSkill } from './gameSkills';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake , setupCanvas } from './gameFx';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';

// --- GAME: PHÁ GẠCH (Breakout / Arkanoid) ---
// Di thanh chắn để bật bóng lên phá các khối gạch phía trên.
// Nâng cấp: particle vỡ gạch, combo, powerup rơi (nhiều bóng, thanh dài, laser,
// +mạng, điểm, bóng chậm), nhạc nền, số điểm bay lên, screen-shake.

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
const PADDLE_WIDE = 112;
const PADDLE_H = 12;
const BALL_R = 6;
const MAX_LIVES = 5;
const PADDLE_Y_MAX = H - 26;         // vị trí thấp nhất (mặc định)
const PADDLE_Y_MIN = Math.round(H * 0.52); // được kéo lên tới quá nửa sân
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Skill có thể rơi ra từ gạch trong game này + trọng số (điểm/thanh dài hay gặp, laser hiếm).
const DROP_IDS = ['multiball', 'wide', 'laser', 'life', 'points', 'slow'];
const DROP_WEIGHTS = { points: 5, wide: 4, slow: 3, multiball: 3, laser: 2, life: 1 };
const DROP_CHANCE = 0.13;
const sec = (ms) => Math.round((ms / 1000) * 60); // ms -> số frame (~60fps)

const makeBricks = (level) => {
  const bricks = [];
  const bw = (W - 2 * MARGIN - (COLS - 1) * BRICK_GAP) / COLS;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      // Từ màn 2 trở đi hàng trên cùng cứng hơn (2 lớp).
      const hp = level >= 2 && r === 0 ? 2 : 1;
      bricks.push({
        x: MARGIN + c * (bw + BRICK_GAP),
        y: 44 + r * (BRICK_H + BRICK_GAP),
        w: bw,
        h: BRICK_H,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        hp,
        maxHp: hp,
        alive: true,
      });
    }
  }
  return bricks;
};

export default function BreakoutApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const steerRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('ready'); // ready | playing | over
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [hud, setHud] = useState([]); // skill đang có hiệu lực (cho SkillHUD)
  const [skillToast, setSkillToast] = useState(null);
  const statusRef = useRef('ready');
  const setStatusBoth = (s) => { statusRef.current = s; setStatus(s); };

  const makeBall = (g, stuck = true) => ({
    x: g.paddle.x + g.paddle.w / 2, y: H - 40, dx: 0, dy: 0, stuck,
  });

  const newGame = () => {
    const g = {
      paddle: { x: W / 2 - PADDLE_W / 2, y: PADDLE_Y_MAX, w: PADDLE_W },
      balls: [],
      bricks: makeBricks(1),
      speed: 3.4,
      level: 1,
      combo: 0,
      particles: [],
      floaters: [],
      drops: [],
      lasers: [],
      timers: {},      // id -> frame còn lại
      timersMax: {},   // id -> frame ban đầu (tính % cho HUD)
      laserCd: 0,
      shake: makeShake(),
    };
    g.balls.push(makeBall(g, true));
    gRef.current = g;
    setScore(0);
    setLives(3);
    setNewRecord(false);
    setHud([]);
    setStatusBoth('ready');
  };

  const launch = () => {
    const g = gRef.current;
    if (!g || statusRef.current === 'over') return;
    const stuckBall = g.balls.find((b) => b.stuck);
    if (!stuckBall) return;
    stuckBall.stuck = false;
    stuckBall.dx = g.speed * 0.5;
    stuckBall.dy = -g.speed;
    if (statusRef.current !== 'playing') { setStatusBoth('playing'); startMusic('arcade'); }
  };

  useEffect(() => {
    newGame();
    const canvas = canvasRef.current;
    const ctx = setupCanvas(canvas, W, H);
    let raf = 0;
    let curScore = 0;
    let curLives = 3;
    let hudTick = 0;

    const bumpBest = () => {
      if (curScore > best) {
        setBest(curScore);
        try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ }
      }
    };
    const addScore = (n) => {
      const mult = g().timers.x2 > 0 ? 2 : 1;
      curScore += n * mult;
      setScore(curScore);
      bumpBest();
      return n * mult;
    };
    const g = () => gRef.current;

    const setTimer = (id, ms) => {
      const gg = g();
      const f = sec(ms);
      gg.timers[id] = f;
      gg.timersMax[id] = f;
    };

    const showToast = (id) => setSkillToast({ id, key: `${id}-${curScore}-${g().drops.length}` });

    const applySkill = (id) => {
      const gg = g();
      playSound('powerup');
      showToast(id);
      if (id === 'multiball') {
        const src = gg.balls.find((b) => !b.stuck) || gg.balls[0];
        for (let i = 0; i < 2; i += 1) {
          const ang = (i === 0 ? -0.5 : 0.5);
          gg.balls.push({
            x: src.x, y: src.y,
            dx: gg.speed * (0.5 + ang), dy: -gg.speed, stuck: false,
          });
        }
      } else if (id === 'life') {
        curLives = Math.min(MAX_LIVES, curLives + 1);
        setLives(curLives);
      } else if (id === 'points') {
        const gained = addScore(50);
        spawnFloater(gg.floaters, gg.paddle.x + gg.paddle.w / 2, gg.paddle.y - 16, `+${gained}`, '#fbbf24', { size: 20 });
      } else if (id === 'wide') {
        gg.paddle.w = PADDLE_WIDE;
        setTimer('wide', SKILLS.wide.dur);
      } else if (id === 'slow') {
        setTimer('slow', SKILLS.slow.dur);
      } else if (id === 'x2') {
        setTimer('x2', SKILLS.x2.dur);
      } else if (id === 'laser') {
        setTimer('laser', SKILLS.laser.dur);
        gg.laserCd = 0;
      }
    };

    const killBrick = (gg, b) => {
      b.alive = false;
      spawnBurst(gg.particles, b.x + b.w / 2, b.y + b.h / 2, [b.color, '#ffffff'], 14, { spread: 4 });
      const gained = addScore(10 + (gg.combo >= 3 ? gg.combo : 0));
      gg.combo += 1;
      playSound('break'); // tiếng phá gạch to, đanh — luôn phát khi vỡ
      if (gg.combo >= 3) {
        spawnFloater(gg.floaters, b.x + b.w / 2, b.y, `Combo x${gg.combo}`, '#f0abfc', { size: 14 });
        playSound('combo', gg.combo); // thêm lớp giai điệu leo thang khi combo
      } else {
        spawnFloater(gg.floaters, b.x + b.w / 2, b.y, `+${gained}`, '#fde047', { size: 14 });
      }
      // rơi powerup?
      if (Math.random() < DROP_CHANCE) {
        gg.drops.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vy: 1.7, id: randomSkill(DROP_IDS, DROP_WEIGHTS) });
      }
    };

    const nextLevelIfClear = (gg) => {
      if (gg.bricks.some((b) => b.alive)) return false;
      gg.level += 1;
      gg.speed += 0.4;
      gg.bricks = makeBricks(gg.level);
      gg.balls = [makeBall(gg, true)];
      gg.drops = [];
      gg.lasers = [];
      gg.combo = 0;
      spawnFloater(gg.floaters, W / 2, H / 2, `Màn ${gg.level}!`, '#67e8f9', { size: 24, decay: 0.012 });
      setStatusBoth('ready');
      playSound('levelup');
      return true;
    };

    const loseLife = (gg) => {
      curLives -= 1;
      setLives(curLives);
      addShake(gg.shake, 10);
      gg.combo = 0;
      if (curLives <= 0) {
        setStatusBoth('over');
        killMusic();
        if (curScore > best) setNewRecord(true); else playSound('lose');
      } else {
        playSound('lose');
        gg.balls = [makeBall(gg, true)];
        setStatusBoth('ready');
      }
    };

    const tickTimers = (gg) => {
      for (const id of Object.keys(gg.timers)) {
        gg.timers[id] -= 1;
        if (gg.timers[id] <= 0) {
          delete gg.timers[id];
          delete gg.timersMax[id];
          if (id === 'wide') gg.paddle.w = PADDLE_W;
        }
      }
    };

    const update = () => {
      const gg = g();
      const slow = gg.timers.slow > 0 ? 0.6 : 1;

      // --- bóng ---
      for (let bi = gg.balls.length - 1; bi >= 0; bi -= 1) {
        const ball = gg.balls[bi];
        if (ball.stuck) { ball.x = gg.paddle.x + gg.paddle.w / 2; ball.y = gg.paddle.y - BALL_R - 1; continue; }
        ball.x += ball.dx * slow;
        ball.y += ball.dy * slow;

        if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
        if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
        if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }

        // va thanh chắn
        if (ball.dy > 0 && ball.y + BALL_R >= gg.paddle.y && ball.y < gg.paddle.y + PADDLE_H
            && ball.x >= gg.paddle.x && ball.x <= gg.paddle.x + gg.paddle.w) {
          const hit = (ball.x - (gg.paddle.x + gg.paddle.w / 2)) / (gg.paddle.w / 2);
          ball.dy = -Math.abs(ball.dy);
          ball.dx = gg.speed * hit * 1.1;
          ball.y = gg.paddle.y - BALL_R;
          gg.combo = 0; // về vợt là hết chuỗi
          playSound('pop');
        }

        // va gạch
        for (const b of gg.bricks) {
          if (!b.alive) continue;
          if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w
              && ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
            const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
            const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
            if (overlapX < overlapY) ball.dx = -ball.dx; else ball.dy = -ball.dy;
            b.hp -= 1;
            if (b.hp <= 0) killBrick(gg, b);
            else { playSound('hit'); spawnBurst(gg.particles, ball.x, ball.y, [b.color], 5, { spread: 2.5 }); }
            break;
          }
        }

        if (ball.y - BALL_R > H) gg.balls.splice(bi, 1);
      }

      if (nextLevelIfClear(gg)) return;
      if (gg.balls.length === 0) { loseLife(gg); return; }

      // --- laser ---
      if (gg.timers.laser > 0) {
        gg.laserCd -= 1;
        if (gg.laserCd <= 0) {
          gg.laserCd = 12;
          gg.lasers.push({ x: gg.paddle.x + gg.paddle.w / 2, y: gg.paddle.y });
          playSound('shoot');
        }
      }
      for (let li = gg.lasers.length - 1; li >= 0; li -= 1) {
        const L = gg.lasers[li];
        L.y -= 7;
        let gone = L.y < 0;
        for (const b of gg.bricks) {
          if (!b.alive) continue;
          if (L.x > b.x && L.x < b.x + b.w && L.y < b.y + b.h && L.y > b.y - 6) {
            b.hp -= 1;
            if (b.hp <= 0) killBrick(gg, b); else playSound('hit');
            gone = true;
            break;
          }
        }
        if (gone) gg.lasers.splice(li, 1);
      }
      nextLevelIfClear(gg);

      // --- drops ---
      for (let di = gg.drops.length - 1; di >= 0; di -= 1) {
        const d = gg.drops[di];
        d.y += d.vy;
        // hứng bằng thanh chắn
        if (d.y + 10 >= gg.paddle.y && d.y - 10 <= gg.paddle.y + PADDLE_H
            && d.x >= gg.paddle.x - 6 && d.x <= gg.paddle.x + gg.paddle.w + 6) {
          applySkill(d.id);
          gg.drops.splice(di, 1);
        } else if (d.y - 12 > H) {
          gg.drops.splice(di, 1);
        }
      }

      tickTimers(gg);
      stepParticles(gg.particles);
      stepFloaters(gg.floaters);

      // đẩy HUD (skill có hiệu lực) lên React mỗi ~7 frame
      hudTick += 1;
      if (hudTick % 7 === 0) {
        const arr = Object.keys(gg.timers).map((id) => ({ id, remain: gg.timers[id] / (gg.timersMax[id] || 1) }));
        setHud(arr);
      }
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake);
      ctx.translate(ox, oy);
      ctx.clearRect(-12, -12, W + 24, H + 24);
      // nền
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220');
      bg.addColorStop(1, '#111a33');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // gạch
      gg.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = b.hp < b.maxHp ? 0.6 : 1; // gạch cứng bị sứt thì mờ đi
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(b.x, b.y, b.w, 4);
        if (b.maxHp > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
        }
      });

      // particle & số bay lên (dưới các vật thể chính)
      drawParticles(ctx, gg.particles);

      // laser
      ctx.fillStyle = '#c084fc';
      gg.lasers.forEach((L) => ctx.fillRect(L.x - 1.5, L.y, 3, 10));

      // thanh chắn (đổi màu khi có laser/thanh dài)
      const paddleColor = gg.timers.laser > 0 ? '#c084fc' : gg.timers.wide > 0 ? '#22d3ee' : '#e2e8f0';
      ctx.fillStyle = paddleColor;
      ctx.fillRect(gg.paddle.x, gg.paddle.y, gg.paddle.w, PADDLE_H);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(gg.paddle.x, gg.paddle.y + PADDLE_H - 3, gg.paddle.w, 3);

      // bóng (có quầng sáng)
      gg.balls.forEach((ball) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(253,224,71,0.25)';
        ctx.arc(ball.x, ball.y, BALL_R + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#fde047';
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      });

      // drops (emoji rơi)
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

  // Lái tương đối 2 chiều: kéo ngang để đi ngang, kéo dọc để nâng/hạ thanh chắn.
  const STEER_GAIN = 2.2;
  const STEER_GAIN_Y = 1.5;
  const steer = (e) => {
    const isDown = e.type === 'pointerdown';
    if (!isDown && !(e.pointerType === 'touch' || e.buttons)) return;
    const g = gRef.current;
    if (!g) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width ? W / rect.width : 1;
    const scaleY = rect.height ? H / rect.height : 1;
    if (isDown || !steerRef.current) {
      steerRef.current = { startX: e.clientX, startY: e.clientY, startPaddleX: g.paddle.x, startPaddleY: g.paddle.y };
      if (isDown) { launch(); return; }
    }
    const dx = (e.clientX - steerRef.current.startX) * scaleX * STEER_GAIN;
    const dy = (e.clientY - steerRef.current.startY) * scaleY * STEER_GAIN_Y;
    g.paddle.x = clampN(steerRef.current.startPaddleX + dx, 0, W - g.paddle.w);
    g.paddle.y = clampN(steerRef.current.startPaddleY + dy, PADDLE_Y_MIN, PADDLE_Y_MAX);
  };
  const endSteer = () => { steerRef.current = null; };

  useEffect(() => {
    const onKey = (e) => {
      const g = gRef.current;
      if (!g) return;
      if (e.key === 'ArrowLeft') g.paddle.x = Math.max(0, g.paddle.x - 24);
      else if (e.key === 'ArrowRight') g.paddle.x = Math.min(W - g.paddle.w, g.paddle.x + 24);
      else if (e.key === 'ArrowUp') { e.preventDefault(); g.paddle.y = clampN(g.paddle.y - 20, PADDLE_Y_MIN, PADDLE_Y_MAX); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); g.paddle.y = clampN(g.paddle.y + 20, PADDLE_Y_MIN, PADDLE_Y_MAX); }
      else if (e.key === ' ') { e.preventDefault(); launch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = () => newGame();

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🧱 Phá gạch</h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Kéo để lái thanh chắn — <b>ngang và dọc</b> (có thể nâng thanh lên đỡ bóng sớm). Chạm để bắn bóng. Đừng để bóng rơi xuống đáy!</p>
            <p className="mb-1 font-black text-cyan-300">Vật phẩm rơi ra khi phá gạch:</p>
            <ul className="space-y-0.5">
              {DROP_IDS.map((id) => {
                const m = skillMeta(id);
                return <li key={id}><span style={emojiFont}>{m.emoji}</span> <b>{m.name}</b> — {m.desc}</li>;
              })}
            </ul>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
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
          className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-start pt-1 touch-none"
          onPointerDown={steer}
          onPointerMove={steer}
          onPointerUp={endSteer}
          onPointerCancel={endSteer}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
          <SkillHUD active={hud} className="absolute left-2 top-2" />
          <SkillToast show={skillToast} />
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
          onPointerUp={endSteer}
          onPointerCancel={endSteer}
          className="mx-3 mt-1 flex h-14 w-full max-w-[420px] shrink-0 touch-none items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 text-xs font-black text-cyan-100/70"
        >
✥ Kéo mọi hướng để lái (ngang &amp; dọc) · chạm để bắn bóng
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
