import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';

// --- GAME: ĐẬP CHUỘT CHŨI (Whack-a-mole) ---
// Lưới 3x3 hang. Chuột 🐹 ngoi lên -> đập trúng +1 điểm.
// 💣 bom -> đập trúng mất 1 mạng. ⭐ chuột vàng +5. ❤️ chuột tim +1 mạng (tối đa 5).
// Combo: đập liên tiếp không trượt / không dính bom -> nhân điểm thưởng tăng dần.
// LƯU Ý: dùng ref làm nguồn dữ liệu (holesRef) + setState giá trị thuần, để không dính
// lỗi StrictMode double-invoke của hàm updater.

const BEST_KEY = 'game_whack_best';
const HOLE_COUNT = 9;
const TICK_MS = 120;
const MAX_LIVES = 5;

const emptyHoles = () => Array.from({ length: HOLE_COUNT }, () => null);
const comboMultiplier = (combo) => Math.min(5, 1 + Math.floor(combo / 3));

export default function WhackApp({ onBack }) {
  const [holes, setHoles] = useState(emptyHoles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);

  const holesRef = useRef(emptyHoles());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const bestRef = useRef(best);
  const startBestRef = useRef(best);
  const overRef = useRef(false);
  const frame = useRef(0);
  const nextSpawnTick = useRef(3);

  const syncHoles = () => setHoles(holesRef.current.slice());

  const bumpBest = () => {
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(scoreRef.current);
      try { localStorage.setItem(BEST_KEY, String(scoreRef.current)); } catch { /* ignore */ }
    }
  };

  const endGame = () => {
    overRef.current = true;
    setOver(true);
    if (scoreRef.current > startBestRef.current) setNewRecord(true);
  };

  const restart = () => {
    holesRef.current = emptyHoles();
    scoreRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;
    frame.current = 0;
    nextSpawnTick.current = 3;
    overRef.current = false;
    startBestRef.current = bestRef.current;
    setHoles(emptyHoles());
    setScore(0);
    setLives(3);
    setCombo(0);
    setOver(false);
    setNewRecord(false);
  };

  // Vòng lặp: ngoi lên / ẩn xuống / sinh chuột & bom mới. Toàn bộ tính trên holesRef.
  useEffect(() => {
    const id = setInterval(() => {
      if (overRef.current) return;
      frame.current += 1;
      const f = frame.current;
      let changed = false;
      let missed = false;

      for (let i = 0; i < HOLE_COUNT; i += 1) {
        const h = holesRef.current[i];
        if (h && f >= h.expireAt) {
          if (h.type !== 'bomb') missed = true;
          holesRef.current[i] = null;
          changed = true;
        }
      }
      if (missed && comboRef.current !== 0) { comboRef.current = 0; setCombo(0); }

      if (f >= nextSpawnTick.current) {
        const empty = [];
        holesRef.current.forEach((h, i) => { if (!h) empty.push(i); });
        if (empty.length) {
          const idx = empty[Math.floor(Math.random() * empty.length)];
          const roll = Math.random();
          let type = 'mole';
          if (roll < 0.12) type = 'bomb';
          else if (roll < 0.19) type = 'gold';
          else if (roll < 0.24) type = 'heart';
          const upTicks = Math.max(5, 10 - Math.floor(scoreRef.current / 12));
          holesRef.current[idx] = { type, expireAt: f + upTicks };
          changed = true;
        }
        const gap = Math.max(3, 8 - Math.floor(scoreRef.current / 15));
        nextSpawnTick.current = f + gap + Math.floor(Math.random() * 3);
      }

      if (changed) syncHoles();
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const whack = useCallback((idx) => {
    if (overRef.current) return;
    const h = holesRef.current[idx];
    if (!h) return;
    holesRef.current[idx] = null;

    if (h.type === 'bomb') {
      comboRef.current = 0;
      setCombo(0);
      playSound('wrong');
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) { syncHoles(); endGame(); return; }
    } else {
      comboRef.current += 1;
      setCombo(comboRef.current);
      const mult = comboMultiplier(comboRef.current);
      const base = h.type === 'gold' ? 5 : 1;
      scoreRef.current += base * mult;
      setScore(scoreRef.current);
      bumpBest();
      if (h.type === 'heart') {
        livesRef.current = Math.min(MAX_LIVES, livesRef.current + 1);
        setLives(livesRef.current);
      }
      playSound(h.type === 'gold' || h.type === 'heart' ? 'correct' : 'pop');
    }
    syncHoles();
  }, []);

  const mult = comboMultiplier(combo);

  const holeEmoji = (h) => {
    if (!h) return '🐹';
    if (h.type === 'bomb') return '💣';
    if (h.type === 'gold') return '⭐';
    if (h.type === 'heart') return '❤️';
    return '🐹';
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-emerald-700 to-emerald-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/20 bg-black/20 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-2 text-sm font-black text-white transition hover:bg-white/30">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🔨 Đập chuột</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Chạm vào 🐹 để đập, tránh 💣 nhé!
          </GameHelp>
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-2 text-sm font-black text-white transition hover:bg-white/30">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-2 px-2">
        <div className="rounded-2xl bg-white/20 px-5 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-white/70">Điểm</div>
          <div className="text-xl font-black text-white">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/20 px-4 py-1.5">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Heart key={i} size={18} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-white/30'} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-4 py-1.5">
          <Trophy size={16} className="text-amber-400" />
          <div className="text-xl font-black text-amber-300">{best}</div>
        </div>
        {combo >= 2 && (
          <div className="flex items-center gap-1 rounded-2xl bg-amber-400/90 px-4 py-1.5 text-sm font-black text-amber-950 shadow">
            🔥 Combo {combo} · x{mult}
          </div>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-[420px] flex-1 grid-cols-3 grid-rows-3 place-items-center gap-3 px-4 py-2">
        {holes.map((h, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={() => whack(i)}
            disabled={over}
            className="relative flex aspect-square w-full max-w-[110px] items-center justify-center rounded-full bg-gradient-to-b from-amber-900 to-amber-950 shadow-[inset_0_6px_10px_rgba(0,0,0,0.6)] border-4 border-amber-950/60"
            aria-label="hang chuột"
          >
            <span className="select-none text-5xl leading-none drop-shadow" style={{ transform: h ? 'translateY(0)' : 'translateY(60%)', opacity: h ? 1 : 0, transition: 'transform 80ms ease-out, opacity 80ms' }}>
              {holeEmoji(h)}
            </span>
          </button>
        ))}
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🐹'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết mạng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé đập được <span className="text-emerald-600">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(4,120,87)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
