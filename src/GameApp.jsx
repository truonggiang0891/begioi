import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Eye, EyeOff, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { playSound, emojiFont, loadUnlocked, saveUnlocked } from './gameAudio';
import Fireworks from './Fireworks';

const PUZZLE_UNLOCK_KEY = 'game_puzzle_unlockedLevel';

// --- GAME 1: GHÉP HÌNH (chạm 2 ô để đổi chỗ) ---
// Bé chạm vào 1 ô rồi chạm ô khác -> hai ô đổi chỗ cho nhau.
// Không cần kéo thả nên rất nhẹ nhàng cho bé nhỏ.

const PICTURES = [
  { id: 'lion', emoji: '🦁', name: 'Sư tử', bg: 'from-amber-100 to-orange-200' },
  { id: 'elephant', emoji: '🐘', name: 'Voi con', bg: 'from-sky-100 to-blue-200' },
  { id: 'butterfly', emoji: '🦋', name: 'Bươm bướm', bg: 'from-fuchsia-100 to-purple-200' },
  { id: 'rainbow', emoji: '🌈', name: 'Cầu vồng', bg: 'from-pink-100 to-indigo-200' },
  { id: 'train', emoji: '🚂', name: 'Tàu hỏa', bg: 'from-emerald-100 to-teal-200' },
  { id: 'fish', emoji: '🐠', name: 'Cá vàng', bg: 'from-cyan-100 to-sky-200' },
  { id: 'unicorn', emoji: '🦄', name: 'Kỳ lân', bg: 'from-rose-100 to-pink-200' },
  { id: 'flower', emoji: '🌻', name: 'Hoa hướng dương', bg: 'from-yellow-100 to-amber-200' },
  { id: 'strawberry', emoji: '🍓', name: 'Dâu tây', bg: 'from-red-100 to-rose-200' },
  { id: 'turtle', emoji: '🐢', name: 'Rùa con', bg: 'from-lime-100 to-green-200' },
  { id: 'rocket', emoji: '🚀', name: 'Tên lửa', bg: 'from-indigo-100 to-violet-200' },
  { id: 'cake', emoji: '🎂', name: 'Bánh kem', bg: 'from-pink-100 to-rose-200' },
];

const LEVELS = [
  { id: 'easy', label: 'Dễ', n: 2 },
  { id: 'medium', label: 'Vừa', n: 3 },
  { id: 'hard', label: 'Khó', n: 4 },
];

const shuffled = (n) => {
  const count = n * n;
  const arr = Array.from({ length: count }, (_, i) => i);
  // Fisher-Yates, lặp lại đến khi không trùng lời giải.
  let tries = 0;
  do {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    tries += 1;
  } while (arr.every((v, i) => v === i) && tries < 20);
  return arr;
};

