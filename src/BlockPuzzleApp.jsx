import { useState, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';

// --- GAME: XẾP KHỐI (Block Puzzle kiểu Block Blast / 1010) ---
// Kéo khối vào lưới 8 cột x 11 hàng. Lấp đầy 1 hàng hoặc 1 cột -> hàng/cột đó nổ, được điểm.
// Hết chỗ đặt cả 3 khối -> kết thúc.

const COLS = 8;
const ROWS = 11;
const BEST_KEY = 'game_block_best';

const COLORS = ['#ef4444', '#2dd4bf', '#f59e0b', '#60a5fa', '#e879f9', '#fb923c', '#34d399', '#a78bfa'];

// Các khối (offset [hàng, cột], đã chuẩn hóa gốc 0).
const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]], // ô vuông 2x2
  [[0, 0], [1, 0], [1, 1]], // chữ L nhỏ
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1]], // J
  [[0, 1], [1, 1], [2, 0], [2, 1]], // L
  [[0, 0], [0, 1], [0, 2], [1, 1]], // T
  [[0, 1], [1, 0], [1, 1], [1, 2]], // T ngược
  [[0, 0], [0, 1], [1, 1], [1, 2]], // S
  [[0, 1], [0, 2], [1, 0], [1, 1]], // Z
  [[0, 0], [0, 1], [0, 2], [0, 3]], // I ngang
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I dọc
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], // 2x3
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], // 3x2
];

const shade = (hex, p) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = p < 0 ? 0 : 255;
  const a = Math.abs(p) / 100;
  r = Math.round((t - r) * a + r);
  g = Math.round((t - g) * a + g);
  b = Math.round((t - b) * a + b);
  return `rgb(${r},${g},${b})`;
};

const blockStyle = (hex) => ({
  background: `linear-gradient(145deg, ${shade(hex, 32)}, ${hex} 55%, ${shade(hex, -18)})`,
  boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.45), inset -2px -3px 0 rgba(0,0,0,.3)',
  borderRadius: '20%',
});

const dims = (shape) => {
  let h = 0;
  let w = 0;
  shape.forEach(([r, c]) => {
    if (r + 1 > h) h = r + 1;
    if (c + 1 > w) w = c + 1;
  });
  return { h, w };
};

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

let pieceSeq = 0;
const randomPiece = () => {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  pieceSeq += 1;
  return { id: pieceSeq, shape, color };
};
const newTray = () => [randomPiece(), randomPiece(), randomPiece()];

const canPlace = (board, shape, row, col) =>
  shape.every(([r, c]) => {
    const rr = row + r;
    const cc = col + c;
    return rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && !board[rr][cc];
  });

const placeableAnywhere = (board, shape) => {
  const { h, w } = dims(shape);
  for (let r = 0; r <= ROWS - h; r += 1) {
    for (let c = 0; c <= COLS - w; c += 1) {
      if (canPlace(board, shape, r, c)) return true;
    }
  }
  return false;
};

const anyMove = (board, tray) => tray.some((p) => p && placeableAnywhere(board, p.shape));

// Xóa hàng/cột đầy. Trả về bảng mới + số dòng đã xóa.
const clearLines = (board) => {
  const fullRows = [];
  const fullCols = [];
  for (let r = 0; r < ROWS; r += 1) {
    if (board[r].every((c) => c)) fullRows.push(r);
  }
  for (let c = 0; c < COLS; c += 1) {
    let full = true;
    for (let r = 0; r < ROWS; r += 1) {
      if (!board[r][c]) { full = false; break; }
    }
    if (full) fullCols.push(c);
  }
  const cleared = fullRows.length + fullCols.length;
  if (cleared === 0) return { board, cleared };
  const next = board.map((row) => row.slice());
  fullRows.forEach((r) => { for (let c = 0; c < COLS; c += 1) next[r][c] = null; });
  fullCols.forEach((c) => { for (let r = 0; r < ROWS; r += 1) next[r][c] = null; });
  return { board: next, cleared };
};

