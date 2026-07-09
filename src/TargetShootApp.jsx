import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { useScoreRewards } from './gameRewards';

// --- GAME: BẮN TRÚNG ĐÍCH (Target / Duck Hunt) ---
// Mục tiêu chạy ngang (có nhấp nhô), chạm để bắn trúng. Bỏ lỡ 3 con -> thua.
// Nâng cấp: mục tiêu vàng (+5) & bom (đừng bắn), combo, particle, số điểm bay, nhạc nền.

const BEST_KEY = 'game_target_best';
const TARGETS = ['🦆', '🐤', '🦋', '🐟', '🍎', '🐞', '🐸', '🐰'];
const MIN_TARGETS = 3;
const P_GOLD = 0.12;
const P_BOMB = 0.12;
const BURST_DOTS = [0, 60, 120, 180, 240, 300];

let seq = 0;

const mkTarget = (speed, onScreen) => {
  seq += 1;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const x = onScreen ? 14 + Math.random() * 72 : (dir === 1 ? -8 : 108);
  const r = Math.random();
  const type = r < P_GOLD ? 'gold' : r < P_GOLD + P_BOMB ? 'bomb' : 'normal';
  const baseY = 10 + Math.random() * 66;
  return {
    id: seq,
    x,
    y: baseY,
    baseY,
    phase: Math.random() * Math.PI * 2,
    dir,
    spd: speed + Math.random() * 0.3,
    emoji: type === 'gold' ? '⭐' : type === 'bomb' ? '💣' : TARGETS[Math.floor(Math.random() * TARGETS.length)],
    type,
    flip: dir === -1,
  };
};

