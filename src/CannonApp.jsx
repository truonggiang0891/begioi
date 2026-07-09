import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake } from './gameFx';
import { useFitSize } from './useFitSize';
import GameHelp from './GameHelp';
import { useScoreRewards } from './gameRewards';

// --- GAME: BẮN PHÁO (Ném bóng theo đường bay có trọng lực) ---
// Ngắm bằng BÀN NGẮM BÊN DƯỚI (trái/phải = hướng, trên/dưới = lực), thả để bắn.
// Có đường bay dự đoán hiện trên sân. Trúng mục tiêu (nhấp nhô) +điểm. Trượt 3 lần -> thua.

const W = 340;
const H = 440;
const GRAV = 0.18;
const BALL_R = 9;
const TARGET_R = 20;
const CX = 34;
const CY = H - 30;
const BEST_KEY = 'game_cannon_best';

const randTarget = () => {
  const baseY = 70 + Math.random() * (H - 220);
  return { x: 150 + Math.random() * (W - 190), y: baseY, baseY, r: TARGET_R, phase: Math.random() * Math.PI * 2 };
};

// Từ tỉ lệ bàn ngắm (fx,fy in 0..1) -> điểm ngắm ảo trên sân.
const aimPoint = (fx, fy) => ({ ax: CX + fx * (W - CX - 12), ay: 12 + fy * (CY - 24) });
const velFromAim = (ax, ay) => {
  let vx = (ax - CX) * 0.15;
  let vy = (ay - CY) * 0.15;
  const sp = Math.hypot(vx, vy);
  const max = 15;
  const k = sp > max ? max / sp : 1;
  return { vx: vx * k, vy: vy * k };
};

