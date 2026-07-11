import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';
import { SoundToggle } from './gameUI';
import GameHelp from './GameHelp';
import Fireworks from './Fireworks';

// --- GAME: RẮN SĂN MỒI (Snake) ---
// Điều khiển rắn ăn mồi để dài ra, không đâm vào tường hoặc thân mình.
// Nâng cấp: mồi vàng (+5) & mồi băng (làm chậm), combo, hiệu ứng CSS, khiên 🛡️, nhạc nền.

const N = 15;
const BEST_KEY = 'game_snake_best';
const COMBO_MS = 1600;      // Khoảng thời gian để tính combo (ăn liên tiếp)
const SPECIAL_CHANCE = 0.014; // Xác suất sinh mồi đặc biệt mỗi bước
const SPECIAL_TTL = 5200;   // Mồi đặc biệt tồn tại (ms)
const SLOW_MS = 5000;       // Thời gian rắn bị làm chậm (ms)

const eq = (a, b) => a.r === b.r && a.c === b.c;

// Chọn ô trống ngẫu nhiên (tránh thân rắn và 1 ô "extra" cho trước).
const randFood = (snake, extra) => {
  const taken = new Set(snake.map((s) => `${s.r},${s.c}`));
  if (extra) taken.add(`${extra.r},${extra.c}`);
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
  return {
    snake,
    dir: { r: 0, c: 1 },
    food: randFood(snake),
    special: null,   // { r, c, type: 'gold'|'ice', expire }
    over: false,
    score: 0,
    combo: 0,
    lastEatAt: 0,
    slowUntil: 0,
    shield: true,    // 🛡️ đỡ 1 va chạm trong ván
    shieldSeq: 0,    // báo hiệu vừa dùng khiên
    eat: null,       // { seq, type, gain, r, c, combo } — sự kiện ăn mồi gần nhất
  };
};

const step = (g, now) => {
  if (g.over) return g;

  // Mồi đặc biệt hết hạn thì biến mất.
  let special = g.special;
  if (special && now > special.expire) special = null;

  const head = g.snake[0];
  const nh = { r: head.r + g.dir.r, c: head.c + g.dir.c };
  const hitWall = nh.r < 0 || nh.r >= N || nh.c < 0 || nh.c >= N;

  const willEatFood = !hitWall && eq(nh, g.food);
  const willEatSpecial = !hitWall && special && eq(nh, special);
  // Mồi thường & mồi vàng làm rắn dài ra; mồi băng thì không.
  const grow = willEatFood || (willEatSpecial && special.type === 'gold');

  const body = grow ? g.snake : g.snake.slice(0, -1);
  const hitBody = !hitWall && body.some((s) => eq(s, nh));

  // Va chạm: nếu còn khiên thì đỡ 1 lần (đứng yên, chờ bé đổi hướng).
  if (hitWall || hitBody) {
    if (g.shield) {
      return { ...g, special, shield: false, shieldSeq: (g.shieldSeq || 0) + 1 };
    }
    return { ...g, special, over: true };
  }

  const snake = [nh, ...g.snake];
  let { score, food, slowUntil, combo, lastEatAt } = g;
  let eat = g.eat;
  const nextSeq = (g.eat?.seq || 0) + 1;

  if (willEatFood) {
    score += 1;
    combo = now - lastEatAt <= COMBO_MS ? combo + 1 : 1;
    lastEatAt = now;
    food = randFood(snake, special);
    eat = { seq: nextSeq, type: 'normal', gain: 1, r: nh.r, c: nh.c, combo };
  } else if (willEatSpecial) {
    if (special.type === 'gold') {
      score += 5;
      combo = now - lastEatAt <= COMBO_MS ? combo + 1 : 1;
      lastEatAt = now;
      eat = { seq: nextSeq, type: 'gold', gain: 5, r: nh.r, c: nh.c, combo };
    } else {
      // Mồi băng: làm rắn chậm lại cho dễ chơi.
      slowUntil = now + SLOW_MS;
      eat = { seq: nextSeq, type: 'ice', gain: 0, r: nh.r, c: nh.c, combo };
    }
    special = null;
  }

  if (!grow) snake.pop();

  // Thỉnh thoảng sinh mồi đặc biệt (nếu chưa có).
  if (!special && Math.random() < SPECIAL_CHANCE) {
    const type = Math.random() < 0.62 ? 'gold' : 'ice';
    const cell = randFood(snake, food);
    special = { r: cell.r, c: cell.c, type, expire: now + SPECIAL_TTL };
  }

  return { ...g, snake, score, food, special, slowUntil, combo, lastEatAt, eat };
};

