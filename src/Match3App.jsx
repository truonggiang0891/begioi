import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Trophy, Lightbulb } from 'lucide-react';
import { playSound, emojiFont } from './gameAudio';
import { useFitSize } from './useFitSize';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { useScoreRewards } from './gameRewards';

// --- GAME: XẾP KẸO (Match-3, kiểu Candy) ---
// Bàn 7x7, đổi chỗ 2 viên kẹo kề nhau để tạo hàng 3+ giống nhau -> nổ, rơi, lấp đầy, dây chuyền.

const BEST_KEY = 'game_match3_best';
const SIZE = 7;
const CANDIES = ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'];
const TYPES = CANDIES.length;
const START_MOVES = 20;
const BONUS_MOVES = 2;
const MAX_ITER = 30;
const START_HINTS = 3;

const randType = () => Math.floor(Math.random() * TYPES);

const cloneBoard = (board) => board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

// Tạo bàn cờ ban đầu, tránh có sẵn hàng 3+ trùng nhau.
const makeBoard = () => {
  const b = [];
  for (let r = 0; r < SIZE; r += 1) {
    const row = [];
    for (let c = 0; c < SIZE; c += 1) {
      let t;
      let tries = 0;
      do {
        t = randType();
        tries += 1;
      } while (
        tries < 20 &&
        ((c >= 2 && row[c - 1]?.type === t && row[c - 2]?.type === t) ||
          (r >= 2 && b[r - 1][c].type === t && b[r - 2][c].type === t))
      );
      row.push({ type: t, special: null });
    }
    b.push(row);
  }
  return b;
};

// Tìm tất cả các dãy (hàng ngang / cột dọc) có 3 viên trùng loại trở lên.
const findMatchGroups = (board) => {
  const groups = [];
  for (let r = 0; r < SIZE; r += 1) {
    let c = 0;
    while (c < SIZE) {
      const cell = board[r][c];
      if (!cell) { c += 1; continue; }
      let end = c;
      while (end + 1 < SIZE && board[r][end + 1] && board[r][end + 1].type === cell.type) end += 1;
      const len = end - c + 1;
      if (len >= 3) {
        const cells = [];
        for (let cc = c; cc <= end; cc += 1) cells.push({ r, c: cc });
        groups.push({ cells, length: len, orientation: 'row', type: cell.type });
      }
      c = end + 1;
    }
  }
  for (let c = 0; c < SIZE; c += 1) {
    let r = 0;
    while (r < SIZE) {
      const cell = board[r][c];
      if (!cell) { r += 1; continue; }
      let end = r;
      while (end + 1 < SIZE && board[end + 1][c] && board[end + 1][c].type === cell.type) end += 1;
      const len = end - r + 1;
      if (len >= 3) {
        const cells = [];
        for (let rr = r; rr <= end; rr += 1) cells.push({ r: rr, c });
        groups.push({ cells, length: len, orientation: 'col', type: cell.type });
      }
      r = end + 1;
    }
  }
  return { groups };
};

const pickSpecialPos = (cells, hint) => {
  if (hint && cells.some((c) => c.r === hint.r && c.c === hint.c)) return hint;
  return cells[Math.floor(cells.length / 2)];
};

// Trọng lực: các viên rơi xuống, ô trống trên đầu được lấp bằng kẹo mới ngẫu nhiên.
const applyGravityAndRefill = (board) => {
  for (let c = 0; c < SIZE; c += 1) {
    const colVals = [];
    for (let r = 0; r < SIZE; r += 1) if (board[r][c]) colVals.push(board[r][c]);
    const missing = SIZE - colVals.length;
    const newCells = [];
    for (let i = 0; i < missing; i += 1) newCells.push({ type: randType(), special: null });
    const combined = [...newCells, ...colVals];
    for (let r = 0; r < SIZE; r += 1) board[r][c] = combined[r];
  }
};

