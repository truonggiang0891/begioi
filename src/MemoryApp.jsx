import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { playSound, emojiFont, loadUnlocked, saveUnlocked } from './gameAudio';
import Fireworks from './Fireworks';

const MEMORY_UNLOCK_KEY = 'game_memory_unlockedLevel';

// --- GAME 4: LẬT THẺ TÌM CẶP (Memory) ---
// Bé lật 2 thẻ, giống nhau thì giữ lại. Rèn trí nhớ, không giới hạn thời gian.

const EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐷', '🐔', '🦉', '🐢', '🐙', '🦋', '🐝', '🌸', '🍓', '🍎', '🚗', '🚀', '⭐', '🌈', '🎈'];

const LEVELS = [
  { id: 'easy', label: 'Dễ', pairs: 4, cols: 4 },
  { id: 'medium', label: 'Vừa', pairs: 6, cols: 4 },
  { id: 'hard', label: 'Khó', pairs: 8, cols: 4 },
];

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

function MemoryBoard({ level, nextLevel, frontier, onSolved, onNext }) {
  const [deck, setDeck] = useState(() => buildDeck(level.pairs));
  const [flipped, setFlipped] = useState([]); // các index đang lật (tối đa 2)
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [frozenFrontier] = useState(frontier);
  const timerRef = useRef(null);

  const won = matched === level.pairs;

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDeck(buildDeck(level.pairs));
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setLocked(false);
  }, [level.pairs]);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  // Báo cho cha khi thắng để mở khóa mức kế tiếp.
  useEffect(() => {
    if (won) onSolved?.();
  }, [won]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = (index) => {
    if (locked) return;
    const card = deck[index];
    if (card.matched || flipped.includes(index)) return;

    if (flipped.length === 0) {
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
      // Khớp!
      playSound('correct');
      timerRef.current = setTimeout(() => {
        setDeck((prev) =>
          prev.map((c, i) => (i === first || i === index ? { ...c, matched: true } : c)),
        );
        setFlipped([]);
        setMatched((cnt) => {
          const next = cnt + 1;
          if (next === level.pairs) playSound('win');
          return next;
        });
      }, 550);
    } else {
      // Không khớp -> úp lại
      playSound('wrong');
      setLocked(true);
      timerRef.current = setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 850);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm">
          Cặp: {matched}/{level.pairs}
        </span>
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm">
          Lượt: {moves}
        </span>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-orange-600 shadow-sm transition hover:bg-white"
        >
          <RotateCcw size={16} /> Ván mới
        </button>
      </div>

      <div
        className="grid gap-2.5"
        style={{
          width: 'min(96vw, 480px)',
          gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
        }}
      >
        {deck.map((card, index) => {
          const isUp = card.matched || flipped.includes(index);
          return (
            <button
              type="button"
              key={card.id}
              onClick={() => handleFlip(index)}
              className="relative aspect-square"
              style={{ perspective: '600px', touchAction: 'manipulation' }}
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
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span style={{ fontSize: '2.2rem', lineHeight: 1, ...emojiFont }}>{card.emoji}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {won && <Fireworks />}
      {won && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-6 py-4 text-center shadow-lg">
          <div className="flex items-center gap-2 text-2xl font-black text-emerald-600">
            <Sparkles className="text-amber-400" /> Tuyệt vời! <Sparkles className="text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            Bé đã tìm hết {level.pairs} cặp chỉ với {moves} lượt!
          </p>
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

export default function MemoryApp({ onBack, onReward }) {
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
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-violet-50 to-sky-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/50 bg-white/40 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-white"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-slate-700 md:text-2xl">🃏 Lật thẻ tìm cặp</h1>
        <div className="w-[76px]" />
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
          onNext={goNext}
        />
      </div>
    </div>
  );
}
