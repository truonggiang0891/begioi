import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Heart, Clock, Gem, Lock, Check, RotateCcw } from 'lucide-react';
import { playSound, startMusic, killMusic, emojiFont } from './gameAudio';
import { SoundToggle } from './gameUI';
import GameHelp from './GameHelp';
import {
  TOWER_ZONES, TOWER_TIERS, stageKey,
  loadProgress, saveProgress, isCleared, isUnlocked,
} from './towerZones';

// --- GAME: THÁP QUỶ TOÁN ---
// Khung: 10 hạng mục × 2 ải (⚔️ Thường / 🔥 Tinh Anh), có mở khoá & lưu tiến độ.
// LƯU Ý: cơ chế thi và đề toán bên dưới (StageExam) hiện là BẢN TẠM,
// sẽ được thay bằng đề & luật thi cụ thể do người dùng cung cấp sau.

const GOAL_CORRECT = 10;   // số câu đúng để qua ải (bản tạm)
const START_HEARTS = 3;

const rnd = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Độ khó quy đổi từ (hạng mục, ải, số câu đã đúng).
const difficultyAt = (zoneIndex, tierId, correct) =>
  zoneIndex * 3 + (tierId === 'elite' ? 2 : 0) + 1 + Math.floor(correct / 3);

// Sinh phép toán theo mức khó d.
function genQuestion(d) {
  let a, b, op, answer;
  if (d <= 3) {
    op = '+'; a = rnd(1, 9); b = rnd(0, 9); answer = a + b;
  } else if (d <= 7) {
    if (Math.random() < 0.5) { op = '+'; a = rnd(2, 12); b = rnd(2, 10); answer = a + b; }
    else { op = '−'; a = rnd(6, 20); b = rnd(1, a); answer = a - b; }
  } else if (d <= 14) {
    const k = Math.random();
    if (k < 0.4) { op = '+'; a = rnd(10, 60); b = rnd(5, 40); answer = a + b; }
    else if (k < 0.75) { op = '−'; a = rnd(20, 99); b = rnd(5, a - 1); answer = a - b; }
    else { op = '×'; a = rnd(2, 5); b = rnd(2, 9); answer = a * b; }
  } else if (d <= 22) {
    const k = Math.random();
    if (k < 0.45) { op = '×'; a = rnd(2, 9); b = rnd(2, 9); answer = a * b; }
    else if (k < 0.75) { op = '÷'; b = rnd(2, 9); answer = rnd(2, 9); a = b * answer; }
    else { op = '+'; a = rnd(30, 120); b = rnd(20, 90); answer = a + b; }
  } else {
    const k = Math.random();
    if (k < 0.4) { op = '×'; a = rnd(6, 19); b = rnd(3, 12); answer = a * b; }
    else if (k < 0.7) { op = '÷'; b = rnd(3, 12); answer = rnd(3, 12); a = b * answer; }
    else { op = '−'; a = rnd(120, 400); b = rnd(30, 119); answer = a - b; }
  }
  const opts = new Set([answer]);
  const spread = Math.max(2, Math.round(answer * 0.25) + 2);
  let guard = 0;
  while (opts.size < 4 && guard++ < 40) {
    let x = answer + (Math.random() < 0.5 ? 1 : -1) * rnd(1, spread);
    if (x < 0) x = answer + rnd(1, 5);
    opts.add(x);
  }
  return { text: `${a} ${op} ${b}`, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

const timeFor = (d) => Math.max(6, 16 - Math.floor(d / 2));

const BTN_COLORS = [
  'bg-sky-400 shadow-[0_5px_0_rgb(2,132,199)]',
  'bg-violet-400 shadow-[0_5px_0_rgb(124,58,237)]',
  'bg-amber-400 shadow-[0_5px_0_rgb(217,119,6)]',
  'bg-emerald-400 shadow-[0_5px_0_rgb(5,150,105)]',
];

// ====================== MÀN THI MỘT ẢI (BẢN TẠM) ======================
function StageExam({ zone, zoneIndex, tier, onExit, onCleared }) {
  const [correct, setCorrect] = useState(0);
  const [hearts, setHearts] = useState(START_HEARTS);
  // Bản sao bằng ref để tính toán ngoài hàm cập nhật state (tránh StrictMode gọi 2 lần).
  const correctRef = useRef(0);
  const heartsRef = useRef(START_HEARTS);
  const [q, setQ] = useState(null);
  const [qId, setQId] = useState(0);
  const [phase, setPhase] = useState('ask');   // ask | correct | wrong
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);  // null | 'win' | 'lose'
  const [shake, setShake] = useState(false);
  const totalRef = useRef(1);

  const nextQuestion = useCallback((doneCount) => {
    const d = difficultyAt(zoneIndex, tier.id, doneCount);
    setQ(genQuestion(d));
    const t = timeFor(d);
    totalRef.current = t;
    setTimeLeft(t);
    setPicked(null);
    setPhase('ask');
    setQId((i) => i + 1);
  }, [zoneIndex, tier.id]);

  useEffect(() => {
    nextQuestion(0);
    startMusic('arcade');
    return () => killMusic();
  }, [nextQuestion]);

  const resolveWrong = useCallback(() => {
    setPhase('wrong');
    playSound('wrong');
    setShake(true);
    setTimeout(() => setShake(false), 400);
    const h = heartsRef.current - 1;
    heartsRef.current = h;
    setHearts(h);
    if (h <= 0) setTimeout(() => { playSound('lose'); killMusic(); setResult('lose'); }, 900);
    else setTimeout(() => nextQuestion(correctRef.current), 900);
  }, [nextQuestion]);

  const resolveCorrect = useCallback(() => {
    setPhase('correct');
    playSound('correct');
    const c = correctRef.current + 1;
    correctRef.current = c;
    setCorrect(c);
    if (c >= GOAL_CORRECT) {
      setTimeout(() => { playSound('win'); killMusic(); setResult('win'); onCleared(); }, 850);
    } else {
      setTimeout(() => { playSound('levelup'); nextQuestion(c); }, 850);
    }
  }, [nextQuestion, onCleared]);

  // Đồng hồ mỗi câu
  useEffect(() => {
    if (result || phase !== 'ask') return undefined;
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(iv); resolveWrong(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, qId, result, resolveWrong]);

  const answer = (opt) => {
    if (phase !== 'ask' || result) return;
    setPicked(opt);
    if (q && opt === q.answer) resolveCorrect();
    else resolveWrong();
  };

  const pct = Math.max(0, Math.min(100, (timeLeft / totalRef.current) * 100));

  if (result) {
    const win = result === 'win';
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <div style={{ fontSize: '4rem', lineHeight: 1, ...emojiFont }}>{win ? '🏆' : '💔'}</div>
        <h2 className="text-2xl font-black text-white md:text-3xl">
          {win ? `Đã vượt ${tier.label}!` : 'Chưa qua ải rồi!'}
        </h2>
        <p className="text-sm font-bold text-white/70">
          {win ? `${zone.emoji} ${zone.name} — ${tier.label}` : `Bé trả lời đúng ${correct}/${GOAL_CORRECT} câu`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              correctRef.current = 0;
              heartsRef.current = START_HEARTS;
              setResult(null); setHearts(START_HEARTS); setCorrect(0);
              nextQuestion(0); startMusic('arcade');
            }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-6 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none"
          >
            <RotateCcw size={20} /> Thi lại
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white transition hover:bg-white/25"
          >
            Về bản đồ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HUD */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-white">
        <div className="min-w-0 truncate rounded-full bg-white/10 px-3 py-1 text-xs font-black">
          {zone.emoji} {tier.emoji} {tier.label}
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: START_HEARTS }).map((_, i) => (
            <Heart key={i} size={18} className={i < hearts ? 'fill-rose-500 text-rose-500' : 'fill-white/10 text-white/25'} />
          ))}
        </div>
        <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-200">
          {correct}/{GOAL_CORRECT}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-2">
        <div className={`flex flex-col items-center ${shake ? 'animate-[twr-shake_0.4s]' : ''}`}>
          <div
            style={{ fontSize: '3.5rem', lineHeight: 1, ...emojiFont }}
            className={phase === 'correct' ? 'animate-[twr-pop_0.85s_forwards]' : 'animate-[twr-hover_1.6s_ease-in-out_infinite]'}
          >
            {phase === 'correct' ? '💥' : zone.emoji}
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center gap-2">
          <Clock size={16} className="shrink-0 text-white/60" />
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${pct < 34 ? 'bg-rose-400' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-sm font-black text-white/80">{timeLeft}</span>
        </div>

        {q && (
          <>
            <div className="rounded-3xl border-2 border-white/15 bg-white/10 px-6 py-4 text-center shadow-inner">
              <div className="text-4xl font-black text-white drop-shadow md:text-6xl">{q.text} = ?</div>
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-2.5 md:gap-3">
              {q.options.map((opt, idx) => {
                let cls = BTN_COLORS[idx % BTN_COLORS.length];
                if (phase !== 'ask') {
                  if (opt === q.answer) cls = 'bg-green-500 shadow-[0_5px_0_rgb(21,128,61)]';
                  else if (picked === opt) cls = 'bg-rose-500 shadow-[0_5px_0_rgb(190,18,60)]';
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
      </div>
    </>
  );
}

// ====================== BẢN ĐỒ HẠNG MỤC ======================
function ZoneMap({ progress, onPick }) {
  const clearedCount = TOWER_ZONES.reduce(
    (n, z) => n + TOWER_TIERS.filter((t) => isCleared(progress, z.id, t.id)).length, 0,
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div className="mx-auto max-w-md">
        <div className="mb-3 text-center text-xs font-black text-white/60">
          Đã vượt {clearedCount}/{TOWER_ZONES.length * TOWER_TIERS.length} ải
        </div>

        <div className="grid gap-2.5">
          {TOWER_ZONES.map((zone, zi) => (
            <div
              key={zone.id}
              className={`rounded-2xl border-2 p-2.5 ${
                zone.isBoss
                  ? 'border-rose-400/50 bg-gradient-to-br from-rose-900/60 to-slate-900/60'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span style={{ fontSize: '1.6rem', lineHeight: 1, ...emojiFont }}>{zone.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white md:text-base">{zone.name}</div>
                  <div className="text-[11px] font-bold text-amber-300/80">{zone.rank}</div>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/60">
                  {zi + 1}/{TOWER_ZONES.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TOWER_TIERS.map((tier) => {
                  const unlocked = isUnlocked(progress, zi, tier.id);
                  const cleared = isCleared(progress, zone.id, tier.id);
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => { playSound('pop'); onPick(zi, tier); }}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-black transition active:translate-y-0.5 md:text-sm ${
                        !unlocked
                          ? 'cursor-not-allowed bg-white/5 text-white/30'
                          : cleared
                            ? 'bg-emerald-500/90 text-white shadow-[0_3px_0_rgb(5,150,105)]'
                            : tier.id === 'elite'
                              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_3px_0_rgb(159,18,57)]'
                              : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_3px_0_rgb(49,46,129)]'
                      }`}
                    >
                      {!unlocked ? <Lock size={13} /> : cleared ? <Check size={14} /> : <span>{tier.emoji}</span>}
                      <span className="truncate">{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================== VỎ GAME ======================
export default function TowerMathApp({ onBack, onReward, robuxBalance = 0 }) {
  const [progress, setProgress] = useState(loadProgress);
  const [stage, setStage] = useState(null); // { zoneIndex, tier }

  // Lưu ý: KHÔNG đặt side-effect trong hàm cập nhật state (StrictMode gọi 2 lần -> thưởng đôi).
  const handleCleared = useCallback(() => {
    if (!stage) return;
    const zone = TOWER_ZONES[stage.zoneIndex];
    const key = stageKey(zone.id, stage.tier.id);
    if (progress[key]?.cleared) return;         // đã qua trước đó -> không thưởng lại
    const next = { ...progress, [key]: { cleared: true } };
    setProgress(next);
    saveProgress(next);
    playSound('gift');
    onReward?.(stage.tier.id === 'elite' ? 2 : 1, `Vượt ${zone.name}`);
  }, [stage, progress, onReward]);

  const zone = stage ? TOWER_ZONES[stage.zoneIndex] : null;

  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/25 px-3 py-2">
        <button
          type="button"
          onClick={() => (stage ? setStage(null) : onBack?.())}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/90 transition hover:bg-white/20"
        >
          <ChevronLeft size={18} /> {stage ? 'Bản đồ' : 'Thoát'}
        </button>
        <h1 className="min-w-0 truncate text-base font-black text-white md:text-2xl">
          {stage ? `${zone.emoji} ${zone.name}` : '🏰 Tháp Quỷ Toán'}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5">
          {!stage && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-1 text-xs font-black text-yellow-200">
              <Gem size={13} /> {robuxBalance}
            </span>
          )}
          <GameHelp>
            Tháp có <b>10 hạng mục</b>, mỗi hạng mục gồm <b>⚔️ Ải Thường</b> (cơ bản) và <b>🔥 Ải Tinh Anh</b> (nâng cao).
            Vượt Ải Thường để mở Ải Tinh Anh và mở hạng mục kế tiếp. Trả lời sai hoặc hết giờ sẽ mất 1 ❤️.
          </GameHelp>
          <SoundToggle />
        </div>
      </div>

      {stage
        ? (
          <StageExam
            key={`${zone.id}:${stage.tier.id}`}
            zone={zone}
            zoneIndex={stage.zoneIndex}
            tier={stage.tier}
            onExit={() => setStage(null)}
            onCleared={handleCleared}
          />
        )
        : <ZoneMap progress={progress} onPick={(zoneIndex, tier) => setStage({ zoneIndex, tier })} />}

      <style>{`
        @keyframes twr-hover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes twr-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes twr-pop { 0%{transform:scale(1);opacity:1} 60%{transform:scale(1.6);opacity:1} 100%{transform:scale(0.2);opacity:0} }
      `}</style>
    </div>
  );
}
