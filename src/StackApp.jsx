import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Gem, Flame } from 'lucide-react';
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

// --- GAME: XẾP THÁP (Stack) ---
// Khối trượt qua lại; chạm để thả chồng lên khối dưới. Phần lệch ra ngoài bị cắt
// rơi đi, khối hẹp dần. Thả trúng khít (perfect) thì không mất phần nào + nới rộng.

const W = 340;
const H = 540;
const BH = 34;              // chiều cao mỗi khối
const BASE_W = 210;         // bề rộng khối đầu
const BASE_Y = H - 60;      // đáy tháp
const PERFECT_TOL = 6;      // sai số coi là "khít"
const hueColor = (i) => `hsl(${(i * 26) % 360} 68% 60%)`;

export default function StackApp({ onBack, onReward, robuxBalance = 0 }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const dropRef = useRef(false);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem('game_stack_best'), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };
  const musicRef = useRef(false);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('calm'); } };

  const newGame = () => {
    const g = {
      blocks: [{ x: W / 2 - BASE_W / 2, w: BASE_W, color: hueColor(0) }],
      moving: null, fallings: [], particles: [], floaters: [], shake: makeShake(),
      speed: 2.2, dir: 1, combo: 0, cameraY: 0, frame: 0, flash: 0,
    };
    const top = g.blocks[0];
    g.moving = { x: 0, w: top.w, color: hueColor(1) };
    gRef.current = g;
    dropRef.current = false;
    setScore(0); setCombo(0); setNewRecord(false); setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = setupCanvas(canvasRef.current, W, H);
    let raf = 0; let curScore = 0;
    const g = () => gRef.current;
    const bumpBest = () => { if (curScore > best) { setBest(curScore); try { localStorage.setItem('game_stack_best', String(curScore)); } catch { /* ignore */ } } };

    const blockY = (idx) => BASE_Y - idx * BH;

    const doDrop = () => {
      const gg = g();
      const prev = gg.blocks[gg.blocks.length - 1];
      const m = gg.moving;
      const oL = Math.max(m.x, prev.x);
      const oR = Math.min(m.x + m.w, prev.x + prev.w);
      const overlap = oR - oL;
      const yTop = blockY(gg.blocks.length);
      if (overlap <= 0) {
        // trượt ra ngoài -> khối rơi, thua
        gg.fallings.push({ x: m.x, y: yTop, w: m.w, color: m.color, vy: 0, vx: m.x < prev.x ? -2 : 2, rot: 0, vr: 0.1 });
        setOverBoth(true); killMusic();
        addShake(gg.shake, 10);
        if (curScore > best) setNewRecord(true); else playSound('lose');
        return;
      }
      const perfect = Math.abs(m.x - prev.x) <= PERFECT_TOL;
      let nx = oL; let nw = overlap;
      if (perfect) {
        nx = prev.x; nw = Math.min(BASE_W, prev.w + 8); // khít -> nới rộng chút
        gg.combo += 1; setCombo(gg.combo);
        gg.flash = 8;
        spawnBurst(gg.particles, prev.x + prev.w / 2, yTop + BH / 2, ['#ffffff', '#fde047'], 12, { spread: 3.5 });
        spawnFloater(gg.floaters, prev.x + prev.w / 2, yTop, gg.combo >= 2 ? `KHÍT x${gg.combo}!` : 'KHÍT!', '#fde047', { size: 15 });
        playSound(gg.combo >= 2 ? 'combo' : 'correct', gg.combo);
      } else {
        gg.combo = 0; setCombo(0);
        // phần thừa rơi
        if (m.x < oL) gg.fallings.push({ x: m.x, y: yTop, w: oL - m.x, color: m.color, vy: 0, vx: -1.5, rot: 0, vr: 0.12 });
        if (m.x + m.w > oR) gg.fallings.push({ x: oR, y: yTop, w: m.x + m.w - oR, color: m.color, vy: 0, vx: 1.5, rot: 0, vr: -0.12 });
        playSound('pop');
      }
      gg.blocks.push({ x: nx, w: nw, color: m.color });
      curScore += 1; setScore(curScore); bumpBest();
      // khối kế
      gg.speed = Math.min(6, 2.2 + gg.blocks.length * 0.12);
      gg.dir = gg.blocks.length % 2 === 0 ? 1 : -1;
      gg.moving = { x: gg.dir === 1 ? 0 : W - nw, w: nw, color: hueColor(gg.blocks.length) };
    };

    const update = () => {
      const gg = g();
      gg.frame += 1;
      stepParticles(gg.particles); stepFloaters(gg.floaters);
      if (gg.flash > 0) gg.flash -= 1;
      // khối rơi
      gg.fallings.forEach((f) => { f.vy += 0.5; f.y += f.vy; f.x += f.vx; f.rot += f.vr; });
      gg.fallings = gg.fallings.filter((f) => f.y < H + 200);

      if (!overRef.current) {
        // trượt khối
        const m = gg.moving;
        m.x += gg.dir * gg.speed;
        if (m.x <= 0) { m.x = 0; gg.dir = 1; }
        if (m.x + m.w >= W) { m.x = W - m.w; gg.dir = -1; }
        if (dropRef.current) { dropRef.current = false; doDrop(); }
        // camera trượt lên khi tháp cao
        const target = Math.max(0, gg.blocks.length * BH - H * 0.5);
        gg.cameraY += (target - gg.cameraY) * 0.12;
      }
    };

    const drawBlock = (b, y) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, y, b.w, BH - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x, y, b.w, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(b.x, y + BH - 6, b.w, 4);
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake); ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0ea5e9'); bg.addColorStop(1, '#a5f3fc');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (gg.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${gg.flash / 24})`; ctx.fillRect(0, 0, W, H); }

      ctx.save();
      ctx.translate(0, gg.cameraY);
      // tháp
      gg.blocks.forEach((b, i) => drawBlock(b, blockY(i)));
      // khối đang trượt
      if (!overRef.current) drawBlock(gg.moving, blockY(gg.blocks.length));
      // khối rơi (xoay)
      gg.fallings.forEach((f) => {
        ctx.save();
        ctx.translate(f.x + f.w / 2, f.y + BH / 2); ctx.rotate(f.rot);
        ctx.fillStyle = f.color; ctx.fillRect(-f.w / 2, -BH / 2, f.w, BH - 2);
        ctx.restore();
      });
      drawParticles(ctx, gg.particles);
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
      ctx.restore();
    };

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop); };
    draw(); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); killMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = () => { if (overRef.current) return; ensureMusic(); dropRef.current = true; };
  const restart = () => newGame();

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-sky-500 to-cyan-300">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/20 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🗼 Xếp tháp</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p>Khối trượt qua lại — <b>chạm để thả</b> chồng lên khối dưới. Phần lệch ra ngoài bị <b>cắt bớt</b>, khối hẹp dần. Thả thật <b>khít</b> thì không mất phần nào và còn được nới rộng ra. Xếp càng cao càng giỏi!</p>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        <div className="rounded-2xl bg-white/30 px-4 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-sky-900/60">Tầng</div>
          <div className="text-xl font-black text-sky-900">{score}</div>
        </div>
        {combo >= 2 && (
          <div className="flex items-center gap-1 rounded-2xl bg-orange-400/30 px-3 py-1.5 text-orange-800">
            <Flame size={15} /> <span className="text-lg font-black">x{combo}</span>
          </div>
        )}
        <div className="flex items-center gap-1 rounded-2xl bg-white/30 px-3 py-1.5">
          <Trophy size={15} className="text-amber-600" />
          <div className="text-lg font-black text-amber-800">{best}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/30 px-3 py-1.5" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-600" />
          <div className="text-lg font-black text-amber-800">{robuxBalance}</div>
        </div>
      </div>

      <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center px-1 touch-none" onPointerDown={tap}>
        <canvas
          ref={canvasRef} width={W} height={H}
          className="touch-none rounded-2xl shadow-[0_0_0_2px_rgba(255,255,255,0.5)]"
          style={{ width: fitSize.w, height: fitSize.h, display: 'block' }}
        />
      </div>
      <div className="mx-3 mb-2 mt-1 shrink-0 rounded-2xl bg-white/25 py-2 text-center text-xs font-black text-white/90">
        👆 Chạm bất kỳ đâu để thả khối
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🗼'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Đổ mất rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé xếp được <span className="text-orange-500">{score}</span> tầng
              {newRecord ? ' — cao nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
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
