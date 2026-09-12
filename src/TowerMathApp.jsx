import { useState, useCallback } from 'react';
import { ChevronLeft, Gem, Lock, Check } from 'lucide-react';
import { playSound, emojiFont } from './gameAudio';
import { SoundToggle } from './gameUI';
import GameHelp from './GameHelp';
import TowerExam, { EXAM_MINUTES, DRILL_TIMES } from './TowerExam';
import { getExam } from './towerExams';
import {
  TOWER_ZONES, TOWER_TIERS, stageKey,
  loadProgress, saveProgress, isCleared, isUnlocked,
} from './towerZones';

// --- GAME: THÁP QUỶ TOÁN ---
// 10 hạng mục × 2 ải (⚔️ Thường / 🔥 Tinh Anh), có mở khoá & lưu tiến độ.
// Mỗi ải là một BÀI THI 30 câu / 30 phút (xem TowerExam.jsx).

/* ====================== BẢN ĐỒ HẠNG MỤC ====================== */
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
                  const ready = Boolean(getExam(zone.id, tier.id));
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
                      {unlocked && !ready && <span className="text-[9px] opacity-70">(sắp có)</span>}
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

/* ====================== VỎ GAME ====================== */
export default function TowerMathApp({ onBack, onExamReward, robuxBalance = 0 }) {
  const [progress, setProgress] = useState(loadProgress);
  const [stage, setStage] = useState(null); // { zoneIndex, tier }

  const zone = stage ? TOWER_ZONES[stage.zoneIndex] : null;
  const questions = stage ? getExam(zone.id, stage.tier.id) : null;

  // Lưu ý: KHÔNG đặt side-effect trong hàm cập nhật state (StrictMode gọi 2 lần).
  const handleCleared = useCallback(() => {
    if (!stage) return;
    const z = TOWER_ZONES[stage.zoneIndex];
    const key = stageKey(z.id, stage.tier.id);
    if (progress[key]?.cleared) return;
    const next = { ...progress, [key]: { cleared: true } };
    setProgress(next);
    saveProgress(next);
  }, [stage, progress]);

  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900">
      {/* Header — ẩn khi đang thi để dành chỗ (bài thi có thanh trên riêng) */}
      {!(stage && questions) && (
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
            Mỗi ải là một <b>bài thi làm trong {EXAM_MINUTES} phút</b>. Nên <b>xoay ngang điện thoại</b> cho dễ nhìn.
            Phải làm <b>hết bài</b> mới được thưởng: mỗi câu đúng <b>+1 phút xem điện thoại và +2 Robux</b>,
            mỗi câu sai <b>−2,5 phút và −5 Robux</b>.
            Thi xong bé phải xem lại các câu sai kèm lời giải, rồi <b>làm lại mỗi câu sai đúng {DRILL_TIMES} lần</b> thì mới nhận thưởng.
          </GameHelp>
          <SoundToggle />
        </div>
      </div>
      )}

      {!stage && <ZoneMap progress={progress} onPick={(zoneIndex, tier) => setStage({ zoneIndex, tier })} />}

      {stage && questions && (
        <TowerExam
          key={`${zone.id}:${stage.tier.id}`}
          questions={questions}
          zone={zone}
          tier={stage.tier}
          onExit={() => setStage(null)}
          onCleared={handleCleared}
          onExamReward={onExamReward}
        />
      )}

      {stage && !questions && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-5xl">🛠️</div>
          <h2 className="text-xl font-black text-white">Đề thi đang được chuẩn bị</h2>
          <p className="max-w-xs text-sm font-bold text-white/70">
            {zone.emoji} {zone.name} — {stage.tier.label} sắp có đề. Bé thi ải khác trước nhé!
          </p>
          <button
            type="button"
            onClick={() => setStage(null)}
            className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white transition hover:bg-white/25"
          >
            Về bản đồ
          </button>
        </div>
      )}
    </div>
  );
}
