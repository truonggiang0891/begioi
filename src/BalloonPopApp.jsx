import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { useScoreRewards } from './gameRewards';

// --- GAME: BẮN BÓNG BAY (Balloon Pop) ---
// Bóng bay bay lên, chạm để nổ. Để bóng thoát lên đỉnh -> mất 1 mạng.

const BEST_KEY = 'game_balloon_best';

let seq = 0;

export default function BalloonPopApp({ onBack, onReward }) {
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const prevOver = useRef(false);
  const scoreRef = useRef(0);
  const areaRef = useRef(null);
  const frame = useRef(0);

  const speed = 0.55 + Math.min(score, 40) * 0.02;
  const spawnEvery = Math.max(14, 34 - Math.floor(score / 5));

  const restart = () => {
    seq = 0;
    scoreRef.current = 0;
    prevOver.current = false;
    frame.current = 0;
    setBalloons([]);
    setScore(0);
    setLives(3);
    setOver(false);
    setNewRecord(false);
  };

  const pop = useCallback((id) => {
    setBalloons((bs) => {
      if (!bs.some((b) => b.id === id)) return bs;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      playSound('pop');
      return bs.filter((b) => b.id !== id);
    });
  }, []);

  // Vòng lặp: bóng bay lên + sinh bóng.
  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => {
      frame.current += 1;
      setBalloons((bs) => {
        let next = bs.map((b) => ({ ...b, y: b.y - b.spd }));
        // sinh bóng mới
        if (frame.current % spawnEvery === 0) {
          seq += 1;
          next.push({
            id: seq,
            x: 8 + Math.random() * 80, // %
            y: 100, // % (dưới cùng)
            spd: speed + Math.random() * 0.3,
            hue: Math.floor(Math.random() * 360),
          });
        }
        // bóng thoát đỉnh -> trừ mạng
        const escaped = next.filter((b) => b.y < -8);
        if (escaped.length) {
          setLives((lv) => {
            const nl = lv - escaped.length;
            if (nl <= 0) { setOver(true); return 0; }
            return nl;
          });
          playSound('wrong');
          next = next.filter((b) => b.y >= -8);
        }
        return next;
      });
    }, 45);
    return () => clearInterval(id);
  }, [over, speed, spawnEvery]);

  // Kỷ lục.
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
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-sky-400 to-sky-200">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🎈 Bắn bóng bay</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm vào bóng để nổ 👆
          </GameHelp>
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 py-2">
        <div className="rounded-2xl bg-white/40 px-5 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-sky-800/70">Điểm</div>
          <div className="text-xl font-black text-sky-900">{score}</div>
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

      {/* Vùng chơi */}
      <div ref={areaRef} className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none">
        {balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            onPointerDown={() => pop(b.id)}
            className="absolute flex select-none items-center justify-center"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: 54,
              height: 66,
              transform: 'translate(-50%,-50%)',
            }}
            aria-label="bóng bay"
          >
            <span
              className="block"
              style={{
                width: 44,
                height: 54,
                borderRadius: '50% 50% 50% 50% / 46% 46% 54% 54%',
                background: `radial-gradient(circle at 32% 28%, hsl(${b.hue} 90% 78%), hsl(${b.hue} 80% 52%))`,
                boxShadow: 'inset -4px -6px 8px rgba(0,0,0,.18)',
              }}
            />
          </button>
        ))}
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/40 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🎈'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết mạng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé nổ được <span className="text-sky-600">{score}</span> bóng
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(2,132,199)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
