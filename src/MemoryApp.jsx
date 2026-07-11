import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Sparkles, Lock, ArrowRight, Timer, Trophy, Gem, Flame } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont, loadUnlocked, saveUnlocked } from './gameAudio';
import Fireworks from './Fireworks';
import { SoundToggle } from './gameUI';

const MEMORY_UNLOCK_KEY = 'game_memory_unlockedLevel';
// Kỷ lục ít lượt nhất, mỗi mức 1 key riêng.
const bestKeyOf = (id) => `game_memory_best_${id}`;

// --- GAME 4: LẬT THẺ TÌM CẶP (Memory) ---
// Bé lật 2 thẻ, giống nhau thì giữ lại. Rèn trí nhớ.
// Nâng cấp: đồng hồ đếm giây, đếm lượt, kỷ lục ít lượt, combo, hiệu ứng lấp lánh + rung, nhạc nền 'calm'.

const EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐷', '🐔', '🦉', '🐢', '🐙', '🦋', '🐝', '🌸', '🍓', '🍎', '🚗', '🚀', '⭐', '🌈', '🎈'];

const LEVELS = [
  { id: 'easy', label: 'Dễ', pairs: 4, cols: 4 },
  { id: 'medium', label: 'Vừa', pairs: 6, cols: 4 },
  { id: 'hard', label: 'Khó', pairs: 8, cols: 4 },
];

const SPARK_DEG = [30, 90, 150, 210, 270, 330]; // hướng bắn của các đốm lấp lánh
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

