import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { ChevronLeft, Clock, Heart, Gem } from 'lucide-react';
import { playSound, emojiFont } from './gameAudio';
// Lazy-load từng game: mỗi game thành 1 chunk riêng, chỉ tải khi bé mở game đó
// -> chunk chính nhẹ đi, app mở nhanh hơn (nhất là khi chưa vào khu Game).
const GameApp = lazy(() => import('./GameApp'));
const MemoryApp = lazy(() => import('./MemoryApp'));
const BlockPuzzleApp = lazy(() => import('./BlockPuzzleApp'));
const TetrisApp = lazy(() => import('./TetrisApp'));
const SnakeApp = lazy(() => import('./SnakeApp'));
const BreakoutApp = lazy(() => import('./BreakoutApp'));
const ShooterApp = lazy(() => import('./ShooterApp'));
const BubbleShooterApp = lazy(() => import('./BubbleShooterApp'));
const BalloonPopApp = lazy(() => import('./BalloonPopApp'));
const TargetShootApp = lazy(() => import('./TargetShootApp'));
const CannonApp = lazy(() => import('./CannonApp'));
const AnswerShooterApp = lazy(() => import('./AnswerShooterApp'));
const SpaceBattleApp = lazy(() => import('./SpaceBattleApp'));
const FlappyApp = lazy(() => import('./FlappyApp'));
const DoodleJumpApp = lazy(() => import('./DoodleJumpApp'));
const CatchApp = lazy(() => import('./CatchApp'));
const WhackApp = lazy(() => import('./WhackApp'));
const FruitSliceApp = lazy(() => import('./FruitSliceApp'));
const MazeApp = lazy(() => import('./MazeApp'));
const Match3App = lazy(() => import('./Match3App'));
const RobotArenaApp = lazy(() => import('./RobotArenaApp'));
const DogfightApp = lazy(() => import('./DogfightApp'));
const SurvivorApp = lazy(() => import('./SurvivorApp'));
const StackApp = lazy(() => import('./StackApp'));
const SpotDiffApp = lazy(() => import('./SpotDiffApp'));

// --- KHU VUI CHƠI ---
// Hub chứa toàn bộ mini-game cho bé, mở từ nút "Game" trong app.
// Mỗi game là 1 component full-screen với prop onBack (quay lại danh sách).

const formatGameClock = (totalSec) => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Hệ số giảm thưởng Robux (3 = chỉ còn 1/3 so với game tính ra). Tăng để thưởng ít hơn nữa.
const REWARD_DIVISOR = 3;