export default function SnakeApp({ onBack, onReward, robuxBalance = 0 }) {
  const [game, setGame] = useState(initGame);
  useScoreRewards(game.score, onReward);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [floaters, setFloaters] = useState([]); // { id, r, c, text, color }
  const [shakeKey, setShakeKey] = useState(0);
  const prevOver = useRef(false);
  const swipeStart = useRef(null);
  const musicRef = useRef(false);
  const fxSeq = useRef(0);
  const lastEatSeq = useRef(0);
  const lastShield = useRef(0);
  const { ref: fitRef, size: fitSize } = useFitSize(1, 1);

  // Tốc độ tăng theo điểm; nếu đang bị "băng" thì chậm lại.
  const baseSpeed = Math.max(90, 180 - Math.floor(game.score / 4) * 12);
  const slowActive = game.slowUntil ? Date.now() < game.slowUntil : false;
  const speed = slowActive ? Math.round(baseSpeed * 1.8) : baseSpeed;

  // Nhạc nền bật ở lần tương tác đầu (đổi hướng).
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  const addFloater = (r, c, text, color) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setFloaters((f) => [...f, { id, r, c, text, color }]);
    setTimeout(() => setFloaters((f) => f.filter((e) => e.id !== id)), 850);
  };

  const turn = useCallback((dr, dc) => {
    ensureMusic();
    setGame((g) => {
      if (g.over) return g;
      // Không cho quay đầu 180 độ.
      if (g.dir.r === -dr && g.dir.c === -dc) return g;
      if (g.dir.r === dr && g.dir.c === dc) return g;
      return { ...g, dir: { r: dr, c: dc } };
    });
  }, []);

  const restart = () => {
    prevOver.current = false;
    lastEatSeq.current = 0;
    lastShield.current = 0;
    setFloaters([]);
    setNewRecord(false);
    setGame(initGame());
  };

  // Vòng lặp di chuyển.
  useEffect(() => {
    if (game.over) return undefined;
    const id = setInterval(() => setGame((g) => step(g, Date.now())), speed);
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

  // Âm thanh + số bay lên khi ăn mồi.
  useEffect(() => {
    const e = game.eat;
    if (!e || e.seq === lastEatSeq.current) return;
    lastEatSeq.current = e.seq;
    if (e.type === 'ice') {
      playSound('powerup');
      addFloater(e.r, e.c, '❄️ Chậm', '#7dd3fc');
      return;
    }
    if (e.combo >= 2) {
      playSound('combo', e.combo);
      addFloater(e.r, e.c, `x${e.combo}`, '#f0abfc');
    } else {
      playSound('coin');
      addFloater(e.r, e.c, e.type === 'gold' ? '+5' : '+1', e.type === 'gold' ? '#fbbf24' : '#a7f3d0');
    }
  }, [game.eat]);

  // Khiên vừa đỡ va chạm.
  useEffect(() => {
    if (game.shieldSeq && game.shieldSeq !== lastShield.current) {
      lastShield.current = game.shieldSeq;
      playSound('break');
      setShakeKey((k) => k + 1);
    }
  }, [game.shieldSeq]);

  // Dừng nhạc khi rời game.
  useEffect(() => () => killMusic(), []);

  // Kết thúc + kỷ lục.
  useEffect(() => {
    if (game.over && !prevOver.current) {
      killMusic();
      setShakeKey((k) => k + 1);
      if (game.score > best) {
        setBest(game.score);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(game.score)); } catch { /* ignore */ }
      } else {
        playSound('lose');
      }
    }
    prevOver.current = game.over;
  }, [game.over, game.score, best]);

  const headKey = `${game.snake[0].r},${game.snake[0].c}`;
  const snakeIndex = new Map(game.snake.map((s, i) => [`${s.r},${s.c}`, i]));
  const foodKey = `${game.food.r},${game.food.c}`;
  const specialKey = game.special ? `${game.special.r},${game.special.c}` : null;
  const snakeLen = Math.max(1, game.snake.length - 1);

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
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🐍 Rắn săn mồi</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Vuốt hoặc bấm mũi tên để điều khiển rắn ăn mồi 🍎. Đừng đâm vào tường hay thân mình nhé!</p>
            <ul className="space-y-0.5">
              <li><span style={emojiFont}>🟡</span> <b>Mồi vàng</b> — được +5 điểm</li>
              <li><span style={emojiFont}>❄️</span> <b>Mồi băng</b> — rắn chạy chậm lại cho dễ</li>
              <li><span style={emojiFont}>🛡️</span> <b>Khiên</b> — đỡ giúp bé 1 lần va chạm</li>
              <li>Ăn nhiều mồi thật nhanh để lên <b>combo</b>!</li>
            </ul>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 py-3">
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          <div className="rounded-2xl bg-white/10 px-4 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{game.score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-4 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300/70">Cao nhất</div>
              <div className="text-xl font-black text-amber-300">{best}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-1.5" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300 text-yellow-400" />
            <div className="text-xl font-black text-amber-300">{robuxBalance}</div>
          </div>
          {game.shield && !game.over && (
            <div className="flex items-center gap-1 rounded-2xl bg-cyan-400/15 px-3 py-1.5" title="Khiên bảo vệ 1 lần">
              <span style={{ fontSize: 18, lineHeight: 1, ...emojiFont }}>🛡️</span>
            </div>
          )}
        </div>

        {/* Bàn cờ — lấp đầy không gian còn lại */}
        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          key={shakeKey}
          className="relative grid touch-none rounded-2xl bg-slate-950/70 p-1.5 shadow-[0_0_0_2px_rgba(52,211,153,0.4)]"
          style={{
            width: fitSize.w,
            height: fitSize.h,
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            gridTemplateRows: `repeat(${N}, 1fr)`,
            gap: 1,
            animation: shakeKey ? 'snake-shake 0.4s ease' : undefined,
          }}
          onPointerDown={onSwipeStart}
          onPointerUp={onSwipeEnd}
        >
          {Array.from({ length: N * N }, (_, i) => {
            const r = Math.floor(i / N);
            const c = i % N;
            const key = `${r},${c}`;
            const idx = snakeIndex.get(key);
            const isHead = key === headKey;
            const isBody = idx !== undefined && !isHead;
            const isFood = key === foodKey;
            const isSpecial = specialKey === key;
            let style;
            let child = null;
            if (isHead) {
              style = { background: 'linear-gradient(145deg,#6ee7b7,#059669)', borderRadius: '30%', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.5)' };
            } else if (isBody) {
              // Đuôi rắn gradient màu theo độ sâu (đậm dần về đuôi).
              const t = idx / snakeLen;
              style = {
                background: `linear-gradient(145deg, hsl(158 72% ${58 - t * 24}%), hsl(158 76% ${46 - t * 22}%))`,
                borderRadius: '25%',
              };
            } else if (isFood) {
              style = { background: 'radial-gradient(circle at 35% 35%,#fca5a5,#dc2626)', borderRadius: '50%', animation: 'snake-food 0.9s ease-in-out infinite' };
            } else if (isSpecial) {
              const gold = game.special.type === 'gold';
              style = {
                background: gold
                  ? 'radial-gradient(circle at 35% 30%,#fef08a,#f59e0b)'
                  : 'radial-gradient(circle at 35% 30%,#bae6fd,#38bdf8)',
                borderRadius: '50%',
                boxShadow: gold ? '0 0 6px rgba(250,204,21,.8)' : '0 0 6px rgba(56,189,248,.8)',
                animation: 'snake-food 0.7s ease-in-out infinite',
              };
              child = <span style={{ fontSize: '70%', lineHeight: 1, ...emojiFont }}>{gold ? '🟡' : '❄️'}</span>;
            } else {
              style = { background: 'rgba(255,255,255,0.04)', borderRadius: '20%' };
            }
            return (
              <div key={key} className="flex items-center justify-center" style={style}>{child}</div>
            );
          })}

          {/* Số điểm / combo bay lên khi ăn mồi */}
          {floaters.map((f) => (
            <div
              key={f.id}
              className="pointer-events-none absolute z-10 text-sm font-black md:text-base"
              style={{
                left: `${((f.c + 0.5) / N) * 100}%`,
                top: `${((f.r + 0.5) / N) * 100}%`,
                color: f.color,
                transform: 'translate(-50%,-50%)',
                textShadow: '0 1px 3px rgba(0,0,0,.7)',
                animation: 'snake-float 0.85s ease-out forwards',
              }}
            >
              {f.text}
            </div>
          ))}
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

      <style>{`
        @keyframes snake-food { 0%,100% { transform: scale(0.8); } 50% { transform: scale(1.06); } }
        @keyframes snake-float { from { opacity: 1; transform: translate(-50%,-50%) scale(1); } to { opacity: 0; transform: translate(-50%,-170%) scale(1.25); } }
        @keyframes snake-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
      `}</style>

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