function PuzzleBoard({ picture, n, nextLevel, frontier, onSolved, onNext }) {
  const [order, setOrder] = useState(() => shuffled(n));
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [peek, setPeek] = useState(false);
  // "Cửa ải" hiện tại khi board này được mở — đóng băng để không đổi khi mở khóa mức mới.
  const [frozenFrontier] = useState(frontier);

  const reset = useCallback(() => {
    setOrder(shuffled(n));
    setSelected(null);
    setMoves(0);
    setSolved(false);
    setPeek(false);
  }, [n]);

  const handleTap = (pos) => {
    if (solved || peek) return;
    if (selected === null) {
      setSelected(pos);
      playSound('pop');
      return;
    }
    if (selected === pos) {
      setSelected(null);
      return;
    }
    const next = order.slice();
    [next[selected], next[pos]] = [next[pos], next[selected]];
    setSelected(null);
    setMoves((m) => m + 1);
    setOrder(next);

    const done = next.every((v, i) => v === i);
    if (done) {
      setSolved(true);
      playSound('win');
      onSolved?.();
    } else {
      playSound('pop');
    }
  };

  const cellPercent = 100 / n;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Thanh điều khiển nhỏ */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm">
          Số lần đổi: {moves}
        </span>
        <button
          type="button"
          onClick={() => setPeek((p) => !p)}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-indigo-600 shadow-sm transition hover:bg-white"
        >
          {peek ? <EyeOff size={16} /> : <Eye size={16} />}
          {peek ? 'Ẩn' : 'Xem tranh'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-orange-600 shadow-sm transition hover:bg-white"
        >
          <RotateCcw size={16} /> Xáo lại
        </button>
      </div>

      {/* Bảng ghép hình */}
      <div
        className="relative rounded-3xl bg-white/70 p-2 shadow-[0_10px_0_rgba(0,0,0,0.06)]"
        style={{ '--emoji': 'min(74vw, 300px)' }}
      >
        <div
          className="grid overflow-hidden rounded-2xl"
          style={{
            width: 'min(82vw, 340px)',
            height: 'min(82vw, 340px)',
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gap: solved ? 0 : 2,
            background: '#e2e8f0',
          }}
        >
          {order.map((pieceIndex, pos) => {
            const correct = pieceIndex === pos;
            const isSelected = selected === pos;
            const col = pieceIndex % n;
            const row = Math.floor(pieceIndex / n);
            return (
              <button
                type="button"
                key={pos}
                onClick={() => handleTap(pos)}
                className={`relative overflow-hidden bg-white transition-all duration-150 ${
                  isSelected ? 'z-10 scale-95 ring-4 ring-sky-500' : ''
                } ${correct && !solved && !isSelected ? 'ring-2 ring-emerald-300' : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                <div
                  className="pointer-events-none absolute flex items-center justify-center"
                  style={{
                    width: `${n * 100}%`,
                    height: `${n * 100}%`,
                    left: `${-col * 100}%`,
                    top: `${-row * 100}%`,
                  }}
                >
                  <span style={{ fontSize: 'var(--emoji)', lineHeight: 1, ...emojiFont }}>
                    {picture.emoji}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lớp xem gợi ý */}
        {peek && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/95">
            <span style={{ fontSize: 'min(60vw, 240px)', lineHeight: 1, ...emojiFont }}>
              {picture.emoji}
            </span>
          </div>
        )}
      </div>

      {/* Chúc mừng khi hoàn thành */}
      {solved && <Fireworks />}
      {solved && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-6 py-4 text-center shadow-lg">
          <div className="flex items-center gap-2 text-2xl font-black text-emerald-600">
            <Sparkles className="text-amber-400" /> Giỏi quá! <Sparkles className="text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            Bé đã ghép xong bức tranh {picture.name} rồi!
          </p>
          {nextLevel && frozenFrontier && (
            <p className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-700">
              🎉 Mở khóa mức {nextLevel.label} ({nextLevel.n}×{nextLevel.n})!
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
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-5 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5"
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

export default function GameApp({ onBack }) {
  const [selectedId, setSelectedId] = useState(null);
  const [levelId, setLevelId] = useState('easy');
  const [unlockedIndex, setUnlockedIndex] = useState(() => loadUnlocked(PUZZLE_UNLOCK_KEY));

  const picture = useMemo(
    () => PICTURES.find((p) => p.id === selectedId) || null,
    [selectedId],
  );
  const levelIndex = useMemo(() => {
    const i = LEVELS.findIndex((l) => l.id === levelId);
    return i < 0 ? 0 : i;
  }, [levelId]);
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] || null;

  // Khi bé chọn tranh mới, luôn bắt đầu lại từ mức dễ nhất.
  const openPicture = (id) => {
    setSelectedId(id);
    setLevelId('easy');
    playSound('pop');
  };

  // Hoàn thành mức -> mở khóa mức kế tiếp nếu đây là "cửa ải" hiện tại.
  const handleSolved = () => {
    if (levelIndex === unlockedIndex && levelIndex < LEVELS.length - 1) {
      const nv = levelIndex + 1;
      setUnlockedIndex(nv);
      saveUnlocked(PUZZLE_UNLOCK_KEY, nv);
    }
  };
  const goNext = () => {
    if (nextLevel) setLevelId(nextLevel.id);
  };

  // Đổi tranh/độ khó -> board mount lại nhờ key.
  const boardKey = `${selectedId}-${levelId}`;

  return (
    <div className={`flex h-full w-full flex-col bg-gradient-to-b ${picture ? picture.bg : 'from-orange-50 to-amber-100'}`}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/50 bg-white/40 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => (picture ? setSelectedId(null) : onBack?.())}
          className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-white"
        >
          <ChevronLeft size={18} /> {picture ? 'Chọn tranh' : 'Thoát'}
        </button>
        <h1 className="truncate text-lg font-black text-slate-700 md:text-2xl">
          {picture ? `Ghép hình: ${picture.name}` : '🧩 Ghép hình'}
        </h1>
        <div className="w-[92px]" />
      </div>

      {picture ? (
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
          {/* Chọn độ khó — mức khó chỉ mở khi đã vượt qua mức trước */}
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
                        ? 'bg-orange-500 text-white shadow'
                        : 'text-slate-500 hover:bg-white'
                  }`}
                >
                  {locked && <Lock size={13} />}
                  {l.label} ({l.n}×{l.n})
                </button>
              );
            })}
          </div>
          <p className="mb-4 text-center text-xs font-bold text-slate-400">
            {unlockedIndex >= LEVELS.length - 1
              ? '🌟 Bé đã mở hết các mức rồi, giỏi lắm!'
              : 'Ghép xong mức này để mở khóa mức khó hơn nhé! 🔒'}
          </p>

          <PuzzleBoard
            key={boardKey}
            picture={picture}
            n={level.n}
            nextLevel={nextLevel}
            frontier={levelIndex === unlockedIndex}
            onSolved={handleSolved}
            onNext={goNext}
          />
        </div>
      ) : (
        // Chọn tranh
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-4 text-center text-base font-bold text-slate-500">
            Bé chọn một bức tranh để ghép nhé!
          </p>
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            {PICTURES.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => openPicture(p.id)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b ${p.bg} p-2 shadow-[0_4px_0_rgba(0,0,0,0.08)] transition active:translate-y-0.5`}
              >
                <span style={{ fontSize: '2.6rem', lineHeight: 1, ...emojiFont }}>{p.emoji}</span>
                <span className="text-xs font-black text-slate-600">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
