import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Gem, Timer, Lightbulb } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { useScoreRewards } from './gameRewards';

// --- GAME: TÌM ĐIỂM KHÁC NHAU ---
// 2 bức tranh giống nhau, bức dưới có thêm vài "điểm lạ". Bé chạm tìm hết các
// điểm khác nhau ở bức nào cũng được. Tìm đủ -> qua tranh mới (nhiều điểm hơn).

const PICS = ['lion', 'elephant', 'butterfly', 'rainbow', 'train', 'fish', 'unicorn', 'flower', 'strawberry', 'turtle', 'rocket', 'cake'];
const STICKERS = ['⭐', '🌸', '🍎', '🐞', '❤️', '🌟', '🍄', '🦋', '💎', '🌼', '🍒', '🔵'];
const HIT_R = 0.1;        // bán kính chạm trúng (tỉ lệ theo cạnh tranh)
const HINTS_PER_ROUND = 2;
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pickN = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

const makeDiffs = (k) => {
  const out = [];
  const emojis = pickN(STICKERS, k);
  let guard = 0;
  while (out.length < k && guard < 500) {
    guard += 1;
    const x = 0.14 + Math.random() * 0.72;
    const y = 0.14 + Math.random() * 0.72;
    if (out.every((d) => Math.hypot(d.x - x, d.y - y) > 0.2)) out.push({ x, y, emoji: emojis[out.length], found: false });
  }
  return out;
};

