import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown, ChevronRight, RotateCcw, Trophy, Gem, Timer, Lightbulb } from 'lucide-react';
import GameHelp from './GameHelp';
import { playSound, startMusic, killMusic } from './gameAudio';
import { SoundToggle } from './gameUI';
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
const HINT_MAX = 3;          // số lần "Gợi ý đường" mỗi màn
const HINT_MS = 2000;        // đường gợi ý sáng trong ~2 giây
const SPEED_BONUS = 20;      // thưởng thêm nếu qua màn nhanh

const sizeForLevel = (level) => Math.min(MIN_SIZE + 2 * (level - 1), MAX_SIZE);
const levelBonus = (level) => 15 + level * 5;
// Mốc thời gian "nhanh" cho mỗi màn (giây) — qua màn dưới mốc này được thưởng thêm.
const parTime = (n) => n * 3;

// Định dạng giây -> mm:ss cho đồng hồ.
const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

// BFS trên mê cung: tìm đường ngắn nhất từ người chơi tới ngọc gần nhất còn lại
// (nếu không còn ngọc thì tới cửa thoát). Trả về Set các khóa "r,c" nằm trên đường.
function findHintPath(maze, start, gems) {
  const n = maze.length;
  const keyOf = (r, c) => `${r},${c}`;
  const startKey = keyOf(start.r, start.c);
  const prev = new Map();
  const dist = new Map([[startKey, 0]]);
  const queue = [start];
  const dirs = [['N', -1, 0], ['S', 1, 0], ['E', 0, 1], ['W', 0, -1]];

  // Duyệt toàn bộ ô tới được (mê cung hoàn hảo -> mọi ô đều tới được) để có khoảng cách.
  while (queue.length > 0) {
    const cur = queue.shift();
    const cell = maze[cur.r][cur.c];
    for (const [d, dr, dc] of dirs) {
      if (cell[d]) continue; // có tường -> không đi qua được
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
      const nk = keyOf(nr, nc);
      if (dist.has(nk)) continue;
      dist.set(nk, dist.get(keyOf(cur.r, cur.c)) + 1);
      prev.set(nk, keyOf(cur.r, cur.c));
      queue.push({ r: nr, c: nc });
    }
  }

  // Chọn đích: ngọc còn lại gần nhất, nếu hết ngọc thì cửa thoát.
  let target = null;
  let bestD = Infinity;
  for (const gk of Object.keys(gems)) {
    if (gems[gk].collected) continue;
    const d = dist.get(gk);
    if (d != null && d < bestD) { bestD = d; target = gk; }
  }
  if (!target) target = keyOf(n - 1, n - 1);

  // Dựng lại đường từ đích về người chơi.
  const path = new Set();
  let k = target;
  while (k !== undefined) {
    path.add(k);
    k = prev.get(k);
  }
  return path;
}

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

