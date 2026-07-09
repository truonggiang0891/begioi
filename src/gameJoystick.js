import { useRef } from 'react';

// Cần lái ảo dùng chung cho các game arena (chạm-kéo bất kỳ đâu trong sân để đi).
// Dùng: const { joyRef, handlers } = useJoystick(canvasRef, W, H, JOY_R, { blocked, onStart });
//  - blocked(): trả true thì bỏ qua (vd đang over / đang tạm dừng)
//  - onStart(): gọi khi bắt đầu chạm (vd bật nhạc nền)
// Gắn {...handlers} vào thẻ bọc canvas. Trong vòng lặp đọc joyRef.current = {ox,oy,dx,dy}|null.
export function useJoystick(canvasRef, W, H, joyR, opts = {}) {
  const joyRef = useRef(null);
  const toCanvas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H };
  };
  const onPointerDown = (e) => {
    if (opts.blocked && opts.blocked()) return;
    opts.onStart?.();
    const p = toCanvas(e);
    joyRef.current = { ox: p.x, oy: p.y, dx: 0, dy: 0 };
  };
  const onPointerMove = (e) => {
    const j = joyRef.current;
    if (!j || !(e.buttons || e.pointerType === 'touch')) return;
    const p = toCanvas(e);
    let dx = p.x - j.ox; let dy = p.y - j.oy;
    const len = Math.hypot(dx, dy);
    if (len > joyR) { dx = dx / len * joyR; dy = dy / len * joyR; }
    j.dx = dx; j.dy = dy;
  };
  const onPointerUp = () => { joyRef.current = null; };
  return { joyRef, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}

// Vẽ cần lái lên canvas (gọi trong hàm draw của game).
export function drawJoystick(ctx, joy, joyR) {
  if (!joy) return;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(joy.ox, joy.oy, joyR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(joy.ox + joy.dx, joy.oy + joy.dy, 18, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