export default function BlockPuzzleApp({ onBack }) {
  const [board, setBoard] = useState(emptyBoard);
  const [tray, setTray] = useState(newTray);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [drag, setDrag] = useState(null); // {slot, shape, color, cell, px, py, anchor, valid}
  const boardRef = useRef(null);

  const restart = useCallback(() => {
    setBoard(emptyBoard());
    setTray(newTray());
    setScore(0);
    setGameOver(false);
    setNewRecord(false);
    setDrag(null);
  }, []);

  const previewSet = useMemo(() => {
    if (!drag || !drag.anchor) return null;
    const set = new Set();
    drag.shape.forEach(([r, c]) => set.add(`${drag.anchor.r + r},${drag.anchor.c + c}`));
    return set;
  }, [drag]);

  const computeAnchor = (shape, clientX, clientY) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const cell = rect.width / COLS;
    const { h, w } = dims(shape);
    const lift = cell * 1.1; // nâng khối lên trên ngón tay cho dễ nhìn
    const gx = clientX - rect.left;
    const gy = clientY - rect.top - lift;
    let col = Math.round(gx / cell - w / 2);
    let row = Math.round(gy / cell - h / 2);
    col = Math.max(0, Math.min(COLS - w, col));
    row = Math.max(0, Math.min(ROWS - h, row));
    return { r: row, c: col, cell };
  };

  const handlePointerDown = (event, slot) => {
    if (gameOver) return;
    const piece = tray[slot];
    if (!piece) return;
    event.preventDefault();
    const a = computeAnchor(piece.shape, event.clientX, event.clientY);
    setDrag({
      slot,
      shape: piece.shape,
      color: piece.color,
      cell: a ? a.cell : 36,
      px: event.clientX,
      py: event.clientY,
      anchor: a ? { r: a.r, c: a.c } : null,
      valid: a ? canPlace(board, piece.shape, a.r, a.c) : false,
    });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }
  };

  const handlePointerMove = (event) => {
    if (!drag) return;
    const a = computeAnchor(drag.shape, event.clientX, event.clientY);
    setDrag((prev) => (prev ? {
      ...prev,
      px: event.clientX,
      py: event.clientY,
      cell: a ? a.cell : prev.cell,
      anchor: a ? { r: a.r, c: a.c } : null,
      valid: a ? canPlace(board, prev.shape, a.r, a.c) : false,
    } : prev));
  };

  const finishDrag = () => {
    if (!drag) return;
    if (drag.anchor && drag.valid) {
      const next = board.map((row) => row.slice());
      drag.shape.forEach(([r, c]) => { next[drag.anchor.r + r][drag.anchor.c + c] = drag.color; });
      const placedCells = drag.shape.length;

      const { board: cleared, cleared: lines } = clearLines(next);
      let gained = placedCells;
      if (lines > 0) {
        gained += lines * 10 + (lines - 1) * 10; // thưởng combo
        playSound('correct');
      } else {
        playSound('pop');
      }

      const nextScore = score + gained;
      setScore(nextScore);
      setBoard(cleared);

      // Cập nhật khay: bỏ khối vừa đặt, hết cả 3 thì phát khối mới.
      const nextTray = tray.map((p, i) => (i === drag.slot ? null : p));
      const refill = nextTray.every((p) => !p) ? newTray() : nextTray;
      setTray(refill);

      // Kiểm tra kết thúc.
      if (!anyMove(cleared, refill)) {
        setGameOver(true);
        if (nextScore > best) {
          setBest(nextScore);
          setNewRecord(true);
          try { localStorage.setItem(BEST_KEY, String(nextScore)); } catch { /* ignore */ }
        } else {
          playSound('wrong');
        }
      } else if (nextScore > best) {
        setBest(nextScore);
        try { localStorage.setItem(BEST_KEY, String(nextScore)); } catch { /* ignore */ }
      }
    }
    setDrag(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🧱 Xếp khối</h1>
        <button
          type="button"
          onClick={restart}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-3 py-4">
        {/* Điểm */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-5 py-2 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-2xl font-black text-white">{score}</div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-amber-400/15 px-5 py-2 text-center">
            <Trophy size={20} className="text-amber-400" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Cao nhất</div>
              <div className="text-2xl font-black text-amber-300">{best}</div>
            </div>
          </div>
        </div>

        {/* Lưới */}
        <div
          ref={boardRef}
          className="grid touch-none rounded-2xl bg-slate-950/70 p-1.5 shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
          style={{
            width: 'min(86vw, 304px)',
            height: `calc(min(86vw, 304px) * ${ROWS} / ${COLS})`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: 2,
          }}
        >
          {board.map((row, r) =>
            row.map((cellColor, c) => {
              const inPreview = previewSet?.has(`${r},${c}`);
              const previewColor = inPreview ? (drag.valid ? drag.color : '#ef4444') : null;
              const show = cellColor || previewColor;
              return (
                <div
                  key={`${r}-${c}`}
                  className="rounded-[18%]"
                  style={
                    show
                      ? { ...blockStyle(show), opacity: cellColor ? 1 : 0.55 }
                      : { background: 'rgba(255,255,255,0.05)', borderRadius: '18%' }
                  }
                />
              );
            }),
          )}
        </div>

        {/* Khay 3 khối */}
        <div className="flex w-full max-w-[400px] items-center justify-around gap-2 rounded-2xl bg-white/5 px-2 py-3">
          {tray.map((piece, slot) => {
            if (!piece) return <div key={slot} className="h-[64px] flex-1" />;
            const { h, w } = dims(piece.shape);
            const mini = 16;
            const dragging = drag?.slot === slot;
            return (
              <button
                key={piece.id}
                type="button"
                onPointerDown={(e) => handlePointerDown(e, slot)}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={() => setDrag(null)}
                className="flex h-[64px] flex-1 touch-none select-none items-center justify-center"
                style={{ opacity: dragging ? 0.25 : 1 }}
              >
                <div
                  className="relative"
                  style={{ width: w * mini, height: h * mini }}
                >
                  {piece.shape.map(([r, c], i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: c * mini,
                        top: r * mini,
                        width: mini - 1.5,
                        height: mini - 1.5,
                        ...blockStyle(piece.color),
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khối đang kéo (bay theo ngón tay) */}
      {drag && drag.anchor && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: drag.px,
            top: drag.py,
            transform: `translate(-50%, calc(-50% - ${drag.cell * 1.1}px))`,
          }}
        >
          <div
            className="relative"
            style={{ width: dims(drag.shape).w * drag.cell, height: dims(drag.shape).h * drag.cell }}
          >
            {drag.shape.map(([r, c], i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: c * drag.cell,
                  top: r * drag.cell,
                  width: drag.cell - 2,
                  height: drag.cell - 2,
                  ...blockStyle(drag.color),
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Kết thúc */}
      {gameOver && newRecord && <Fireworks />}
      {gameOver && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🧱'}</div>
            <h2 className="text-2xl font-black text-slate-700">
              {newRecord ? 'Kỷ lục mới!' : 'Hết chỗ rồi!'}
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-orange-500">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5"
            >
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