export default function SpotDiffApp({ onBack, onReward, robuxBalance = 0 }) {
  const [round, setRound] = useState(1);
  const [picId, setPicId] = useState(PICS[0]);
  const [diffs, setDiffs] = useState([]);
  const [lives, setLives] = useState(3);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_ROUND);
  const [hinted, setHinted] = useState(null); // index đang gợi ý
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [timeSec, setTimeSec] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false); // vừa tìm đủ 1 tranh
  const [shakeKey, setShakeKey] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem('game_spotdiff_best'), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const scoreRef = useRef(0);
  const musicRef = useRef(false);
  const hintTimer = useRef(null);
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('calm'); } };

  const loadRound = useCallback((r) => {
    const k = Math.min(6, 2 + r); // tăng dần: 3,4,5,6...
    setPicId(PICS[Math.floor(Math.random() * PICS.length)]);
    setDiffs(makeDiffs(k));
    setHintsLeft(HINTS_PER_ROUND);
    setHinted(null);
    setWon(false);
  }, []);

  const newGame = () => {
    scoreRef.current = 0;
    setRound(1); setLives(3); setScore(0); setTimeSec(0);
    setOver(false); setNewRecord(false);
    loadRound(1);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRound(1); return () => { killMusic(); if (hintTimer.current) clearTimeout(hintTimer.current); }; }, []);

  // đồng hồ
  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => setTimeSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [over]);

  const remaining = diffs.filter((d) => !d.found).length;

  const nextRound = () => {
    const r = round + 1; setRound(r);
    // thưởng Robux mỗi khi qua 1 tranh (ít, có chặn ở GamesApp)
    onReward?.(2, `Xong tranh ${round}`);
    loadRound(r);
  };

  const tapAt = (rx, ry) => {
    if (over || won) return;
    ensureMusic();
    let hitIdx = -1;
    diffs.forEach((d, i) => { if (!d.found && Math.hypot(d.x - rx, d.y - ry) < HIT_R) hitIdx = i; });
    if (hitIdx >= 0) {
      const next = diffs.map((d, i) => (i === hitIdx ? { ...d, found: true } : d));
      setDiffs(next);
      scoreRef.current += 10; setScore(scoreRef.current);
      if (scoreRef.current > best) { setBest(scoreRef.current); try { localStorage.setItem('game_spotdiff_best', String(scoreRef.current)); } catch { /* ignore */ } }
      playSound('correct');
      if (next.every((d) => d.found)) {
        setWon(true); playSound('win');
        setTimeout(() => nextRound(), 1400);
      }
    } else {
      // chạm sai -> mất mạng
      setShakeKey((k) => k + 1);
      playSound('wrong');
      setLives((lv) => {
        const nl = lv - 1;
        if (nl <= 0) { setOver(true); killMusic(); if (scoreRef.current > best) setNewRecord(true); }
        return Math.max(0, nl);
      });
    }
  };

  const onPanelDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tapAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  const useHint = () => {
    if (hintsLeft <= 0 || won || over) return;
    const idx = diffs.findIndex((d) => !d.found);
    if (idx < 0) return;
    setHinted(idx); setHintsLeft((h) => h - 1); playSound('powerup');
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHinted(null), 1600);
  };

  const restart = () => newGame();
  const src = `/puzzle/${picId}.svg`;
  const panelSize = 'min(41vh, 300px)';

  // 1 bức tranh (which='B' thì hiện các điểm lạ). Hàm trả JSX (KHÔNG phải component
  // định nghĩa trong render) để tránh remount mỗi lần vẽ.
  const renderPanel = (which) => (
    <div
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-white/60"
      style={{ width: panelSize, height: panelSize, touchAction: 'manipulation' }}
      onPointerDown={onPanelDown}
    >
      <img src={src} alt="tranh" className="pointer-events-none h-full w-full select-none" draggable={false} />
      {which === 'B' && diffs.map((d, i) => (
        !d.found && (
          <span key={i} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, fontSize: 'calc(min(41vh,300px)*0.1)', lineHeight: 1, ...emojiFont }}>
            {d.emoji}
          </span>
        )
      ))}
      {/* vòng đánh dấu đã tìm + gợi ý (trên cả 2 tranh) */}
      {diffs.map((d, i) => (
        (d.found || hinted === i) && (
          <span key={`m${i}`} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
            style={{
              left: `${d.x * 100}%`, top: `${d.y * 100}%`,
              width: 'calc(min(41vh,300px)*0.16)', height: 'calc(min(41vh,300px)*0.16)',
              borderColor: d.found ? '#22c55e' : '#f59e0b',
              animation: d.found ? 'sd-pop 0.4s ease-out' : 'sd-hint 0.7s ease-in-out infinite',
            }} />
        )
      ))}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-violet-300 to-fuchsia-200">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/40 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-white/60">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-slate-700 drop-shadow md:text-2xl">🧩 Tìm điểm khác</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p>Hai bức tranh gần giống nhau — bức <b>dưới</b> có thêm vài <b>điểm lạ</b>. Chạm vào chỗ khác nhau (ở bức nào cũng được) để khoanh lại. Tìm đủ hết là qua tranh mới! Chạm sai bị mất một ❤️.</p>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/40 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-white/60">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-3 py-2">
        <div className="rounded-2xl bg-white/50 px-3 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Tranh</div>
          <div className="text-lg font-black text-slate-700">{round}</div>
        </div>
        <div className="rounded-2xl bg-emerald-400/25 px-3 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700/70">Còn tìm</div>
          <div className="text-lg font-black text-emerald-700">{remaining}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/50 px-2.5 py-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={15} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300'} />
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/50 px-3 py-1.5">
          <Timer size={14} className="text-sky-600" />
          <div className="text-base font-black text-sky-800">{fmtTime(timeSec)}</div>
        </div>
        <button type="button" onClick={useHint} disabled={hintsLeft <= 0}
          className={`flex items-center gap-1 rounded-2xl px-3 py-1.5 text-sm font-black transition ${hintsLeft <= 0 ? 'bg-white/30 text-slate-300' : 'bg-amber-300/60 text-amber-800 hover:bg-amber-300'}`}>
          <Lightbulb size={15} /> {hintsLeft}
        </button>
        <div className="flex items-center gap-1 rounded-2xl bg-white/50 px-3 py-1.5" title="Tổng Robux của bé">
          <Gem size={14} className="fill-yellow-300 text-yellow-600" />
          <div className="text-base font-black text-amber-800">{robuxBalance}</div>
        </div>
      </div>

      <div key={shakeKey} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-3 pb-3"
        style={shakeKey ? { animation: 'sd-shake 0.4s ease' } : undefined}>
        {renderPanel('A')}
        {renderPanel('B')}
      </div>

      <style>{`
        @keyframes sd-pop { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0; } 60% { transform: translate(-50%,-50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1); } }
        @keyframes sd-hint { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.3); } }
        @keyframes sd-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-7px); } 50% { transform: translateX(6px); } 75% { transform: translateX(-4px); } }
      `}</style>

      {won && !over && <Fireworks durationMs={1400} />}
      {won && !over && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-[54] text-center">
          <span className="rounded-full bg-emerald-500/90 px-6 py-2 text-xl font-black text-white shadow-2xl">🎉 Giỏi quá! Tìm đủ rồi!</span>
        </div>
      )}

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🧩'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết lượt rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé qua <span className="text-orange-500">{round - 1}</span> tranh · tìm được <span className="text-orange-500">{score / 10}</span> điểm khác
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best / 10}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(234,88,12)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
