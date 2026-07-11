// --- BÁO CÁO PHỤ HUYNH (mở trong khu vực Admin, sau mã PIN) ---
import { XCircle } from 'lucide-react';
import { getRecentDays, OP_LABELS, OP_IDS } from './statsStore';

const formatMinutes = (sec) => {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  return `${h} giờ ${m % 60} phút`;
};

function StatTile({ label, value, tone }) {
  return (
    <div className={`rounded-xl px-2 py-2 text-center ${tone}`}>
      <div className="text-lg font-black leading-none md:text-xl">{value}</div>
      <div className="mt-1 text-[10px] font-bold opacity-80 md:text-xs">{label}</div>
    </div>
  );
}

export default function ParentReport({ stats, studentName, onClose }) {
  const totalAnswered = stats.lifetimeCorrect + stats.lifetimeWrong;
  const accuracy = totalAnswered > 0 ? Math.round((stats.lifetimeCorrect / totalAnswered) * 100) : 0;

  // Độ chính xác theo từng phép (chỉ tính phép đã làm), để tìm phép yếu nhất.
  const opRows = OP_IDS
    .filter(id => id !== 'custom')
    .map((id) => {
      const op = stats.byOp?.[id] || { c: 0, w: 0 };
      const total = op.c + op.w;
      return {
        id,
        label: OP_LABELS[id],
        correct: op.c,
        wrong: op.w,
        total,
        acc: total > 0 ? Math.round((op.c / total) * 100) : null,
      };
    });

  const practised = opRows.filter(r => r.total >= 3);
  const weakest = practised.length > 0
    ? practised.reduce((min, r) => (r.acc < min.acc ? r : min), practised[0])
    : null;

  const days = getRecentDays(stats, 7).slice().reverse(); // cũ -> mới
  const maxDayTotal = Math.max(1, ...days.map(d => d.c + d.w));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 md:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex h-[92dvh] max-h-full w-full max-w-lg flex-col rounded-2xl border-4 border-white bg-white p-3 shadow-2xl md:rounded-3xl md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-lg font-black text-indigo-700 md:text-xl">
              📊 <span className="truncate">Báo cáo học tập</span>
            </div>
            <div className="mt-0.5 text-xs font-bold text-gray-500 md:text-sm">
              Bé {studentName} • tổng {totalAnswered} câu đã làm
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng báo cáo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {totalAnswered === 0 ? (
            <div className="rounded-xl border-2 border-indigo-100 bg-indigo-50 px-4 py-10 text-center text-sm font-extrabold text-gray-500 md:text-base">
              Chưa có dữ liệu. Cho bé làm vài câu để xem báo cáo nhé!
            </div>
          ) : (
            <>
              {/* Tổng quan */}
              <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                <StatTile label="Câu đúng" value={stats.lifetimeCorrect} tone="bg-green-50 text-green-700" />
                <StatTile label="Câu sai" value={stats.lifetimeWrong} tone="bg-red-50 text-red-700" />
                <StatTile label="Chính xác" value={`${accuracy}%`} tone="bg-sky-50 text-sky-700" />
                <StatTile label="Chuỗi ngày" value={`${stats.streak?.best || 0} 🔥`} tone="bg-orange-50 text-orange-700" />
                <StatTile label="Đã học" value={formatMinutes(stats.lifetimeTimeSec)} tone="bg-purple-50 text-purple-700" />
              </div>

              {/* Nhận xét nhanh: phép cần luyện thêm */}
              {weakest && weakest.acc < 80 && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800">
                  💡 Bé cần luyện thêm <b>phép {weakest.label}</b> — mới đúng {weakest.acc}% ({weakest.correct}/{weakest.total} câu).
                </div>
              )}

              {/* Độ chính xác theo phép tính */}
              <section>
                <div className="mb-2 text-sm font-black text-gray-700 md:text-base">Theo từng phép tính</div>
                <div className="space-y-2">
                  {opRows.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <div className="w-10 shrink-0 text-xs font-black text-gray-600 md:text-sm">{r.label}</div>
                      <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-gray-100">
                        {r.total > 0 && (
                          <div
                            className={`flex h-full items-center justify-end rounded-lg pr-2 text-[10px] font-black text-white transition-all ${
                              r.acc >= 80 ? 'bg-green-400' : r.acc >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.max(r.acc, 12)}%` }}
                          >
                            {r.acc}%
                          </div>
                        )}
                      </div>
                      <div className="w-16 shrink-0 text-right text-[10px] font-bold text-gray-400 md:text-xs">
                        {r.total > 0 ? `${r.correct}/${r.total}` : 'chưa làm'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Hoạt động 7 ngày gần nhất */}
              <section>
                <div className="mb-2 text-sm font-black text-gray-700 md:text-base">7 ngày gần nhất</div>
                <div className="flex items-end justify-between gap-1.5 rounded-xl bg-gray-50 p-3" style={{ height: 140 }}>
                  {days.map((d) => {
                    const total = d.c + d.w;
                    const h = Math.round((total / maxDayTotal) * 88);
                    return (
                      <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                        <div className="text-[9px] font-bold text-gray-400">{total || ''}</div>
                        <div className="flex w-full max-w-[26px] flex-col justify-end overflow-hidden rounded-md" style={{ height: 88 }}>
                          {total > 0 ? (
                            <div className="flex flex-col justify-end" style={{ height: `${Math.max(h, 6)}px` }}>
                              <div className="bg-red-300" style={{ height: `${(d.w / total) * 100}%` }} />
                              <div className="bg-green-400" style={{ height: `${(d.c / total) * 100}%` }} />
                            </div>
                          ) : (
                            <div className="h-1 rounded bg-gray-200" />
                          )}
                        </div>
                        <div className="text-[9px] font-bold text-gray-500">{d.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-bold text-gray-500">
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-green-400" /> Đúng</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-red-300" /> Sai</span>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
