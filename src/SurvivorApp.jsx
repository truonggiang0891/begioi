import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem, Timer } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import {
  spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters,
  makeShake, addShake, applyShake, setupCanvas,
} from './gameFx';
import { useScoreRewards } from './gameRewards';
import { useFitSize } from './useFitSize';

// --- GAME: SINH TỒN CHỌI BẦY (kiểu Vampire Survivors) ---
// Bé lái nhân vật (chạm-kéo), TỰ ĐÁNH về quái gần nhất. Cả biển quái vây quanh
// lao vào cắn. Hạ quái rơi ngọc kinh nghiệm -> LÊN CẤP -> chọn 1 trong 3 nâng cấp.
// Sống càng lâu càng giỏi.

const W = 340;
const H = 480;
const PLAYER_R = 14;
const JOY_R = 46;
const BULLET_R = 5;
const BULLET_SPEED = 5;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const M_COLORS = ['#ef4444', '#a855f7', '#f97316', '#14b8a6'];

// Các lựa chọn nâng cấp khi lên cấp.
const UPGRADES = [
  { id: 'dmg', emoji: '⚔️', label: 'Sát thương +', desc: 'Đòn đánh mạnh hơn', apply: (p) => { p.damage += 1; } },
  { id: 'rate', emoji: '⚡', label: 'Đánh nhanh +', desc: 'Ra đòn nhanh hơn', apply: (p) => { p.fireEvery = Math.max(7, p.fireEvery - 4); } },
  { id: 'proj', emoji: '➕', label: 'Thêm 1 tia', desc: 'Bắn thêm 1 mũi', apply: (p) => { p.projectiles += 1; } },
  { id: 'speed', emoji: '👟', label: 'Chạy nhanh +', desc: 'Di chuyển lẹ hơn', apply: (p) => { p.moveSpeed += 0.4; } },
  { id: 'range', emoji: '🧲', label: 'Tầm hút +', desc: 'Hút ngọc từ xa hơn', apply: (p) => { p.pickup += 24; } },
  { id: 'hp', emoji: '❤️', label: 'Máu tối đa +', desc: 'Thêm máu & hồi đầy', apply: (p) => { p.maxHp += 1; p.hp = p.maxHp; } },
];
const pick3 = () => {
  const a = UPGRADES.slice();
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, 3);
};

