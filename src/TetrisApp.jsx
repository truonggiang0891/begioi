import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, RotateCw, ArrowLeft, ArrowRight, ArrowDown, ChevronsDown, Trophy, Gem, Box, Gauge } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound, startMusic, killMusic } from './gameAudio';
import { SoundToggle } from './gameUI';
import { spawnBurst, stepParticles, drawParticles, spawnFloater, stepFloaters, drawFloaters, makeShake, addShake, applyShake } from './gameFx';
import Fireworks from './Fireworks';
import { useScoreRewards } from './gameRewards';

// --- GAME: KHỐI RƠI (Tetris) — bản động của xếp khối ---
// Khối rơi từ trên xuống, xoay/di chuyển để xếp kín hàng -> hàng nổ, được điểm.
// Nâng cấp: âm thanh thao tác, nổ hàng có particle/flash/rung, hiệu ứng Tetris!/Combo,
// giữ khối (HOLD), hiển thị cấp + tốc độ, nhạc nền 'tense'.

const COLS = 10;
const ROWS = 15;
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
// Mỗi khối có màu riêng -> tra cứu định nghĩa gốc theo màu (dùng cho HOLD).
const pieceByColor = Object.fromEntries(PIECES.map((p) => [p.color, p]));

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

// Cấp + tốc độ rơi (ms) hiện tại — dùng chung cho logic lẫn hiển thị.
const levelOf = (lines) => Math.floor(lines / 5) + 1;
const speedOf = (lines) => Math.max(180, 720 - Math.floor(lines / 5) * 70);

// Toạ độ tâm ô (r,c) trong lớp canvas hiệu ứng phủ lên bảng.
const cellGeom = (boardPx) => {
  const boardH = boardPx * ROWS / COLS;
  const padX = 6;
  const padY = 6;
  const gap = 1.5;
  const cw = (boardPx - 2 * padX - gap * (COLS - 1)) / COLS;
  const ch = (boardH - 2 * padY - gap * (ROWS - 1)) / ROWS;
  return {
    boardH, padX, padY, gap, cw, ch,
    cx: (c) => padX + c * (cw + gap) + cw / 2,
    cy: (r) => padY + r * (ch + gap) + ch / 2,
  };
};

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

  // Ghi lại chỉ số các hàng đầy (để làm hiệu ứng nổ) trước khi bỏ đi.
  const clearedRows = [];
  board.forEach((row, r) => { if (row.every((x) => x)) clearedRows.push(r); });

  const remaining = board.filter((row) => !row.every((x) => x));
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null));

  const spawned = spawnCur(game.next);
  const newNext = randomPiece();
  const blocked = over || collide(remaining, spawned.cells, spawned.r, spawned.c);

  return {
    ...game,
    board: remaining,
    cur: spawned,
    next: newNext,
    holdUsed: false,               // đổi khối mới -> lại được giữ 1 lần
    score: game.score + LINE_SCORES[cleared],
    lines: game.lines + cleared,
    over: blocked,
    clearedRows,                   // hàng vừa nổ (cho hiệu ứng)
    lockSeq: (game.lockSeq || 0) + 1, // đếm số lần khóa khối -> kích hoạt FX
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

  // Giữ khối (HOLD): 1 lần đổi cho mỗi khối. Đưa khối hiện tại vào ô giữ,
  // lấy khối đã giữ ra (hoặc lấy khối kế nếu ô giữ đang trống).
  if (action === 'hold') {
    if (game.holdUsed) return game;
    const curDef = pieceByColor[game.cur.color];
    if (!game.hold) {
      const spawned = spawnCur(game.next);
      return { ...game, hold: curDef, cur: spawned, next: randomPiece(), holdUsed: true };
    }
    const spawned = spawnCur(game.hold);
    return { ...game, hold: curDef, cur: spawned, holdUsed: true };
  }

  return game;
};

const initGame = () => ({
  board: emptyBoard(),
  cur: spawnCur(randomPiece()),
  next: randomPiece(),
  hold: null,
  holdUsed: false,
  score: 0,
  lines: 0,
  over: false,
  clearedRows: [],
  lockSeq: 0,
});

