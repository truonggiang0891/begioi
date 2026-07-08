import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, Heart } from 'lucide-react';
import GameApp from './GameApp';
import MemoryApp from './MemoryApp';
import BlockPuzzleApp from './BlockPuzzleApp';
import TetrisApp from './TetrisApp';
import SnakeApp from './SnakeApp';
import BreakoutApp from './BreakoutApp';
import ShooterApp from './ShooterApp';
import BubbleShooterApp from './BubbleShooterApp';
import BalloonPopApp from './BalloonPopApp';
import TargetShootApp from './TargetShootApp';
import CannonApp from './CannonApp';
import AnswerShooterApp from './AnswerShooterApp';
import SpaceBattleApp from './SpaceBattleApp';
import FlappyApp from './FlappyApp';
import DoodleJumpApp from './DoodleJumpApp';
import CatchApp from './CatchApp';
import WhackApp from './WhackApp';
import FruitSliceApp from './FruitSliceApp';
import MazeApp from './MazeApp';
import Match3App from './Match3App';
import { playSound, emojiFont } from './gameAudio';

// --- KHU VUI CHƠI ---
// Hub chứa toàn bộ mini-game cho bé, mở từ nút "Game" trong app.
// Mỗi game là 1 component full-screen với prop onBack (quay lại danh sách).

const formatGameClock = (totalSec) => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FAV_KEY = 'game_favorites';
const loadFavs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export default function GamesApp({ onBack, timeLeftSec = 0, unlimitedTime = false }) {
  const [screen, setScreen] = useState('home');
  const [favorites, setFavorites] = useState(loadFavs);
  const back = () => setScreen('home');

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { /* ignore */ }
  }, [favorites]);

  const toggleFav = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const wrap = (node) => <div className="fixed inset-0 z-[60] bg-slate-900">{node}</div>;

  if (screen === 'puzzle') return wrap(<GameApp onBack={back} />);
  if (screen === 'memory') return wrap(<MemoryApp onBack={back} />);
  if (screen === 'block') return wrap(<BlockPuzzleApp onBack={back} />);
  if (screen === 'tetris') return wrap(<TetrisApp onBack={back} />);
  if (screen === 'snake') return wrap(<SnakeApp onBack={back} />);
  if (screen === 'breakout') return wrap(<BreakoutApp onBack={back} />);
  if (screen === 'shooter') return wrap(<ShooterApp onBack={back} />);
  if (screen === 'bubble') return wrap(<BubbleShooterApp onBack={back} />);
  if (screen === 'balloon') return wrap(<BalloonPopApp onBack={back} />);
  if (screen === 'target') return wrap(<TargetShootApp onBack={back} />);
  if (screen === 'cannon') return wrap(<CannonApp onBack={back} />);
  if (screen === 'mathshoot') return wrap(<AnswerShooterApp mode="math" onBack={back} />);
  if (screen === 'lettershoot') return wrap(<AnswerShooterApp mode="letter" onBack={back} />);
  if (screen === 'battle') return wrap(<SpaceBattleApp onBack={back} />);
  if (screen === 'flappy') return wrap(<FlappyApp onBack={back} />);
  if (screen === 'doodle') return wrap(<DoodleJumpApp onBack={back} />);
  if (screen === 'catch') return wrap(<CatchApp onBack={back} />);
  if (screen === 'whack') return wrap(<WhackApp onBack={back} />);
  if (screen === 'fruit') return wrap(<FruitSliceApp onBack={back} />);
  if (screen === 'maze') return wrap(<MazeApp onBack={back} />);
  if (screen === 'match3') return wrap(<Match3App onBack={back} />);

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
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-sky-50 to-emerald-100 px-4 py-5">
      <div className="mb-4 flex w-full max-w-md shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
        >
          <ChevronLeft size={18} /> Trở về
        </button>
        <h1 className="text-2xl font-black text-slate-700 md:text-3xl">🎮 Khu vui chơi</h1>
        <div className="flex min-w-[86px] justify-end">
          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700 shadow">
            <Clock size={16} />
            {unlimitedTime ? '∞' : formatGameClock(timeLeftSec)}
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-md shrink-0 grid-cols-3 gap-2 pb-6">
        {orderedCards.map((c) => {
          const isFav = favSet.has(c.id);
          return (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => { playSound('pop'); setScreen(c.id); }}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b ${c.bg} p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.1)] transition active:translate-y-1`}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1, ...emojiFont }}>{c.emoji}</span>
                <span className="text-center text-[11px] font-black leading-tight text-slate-700">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleFav(c.id)}
                aria-label={isFav ? `Bỏ yêu thích ${c.title}` : `Yêu thích ${c.title}`}
                aria-pressed={isFav}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/75 shadow-sm backdrop-blur transition active:scale-90"
              >
                <Heart size={13} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