const FAV_KEY = 'game_favorites';
const loadFavs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export default function GamesApp({ onBack, timeLeftSec = 0, unlimitedTime = false, onReward, robuxBalance = 0 }) {
  const [screen, setScreen] = useState('home');
  const [favorites, setFavorites] = useState(loadFavs);
  const [rewardToast, setRewardToast] = useState(null); // { rb, reason, key }
  const rewardTimer = useRef(null);
  const back = () => setScreen('home');

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { /* ignore */ }
  }, [favorites]);
  useEffect(() => () => clearTimeout(rewardTimer.current), []);

  const toggleFav = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Nhận thưởng từ game: giảm còn ~1/3 rồi cộng Robux tổng + hiện quà bay lên.
  const reward = useCallback((rb, reason) => {
    const amt = Math.round((Number(rb) || 0) / REWARD_DIVISOR);
    if (amt < 1) return; // sau khi giảm mà < 1 thì bỏ qua
    onReward?.(amt);
    setRewardToast({ rb: amt, reason, key: `${amt}-${reason}-${Math.round(timeLeftSec)}-${Math.random()}` });
    clearTimeout(rewardTimer.current);
    rewardTimer.current = setTimeout(() => setRewardToast(null), 2200);
  }, [onReward, timeLeftSec]);

  const rewardToastEl = rewardToast && (
    <div key={rewardToast.key} className="pointer-events-none fixed left-1/2 top-[calc(4rem+env(safe-area-inset-top))] z-[80] -translate-x-1/2 animate-[reward-pop_2.2s_ease-out_forwards]">
      <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-yellow-300 bg-slate-900/90 px-5 py-2.5 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xl font-black text-yellow-300">
          <Gem size={20} className="fill-yellow-300/40" /> +{rewardToast.rb} Robux!
        </div>
        {rewardToast.reason && <div className="text-[11px] font-bold text-white/70">{rewardToast.reason}</div>}
      </div>
      <style>{'@keyframes reward-pop{0%{opacity:0;transform:translate(-50%,10px) scale(.7)}12%{opacity:1;transform:translate(-50%,0) scale(1.08)}22%{transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px) scale(1)}}'}</style>
    </div>
  );

  const loadingFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-300" />
      <div className="text-sm font-black text-white/70">Đang tải trò chơi…</div>
    </div>
  );
  const wrap = (node) => (
    <div className="fixed inset-0 z-[60] bg-slate-900">
      <Suspense fallback={loadingFallback}>{node}</Suspense>
      {rewardToastEl}
    </div>
  );

  if (screen === 'puzzle') return wrap(<GameApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'memory') return wrap(<MemoryApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'block') return wrap(<BlockPuzzleApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'tetris') return wrap(<TetrisApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'snake') return wrap(<SnakeApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'breakout') return wrap(<BreakoutApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'shooter') return wrap(<ShooterApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'bubble') return wrap(<BubbleShooterApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'balloon') return wrap(<BalloonPopApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'target') return wrap(<TargetShootApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'cannon') return wrap(<CannonApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'mathshoot') return wrap(<AnswerShooterApp mode="math" onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'lettershoot') return wrap(<AnswerShooterApp mode="letter" onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'battle') return wrap(<SpaceBattleApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'flappy') return wrap(<FlappyApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'doodle') return wrap(<DoodleJumpApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'catch') return wrap(<CatchApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'whack') return wrap(<WhackApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'fruit') return wrap(<FruitSliceApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'maze') return wrap(<MazeApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'match3') return wrap(<Match3App onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'arena') return wrap(<RobotArenaApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'dogfight') return wrap(<DogfightApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'survivor') return wrap(<SurvivorApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'stack') return wrap(<StackApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);
  if (screen === 'spotdiff') return wrap(<SpotDiffApp onBack={back} onReward={reward} robuxBalance={robuxBalance} />);

  const cards = [
    { id: 'puzzle', emoji: '🧩', title: 'Ghép hình', desc: 'Chạm 2 ô để đổi chỗ', bg: 'from-orange-100 to-amber-200' },
    { id: 'memory', emoji: '🃏', title: 'Lật thẻ tìm cặp', desc: 'Tìm 2 thẻ giống nhau', bg: 'from-violet-100 to-sky-200' },
    { id: 'block', emoji: '🧱', title: 'Xếp khối', desc: 'Kéo khối lấp đầy hàng', bg: 'from-sky-100 to-indigo-200' },
    { id: 'tetris', emoji: '⬇️', title: 'Khối rơi', desc: 'Xoay & xếp khối rơi', bg: 'from-emerald-100 to-teal-200' },
    { id: 'snake', emoji: '🐍', title: 'Rắn săn mồi', desc: 'Ăn mồi, đừng đụng tường', bg: 'from-lime-100 to-emerald-200' },
    { id: 'breakout', emoji: '🧱', title: 'Phá gạch', desc: 'Bật bóng phá gạch', bg: 'from-rose-100 to-orange-200' },
    { id: 'shooter', emoji: '🚀', title: 'Bắn gạch', desc: 'Lái thuyền, tự bắn', bg: 'from-cyan-100 to-blue-200' },
    { id: 'bubble', emoji: '🫧', title: 'Bắn bong bóng', desc: 'Ngắm bắn 3 bóng cùng màu', bg: 'from-indigo-100 to-purple-200' },
    { id: 'balloon', emoji: '🎈', title: 'Bắn bóng bay', desc: 'Chạm cho bóng nổ', bg: 'from-sky-100 to-cyan-200' },
    { id: 'target', emoji: '🎯', title: 'Bắn trúng đích', desc: 'Chạm trúng mục tiêu chạy', bg: 'from-emerald-100 to-lime-200' },
    { id: 'cannon', emoji: '💥', title: 'Bắn pháo', desc: 'Ngắm góc, bắn trúng bóng', bg: 'from-orange-100 to-rose-200' },
    { id: 'mathshoot', emoji: '➕', title: 'Bắn đáp án', desc: 'Bắn số đúng, ôn toán', bg: 'from-teal-100 to-emerald-200' },
    { id: 'lettershoot', emoji: '🔤', title: 'Bắn chữ', desc: 'Bắn đúng chữ cái', bg: 'from-amber-100 to-yellow-200' },
    { id: 'battle', emoji: '✈️', title: 'Không chiến', desc: 'Địch bắn lại — né & bắn hạ', bg: 'from-rose-100 to-red-200' },
    { id: 'arena', emoji: '🤖', title: 'Đấu trường Robot', desc: 'Một mình chọi cả bầy robot', bg: 'from-slate-200 to-cyan-200' },
    { id: 'dogfight', emoji: '🛩️', title: 'Không chiến hỗn chiến', desc: 'Bay né & bắn hạ cả bầy', bg: 'from-sky-200 to-indigo-200' },
    { id: 'survivor', emoji: '🧟', title: 'Sinh tồn chọi bầy', desc: 'Sống sót, lên cấp mạnh dần', bg: 'from-violet-200 to-fuchsia-200' },
    { id: 'stack', emoji: '🗼', title: 'Xếp tháp', desc: 'Canh nhịp thả khối cho khít', bg: 'from-sky-200 to-cyan-200' },
    { id: 'spotdiff', emoji: '🧩', title: 'Tìm điểm khác', desc: 'Tìm chỗ khác giữa 2 tranh', bg: 'from-violet-200 to-pink-200' },
    { id: 'flappy', emoji: '🐤', title: 'Chim bay', desc: 'Chạm để bay né ống', bg: 'from-sky-100 to-yellow-100' },
    { id: 'doodle', emoji: '🦘', title: 'Nhảy cao', desc: 'Nảy lên bậc, leo cao', bg: 'from-lime-100 to-green-200' },
    { id: 'catch', emoji: '🧺', title: 'Hứng đồ', desc: 'Hứng đồ tốt, né bom', bg: 'from-amber-100 to-orange-200' },
    { id: 'whack', emoji: '🔨', title: 'Đập chuột', desc: 'Chuột thò lên, đập nhanh', bg: 'from-orange-100 to-amber-200' },
    { id: 'fruit', emoji: '🍉', title: 'Chém hoa quả', desc: 'Vuốt chém, né bom', bg: 'from-red-100 to-pink-200' },
    { id: 'maze', emoji: '🧭', title: 'Mê cung', desc: 'Tìm đường ra, nhặt ngọc', bg: 'from-indigo-100 to-blue-200' },
    { id: 'match3', emoji: '🍬', title: 'Xếp kẹo', desc: 'Đổi 3 kẹo giống nhau', bg: 'from-fuchsia-100 to-pink-200' },
  ];

  const favSet = new Set(favorites);
  // Game được thả tim xếp lên đầu (giữ nguyên thứ tự trong từng nhóm).
  const orderedCards = [...cards].sort(
    (a, b) => (favSet.has(b.id) ? 1 : 0) - (favSet.has(a.id) ? 1 : 0)
  );

  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-sky-50 to-emerald-100 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mb-4 flex w-full max-w-md shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
        >
          <ChevronLeft size={18} /> Trở về
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-lg font-black text-slate-700 md:text-2xl">🎮 Khu vui chơi</h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-yellow-400/25 px-2.5 py-2 text-sm font-black text-yellow-700 shadow">
            <Gem size={16} className="fill-yellow-300" />
            {robuxBalance}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-2 text-sm font-black text-emerald-700 shadow">
            <Clock size={16} />
            {unlimitedTime ? '∞' : formatGameClock(timeLeftSec)}
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-md shrink-0 grid-cols-4 gap-1.5 pb-6">
        {orderedCards.map((c) => {
          const isFav = favSet.has(c.id);
          return (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => { playSound('pop'); setScreen(c.id); }}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-b ${c.bg} p-1 shadow-[0_4px_0_rgba(0,0,0,0.1)] transition active:translate-y-1`}
              >
                <span style={{ fontSize: '1.7rem', lineHeight: 1, ...emojiFont }}>{c.emoji}</span>
                <span className="text-center text-[9.5px] font-black leading-tight text-slate-700">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleFav(c.id)}
                aria-label={isFav ? `Bỏ yêu thích ${c.title}` : `Yêu thích ${c.title}`}
                aria-pressed={isFav}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/75 shadow-sm backdrop-blur transition active:scale-90"
              >
                <Heart size={11} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