let cardSeq = 0;
const buildDeck = (pairs) => {
  const pool = EMOJIS.slice();
  // Xáo pool rồi lấy `pairs` emoji.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, pairs);
  const deck = chosen.flatMap((emoji) => [
    { id: (cardSeq += 1), emoji, matched: false },
    { id: (cardSeq += 1), emoji, matched: false },
  ]);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

function MemoryBoard({ level, nextLevel, frontier, onSolved, onReward, robuxBalance, onNext }) {
  const [deck, setDeck] = useState(() => buildDeck(level.pairs));
  const [flipped, setFlipped] = useState([]); // các index đang lật (tối đa 2)
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [frozenFrontier] = useState(frontier);
  // Nâng cấp: đồng hồ, combo, kỷ lục, hiệu ứng.
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => {
    try { return parseInt(localStorage.getItem(bestKeyOf(level.id)), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [poppers, setPoppers] = useState([]); // id thẻ đang "pop"/lấp lánh
  const [shakeIds, setShakeIds] = useState([]); // id thẻ rung khi lật sai
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const comboRef = useRef(0);
  const musicRef = useRef(false);

  const won = matched === level.pairs;

  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('calm'); } };

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    comboRef.current = 0;
    setDeck(buildDeck(level.pairs));
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setLocked(false);
    setSeconds(0);
    setStarted(false);
    setCombo(0);
    setNewRecord(false);
    setPoppers([]);
    setShakeIds([]);
  }, [level.pairs]);

  // Dọn dẹp khi rời game: dừng đồng hồ + nhạc nền.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    killMusic();
  }, []);

  // Đồng hồ đếm giây: chạy khi đã bắt đầu và chưa thắng.
  useEffect(() => {
    if (started && !won) {
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(tickRef.current);
    }
    return undefined;
  }, [started, won]);

  // Khi thắng: mở khóa, lưu kỷ lục ít lượt, dừng nhạc.
  useEffect(() => {
    if (!won) return;
    onSolved?.();
    if (bestMoves === 0 || moves < bestMoves) {
      setBestMoves(moves);
      setNewRecord(true);
      try { localStorage.setItem(bestKeyOf(level.id), String(moves)); } catch { /* bỏ qua */ }
    }
    if (musicRef.current) { killMusic(); musicRef.current = false; }
  }, [won]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = (index) => {
    if (locked) return;
    const card = deck[index];
    if (card.matched || flipped.includes(index)) return;

    if (flipped.length === 0) {
      if (!started) setStarted(true); // khởi động đồng hồ ở lần lật đầu
      ensureMusic();                  // nhạc nền ở lần tương tác đầu
      setFlipped([index]);
      playSound('pop');
      return;
    }

    // Lật thẻ thứ hai
    const first = flipped[0];
    const pair = [first, index];
    setFlipped(pair);
    setMoves((m) => m + 1);

    if (deck[first].emoji === card.emoji) {
      // Khớp! -> cộng combo
      const firstId = deck[first].id;
      const secondId = card.id;
      comboRef.current += 1;
      const c = comboRef.current;
      setCombo(c);
      if (c >= 2) {
        // combo liên tiếp: âm combo theo bậc + thưởng Robux ở mốc 3/5/7
        playSound('combo', c);
        if (c === 3 || c === 5 || c === 7) onReward?.(1, `Combo x${c}! 🔥`);
      } else {
        playSound('correct');
      }
      // Hiệu ứng pop + lấp lánh trên 2 thẻ trước khi giữ lại
      setPoppers((p) => [...p, firstId, secondId]);
      setTimeout(() => setPoppers((p) => p.filter((id) => id !== firstId && id !== secondId)), 650);
      timerRef.current = setTimeout(() => {
        setDeck((prev) =>
          prev.map((c2, i) => (i === first || i === index ? { ...c2, matched: true } : c2)),
        );
        setFlipped([]);
        setMatched((cnt) => {
          const next = cnt + 1;
          if (next === level.pairs) playSound('win');
          return next;
        });
      }, 550);
    } else {
      // Không khớp -> úp lại + rung + reset combo
      playSound('wrong');
      comboRef.current = 0;
      setCombo(0);
      setLocked(true);
      setShakeIds([deck[first].id, card.id]);
      timerRef.current = setTimeout(() => {
        setFlipped([]);
        setLocked(false);
        setShakeIds([]);
      }, 850);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Hàng chỉ số: Cặp / Lượt / Thời gian / Kỷ lục / Robux / Ván mới */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm">
          Cặp: {matched}/{level.pairs}
        </span>
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm">
          Lượt: {moves}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm" title="Thời gian">
          <Timer size={15} className="text-sky-500" /> {fmtTime(seconds)}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-amber-700 shadow-sm" title="Kỷ lục ít lượt nhất">
          <Trophy size={15} className="text-amber-500" /> {bestMoves > 0 ? bestMoves : '--'}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-amber-700 shadow-sm" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-500" /> {robuxBalance}
        </span>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-orange-600 shadow-sm transition hover:bg-white"
        >
          <RotateCcw size={16} /> Ván mới
        </button>
      </div>

      {/* Băng-rôn combo */}
      {combo >= 2 && !won && (
        <div className="pointer-events-none -mt-1 flex items-center gap-1 text-sm font-black text-fuchsia-600 drop-shadow" style={{ animation: 'mem-combo 0.4s ease' }}>
          <Flame size={16} className="text-orange-500" /> Combo x{combo}!
        </div>
      )}

      <div
        className="grid gap-2.5"
        style={{
          width: 'min(96vw, 480px)',
          gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
        }}
      >
        {deck.map((card, index) => {
          const isUp = card.matched || flipped.includes(index);
          const isPopping = poppers.includes(card.id);
          const isShaking = shakeIds.includes(card.id);
          return (
            <button
              type="button"
              key={card.id}
              onClick={() => handleFlip(index)}
              className="relative aspect-square"
              style={{
                perspective: '600px',
                touchAction: 'manipulation',
                animation: isShaking ? 'mem-shake 0.4s ease' : undefined,
              }}
            >
              <div
                className="relative h-full w-full transition-transform duration-300"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Mặt sau (úp) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-[0_4px_0_rgba(0,0,0,0.12)]"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-2xl text-white/80">❓</span>
                </div>
                {/* Mặt trước (ngửa) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.08)] ${
                    card.matched ? 'bg-emerald-100 ring-2 ring-emerald-300' : 'bg-white'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    animation: isPopping ? 'mem-pop 0.6s ease' : undefined,
                  }}
                >
                  <span style={{ fontSize: '2.2rem', lineHeight: 1, ...emojiFont }}>{card.emoji}</span>
                  {/* Đốm lấp lánh khi ăn được cặp */}
                  {isPopping &&
                    SPARK_DEG.map((deg) => (
                      <span
                        key={deg}
                        className="pointer-events-none absolute left-1/2 top-1/2 block h-1.5 w-1.5 rounded-full bg-amber-300"
                        style={{
                          '--dx': `${Math.cos((deg * Math.PI) / 180) * 30}px`,
                          '--dy': `${Math.sin((deg * Math.PI) / 180) * 30}px`,
                          animation: 'mem-spark 0.6s ease-out forwards',
                        }}
                      />
                    ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes mem-pop { 0% { transform: rotateY(180deg) scale(1); } 45% { transform: rotateY(180deg) scale(1.16); filter: brightness(1.25); } 100% { transform: rotateY(180deg) scale(1); } }
        @keyframes mem-spark { from { transform: translate(-50%,-50%) scale(1); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.4); opacity: 0; } }
        @keyframes mem-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-3px); } }
        @keyframes mem-combo { from { transform: scale(0.7); opacity: 0.4; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {won && <Fireworks />}
      {won && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-6 py-4 text-center shadow-lg">
          <div className="flex items-center gap-2 text-2xl font-black text-emerald-600">
            <Sparkles className="text-amber-400" /> Tuyệt vời! <Sparkles className="text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            Bé tìm hết {level.pairs} cặp trong {fmtTime(seconds)}, chỉ {moves} lượt!
          </p>
          {newRecord && (
            <p className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-700">
              🏆 Kỷ lục mới! Ít lượt nhất mức {level.label}!
            </p>
          )}
          {nextLevel && frozenFrontier && (
            <p className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-700">
              🎉 Mở khóa mức {nextLevel.label} ({nextLevel.pairs} cặp)!
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-white px-5 py-2.5 text-base font-black text-emerald-600 shadow-[0_4px_0_rgb(203,213,225)] ring-2 ring-emerald-200 transition active:translate-y-0.5"
            >
              Chơi lại 🔁
            </button>
            {nextLevel && (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-500 px-5 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(79,70,229)] transition active:translate-y-0.5"
              >
                Mức {nextLevel.label} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemoryApp({ onBack, onReward, robuxBalance = 0 }) {
  const [levelId, setLevelId] = useState('easy');
  const [unlockedIndex, setUnlockedIndex] = useState(() => loadUnlocked(MEMORY_UNLOCK_KEY));
  const rewardedRef = useRef(new Set()); // mỗi mức chỉ thưởng Robux 1 lần/phiên

  const levelIndex = useMemo(() => {
    const i = LEVELS.findIndex((l) => l.id === levelId);
    return i < 0 ? 0 : i;
  }, [levelId]);
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] || null;

  const handleSolved = () => {
    if (levelIndex === unlockedIndex && levelIndex < LEVELS.length - 1) {
      const nv = levelIndex + 1;
      setUnlockedIndex(nv);
      saveUnlocked(MEMORY_UNLOCK_KEY, nv);
    }
    if (!rewardedRef.current.has(levelId)) {
      rewardedRef.current.add(levelId);
      onReward?.([1, 2, 3][levelIndex] || 1, `Xong mức ${level.label}`);
    }
  };
  const goNext = () => {
    if (nextLevel) setLevelId(nextLevel.id);
  };

  return (
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-violet-50 to-sky-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/50 bg-white/40 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-white"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-slate-700 md:text-2xl">🃏 Lật thẻ tìm cặp</h1>
        <SoundToggle />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-sm">
          {LEVELS.map((l, idx) => {
            const locked = idx > unlockedIndex;
            const active = levelId === l.id;
            return (
              <button
                type="button"
                key={l.id}
                disabled={locked}
                onClick={() => !locked && setLevelId(l.id)}
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-black transition ${
                  locked
                    ? 'cursor-not-allowed text-slate-300'
                    : active
                      ? 'bg-indigo-500 text-white shadow'
                      : 'text-slate-500 hover:bg-white'
                }`}
              >
                {locked && <Lock size={13} />}
                {l.label} ({l.pairs} cặp)
              </button>
            );
          })}
        </div>
        <p className="mb-4 text-center text-xs font-bold text-slate-400">
          {unlockedIndex >= LEVELS.length - 1
            ? '🌟 Bé đã mở hết các mức rồi, giỏi lắm!'
            : 'Thắng mức này để mở khóa mức khó hơn nhé! 🔒'}
        </p>

        <MemoryBoard
          key={levelId}
          level={level}
          nextLevel={nextLevel}
          frontier={levelIndex === unlockedIndex}
          onSolved={handleSolved}
          onReward={onReward}
          robuxBalance={robuxBalance}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