export default function CannonApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [aimF, setAimF] = useState({ fx: 0.45, fy: 0.3 });
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };
  const padRef = useRef(null);
  const draggingRef = useRef(false);
  const musicRef = useRef(false);
  const comboRef = useRef(0);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  const newGame = () => {
    const a = aimPoint(0.45, 0.3);
    gRef.current = { ball: null, target: randTarget(), aim: a, particles: [], floaters: [], shake: makeShake(), frame: 0 };
    comboRef.current = 0;
    setScore(0);
    setLives(3);
    setCombo(0);
    setAimF({ fx: 0.45, fy: 0.3 });
    setNewRecord(false);
    setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let curScore = 0;
    let curLives = 3;
    const g = () => gRef.current;

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake);
      ctx.translate(ox, oy);
      // trời
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // mây
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      [[70, 60, 22], [230, 100, 26], [160, 44, 18]].forEach(([mx, my, mr]) => {
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.arc(mx + mr, my + 4, mr * 0.8, 0, Math.PI * 2); ctx.fill();
      });
      // đất
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, H - 16, W, 16);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, H - 16, W, 4);

      // mục tiêu (bóng bay)
      ctx.beginPath();
      ctx.fillStyle = '#f472b6';
      ctx.arc(gg.target.x, gg.target.y, gg.target.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.arc(gg.target.x - 6, gg.target.y - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(gg.target.x, gg.target.y + gg.target.r);
      ctx.lineTo(gg.target.x, gg.target.y + gg.target.r + 12);
      ctx.stroke();

      // đường bay dự đoán
      if (!gg.ball && gg.aim && !overRef.current) {
        let x = CX, y = CY;
        let { vx, vy } = velFromAim(gg.aim.ax, gg.aim.ay);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 80; i += 1) {
          x += vx; y += vy; vy += GRAV;
          if (y > H - 16 || x > W || x < 0) break;
          if (i % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); }
        }
      }

      // đại bác
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(CX, CY, 16, 0, Math.PI * 2);
      ctx.fill();
      if (gg.aim) {
        const { vx, vy } = velFromAim(gg.aim.ax, gg.aim.ay);
        const len = 26;
        const m = Math.hypot(vx, vy) || 1;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(CX + (vx / m) * len, CY + (vy / m) * len);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      drawParticles(ctx, gg.particles);
      if (gg.ball) {
        ctx.beginPath();
        ctx.fillStyle = '#334155';
        ctx.arc(gg.ball.x, gg.ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
    };

    const update = () => {
      const gg = g();
      gg.frame += 1;
      // mục tiêu nhấp nhô + trôi nhẹ khi điểm cao
      gg.target.y = gg.target.baseY + Math.sin(gg.frame * 0.05 + gg.target.phase) * 10;
      stepParticles(gg.particles);
      stepFloaters(gg.floaters);
      if (!gg.ball) return;
      gg.ball.x += gg.ball.vx;
      gg.ball.y += gg.ball.vy;
      gg.ball.vy += GRAV;

      const dx = gg.ball.x - gg.target.x;
      const dy = gg.ball.y - gg.target.y;
      if (dx * dx + dy * dy < (gg.target.r + BALL_R) ** 2) {
        comboRef.current += 1; setCombo(comboRef.current);
        const bonus = comboRef.current >= 2 ? comboRef.current : 0;
        const gained = 1 + bonus;
        curScore += gained; setScore(curScore);
        if (curScore > best) { setBest(curScore); try { localStorage.setItem(BEST_KEY, String(curScore)); } catch { /* ignore */ } }
        spawnBurst(gg.particles, gg.target.x, gg.target.y, ['#f472b6', '#fbcfe8', '#ffffff'], 20, { spread: 4.5 });
        addShake(gg.shake, 6);
        playSound('explode');
        if (comboRef.current >= 2) { playSound('combo', comboRef.current); spawnFloater(gg.floaters, gg.target.x, gg.target.y, `Combo x${comboRef.current}!`, '#f0abfc', { size: 16 }); }
        else spawnFloater(gg.floaters, gg.target.x, gg.target.y, `+${gained}`, '#fde047', { size: 18 });
        gg.ball = null;
        gg.target = randTarget();
        return;
      }
      if (gg.ball.x > W + 20 || gg.ball.x < -20 || gg.ball.y > H - 16) {
        // chạm đất -> tóe bụi
        if (gg.ball.y > H - 20) spawnBurst(gg.particles, gg.ball.x, H - 16, ['#a3a3a3', '#d4d4d4'], 8, { spread: 3 });
        gg.ball = null;
        comboRef.current = 0; setCombo(0);
        curLives -= 1;
        setLives(curLives);
        addShake(gg.shake, 5);
        playSound('wrong');
        if (curLives <= 0) {
          setOverBoth(true);
          killMusic();
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
    return () => { cancelAnimationFrame(raf); killMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bàn ngắm bên dưới: kéo -> đặt hướng (X) + lực (Y). Thả -> bắn.
  const setAimFromPad = (clientX, clientY) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const fx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const fy = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setAimF({ fx, fy });
    if (gRef.current) gRef.current.aim = aimPoint(fx, fy);
  };
  const fire = () => {
    const g = gRef.current;
    if (!g || g.ball || overRef.current || !g.aim) return;
    ensureMusic();
    const { vx, vy } = velFromAim(g.aim.ax, g.aim.ay);
    g.ball = { x: CX, y: CY, vx, vy };
    playSound('shoot');
  };
  const padDown = (e) => { draggingRef.current = true; setAimFromPad(e.clientX, e.clientY); };
  const padMove = (e) => { if (draggingRef.current) setAimFromPad(e.clientX, e.clientY); };
  const padUp = (e) => { if (draggingRef.current) { setAimFromPad(e.clientX, e.clientY); fire(); } draggingRef.current = false; };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">💥 Bắn pháo</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p>Kéo trong <b>bàn ngắm bên dưới</b>: qua trái/phải để đổi hướng, lên/xuống để chỉnh lực. Đường chấm trên sân cho biết bóng sẽ bay tới đâu — thả tay là bắn. Trúng bóng hồng để ghi điểm!</p>
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
          <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-2.5 py-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <Heart key={i} size={16} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
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

        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
            style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
          />
        </div>

        {/* Bàn ngắm bên dưới */}
        <div
          ref={padRef}
          onPointerDown={padDown}
          onPointerMove={padMove}
          onPointerUp={padUp}
          onPointerCancel={padUp}
          className="relative mt-1 h-20 w-full max-w-[420px] shrink-0 touch-none select-none overflow-hidden rounded-2xl bg-cyan-400/15"
        >
          <span className="pointer-events-none absolute left-2 top-1 text-[10px] font-black text-cyan-100/60">← hướng →</span>
          <span className="pointer-events-none absolute right-2 top-1 text-[10px] font-black text-cyan-100/60">↑ mạnh</span>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-black text-cyan-100/70">🎯 Kéo để ngắm · thả để bắn</span>
          <div
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-yellow-300 shadow"
            style={{ left: `${aimF.fx * 100}%`, top: `${aimF.fy * 100}%` }}
          />
        </div>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '💥'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết lượt rồi!'}</h2>
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
