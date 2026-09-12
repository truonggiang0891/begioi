import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, Gem, Smartphone, ArrowRight, X } from 'lucide-react';
import { playSound, killMusic } from './gameAudio';

// --- BÀI THI THÁP QUỶ TOÁN ---
// Luật: làm HẾT bài trong 30 phút mới được thưởng.
//  - Mỗi câu đúng: +1 phút xem điện thoại, +2 Robux
//  - Mỗi câu sai : -2,5 phút, -5 Robux
//  - Trần tối đa cả bài: +30 phút và +60 Robux
// Sau khi thi: BẮT BUỘC xem lại từng câu sai kèm đáp án + lời giải,
// rồi luyện lại mỗi câu sai cho tới khi đúng 4 lần thì mới nhận thưởng.
// Giao diện: dọc = 2 khối xếp trên dưới; NGANG = 2 cột (đề bên trái, đáp án bên phải).

export const EXAM_MINUTES = 30;
export const PER_CORRECT_MIN = 1;
export const PER_CORRECT_ROBUX = 2;
export const PER_WRONG_MIN = 2.5;
export const PER_WRONG_ROBUX = 5;
export const MAX_MIN = 30;
export const MAX_ROBUX = 60;
export const DRILL_TIMES = 4;

const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.');
const isRight = (q, val) => norm(val) === norm(q.answer);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
const fmtMin = (m) => String(m).replace('.', ',');

/* Khung có tiêu đề nhỏ (giống mẫu: khối cam "Nội dung câu hỏi", khối xanh "Chọn đáp án đúng") */
function Panel({ tone, title, children, className = '' }) {
  const c = tone === 'amber'
    ? { ring: 'border-amber-300/70', head: 'bg-amber-400/20 text-amber-200', dot: 'bg-amber-400 text-amber-950' }
    : { ring: 'border-sky-400/70', head: 'bg-sky-500/20 text-sky-200', dot: 'bg-sky-500 text-white' };
  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 ${c.ring} bg-white/5 ${className}`}>
      <div className={`flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-[11px] font-black ${c.head}`}>
        <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${c.dot}`}>?</span>
        {title}
      </div>
      {children}
    </div>
  );
}

/* Nội dung câu hỏi: chữ + ảnh */
function QuestionBody({ q }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto p-2">
      {q.q && (
        <div className="text-center text-base font-black leading-snug text-white md:text-xl">{q.q}</div>
      )}
      {q.img && (
        <img src={q.img} alt="" className="max-h-full w-auto max-w-full rounded-lg bg-white object-contain p-1" />
      )}
    </div>
  );
}

