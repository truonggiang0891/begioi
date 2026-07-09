import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import {
  spawnBurst, stepParticles, drawParticles,
  spawnFloater, stepFloaters, drawFloaters,
  makeShake, addShake, applyShake,
} from './gameFx';
import { useFitSize } from './useFitSize';
import { useScoreRewards } from './gameRewards';

// Khoảng đệm/khe của lưới (khớp với p-1.5 = 6px và gap: 2px bên dưới) — dùng để
// tính tâm mỗi ô khi bắn hiệu ứng lên lớp canvas phủ trên lưới.
const PAD = 6;
const GAP = 2;

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
  if (cleared === 0) return { board, cleared, rows: fullRows, cols: fullCols };
  const next = board.map((row) => row.slice());
  fullRows.forEach((r) => { for (let c = 0; c < COLS; c += 1) next[r][c] = null; });
  fullCols.forEach((c) => { for (let r = 0; r < ROWS; r += 1) next[r][c] = null; });
  return { board: next, cleared, rows: fullRows, cols: fullCols };
};

export default function BlockPuzzleApp({ onBack, onReward, robuxBalance = 0 }) {
  const [board, setBoard] = useState(emptyBoard);
  const [tray, setTray] = useState(newTray);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [drag, setDrag] = useState(null); // {slot, shape, color, cell, px, py, anchor, valid}
  const boardRef = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(COLS, ROWS);

  // --- Hiệu ứng (particle nổ, số điểm bay lên, nháy sáng, rung) trên lớp canvas phủ ---
  const fxCanvasRef = useRef(null);
  const stageRef = useRef(null); // vùng bọc lưới — dùng để rung (CSS transform)
  const fxRef = useRef({ particles: [], floaters: [], flashes: [], shake: makeShake() });
  const fitRef2 = useRef(fitSize); // giữ kích thước mới nhất cho vòng lặp vẽ
  fitRef2.current = fitSize;

  // Nhạc nền — bật ở lần chạm đầu tiên (kéo khối), tắt khi thoát/thua.
  const musicRef = useRef(false);
  const ensureMusic = () => {
    if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); }
  };
  const stopMusic = () => { musicRef.current = false; killMusic(); };

  // Tâm (x,y) của ô [r,c] trong hệ toạ độ canvas (khớp padding + gap của lưới).
  const cellCenter = (r, c, w, h) => {
    const cw = (w - PAD * 2 - (COLS - 1) * GAP) / COLS;
    const ch = (h - PAD * 2 - (ROWS - 1) * GAP) / ROWS;
    return { x: PAD + c * (cw + GAP) + cw / 2, y: PAD + r * (ch + GAP) + ch / 2, cw, ch };
  };

  // Vòng lặp vẽ hiệu ứng — chạy suốt vòng đời game, độc lập với React state.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const canvas = fxCanvasRef.current;
      const fx = fxRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        stepParticles(fx.particles);
        stepFloaters(fx.floaters);
        for (let i = fx.flashes.length - 1; i >= 0; i -= 1) {
          fx.flashes[i].life -= 0.06;
          if (fx.flashes[i].life <= 0) fx.flashes.splice(i, 1);
        }
        // Rung: dời cả vùng lưới (lưới + canvas) bằng CSS transform cho khớp nhau.
        const [ox, oy] = applyShake(fx.shake);
        if (stageRef.current) {
          stageRef.current.style.transform = (ox || oy) ? `translate(${ox}px, ${oy}px)` : '';
        }
        ctx.clearRect(0, 0, w, h);
        // Nháy sáng theo hàng/cột vừa nổ.
        for (const fl of fx.flashes) {
          ctx.globalAlpha = Math.max(0, fl.life) * 0.55;
          ctx.fillStyle = '#ffffff';
          if (fl.type === 'row') {
            const { y, ch } = cellCenter(fl.index, 0, w, h);
            ctx.fillRect(0, y - ch / 2 - GAP, w, ch + GAP * 2);
          } else {
            const { x, cw } = cellCenter(0, fl.index, w, h);
            ctx.fillRect(x - cw / 2 - GAP, 0, cw + GAP * 2, h);
          }
        }
        ctx.globalAlpha = 1;
        drawParticles(ctx, fx.particles);
        drawFloaters(ctx, fx.floaters);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stopMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bắn hiệu ứng khi có hàng/cột nổ: particle theo màu ô + nháy sáng + số điểm + combo + rung.
  const triggerClearFx = (filledBoard, rows, cols, lines, gained) => {
    const fx = fxRef.current;
    const w = Math.round(fitRef2.current.w);
    const h = Math.round(fitRef2.current.h);
    const burstAt = (r, c) => {
      const { x, y } = cellCenter(r, c, w, h);
      const color = filledBoard[r][c] || '#ffffff';
      spawnBurst(fx.particles, x, y, [color, '#ffffff'], 10, { spread: 3.6 });
    };
    rows.forEach((r) => {
      fx.flashes.push({ type: 'row', index: r, life: 1 });
      for (let c = 0; c < COLS; c += 1) burstAt(r, c);
    });
    cols.forEach((c) => {
      fx.flashes.push({ type: 'col', index: c, life: 1 });
      for (let r = 0; r < ROWS; r += 1) burstAt(r, c);
    });
    const cx = w / 2;
    const cy = rows.length ? cellCenter(rows[0], 0, w, h).y : cellCenter(0, cols[0], w, h).y;
    spawnFloater(fx.floaters, cx, cy, `+${gained}`, '#fde047', { size: 26 });
    if (lines >= 2) {
      spawnFloater(fx.floaters, cx, cy - 30, `Combo x${lines}`, '#f0abfc', { size: 22, decay: 0.014 });
    }
    addShake(fx.shake, 4 + lines * 3);
  };

  // Cảnh báo sắp bí: còn khối trong khay không thể đặt ở đâu (nhưng game chưa kết thúc).
  const danger = useMemo(() => {
    if (gameOver) return false;
    const active = tray.filter((p) => p);
    if (!active.length) return false;
    return active.some((p) => !placeableAnywhere(board, p.shape));
  }, [board, tray, gameOver]);

  const restart = useCallback(() => {
    const fx = fxRef.current;
    fx.particles.length = 0;
    fx.floaters.length = 0;
    fx.flashes.length = 0;
    fx.shake.mag = 0;
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
    ensureMusic();
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

      const { board: cleared, cleared: lines, rows, cols } = clearLines(next);
      let gained = placedCells;
      if (lines > 0) {
        gained += lines * 10 + (lines - 1) * 10; // thưởng combo
        playSound('break'); // tiếng nổ hàng/cột
        if (lines >= 2) playSound('combo', lines); // giai điệu combo leo thang
        triggerClearFx(next, rows, cols, lines, gained); // particle + nháy + số điểm + rung
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
        stopMusic();
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
        <div className="flex shrink-0 items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Kéo từng khối từ khay dưới lên <b>thả vào lưới</b>. Bóng khối theo ngón tay, buông tay để đặt.</p>
            <p className="mb-1.5">Lấp đầy trọn <b>một hàng ngang</b> hoặc <b>một cột dọc</b> thì hàng/cột đó <b>nổ tung</b> và được điểm.</p>
            <p className="mb-1 font-black text-fuchsia-300">Nổ nhiều dòng cùng lúc = Combo, điểm nhân lên! 💥</p>
            <p>Hết chỗ đặt cả 3 khối là kết thúc — viền lưới sẽ <span className="text-rose-300 font-black">nháy đỏ</span> khi có khối bí chỗ.</p>
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

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 py-3">
        {/* Điểm */}
        <div className="flex shrink-0 items-center gap-3">
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
          <div className="flex items-center gap-1.5 rounded-2xl bg-yellow-400/15 px-4 py-2 text-center" title="Tổng Robux của bé">
            <Gem size={18} className="fill-yellow-300/40 text-yellow-300" />
            <div className="text-2xl font-black text-yellow-300">{robuxBalance}</div>
          </div>
        </div>

        {/* Lưới — lấp đầy không gian còn lại */}
        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div ref={stageRef} className="relative" style={{ width: fitSize.w, height: fitSize.h }}>
        <div
          ref={boardRef}
          className={`grid touch-none rounded-2xl bg-slate-950/70 p-1.5 ${
            danger
              ? 'shadow-[0_0_0_3px_rgba(248,113,113,0.9)] animate-pulse'
              : 'shadow-[0_0_0_2px_rgba(96,165,250,0.4)]'
          }`}
          style={{
            width: fitSize.w,
            height: fitSize.h,
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
          {/* Lớp canvas phủ vẽ particle/số điểm/nháy sáng — không chặn thao tác kéo */}
          <canvas
            ref={fxCanvasRef}
            width={Math.round(fitSize.w)}
            height={Math.round(fitSize.h)}
            className="pointer-events-none absolute inset-0 z-10"
            style={{ width: fitSize.w, height: fitSize.h }}
          />
        </div>
        </div>

        {/* Khay 3 khối */}
        <div className="flex w-full max-w-[400px] shrink-0 items-center justify-around gap-2 rounded-2xl bg-white/5 px-2 py-3">
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
