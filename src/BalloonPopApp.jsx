import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { useScoreRewards } from './gameRewards';

// --- GAME: BẮN BÓNG BAY (Balloon Pop) ---
// Bóng bay bay lên, chạm để nổ. Để bóng thường thoát lên đỉnh -> mất 1 mạng.
// Nâng cấp: bóng đặc biệt (vàng +5, bom), combo, particle nổ, số điểm bay lên, nhạc nền.

const BEST_KEY = 'game_balloon_best';
const P_GOLD = 0.1;
const P_BOMB = 0.1;
const BURST_DOTS = [0, 60, 120, 180, 240, 300];

let seq = 0;

export default function BalloonPopApp({ onBack, onReward, robuxBalance = 0 }) {
  const [balloons, setBalloons] = useState([]);
  const [bursts, setBursts] = useState([]);   // {id,x,y,color}
  const [floaters, setFloaters] = useState([]); // {id,x,y,text,color}
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const prevOver = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const areaRef = useRef(null);
  const frame = useRef(0);
  const musicRef = useRef(false);
  const fxSeq = useRef(0);

  const speed = 0.55 + Math.min(score, 40) * 0.02;
  const spawnEvery = Math.max(14, 34 - Math.floor(score / 5));

  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  const restart = () => {
    seq = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    prevOver.current = false;
    frame.current = 0;
    setBalloons([]);
    setBursts([]);
    setFloaters([]);
    setScore(0);
    setLives(3);
    setCombo(0);
    setOver(false);
    setNewRecord(false);
  };

  const addBurst = (x, y, color) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setBursts((b) => [...b, { id, x, y, color }]);
    setTimeout(() => setBursts((b) => b.filter((e) => e.id !== id)), 620);
  };
  const addFloater = (x, y, text, color) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setFloaters((f) => [...f, { id, x, y, text, color }]);
    setTimeout(() => setFloaters((f) => f.filter((e) => e.id !== id)), 850);
  };

  const pop = useCallback((id) => {
    ensureMusic();
    setBalloons((bs) => {
      const b = bs.find((x) => x.id === id);
      if (!b) return bs;

      if (b.type === 'bomb') {
        // chạm bom -> mất mạng + rung, combo reset
        comboRef.current = 0; setCombo(0);
        setShakeKey((k) => k + 1);
        addBurst(b.x, b.y, '#f97316');
        playSound('explode');
        setLives((lv) => { const nl = lv - 1; if (nl <= 0) setOver(true); return Math.max(0, nl); });
        return bs.filter((x) => x.id !== id);
      }

      comboRef.current += 1; setCombo(comboRef.current);
      const baseGain = b.type === 'gold' ? 5 : 1;
      const bonus = comboRef.current >= 3 ? Math.floor(comboRef.current / 3) : 0;
      const gain = baseGain + bonus;
      scoreRef.current += gain; setScore(scoreRef.current);
      addBurst(b.x, b.y, b.type === 'gold' ? '#fbbf24' : `hsl(${b.hue} 80% 55%)`);
      if (comboRef.current >= 3) {
        addFloater(b.x, b.y, `Combo x${comboRef.current}`, '#f0abfc');
        playSound('combo', comboRef.current);
      } else {
        addFloater(b.x, b.y, `+${gain}`, b.type === 'gold' ? '#f59e0b' : '#fff');
        playSound(b.type === 'gold' ? 'coin' : 'pop');
      }
      return bs.filter((x) => x.id !== id);
    });
  }, []);

  // Vòng lặp: bóng bay lên + sinh bóng.
  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => {
      frame.current += 1;
      setBalloons((bs) => {
        let next = bs.map((b) => ({ ...b, y: b.y - b.spd }));
        if (frame.current % spawnEvery === 0) {
          seq += 1;
          const r = Math.random();
          const type = r < P_GOLD ? 'gold' : r < P_GOLD + P_BOMB ? 'bomb' : 'normal';
          next.push({
            id: seq,
            x: 8 + Math.random() * 80,
            y: 100,
            spd: speed + Math.random() * 0.3,
            hue: Math.floor(Math.random() * 360),
            type,
          });
        }
        // bóng thoát đỉnh: bóng thường/vàng thoát -> mất mạng; bom thoát -> an toàn
        const escaped = next.filter((b) => b.y < -8);
        const costly = escaped.filter((b) => b.type !== 'bomb');
        if (costly.length) {
          comboRef.current = 0; setCombo(0);
          setLives((lv) => {
            const nl = lv - costly.length;
            if (nl <= 0) { setOver(true); return 0; }
            return nl;
          });
          playSound('wrong');
        }
        if (escaped.length) next = next.filter((b) => b.y >= -8);
        return next;
      });
    }, 45);
    return () => clearInterval(id);
  }, [over, speed, spawnEvery]);

  useEffect(() => () => killMusic(), []);

  // Kỷ lục.
  useEffect(() => {
    if (over && !prevOver.current) {
      killMusic();
      if (scoreRef.current > best) {
        setBest(scoreRef.current);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(scoreRef.current)); } catch { /* ignore */ }
      }
    }
    prevOver.current = over;
  }, [over, best]);

  return (
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-sky-400 to-sky-200">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🎈 Bắn bóng bay</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Chạm vào bóng để nổ 👆. Nổ liên tiếp để lên <b>combo</b>!</p>
            <ul className="space-y-0.5">
              <li><span style={emojiFont}>⭐</span> <b>Bóng vàng</b> — được +5 điểm</li>
              <li><span style={emojiFont}>💣</span> <b>Bom</b> — đừng chạm! Chạm là mất mạng (cứ để nó bay đi)</li>
            </ul>
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        <div className="rounded-2xl bg-white/40 px-3 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-sky-800/70">Điểm</div>
          <div className="text-xl font-black text-sky-900">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-2.5 py-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={16} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-white/50'} />
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-3 py-1.5">
          <Trophy size={15} className="text-amber-500" />
          <div className="text-xl font-black text-amber-700">{best}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-3 py-1.5" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-500" />
          <div className="text-xl font-black text-amber-700">{robuxBalance}</div>
        </div>
      </div>

      {combo >= 3 && (
        <div className="pointer-events-none -mt-1 text-center text-sm font-black text-fuchsia-600 drop-shadow">🔥 Combo x{combo}!</div>
      )}

      {/* Vùng chơi */}
      <div
        key={shakeKey}
        ref={areaRef}
        className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none"
        style={shakeKey ? { animation: 'balloon-shake 0.4s ease' } : undefined}
      >
        {balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            onPointerDown={() => pop(b.id)}
            className="absolute flex select-none items-center justify-center"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: 54, height: 66, transform: 'translate(-50%,-50%)' }}
            aria-label={b.type === 'bomb' ? 'bom' : 'bóng bay'}
          >
            {b.type === 'bomb' ? (
              <span style={{ fontSize: 40, lineHeight: 1, ...emojiFont }}>💣</span>
            ) : (
              <span
                className="relative block"
                style={{
                  width: 44, height: 54,
                  borderRadius: '50% 50% 50% 50% / 46% 46% 54% 54%',
                  background: b.type === 'gold'
                    ? 'radial-gradient(circle at 32% 28%, #fde68a, #f59e0b)'
                    : `radial-gradient(circle at 32% 28%, hsl(${b.hue} 90% 78%), hsl(${b.hue} 80% 52%))`,
                  boxShadow: 'inset -4px -6px 8px rgba(0,0,0,.18)',
                }}
              >
                {b.type === 'gold' && <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 22 }}>⭐</span>}
              </span>
            )}
          </button>
        ))}

        {/* particle nổ */}
        {bursts.map((bt) => (
          <div key={bt.id} className="pointer-events-none absolute" style={{ left: `${bt.x}%`, top: `${bt.y}%` }}>
            {BURST_DOTS.map((deg) => (
              <span
                key={deg}
                className="absolute block h-2 w-2 rounded-full"
                style={{
                  background: bt.color,
                  '--dx': `${Math.cos((deg * Math.PI) / 180) * 34}px`,
                  '--dy': `${Math.sin((deg * Math.PI) / 180) * 34}px`,
                  animation: 'balloon-dot 0.6s ease-out forwards',
                }}
              />
            ))}
          </div>
        ))}

        {/* số điểm bay lên */}
        {floaters.map((f) => (
          <div
            key={f.id}
            className="pointer-events-none absolute text-base font-black"
            style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, transform: 'translate(-50%,-50%)', textShadow: '0 1px 2px rgba(0,0,0,.4)', animation: 'balloon-float 0.85s ease-out forwards' }}
          >
            {f.text}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes balloon-dot { from { transform: translate(-50%,-50%); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity: 0; } }
        @keyframes balloon-float { from { opacity: 1; transform: translate(-50%,-50%); } to { opacity: 0; transform: translate(-50%,-140%); } }
        @keyframes balloon-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(4px); } }
      `}</style>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/40 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🎈'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết mạng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-sky-600">{score}</span> điểm
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
