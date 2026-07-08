import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, RotateCw, ArrowLeft, ArrowRight, ArrowDown, ChevronsDown, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';

// --- GAME: KHỐI RƠI (Tetris) — bản động của xếp khối ---
// Khối rơi từ trên xuống, xoay/di chuyển để xếp kín hàng -> hàng nổ, được điểm.

const COLS = 8;
const ROWS = 14;
const BEST_KEY = 'game_tetris_best';

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

const PIECES = [
  { n: 4, color: '#22d3ee', cells: [[1, 0], [1, 1], [1, 2], [1, 3]] }, // I
  { n: 2, color: '#f59e0b', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] }, // O
  { n: 3, color: '#a78bfa', cells: [[0, 1], [1, 0], [1, 1], [1, 2]] }, // T
  { n: 3, color: '#34d399', cells: [[0, 1], [0, 2], [1, 0], [1, 1]] }, // S
  { n: 3, color: '#ef4444', cells: [[0, 0], [0, 1], [1, 1], [1, 2]] }, // Z
  { n: 3, color: '#60a5fa', cells: [[0, 0], [1, 0], [1, 1], [1, 2]] }, // J
  { n: 3, color: '#fb923c', cells: [[0, 2], [1, 0], [1, 1], [1, 2]] }, // L
];

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)];

const spawnCur = (piece) => {
  let minRow = 99;
  piece.cells.forEach(([r]) => { if (r < minRow) minRow = r; });
  return {
    cells: piece.cells,
    n: piece.n,
    color: piece.color,
    r: -minRow,
    c: Math.floor((COLS - piece.n) / 2),
  };
};

const collide = (board, cells, r, c) =>
  cells.some(([cr, cc]) => {
    const ar = r + cr;
    const ac = c + cc;
    if (ac < 0 || ac >= COLS || ar >= ROWS) return true;
    if (ar >= 0 && board[ar][ac]) return true;
    return false;
  });

const rotateCells = (cells, n) => cells.map(([r, c]) => [c, n - 1 - r]);

const ghostRow = (board, cur) => {
  let dr = 0;
  while (!collide(board, cur.cells, cur.r + dr + 1, cur.c)) dr += 1;
  return cur.r + dr;
};

const LINE_SCORES = [0, 10, 30, 60, 100];

// Khóa khối vào bảng, xóa hàng đầy, sinh khối mới. Trả về game mới.
const lockPiece = (game) => {
  const board = game.board.map((row) => row.slice());
  let over = false;
  game.cur.cells.forEach(([cr, cc]) => {
    const ar = game.cur.r + cr;
    const ac = game.cur.c + cc;
    if (ar < 0) over = true;
    else board[ar][ac] = game.cur.color;
  });

  const remaining = board.filter((row) => !row.every((x) => x));
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null));

  const spawned = spawnCur(game.next);
  const newNext = randomPiece();
  const blocked = over || collide(remaining, spawned.cells, spawned.r, spawned.c);

  return {
    board: remaining,
    cur: spawned,
    next: newNext,
    score: game.score + LINE_SCORES[cleared],
    lines: game.lines + cleared,
    over: blocked,
  };
};

// Bộ xử lý hành động thuần (không side-effect).
const reduce = (game, action) => {
  if (game.over) return game;
  const { board, cur } = game;

  if (action === 'left' || action === 'right') {
    const dc = action === 'left' ? -1 : 1;
    if (!collide(board, cur.cells, cur.r, cur.c + dc)) {
      return { ...game, cur: { ...cur, c: cur.c + dc } };
    }
    return game;
  }

  if (action === 'rotate') {
    const rotated = rotateCells(cur.cells, cur.n);
    for (const off of [0, -1, 1, -2, 2]) {
      if (!collide(board, rotated, cur.r, cur.c + off)) {
        return { ...game, cur: { ...cur, cells: rotated, c: cur.c + off } };
      }
    }
    return game;
  }

  if (action === 'down' || action === 'gravity') {
    if (!collide(board, cur.cells, cur.r + 1, cur.c)) {
      return { ...game, cur: { ...cur, r: cur.r + 1 } };
    }
    return lockPiece(game);
  }

  if (action === 'drop') {
    let dr = 0;
    while (!collide(board, cur.cells, cur.r + dr + 1, cur.c)) dr += 1;
    return lockPiece({ ...game, cur: { ...cur, r: cur.r + dr } });
  }

  return game;
};

const initGame = () => ({
  board: emptyBoard(),
  cur: spawnCur(randomPiece()),
  next: randomPiece(),
  score: 0,
  lines: 0,
  over: false,
});

