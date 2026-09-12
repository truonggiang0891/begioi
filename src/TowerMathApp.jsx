import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Heart, Clock, Gem, Trophy, RotateCcw } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import { SoundToggle } from './gameUI';
import GameHelp from './GameHelp';

// --- GAME: THÁP QUỶ TOÁN ---
// Bé leo tháp: mỗi tầng có 1 con quỷ, trả lời phép toán ĐÚNG để hạ quỷ & lên tầng.
// Sai hoặc hết giờ -> mất 1 tim. Hết 3 tim -> rơi khỏi tháp. Tầng càng cao càng khó.

const BEST_KEY = 'tower_math_best';
const START_HEARTS = 3;

const loadBest = () => {
  try { return Math.max(0, parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0); }
  catch { return 0; }
};
const saveBest = (v) => { try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* ignore */ } };

const rnd = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Sinh phép toán theo độ khó tăng dần theo tầng.
function genQuestion(floor) {
  let a, b, op, answer;
  if (floor <= 3) {
    op = '+'; a = rnd(1, 9); b = rnd(0, 9); answer = a + b;
  } else if (floor <= 6) {
    if (Math.random() < 0.5) { op = '+'; a = rnd(2, 12); b = rnd(2, 10); answer = a + b; }
    else { op = '−'; a = rnd(6, 20); b = rnd(1, a); answer = a - b; }
  } else if (floor <= 10) {
    const k = Math.random();
    if (k < 0.4) { op = '+'; a = rnd(10, 60); b = rnd(5, 40); answer = a + b; }
    else if (k < 0.75) { op = '−'; a = rnd(20, 99); b = rnd(5, a - 1); answer = a - b; }
    else { op = '×'; a = rnd(2, 5); b = rnd(2, 9); answer = a * b; }
  } else {
    const k = Math.random();
    if (k < 0.45) { op = '×'; a = rnd(2, 9); b = rnd(2, 9); answer = a * b; }
    else if (k < 0.75) { op = '÷'; b = rnd(2, 9); answer = rnd(2, 9); a = b * answer; }
    else { op = '+'; a = rnd(30, 120); b = rnd(20, 90); answer = a + b; }
  }
  const opts = new Set([answer]);
  const spread = Math.max(2, Math.round(answer * 0.25) + 2);
  let guard = 0;
  while (opts.size < 4 && guard++ < 40) {
    let d = answer + (Math.random() < 0.5 ? 1 : -1) * rnd(1, spread);
    if (d < 0) d = answer + rnd(1, 5);
    opts.add(d);
  }
  const options = [...opts].sort(() => Math.random() - 0.5);
  return { text: `${a} ${op} ${b}`, answer, options };
}

// Thời gian mỗi câu (giây), giảm dần theo tầng nhưng không dưới 6s.
const timeFor = (floor) => Math.max(6, 15 - Math.floor(floor / 2));

const BTN_COLORS = [
  'bg-sky-400 shadow-[0_5px_0_rgb(2,132,199)]',
  'bg-violet-400 shadow-[0_5px_0_rgb(124,58,237)]',
  'bg-amber-400 shadow-[0_5px_0_rgb(217,119,6)]',
  'bg-emerald-400 shadow-[0_5px_0_rgb(5,150,105)]',
];