/* Khu trả lời: 4 ô chọn hoặc ô nhập */
function AnswerBody({ q, options, picked, setPicked, typed, setTyped, locked, showAnswer }) {
  if (q.type === 'fill') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <input
          type="text"
          inputMode="numeric"
          value={typed}
          disabled={locked}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Đáp án của bé…"
          className="w-full rounded-xl border-2 border-white/20 bg-white/95 px-3 py-3 text-center text-2xl font-black text-slate-800 outline-none focus:border-amber-300 disabled:opacity-70"
        />
      </div>
    );
  }
  return (
    <div className="grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto p-2">
      {options.map((opt, i) => {
        const sel = picked === opt;
        let cls = sel
          ? 'bg-amber-400 text-amber-950 shadow-[0_3px_0_rgb(180,83,9)]'
          : 'bg-white/15 text-white hover:bg-white/25';
        if (showAnswer) {
          if (isRight(q, opt)) cls = 'bg-green-500 text-white shadow-[0_3px_0_rgb(21,128,61)]';
          else if (sel) cls = 'bg-rose-500 text-white shadow-[0_3px_0_rgb(190,18,60)]';
          else cls = 'bg-white/10 text-white/60';
        }
        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => { playSound('pop'); setPicked(opt); }}
            className={`rounded-xl px-3 py-2.5 text-sm font-black leading-snug transition active:translate-y-0.5 md:text-base ${cls}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function TowerExam({ questions, zone, tier, onExit, onCleared, onExamReward }) {
  const [phase, setPhase] = useState('exam');       // exam | timeout | review | drill | done
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState('');
  const [wrongIds, setWrongIds] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_MINUTES * 60);
  const [reviewPos, setReviewPos] = useState(0);
  const [drillCounts, setDrillCounts] = useState({});
  const [drillPos, setDrillPos] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState(null);
  const grantedRef = useRef(false);

  const total = questions.length;
  const q = questions[idx];

  const optionOrder = useMemo(
    () => questions.map((item) => (item.type === 'choice' ? shuffle(item.options) : [])),
    [questions],
  );

  useEffect(() => {
    if (phase !== 'exam') return undefined;
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(iv); setPhase('timeout'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => () => killMusic(), []);

  const wrongList = useMemo(
    () => wrongIds.map((id) => questions.find((x) => x.id === id)).filter(Boolean),
    [wrongIds, questions],
  );
  const wrongCount = wrongIds.length;

  // Thưởng: cộng theo câu đúng, trừ theo câu sai, chặn trần 30 phút / 60 Robux.
  const reward = useMemo(() => ({
    minutes: Math.min(MAX_MIN, correctCount * PER_CORRECT_MIN - wrongCount * PER_WRONG_MIN),
    robux: Math.min(MAX_ROBUX, correctCount * PER_CORRECT_ROBUX - wrongCount * PER_WRONG_ROBUX),
  }), [correctCount, wrongCount]);

  const answered = picked !== null || typed.trim() !== '';

  const submit = () => {
    if (!answered) return;
    const ok = isRight(q, q.type === 'fill' ? typed : picked);
    if (ok) { setCorrectCount((c) => c + 1); playSound('correct'); }
    else { setWrongIds((w) => [...w, q.id]); playSound('wrong'); }
    setPicked(null);
    setTyped('');
    if (idx + 1 >= total) setPhase('review');
    else setIdx((i) => i + 1);
  };

  const startDrill = () => {
    const init = {};
    wrongIds.forEach((id) => { init[id] = 0; });
    setDrillCounts(init);
    setDrillPos(0);
    setPicked(null);
    setTyped('');
    setDrillFeedback(null);
    setPhase(wrongIds.length ? 'drill' : 'done');
  };

  useEffect(() => {
    if (phase !== 'done' || grantedRef.current) return;
    grantedRef.current = true;
    onExamReward?.(reward.minutes, reward.robux);
    onCleared?.();
    playSound('win');
  }, [phase, reward, onExamReward, onCleared]);

  /* Thanh trên cùng: X • tiến độ • đúng/sai • đồng hồ */
  const TopBar = ({ showProgress = true }) => (
    <div className="flex shrink-0 items-center gap-2 px-2 py-1.5">
      <button
        type="button"
        onClick={onExit}
        aria-label="Thoát bài thi"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={18} />
      </button>
      {showProgress && (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-black text-white/80">{idx + 1}/{total}</span>
        </div>
      )}
      <span className="flex shrink-0 items-center gap-0.5 text-xs font-black text-green-300">
        <CheckCircle size={14} /> {correctCount}
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-xs font-black text-rose-300">
        <XCircle size={14} /> {wrongCount}
      </span>
      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${
        timeLeft <= 120 ? 'bg-rose-500/30 text-rose-200' : 'bg-white/10 text-white'
      }`}>
        <Clock size={13} /> {fmtClock(timeLeft)}
      </span>
    </div>
  );

  /* ---------------- HẾT GIỜ ---------------- */
  if (phase === 'timeout') {
    return (
      <>
        <TopBar showProgress={false} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 py-3 text-center">
          <div className="text-4xl">⏰</div>
          <h2 className="text-lg font-black text-white md:text-2xl">Hết {EXAM_MINUTES} phút mất rồi!</h2>
          <p className="max-w-sm text-sm font-bold text-white/70">
            Bé mới làm {idx}/{total} câu. Phải làm <b>hết bài thi</b> mới được nhận thưởng, bé thi lại nhé!
          </p>
          <button type="button" onClick={onExit}
            className="rounded-full bg-white/15 px-6 py-2.5 text-base font-black text-white transition hover:bg-white/25">
            Về bản đồ
          </button>
        </div>
      </>
    );
  }

  /* ---------------- XEM LẠI CÂU SAI ---------------- */
  if (phase === 'review') {
    if (wrongCount === 0) {
      return (
        <>
          <TopBar showProgress={false} />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 py-3 text-center">
            <div className="text-4xl">🌟</div>
            <h2 className="text-lg font-black text-white md:text-2xl">Bé làm đúng cả {total} câu!</h2>
            <button type="button" onClick={() => setPhase('done')}
              className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-7 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none">
              Nhận thưởng 🎁
            </button>
          </div>
        </>
      );
    }
    const rq = wrongList[reviewPos];
    const last = reviewPos + 1 >= wrongCount;
    return (
      <>
        <TopBar showProgress={false} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="mb-1.5 text-center text-xs font-black text-amber-300">
            📖 Xem lại câu sai {reviewPos + 1}/{wrongCount}
          </div>
          <div className="grid gap-2 landscape:grid-cols-[1.7fr_1fr]">
            <Panel tone="amber" title="Câu bé làm sai" className="max-h-[46dvh] landscape:max-h-none">
              <QuestionBody q={rq} />
            </Panel>
            <div className="grid content-start gap-2">
              <div className="rounded-2xl border-2 border-green-400/40 bg-green-500/15 p-2.5 text-center">
                <div className="text-[11px] font-black uppercase tracking-wide text-green-300">Đáp án đúng</div>
                <div className="text-xl font-black text-green-300">{rq.answer}</div>
              </div>
              <div className="rounded-2xl border-2 border-sky-400/30 bg-sky-500/10 p-2.5">
                <div className="mb-0.5 text-[11px] font-black uppercase tracking-wide text-sky-300">Vì sao?</div>
                <div className="text-sm font-bold leading-relaxed text-white/90">{rq.explain}</div>
              </div>
              <button
                type="button"
                onClick={() => { playSound('pop'); if (last) startDrill(); else setReviewPos((p) => p + 1); }}
                className="mx-auto flex items-center gap-2 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 px-6 py-2.5 text-sm font-black text-white shadow-[0_4px_0_rgb(49,46,129)] transition active:translate-y-1 active:shadow-none"
              >
                {last ? 'Luyện lại các câu sai' : 'Câu sai tiếp theo'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------------- LUYỆN LẠI ---------------- */
  if (phase === 'drill') {
    const remaining = wrongList.filter((x) => (drillCounts[x.id] || 0) < DRILL_TIMES);
    if (remaining.length === 0) {
      return (
        <>
          <TopBar showProgress={false} />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 py-3 text-center">
            <div className="text-4xl">💪</div>
            <h2 className="text-lg font-black text-white md:text-2xl">Bé đã luyện xong hết câu sai!</h2>
            <button type="button" onClick={() => setPhase('done')}
              className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-7 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none">
              Nhận thưởng 🎁
            </button>
          </div>
        </>
      );
    }
    const dq = remaining[drillPos % remaining.length];
    const done = drillCounts[dq.id] || 0;
    const dOpts = dq.type === 'choice' ? optionOrder[questions.findIndex((x) => x.id === dq.id)] : [];
    const dAnswered = picked !== null || typed.trim() !== '';

    const drillSubmit = () => {
      if (!dAnswered || drillFeedback) return;
      const ok = isRight(dq, dq.type === 'fill' ? typed : picked);
      setDrillFeedback(ok ? 'ok' : 'no');
      playSound(ok ? 'correct' : 'wrong');
      setDrillCounts((prev) => ({ ...prev, [dq.id]: ok ? (prev[dq.id] || 0) + 1 : 0 }));
      setTimeout(() => {
        setDrillFeedback(null);
        setPicked(null);
        setTyped('');
        setDrillPos((p) => p + 1);
      }, ok ? 700 : 1700);
    };

    return (
      <>
        <TopBar showProgress={false} />
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 pb-2">
          <div className="shrink-0 text-center text-xs font-black text-amber-300">
            💪 Luyện lại — còn {remaining.length} câu · câu này đúng {done}/{DRILL_TIMES} lần
          </div>
          <div className="grid min-h-0 flex-1 gap-2 landscape:grid-cols-[1.7fr_1fr]">
            <Panel tone="amber" title="Nội dung câu hỏi">
              <QuestionBody q={dq} />
            </Panel>
            <Panel tone="sky" title={dq.type === 'fill' ? 'Nhập câu trả lời' : 'Chọn đáp án đúng'}>
              <AnswerBody
                q={dq} options={dOpts}
                picked={picked} setPicked={setPicked}
                typed={typed} setTyped={setTyped}
                locked={Boolean(drillFeedback)} showAnswer={drillFeedback === 'no'}
              />
              <div className="shrink-0 p-2">
                {drillFeedback === 'no' && (
                  <div className="mb-1.5 rounded-lg bg-rose-500/20 px-2 py-1.5 text-center text-xs font-bold text-rose-200">
                    Chưa đúng! Đáp án là <b>{dq.answer}</b> — làm lại câu này từ đầu nhé.
                  </div>
                )}
                <button
                  type="button"
                  disabled={!dAnswered || Boolean(drillFeedback)}
                  onClick={drillSubmit}
                  className="w-full rounded-full bg-gradient-to-b from-amber-400 to-orange-500 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(194,65,12)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:shadow-none"
                >
                  Xác nhận
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </>
    );
  }

  /* ---------------- NHẬN THƯỞNG ---------------- */
  if (phase === 'done') {
    return (
      <>
        <TopBar showProgress={false} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-4 py-3 text-center">
          <div className="text-4xl">🎁</div>
          <h2 className="text-lg font-black text-white md:text-2xl">Hoàn thành {tier.label}!</h2>
          <p className="text-xs font-bold text-white/70">{zone.emoji} {zone.name}</p>
          <div className="grid w-full max-w-lg gap-1.5 text-left landscape:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-green-500/15 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-sm font-black text-green-300"><CheckCircle size={15} /> Câu đúng</span>
              <span className="text-base font-black text-green-300">{correctCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-500/15 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-sm font-black text-rose-300"><XCircle size={15} /> Câu sai</span>
              <span className="text-base font-black text-rose-300">{wrongCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-purple-500/15 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-sm font-black text-purple-200"><Smartphone size={15} /> Giờ xem</span>
              <span className="text-base font-black text-purple-200">
                {reward.minutes >= 0 ? '+' : '−'}{fmtMin(Math.abs(reward.minutes))} phút
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-yellow-500/15 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-sm font-black text-yellow-200"><Gem size={15} /> Robux</span>
              <span className="text-base font-black text-yellow-200">
                {reward.robux >= 0 ? '+' : '−'}{Math.abs(reward.robux)}
              </span>
            </div>
          </div>
          <button type="button" onClick={onExit}
            className="mt-1 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-7 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none">
            Về bản đồ
          </button>
        </div>
      </>
    );
  }

  /* ---------------- ĐANG THI ---------------- */
  return (
    <>
      <TopBar />
      <div className="grid min-h-0 flex-1 gap-2 px-2 pb-2 landscape:grid-cols-[1.7fr_1fr]">
        <Panel tone="amber" title="Nội dung câu hỏi">
          <QuestionBody q={q} />
        </Panel>
        <Panel tone="sky" title={q.type === 'fill' ? 'Nhập câu trả lời' : 'Chọn đáp án đúng'}>
          <AnswerBody
            q={q} options={optionOrder[idx]}
            picked={picked} setPicked={setPicked}
            typed={typed} setTyped={setTyped}
            locked={false} showAnswer={false}
          />
          <div className="shrink-0 p-2">
            <button
              type="button"
              disabled={!answered}
              onClick={submit}
              className="w-full rounded-full bg-gradient-to-b from-amber-400 to-orange-500 py-2.5 text-base font-black text-white shadow-[0_4px_0_rgb(194,65,12)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:shadow-none"
            >
              {idx + 1 >= total ? 'Nộp bài' : 'Xác nhận'}
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
