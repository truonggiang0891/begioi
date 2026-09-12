import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, Gem, Smartphone, ArrowRight } from 'lucide-react';
import { playSound, killMusic } from './gameAudio';

// --- BÀI THI THÁP QUỶ TOÁN ---
// Luật: 30 câu / 30 phút. Phải LÀM HẾT bài mới được thưởng.
//  - Mỗi câu đúng: +1 phút xem điện thoại, +2 Robux  (đúng cả 30 câu = 30 phút + 60 Robux)
//  - Mỗi câu sai : -2,5 phút, -5 Robux
// Sau khi thi: BẮT BUỘC xem lại từng câu sai kèm đáp án + lời giải,
// rồi luyện lại mỗi câu sai cho tới khi đúng 4 lần thì mới nhận thưởng.

export const EXAM_MINUTES = 30;
export const PER_CORRECT_MIN = 1;
export const PER_CORRECT_ROBUX = 2;
export const PER_WRONG_MIN = 2.5;
export const PER_WRONG_ROBUX = 5;
export const DRILL_TIMES = 4;

const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.');
const isRight = (q, val) => norm(val) === norm(q.answer);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
const fmtMin = (m) => String(m).replace('.', ',');

/* Ô hiển thị một câu hỏi (đề + ảnh + đáp án) — dùng chung cho cả lúc thi và lúc luyện lại. */
function QuestionCard({ q, options, picked, setPicked, typed, setTyped, locked, showAnswer }) {
  return (
    <>
      <div className="w-full max-w-md rounded-2xl border-2 border-white/15 bg-white/10 p-3 text-center">
        <div className="text-base font-black leading-snug text-white md:text-xl">{q.q}</div>
        {q.img && (
          <img
            src={q.img}
            alt=""
            className="mx-auto mt-2 max-h-[30dvh] w-auto max-w-full rounded-xl bg-white object-contain p-1"
          />
        )}
      </div>

      {q.type === 'fill' ? (
        <input
          type="text"
          inputMode="numeric"
          value={typed}
          disabled={locked}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Đáp án của bé…"
          className="w-full max-w-xs rounded-2xl border-2 border-white/20 bg-white/95 px-4 py-3 text-center text-2xl font-black text-slate-800 outline-none focus:border-amber-300 disabled:opacity-70"
        />
      ) : (
        <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((opt, i) => {
            const sel = picked === opt;
            let cls = sel
              ? 'bg-amber-400 text-amber-950 shadow-[0_4px_0_rgb(180,83,9)]'
              : 'bg-white/15 text-white hover:bg-white/25';
            if (showAnswer) {
              if (isRight(q, opt)) cls = 'bg-green-500 text-white shadow-[0_4px_0_rgb(21,128,61)]';
              else if (sel) cls = 'bg-rose-500 text-white shadow-[0_4px_0_rgb(190,18,60)]';
              else cls = 'bg-white/10 text-white/60';
            }
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => { playSound('pop'); setPicked(opt); }}
                className={`rounded-2xl px-3 py-3 text-sm font-black transition active:translate-y-0.5 md:text-lg ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </>
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
  const [drillFeedback, setDrillFeedback] = useState(null); // 'ok' | 'no'
  const grantedRef = useRef(false);

  const total = questions.length;
  const q = questions[idx];

  // Xáo thứ tự đáp án 1 lần cho mỗi câu.
  const optionOrder = useMemo(
    () => questions.map((item) => (item.type === 'choice' ? shuffle(item.options) : [])),
    [questions],
  );

  // Đồng hồ chung 30 phút — chỉ chạy khi đang thi.
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

  const reward = useMemo(() => ({
    minutes: correctCount * PER_CORRECT_MIN - wrongCount * PER_WRONG_MIN,
    robux: correctCount * PER_CORRECT_ROBUX - wrongCount * PER_WRONG_ROBUX,
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

  // Trao thưởng đúng 1 lần khi hoàn tất mọi bước.
  useEffect(() => {
    if (phase !== 'done' || grantedRef.current) return;
    grantedRef.current = true;
    onExamReward?.(reward.minutes, reward.robux);
    onCleared?.();
    playSound('win');
  }, [phase, reward, onExamReward, onCleared]);

  /* ---------------- HẾT GIỜ (chưa làm hết bài) ---------------- */
  if (phase === 'timeout') {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="text-5xl">⏰</div>
        <h2 className="text-xl font-black text-white md:text-2xl">Hết 30 phút mất rồi!</h2>
        <p className="max-w-xs text-sm font-bold text-white/70">
          Bé mới làm {idx}/{total} câu. Phải làm <b>hết bài thi</b> mới được nhận thưởng, bé thi lại nhé!
        </p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white transition hover:bg-white/25"
        >
          Về bản đồ
        </button>
      </div>
    );
  }

  /* ---------------- XEM LẠI CÂU SAI (bắt buộc) ---------------- */
  if (phase === 'review') {
    if (wrongCount === 0) {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="text-5xl">🌟</div>
          <h2 className="text-xl font-black text-white md:text-2xl">Bé làm đúng cả {total} câu!</h2>
          <p className="text-sm font-bold text-white/70">Không có câu nào sai, bé nhận thưởng luôn nhé!</p>
          <button
            type="button"
            onClick={() => setPhase('done')}
            className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none"
          >
            Nhận thưởng 🎁
          </button>
        </div>
      );
    }
    const rq = wrongList[reviewPos];
    const last = reviewPos + 1 >= wrongCount;
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <div className="text-center text-sm font-black text-amber-300">
          📖 Xem lại câu sai {reviewPos + 1}/{wrongCount}
        </div>
        <div className="rounded-2xl border-2 border-white/15 bg-white/10 p-3 text-center">
          <div className="text-base font-black leading-snug text-white md:text-xl">{rq.q}</div>
          {rq.img && <img src={rq.img} alt="" className="mx-auto mt-2 max-h-[26dvh] w-auto max-w-full rounded-xl bg-white object-contain p-1" />}
        </div>
        <div className="rounded-2xl border-2 border-green-400/40 bg-green-500/15 p-3 text-center">
          <div className="text-xs font-black uppercase tracking-wide text-green-300">Đáp án đúng</div>
          <div className="text-2xl font-black text-green-300">{rq.answer}</div>
        </div>
        <div className="rounded-2xl border-2 border-sky-400/30 bg-sky-500/10 p-3">
          <div className="mb-1 text-xs font-black uppercase tracking-wide text-sky-300">Vì sao?</div>
          <div className="text-sm font-bold leading-relaxed text-white/90">{rq.explain}</div>
        </div>
        <button
          type="button"
          onClick={() => { playSound('pop'); if (last) startDrill(); else setReviewPos((p) => p + 1); }}
          className="mx-auto flex items-center gap-2 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 px-7 py-3 text-base font-black text-white shadow-[0_5px_0_rgb(49,46,129)] transition active:translate-y-1 active:shadow-none"
        >
          {last ? 'Luyện lại các câu sai' : 'Câu sai tiếp theo'} <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  /* ---------------- LUYỆN LẠI CÂU SAI (mỗi câu đúng 4 lần) ---------------- */
  if (phase === 'drill') {
    const remaining = wrongList.filter((x) => (drillCounts[x.id] || 0) < DRILL_TIMES);
    if (remaining.length === 0) {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="text-5xl">💪</div>
          <h2 className="text-xl font-black text-white md:text-2xl">Bé đã luyện xong hết câu sai!</h2>
          <button
            type="button"
            onClick={() => setPhase('done')}
            className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none"
          >
            Nhận thưởng 🎁
          </button>
        </div>
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
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-4 py-3">
        <div className="text-center text-sm font-black text-amber-300">
          💪 Luyện lại — còn {remaining.length} câu
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
          Câu này đã đúng {done}/{DRILL_TIMES} lần
        </div>
        <QuestionCard
          q={dq}
          options={dOpts}
          picked={picked}
          setPicked={setPicked}
          typed={typed}
          setTyped={setTyped}
          locked={Boolean(drillFeedback)}
          showAnswer={drillFeedback === 'no'}
        />
        {drillFeedback === 'no' && (
          <div className="max-w-md rounded-xl bg-rose-500/20 px-3 py-2 text-center text-sm font-bold text-rose-200">
            Chưa đúng rồi! Đáp án là <b>{dq.answer}</b> — bé làm lại câu này từ đầu nhé.
          </div>
        )}
        <button
          type="button"
          disabled={!dAnswered || Boolean(drillFeedback)}
          onClick={drillSubmit}
          className="rounded-full bg-gradient-to-b from-amber-400 to-orange-500 px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(194,65,12)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:shadow-none"
        >
          Xác nhận
        </button>
      </div>
    );
  }

  /* ---------------- NHẬN THƯỞNG ---------------- */
  if (phase === 'done') {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 py-4 text-center">
        <div className="text-5xl">🎁</div>
        <h2 className="text-xl font-black text-white md:text-2xl">Hoàn thành {tier.label}!</h2>
        <p className="text-sm font-bold text-white/70">{zone.emoji} {zone.name}</p>

        <div className="grid w-full max-w-xs gap-2 text-left">
          <div className="flex items-center justify-between rounded-xl bg-green-500/15 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-black text-green-300"><CheckCircle size={16} /> Câu đúng</span>
            <span className="text-lg font-black text-green-300">{correctCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-rose-500/15 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-black text-rose-300"><XCircle size={16} /> Câu sai</span>
            <span className="text-lg font-black text-rose-300">{wrongCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-purple-500/15 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-black text-purple-200"><Smartphone size={16} /> Giờ xem</span>
            <span className="text-lg font-black text-purple-200">
              {reward.minutes >= 0 ? '+' : '−'}{fmtMin(Math.abs(reward.minutes))} phút
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-yellow-500/15 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-black text-yellow-200"><Gem size={16} /> Robux</span>
            <span className="text-lg font-black text-yellow-200">
              {reward.robux >= 0 ? '+' : '−'}{Math.abs(reward.robux)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="mt-1 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(5,150,105)] transition active:translate-y-1 active:shadow-none"
        >
          Về bản đồ
        </button>
      </div>
    );
  }

  /* ---------------- ĐANG THI ---------------- */
  const low = timeLeft <= 120;
  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-white">
        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ${low ? 'bg-rose-500/30 text-rose-200' : 'bg-white/10'}`}>
          <Clock size={15} /> {fmtClock(timeLeft)}
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">{idx + 1}/{total}</div>
        <div className="flex items-center gap-1.5 text-sm font-black">
          <span className="flex items-center gap-1 text-green-300"><CheckCircle size={15} /> {correctCount}</span>
          <span className="flex items-center gap-1 text-rose-300"><XCircle size={15} /> {wrongCount}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-4 py-2">
        <QuestionCard
          q={q}
          options={optionOrder[idx]}
          picked={picked}
          setPicked={setPicked}
          typed={typed}
          setTyped={setTyped}
          locked={false}
          showAnswer={false}
        />
        <button
          type="button"
          disabled={!answered}
          onClick={submit}
          className="rounded-full bg-gradient-to-b from-amber-400 to-orange-500 px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_rgb(194,65,12)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:shadow-none"
        >
          {idx + 1 >= total ? 'Nộp bài' : 'Xác nhận'}
        </button>
      </div>
    </>
  );
}