export default function SurvivorApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const joyRef = useRef(null);
  const pausedRef = useRef(false);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [hp, setHp] = useState(3);
  const [maxHp, setMaxHp] = useState(3);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [timeSec, setTimeSec] = useState(0);
  const [levelUp, setLevelUp] = useState(null); // [{id,emoji,label,desc}] | null
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem('game_survivor_best'), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };
  const musicRef = useRef(false);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('tense'); } };

  const newGame = () => {
    gRef.current = {
      player: { x: W / 2, y: H / 2, hp: 3, maxHp: 3, damage: 1, fireEvery: 26, projectiles: 1, moveSpeed: 3, pickup: 40 },
      enemies: [], bullets: [], gems: [], particles: [], floaters: [], shake: makeShake(),
      invuln: 0, frame: 0, kills: 0, xp: 0, xpNext: 5, level: 1, spawnCd: 0,
    };
    pausedRef.current = false;
    setScore(0); setHp(3); setMaxHp(3); setLevel(1); setXpPct(0); setTimeSec(0);
    setLevelUp(null); setNewRecord(false); setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = setupCanvas(canvasRef.current, W, H);
    let raf = 0; let curScore = 0;
    const g = () => gRef.current;
    const bumpBest = () => { if (curScore > best) { setBest(curScore); try { localStorage.setItem('game_survivor_best', String(curScore)); } catch { /* ignore */ } } };

    const nearest = (gg) => { let b = null; let bd = Infinity; for (const e of gg.enemies) { const d = dist(e.x, e.y, gg.player.x, gg.player.y); if (d < bd) { bd = d; b = e; } } return b; };

    const spawnEnemy = (gg) => {
      const edge = Math.floor(Math.random() * 4); let x; let y;
      if (edge === 0) { x = Math.random() * W; y = -18; }
      else if (edge === 1) { x = W + 18; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = H + 18; }
      else { x = -18; y = Math.random() * H; }
      const t = gg.frame / 60; // giây
      const tank = Math.random() < Math.min(0.22, t / 200);
      const fast = !tank && Math.random() < 0.3;
      const hpv = tank ? 4 + Math.floor(t / 25) : 1 + Math.floor(t / 40);
      gg.enemies.push({
        x, y, r: tank ? 17 : fast ? 10 : 13, hp: hpv, maxHp: hpv,
        speed: (tank ? 0.5 : fast ? 1.4 : 0.9) + Math.min(0.8, t / 90),
        color: M_COLORS[Math.floor(Math.random() * M_COLORS.length)],
      });
    };

    const levelUpNow = (gg) => {
      gg.level += 1; setLevel(gg.level);
      gg.xp -= gg.xpNext; gg.xpNext = Math.round(gg.xpNext * 1.35 + 2);
      pausedRef.current = true;
      playSound('levelup');
      setLevelUp(pick3());
    };

    const gainXp = (gg, n) => {
      gg.xp += n;
      if (gg.xp >= gg.xpNext && !pausedRef.current) levelUpNow(gg);
    };

    const hurt = (gg) => {
      if (gg.invuln > 0) return;
      gg.player.hp -= 1; setHp(gg.player.hp); gg.invuln = 45;
      addShake(gg.shake, 10); playSound('lose');
      if (gg.player.hp <= 0) { setOverBoth(true); killMusic(); if (curScore > best) setNewRecord(true); }
    };

    const update = () => {
      const gg = g();
      if (pausedRef.current) return; // đang chọn nâng cấp -> dừng
      gg.frame += 1;
      if (gg.invuln > 0) gg.invuln -= 1;
      stepParticles(gg.particles); stepFloaters(gg.floaters);
      if (gg.frame % 30 === 0) setTimeSec(Math.floor(gg.frame / 60));

      // di chuyển
      const joy = joyRef.current; const p = gg.player;
      if (joy) { p.x = clamp(p.x + (joy.dx / JOY_R) * p.moveSpeed, PLAYER_R, W - PLAYER_R); p.y = clamp(p.y + (joy.dy / JOY_R) * p.moveSpeed, PLAYER_R, H - PLAYER_R); }

      // sinh quái (dày dần theo thời gian)
      gg.spawnCd -= 1;
      if (gg.spawnCd <= 0) { const batch = 1 + Math.floor(gg.frame / 60 / 12); for (let i = 0; i < batch; i += 1) spawnEnemy(gg); gg.spawnCd = Math.max(14, 46 - Math.floor(gg.frame / 60)); }

      // tự đánh quái gần nhất
      if (gg.frame % p.fireEvery === 0) {
        const tgt = nearest(gg);
        if (tgt) {
          const a0 = Math.atan2(tgt.y - p.y, tgt.x - p.x);
          const n = p.projectiles;
          for (let i = 0; i < n; i += 1) {
            const off = (i - (n - 1) / 2) * 0.2;
            gg.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a0 + off) * BULLET_SPEED, vy: Math.sin(a0 + off) * BULLET_SPEED, dmg: p.damage });
          }
          playSound('shoot');
        }
      }
      gg.bullets.forEach((b) => { b.x += b.vx; b.y += b.vy; });
      gg.bullets = gg.bullets.filter((b) => b.x > -14 && b.x < W + 14 && b.y > -14 && b.y < H + 14);

      // quái lao vào
      for (const e of gg.enemies) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * e.speed; e.y += Math.sin(a) * e.speed;
        if (dist(e.x, e.y, p.x, p.y) < e.r + PLAYER_R) hurt(gg);
      }

      // đạn trúng quái
      for (const b of gg.bullets) {
        if (b.dead) continue;
        for (const e of gg.enemies) {
          if (e.dead) continue;
          if (dist(b.x, b.y, e.x, e.y) < e.r + BULLET_R) {
            b.dead = true; e.hp -= b.dmg;
            spawnBurst(gg.particles, b.x, b.y, [e.color], 4, { spread: 2.5 });
            if (e.hp <= 0) e.dead = true; else playSound('hit');
            break;
          }
        }
      }
      gg.enemies.filter((e) => e.dead).forEach((e) => {
        spawnBurst(gg.particles, e.x, e.y, [e.color, '#ffffff'], 10, { spread: 3.5 });
        gg.gems.push({ x: e.x, y: e.y, v: e.maxHp >= 4 ? 3 : 1 });
        gg.kills += 1; curScore = gg.kills * 10; setScore(curScore); bumpBest();
        playSound('break');
      });
      gg.enemies = gg.enemies.filter((e) => !e.dead);
      gg.bullets = gg.bullets.filter((b) => !b.dead);

      // ngọc kinh nghiệm — hút về khi trong tầm
      for (let i = gg.gems.length - 1; i >= 0; i -= 1) {
        const gm = gg.gems[i]; const d = dist(gm.x, gm.y, p.x, p.y);
        if (d < p.pickup) { gm.x += (p.x - gm.x) * 0.2; gm.y += (p.y - gm.y) * 0.2; }
        if (d < PLAYER_R + 6) { gainXp(gg, gm.v); playSound('coin'); gg.gems.splice(i, 1); }
      }
      setXpPct(Math.round((gg.xp / gg.xpNext) * 100));
    };

    const drawMonster = (e) => {
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(e.x - e.r * 0.35, e.y - e.r * 0.15, e.r * 0.28, 0, Math.PI * 2); ctx.arc(e.x + e.r * 0.35, e.y - e.r * 0.15, e.r * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath(); ctx.arc(e.x - e.r * 0.35, e.y - e.r * 0.1, e.r * 0.14, 0, Math.PI * 2); ctx.arc(e.x + e.r * 0.35, e.y - e.r * 0.1, e.r * 0.14, 0, Math.PI * 2); ctx.fill();
      if (e.maxHp > 1 && e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2, 3);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2 * (e.hp / e.maxHp), 3);
      }
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake); ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1428'); bg.addColorStop(1, '#0f0a1e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // ngọc
      gg.gems.forEach((gm) => { ctx.fillStyle = gm.v >= 3 ? '#f472b6' : '#34d399'; ctx.save(); ctx.translate(gm.x, gm.y); ctx.rotate(Math.PI / 4); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); });
      drawParticles(ctx, gg.particles);
      gg.enemies.forEach(drawMonster);
      // đạn
      ctx.fillStyle = '#fde047';
      gg.bullets.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2); ctx.fill(); });
      // người chơi
      const p = gg.player;
      if (!(gg.invuln > 0 && Math.floor(gg.frame / 4) % 2 === 0)) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(p.x - 4, p.y - 3, 3.4, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 3, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath(); ctx.arc(p.x - 4, p.y - 3, 1.7, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 3, 1.7, 0, Math.PI * 2); ctx.fill();
      }
      if (joyRef.current) {
        const j = joyRef.current; ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(j.ox, j.oy, JOY_R, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(j.ox + j.dx, j.oy + j.dy, 18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
    };

    const loop = () => { if (!overRef.current) update(); draw(); raf = requestAnimationFrame(loop); };
    draw(); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // chọn nâng cấp
  const chooseUpgrade = (id) => {
    const up = UPGRADES.find((u) => u.id === id);
    const g = gRef.current;
    if (up && g) {
      up.apply(g.player);
      setMaxHp(g.player.maxHp); setHp(g.player.hp);
      spawnFloater(g.floaters, g.player.x, g.player.y - 20, up.label, '#a7f3d0', { size: 15 });
    }
    playSound('powerup');
    setLevelUp(null);
    pausedRef.current = false;
  };

  const toCanvas = (e) => { const rect = canvasRef.current.getBoundingClientRect(); return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H }; };
  const onDown = (e) => { if (overRef.current || pausedRef.current) return; ensureMusic(); const p = toCanvas(e); joyRef.current = { ox: p.x, oy: p.y, dx: 0, dy: 0 }; };
  const onMove = (e) => { const j = joyRef.current; if (!j || !(e.buttons || e.pointerType === 'touch')) return; const p = toCanvas(e); let dx = p.x - j.ox; let dy = p.y - j.oy; const len = Math.hypot(dx, dy); if (len > JOY_R) { dx = dx / len * JOY_R; dy = dy / len * JOY_R; } j.dx = dx; j.dy = dy; };
  const onUp = () => { joyRef.current = null; };
  const restart = () => newGame();

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🔫 Sinh tồn chọi bầy</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p>Chạm &amp; kéo để <b>chạy né</b> — nhân vật <b>tự đánh</b> về con gần nhất. Cả biển quái lao vào cắn, né đi! Hạ quái nhặt <span className="text-emerald-300">ngọc 💎</span> để <b>lên cấp</b>, mỗi lần lên cấp <b>chọn 1 nâng cấp</b> (mạnh dần). Sống càng lâu càng giỏi.</p>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
          <div className="rounded-2xl bg-white/10 px-3 py-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Diệt</div>
            <div className="text-lg font-black text-white">{score / 10}</div>
          </div>
          <div className="rounded-2xl bg-violet-400/15 px-3 py-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-violet-200/60">Cấp</div>
            <div className="text-lg font-black text-violet-200">{level}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-2.5 py-1.5">
            {Array.from({ length: Math.max(3, maxHp) }, (_, i) => (
              <Heart key={i} size={15} className={i < hp ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-emerald-400/15 px-3 py-1.5" title="Thời gian sống">
            <Timer size={15} className="text-emerald-300" />
            <div className="text-lg font-black text-emerald-200">{fmtTime(timeSec)}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
            <Trophy size={15} className="text-amber-400" />
            <div className="text-lg font-black text-amber-300">{best / 10}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-3 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-lg font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        {/* Thanh kinh nghiệm */}
        <div className="h-1.5 w-full max-w-[440px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all" style={{ width: `${xpPct}%` }} />
        </div>

        <div
          ref={fitRef}
          className="relative flex min-h-0 w-full flex-1 items-center justify-center px-1 touch-none"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        >
          <canvas
            ref={canvasRef} width={W} height={H}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(167,139,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />

          {/* Chọn nâng cấp khi lên cấp */}
          {levelUp && (
            <div className="absolute inset-0 z-[56] flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-black/70 px-4">
              <div className="text-lg font-black text-fuchsia-300">⬆️ Lên cấp {level}! Chọn 1:</div>
              {levelUp.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => chooseUpgrade(u.id)}
                  className="flex w-full max-w-[240px] items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-left shadow-lg ring-2 ring-fuchsia-300/50 transition active:translate-y-0.5"
                >
                  <span className="text-2xl">{u.emoji}</span>
                  <span>
                    <span className="block text-sm font-black text-slate-700">{u.label}</span>
                    <span className="block text-xs font-bold text-slate-400">{u.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🧟'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Bị vây mất rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé sống <span className="text-orange-500">{fmtTime(timeSec)}</span> · diệt <span className="text-orange-500">{score / 10}</span> quái
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best / 10}`}
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
