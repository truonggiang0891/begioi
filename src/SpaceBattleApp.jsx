import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, ArrowLeft, ArrowRight, Rocket, Zap, Shield, CircleDot } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import { useFitSize } from './useFitSize';
import GameHelp from './GameHelp';

// --- GAME: KHÔNG CHIẾN (Space Battle) ---
// Phi thuyền địch BẮN TRẢ! Bé né đạn + tự bắn hạ chúng.
// PHẦN THƯỞNG: hạ địch có thể rớt vật phẩm rơi xuống -> hứng để lên cấp súng hoặc nhận tên lửa.

const W = 320;
const H = 440;
const SHIP_W = 34;
const SHIP_H = 20;
const SHIP_Y = H - 30;
const E_BULLET_SPEED = 1.1;
const P_BULLET_SPEED = 1.1; // đạn quân ta chậm bằng đạn địch
const FIRE_EVERY = 20; // bắn thưa cho đỡ dày đạn
const EW = 30;
const EH = 22;
const MAX_GUN = 8;
const MAX_SHIELD = 4;
const MAX_COUNTER = 3;
const ROCKET_SPEED = 4.6;
const ROCKET_TURN = 0.16; // độ bẻ lái tầm nhiệt
const EXPLOSION_RADIUS = 52; // nổ lan sang ô bên cạnh
const BEST_KEY = 'game_battle_best';
const ENEMY_COLORS = ['#ef4444', '#f472b6', '#a78bfa', '#fb923c', '#34d399'];

const makeWave = (rows) => {
  const enemies = [];
  const cols = 5;
  const gap = 12;
  const startX = (W - (cols * EW + (cols - 1) * gap)) / 2;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      enemies.push({
        x: startX + c * (EW + gap),
        y: 34 + r * (EH + 14),
        color: ENEMY_COLORS[(r + c) % ENEMY_COLORS.length],
        alive: true,
      });
    }
  }
  return enemies;
};

