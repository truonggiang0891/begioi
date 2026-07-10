import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem, Zap } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import GameHelp from './GameHelp';
import GameOverModal from './GameOverModal';
import { useTouchMove, moveToward, drawTouchTarget } from './gameJoystick';
import { SoundToggle, SkillHUD, SkillToast } from './gameUI';
import { SKILLS, skillMeta, randomSkill } from './gameSkills';
import {
  spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters,
  makeShake, addShake, applyShake, setupCanvas,
} from './gameFx';
import { useScoreRewards } from './gameRewards';
import { useFitSize } from './useFitSize';

// --- GAME: KHÔNG CHIẾN HỖN CHIẾN ---
// Bé lái máy bay bay TỰ DO 2 chiều (chạm-kéo), súng tự bắn LÊN. Máy bay địch
// bay tự do lao xuống theo nhiều kiểu (thẳng/lượn/bổ nhào) và bắn trả. Sống sót
// qua từng đợt, cuối vài đợt có trùm. Nhặt vật phẩm: súng+ / khiên / bom / điểm / mạng.

const W = 340;
const H = 500;
const PLAYER_R = 16;
const PLAYER_SPEED = 3.4;
const BULLET_SPEED = 7;
const BULLET_R = 3.5;
const EB_SPEED = 2.6;
const EB_R = 5;
const FIRE_EVERY = 14;
const MAX_LIVES = 5;
const MAX_GUN = 5;
const BOSS_EVERY = 4;

const DROP_IDS = ['laser', 'shield', 'bomb', 'points', 'life'];
const DROP_WEIGHTS = { points: 5, laser: 4, shield: 2, bomb: 2, life: 1 };
const DROP_CHANCE = 0.16;
const sec = (ms) => Math.round((ms / 1000) * 60);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const E_COLORS = ['#ef4444', '#fb923c', '#f472b6', '#f59e0b'];

