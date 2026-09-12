import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
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

// Trang CHẠY THỬ độc lập cho 2 game mới.
// KHÔNG liên quan tới app chính (index.html / main.jsx).
// Mở tại: http://localhost:<port>/games.html

function GamesHome() {
  const [screen, setScreen] = useState('home'); // 'home' | 'puzzle' | 'memory'

  if (screen === 'puzzle') return <GameApp onBack={() => setScreen('home')} />;
  if (screen === 'memory') return <MemoryApp onBack={() => setScreen('home')} />;
  if (screen === 'block') return <BlockPuzzleApp onBack={() => setScreen('home')} />;
  if (screen === 'tetris') return <TetrisApp onBack={() => setScreen('home')} />;
  if (screen === 'snake') return <SnakeApp onBack={() => setScreen('home')} />;
  if (screen === 'breakout') return <BreakoutApp onBack={() => setScreen('home')} />;
  if (screen === 'shooter') return <ShooterApp onBack={() => setScreen('home')} />;
  if (screen === 'bubble') return <BubbleShooterApp onBack={() => setScreen('home')} />;
  if (screen === 'balloon') return <BalloonPopApp onBack={() => setScreen('home')} />;
  if (screen === 'target') return <TargetShootApp onBack={() => setScreen('home')} />;
  if (screen === 'cannon') return <CannonApp onBack={() => setScreen('home')} />;
  if (screen === 'mathshoot') return <AnswerShooterApp mode="math" onBack={() => setScreen('home')} />;
  if (screen === 'lettershoot') return <AnswerShooterApp mode="letter" onBack={() => setScreen('home')} />;
  if (screen === 'battle') return <SpaceBattleApp onBack={() => setScreen('home')} />;
  if (screen === 'flappy') return <FlappyApp onBack={() => setScreen('home')} />;
  if (screen === 'doodle') return <DoodleJumpApp onBack={() => setScreen('home')} />;
  if (screen === 'catch') return <CatchApp onBack={() => setScreen('home')} />;
  if (screen === 'whack') return <WhackApp onBack={() => setScreen('home')} />;
  if (screen === 'fruit') return <FruitSliceApp onBack={() => setScreen('home')} />;
  if (screen === 'maze') return <MazeApp onBack={() => setScreen('home')} />;
  if (screen === 'match3') return <Match3App onBack={() => setScreen('home')} />;

  const cards = [
    { id: 'puzzle', emoji: '🧩', title: 'Ghép hình', desc: 'Chạm 2 ô để đổi chỗ', bg: 'from-orange-100 to-amber-200', go: () => setScreen('puzzle') },
    { id: 'memory', emoji: '🃏', title: 'Lật thẻ tìm cặp', desc: 'Tìm 2 thẻ giống nhau', bg: 'from-violet-100 to-sky-200', go: () => setScreen('memory') },
    { id: 'block', emoji: '🧱', title: 'Xếp khối', desc: 'Kéo khối lấp đầy hàng', bg: 'from-sky-100 to-indigo-200', go: () => setScreen('block') },
    { id: 'tetris', emoji: '⬇️', title: 'Khối rơi', desc: 'Xoay & xếp khối rơi', bg: 'from-emerald-100 to-teal-200', go: () => setScreen('tetris') },
    { id: 'snake', emoji: '🐍', title: 'Rắn săn mồi', desc: 'Ăn mồi, đừng đụng tường', bg: 'from-lime-100 to-emerald-200', go: () => setScreen('snake') },
    { id: 'breakout', emoji: '🧱', title: 'Phá gạch', desc: 'Bật bóng phá gạch', bg: 'from-rose-100 to-orange-200', go: () => setScreen('breakout') },
    { id: 'shooter', emoji: '🚀', title: 'Bắn gạch', desc: 'Lái thuyền, tự bắn', bg: 'from-cyan-100 to-blue-200', go: () => setScreen('shooter') },
    { id: 'bubble', emoji: '🫧', title: 'Bắn bong bóng', desc: 'Ngắm bắn 3 bóng cùng màu', bg: 'from-indigo-100 to-purple-200', go: () => setScreen('bubble') },
    { id: 'balloon', emoji: '🎈', title: 'Bắn bóng bay', desc: 'Chạm cho bóng nổ', bg: 'from-sky-100 to-cyan-200', go: () => setScreen('balloon') },
    { id: 'target', emoji: '🎯', title: 'Bắn trúng đích', desc: 'Chạm trúng mục tiêu chạy', bg: 'from-emerald-100 to-lime-200', go: () => setScreen('target') },
    { id: 'cannon', emoji: '💥', title: 'Bắn pháo', desc: 'Ngắm góc, bắn trúng bóng', bg: 'from-orange-100 to-rose-200', go: () => setScreen('cannon') },
    { id: 'mathshoot', emoji: '➕', title: 'Bắn đáp án', desc: 'Bắn số đúng, ôn toán', bg: 'from-teal-100 to-emerald-200', go: () => setScreen('mathshoot') },
    { id: 'lettershoot', emoji: '🔤', title: 'Bắn chữ', desc: 'Bắn đúng chữ cái', bg: 'from-amber-100 to-yellow-200', go: () => setScreen('lettershoot') },
    { id: 'battle', emoji: '✈️', title: 'Không chiến', desc: 'Địch bắn lại — né & bắn hạ', bg: 'from-rose-100 to-red-200', go: () => setScreen('battle') },
    { id: 'flappy', emoji: '🐤', title: 'Chim bay', desc: 'Chạm để bay né ống', bg: 'from-sky-100 to-yellow-100', go: () => setScreen('flappy') },
    { id: 'doodle', emoji: '🦘', title: 'Nhảy cao', desc: 'Nảy lên bậc, leo cao', bg: 'from-lime-100 to-green-200', go: () => setScreen('doodle') },
    { id: 'catch', emoji: '🧺', title: 'Hứng đồ', desc: 'Hứng đồ tốt, né bom', bg: 'from-amber-100 to-orange-200', go: () => setScreen('catch') },
    { id: 'whack', emoji: '🔨', title: 'Đập chuột', desc: 'Chuột thò lên, đập nhanh', bg: 'from-orange-100 to-amber-200', go: () => setScreen('whack') },
    { id: 'fruit', emoji: '🍉', title: 'Chém hoa quả', desc: 'Vuốt chém, né bom', bg: 'from-red-100 to-pink-200', go: () => setScreen('fruit') },
    { id: 'maze', emoji: '🧭', title: 'Mê cung', desc: 'Tìm đường ra, nhặt ngọc', bg: 'from-indigo-100 to-blue-200', go: () => setScreen('maze') },
    { id: 'match3', emoji: '🍬', title: 'Xếp kẹo', desc: 'Đổi 3 kẹo giống nhau', bg: 'from-fuchsia-100 to-pink-200', go: () => setScreen('match3') },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-sky-50 to-emerald-100 px-5 py-6">
      <div className="mb-1 shrink-0 rounded-full bg-amber-400/90 px-4 py-1 text-xs font-black text-amber-950 shadow">
        TRANG CHẠY THỬ • chưa gắn vào app chính
      </div>
      <h1 className="mb-6 shrink-0 text-center text-3xl font-black text-slate-700 md:text-4xl">
        🎮 Khu vui chơi của bé
      </h1>
      <div className="grid w-full max-w-md shrink-0 grid-cols-2 gap-4 pb-6">
        {cards.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => {
              playSound('pop');
              c.go();
            }}
            className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-b ${c.bg} p-4 shadow-[0_6px_0_rgba(0,0,0,0.1)] transition active:translate-y-1`}
          >
            <span style={{ fontSize: '3.4rem', lineHeight: 1, ...emojiFont }}>{c.emoji}</span>
            <span className="text-lg font-black text-slate-700">{c.title}</span>
            <span className="text-xs font-bold text-slate-500">{c.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Giữ lại root qua các lần HMR để không gọi createRoot 2 lần trên cùng container.
const container = document.getElementById('root');
const root = window.__gamesRoot || createRoot(container);
window.__gamesRoot = root;
root.render(
  <StrictMode>
    <GamesHome />
  </StrictMode>,
);