export default function TetrisApp({ onBack, onReward, robuxBalance = 0 }) {
  const [game, setGame] = useState(initGame);
  useScoreRewards(game.score, onReward);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);

  const prevOver = useRef(false);
  const prevSeq = useRef(0);   // lockSeq đã xử lý FX gần nhất
  const comboRef = useRef(0);  // số lần nổ hàng liên tiếp

  // Nhạc nền: bật ở lần tương tác đầu, tắt khi thua / thoát.
  const musicRef = useRef(false);
  const ensureMusic = () => {
    if (!musicRef.current) { musicRef.current = true; startMusic('tense'); }
  };

  const level = levelOf(game.lines);
  const speed = speedOf(game.lines);

  const act = useCallback((action) => setGame((g) => reduce(g, action)), []);

  // Hành động do bé bấm/vuốt -> kèm âm thanh thao tác + bật nhạc lần đầu.
  const userAct = useCallback((action) => {
    ensureMusic();
    if (action === 'rotate') playSound('hit');       // xoay
    else if (action === 'drop') playSound('whoosh');  // thả nhanh
    else if (action === 'hold') playSound('jump');    // giữ/đổi khối
    setGame((g) => reduce(g, action));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Lớp canvas hiệu ứng (particle / số bay lên / flash) + rung màn ----
  const fxCanvasRef = useRef(null);
  const shakeWrapRef = useRef(null);
  const particlesRef = useRef([]);
  const floatersRef = useRef([]);
  const flashRef = useRef([]);   // [{ rows:[...], life }]
  const shakeRef = useRef(makeShake());

  // Board tự co giãn lấp đầy không gian còn trống (giữ tỉ lệ COLS:ROWS).
  const boardWrapRef = useRef(null);
  const [boardPx, setBoardPx] = useState(0);
  const boardH = boardPx ? boardPx * ROWS / COLS : 0;
  useLayoutEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      setBoardPx(Math.floor(Math.min(w, h * COLS / ROWS)));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Vòng lặp vẽ hiệu ứng phủ + áp rung màn hình lên khung bảng.
  useEffect(() => {
    const cv = fxCanvasRef.current;
    if (!cv || boardPx <= 0) return undefined;
    cv.width = Math.round(boardPx);
    cv.height = Math.round(boardH);
    const ctx = cv.getContext('2d');
    const geom = cellGeom(boardPx);
    let raf = 0;
    const loop = () => {
      stepParticles(particlesRef.current);
      stepFloaters(floatersRef.current);
      // flash các hàng vừa nổ -> mờ dần
      const flashes = flashRef.current;
      for (let i = flashes.length - 1; i >= 0; i -= 1) {
        flashes[i].life -= 0.08;
        if (flashes[i].life <= 0) flashes.splice(i, 1);
      }
      // rung: dịch cả khung bảng
      const [ox, oy] = applyShake(shakeRef.current);
      if (shakeWrapRef.current) shakeWrapRef.current.style.transform = `translate(${ox}px,${oy}px)`;

      ctx.clearRect(0, 0, cv.width, cv.height);
      // dải sáng trắng ở các hàng nổ
      for (const fl of flashes) {
        ctx.globalAlpha = Math.max(0, fl.life) * 0.75;
        ctx.fillStyle = '#ffffff';
        for (const r of fl.rows) {
          const y = geom.cy(r) - geom.ch / 2 - geom.gap / 2;
          ctx.fillRect(0, y, cv.width, geom.ch + geom.gap);
        }
      }
      ctx.globalAlpha = 1;
      drawParticles(ctx, particlesRef.current);
      drawFloaters(ctx, floatersRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [boardPx, boardH]);

  // Điều khiển bằng chạm/vuốt ngay trên bảng: chạm = xoay, kéo ngang = sang trái/phải, kéo xuống = rơi nhanh.
  const dragRef = useRef(null);
  const onBoardPointerDown = (e) => {
    if (game.over) return;
    ensureMusic();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* pointer id không hợp lệ -> bỏ qua */ }
    dragRef.current = { x0: e.clientX, y0: e.clientY, h: 0, v: 0, moved: false };
  };
  const onBoardPointerMove = (e) => {
    const g = dragRef.current;
    if (!g) return;
    const cell = boardPx / COLS || 30;
    const stepX = Math.max(16, cell * 0.6);
    const stepY = Math.max(18, cell * 0.7);
    const targetH = Math.trunc((e.clientX - g.x0) / stepX);
    while (g.h < targetH) { act('right'); g.h += 1; g.moved = true; }
    while (g.h > targetH) { act('left'); g.h -= 1; g.moved = true; }
    const targetV = Math.trunc((e.clientY - g.y0) / stepY);
    while (g.v < targetV) { act('down'); g.v += 1; g.moved = true; }
  };
  const onBoardPointerUp = (e) => {
    const g = dragRef.current;
    dragRef.current = null;
    if (!g) return;
    const dist = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);
    if (!g.moved && dist < 12) userAct('rotate'); // chạm gọn = xoay
  };

  const restart = () => {
    prevOver.current = false;
    prevSeq.current = 0;
    comboRef.current = 0;
    particlesRef.current.length = 0;
    floatersRef.current.length = 0;
    flashRef.current.length = 0;
    setNewRecord(false);
    setGame(initGame());
    ensureMusic();
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
      if (e.key === 'ArrowLeft') userAct('left');
      else if (e.key === 'ArrowRight') userAct('right');
      else if (e.key === 'ArrowDown') userAct('down');
      else if (e.key === 'ArrowUp') userAct('rotate');
      else if (e.key === ' ') { e.preventDefault(); userAct('drop'); }
      else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') userAct('hold');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userAct]);

  // Hiệu ứng khi khóa khối / nổ hàng (theo lockSeq tăng dần).
  useEffect(() => {
    if (game.lockSeq === prevSeq.current) return;
    prevSeq.current = game.lockSeq;
    if (game.lockSeq <= 0) return;

    playSound('pop'); // khóa khối
    const rows = game.clearedRows || [];
    if (!rows.length) { comboRef.current = 0; return; }

    playSound('break'); // nổ hàng — to, đanh
    comboRef.current += 1;
    const geom = cellGeom(boardPx);

    // rung mạnh hơn khi nổ nhiều hàng
    addShake(shakeRef.current, 5 + rows.length * 3);
    // flash trắng các hàng nổ
    flashRef.current.push({ rows: rows.slice(), life: 1 });
    // particle rải theo hàng
    rows.forEach((r) => {
      for (let c = 0; c < COLS; c += 2) {
        spawnBurst(particlesRef.current, geom.cx(c), geom.cy(r), ['#ffffff', '#fde047'], 5, { spread: 3 });
      }
    });

    // số điểm bay lên
    const gained = LINE_SCORES[Math.min(4, rows.length)];
    const midY = geom.cy(rows[Math.floor(rows.length / 2)]);
    spawnFloater(floatersRef.current, boardPx / 2, midY, `+${gained}`, '#fde047', { size: 22 });

    if (rows.length >= 4) {
      // Nổ 4 hàng cùng lúc -> "TETRIS!"
      spawnFloater(floatersRef.current, boardPx / 2, geom.cy(rows[0]) - 10, 'TETRIS!', '#f0abfc', { size: 26, decay: 0.012 });
      playSound('win');
    } else if (comboRef.current >= 2) {
      // Nổ hàng nhiều lần liên tiếp -> "Combo xN"
      spawnFloater(floatersRef.current, boardPx / 2, midY - 26, `Combo x${comboRef.current}`, '#67e8f9', { size: 18 });
      playSound('combo', comboRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.lockSeq, boardPx]);

  // Kết thúc + cập nhật kỷ lục.
  useEffect(() => {
    if (game.over && !prevOver.current) {
      killMusic();
      musicRef.current = false;
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

  // Tắt nhạc khi rời game.
  useEffect(() => () => killMusic(), []);

  // Chuẩn bị dữ liệu vẽ.
  const gr = ghostRow(game.board, game.cur);
  const curMap = new Map();
  game.cur.cells.forEach(([cr, cc]) => curMap.set(`${game.cur.r + cr},${game.cur.c + cc}`, game.cur.color));
  const ghostSet = new Set();
  game.cur.cells.forEach(([cr, cc]) => ghostSet.add(`${gr + cr},${game.cur.c + cc}`));

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
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm để xoay · Vuốt ngang để đi · Vuốt xuống để rơi · Nút <b>Giữ</b> để cất khối
          </GameHelp>
          <SoundToggle />
          <button
            type="button"
            onClick={restart}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
          >
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 px-2 py-2">
        {/* Chỉ số: điểm, cao nhất, cấp/tốc độ, robux, khối kế, khối giữ */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          <div className="rounded-2xl bg-white/10 px-4 py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Điểm</div>
            <div className="text-xl font-black text-white">{game.score}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 px-3 py-1.5 text-center">
            <Trophy size={16} className="text-amber-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300/70">Cao nhất</div>
              <div className="text-xl font-black text-amber-300">{best}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-cyan-400/15 px-3 py-1.5 text-center" title="Cấp độ & tốc độ rơi">
            <Gauge size={16} className="text-cyan-300" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/70">Cấp {level}</div>
              <div className="text-sm font-black text-cyan-100">{(1000 / speed).toFixed(1)}/giây</div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-yellow-400/15 px-3 py-1.5 text-center" title="Tổng Robux của bé">
            <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-xl font-black text-yellow-300">{robuxBalance}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-center">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/50">Tiếp</div>
            <NextPreview piece={game.next} />
          </div>
          {/* Ô GIỮ khối — bấm để cất/đổi khối (1 lần mỗi khối) */}
          <button
            type="button"
            onClick={() => userAct('hold')}
            aria-label="Giữ khối"
            title="Giữ khối hiện tại (đổi 1 lần mỗi khối)"
            className={`rounded-2xl px-3 py-1.5 text-center transition ${
              game.holdUsed ? 'bg-white/5' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <div className="mb-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/50">
              <Box size={11} /> Giữ
            </div>
            {game.hold
              ? <NextPreview piece={game.hold} dim={game.holdUsed} />
              : <div className="mx-auto opacity-40" style={{ width: 3 * 12, height: 2 * 12 }} />}
          </button>
        </div>

        {/* Bảng chơi — lấp đầy không gian còn lại, điều khiển bằng chạm/vuốt */}
        <div ref={boardWrapRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div
            ref={shakeWrapRef}
            className="relative"
            style={{ width: boardPx || undefined, height: boardH || undefined, willChange: 'transform' }}
          >
            <div
              className="grid h-full w-full touch-none select-none rounded-2xl bg-slate-950/70 p-1.5 shadow-[0_0_0_2px_rgba(96,165,250,0.4)]"
              onPointerDown={onBoardPointerDown}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerCancel={onBoardPointerUp}
              style={{
                touchAction: 'none',
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
            {/* Lớp hiệu ứng phủ lên bảng (particle, số bay lên, flash) */}
            <canvas
              ref={fxCanvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>
        </div>

        {/* Điều khiển cảm ứng (nút để dự phòng) */}
        <div className="flex shrink-0 items-center gap-2">
          <CtrlButton onClick={() => userAct('down')} label="Xuống"><ArrowDown size={26} /></CtrlButton>
          <CtrlButton onClick={() => userAct('left')} label="Trái"><ArrowLeft size={26} /></CtrlButton>
          <CtrlButton onClick={() => userAct('rotate')} label="Xoay"><RotateCw size={26} /></CtrlButton>
          <CtrlButton onClick={() => userAct('right')} label="Phải"><ArrowRight size={26} /></CtrlButton>
          <CtrlButton onClick={() => userAct('drop')} label="Thả" strong><ChevronsDown size={26} /></CtrlButton>
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

function NextPreview({ piece, dim = false }) {
  const mini = 12;
  return (
    <div className="relative mx-auto" style={{ width: piece.n * mini, height: 2 * mini, opacity: dim ? 0.4 : 1 }}>
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
