import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, toggleMuted, emojiFont } from './gameAudio';
import { skillMeta } from './gameSkills';

// Nút bật/tắt tiếng dùng chung — đặt trên thanh tiêu đề game (cạnh nút "Mới").
// Trạng thái tắt tiếng lưu localStorage nên nhớ qua các game.
export function SoundToggle({ className = '' }) {
  const [muted, setMuted] = useState(isMuted());
  return (
    <button
      type="button"
      onClick={() => setMuted(toggleMuted())}
      aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
      aria-pressed={muted}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        muted ? 'bg-white/10 text-white/50' : 'bg-white/10 text-white/80 hover:bg-white/20'
      } ${className}`}
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

// Thanh hiển thị skill đang có hiệu lực (icon + vòng đếm ngược).
// active: [{ id, remain (0..1) }] — remain là tỉ lệ thời gian còn lại.
export function SkillHUD({ active, className = '' }) {
  if (!active || !active.length) return null;
  return (
    <div className={`pointer-events-none flex items-center gap-1.5 ${className}`}>
      {active.map((s) => {
        const m = skillMeta(s.id);
        return (
          <div
            key={s.id}
            className="relative grid h-9 w-9 place-items-center rounded-xl bg-black/45 shadow"
            style={{ boxShadow: `0 0 0 2px ${m.color}` }}
            title={`${m.name} — ${m.desc}`}
          >
            <span style={{ fontSize: 18, lineHeight: 1, ...emojiFont }}>{m.emoji}</span>
            {typeof s.remain === 'number' && (
              <span
                className="absolute bottom-0 left-0 h-1 rounded-full"
                style={{ width: `${Math.max(0, Math.min(1, s.remain)) * 100}%`, background: m.color }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Nhãn thông báo nhận quà / skill (bay lên giữa màn). show: {id, key} | null
export function SkillToast({ show }) {
  if (!show) return null;
  const m = skillMeta(show.id);
  return (
    <div
      key={show.key}
      className="pointer-events-none absolute left-1/2 top-1/3 z-[58] -translate-x-1/2 animate-[skill-pop_1.4s_ease-out_forwards]"
    >
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-2 shadow-2xl"
        style={{ background: 'rgba(15,23,42,0.92)', boxShadow: `0 0 0 2px ${m.color}` }}
      >
        <span style={{ fontSize: 26, lineHeight: 1, ...emojiFont }}>{m.emoji}</span>
        <div className="text-left">
          <div className="text-sm font-black" style={{ color: m.color }}>{m.name}</div>
          <div className="text-[11px] font-bold text-white/70">{m.desc}</div>
        </div>
      </div>
      <style>{'@keyframes skill-pop{0%{opacity:0;transform:translate(-50%,14px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.06)}25%{transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-18px) scale(1)}}'}</style>
    </div>
  );
}
