import { useRef } from 'react';

// Điều khiển "đi theo ngón tay" (kiểu .io) dùng chung cho các game arena:
// chạm/kéo tới đâu trong sân, nhân vật chạy tới đó. Trực quan, không cần joystick.
// Dùng: const { moveRef, handlers } = useTouchMove(canvasRef, W, H, { blocked, onStart });
//  - moveRef.current = { x, y } (điểm ngón tay, toạ độ canvas) hoặc null khi thả tay.
// Trong vòng lặp: cho nhân vật đi VỀ PHÍA moveRef.current (xem helper moveToward).
export function useTouchMove(canvasRef, W, H, opts = {}) {
  const moveRef = useRef(null);
  const toCanvas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H };
  };
  const onPointerDown = (e) => {
    if (opts.blocked && opts.blocked()) return;
    opts.onStart?.();
    moveRef.current = toCanvas(e);
  };
  const onPointerMove = (e) => {
    if (!moveRef.current || !(e.buttons || e.pointerType === 'touch')) return;
    moveRef.current = toCanvas(e);
  };
  const onPointerUp = () => { moveRef.current = null; };
  return { moveRef, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}

// Cho nhân vật (obj có x,y) tiến về điểm target với tốc độ speed, kẹp trong biên.
// Trả true nếu có di chuyển.
export function moveToward(obj, target, speed, r, W, H) {
  if (!target) return false;
  const dx = target.x - obj.x;
  const dy = target.y - obj.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return false;
  const s = Math.min(speed, d);
  obj.x = Math.max(r, Math.min(W - r, obj.x + (dx / d) * s));
  obj.y = Math.max(r, Math.min(H - r, obj.y + (dy / d) * s));
  return true;
}

// Vẽ dấu ngón tay (vòng nhỏ mờ) để bé thấy đang dẫn nhân vật tới đâu.
export function drawTouchTarget(ctx, target) {
  if (!target) return;
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(target.x, target.y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(target.x, target.y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