export default function TowerMathApp({ onBack, onReward, robuxBalance = 0 }) {
  const [status, setStatus] = useState('ready');   // ready | playing | over
  const [floor, setFloor] = useState(1);
  const [hearts, setHearts] = useState(START_HEARTS);
  const [q, setQ] = useState(null);
  const [qId, setQId] = useState(0);
  const [phase, setPhase] = useState('ask');       // ask | correct | wrong
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [shake, setShake] = useState(false);
  const totalTimeRef = useRef(1);
  const rewardedRef = useRef(new Set());

  useEffect(() => () => killMusic(), []);

  const nextQuestion = useCallback((fl) => {
    setQ(genQuestion(fl));
    const t = timeFor(fl);
    totalTimeRef.current = t;
    setTimeLeft(t);
    setPicked(null);
    setPhase('ask');
    setQId((id) => id + 1);
  }, []);

  const startGame = useCallback(() => {
    rewardedRef.current = new Set();
    setFloor(1);
    setHearts(START_HEARTS);
    setStatus('playing');
    nextQuestion(1);
    startMusic('arcade');
    playSound('powerup');
  }, [nextQuestion]);

  const resolveCorrect = useCallback(() => {
    setPhase('correct');
    playSound('correct');
    setFloor((cur) => {
      const nf = cur + 1;
      if (nf % 5 === 0 && !rewardedRef.current.has(nf)) {
        rewardedRef.current.add(nf);
        playSound('gift');
        onReward?.(1 + Math.floor(nf / 10), `Lên tầng ${nf}`);
      }
      setBest((b) => { const nb = Math.max(b, nf); if (nb !== b) saveBest(nb); return nb; });
      return nf;
    });
    const nextFl = floor + 1;
    setTimeout(() => { playSound('levelup'); nextQuestion(nextFl); }, 850);
  }, [floor, nextQuestion, onReward]);

  const resolveWrong = useCallback(() => {
    setPhase('wrong');
    playSound('wrong');
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setHearts((prev) => {
      const h = prev - 1;
      if (h <= 0) {
        setTimeout(() => { playSound('lose'); killMusic(); setStatus('over'); }, 950);
      } else {
        setTimeout(() => nextQuestion(floor), 950);
      }
      return h;
    });
  }, [floor, nextQuestion]);

  // Đồng hồ đếm ngược mỗi câu.
  useEffect(() => {
    if (status !== 'playing' || phase !== 'ask') return undefined;
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(iv); resolveWrong(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [status, phase, qId, resolveWrong]);

  const answer = (opt) => {
    if (phase !== 'ask') return;
    setPicked(opt);
    if (q && opt === q.answer) resolveCorrect();
    else resolveWrong();
  };

  const timePct = Math.max(0, Math.min(100, (timeLeft / totalTimeRef.current) * 100));

  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/25 px-3 py-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <ChevronLeft size={18} /> Thoát
        </button>
        <h1 className="truncate text-lg font-black text-white md:text-2xl">🏰 Tháp Quỷ Toán</h1>
        <div className="flex items-center gap-1.5">
          <GameHelp>
            Trả lời phép toán <b>đúng</b> để hạ quỷ 👹 và leo lên tầng cao hơn. Sai hoặc hết giờ sẽ mất 1 ❤️.
            Hết tim là rơi khỏi tháp! Tầng càng cao, toán càng khó — cố lên thật cao nhé!
          </GameHelp>
          <SoundToggle />
        </div>
      </div>

      {/* HUD */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-white">
        <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-black">
          🏯 Tầng <span className="text-yellow-300">{floor}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: START_HEARTS }).map((_, i) => (
            <Heart key={i} size={20} className={i < hearts ? 'fill-rose-500 text-rose-500' : 'fill-white/10 text-white/25'} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm font-black">
          <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-200">
            <Trophy size={14} /> {best}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-1 text-yellow-200">
            <Gem size={14} /> {robuxBalance}
          </span>
        </div>
      </div>

      {/* Sân chơi */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-2">
        {status === 'ready' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div style={{ fontSize: '4.5rem', lineHeight: 1, ...emojiFont }}>🏰</div>
            <h2 className="text-2xl font-black text-white md:text-3xl">Tháp Quỷ Toán</h2>
            <p className="max-w-xs text-sm font-bold text-white/70">
              Leo lên thật cao! Trả lời đúng để hạ quỷ và lên tầng. Sai thì mất tim nhé.
            </p>
            {best > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-400/20 px-4 py-1.5 text-sm font-black text-amber-200">
                <Trophy size={16} /> Cao nhất: Tầng {best}
              </div>
            )}
            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-gradient-to-b from-rose-400 to-rose-500 px-8 py-3 text-xl font-black text-white shadow-[0_6px_0_rgb(190,18,60)] transition active:translate-y-1 active:shadow-none"
            >
              ⚔️ Bắt đầu leo!
            </button>
          </div>
        )}

        {status === 'playing' && q && (
          <>
            {/* Cảnh: quỷ trên tầng */}
            <div className={`flex flex-col items-center ${shake ? 'animate-[twr-shake_0.4s]' : ''}`}>
              <div
                style={{ fontSize: '3.75rem', lineHeight: 1, ...emojiFont }}
                className={phase === 'correct' ? 'animate-[twr-pop_0.85s_forwards]' : 'animate-[twr-hover_1.6s_ease-in-out_infinite]'}
              >
                {phase === 'correct' ? '💥' : '👹'}
              </div>
              <div className="mt-0.5 text-3xl" style={emojiFont} aria-hidden>🧗</div>
            </div>

            {/* Thanh thời gian */}
            <div className="flex w-full max-w-sm items-center gap-2">
              <Clock size={16} className="shrink-0 text-white/60" />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${timePct < 34 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-black text-white/80">{timeLeft}</span>
            </div>

            {/* Câu hỏi */}
            <div className="rounded-3xl border-2 border-white/15 bg-white/10 px-6 py-4 text-center shadow-inner">
              <div className="text-4xl font-black text-white drop-shadow md:text-6xl">{q.text} = ?</div>
            </div>

            {/* Đáp án */}
            <div className="grid w-full max-w-sm grid-cols-2 gap-2.5 md:gap-3">
              {q.options.map((opt, idx) => {
                const isPicked = picked === opt;
                const isAnswer = opt === q.answer;
                let cls = BTN_COLORS[idx % BTN_COLORS.length];
                if (phase !== 'ask') {
                  if (isAnswer) cls = 'bg-green-500 shadow-[0_5px_0_rgb(21,128,61)]';
                  else if (isPicked) cls = 'bg-rose-500 shadow-[0_5px_0_rgb(190,18,60)]';
                  else cls = 'bg-white/15 shadow-none opacity-70';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={phase !== 'ask'}
                    onClick={() => answer(opt)}
                    className={`rounded-2xl py-4 text-2xl font-black text-white transition active:translate-y-1 active:shadow-none md:text-3xl ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {status === 'over' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div style={{ fontSize: '4rem', lineHeight: 1, ...emojiFont }}>🏰</div>
            <h2 className="text-2xl font-black text-white md:text-3xl">Bé đã leo tới Tầng {floor}!</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-400/20 px-4 py-1.5 text-sm font-black text-amber-200">
              <Trophy size={16} /> Cao nhất: Tầng {best}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startGame}
                className="flex items-center gap-2 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-6 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none"
              >
                <RotateCcw size={20} /> Leo lại
              </button>
              <button
                type="button"
                onClick={() => onBack?.()}
                className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white transition hover:bg-white/25"
              >
                Thoát
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes twr-hover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes twr-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes twr-pop { 0%{transform:scale(1);opacity:1} 60%{transform:scale(1.6);opacity:1} 100%{transform:scale(0.2);opacity:0} }
      `}</style>
    </div>
  );
}
