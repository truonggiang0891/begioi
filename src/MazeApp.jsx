import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound } from './gameAudio';
import { useFitSize } from './useFitSize';
import { levelRewardRobux } from './gameRewards';
import Fireworks from './Fireworks';

// --- GAME: MÊ CUNG (Maze) ---
// Mê cung "hoàn hảo" (perfect maze) sinh ngẫu nhiên bằng thuật toán recursive-backtracker (DFS).
// Bé dò đường tới cửa thoát 🚪, dọc đường nhặt 💎 (và ⭐ ngọc vàng quý hơn) để cộng điểm.
// Không có "thua" — chơi nhẹ nhàng, xong mức thì sang mê cung lớn hơn.

const BEST_KEY = 'game_maze_best';
const MIN_SIZE = 9;
const MAX_SIZE = 15;
const GEM_SCORE = 10;
const GOLD_SCORE = 25;
const FULL_CLEAR_BONUS = 30;

const sizeForLevel = (level) => Math.min(MIN_SIZE + 2 * (level - 1), MAX_SIZE);
const levelBonus = (level) => 15 + level * 5;

// Sinh mê cung hoàn hảo n x n bằng recursive-backtracker (DFS có ngăn xếp, không đệ quy).
// Mỗi ô lưu trạng thái 4 vách: N/E/S/W = true nghĩa là CÓ tường.
function generateMaze(n) {
  const cells = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ N: true, E: true, S: true, W: true, visited: false })),
  );
  cells[0][0].visited = true;
  const stack = [[0, 0]];
  const maxIterations = n * n * 4 + 10; // chặn vòng lặp, không bao giờ vô hạn
  let iterations = 0;

  while (stack.length > 0 && iterations < maxIterations) {
    iterations += 1;
    const [r, c] = stack[stack.length - 1];
    const neighbors = [];
    if (r > 0 && !cells[r - 1][c].visited) neighbors.push(['N', r - 1, c]);
    if (c < n - 1 && !cells[r][c + 1].visited) neighbors.push(['E', r, c + 1]);
    if (r < n - 1 && !cells[r + 1][c].visited) neighbors.push(['S', r + 1, c]);
    if (c > 0 && !cells[r][c - 1].visited) neighbors.push(['W', r, c - 1]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const [dir, nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (dir === 'N') { cells[r][c].N = false; cells[nr][nc].S = false; }
    else if (dir === 'E') { cells[r][c].E = false; cells[nr][nc].W = false; }
    else if (dir === 'S') { cells[r][c].S = false; cells[nr][nc].N = false; }
    else if (dir === 'W') { cells[r][c].W = false; cells[nr][nc].E = false; }

    cells[nr][nc].visited = true;
    stack.push([nr, nc]);
  }

  return cells;
}

// Rải ngọc ngẫu nhiên trên các ô không phải điểm bắt đầu/kết thúc.
function placeGems(n) {
  const count = Math.max(4, Math.min(10, Math.round((n * n) / 14)));
  const gems = {};
  let attempts = 0;
  const maxAttempts = count * 25 + 60;

  while (Object.keys(gems).length < count && attempts < maxAttempts) {
    attempts += 1;
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    if ((r === 0 && c === 0) || (r === n - 1 && c === n - 1)) continue;
    const key = `${r},${c}`;
    if (gems[key]) continue;
    gems[key] = { golden: false, collected: false };
  }

  const keys = Object.keys(gems);
  if (keys.length > 0) {
    const goldKey = keys[Math.floor(Math.random() * keys.length)];
    gems[goldKey].golden = true;
  }

  return gems;
}

const DIR_KEYS = {
  ArrowUp: 'N',
  ArrowDown: 'S',
  ArrowLeft: 'W',
  ArrowRight: 'E',
};

export default function MazeApp({ onBack, onReward }) {
  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState(() => generateMaze(sizeForLevel(1)));
  const [gems, setGems] = useState(() => placeGems(sizeForLevel(1)));
  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [overlay, setOverlay] = useState(null); // { fullClear, bonus, isNewBest, level }
  const touchStart = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(1, 1);

  const size = maze.length;
  const totalGems = Object.keys(gems).length;
  const collectedGems = Object.values(gems).filter((g) => g.collected).length;

  const attemptMove = useCallback((dirKey) => {
    if (overlay) return;
    setPlayer((prev) => {
      const cell = maze[prev.r]?.[prev.c];
      if (!cell || cell[dirKey]) return prev;
      let { r, c } = prev;
      if (dirKey === 'N') r -= 1;
      else if (dirKey === 'S') r += 1;
      else if (dirKey === 'E') c += 1;
      else if (dirKey === 'W') c -= 1;
      if (r < 0 || c < 0 || r >= maze.length || c >= maze.length) return prev;
      return { r, c };
    });
  }, [maze, overlay]);

  // Xử lý khi vị trí người chơi thay đổi: nhặt ngọc + kiểm tra tới cửa thoát.
  useEffect(() => {
    const key = `${player.r},${player.c}`;
    const gem = gems[key];
    if (gem && !gem.collected) {
      const added = gem.golden ? GOLD_SCORE : GEM_SCORE;
      setGems((prev) => ({ ...prev, [key]: { ...prev[key], collected: true } }));
      setScore((s) => s + added);
      playSound('correct');
    }

    if (player.r === size - 1 && player.c === size - 1) {
      const total = Object.keys(gems).length;
      // Ô cửa thoát không chứa ngọc; nếu ô hiện tại vừa có ngọc mới nhặt thì cộng thêm 1.
      const trueCollected = Object.values(gems).filter((g) => g.collected).length + (gem && !gem.collected ? 1 : 0);
      const fullClear = total > 0 && trueCollected >= total;
      const bonus = levelBonus(level) + (fullClear ? FULL_CLEAR_BONUS : 0);

      // Thưởng Robux khi qua 1 màn mê cung (nhặt đủ ngọc thì thêm 1).
      onReward?.(levelRewardRobux(level + (fullClear ? 1 : 0)), `Qua mê cung màn ${level}${fullClear ? ' (đủ ngọc!)' : ''}`);

      playSound('win');
      setScore((s) => {
        const finalScore = s + bonus;
        setBest((prevBest) => {
          if (finalScore > prevBest) {
            try { localStorage.setItem(BEST_KEY, String(finalScore)); } catch { /* ignore */ }
            setOverlay({ fullClear, bonus, isNewBest: true, level });
            return finalScore;
          }
          setOverlay({ fullClear, bonus, isNewBest: false, level });
          return prevBest;
        });
        return finalScore;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const goNextLevel = () => {
    const nextLevel = level + 1;
    const n = sizeForLevel(nextLevel);
    setLevel(nextLevel);
    setMaze(generateMaze(n));
    setGems(placeGems(n));
    setPlayer({ r: 0, c: 0 });
    setOverlay(null);
  };

  const restart = () => {
    const n = sizeForLevel(1);
    setLevel(1);
    setMaze(generateMaze(n));
    setGems(placeGems(n));
    setPlayer({ r: 0, c: 0 });
    setScore(0);
    setOverlay(null);
  };

  // Bàn phím mũi tên.
  useEffect(() => {
    const onKeyDown = (e) => {
      const dir = DIR_KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      attemptMove(dir);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [attemptMove]);

  // Vuốt (chuột hoặc cảm ứng) để di chuyển.
  const handlePointerDown = (e) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e) => {
    if (!touchStart.current) return;
    const dx = e.clientX - touchStart.current.x;
    const dy = e.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; // chạm nhẹ -> để ô tự xử lý
    if (Math.abs(dx) > Math.abs(dy)) attemptMove(dx > 0 ? 'E' : 'W');
    else attemptMove(dy > 0 ? 'S' : 'N');
  };

  // Chạm vào ô ngay cạnh người chơi để bước tới đó.
  const moveToCell = (r, c) => {
    const dr = r - player.r;
    const dc = c - player.c;
    if (Math.abs(dr) + Math.abs(dc) !== 1) return;
    if (dr === -1) attemptMove('N');
    else if (dr === 1) attemptMove('S');
    else if (dc === -1) attemptMove('W');
    else if (dc === 1) attemptMove('E');
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🧭 Mê cung</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm ô cạnh 🙂 · vuốt · phím mũi tên · hoặc nút dưới 👇
          </GameHelp>
          <button
            type="button"
            onClick={restart}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20"
          >
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-2 px-2">
        <div className="rounded-2xl bg-white/10 px-4 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-indigo-200/70">Cấp</div>
          <div className="text-xl font-black text-white">{level}</div>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-indigo-200/70">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5">
          <Trophy size={16} className="text-amber-400" />
          <div className="text-xl font-black text-amber-300">{best}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5">
          <span className="text-base">💎</span>
          <div className="text-base font-black text-sky-200">{collectedGems}/{totalGems}</div>
        </div>
      </div>

      {/* Bàn mê cung — lấp đầy không gian còn lại */}
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 py-2">
        <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="grid touch-none select-none overflow-hidden rounded-xl bg-slate-950 shadow-inner"
          style={{
            width: fitSize.w,
            height: fitSize.h,
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isExit = r === size - 1 && c === size - 1;
              const isPlayer = player.r === r && player.c === c;
              const gemHere = gems[`${r},${c}`];
              const bg = isExit ? '#064e3b' : '#fef3c7';
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => moveToCell(r, c)}
                  className="relative flex cursor-pointer items-center justify-center box-border"
                  style={{
                    background: bg,
                    borderTop: `3px solid ${cell.N ? '#1e293b' : bg}`,
                    borderRight: `3px solid ${cell.E ? '#1e293b' : bg}`,
                    borderBottom: `3px solid ${cell.S ? '#1e293b' : bg}`,
                    borderLeft: `3px solid ${cell.W ? '#1e293b' : bg}`,
                  }}
                >
                  {gemHere && !gemHere.collected && (
                    <span className="text-[70%] leading-none">{gemHere.golden ? '⭐' : '💎'}</span>
                  )}
                  {isExit && !isPlayer && <span className="text-[80%] leading-none">🚪</span>}
                  {isPlayer && <span className="text-[85%] leading-none">🙂</span>}
                </div>
              );
            }),
          )}
        </div>
        </div>

        {/* D-pad */}
        <div className="grid shrink-0 grid-cols-3 grid-rows-2 gap-1.5 pb-1" style={{ width: 168 }}>
          <div />
          <button
            type="button"
            aria-label="Lên"
            onClick={() => attemptMove('N')}
            className="flex items-center justify-center rounded-xl bg-white/15 py-2 text-white transition hover:bg-white/25 active:translate-y-0.5"
          >
            <ChevronUp size={22} />
          </button>
          <div />
          <button
            type="button"
            aria-label="Trái"
            onClick={() => attemptMove('W')}
            className="flex items-center justify-center rounded-xl bg-white/15 py-2 text-white transition hover:bg-white/25 active:translate-y-0.5"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Xuống"
            onClick={() => attemptMove('S')}
            className="flex items-center justify-center rounded-xl bg-white/15 py-2 text-white transition hover:bg-white/25 active:translate-y-0.5"
          >
            <ChevronDown size={22} />
          </button>
          <button
            type="button"
            aria-label="Phải"
            onClick={() => attemptMove('E')}
            className="flex items-center justify-center rounded-xl bg-white/15 py-2 text-white transition hover:bg-white/25 active:translate-y-0.5"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {overlay?.isNewBest && <Fireworks />}
      {overlay && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{overlay.isNewBest ? '🏆' : '🎉'}</div>
            <h2 className="text-2xl font-black text-slate-700">
              {overlay.isNewBest ? 'Kỷ lục mới!' : `Xong mức ${overlay.level}!`}
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Bé đã ra tới cửa thoát! +{overlay.bonus} điểm
              {overlay.isNewBest ? ' — giỏi nhất từ trước tới giờ! 🎉' : ''}
            </p>
            {overlay.fullClear && (
              <p className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-black text-emerald-600">
                Đủ ngọc! +{FULL_CLEAR_BONUS}
              </p>
            )}
            <button
              type="button"
              onClick={goNextLevel}
              className="mt-1 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(67,56,202)] transition active:translate-y-0.5"
            >
              Mức tiếp theo ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
