import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Timer, Sparkles, Magnet, Gem } from 'lucide-react';
import { playSound, startMusic, killMusic } from './gameAudio';
import Fireworks from './Fireworks';
import GameHelp from './GameHelp';
import { SoundToggle } from './gameUI';
import { useScoreRewards } from './gameRewards';

// --- GAME: HỨNG ĐỒ (Catch) ---
// Giỏ 🧺 ở dưới hứng đồ tốt rơi xuống (+điểm), tránh bom 💣 (-1 mạng).
// Có vật phẩm đặc biệt cho buff tạm thời (thêm mạng / chậm lại / x2 điểm / nam châm).

const BEST_KEY = 'game_catch_best';
const LIVES_MAX = 5;
const GOOD_EMOJI = ['🍎', '🍊', '🍓', '🍇', '⭐', '🍌'];
const BASKET_Y = 90; // % vị trí hàng giỏ trong vùng chơi
const CATCH_X_RADIUS = 13; // % bán kính bắt theo trục x quanh tâm giỏ
const CATCH_Y_MIN = 80;
const CATCH_Y_MAX = 99;
const BURST_DOTS = [0, 60, 120, 180, 240, 300]; // hướng các tia particle khi hứng trúng
const SMOKE_PUFFS = [0, 1, 2, 3, 4]; // các cụm khói khi bom nổ

let seq = 0;

const randX = () => 8 + Math.random() * 84;

const pickKind = () => {
  const r = Math.random();
  if (r < 0.025) return 'p-heart';
  if (r < 0.05) return 'p-slow';
  if (r < 0.075) return 'p-double';
  if (r < 0.1) return 'p-magnet';
  if (r < 0.3) return 'bad';
  return 'good';
};

const emojiFor = (kind) => {
  if (kind === 'bad') return '💣';
  if (kind === 'p-heart') return '❤️';
  if (kind === 'p-slow') return '⏱️';
  if (kind === 'p-double') return '✨';
  if (kind === 'p-magnet') return '🧲';
  return GOOD_EMOJI[Math.floor(Math.random() * GOOD_EMOJI.length)];
};

// Vài vật phẩm sẵn trên màn hình ngay từ đầu để không bị trống.
const seedItems = () => {
  const arr = [];
  const ys = [-70, -45, -20, 4];
  ys.forEach((y) => {
    seq += 1;
    const kind = Math.random() < 0.22 ? 'bad' : 'good';
    arr.push({ id: seq, x: randX(), y, spd: 0.5 + Math.random() * 0.2, kind, emoji: emojiFor(kind) });
  });
  return arr;
};