export default function TargetShootApp({ onBack, onReward, robuxBalance = 0 }) {
  const [items, setItems] = useState(() => [mkTarget(0.8, true), mkTarget(0.8, true), mkTarget(0.8, true)]);
  const [bursts, setBursts] = useState([]);
  const [floaters, setFloaters] = useState([]);
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
  const frame = useRef(0);
  const musicRef = useRef(false);
  const fxSeq = useRef(0);

  const speed = 0.7 + Math.min(score, 50) * 0.02;
  const spawnGap = Math.max(8, 16 - Math.floor(score / 6));

  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  const restart = () => {
    seq = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    prevOver.current = false;
    frame.current = 0;
    setItems([mkTarget(0.8, true), mkTarget(0.8, true), mkTarget(0.8, true)]);
    setBursts([]); setFloaters([]);
    setScore(0);
    setLives(3);
    setCombo(0);
    setOver(false);
    setNewRecord(false);
  };

  const addBurst = (x, y, color) => {
    fxSeq.current += 1; const id = fxSeq.current;
    setBursts((b) => [...b, { id, x, y, color }]);
    setTimeout(() => setBursts((b) => b.filter((e) => e.id !== id)), 620);
  };
  const addFloater = (x, y, text, color) => {
    fxSeq.current += 1; const id = fxSeq.current;
    setFloaters((f) => [...f, { id, x, y, text, color }]);
    setTimeout(() => setFloaters((f) => f.filter((e) => e.id !== id)), 850);
  };

  const hit = useCallback((id) => {
    ensureMusic();
    setItems((list) => {
      const t = list.find((x) => x.id === id);
      if (!t) return list;

      if (t.type === 'bomb') {
        comboRef.current = 0; setCombo(0);
        setShakeKey((k) => k + 1);
        addBurst(t.x, t.y, '#f97316');
        playSound('explode');
        setLives((lv) => { const nl = lv - 1; if (nl <= 0) setOver(true); return Math.max(0, nl); });
        return list.filter((x) => x.id !== id);
      }

      comboRef.current += 1; setCombo(comboRef.current);
      const baseGain = t.type === 'gold' ? 5 : 1;
      const bonus = comboRef.current >= 3 ? Math.floor(comboRef.current / 3) : 0;
      const gain = baseGain + bonus;
      scoreRef.current += gain; setScore(scoreRef.current);
      addBurst(t.x, t.y, t.type === 'gold' ? '#fbbf24' : '#34d399');
      if (comboRef.current >= 3) {
        addFloater(t.x, t.y, `Combo x${comboRef.current}`, '#f0abfc');
        playSound('combo', comboRef.current);
      } else {
        addFloater(t.x, t.y, `+${gain}`, t.type === 'gold' ? '#f59e0b' : '#fff');
        playSound(t.type === 'gold' ? 'coin' : 'correct');
      }
      return list.filter((x) => x.id !== id);
    });
  }, []);

  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => {
      frame.current += 1;
      const fr = frame.current;
      setItems((list) => {
        let next = list.map((t) => {
          const nx = t.x + t.dir * t.spd;
          const ny = Math.max(4, Math.min(84, t.baseY + Math.sin(fr * 0.08 + t.phase) * 7));
          return { ...t, x: nx, y: ny };
        });
        // ra khỏi màn -> bỏ lỡ (bom bay ra ngoài = an toàn)
        const gone = next.filter((t) => t.x < -14 || t.x > 114);
        const missed = gone.filter((t) => t.type !== 'bomb');
        if (missed.length) {
          comboRef.current = 0; setCombo(0);
          setLives((lv) => {
            const nl = lv - missed.length;
            if (nl <= 0) { setOver(true); return 0; }
            return nl;
          });
          playSound('wrong');
        }
        if (gone.length) next = next.filter((t) => t.x >= -14 && t.x <= 114);
        while (next.length < MIN_TARGETS) next.push(mkTarget(speed, next.length === 0));
        if (fr % spawnGap === 0 && next.length < 6) next.push(mkTarget(speed, false));
        return next;
      });
    }, 45);
    return () => clearInterval(id);
  }, [over, speed, spawnGap]);

  useEffect(() => () => killMusic(), []);

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
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-emerald-300 to-lime-200">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🎯 Bắn trúng đích</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            <p className="mb-1.5">Chạm để bắn trúng 👆. Trúng liên tiếp để lên <b>combo</b>!</p>
            <ul className="space-y-0.5">
              <li><span style={emojiFont}>⭐</span> <b>Ngôi sao vàng</b> — được +5 điểm</li>
              <li><span style={emojiFont}>💣</span> <b>Bom</b> — đừng bắn! Bắn trúng là mất mạng (để nó chạy đi)</li>
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
          <div className="text-[10px] font-black uppercase tracking-wide text-emerald-900/70">Điểm</div>
          <div className="text-xl font-black text-emerald-900">{score}</div>
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

      <div
        key={shakeKey}
        className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none"
        style={shakeKey ? { animation: 'target-shake 0.4s ease' } : undefined}
      >
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onPointerDown={() => hit(t.id)}
            className="absolute flex select-none items-center justify-center"
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: 52, height: 52, transform: 'translate(-50%,-50%)' }}
            aria-label={t.type === 'bomb' ? 'bom' : 'mục tiêu'}
          >
            <span style={{ fontSize: 40, lineHeight: 1, transform: t.flip ? 'scaleX(-1)' : 'none', display: 'inline-block' }}>
              {t.emoji}
            </span>
          </button>
        ))}

        {bursts.map((bt) => (
          <div key={bt.id} className="pointer-events-none absolute" style={{ left: `${bt.x}%`, top: `${bt.y}%` }}>
            {BURST_DOTS.map((deg) => (
              <span
                key={deg}
                className="absolute block h-2 w-2 rounded-full"
                style={{
                  background: bt.color,
                  '--dx': `${Math.cos((deg * Math.PI) / 180) * 32}px`,
                  '--dy': `${Math.sin((deg * Math.PI) / 180) * 32}px`,
                  animation: 'target-dot 0.6s ease-out forwards',
                }}
              />
            ))}
          </div>
        ))}

        {floaters.map((f) => (
          <div
            key={f.id}
            className="pointer-events-none absolute text-base font-black"
            style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, transform: 'translate(-50%,-50%)', textShadow: '0 1px 2px rgba(0,0,0,.4)', animation: 'target-float 0.85s ease-out forwards' }}
          >
            {f.text}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes target-dot { from { transform: translate(-50%,-50%); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity: 0; } }
        @keyframes target-float { from { opacity: 1; transform: translate(-50%,-50%); } to { opacity: 0; transform: translate(-50%,-140%); } }
        @keyframes target-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(4px); } }
      `}</style>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/40 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🎯'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Lỡ mất rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé được <span className="text-emerald-600">{score}</span> điểm
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