export default function TetrisApp({ onBack }) {
  const [game, setGame] = useState(initGame);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);

  const prevLines = useRef(0);
  const prevOver = useRef(false);

  const speed = Math.max(180, 720 - Math.floor(game.lines / 5) * 70);

  const act = useCallback((action) => setGame((g) => reduce(g, action)), []);

  const restart = () => {
    prevLines.current = 0;
    prevOver.current = false;
    setNewRecord(false);
    setGame(initGame());
  };

  // Rơi tự động.
  useEffect(() => {
    if (game.over) return undefined;
    const id = setInterval(() => act('gravity'), speed);
    return () => clearInterval(id);
  }, [game.over, speed, act]);

  // Bàn phím (máy tính).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') act('left');
      else if (e.key === 'ArrowRight') act('right');
      else if (e.key === 'ArrowDown') act('down');
      else if (e.key === 'ArrowUp') act('rotate');
      else if (e.key === ' ') { e.preventDefault(); act('drop'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act]);

  // Âm thanh nổ hàng.
  useEffect(() => {
    if (game.lines > prevLines.current) playSound('correct');
    prevLines.current = game.lines;
  }, [game.lines]);

  // Kết thúc + cập nhật kỷ lục.
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

  // Chuẩn bị dữ liệu vẽ.
  const gr = ghostRow(game.board, game.cur);
  const curMap = new Map();
  game.cur.cells.forEach(([cr, cc]) => curMap.set(`${game.cur.r + cr},${game.cur.c + cc}`, game.cur.color));
  const ghostSet = new Set();
  game.cur.cells.forEach(([cr, cc]) => ghostSet.add(`${gr + cr},${game.cur.c + cc}`));

  const boardW = 'min(80vw, 264px)';

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
        <h1 className="truncate text-lg font-black text-white md:text-2xl">⬇️ Khối rơi</h1>
        <button
          type="button"
          onClick={restart}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <RotateCcw size={16} /> Mới
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-3 py-3">
        {/* Điểm + khối tiếp theo */}
        <div className="flex items-center gap-3">
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
          <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-center">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/50">Tiếp</div>
            <NextPreview piece={game.next} />
          </div>
        </div>

        {/* Bảng chơi */}
        <div
          className="grid rounded-2xl bg-slate-950/70 p-1.5 shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
          style={{
            width: boardW,
            height: `calc(${boardW} * ${ROWS} / ${COLS})`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: 1.5,
          }}
        >
          {game.board.map((row, r) =>
            row.map((cellColor, c) => {
              const key = `${r},${c}`;
              const color = cellColor || curMap.get(key);
              const isGhost = !color && ghostSet.has(key);
              return (
                <div
                  key={key}
                  className="rounded-[16%]"
                  style={
                    color
                      ? blockStyle(color)
                      : isGhost
                        ? { background: 'rgba(255,255,255,0.14)', borderRadius: '16%' }
                        : { background: 'rgba(255,255,255,0.05)', borderRadius: '16%' }
                  }
                />
              );
            }),
          )}
        </div>

        {/* Điều khiển cảm ứng */}
        <div className="flex items-center gap-2">
          <CtrlButton onClick={() => act('left')} label="Trái"><ArrowLeft size={26} /></CtrlButton>
          <CtrlButton onClick={() => act('rotate')} label="Xoay"><RotateCw size={26} /></CtrlButton>
          <CtrlButton onClick={() => act('right')} label="Phải"><ArrowRight size={26} /></CtrlButton>
          <CtrlButton onClick={() => act('down')} label="Xuống"><ArrowDown size={26} /></CtrlButton>
          <CtrlButton onClick={() => act('drop')} label="Thả" strong><ChevronsDown size={26} /></CtrlButton>
        </div>
      </div>

      {/* Kết thúc */}
      {game.over && newRecord && <Fireworks />}
      {game.over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '⬇️'}</div>
            <h2 className="text-2xl font-black text-slate-700">
              {newRecord ? 'Kỷ lục mới!' : 'Đầy mất rồi!'}
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-orange-500">{game.score}</span> điểm
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

function NextPreview({ piece }) {
  const mini = 12;
  return (
    <div className="relative mx-auto" style={{ width: piece.n * mini, height: 2 * mini }}>
      {piece.cells.map(([r, c], i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: c * mini, top: r * mini, width: mini - 1.5, height: mini - 1.5, ...blockStyle(piece.color) }}
        />
      ))}
    </div>
  );
}

function CtrlButton({ onClick, children, label, strong }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl font-black text-white transition active:translate-y-0.5 ${
        strong
          ? 'bg-gradient-to-b from-orange-400 to-orange-500 shadow-[0_4px_0_rgb(234,88,12)]'
          : 'bg-white/15 shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:bg-white/25'
      }`}
    >
      {children}
    </button>
  );
}
