import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Eye, EyeOff, Sparkles, Lock, ArrowRight, Lightbulb, Timer, Move, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont, loadUnlocked, saveUnlocked } from './gameAudio';
import { SoundToggle } from './gameUI';
import Fireworks from './Fireworks';

const PUZZLE_UNLOCK_KEY = 'game_puzzle_unlockedLevel';
// Kỷ lục ít nước nhất — key riêng theo cỡ lưới.
const bestMovesKey = (n) => `game_puzzle_best_moves_${n}`;
const HINTS_PER_GAME = 3;

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
  { id: 'expert', label: 'Cực khó', n: 5 },
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

// mm:ss cho đồng hồ.
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function PuzzleBoard({ picture, n, nextLevel, frontier, robuxBalance, onSolved, onNext, ensureMusic }) {
  const [order, setOrder] = useState(() => shuffled(n));
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [peek, setPeek] = useState(false);
  // "Cửa ải" hiện tại khi board này được mở — đóng băng để không đổi khi mở khóa mức mới.
  const [frozenFrontier] = useState(frontier);

  // Đồng hồ + trạng thái đã bắt đầu ván (bắt đầu tính khi bé chạm ô đầu tiên).
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  // Kỷ lục ít nước nhất cho cỡ lưới này.
  const [best, setBest] = useState(() => {
    try { const v = parseInt(localStorage.getItem(bestMovesKey(n)), 10); return Number.isFinite(v) ? v : null; } catch { return null; }
  });
  const [newRecord, setNewRecord] = useState(false);
  // Gợi ý: cặp ô nên đổi chỗ đang nhấp sáng + số lần còn lại.
  const [hintPair, setHintPair] = useState(null); // [a, b] hoặc null
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_GAME);
  // Các ô vừa về đúng vị trí -> nhấp sáng scale nhẹ.
  const [pulse, setPulse] = useState([]);
  const hintTimer = useRef(null);
  const pulseTimer = useRef(null);

  // Đồng hồ chạy khi đã bắt đầu và chưa xong.
  useEffect(() => {
    if (!started || solved) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, solved]);

  // Dọn timer khi rời board.
  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  const reset = useCallback(() => {
    setOrder(shuffled(n));
    setSelected(null);
    setMoves(0);
    setSolved(false);
    setPeek(false);
    setSeconds(0);
    setStarted(false);
    setNewRecord(false);
    setHintPair(null);
    setHintsLeft(HINTS_PER_GAME);
    setPulse([]);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, [n]);

  // Nhấp sáng các ô vừa về đúng vị trí.
  const flashCorrect = (positions) => {
    if (!positions.length) return;
    setPulse(positions);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse([]), 650);
  };

  const handleTap = (pos) => {
    if (solved || peek) return;
    ensureMusic?.();
    if (!started) setStarted(true);
    if (hintPair) setHintPair(null); // chạm là tắt gợi ý
    if (selected === null) {
      setSelected(pos);
      playSound('pop');
      return;
    }
    if (selected === pos) {
      setSelected(null);
      return;
    }
    const a = selected;
    const wasA = order[a] === a;
    const wasB = order[pos] === pos;
    const next = order.slice();
    [next[a], next[pos]] = [next[pos], next[a]];
    setSelected(null);
    setMoves((m) => m + 1);
    setOrder(next);

    const done = next.every((v, i) => v === i);
    if (done) {
      setSolved(true);
      playSound('win');
      // Ghi nhận kỷ lục ít nước nhất.
      const finalMoves = moves + 1;
      if (best == null || finalMoves < best) {
        setBest(finalMoves);
        setNewRecord(true);
        try { localStorage.setItem(bestMovesKey(n), String(finalMoves)); } catch { /* ignore */ }
      }
      onSolved?.();
    } else {
      // Ô nào vừa về đúng vị trí thì nhấp sáng.
      const nowCorrect = [];
      if (!wasA && next[a] === a) nowCorrect.push(a);
      if (!wasB && next[pos] === pos) nowCorrect.push(pos);
      if (nowCorrect.length) {
        flashCorrect(nowCorrect);
        playSound('correct');
      } else {
        playSound('whoosh');
      }
    }
  };

  // Gợi ý: tìm 1 ô đang sai + vị trí đúng của nó, nhấp sáng ~1.5s.
  const showHint = () => {
    if (solved || peek || hintsLeft <= 0) return;
    ensureMusic?.();
    // a: một ô đang sai; b: nơi đang giữ mảnh thuộc về vị trí a.
    const a = order.findIndex((v, i) => v !== i);
    if (a < 0) return;
    const b = order.indexOf(a);
    setSelected(null);
    setHintPair([a, b]);
    setHintsLeft((h) => h - 1);
    playSound('powerup');
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintPair(null), 1500);
  };

  const correctCount = order.reduce((acc, v, i) => acc + (v === i ? 1 : 0), 0);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* Hàng chỉ số: nước đi · thời gian · kỷ lục · robux */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-slate-600 shadow-sm" title="Số lần đổi chỗ">
          <Move size={15} className="text-indigo-500" /> {moves}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-slate-600 shadow-sm" title="Thời gian chơi">
          <Timer size={15} className="text-sky-500" /> {fmtTime(seconds)}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-amber-700 shadow-sm" title="Kỷ lục ít nước nhất">
          <Trophy size={15} className="text-amber-500" /> {best == null ? '—' : best}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-amber-700 shadow-sm" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-500" /> {robuxBalance}
        </span>
      </div>

      {/* Thanh điều khiển: gợi ý · xem tranh · xáo lại */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={showHint}
          disabled={hintsLeft <= 0 || solved}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-black shadow-sm transition ${
            hintsLeft <= 0 || solved
              ? 'cursor-not-allowed bg-white/50 text-slate-300'
              : 'bg-white/80 text-amber-600 hover:bg-white'
          }`}
          title="Nhấp sáng cặp ô nên đổi chỗ"
        >
          <Lightbulb size={16} /> Gợi ý ({hintsLeft})
        </button>
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

      {/* Thanh tiến độ số ô đã đúng */}
      <div className="flex w-full max-w-[440px] items-center gap-2 px-1">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
            style={{ width: `${(correctCount / (n * n)) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-slate-500">{correctCount}/{n * n}</span>
      </div>

      {/* Bảng ghép hình */}
      <div
        className="relative rounded-3xl bg-white/70 p-2 shadow-[0_10px_0_rgba(0,0,0,0.06)]"
        style={{ '--emoji': 'min(85vw, 396px)' }}
      >
        <div
          className="grid overflow-hidden rounded-2xl"
          style={{
            width: 'min(94vw, 440px)',
            height: 'min(94vw, 440px)',
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gap: solved ? 0 : 2,
            background: '#e2e8f0',
          }}
        >
          {order.map((pieceIndex, pos) => {
            const correct = pieceIndex === pos;
            const isSelected = selected === pos;
            const isHint = hintPair && (hintPair[0] === pos || hintPair[1] === pos);
            const isPulse = pulse.includes(pos);
            const col = pieceIndex % n;
            const row = Math.floor(pieceIndex / n);
            return (
              <button
                type="button"
                key={pos}
                onClick={() => handleTap(pos)}
                className={`relative overflow-hidden bg-white transition-all duration-150 ${
                  isSelected ? 'z-10 scale-95 ring-4 ring-sky-500' : ''
                } ${isHint ? 'z-20 ring-4 ring-amber-400' : ''} ${
                  correct && !solved && !isSelected && !isHint ? 'ring-2 ring-emerald-300' : ''
                }`}
                style={{
                  touchAction: 'manipulation',
                  animation: isHint
                    ? 'puzzle-hint 0.6s ease-in-out infinite'
                    : isPulse
                      ? 'puzzle-correct 0.6s ease-out'
                      : undefined,
                }}
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
            <span style={{ fontSize: 'min(78vw, 360px)', lineHeight: 1, ...emojiFont }}>
              {picture.emoji}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes puzzle-hint { 0%,100% { transform: scale(1); } 50% { transform: scale(0.9); } }
        @keyframes puzzle-correct { 0% { transform: scale(1); } 35% { transform: scale(1.12); filter: brightness(1.25); } 100% { transform: scale(1); filter: none; } }
      `}</style>

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
          {/* Thành tích ván này */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-black">
            <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
              <Move size={14} /> {moves} nước
            </span>
            <span className="flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sky-700">
              <Timer size={14} /> {fmtTime(seconds)}
            </span>
          </div>
          {newRecord ? (
            <p className="flex items-center gap-1 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-700">
              <Trophy size={15} className="text-amber-500" /> Kỷ lục mới! Ít nước nhất từ trước tới giờ 🎉
            </p>
          ) : (
            best != null && (
              <p className="text-xs font-bold text-slate-400">Kỷ lục ít nước: {best}</p>
            )
          )}
          {nextLevel && frozenFrontier && (
            <p className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-black text-emerald-700">
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

export default function GameApp({ onBack, onReward, robuxBalance = 0 }) {
  const [selectedId, setSelectedId] = useState(null);
  const [levelId, setLevelId] = useState('easy');
  const [unlockedIndex, setUnlockedIndex] = useState(() => loadUnlocked(PUZZLE_UNLOCK_KEY));
  const rewardedRef = useRef(new Set()); // mỗi độ khó chỉ thưởng Robux 1 lần/phiên
  const musicRef = useRef(false);

  // Nhạc nền dịu 'calm' — bật ở lần tương tác đầu tiên.
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('calm'); } };
  // Dừng nhạc khi rời game.
  useEffect(() => () => killMusic(), []);

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
    ensureMusic();
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
    // Thưởng Robux: mỗi độ khó 1 lần/phiên (2×2→1, 3×3→2, 4×4→3, 5×5→5).
    if (!rewardedRef.current.has(levelId)) {
      rewardedRef.current.add(levelId);
      const rb = [1, 2, 3, 5][levelIndex] || 1;
      onReward?.(rb, `Ghép xong ${level.label} (${level.n}×${level.n})`);
    }
    // Dừng nhạc khi thắng; sẽ tự bật lại khi bé tương tác tiếp.
    killMusic();
    musicRef.current = false;
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
        <SoundToggle />
      </div>

      {picture ? (
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
          {/* Chọn độ khó — mức khó chỉ mở khi đã vượt qua mức trước */}
          <div className="mb-2 flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white/70 p-1 shadow-sm">
            {LEVELS.map((l, idx) => {
              const locked = idx > unlockedIndex;
              const active = levelId === l.id;
              return (
                <button
                  type="button"
                  key={l.id}
                  disabled={locked}
                  onClick={() => !locked && setLevelId(l.id)}
                  className={`flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-black transition ${
                    locked
                      ? 'cursor-not-allowed text-slate-300'
                      : active
                        ? 'bg-orange-500 text-white shadow'
                        : 'text-slate-500 hover:bg-white'
                  }`}
                >
                  {locked && <Lock size={12} />}
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
            robuxBalance={robuxBalance}
            onSolved={handleSolved}
            onNext={goNext}
            ensureMusic={ensureMusic}
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