export default function CatchApp({ onBack, onReward, robuxBalance = 0 }) {
  const [items, setItems] = useState(() => seedItems());
  const [score, setScore] = useState(0);
  useScoreRewards(score, onReward);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [basketX, setBasketX] = useState(50);
  const [buffs, setBuffs] = useState({ slow: 0, double: 0, magnet: 0 }); // số giây còn lại để hiển thị
  const [bursts, setBursts] = useState([]);   // particle khi hứng trúng {id,x,y,color}
  const [smokes, setSmokes] = useState([]);   // khói khi bom nổ {id,x,y}
  const [floaters, setFloaters] = useState([]); // số điểm/combo bay lên {id,x,y,text,color}
  const [shakeKey, setShakeKey] = useState(0); // rung nhẹ khi trúng bom
  const [flashKey, setFlashKey] = useState(0); // nháy màn đỏ khi mất mạng

  const prevOver = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const basketRef = useRef(50);
  const moveDir = useRef(0);
  const areaRef = useRef(null);
  const dragging = useRef(false);
  const frame = useRef(0);
  const buffsRef = useRef({ slow: 0, double: 0, magnet: 0 });
  const musicRef = useRef(false);
  const fxSeq = useRef(0);

  // Nhạc nền bật ở lần tương tác đầu tiên (kéo/nhấn nút).
  const ensureMusic = () => { if (!musicRef.current) { musicRef.current = true; startMusic('arcade'); } };

  // Hiệu ứng CSS tạm thời — tự dọn sau khi chạy xong.
  const addBurst = (x, y, color) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setBursts((b) => [...b, { id, x, y, color }]);
    setTimeout(() => setBursts((b) => b.filter((e) => e.id !== id)), 620);
  };
  const addSmoke = (x, y) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setSmokes((s) => [...s, { id, x, y }]);
    setTimeout(() => setSmokes((s) => s.filter((e) => e.id !== id)), 720);
  };
  const addFloater = (x, y, text, color) => {
    fxSeq.current += 1;
    const id = fxSeq.current;
    setFloaters((f) => [...f, { id, x, y, text, color }]);
    setTimeout(() => setFloaters((f) => f.filter((e) => e.id !== id)), 850);
  };

  const speedBase = 0.55 + Math.min(score, 40) * 0.018;
  const spawnEvery = Math.max(16, 38 - Math.floor(score / 4));

  const restart = () => {
    ensureMusic();
    seq = 0;
    scoreRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;
    basketRef.current = 50;
    moveDir.current = 0;
    frame.current = 0;
    buffsRef.current = { slow: 0, double: 0, magnet: 0 };
    prevOver.current = false;
    setItems(seedItems());
    setScore(0);
    setLives(3);
    setCombo(0);
    setBasketX(50);
    setBuffs({ slow: 0, double: 0, magnet: 0 });
    setBursts([]);
    setSmokes([]);
    setFloaters([]);
    setOver(false);
    setNewRecord(false);
  };

  // Điều khiển bằng bàn phím (mũi tên trái/phải).
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'ArrowLeft') { moveDir.current = -1; ensureMusic(); }
      else if (e.key === 'ArrowRight') { moveDir.current = 1; ensureMusic(); }
    };
    const onUp = (e) => {
      if ((e.key === 'ArrowLeft' && moveDir.current === -1) || (e.key === 'ArrowRight' && moveDir.current === 1)) {
        moveDir.current = 0;
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Kéo giỏ bằng con trỏ/ngón tay trên vùng chơi.
  const movePointer = useCallback((clientX) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    basketRef.current = Math.min(94, Math.max(6, pct));
    setBasketX(basketRef.current);
  }, []);

  const onAreaPointerDown = (e) => {
    ensureMusic();
    dragging.current = true;
    movePointer(e.clientX);
  };
  const onAreaPointerMove = (e) => {
    if (!dragging.current) return;
    movePointer(e.clientX);
  };

  useEffect(() => {
    const endDrag = () => { dragging.current = false; };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, []);

  // Kết quả va chạm mỗi nhịp, ghi trong updater (thuần) rồi áp dụng 1 lần bên ngoài.
  const pendingRef = useRef(null);

  // Vòng lặp chính: rơi + sinh vật phẩm + di chuyển giỏ + va chạm.
  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => {
      frame.current += 1;
      const now = Date.now();
      const slowActive = buffsRef.current.slow > now;
      const doubleActive = buffsRef.current.double > now;
      const magnetActive = buffsRef.current.magnet > now;
      const fallMul = slowActive ? 0.5 : 1;

      // Di chuyển giỏ theo nút giữ / bàn phím (bỏ qua nếu đang kéo bằng con trỏ).
      if (moveDir.current !== 0 && !dragging.current) {
        basketRef.current = Math.min(94, Math.max(6, basketRef.current + moveDir.current * 2.4));
        setBasketX(basketRef.current);
      }
      const bx = basketRef.current;

      setItems((prev) => {
        let next = prev.map((it) => {
          let x = it.x;
          if (magnetActive && it.kind === 'good') {
            x += (bx - x) * 0.09;
          }
          return { ...it, x, y: it.y + it.spd * fallMul };
        });

        // Sinh vật phẩm mới đều đặn.
        if (frame.current % spawnEvery === 0) {
          seq += 1;
          const kind = pickKind();
          next.push({
            id: seq,
            x: randX(),
            y: -8,
            spd: speedBase + Math.random() * 0.25,
            kind,
            emoji: emojiFor(kind),
          });
        }

        const remaining = [];
        let lifeDelta = 0;
        const buffUpdates = {};
        const goodCatches = []; // vị trí đồ tốt hứng trúng (particle + combo)
        const bombHits = [];    // vị trí bom nổ (khói)
        const powerCatches = []; // vị trí lấy được buff
        let droppedGood = false; // có đồ tốt rơi khỏi màn hình -> reset combo

        next.forEach((it) => {
          const caught = it.y >= CATCH_Y_MIN && it.y <= CATCH_Y_MAX && Math.abs(it.x - bx) <= CATCH_X_RADIUS;
          if (caught) {
            if (it.kind === 'good') {
              goodCatches.push({ x: it.x, y: it.y });
            } else if (it.kind === 'bad') {
              lifeDelta -= 1;
              bombHits.push({ x: it.x, y: it.y });
            } else if (it.kind === 'p-heart') {
              lifeDelta += 1;
              powerCatches.push({ x: it.x, y: it.y });
            } else if (it.kind === 'p-slow') {
              buffUpdates.slow = now + 5000;
              powerCatches.push({ x: it.x, y: it.y });
            } else if (it.kind === 'p-double') {
              buffUpdates.double = now + 6000;
              powerCatches.push({ x: it.x, y: it.y });
            } else if (it.kind === 'p-magnet') {
              buffUpdates.magnet = now + 5000;
              powerCatches.push({ x: it.x, y: it.y });
            }
            return; // đã bắt được, bỏ khỏi danh sách
          }
          if (it.y > 100) {
            if (it.kind === 'good') droppedGood = true; // để rơi đồ tốt -> mất combo
            return; // rơi khỏi màn hình, bỏ qua (không phạt mạng)
          }
          remaining.push(it);
        });

        pendingRef.current = { lifeDelta, buffUpdates, goodCatches, bombHits, powerCatches, droppedGood, doubleActive };
        return remaining;
      });

      // Áp dụng hiệu ứng phụ MỘT LẦN (ngoài updater) — tránh StrictMode nhân đôi điểm/mạng.
      const pend = pendingRef.current;
      pendingRef.current = null;
      if (pend) {
        // Rơi đồ tốt hoặc trúng bom -> ngắt chuỗi combo.
        if (pend.droppedGood || pend.bombHits.length) { comboRef.current = 0; setCombo(0); }

        // Hứng đồ tốt: cộng điểm + combo + particle + số bay lên.
        let scoreDelta = 0;
        pend.goodCatches.forEach((c) => {
          comboRef.current += 1;
          const base = pend.doubleActive ? 2 : 1;
          const bonus = comboRef.current >= 3 ? Math.floor(comboRef.current / 3) : 0;
          const gain = base + bonus;
          scoreDelta += gain;
          addBurst(c.x, c.y, '#f59e0b');
          if (comboRef.current >= 3) {
            addFloater(c.x, c.y, `Combo x${comboRef.current}`, '#f0abfc');
            playSound('combo', comboRef.current);
          } else {
            addFloater(c.x, c.y, `+${gain}`, '#fff');
            playSound('coin');
          }
        });
        if (pend.goodCatches.length) setCombo(comboRef.current);
        if (scoreDelta) { scoreRef.current += scoreDelta; setScore(scoreRef.current); }

        // Lấy buff.
        pend.powerCatches.forEach((c) => { addBurst(c.x, c.y, '#34d399'); });
        if (pend.powerCatches.length) playSound('powerup');

        // Trúng bom: khói + rung + nháy đỏ.
        if (pend.bombHits.length) {
          pend.bombHits.forEach((c) => addSmoke(c.x, c.y));
          setShakeKey((k) => k + 1);
          setFlashKey((k) => k + 1);
          playSound('explode');
        }

        if (Object.keys(pend.buffUpdates).length) buffsRef.current = { ...buffsRef.current, ...pend.buffUpdates };
        if (pend.lifeDelta !== 0) {
          const before = livesRef.current;
          livesRef.current = Math.min(LIVES_MAX, Math.max(0, livesRef.current + pend.lifeDelta));
          setLives(livesRef.current);
          if (livesRef.current < before) playSound('lose'); // mất mạng
          if (livesRef.current <= 0) setOver(true);
        }
      }

      // Cập nhật hiển thị đếm ngược buff (giây còn lại).
      const b = buffsRef.current;
      setBuffs({
        slow: b.slow > now ? Math.ceil((b.slow - now) / 1000) : 0,
        double: b.double > now ? Math.ceil((b.double - now) / 1000) : 0,
        magnet: b.magnet > now ? Math.ceil((b.magnet - now) / 1000) : 0,
      });
    }, 45);
    return () => clearInterval(id);
  }, [over, speedBase, spawnEvery]);

  // Dừng nhạc khi rời game.
  useEffect(() => () => killMusic(), []);

  // Kỷ lục.
  useEffect(() => {
    if (over && !prevOver.current) {
      killMusic(); // hết mạng -> tắt nhạc nền
      if (scoreRef.current > best) {
        setBest(scoreRef.current);
        setNewRecord(true);
        try { localStorage.setItem(BEST_KEY, String(scoreRef.current)); } catch { /* ignore */ }
      }
    }
    prevOver.current = over;
  }, [over, best]);

  const slowLeft = buffs.slow;
  const doubleLeft = buffs.double;
  const magnetLeft = buffs.magnet;
  const anyBuff = slowLeft > 0 || doubleLeft > 0 || magnetLeft > 0;

  return (
    <div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-orange-400 to-amber-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🧺 Hứng đồ</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Kéo giỏ hoặc dùng phím mũi tên 👆. Hứng liên tiếp không để rơi để lên <b>combo</b>!
          </GameHelp>
          <SoundToggle />
          <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
            <RotateCcw size={16} /> Mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        <div className="rounded-2xl bg-white/40 px-5 py-1 text-center">
          <div className="text-[10px] font-black uppercase tracking-wide text-orange-900/70">Điểm</div>
          <div className="text-xl font-black text-orange-950">{score}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-4 py-1.5">
          {Array.from({ length: LIVES_MAX }, (_, i) => (
            <Heart key={i} size={16} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-white/50'} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/40 px-4 py-1.5">
          <Trophy size={16} className="text-amber-600" />
          <div className="text-xl font-black text-amber-800">{best}</div>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-white/40 px-3 py-1.5" title="Tổng Robux của bé">
          <Gem size={15} className="fill-yellow-300 text-yellow-500" />
          <div className="text-xl font-black text-amber-700">{robuxBalance}</div>
        </div>
      </div>

      {combo >= 3 && (
        <div className="pointer-events-none -mt-1 text-center text-sm font-black text-fuchsia-600 drop-shadow">🔥 Combo x{combo}!</div>
      )}

      {anyBuff && (
        <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
          {slowLeft > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-sky-500/80 px-3 py-1 text-xs font-black text-white">
              <Timer size={14} /> {slowLeft}s
            </div>
          )}
          {doubleLeft > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-fuchsia-500/80 px-3 py-1 text-xs font-black text-white">
              <Sparkles size={14} /> x2 {doubleLeft}s
            </div>
          )}
          {magnetLeft > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-600/80 px-3 py-1 text-xs font-black text-white">
              <Magnet size={14} /> {magnetLeft}s
            </div>
          )}
        </div>
      )}

      {/* Vùng chơi */}
      <div
        key={shakeKey}
        ref={areaRef}
        className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none select-none"
        style={shakeKey ? { animation: 'catch-shake 0.4s ease' } : undefined}
        onPointerDown={onAreaPointerDown}
        onPointerMove={onAreaPointerMove}
      >
        {items.map((it) => (
          <div
            key={it.id}
            className="pointer-events-none absolute select-none text-3xl"
            style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%,-50%)' }}
          >
            {it.emoji}
          </div>
        ))}

        {/* particle khi hứng trúng */}
        {bursts.map((bt) => (
          <div key={bt.id} className="pointer-events-none absolute" style={{ left: `${bt.x}%`, top: `${bt.y}%` }}>
            {BURST_DOTS.map((deg) => (
              <span
                key={deg}
                className="absolute block h-2 w-2 rounded-full"
                style={{
                  background: bt.color,
                  '--dx': `${Math.cos((deg * Math.PI) / 180) * 30}px`,
                  '--dy': `${Math.sin((deg * Math.PI) / 180) * 30}px`,
                  animation: 'catch-dot 0.6s ease-out forwards',
                }}
              />
            ))}
          </div>
        ))}

        {/* khói khi bom nổ */}
        {smokes.map((sm) => (
          <div key={sm.id} className="pointer-events-none absolute" style={{ left: `${sm.x}%`, top: `${sm.y}%` }}>
            {SMOKE_PUFFS.map((i) => (
              <span
                key={i}
                className="absolute block rounded-full"
                style={{
                  width: 16, height: 16,
                  background: 'radial-gradient(circle at 40% 35%, rgba(120,120,120,.85), rgba(80,80,80,.35))',
                  '--sx': `${(i - 2) * 14}px`,
                  '--sy': `${-8 - i * 4}px`,
                  animation: `catch-smoke 0.7s ease-out forwards`,
                  animationDelay: `${i * 30}ms`,
                }}
              />
            ))}
          </div>
        ))}

        {/* số điểm / combo bay lên */}
        {floaters.map((f) => (
          <div
            key={f.id}
            className="pointer-events-none absolute text-base font-black"
            style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, transform: 'translate(-50%,-50%)', textShadow: '0 1px 2px rgba(0,0,0,.4)', animation: 'catch-float 0.85s ease-out forwards' }}
          >
            {f.text}
          </div>
        ))}

        {/* nháy màn đỏ khi mất mạng */}
        {flashKey > 0 && (
          <div key={flashKey} className="pointer-events-none absolute inset-0 bg-red-500/45" style={{ animation: 'catch-flash 0.4s ease-out forwards' }} />
        )}

        {/* Giỏ */}
        <div
          className="pointer-events-none absolute select-none text-5xl drop-shadow"
          style={{ left: `${basketX}%`, top: `${BASKET_Y}%`, transform: 'translate(-50%,-50%)' }}
        >
          🧺
        </div>
      </div>

      <style>{`
        @keyframes catch-dot { from { transform: translate(-50%,-50%); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity: 0; } }
        @keyframes catch-smoke { from { transform: translate(-50%,-50%) scale(0.5); opacity: 0.9; } to { transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) scale(1.6); opacity: 0; } }
        @keyframes catch-float { from { opacity: 1; transform: translate(-50%,-50%); } to { opacity: 0; transform: translate(-50%,-150%); } }
        @keyframes catch-flash { from { opacity: 1; } to { opacity: 0; } }
        @keyframes catch-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
      `}</style>

      {/* Điều khiển */}
      <div className="flex shrink-0 items-center justify-center gap-6 py-2">
        <button
          type="button"
          aria-label="Trái"
          onPointerDown={() => { moveDir.current = -1; }}
          onPointerUp={() => { moveDir.current = 0; }}
          onPointerLeave={() => { moveDir.current = 0; }}
          className="select-none rounded-full bg-white/50 px-8 py-3 text-2xl font-black text-orange-900 shadow active:bg-white/70"
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Phải"
          onPointerDown={() => { moveDir.current = 1; }}
          onPointerUp={() => { moveDir.current = 0; }}
          onPointerLeave={() => { moveDir.current = 0; }}
          className="select-none rounded-full bg-white/50 px-8 py-3 text-2xl font-black text-orange-900 shadow active:bg-white/70"
        >
          ▶
        </button>
      </div>

      {over && newRecord && <Fireworks />}
      {over && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl">
            <div className="text-4xl">{newRecord ? '🏆' : '🧺'}</div>
            <h2 className="text-2xl font-black text-slate-700">{newRecord ? 'Kỷ lục mới!' : 'Hết mạng rồi!'}</h2>
            <p className="text-sm font-bold text-slate-500">
              Bé hứng được <span className="text-orange-600">{score}</span> điểm
              {newRecord ? ' — giỏi nhất từ trước tới giờ! 🎉' : `. Cao nhất: ${best}`}
            </p>
            <button type="button" onClick={restart} className="mt-1 rounded-full bg-gradient-to-b from-orange-400 to-orange-500 px-7 py-3 text-lg font-black text-white shadow-[0_4px_0_rgb(194,65,12)] transition active:translate-y-0.5">
              Chơi lại 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
