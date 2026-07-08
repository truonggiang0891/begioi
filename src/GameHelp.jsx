import { useState } from 'react';
import { Info, X } from 'lucide-react';

// Nút ℹ️ gọn cho phần "cách chơi" — bấm mới sổ ra, để dành không gian cho vùng chơi.
// Đặt trong thanh tiêu đề game (cạnh nút "Mới"). children = nội dung hướng dẫn.
export default function GameHelp({ children, title = 'Cách chơi' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Hướng dẫn chơi"
        aria-expanded={open}
        className={`grid h-9 w-9 place-items-center rounded-full transition ${
          open ? 'bg-cyan-400/30 text-cyan-200' : 'bg-white/10 text-white/80 hover:bg-white/20'
        }`}
      >
        <Info size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-[71] w-[min(78vw,280px)] rounded-2xl border border-white/15 bg-slate-800 p-3 text-left shadow-2xl">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wide text-cyan-300">{title}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="text-white/50 hover:text-white/80">
                <X size={15} />
              </button>
            </div>
            <div className="text-xs font-bold leading-relaxed text-white/85">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