export default function MazeApp({ onBack, onReward, robuxBalance = 0 }) {
  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState(() => generateMaze(sizeForLevel(1)));
  const [gems, setGems] = useState(() => placeGems(sizeForLevel(1)));
  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [overlay, setOverlay] = useState(null); // { fullClear, bonus, isNewBest, level, fast }
  const [seconds, setSeconds] = useState(0);    // đồng hồ tính giờ của màn hiện tại
  const [hintsLeft, setHintsLeft] = useState(HINT_MAX); // số lần gợi ý còn lại
  const [hintPath, setHintPath] = useState(null); // Set các ô đang được tô sáng
  const [sparks, setSparks] = useState([]);     // hiệu ứng lấp lánh khi nhặt ngọc
  const touchStart = useRef(null);
  const { ref: fitRef, size: fitSize } = useFitSize(1, 1);
  const musicRef = useRef(false);               // đã bật nhạc nền chưa
  const secondsRef = useRef(0);                 // đọc thời gian trong lúc xử lý qua màn
  const hintTimerRef = useRef(null);            // hẹn giờ tắt đường gợi ý
  const sparkIdRef = useRef(0);                 // id tăng dần cho mỗi lấp lánh

  // Bật nhạc nền 'calm' ở lần tương tác đầu (khi bé bắt đầu di chuyển).
  const ensureMusic = useCallback(() => {
    if (musicRef.current) return;
    musicRef.current = true;
    startMusic('calm');
  }, []);

  const size = maze.length;
  const totalGems = Object.keys(gems).length;
  const collectedGems = Object.values(gems).filter((g) => g.collected).length;

  const attemptMove = useCallback((dirKey) => {
    if (overlay) return;
    ensureMusic(); // lần di chuyển đầu -> bật nhạc nền
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
  }, [maze, overlay, ensureMusic]);

  // Xử lý khi vị trí người chơi thay đổi: nhặt ngọc + kiểm tra tới cửa thoát.
  useEffect(() => {
    const key = `${player.r},${player.c}`;
    const gem = gems[key];
    if (gem && !gem.collected) {
      const added = gem.golden ? GOLD_SCORE : GEM_SCORE;
      setGems((prev) => ({ ...prev, [key]: { ...prev[key], collected: true } }));
      setScore((s) => s + added);
      playSound('coin'); // âm nhặt ngọc lấp lánh
      // Bắn hiệu ứng lấp lánh tại ô vừa nhặt (tự biến mất sau ~0.7s).
      const sid = (sparkIdRef.current += 1);
      const golden = gem.golden;
      setSparks((prev) => [...prev, { id: sid, r: player.r, c: player.c, golden }]);
      setTimeout(() => setSparks((prev) => prev.filter((s) => s.id !== sid)), 700);
    }

    if (player.r === size - 1 && player.c === size - 1) {
      const total = Object.keys(gems).length;
      // Ô cửa thoát không chứa ngọc; nếu ô hiện tại vừa có ngọc mới nhặt thì cộng thêm 1.
      const trueCollected = Object.values(gems).filter((g) => g.collected).length + (gem && !gem.collected ? 1 : 0);
      const fullClear = total > 0 && trueCollected >= total;
      // Thưởng thêm nếu bé qua màn nhanh hơn mốc thời gian.
      const fast = secondsRef.current <= parTime(size);
      const bonus = levelBonus(level) + (fullClear ? FULL_CLEAR_BONUS : 0) + (fast ? SPEED_BONUS : 0);

      // Thưởng Robux khi qua 1 màn mê cung (nhặt đủ ngọc thì thêm 1).
      onReward?.(levelRewardRobux(level + (fullClear ? 1 : 0)), `Qua mê cung màn ${level}${fullClear ? ' (đủ ngọc!)' : ''}`);

      // Âm mừng qua màn + dừng nhạc nền (sẽ bật lại khi bắt đầu màn mới).
      playSound('win');
      playSound('levelup');
      killMusic();
      musicRef.current = false;
      setScore((s) => {
        const finalScore = s + bonus;
        setBest((prevBest) => {
          if (finalScore > prevBest) {
            try { localStorage.setItem(BEST_KEY, String(finalScore)); } catch { /* ignore */ }
            setOverlay({ fullClear, bonus, isNewBest: true, level, fast });
            return finalScore;
          }
          setOverlay({ fullClear, bonus, isNewBest: false, level, fast });
          return prevBest;
        });
        return finalScore;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Đặt lại đồng hồ + gợi ý cho một màn mới.
  const resetPerLevel = () => {
    setSeconds(0);
    secondsRef.current = 0;
    setHintsLeft(HINT_MAX);
    setHintPath(null);
    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
  };

  const goNextLevel = () => {
    const nextLevel = level + 1;
    const n = sizeForLevel(nextLevel);
    setLevel(nextLevel);
    setMaze(generateMaze(n));
    setGems(placeGems(n));
    setPlayer({ r: 0, c: 0 });
    setOverlay(null);
    resetPerLevel();
  };

  const restart = () => {
    const n = sizeForLevel(1);
    setLevel(1);
    setMaze(generateMaze(n));
    setGems(placeGems(n));
    setPlayer({ r: 0, c: 0 });
    setScore(0);
    setOverlay(null);
    resetPerLevel();
  };

  // Đồng hồ đếm giây — chạy khi chưa qua màn.
  useEffect(() => {
    if (overlay) return undefined; // dừng đồng hồ khi hiện bảng qua màn
    const t = setInterval(() => {
      setSeconds((s) => {
        const nv = s + 1;
        secondsRef.current = nv;
        return nv;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [overlay, level]);

  // Skill "Gợi ý đường": tô sáng đường ngắn nhất tới ngọc gần nhất / cửa thoát ~2s.
  const useHint = () => {
    if (overlay || hintsLeft <= 0) return;
    ensureMusic();
    const path = findHintPath(maze, player, gems);
    setHintPath(path);
    setHintsLeft((h) => h - 1);
    playSound('powerup');
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => { setHintPath(null); hintTimerRef.current = null; }, HINT_MS);
  };

  // Dọn dẹp khi rời game: tắt nhạc nền + hủy hẹn giờ gợi ý.
  useEffect(() => () => {
    killMusic();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

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
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      {/* Hiệu ứng CSS: đường gợi ý nhấp nháy + lấp lánh khi nhặt ngọc */}
      <style>{`
        @keyframes maze-hint-pulse { 0%,100% { opacity:.35; transform:scale(.7) } 50% { opacity:1; transform:scale(1) } }
        .maze-hint { background: radial-gradient(circle, #34d399 0%, #10b981 70%); box-shadow: 0 0 6px 2px rgba(52,211,153,.8); animation: maze-hint-pulse .8s ease-in-out infinite; }
        .maze-spark i { position:absolute; left:50%; top:50%; width:16%; height:16%; border-radius:9999px; transform: rotate(var(--a)) translateY(0) scale(1); animation: maze-spark-fly .7s ease-out forwards; }
        @keyframes maze-spark-fly {
          0% { opacity:1; transform: rotate(var(--a)) translateY(-6%) scale(1); }
          100% { opacity:0; transform: rotate(var(--a)) translateY(-140%) scale(.2); }
        }
      `}</style>
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
            Chạm ô cạnh 🙂 · vuốt · phím mũi tên · hoặc nút dưới 👇. Bí đường? Bấm 💡 Gợi ý!
          </GameHelp>
          <SoundToggle />
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
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5" title="Thời gian màn này">
          <Timer size={16} className="text-emerald-300" />
          <div className="text-base font-black tabular-nums text-emerald-200">{fmtTime(seconds)}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5">
          <Trophy size={16} className="text-amber-400" />
          <div className="text-xl font-black text-amber-300">{best}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-1.5">
          <span className="text-base">💎</span>
          <div className="text-base font-black text-sky-200">{collectedGems}/{totalGems}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-yellow-400/15 px-4 py-1.5" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300/40 text-yellow-300" />
          <div className="text-xl font-black text-yellow-300">{robuxBalance}</div>
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
              const cellKey = `${r},${c}`;
              const gemHere = gems[cellKey];
              const onHint = hintPath?.has(cellKey);
              const sparkHere = sparks.filter((s) => s.r === r && s.c === c);
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
                  {/* Ô nằm trên đường gợi ý -> chấm sáng nhấp nháy */}
                  {onHint && !isPlayer && (
                    <span className="pointer-events-none absolute inset-[18%] rounded-full maze-hint" />
                  )}
                  {gemHere && !gemHere.collected && (
                    <span className="text-[70%] leading-none">{gemHere.golden ? '⭐' : '💎'}</span>
                  )}
                  {isExit && !isPlayer && <span className="text-[80%] leading-none">🚪</span>}
                  {isPlayer && <span className="text-[85%] leading-none">🙂</span>}
                  {/* Lấp lánh khi vừa nhặt ngọc */}
                  {sparkHere.map((s) => (
                    <span key={s.id} className="pointer-events-none absolute inset-0 maze-spark">
                      {Array.from({ length: 8 }, (_, i) => (
                        <i
                          key={i}
                          style={{ '--a': `${i * 45}deg`, background: s.golden ? '#fde047' : '#67e8f9' }}
                        />
                      ))}
                    </span>
                  ))}
                </div>
              );
            }),
          )}
        </div>
        </div>

        {/* Skill "Gợi ý đường" — tô sáng lối tới ngọc/cửa, giới hạn 3 lần/màn */}
        <button
          type="button"
          onClick={useHint}
          disabled={hintsLeft <= 0}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black shadow transition active:translate-y-0.5 ${
            hintsLeft > 0
              ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
              : 'cursor-not-allowed bg-white/10 text-white/40'
          }`}
        >
          <Lightbulb size={16} /> Gợi ý ({hintsLeft})
        </button>

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
            {overlay.fast && (
              <p className="rounded-full bg-sky-100 px-4 py-1 text-sm font-black text-sky-600">
                ⚡ Siêu nhanh! +{SPEED_BONUS}
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
