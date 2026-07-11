// --- BẢNG THÀNH TÍCH (giao diện cho bé) + Chúc mừng khi mở khoá huy hiệu ---
import { useEffect, useRef } from 'react';
import { XCircle, Lock } from 'lucide-react';
import { computeBadgeBoard } from './achievements';

const TIER_STYLE = {
  bronze: { ring: 'border-amber-300', bg: 'from-amber-50 to-orange-100', text: 'text-amber-700' },
  silver: { ring: 'border-slate-300', bg: 'from-slate-50 to-slate-200', text: 'text-slate-600' },
  gold: { ring: 'border-yellow-400', bg: 'from-yellow-50 to-amber-200', text: 'text-amber-700' },
  diamond: { ring: 'border-cyan-300', bg: 'from-cyan-50 to-sky-200', text: 'text-sky-700' },
};

// Toast chúc mừng nổi lên giữa màn hình khi bé vừa mở khoá huy hiệu mới.
export function BadgeToast({ badge, onDone }) {
  // Giữ onDone trong ref để timer chỉ phụ thuộc `badge`. Nếu phụ thuộc onDone,
  // mỗi lần App re-render (đồng hồ đếm giây) sẽ tạo onDone mới -> reset timer -> popup không tự tắt.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!badge) return undefined;
    const timer = setTimeout(() => onDoneRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [badge]);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-24 pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto animate-bounce-in rounded-3xl border-4 border-yellow-300 bg-gradient-to-b from-white to-yellow-50 px-6 py-4 text-center shadow-2xl"
      >
        <div className="text-xs font-black uppercase tracking-wide text-amber-500">🎉 Huy hiệu mới! 🎉</div>
        <div className="my-1 text-5xl drop-shadow" aria-hidden>{badge.emoji}</div>
        <div className="text-lg font-black text-purple-700">{badge.title}</div>
        <div className="text-xs font-bold text-gray-500">{badge.desc}</div>
      </div>
    </div>
  );
}

export default function AchievementsPanel({ stats, onClose }) {
  const board = computeBadgeBoard(stats);
  const unlockedCount = board.filter(b => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 md:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex h-[92dvh] max-h-full w-full max-w-lg flex-col rounded-2xl border-4 border-white bg-white p-3 shadow-2xl md:rounded-3xl md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-lg font-black text-amber-600 md:text-xl">
              🏆 <span className="truncate">Bảng thành tích của bé</span>
            </div>
            <div className="mt-0.5 text-xs font-bold text-gray-500 md:text-sm">
              Đã mở khoá {unlockedCount}/{board.length} huy hiệu
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng thành tích"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {board.map((badge) => {
              const style = TIER_STYLE[badge.tier] || TIER_STYLE.bronze;
              return (
                <div
                  key={badge.id}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-2.5 text-center transition ${
                    badge.unlocked
                      ? `${style.ring} bg-gradient-to-b ${style.bg} shadow-sm`
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`text-4xl ${badge.unlocked ? 'drop-shadow' : 'opacity-30 grayscale'}`} aria-hidden>
                    {badge.emoji}
                  </div>
                  <div className={`mt-1 text-xs font-black leading-tight ${badge.unlocked ? style.text : 'text-gray-400'}`}>
                    {badge.title}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold leading-tight text-gray-400">
                    {badge.desc}
                  </div>

                  {badge.unlocked ? (
                    <div className="mt-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                      ✓ Đã đạt
                    </div>
                  ) : (
                    <div className="mt-1.5 w-full">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{ width: `${Math.round(badge.ratio * 100)}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-400">
                        <Lock size={9} /> {badge.current}/{badge.target}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