// Xử lý dây chuyền (cascade) sau một lượt đổi chỗ hợp lệ.
const resolveCascades = (initialBoard, hintPos) => {
  const workingBoard = initialBoard;
  let totalScore = 0;
  let bonusMoves = 0;
  let maxCombo = 0;
  let hint = hintPos;

  for (let iter = 0; iter < MAX_ITER; iter += 1) {
    const { groups } = findMatchGroups(workingBoard);
    if (groups.length === 0) break;
    maxCombo = iter + 1;

    const toClear = new Set();
    const newSpecials = [];
    groups.forEach((g) => {
      g.cells.forEach(({ r, c }) => toClear.add(`${r},${c}`));
      if (g.length === 4) {
        const pos = pickSpecialPos(g.cells, hint);
        newSpecials.push({ ...pos, orientation: g.orientation, type: g.type });
      } else if (g.length >= 5) {
        bonusMoves += BONUS_MOVES;
        const pos = pickSpecialPos(g.cells, hint);
        newSpecials.push({ ...pos, orientation: g.orientation, type: g.type });
      }
    });

    // Kẹo đặc biệt bị nổ sẽ kéo theo cả hàng/cột của nó.
    for (let pass = 0; pass < SIZE; pass += 1) {
      let added = false;
      Array.from(toClear).forEach((k) => {
        const [r, c] = k.split(',').map(Number);
        const cell = workingBoard[r][c];
        if (cell && cell.special === 'row') {
          for (let cc = 0; cc < SIZE; cc += 1) {
            const kk = `${r},${cc}`;
            if (!toClear.has(kk)) { toClear.add(kk); added = true; }
          }
        } else if (cell && cell.special === 'col') {
          for (let rr = 0; rr < SIZE; rr += 1) {
            const kk = `${rr},${c}`;
            if (!toClear.has(kk)) { toClear.add(kk); added = true; }
          }
        }
      });
      if (!added) break;
    }

    totalScore += toClear.size * 10 * (iter + 1);
    newSpecials.forEach((pos) => toClear.delete(`${pos.r},${pos.c}`));
    toClear.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      workingBoard[r][c] = null;
    });
    newSpecials.forEach((pos) => {
      workingBoard[pos.r][pos.c] = { type: pos.type, special: pos.orientation };
    });

    applyGravityAndRefill(workingBoard);
    hint = null;
  }

  return { board: workingBoard, totalScore, bonusMoves, maxCombo };
};

// Tìm một nước đi hợp lệ (đổi 2 viên kề nhau tạo được hàng 3+). Null = bế tắc.
const findHint = (board) => {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (c + 1 < SIZE) {
        const nb = cloneBoard(board);
        const t = nb[r][c]; nb[r][c] = nb[r][c + 1]; nb[r][c + 1] = t;
        if (findMatchGroups(nb).groups.length > 0) return { a: { r, c }, b: { r, c: c + 1 } };
      }
      if (r + 1 < SIZE) {
        const nb = cloneBoard(board);
        const t = nb[r][c]; nb[r][c] = nb[r + 1][c]; nb[r + 1][c] = t;
        if (findMatchGroups(nb).groups.length > 0) return { a: { r, c }, b: { r: r + 1, c } };
      }
    }
  }
  return null;
};