const makeEnemy = (wave, boss = false) => {
  if (boss) {
    return { x: W / 2, y: -40, r: 34, hp: 20 + wave * 4, maxHp: 20 + wave * 4, color: '#7c3aed', kind: 'boss', vx: 1.1, fireCd: 40, t: 0 };
  }
  const kinds = ['straight', 'weave', 'dive'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const hp = 1 + Math.floor(wave / 4);
  return {
    x: 26 + Math.random() * (W - 52), y: -24, r: 15, hp, maxHp: hp,
    speed: 1.1 + Math.min(1.4, wave * 0.06), color: E_COLORS[Math.floor(Math.random() * E_COLORS.length)],
    kind, phase: Math.random() * Math.PI * 2, x0: 0, fireCd: 50 + Math.floor(Math.random() * 90), t: 0,
  };
};

export default function DogfightApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [gun, setGun] = useState(1);
  const [wave, setWave] = useState(1);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem('game_dogfight_best'), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [hud, setHud] = useState([]);
  const [skillToast, setSkillToast] = useState(null);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };
  const musicRef = useRef(false);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('tense'); } };
  const { moveRef, handlers } = useTouchMove(canvasRef, W, H, { blocked: () => overRef.current, onStart: ensureMusic });

  const startWave = (g, w) => {
    g.wave = w; setWave(w);
    if (w % BOSS_EVERY === 0) { g.toSpawn = 1; g.spawnBoss = true; }
    else { g.toSpawn = Math.min(16, 4 + w); g.spawnBoss = false; }
    g.spawnCd = 0;
    spawnFloater(g.floaters, W / 2, H / 3, g.spawnBoss ? `Trùm đợt ${w}! 👾` : `Đợt ${w}!`, '#67e8f9', { size: 22, decay: 0.012 });
  };

  const newGame = () => {
    const g = {
      player: { x: W / 2, y: H - 80 }, gun: 1,
      pBullets: [], eBullets: [], enemies: [], drops: [],
      particles: [], floaters: [], shake: makeShake(),
      timers: {}, timersMax: {}, invuln: 0, combo: 0, comboTimer: 0,
      frame: 0, toSpawn: 0, spawnCd: 0, spawnBoss: false, wave: 1,
    };
    startWave(g, 1);
    gRef.current = g;
    setScore(0); setLives(3); setGun(1); setNewRecord(false); setHud([]); setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = setupCanvas(canvasRef.current, W, H);
    let raf = 0; let curScore = 0; let curLives = 3; let hudTick = 0;
    const g = () => gRef.current;

    const bumpBest = () => { if (curScore > best) { setBest(curScore); try { localStorage.setItem('game_dogfight_best', String(curScore)); } catch { /* ignore */ } } };
    const addScore = (n) => { const m = g().timers.x2 > 0 ? 2 : 1; curScore += n * m; setScore(curScore); bumpBest(); return n * m; };
    const setTimer = (id, ms) => { const f = sec(ms); g().timers[id] = f; g().timersMax[id] = f; };
    const showToast = (id) => setSkillToast({ id, key: `${id}-${curScore}-${g().drops.length}` });

    const fire = (gg) => {
      const n = gg.gun; const cx = gg.player.x; const cy = gg.player.y - PLAYER_R;
      for (let i = 0; i < n; i += 1) {
        const t = i - (n - 1) / 2;
        gg.pBullets.push({ x: cx + t * 7, y: cy, vx: t * 0.7, vy: -BULLET_SPEED });
      }
      playSound('shoot');
    };

    const applySkill = (id) => {
      const gg = g(); playSound('powerup'); showToast(id);
      if (id === 'life') { curLives = Math.min(MAX_LIVES, curLives + 1); setLives(curLives); }
      else if (id === 'points') { const got = addScore(50); spawnFloater(gg.floaters, gg.player.x, gg.player.y - 20, `+${got}`, '#fbbf24', { size: 18 }); }
      else if (id === 'laser') { gg.gun = Math.min(MAX_GUN, gg.gun + 1); setGun(gg.gun); }
      else if (id === 'shield') setTimer('shield', SKILLS.shield.dur);
      else if (id === 'bomb') {
        addShake(gg.shake, 12); playSound('explode');
        gg.enemies.forEach((e) => { if (!e.boss) e.dead = true; else e.hp -= 6; });
      }
    };

    const killEnemy = (gg, e) => {
      spawnBurst(gg.particles, e.x, e.y, [e.color, '#ffffff', '#fde047'], e.boss ? 34 : 14, { spread: e.boss ? 6 : 4 });
      addShake(gg.shake, e.boss ? 12 : 2);
      const gained = addScore(e.boss ? 100 : 10 + (gg.combo >= 3 ? gg.combo : 0));
      gg.combo += 1; gg.comboTimer = 70;
      playSound(e.boss ? 'explode' : 'break');
      if (e.boss) spawnFloater(gg.floaters, e.x, e.y, 'Hạ trùm! 🏆', '#fde047', { size: 20 });
      else if (gg.combo >= 3) { playSound('combo', gg.combo); spawnFloater(gg.floaters, e.x, e.y, `Combo x${gg.combo}`, '#f0abfc', { size: 13 }); }
      else spawnFloater(gg.floaters, e.x, e.y, `+${gained}`, '#fde047', { size: 13 });
      if (e.boss || Math.random() < DROP_CHANCE) gg.drops.push({ x: e.x, y: e.y, id: randomSkill(DROP_IDS, DROP_WEIGHTS), vy: 1.4 });
    };

    const hitPlayer = (gg) => {
      if (gg.invuln > 0 || gg.timers.shield > 0) return;
      curLives -= 1; setLives(curLives); gg.invuln = 60; gg.combo = 0;
      addShake(gg.shake, 12); playSound('lose');
      if (curLives <= 0) { setOverBoth(true); killMusic(); if (curScore > best) setNewRecord(true); }
    };

    const update = () => {
      const gg = g(); gg.frame += 1;
      if (gg.invuln > 0) gg.invuln -= 1;
      stepParticles(gg.particles); stepFloaters(gg.floaters);
      if (gg.comboTimer > 0) { gg.comboTimer -= 1; if (gg.comboTimer === 0) gg.combo = 0; }

      moveToward(gg.player, moveRef.current, PLAYER_SPEED, PLAYER_R, W, H);

      if (gg.toSpawn > 0) {
        gg.spawnCd -= 1;
        if (gg.spawnCd <= 0) {
          const e = makeEnemy(gg.wave, gg.spawnBoss); e.x0 = e.x; gg.enemies.push(e);
          gg.toSpawn -= 1; gg.spawnCd = gg.spawnBoss ? 0 : 30;
        }
      }

      if (gg.frame % FIRE_EVERY === 0) fire(gg);
      gg.pBullets.forEach((b) => { b.x += b.vx; b.y += b.vy; });
      gg.pBullets = gg.pBullets.filter((b) => b.y > -12 && b.x > -12 && b.x < W + 12);

      // địch bay + bắn
      for (const e of gg.enemies) {
        e.t += 1;
        if (e.boss) {
          e.y = Math.min(70, e.y + 1.2);
          e.x = clamp(e.x + e.vx, e.r, W - e.r);
          if (e.x <= e.r || e.x >= W - e.r) e.vx *= -1;
          e.fireCd -= 1;
          if (e.fireCd <= 0) { for (const off of [-0.35, 0, 0.35]) gg.eBullets.push({ x: e.x, y: e.y + e.r, vx: Math.sin(off) * EB_SPEED, vy: Math.cos(off) * EB_SPEED }); e.fireCd = 45; }
        } else {
          e.y += e.speed;
          if (e.kind === 'weave') e.x = e.x0 + Math.sin(e.t * 0.06 + e.phase) * 40;
          else if (e.kind === 'dive') e.x += clamp(gg.player.x - e.x, -1.6, 1.6);
          e.fireCd -= 1;
          const d = dist(e.x, e.y, gg.player.x, gg.player.y);
          if (e.fireCd <= 0 && e.y < H - 60 && d < 320) {
            const a = Math.atan2(gg.player.y - e.y, gg.player.x - e.x);
            gg.eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * EB_SPEED, vy: Math.sin(a) * EB_SPEED });
            e.fireCd = 70 + Math.floor(Math.random() * 80);
          }
        }
        if (dist(e.x, e.y, gg.player.x, gg.player.y) < e.r + PLAYER_R) hitPlayer(gg);
        if (!e.boss && e.y > H + 24) e.gone = true; // bay thoát khỏi màn
      }

      // đạn ta trúng địch
      for (const b of gg.pBullets) {
        if (b.dead) continue;
        for (const e of gg.enemies) {
          if (e.dead || e.gone) continue;
          if (dist(b.x, b.y, e.x, e.y) < e.r + BULLET_R) {
            b.dead = true; e.hp -= 1;
            if (e.hp <= 0) e.dead = true; else { playSound('hit'); spawnBurst(gg.particles, b.x, b.y, [e.color], 4, { spread: 2.5 }); }
            break;
          }
        }
      }
      gg.enemies.filter((e) => e.dead).forEach((e) => killEnemy(gg, e));
      gg.enemies = gg.enemies.filter((e) => !e.dead && !e.gone);
      gg.pBullets = gg.pBullets.filter((b) => !b.dead);

      // đạn địch
      gg.eBullets.forEach((b) => { b.x += b.vx; b.y += b.vy; });
      gg.eBullets = gg.eBullets.filter((b) => b.y > -12 && b.y < H + 12 && b.x > -12 && b.x < W + 12);
      for (let i = gg.eBullets.length - 1; i >= 0; i -= 1) {
        const b = gg.eBullets[i];
        if (dist(b.x, b.y, gg.player.x, gg.player.y) < PLAYER_R + EB_R) { gg.eBullets.splice(i, 1); hitPlayer(gg); }
      }

      // vật phẩm rơi + hút nhẹ
      for (let i = gg.drops.length - 1; i >= 0; i -= 1) {
        const d = gg.drops[i]; d.y += d.vy;
        const dd = dist(d.x, d.y, gg.player.x, gg.player.y);
        if (dd < 70) { d.x += (gg.player.x - d.x) * 0.06; d.y += (gg.player.y - d.y) * 0.06; }
        if (dd < PLAYER_R + 10) { applySkill(d.id); gg.drops.splice(i, 1); }
        else if (d.y > H + 16) gg.drops.splice(i, 1);
      }

      if (gg.toSpawn === 0 && gg.enemies.length === 0) { playSound('levelup'); startWave(gg, gg.wave + 1); }

      for (const id of Object.keys(gg.timers)) { gg.timers[id] -= 1; if (gg.timers[id] <= 0) { delete gg.timers[id]; delete gg.timersMax[id]; } }
      hudTick += 1;
      if (hudTick % 7 === 0) setHud(Object.keys(gg.timers).map((id) => ({ id, remain: gg.timers[id] / (gg.timersMax[id] || 1) })));
    };

    const drawPlane = (cx, cy, r, color, up) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      if (up) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx - r, cy + r * 0.8); ctx.lineTo(cx + r, cy + r * 0.8); }
      else { ctx.moveTo(cx, cy + r); ctx.lineTo(cx - r, cy - r * 0.8); ctx.lineTo(cx + r, cy - r * 0.8); }
      ctx.closePath(); ctx.fill();
      // cánh
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(cx - r * 1.1, cy - 2, r * 2.2, 4);
      // buồng lái
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath(); ctx.arc(cx, cy + (up ? -r * 0.1 : r * 0.1), r * 0.3, 0, Math.PI * 2); ctx.fill();
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake); ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#132244');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // sao nền cuộn
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 26; i += 1) { const sx = (i * 53) % W; const sy = ((i * 97 + gg.frame * 1.4) % H); ctx.fillRect(sx, sy, 2, 2); }

      gg.drops.forEach((d) => {
        const m = skillMeta(d.id);
        ctx.beginPath(); ctx.fillStyle = m.color; ctx.globalAlpha = 0.9; ctx.arc(d.x, d.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.font = '15px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.emoji, d.x, d.y + 1);
      });
      drawParticles(ctx, gg.particles);
      ctx.fillStyle = '#fb7185';
      gg.eBullets.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, EB_R, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#fde047';
      gg.pBullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 6, 4, 10));
      gg.enemies.forEach((e) => {
        drawPlane(e.x, e.y, e.r, e.color, false);
        if (e.maxHp > 1) {
          const w = e.r * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w, 4);
          ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w * (e.hp / e.maxHp), 4);
        }
      });
      if (gg.timers.shield > 0) { ctx.strokeStyle = 'rgba(56,189,248,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gg.player.x, gg.player.y, PLAYER_R + 9, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
      if (!(gg.invuln > 0 && Math.floor(gg.frame / 4) % 2 === 0)) drawPlane(gg.player.x, gg.player.y, PLAYER_R, '#38bdf8', true);
      drawTouchTarget(ctx, moveRef.current);
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
    };

    const loop = () => { if (!overRef.current) update(); draw(); raf = requestAnimationFrame(loop); };
    draw(); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => newGame();

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">✈️ Không chiến hỗn chiến</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Chạm/kéo trong sân — <b>máy bay chạy tới ngón tay</b> của bé, súng <b>tự bắn lên</b>. Máy bay địch bay tự do lao xuống &amp; bắn trả, né đạn nhé (cuối vài đợt có <b>trùm</b>)!</p>
            <ul className="space-y-0.5">
              {DROP_IDS.map((id) => { const m = skillMeta(id); const nm = id === 'laser' ? 'Súng +' : m.name; return <li key={id}><span style={emojiFont}>{m.emoji}</span> <b>{nm}</b> — {id === 'laser' ? 'Bắn thêm 1 tia' : m.desc}</li>; })}
            </ul>
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
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-lg font-black text-white">{score}</div>
          </div>
          <div className="rounded-2xl bg-cyan-400/15 px-3 py-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/60">Đợt</div>
            <div className="text-lg font-black text-cyan-200">{wave}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-2.5 py-1.5">
            {Array.from({ length: Math.max(3, lives) }, (_, i) => (
              <Heart key={i} size={15} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-cyan-400/15 px-3 py-1.5" title="Cấp súng">
            <Zap size={15} className="text-cyan-300" />
            <div className="text-lg font-black text-cyan-200">{gun}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
            <Trophy size={15} className="text-amber-400" />
            <div className="text-lg font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-3 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-lg font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        <div
          ref={fitRef}
          className="relative flex min-h-0 w-full flex-1 items-center justify-center px-1 touch-none"
          {...handlers}
        >
          <canvas
            ref={canvasRef} width={W} height={H}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
          <SkillHUD active={hud} className="absolute left-2 top-2" />
          <SkillToast show={skillToast} />
        </div>
      </div>

      <GameOverModal over={over} newRecord={newRecord} emoji="✈️" loseTitle="Rơi mất rồi!" onRestart={restart}>
        Bé trụ tới <span className="text-orange-500">đợt {wave}</span> · <span className="text-orange-500">{score}</span> điểm
        {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
      </GameOverModal>
    </div>
  );
}
