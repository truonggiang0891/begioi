import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, ArrowLeft, ArrowRight, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake , setupCanvas } from './gameFx';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';

// --- GAME: BẮN ĐÁP ÁN / BẮN CHỮ (Answer Shooter) ---
// Lái thuyền tự bắn, bắn trúng đáp án/chữ ĐÚNG đang rơi. Chế độ: 'math' | 'letter'.
// Nâng cấp: particle trúng, hé lộ đáp án đúng khi sai (củng cố học), streak thưởng, nhạc nền.

const W = 320;
const H = 400;
const SHIP_W = 34;
const SHIP_H = 18;
const SHIP_Y = H - 26;
const BULLET_SPEED = 6;
const FIRE_EVERY = 16;
const BOX_W = 52;
const BOX_H = 34;
const REVEAL_FRAMES = 44; // thời gian hé lộ đáp án đúng khi bé làm sai
const BOX_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#f472b6'];
const LETTERS = 'ABCĐEGHIKLMNOPQRSTUVXY'.split('');

const randInt = (n) => Math.floor(Math.random() * n);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const makeMath = () => {
  const sub = Math.random() < 0.4;
  let a; let b; let ans; let text;
  if (sub) { a = 2 + randInt(8); b = 1 + randInt(a - 1); ans = a - b; text = `${a} - ${b} = ?`; }
  else { a = 1 + randInt(9); b = 1 + randInt(9); ans = a + b; text = `${a} + ${b} = ?`; }
  const opts = new Set([ans]);
  while (opts.size < 3) {
    const d = ans + (randInt(5) - 2);
    if (d >= 0 && d <= 20) opts.add(d);
  }
  return { text, answer: String(ans), options: shuffle([...opts]).map(String) };
};

const makeLetter = () => {
  const ans = LETTERS[randInt(LETTERS.length)];
  const opts = new Set([ans]);
  while (opts.size < 3) opts.add(LETTERS[randInt(LETTERS.length)]);
  return { text: `Tìm chữ  ${ans}`, answer: ans, options: shuffle([...opts]) };
};

