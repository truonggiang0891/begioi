import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { useScoreRewards } from './gameRewards';

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

// Emoji hiển thị theo loại ô (hàm thuần, đặt ngoài component để dùng ở mọi nơi).
const holeEmoji = (h) => {
  if (!h) return '🐹';
  if (h.type === 'bomb') return '💣';
  if (h.type === 'gold') return '⭐';
  if (h.type === 'heart') return '❤️';
  return '🐹';
};
const SPARK_ANGLES = [0, 72, 144, 216, 288]; // hướng văng của sao ✨

export default function WhackApp({ onBack, onReward, robuxBalance = 0 }) {
  const [holes, setHoles] = useState(emptyHoles);
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [sparks, setSparks] = useState([]);   // {id,idx,emoji} — sao ✨ văng + emoji nảy khi đập trúng
  const [shakeKey, setShakeKey] = useState(0); // đổi -> rung màn khi trúng bom
  const [flashKey, setFlashKey] = useState(0); // đổi -> flash đỏ khi trúng bom
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
  const musicRef = useRef(false);   // nhạc nền đã bật chưa
  const fxSeq = useRef(0);          // id tăng dần cho hiệu ứng

  // Bật nhạc nền 'arcade' lần tương tác (đập) đầu tiên.
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  // Bắn ✨ văng ra tại hang idx + emoji vừa đập nảy/rung lên.
  const burstSpark = (idx, emoji) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setSparks((s) => [...s, { id, idx, emoji }]);
    setTimeout(() => setSparks((s) => s.filter((e) => e.id !== id)), 520);
  };

  // Flash đỏ + rung màn khi trúng bom.
  const bombFx = () => {
    setShakeKey((k) => k + 1);
    setFlashKey((k) => k + 1);
  };

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
    killMusic(); // tắt nhạc khi hết mạng
    if (scoreRef.current > startBestRef.current) setNewRecord(true);
  };

  // Tắt nhạc khi rời game.
  useEffect(() => () => killMusic(), []);

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
    setSparks([]);
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
    ensureMusic();
    const h = holesRef.current[idx];
    if (!h) return;
    holesRef.current[idx] = null;

    if (h.type === 'bomb') {
      comboRef.current = 0;
      setCombo(0);
      bombFx();                 // flash đỏ + rung màn
      playSound('explode');     // âm nổ bom
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
      burstSpark(idx, holeEmoji(h)); // ✨ văng ra + emoji nảy lên
      // Âm riêng: ⭐ vàng -> coin, ❤️ tim -> powerup, chuột thường -> pop/hit
      if (h.type === 'gold') playSound('coin');
      else if (h.type === 'heart') playSound('powerup');
      else playSound(comboRef.current % 2 ? 'pop' : 'hit');
    }
    syncHoles();
  }, []);

  const mult = comboMultiplier(combo);

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
          <SoundToggle />
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
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-4 py-1.5" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-500" />
          <div className="text-xl font-black text-amber-300">{robuxBalance}</div>
        </div>
        {combo >= 2 && (
          <div
            key={mult >= 3 ? `big-${combo}` : 'small'}
            className={`flex items-center gap-1 rounded-2xl px-4 py-1.5 font-black shadow ${
              mult >= 3
                ? 'bg-fuchsia-500 text-white text-base'
                : 'bg-amber-400/90 text-amber-950 text-sm'
            }`}
            style={mult >= 3 ? { animation: 'whack-combo 0.4s ease-out' } : undefined}
          >
            🔥 Combo {combo} · x{mult}
          </div>
        )}
      </div>

      <div
        key={shakeKey}
        className="mx-auto grid w-full max-w-[420px] flex-1 grid-cols-3 grid-rows-3 place-items-center gap-3 px-4 py-2"
        style={shakeKey ? { animation: 'whack-shake 0.4s ease' } : undefined}
      >
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
            {/* hiệu ứng đập trúng: emoji nảy/rung + sao ✨ văng ra */}
            {sparks.filter((s) => s.idx === i).map((s) => (
              <span key={s.id} className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="absolute select-none text-5xl leading-none" style={{ animation: 'whack-hit 0.4s ease-out forwards' }}>
                  {s.emoji}
                </span>
                {SPARK_ANGLES.map((deg) => (
                  <span
                    key={deg}
                    className="absolute select-none text-lg"
                    style={{
                      '--dx': `${Math.cos((deg * Math.PI) / 180) * 42}px`,
                      '--dy': `${Math.sin((deg * Math.PI) / 180) * 42}px`,
                      animation: 'whack-spark 0.5s ease-out forwards',
                    }}
                  >
                    ✨
                  </span>
                ))}
              </span>
            ))}
          </button>
        ))}
      </div>

      {/* flash đỏ toàn màn khi trúng bom */}
      {flashKey > 0 && (
        <div key={flashKey} className="pointer-events-none absolute inset-0 z-40 bg-red-600" style={{ animation: 'whack-flash 0.4s ease-out forwards' }} />
      )}

      <style>{`
        @keyframes whack-spark { from { transform: translate(0,0) scale(1); opacity: 1; } to { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; } }
        @keyframes whack-hit { 0% { transform: scale(1); opacity: 1; } 35% { transform: scale(1.4) rotate(-10deg); opacity: 1; } 70% { transform: scale(1.1) rotate(8deg); opacity: 0.9; } 100% { transform: scale(1.5) rotate(0deg); opacity: 0; } }
        @keyframes whack-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
        @keyframes whack-flash { from { opacity: 0.55; } to { opacity: 0; } }
        @keyframes whack-combo { 0% { transform: scale(0.6); } 55% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>

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