export default function Match3App({ onBack, onReward }) {
  const [board, setBoard] = useState(() => makeBoard());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [movesLeft, setMovesLeft] = useState(START_MOVES);
  const [message, setMessage] = useState('');
  const [hintsLeft, setHintsLeft] = useState(START_HINTS);
  const [hintCells, setHintCells] = useState(null); // [{r,c},{r,c}] đang gợi ý
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);

  const scoreRef = useRef(0);
  const { ref: fitRef, size: fitSize } = useFitSize(1, 1);
  const prevOver = useRef(false);
  const toastTimer = useRef(null);
  const hintTimer = useRef(null);
  const dragRef = useRef(null); // {r,c,x0,y0,done} cho thao tác trượt
  const swappingRef = useRef(false); // đang chạy animation đổi chỗ -> khoá thao tác
  const [swapAnim, setSwapAnim] = useState(null); // {a,b,back} để trượt mượt (kể cả đổi sai)
  const [pops, setPops] = useState([]); // hiệu ứng nổ tại ô vừa ăn

  useEffect(() => { scoreRef.current = score; }, [score]);

  const showToast = useCallback((text) => {
    setMessage(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(''), 1600);
  }, []);

  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(hintTimer.current); }, []);

  // Hết lượt -> kết thúc ván (suy ra trực tiếp từ số lượt còn lại).
  const over = movesLeft <= 0;

  // Kỷ lục mới.
  useEffect(() => {
    if (over && !prevOver.current) {
      if (scoreRef.current > best) {
        setBest(scoreRef.current);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(scoreRef.current)); } catch { /* ignore */ }
        playSound('win');
      }
    }
    prevOver.current = over;
  }, [over, best]);

  const restart = () => {
    clearTimeout(toastTimer.current);
    clearTimeout(hintTimer.current);
    setBoard(makeBoard());
    setSelected(null);
    setHintCells(null);
    setHintsLeft(START_HINTS);
    setScore(0);
    setMovesLeft(START_MOVES);
    setMessage('');
    setNewRecord(false);
  };

  // Đổi chỗ 2 viên KỀ NHAU a,b — có animation TRƯỢT mượt: đúng thì nổ, sai thì trượt rồi bật lại.
  const animateSwap = (a, b) => {
    if (over || swappingRef.current) return;
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    if (dr + dc !== 1) return;

    swappingRef.current = true;
    setSelected(null);
    setHintCells(null);

    const nb = cloneBoard(board);
    const tmp = nb[a.r][a.c];
    nb[a.r][a.c] = nb[b.r][b.c];
    nb[b.r][b.c] = tmp;
    const { groups } = findMatchGroups(nb);
    const valid = groups.length > 0;

    setSwapAnim({ a, b, back: false });

    window.setTimeout(() => {
      if (!valid) {
        // Đổi sai: trượt về vị trí cũ (bật lại) rồi thôi.
        playSound('wrong');
        setSwapAnim({ a, b, back: true });
        window.setTimeout(() => { setSwapAnim(null); swappingRef.current = false; }, 170);
        return;
      }

      // Đúng: hiệu ứng nổ tại các ô khớp đầu tiên, rồi giải quyết dây chuyền.
      const burstKeys = new Set();
      groups.forEach((g) => g.cells.forEach((cc) => burstKeys.add(`${cc.r},${cc.c}`)));
      const bursts = Array.from(burstKeys).map((k, i) => {
        const [pr, pc] = k.split(',').map(Number);
        return { key: `${Date.now()}-${i}`, r: pr, c: pc };
      });
      setPops(bursts);
      window.setTimeout(() => setPops([]), 420);

      const { board: finalBoard, totalScore, bonusMoves, maxCombo } = resolveCascades(nb, b);
      setBoard(finalBoard);
      setSwapAnim(null);
      swappingRef.current = false;
      setScore((s) => s + totalScore);
      setMovesLeft((m) => Math.max(0, m - 1 + bonusMoves));
      if (maxCombo >= 2) setHintsLeft((h) => Math.min(9, h + 1));

      if (bonusMoves > 0 && maxCombo > 1) showToast(`Combo x${maxCombo}! +${bonusMoves} lượt +1 💡`);
      else if (bonusMoves > 0) showToast(`+${bonusMoves} lượt! 🎁`);
      else if (maxCombo > 1) showToast(`Combo x${maxCombo}! +1 💡`);

      playSound('correct');

      if (!findHint(finalBoard)) {
        clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => {
          setBoard(makeBoard());
          showToast('Xáo lại bàn — hết nước đi! 🔀');
        }, 500);
      }
    }, 170);
  };

  const handleTapCell = (r, c) => {
    if (over || swappingRef.current) return;
    if (!selected) { setSelected({ r, c }); return; }
    if (selected.r === r && selected.c === c) { setSelected(null); return; }

    const dr = Math.abs(selected.r - r);
    const dc = Math.abs(selected.c - c);
    if (dr + dc !== 1) { setSelected({ r, c }); return; }

    animateSwap(selected, { r, c });
  };

  // Trượt: nhấn 1 viên rồi kéo về hướng viên kề bên để đổi chỗ.
  const onCellPointerDown = (r, c, e) => {
    if (over) return;
    dragRef.current = { r, c, x0: e.clientX, y0: e.clientY, done: false };
  };
  const onBoardPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.done) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    const cell = (fitSize.w / SIZE) || 40;
    if (Math.hypot(dx, dy) < cell * 0.35) return;
    let tr = d.r;
    let tc = d.c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    d.done = true;
    if (tr >= 0 && tr < SIZE && tc >= 0 && tc < SIZE) animateSwap({ r: d.r, c: d.c }, { r: tr, c: tc });
    else setSelected(null);
  };
  const onBoardPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.done) handleTapCell(d.r, d.c); // không kéo -> coi như chạm chọn
  };

  // Gợi ý: sáng 2 viên có thể đổi; hết nước đi thì xáo lại bàn (miễn phí).
  const useHint = () => {
    if (over) return;
    const move = findHint(board);
    if (!move) {
      setBoard(makeBoard());
      setSelected(null);
      showToast('Xáo lại bàn — hết nước đi! 🔀');
      return;
    }
    if (hintsLeft <= 0) {
      showToast('Hết gợi ý — tạo combo để nhận thêm 🎁');
      return;
    }
    setHintsLeft((h) => h - 1);
    setHintCells([move.a, move.b]);
    playSound('pop');
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintCells(null), 2000);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-indigo-950 via-purple-900 to-fuchsia-950">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-black text-white transition hover:bg-white/25">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🍬 Xếp kẹo</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <b>Trượt</b> hoặc chạm để đổi 2 viên kẹo kề nhau · xếp 3 viên giống nhau để nổ ghi điểm · 4 viên tạo kẹo đặc biệt · Bấm <b>💡 Gợi ý</b> khi bí (tạo combo để nhận thêm gợi ý).
          </GameHelp>
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-black text-white transition hover:bg-white/25">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        <div className="rounded-2xl bg-white/10 px-4 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-white/60">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5">
          <Trophy size={16} className="text-amber-400" />
          <div className="text-xl font-black text-amber-300">{best}</div>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-white/60">Lượt</div>
          <div className={`text-xl font-black ${movesLeft <= 5 ? 'text-rose-400' : 'text-white'}`}>{movesLeft}</div>
        </div>
        <button
          type="button"
          onClick={useHint}
          disabled={over}
          className="flex items-center gap-1.5 rounded-2xl bg-yellow-300/20 px-4 py-2 font-black text-yellow-200 transition hover:bg-yellow-300/30 active:scale-95 disabled:opacity-40"
        >
          <Lightbulb size={18} className="fill-yellow-300/60" />
          <span className="text-lg">{hintsLeft}</span>
        </button>
      </div>

      <div className="relative flex h-6 items-center justify-center">
        {message && (
          <div className="rounded-full bg-yellow-300/90 px-4 py-1 text-sm font-black text-purple-900 shadow">
            {message}
          </div>
        )}
      </div>

      <div ref={fitRef} className="flex min-h-0 flex-1 items-center justify-center px-2 pb-3">
        <div
          className="relative grid touch-none grid-cols-7 gap-1 rounded-2xl bg-black/20 p-2"
          style={{ width: fitSize.w, height: fitSize.w }}
          onPointerMove={onBoardPointerMove}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={onBoardPointerUp}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected && selected.r === r && selected.c === c;
              const isHint = hintCells && hintCells.some((h) => h.r === r && h.c === c);
              // Trượt: ô a/b dịch về phía nhau (kể cả khi đổi sai rồi bật lại).
              let cellTransform;
              if (swapAnim && !swapAnim.back) {
                const { a, b } = swapAnim;
                if (r === a.r && c === a.c) cellTransform = `translate(calc(${b.c - a.c} * (100% + 4px)), calc(${b.r - a.r} * (100% + 4px)))`;
                else if (r === b.r && c === b.c) cellTransform = `translate(calc(${a.c - b.c} * (100% + 4px)), calc(${a.r - b.r} * (100% + 4px)))`;
              }
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onPointerDown={(e) => onCellPointerDown(r, c, e)}
                  className={`relative flex aspect-square select-none items-center justify-center rounded-xl text-xl transition-all duration-150 sm:text-2xl ${
                    isSelected
                      ? 'scale-95 bg-white/40 ring-4 ring-white'
                      : isHint
                        ? 'bg-yellow-300/30 ring-4 ring-yellow-300 animate-pulse'
                        : 'bg-white/10 hover:bg-white/20'
                  }`}
                  style={{ ...emojiFont, transform: cellTransform, zIndex: cellTransform ? 5 : undefined }}
                  aria-label="kẹo"
                >
                  {cell && CANDIES[cell.type]}
                  {cell?.special === 'row' && (
                    <span className="pointer-events-none absolute inset-x-0.5 bottom-0.5 h-1 rounded bg-yellow-300" />
                  )}
                  {cell?.special === 'col' && (
                    <span className="pointer-events-none absolute inset-y-0.5 right-0.5 w-1 rounded bg-yellow-300" />
                  )}
                </button>
              );
            }),
          )}

          {/* Hiệu ứng nổ khi ăn kẹo */}
          {pops.map((p) => {
            const cellW = (fitSize.w - 40) / SIZE;
            const pitch = cellW + 4;
            return (
              <span
                key={p.key}
                className="m3-burst pointer-events-none absolute"
                style={{
                  left: 8 + cellW / 2 + p.c * pitch,
                  top: 8 + cellW / 2 + p.r * pitch,
                  width: cellW * 1.5,
                  height: cellW * 1.5,
                }}
              />
            );
          })}
        </div>
      </div>
      <style>{`
        .m3-burst {
          transform: translate(-50%, -50%) scale(0.3);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.85) 35%, rgba(244,114,182,0.35) 60%, rgba(244,114,182,0) 75%);
          animation: m3-pop 0.42s ease-out forwards;
        }
        @keyframes m3-pop {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          60% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🍬'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết lượt rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-fuchsia-600">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-1 rounded-full bg-gradient-to-b from-fuchsia-400 to-purple-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(126,34,206)] transition active:translate-y-0.5"
            >
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