export default function AnswerShooterApp({ onBack, mode = 'math', onReward, robuxBalance = 0 }) {
  const bestKey = `game_${mode}shooter_best`;
  const gen = mode === 'letter' ? makeLetter : makeMath;

  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const moveRef = useRef(0);
  const steerRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(W, H);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [over, setOver] = useState(false);
  const [question, setQuestion] = useState('');
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(bestKey), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const overRef = useRef(false);
  const setOverBoth = (v) => { overRef.current = v; setOver(v); };
  const musicRef = useRef(false);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  const spawnRound = (g) => {
    const q = gen();
    g.question = q;
    const n = q.options.length;
    const gap = W / (n + 1);
    g.boxes = shuffle(q.options).map((opt, i) => ({
      text: opt,
      correct: opt === q.answer,
      x: gap * (i + 1),
      y: 30 + randInt(20),
      color: BOX_COLORS[i % BOX_COLORS.length],
    }));
    g.reveal = 0;
    setQuestion(q.text);
  };

  const newGame = () => {
    const g = { ship: { x: W / 2 - SHIP_W / 2 }, bullets: [], boxes: [], question: null, frame: 0, fall: 0.42, streak: 0, reveal: 0, particles: [], floaters: [], shake: makeShake() };
    spawnRound(g);
    gRef.current = g;
    setScore(0);
    setLives(3);
    setStreak(0);
    setNewRecord(false);
    setOverBoth(false);
  };

  useEffect(() => {
    newGame();
    const ctx = setupCanvas(canvasRef.current, W, H);
    let raf = 0;
    let curScore = 0;
    let curLives = 3;
    const g = () => gRef.current;

    const enterReveal = (gg) => { gg.reveal = REVEAL_FRAMES; gg.bullets = []; };

    const loseAndReveal = (gg) => {
      curLives -= 1;
      setLives(curLives);
      gg.streak = 0; setStreak(0);
      addShake(gg.shake, 9);
      playSound('wrong');
      if (curLives <= 0) { setOverBoth(true); killMusic(); if (curScore > best) setNewRecord(true); return; }
      enterReveal(gg);
    };

    const draw = () => {
      const gg = g();
      ctx.save();
      const [ox, oy] = applyShake(gg.shake);
      ctx.translate(ox, oy);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#131c36');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // hộp đáp án
      gg.boxes.forEach((b) => {
        const revealing = gg.reveal > 0;
        if (revealing && !b.correct) ctx.globalAlpha = 0.35;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - BOX_W / 2, b.y - BOX_H / 2, BOX_W, BOX_H);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x - BOX_W / 2, b.y - BOX_H / 2, BOX_W, 4);
        ctx.globalAlpha = 1;
        if (revealing && b.correct) {
          const pulse = 2 + Math.sin(gg.frame * 0.4) * 1.5;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3 + pulse;
          ctx.strokeRect(b.x - BOX_W / 2 - 2, b.y - BOX_H / 2 - 2, BOX_W + 4, BOX_H + 4);
          ctx.lineWidth = 1;
        }
        ctx.fillStyle = '#0b1220';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, b.x, b.y + 1);
      });
      if (gg.reveal > 0) {
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✔ Đáp án đúng đây!', W / 2, 14);
      }
      drawParticles(ctx, gg.particles);
      ctx.fillStyle = '#fde047';
      gg.bullets.forEach((bl) => ctx.fillRect(bl.x - 2, bl.y - 8, 4, 10));
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(gg.ship.x + SHIP_W / 2, SHIP_Y);
      ctx.lineTo(gg.ship.x, SHIP_Y + SHIP_H);
      ctx.lineTo(gg.ship.x + SHIP_W, SHIP_Y + SHIP_H);
      ctx.closePath();
      ctx.fill();
      drawFloaters(ctx, gg.floaters);
      ctx.restore();
    };

    const update = () => {
      const gg = g();
      gg.frame += 1;
      gg.ship.x = Math.max(0, Math.min(W - SHIP_W, gg.ship.x + moveRef.current * 4));
      stepParticles(gg.particles);
      stepFloaters(gg.floaters);

      // đang hé lộ đáp án -> đứng yên đợi rồi sang câu mới
      if (gg.reveal > 0) {
        gg.reveal -= 1;
        if (gg.reveal === 0) spawnRound(gg);
        return;
      }

      if (gg.frame % FIRE_EVERY === 0) gg.bullets.push({ x: gg.ship.x + SHIP_W / 2, y: SHIP_Y });
      gg.bullets.forEach((bl) => { bl.y -= BULLET_SPEED; });
      gg.bullets = gg.bullets.filter((bl) => bl.y > -10);

      gg.boxes.forEach((b) => { b.y += gg.fall; });

      for (const bl of gg.bullets) {
        for (const b of gg.boxes) {
          if (bl.x > b.x - BOX_W / 2 && bl.x < b.x + BOX_W / 2 && bl.y < b.y + BOX_H / 2 && bl.y > b.y - BOX_H / 2) {
            bl.y = -100;
            if (b.correct) {
              gg.streak += 1; setStreak(gg.streak);
              const bonus = gg.streak >= 3 ? 1 : 0;
              const gained = 1 + bonus;
              curScore += gained; setScore(curScore);
              if (curScore > best) { setBest(curScore); try { localStorage.setItem(bestKey, String(curScore)); } catch { /* ignore */ } }
              gg.fall = Math.min(1.1, gg.fall + 0.03);
              spawnBurst(gg.particles, b.x, b.y, ['#34d399', '#ffffff'], 16, { spread: 4 });
              if (gg.streak >= 3) { playSound('combo', gg.streak); spawnFloater(gg.floaters, b.x, b.y, `Chuỗi x${gg.streak}!`, '#f0abfc', { size: 15 }); }
              else { playSound('correct'); spawnFloater(gg.floaters, b.x, b.y, `+${gained}`, '#86efac', { size: 15 }); }
              spawnRound(gg);
            } else {
              spawnBurst(gg.particles, b.x, b.y, ['#ef4444', '#fecaca'], 14, { spread: 4 });
              b.dead = true;
              gg.boxes = gg.boxes.filter((x) => !x.dead);
              loseAndReveal(gg);
            }
            break;
          }
        }
        if (gg.reveal > 0) break;
        gg.boxes = gg.boxes.filter((b) => !b.dead);
      }
      gg.bullets = gg.bullets.filter((bl) => bl.y > -10);

      if (gg.reveal > 0) return;

      // hộp chạm đáy
      if (gg.boxes.some((b) => b.y + BOX_H / 2 >= SHIP_Y)) {
        const missedCorrect = gg.boxes.some((b) => b.correct && b.y + BOX_H / 2 >= SHIP_Y);
        if (missedCorrect) {
          loseAndReveal(gg);
        } else {
          gg.boxes = gg.boxes.filter((b) => b.y + BOX_H / 2 < SHIP_Y);
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

  useEffect(() => {
    const onDown = (e) => { if (e.key === 'ArrowLeft') { moveRef.current = -1; ensureMusic(); } else if (e.key === 'ArrowRight') { moveRef.current = 1; ensureMusic(); } };
    const onUp = (e) => { if ((e.key === 'ArrowLeft' && moveRef.current === -1) || (e.key === 'ArrowRight' && moveRef.current === 1)) moveRef.current = 0; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STEER_GAIN = 2.2;
  const steer = (e) => {
    const isDown = e.type === 'pointerdown';
    if (!isDown && !(e.pointerType === 'touch' || e.buttons)) return;
    const g = gRef.current;
    if (!g) return;
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

  const title = mode === 'letter' ? '🔤 Bắn chữ' : '➕ Bắn đáp án';
  const winWord = mode === 'letter' ? 'chữ' : 'câu';

  return (
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">{title}</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p>Lái thuyền (kéo bên dưới hoặc nút ← →) — thuyền tự bắn. Bắn trúng ô <b>đúng</b> với câu hỏi phía trên. Trả lời đúng liên tiếp để lên <b>chuỗi thưởng</b>. Bắn sai hoặc để ô đúng rơi xuống đáy sẽ mất mạng — lúc đó ô đúng sẽ sáng lên cho bé nhớ.</p>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={newGame} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-2xl bg-white/10 px-3 py-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-lg font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-rose-400/15 px-2.5 py-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <Heart key={i} size={15} className={i < lives ? 'fill-rose-400 text-rose-400' : 'text-white/20'} />
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
            <Trophy size={14} className="text-amber-400" />
            <div className="text-lg font-black text-amber-300">{best}</div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-3 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={14} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-lg font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        {/* Câu hỏi + chuỗi */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-2xl bg-white/15 px-6 py-1.5 text-2xl font-black text-white">{question}</div>
          {streak >= 3 && <div className="rounded-full bg-fuchsia-500/30 px-2 py-1 text-xs font-black text-fuchsia-200">🔥 x{streak}</div>}
        </div>

        <div
          ref={fitRef}
          className="flex min-h-0 w-full flex-1 flex-col items-center justify-start pt-1 touch-none"
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
        </div>

        <div
          onPointerDown={steer}
          onPointerMove={steer}
          onPointerUp={endSteer}
          onPointerCancel={endSteer}
          className="mx-3 mt-1 flex h-14 w-full max-w-[420px] shrink-0 touch-none items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 text-xs font-black text-cyan-100/70"
        >
          ↔ Kéo qua lại để lái (kéo ngắn cũng đi xa)
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button type="button" aria-label="Trái" {...hold(-1)} className="flex h-14 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowLeft size={26} />
          </button>
          <button type="button" aria-label="Phải" {...hold(1)} className="flex h-14 w-20 touch-none items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5">
            <ArrowRight size={26} />
          </button>
        </div>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🎯'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết mạng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé trả lời đúng <span className="text-orange-500">{score}</span> {winWord}
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
