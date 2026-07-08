import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, Timer, Sparkles, Magnet } from 'lucide-react';
import { playSound } from './gameAudio';
import Fireworks from './Fireworks';

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

export default function CatchApp({ onBack }) {
  const [items, setItems] = useState(() => seedItems());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch { return 0; }
  });
  const [newRecord, setNewRecord] = useState(false);
  const [basketX, setBasketX] = useState(50);
  const [buffs, setBuffs] = useState({ slow: 0, double: 0, magnet: 0 }); // số giây còn lại để hiển thị

  const prevOver = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const basketRef = useRef(50);
  const moveDir = useRef(0);
  const areaRef = useRef(null);
  const dragging = useRef(false);
  const frame = useRef(0);
  const buffsRef = useRef({ slow: 0, double: 0, magnet: 0 });

  const speedBase = 0.55 + Math.min(score, 40) * 0.018;
  const spawnEvery = Math.max(16, 38 - Math.floor(score / 4));

  const restart = () => {
    seq = 0;
    scoreRef.current = 0;
    livesRef.current = 3;
    basketRef.current = 50;
    moveDir.current = 0;
    frame.current = 0;
    buffsRef.current = { slow: 0, double: 0, magnet: 0 };
    prevOver.current = false;
    setItems(seedItems());
    setScore(0);
    setLives(3);
    setBasketX(50);
    setBuffs({ slow: 0, double: 0, magnet: 0 });
    setOver(false);
    setNewRecord(false);
  };

  // Điều khiển bằng bàn phím (mũi tên trái/phải).
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'ArrowLeft') moveDir.current = -1;
      else if (e.key === 'ArrowRight') moveDir.current = 1;
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
        let scoreDelta = 0;
        let lifeDelta = 0;
        let hitBomb = false;
        let gotPower = false;
        const buffUpdates = {};

        next.forEach((it) => {
          const caught = it.y >= CATCH_Y_MIN && it.y <= CATCH_Y_MAX && Math.abs(it.x - bx) <= CATCH_X_RADIUS;
          if (caught) {
            if (it.kind === 'good') {
              scoreDelta += doubleActive ? 2 : 1;
            } else if (it.kind === 'bad') {
              lifeDelta -= 1;
              hitBomb = true;
            } else if (it.kind === 'p-heart') {
              lifeDelta += 1;
              gotPower = true;
            } else if (it.kind === 'p-slow') {
              buffUpdates.slow = now + 5000;
              gotPower = true;
            } else if (it.kind === 'p-double') {
              buffUpdates.double = now + 6000;
              gotPower = true;
            } else if (it.kind === 'p-magnet') {
              buffUpdates.magnet = now + 5000;
              gotPower = true;
            }
            return; // đã bắt được, bỏ khỏi danh sách
          }
          if (it.y > 100) return; // rơi khỏi màn hình, bỏ qua (không phạt)
          remaining.push(it);
        });

        pendingRef.current = { scoreDelta, lifeDelta, buffUpdates, hitBomb, gotPower };
        return remaining;
      });

      // Áp dụng hiệu ứng phụ MỘT LẦN (ngoài updater) — tránh StrictMode nhân đôi điểm/mạng.
      const pend = pendingRef.current;
      pendingRef.current = null;
      if (pend) {
        if (pend.scoreDelta) { scoreRef.current += pend.scoreDelta; setScore(scoreRef.current); playSound('pop'); }
        if (pend.hitBomb) playSound('wrong');
        if (pend.gotPower) playSound('correct');
        if (Object.keys(pend.buffUpdates).length) buffsRef.current = { ...buffsRef.current, ...pend.buffUpdates };
        if (pend.lifeDelta !== 0) {
          livesRef.current = Math.min(LIVES_MAX, Math.max(0, livesRef.current + pend.lifeDelta));
          setLives(livesRef.current);
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

  const slowLeft = buffs.slow;
  const doubleLeft = buffs.double;
  const magnetLeft = buffs.magnet;
  const anyBuff = slowLeft > 0 || doubleLeft > 0 || magnetLeft > 0;

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-orange-400 to-amber-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/30 bg-black/10 px-3 py-2">
        <button type="button" onClick={() => onBack?.()} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white drop-shadow md:text-2xl">🧺 Hứng đồ</h1>
        <button type="button" onClick={restart} className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-2 text-sm font-black text-white transition hover:bg-white/40">
          <RotateCcw size={16} /> Mới
        </button>
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
      </div>

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
        ref={areaRef}
        className="relative mx-auto w-full max-w-[440px] flex-1 overflow-hidden touch-none select-none"
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

        {/* Giỏ */}
        <div
          className="pointer-events-none absolute select-none text-5xl drop-shadow"
          style={{ left: `${basketX}%`, top: `${BASKET_Y}%`, transform: 'translate(-50%,-50%)' }}
        >
          🧺
        </div>
      </div>

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
        <p className="text-center text-xs font-bold text-orange-950/80">Kéo giỏ hoặc dùng phím mũi tên 👆</p>
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
