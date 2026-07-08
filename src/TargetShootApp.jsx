import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';

// --- GAME: BẮN TRÚNG ĐÍCH (Target / Duck Hunt) ---
// Mục tiêu chạy ngang màn hình, chạm để bắn trúng. Bỏ lỡ 3 con -> thua.

const BEST_KEY = 'game_target_best';
const TARGETS = ['🦆', '🐤', '🦋', '🐟', '⭐', '🍎', '🎈', '🐞'];
const MIN_TARGETS = 3;

let seq = 0;

// onScreen=true: xuất hiện sẵn giữa màn; false: bò vào từ mép.
const mkTarget = (speed, onScreen) => {
  seq += 1;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const x = onScreen ? 14 + Math.random() * 72 : (dir === 1 ? -8 : 108);
  return {
    id: seq,
    x,
    y: 10 + Math.random() * 70, // %
    dir,
    spd: speed + Math.random() * 0.3,
    emoji: TARGETS[Math.floor(Math.random() * TARGETS.length)],
    flip: dir === -1,
  };
};

export default function TargetShootApp({ onBack }) {
  const [items, setItems] = useState(() => [mkTarget(0.8, true), mkTarget(0.8, true), mkTarget(0.8, true)]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const prevOver = useRef(false);
  const scoreRef = useRef(0);
  const frame = useRef(0);

  const speed = 0.7 + Math.min(score, 50) * 0.02;
  const spawnGap = Math.max(8, 16 - Math.floor(score / 6));

  const restart = () => {
    seq = 0;
    scoreRef.current = 0;
    prevOver.current = false;
    frame.current = 0;
    setItems([mkTarget(0.8, true), mkTarget(0.8, true), mkTarget(0.8, true)]);
    setScore(0);
    setLives(3);
    setOver(false);
    setNewRecord(false);
  };

  const hit = useCallback((id) => {
    setItems((list) => {
      if (!list.some((t) => t.id === id)) return list;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      playSound('correct');
      return list.filter((t) => t.id !== id);
    });
  }, []);

  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => {
      frame.current += 1;
      setItems((list) => {
        let next = list.map((t) => ({ ...t, x: t.x + t.dir * t.spd }));
        // ra khỏi màn -> bỏ lỡ
        const missed = next.filter((t) => t.x < -14 || t.x > 114);
        if (missed.length) {
          setLives((lv) => {
            const nl = lv - missed.length;
            if (nl <= 0) { setOver(true); return 0; }
            return nl;
          });
          playSound('wrong');
          next = next.filter((t) => t.x >= -14 && t.x <= 114);
        }
        // luôn giữ đủ mục tiêu trên màn: bù ngay nếu thiếu, thỉnh thoảng thêm để đông hơn
        while (next.length < MIN_TARGETS) next.push(mkTarget(speed, next.length === 0));
        if (frame.current % spawnGap === 0 && next.length < 6) next.push(mkTarget(speed, false));
        return next;
      });
    }, 45);
    return () => clearInterval(id);
  }, [over, speed, spawnGap]);

  useEffect(() => {
    if (over && !prevOver.current) {
      if (scoreRef.current > best) {
        setBest(scoreRef.current);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(scoreRef.current)); } catch { /* ignore */ }
      }
    }
    prevOver.current = over;
  }, [over, best]);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-emerald-300 to-lime-200">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🎯 Bắn trúng đích</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm để bắn trúng 👆
          </GameHelp>
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 py-2">
        <div className="rounded-2xl bg-white/40 px-5 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-emerald-900/70">Điểm</div>
          <div className="text-xl font-black text-emerald-900">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-4 py-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={18} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-white/50'} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/40 px-4 py-1.5">
          <Trophy size={16} className="text-amber-500" />
          <div className="text-xl font-black text-amber-700">{best}</div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onPointerDown={() => hit(t.id)}
            className="absolute flex select-none items-center justify-center"
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: 52, height: 52, transform: 'translate(-50%,-50%)' }}
            aria-label="mục tiêu"
          >
            <span style={{ fontSize: 40, lineHeight: 1, transform: t.flip ? 'scaleX(-1)' : 'none', display: 'inline-block' }}>
              {t.emoji}
            </span>
          </button>
        ))}
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/40 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🎯'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Lỡ mất rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé bắn trúng <span className="text-emerald-600">{score}</span>
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(5,150,105)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
