import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import { useFitSize } from './useFitSize';
import Fireworks from './Fireworks';

// --- GAME: RẮN SĂN MỒI (Snake) ---
// Điều khiển rắn ăn mồi để dài ra, không đâm vào tường hoặc thân mình.

const N = 15;
const BEST_KEY = 'game_snake_best';

const eq = (a, b) => a.r === b.r && a.c === b.c;

const randFood = (snake) => {
  const taken = new Set(snake.map((s) => `${s.r},${s.c}`));
  const free = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      if (!taken.has(`${r},${c}`)) free.push({ r, c });
    }
  }
  return free[Math.floor(Math.random() * free.length)] || { r: 0, c: 0 };
};

const initGame = () => {
  const snake = [{ r: 7, c: 7 }, { r: 7, c: 6 }, { r: 7, c: 5 }];
  return { snake, dir: { r: 0, c: 1 }, food: randFood(snake), over: false, score: 0 };
};

const step = (g) => {
  if (g.over) return g;
  const head = g.snake[0];
  const nh = { r: head.r + g.dir.r, c: head.c + g.dir.c };

  // Đâm tường?
  if (nh.r < 0 || nh.r >= N || nh.c < 0 || nh.c >= N) return { ...g, over: true };
  // Đâm thân? (bỏ đuôi vì đuôi sẽ di chuyển đi, trừ khi vừa ăn)
  const willEat = eq(nh, g.food);
  const body = willEat ? g.snake : g.snake.slice(0, -1);
  if (body.some((s) => eq(s, nh))) return { ...g, over: true };

  const snake = [nh, ...g.snake];
  if (willEat) {
    return { ...g, snake, food: randFood(snake), score: g.score + 1 };
  }
  snake.pop();
  return { ...g, snake };
};

export default function SnakeApp({ onBack }) {
  const [game, setGame] = useState(initGame);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const prevScore = useRef(0);
  const prevOver = useRef(false);
  const swipeStart = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(1, 1);

  const speed = Math.max(90, 180 - Math.floor(game.score / 4) * 12);

  const turn = useCallback((dr, dc) => {
    setGame((g) => {
      if (g.over) return g;
      // Không cho quay đầu 180 độ.
      if (g.dir.r === -dr && g.dir.c === -dc) return g;
      if (g.dir.r === dr && g.dir.c === dc) return g;
      return { ...g, dir: { r: dr, c: dc } };
    });
  }, []);

  const restart = () => {
    prevScore.current = 0;
    prevOver.current = false;
    setNewRecord(false);
    setGame(initGame());
  };

  // Vòng lặp di chuyển.
  useEffect(() => {
    if (game.over) return undefined;
    const id = setInterval(() => setGame((g) => step(g)), speed);
    return () => clearInterval(id);
  }, [game.over, speed]);

  // Bàn phím.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp') turn(-1, 0);
      else if (e.key === 'ArrowDown') turn(1, 0);
      else if (e.key === 'ArrowLeft') turn(0, -1);
      else if (e.key === 'ArrowRight') turn(0, 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  // Âm thanh ăn mồi.
  useEffect(() => {
    if (game.score > prevScore.current) playSound('pop');
    prevScore.current = game.score;
  }, [game.score]);

  // Kết thúc + kỷ lục.
  useEffect(() => {
    if (game.over && !prevOver.current) {
      if (game.score > best) {
        setBest(game.score);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(game.score)); } catch { /* ignore */ }
      } else {
        playSound('wrong');
      }
    }
    prevOver.current = game.over;
  }, [game.over, game.score, best]);

  const headKey = `${game.snake[0].r},${game.snake[0].c}`;
  const bodySet = new Set(game.snake.slice(1).map((s) => `${s.r},${s.c}`));
  const foodKey = `${game.food.r},${game.food.c}`;

  const onSwipeStart = (e) => { swipeStart.current = { x: e.clientX, y: e.clientY }; };
  const onSwipeEnd = (e) => {
    const s = swipeStart.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(0, dx > 0 ? 1 : -1);
    else turn(dy > 0 ? 1 : -1, 0);
    swipeStart.current = null;
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🐍 Rắn săn mồi</h1>
        <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 py-3">
        <div className="flex shrink-0 items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{game.score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-5 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300/70">Cao nhất</div>
              <div className="text-xl font-black text-amber-300">{best}</div>
            </div>
          </div>
        </div>

        {/* Bàn cờ — lấp đầy không gian còn lại */}
        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="grid touch-none rounded-2xl bg-slate-950/70 p-1.5 shadow-[0_0_0_2px_rgba(52,211,153,0.4)]"
          style={{
            width: fitSize.w,
            height: fitSize.h,
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            gridTemplateRows: `repeat(${N}, 1fr)`,
            gap: 1,
          }}
          onPointerDown={onSwipeStart}
          onPointerUp={onSwipeEnd}
        >
          {Array.from({ length: N * N }, (_, i) => {
            const r = Math.floor(i / N);
            const c = i % N;
            const key = `${r},${c}`;
            const isHead = key === headKey;
            const isBody = bodySet.has(key);
            const isFood = key === foodKey;
            let cls = 'rounded-[20%] ';
            let style;
            if (isHead) style = { background: 'linear-gradient(145deg,#6ee7b7,#059669)', borderRadius: '25%', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.5)' };
            else if (isBody) style = { background: 'linear-gradient(145deg,#34d399,#10b981)', borderRadius: '25%' };
            else if (isFood) style = { background: 'radial-gradient(circle at 35% 35%,#fca5a5,#dc2626)', borderRadius: '50%' };
            else style = { background: 'rgba(255,255,255,0.04)', borderRadius: '20%' };
            return <div key={key} className={cls} style={style} />;
          })}
        </div>
        </div>

        {/* Nút 4 hướng */}
        <div className="grid shrink-0 grid-cols-3 gap-2" style={{ width: 172 }}>
          <div />
          <DirBtn onClick={() => turn(-1, 0)} label="Lên"><ArrowUp size={24} /></DirBtn>
          <div />
          <DirBtn onClick={() => turn(0, -1)} label="Trái"><ArrowLeft size={24} /></DirBtn>
          <DirBtn onClick={() => turn(1, 0)} label="Xuống"><ArrowDown size={24} /></DirBtn>
          <DirBtn onClick={() => turn(0, 1)} label="Phải"><ArrowRight size={24} /></DirBtn>
        </div>
      </div>

      {game.over && newRecord && <Fireworks />}
      {game.over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🐍'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Ôi, đụng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé ăn được <span className="text-emerald-600">{game.score}</span> mồi
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(5,150,105)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DirBtn({ onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-14 items-center justify-center rounded-2xl bg-white/15 font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] transition hover:bg-white/25 active:translate-y-0.5"
    >
      {children}
    </button>
  );
}