export default function SpaceBattleApp({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const moveRef = useRef(0);
  const steerRef = useRef(null); // mốc kéo tương đối {startX, startShipX}
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gun, setGun] = useState(1);
  const [rockets, setRockets] = useState(0);
  const [shield, setShield] = useState(0);
  const [counterLv, setCounterLv] = useState(0);
  const [weapon, setWeapon] = useState('gun'); // 'gun' | 'counter'
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };

  const newGame = () => {
    gRef.current = {
      ship: { x: W / 2 - SHIP_W / 2 },
      pBullets: [],
      eBullets: [],
      powerups: [],
      explosions: [],
      enemies: makeWave(2),
      edir: 1,
      espeed: 0.45,
      efireChance: 0.0022,
      frame: 0,
      invuln: 0,
      wave: 1,
      gunLevel: 1,
      rockets: 0,
      shield: 0,
      counterLevel: 0,
      weapon: 'gun',
    };
    setScore(0);
    setLives(3);
    setGun(1);
    setRockets(0);
    setShield(0);
    setCounterLv(0);
    setWeapon('gun');
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
      // địch
      g.enemies.forEach((e) => {
        if (!e.alive) return;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, EW, EH);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(e.x + 6, e.y + 7, 5, 5);
        ctx.fillRect(e.x + EW - 11, e.y + 7, 5, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(e.x + 8, e.y + 9, 2, 2);
        ctx.fillRect(e.x + EW - 9, e.y + 9, 2, 2);
      });
      // vật phẩm rơi
      g.powerups.forEach((p) => {
        if (p.type === 'gun') {
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(p.x - 11, p.y - 11, 22, 22);
          ctx.fillStyle = '#0b1220';
          ctx.fillRect(p.x - 6, p.y - 6, 3, 12);
          ctx.fillRect(p.x - 1, p.y - 6, 3, 12);
          ctx.fillRect(p.x + 4, p.y - 6, 3, 12);
        } else if (p.type === 'rocket') {
          ctx.fillStyle = '#fb923c';
          ctx.fillRect(p.x - 11, p.y - 11, 22, 22);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 7);
          ctx.lineTo(p.x - 5, p.y + 7);
          ctx.lineTo(p.x + 5, p.y + 7);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'counter') {
          ctx.fillStyle = '#a78bfa';
          ctx.fillRect(p.x - 11, p.y - 11, 22, 22);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 1;
        } else {
          // giáp
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x - 11, p.y - 11, 22, 22);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 7);
          ctx.lineTo(p.x - 6, p.y - 4);
          ctx.lineTo(p.x - 6, p.y + 2);
          ctx.lineTo(p.x, p.y + 8);
          ctx.lineTo(p.x + 6, p.y + 2);
          ctx.lineTo(p.x + 6, p.y - 4);
          ctx.closePath();
          ctx.fill();
        }
      });
      // đạn bé (thường + tên lửa)
      g.pBullets.forEach((b) => {
        if (b.rocket) {
          // đuôi lửa mờ + đầu tên lửa sáng
          ctx.fillStyle = 'rgba(253,224,71,0.4)';
          ctx.beginPath(); ctx.arc(b.x - (b.vx || 0), b.y - (b.vy || 0), 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fb923c';
          ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
        } else if (b.counter) {
          ctx.fillStyle = 'rgba(196,181,253,0.5)';
          ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a78bfa';
          ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(b.x - 2, b.y - 8, 4, 10);
        }
      });
      // đạn địch
      ctx.fillStyle = '#fb7185';
      g.eBullets.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); });
      // vụ nổ tên lửa
      g.explosions.forEach((ex) => {
        const maxR = ex.r || EXPLOSION_RADIUS;
        const rad = 10 + ex.t * (maxR - 10) / 10;
        const fade = Math.max(0, 1 - ex.t / 10);
        ctx.fillStyle = `rgba(253,224,71,${0.5 * fade})`;
        ctx.beginPath(); ctx.arc(ex.x, ex.y, rad * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(251,146,60,${fade})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ex.x, ex.y, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      });
      // thuyền bé (nhấp nháy khi bất tử)
      if (!(g.invuln > 0 && Math.floor(g.frame / 4) % 2 === 0)) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(g.ship.x + SHIP_W / 2, SHIP_Y);
        ctx.lineTo(g.ship.x, SHIP_Y + SHIP_H);
        ctx.lineTo(g.ship.x + SHIP_W, SHIP_Y + SHIP_H);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(g.ship.x + SHIP_W / 2 - 3, SHIP_Y + 5, 6, 9);
      }
      // vòng giáp bảo vệ
      if (g.shield > 0) {
        ctx.strokeStyle = `rgba(34,197,94,${0.35 + 0.15 * g.shield})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.ship.x + SHIP_W / 2, SHIP_Y + SHIP_H / 2, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    };

    const onKill = (g, e) => {
      e.alive = false;
      curScore += 10;
      setScore(curScore);
      if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
      playSound('pop');
      // cơ hội rớt phần thưởng (gun / rocket / shield / counter)
      if (Math.random() < 0.32 && g.powerups.length < 4) {
        const roll = Math.random();
        const type = roll < 0.34 ? 'gun' : roll < 0.58 ? 'rocket' : roll < 0.80 ? 'shield' : 'counter';
        g.powerups.push({ x: e.x + EW / 2, y: e.y + EH, type });
      }
    };

    // Súng thường: cấp càng cao càng nhiều tia đạn toả ra (tối đa 8 tia).
    // Đạn phản kích (counter): triệt đạn địch, tối đa 3 đầu.
    const fire = (g) => {
      const bx = g.ship.x + SHIP_W / 2;
      if (g.weapon === 'counter' && g.counterLevel > 0) {
        const m = g.counterLevel;
        for (let i = 0; i < m; i += 1) {
          const t = i - (m - 1) / 2;
          g.pBullets.push({ x: bx + t * 12, y: SHIP_Y - 2, vx: t * 0.35, counter: true });
        }
      } else {
        const n = g.gunLevel;
        for (let i = 0; i < n; i += 1) {
          const t = i - (n - 1) / 2; // lệch tâm
          g.pBullets.push({ x: bx + t * 6, y: SHIP_Y, vx: t * 0.5 });
        }
      }
    };

    const update = () => {
      const g = gRef.current;
      g.frame += 1;
      if (g.invuln > 0) g.invuln -= 1;

      g.ship.x = Math.max(0, Math.min(W - SHIP_W, g.ship.x + moveRef.current * 4));

      // bé tự bắn
      if (g.frame % FIRE_EVERY === 0) fire(g);
      // di chuyển đạn: tên lửa tự tìm mục tiêu gần nhất (bay chéo được)
      const nearestEnemy = (x, y) => {
        let best = null; let bd = Infinity;
        for (const e of g.enemies) {
          if (!e.alive) continue;
          const dx = e.x + EW / 2 - x; const dy = e.y + EH / 2 - y;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = e; }
        }
        return best;
      };
      g.pBullets.forEach((b) => {
        if (b.rocket) {
          const tgt = nearestEnemy(b.x, b.y);
          if (tgt) {
            const dx = tgt.x + EW / 2 - b.x; const dy = tgt.y + EH / 2 - b.y;
            const dist = Math.hypot(dx, dy) || 1;
            b.vx += (dx / dist * ROCKET_SPEED - b.vx) * ROCKET_TURN;
            b.vy += (dy / dist * ROCKET_SPEED - b.vy) * ROCKET_TURN;
            const sp = Math.hypot(b.vx, b.vy) || 1;
            b.vx = b.vx / sp * ROCKET_SPEED;
            b.vy = b.vy / sp * ROCKET_SPEED;
          }
          b.x += b.vx; b.y += b.vy;
        } else {
          b.x += b.vx || 0;
          b.y -= P_BULLET_SPEED;
        }
      });
      g.pBullets = g.pBullets.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);

      // di chuyển đàn địch (dội biên thì lùi xuống)
      const alive = g.enemies.filter((e) => e.alive);
      if (alive.length) {
        const minX = Math.min(...alive.map((e) => e.x));
        const maxX = Math.max(...alive.map((e) => e.x));
        if (minX + g.edir * g.espeed < 6 || maxX + EW + g.edir * g.espeed > W - 6) {
          g.edir *= -1;
          g.enemies.forEach((e) => { e.y += 12; });
        } else {
          g.enemies.forEach((e) => { e.x += g.edir * g.espeed; });
        }
      }

      // địch bắn trả
      if (alive.length && Math.random() < g.efireChance * alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        g.eBullets.push({ x: shooter.x + EW / 2, y: shooter.y + EH });
      }
      g.eBullets.forEach((b) => { b.y += E_BULLET_SPEED; });
      g.eBullets = g.eBullets.filter((b) => b.y < H + 10);

      // đạn bé trúng địch
      for (const b of g.pBullets) {
        if (b.dead) continue;
        for (const e of g.enemies) {
          if (!e.alive) continue;
          if (b.x > e.x && b.x < e.x + EW && b.y < e.y + EH && b.y > e.y) {
            if (b.rocket) {
              // NỔ LAN: hạ mọi địch trong bán kính nổ
              g.explosions.push({ x: b.x, y: b.y, t: 0, r: EXPLOSION_RADIUS });
              const ex = b.x; const ey = b.y;
              g.enemies.forEach((en) => {
                if (en.alive && Math.hypot(en.x + EW / 2 - ex, en.y + EH / 2 - ey) < EXPLOSION_RADIUS) onKill(g, en);
              });
              playSound('correct');
            } else {
              onKill(g, e);
            }
            b.dead = true;
            break;
          }
        }
      }
      // đạn phản kích triệt đạn địch: chạm nhau -> cả hai cùng nổ
      for (const pb of g.pBullets) {
        if (!pb.counter || pb.dead) continue;
        for (let j = g.eBullets.length - 1; j >= 0; j -= 1) {
          const eb = g.eBullets[j];
          if (Math.hypot(pb.x - eb.x, pb.y - eb.y) < 11) {
            g.eBullets.splice(j, 1);
            pb.dead = true;
            g.explosions.push({ x: pb.x, y: pb.y, t: 0, r: 18 });
            playSound('pop');
            break;
          }
        }
      }
      g.pBullets = g.pBullets.filter((b) => !b.dead);
      // cập nhật vụ nổ
      g.explosions.forEach((ex) => { ex.t += 1; });
      g.explosions = g.explosions.filter((ex) => ex.t <= 10);

      // vật phẩm rơi + hứng
      g.powerups.forEach((p) => { p.y += 1.7; });
      for (let i = g.powerups.length - 1; i >= 0; i -= 1) {
        const p = g.powerups[i];
        const caught = p.y > SHIP_Y - 8 && p.y < SHIP_Y + SHIP_H + 8 && p.x > g.ship.x - 8 && p.x < g.ship.x + SHIP_W + 8;
        if (caught) {
          if (p.type === 'gun') { g.gunLevel = Math.min(MAX_GUN, g.gunLevel + 1); setGun(g.gunLevel); }
          else if (p.type === 'rocket') { g.rockets = Math.min(9, g.rockets + 3); setRockets(g.rockets); }
          else if (p.type === 'counter') { g.counterLevel = Math.min(MAX_COUNTER, g.counterLevel + 1); setCounterLv(g.counterLevel); }
          else { g.shield = MAX_SHIELD; setShield(g.shield); }
          playSound('correct');
          g.powerups.splice(i, 1);
        } else if (p.y > H + 12) {
          g.powerups.splice(i, 1);
        }
      }

      // đạn địch trúng thuyền bé
      if (g.invuln <= 0) {
        for (let i = 0; i < g.eBullets.length; i += 1) {
          const b = g.eBullets[i];
          if (b.x > g.ship.x && b.x < g.ship.x + SHIP_W && b.y > SHIP_Y && b.y < SHIP_Y + SHIP_H) {
            g.eBullets.splice(i, 1);
            g.invuln = 45;
            if (g.shield > 0) {
              // giáp đỡ đạn, không mất mạng
              g.shield -= 1;
              setShield(g.shield);
              playSound('pop');
            } else {
              curLives -= 1;
              setLives(curLives);
              playSound('wrong');
              if (curLives <= 0) { setOverBoth(true); if (curScore > best) setNewRecord(true); }
            }
            break;
          }
        }
      }

      // hết địch -> đợt mới khó hơn
      if (g.enemies.every((e) => !e.alive)) {
        g.wave += 1;
        g.espeed += 0.16;
        g.efireChance = Math.min(0.008, g.efireChance + 0.0009);
        g.enemies = makeWave(Math.min(6, 1 + g.wave));
        g.eBullets = [];
        playSound('correct');
      }

      // địch chạm tới thuyền -> thua
      if (alive.some((e) => e.y + EH >= SHIP_Y)) {
        setOverBoth(true);
        if (curScore > best) setNewRecord(true); else playSound('wrong');
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

  // Chọn loại đạn đang bắn (mỗi lúc chỉ 1 loại).
  const selectWeapon = (w) => {
    if (w === 'counter' && counterLv <= 0) return;
    setWeapon(w);
    if (gRef.current) gRef.current.weapon = w;
  };

  // Bắn tên lửa (chủ động, dùng nút hoặc phím Space).
  const fireRocket = () => {
    const g = gRef.current;
    if (!g || overRef.current || g.rockets <= 0) return;
    g.rockets -= 1;
    setRockets(g.rockets);
    g.pBullets.push({ x: g.ship.x + SHIP_W / 2, y: SHIP_Y, vx: 0, vy: -ROCKET_SPEED, rocket: true });
    playSound('correct');
  };

  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'ArrowLeft') moveRef.current = -1;
      else if (e.key === 'ArrowRight') moveRef.current = 1;
      else if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); fireRocket(); }
    };
    const onUp = (e) => { if ((e.key === 'ArrowLeft' && moveRef.current === -1) || (e.key === 'ArrowRight' && moveRef.current === 1)) moveRef.current = 0; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className="truncate text-lg font-black text-white md:text-2xl">✈️ Không chiến</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Kéo <b>bên dưới</b> để lái thuyền · Bấm <span className="text-cyan-300">⚡Lv</span>/<span className="text-violet-300">💠Lv</span> để đổi loại đạn (chỉ bắn 1 loại) · <span className="text-green-300">🛡️ giáp</span> đỡ đạn · <span className="text-orange-300">🚀 tên lửa nổ lan</span>
          </GameHelp>
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-3 pt-2">
        <div className="rounded-2xl bg-white/10 px-4 py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-3 py-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={17} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => selectWeapon('gun')}
          className={`flex items-center gap-1 rounded-2xl px-3 py-1.5 transition ${weapon === 'gun' ? 'bg-cyan-400/40 ring-2 ring-cyan-300' : 'bg-cyan-400/15'}`}
          title="Dùng súng thường"
        >
          <Zap size={16} className="text-cyan-300" />
          <span className="text-sm font-black text-cyan-200">Lv{gun}</span>
        </button>
        <div className="flex items-center gap-1 rounded-2xl bg-orange-400/15 px-3 py-1.5" title="Tên lửa">
          <Rocket size={16} className="text-orange-300" />
          <span className="text-sm font-black text-orange-200">{rockets}</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-2xl bg-green-400/15 px-2.5 py-1.5" title="Giáp — còn mấy lần đỡ đạn">
          {Array.from({ length: MAX_SHIELD }, (_, i) => (
            <Shield key={i} size={15} className={i < shield ? 'fill-green-400 text-green-400' : 'text-white/25'} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => selectWeapon('counter')}
          disabled={counterLv <= 0}
          className={`flex items-center gap-1 rounded-2xl px-3 py-1.5 transition ${weapon === 'counter' ? 'bg-violet-400/40 ring-2 ring-violet-300' : 'bg-violet-400/15'} ${counterLv <= 0 ? 'opacity-50' : ''}`}
          title="Dùng đạn phản kích (triệt đạn địch)"
        >
          <CircleDot size={16} className={counterLv > 0 ? 'text-violet-300' : 'text-white/30'} />
          <span className="text-sm font-black text-violet-200">Lv{counterLv}</span>
        </button>
        <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
          <Trophy size={15} className="text-amber-400" />
          <div className="text-lg font-black text-amber-300">{best}</div>
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

      {/* Dải lái: kéo ngón tay ở đây (bên dưới thuyền) để điều khiển, tay không che sân chơi */}
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
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Trái" {...hold(-1)} className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowLeft size={28} />
          </button>
          <button
            type="button"
            aria-label="Bắn tên lửa"
            onPointerDown={fireRocket}
            disabled={rockets <= 0}
            className={`flex h-16 w-24 touch-none flex-col items-center justify-center gap-0.5 rounded-2xl font-black shadow-[0_4px_0_rgba(0,0,0,0.35)] transition active:translate-y-0.5 ${
              rockets > 0 ? 'bg-gradient-to-b from-orange-400 to-orange-500 text-white' : 'bg-white/10 text-white/30'
            }`}
          >
            <Rocket size={24} />
            <span className="text-xs">Tên lửa {rockets}</span>
          </button>
          <button type="button" aria-label="Phải" {...hold(1)} className="flex h-16 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowRight size={28} />
          </button>
        </div>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '✈️'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Trúng đạn rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé hạ được <span className="text-orange-500">{score / 10}</span> địch ({score} điểm)
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
