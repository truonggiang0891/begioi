import { useEffect, useRef } from 'react';

// Pháo hoa chúc mừng (canvas thuần, không cần thư viện ngoài).
// Tự chạy khi được mount; phủ toàn màn hình, không chặn thao tác (pointer-events: none).

const COLORS = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#22d3ee'];
const GRAVITY = 0.045;

export default function Fireworks({ durationMs = 5000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    const timers = [];
    let running = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];

    const rand = (min, max) => min + Math.random() * (max - min);

    const burst = (x, y) => {
      const count = 26 + Math.floor(Math.random() * 14);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const twoColor = Math.random() < 0.5 ? COLORS[Math.floor(Math.random() * COLORS.length)] : color;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
        const speed = rand(1.6, 4.4);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.008, 0.018),
          size: rand(2, 4.5),
          color: i % 2 === 0 ? color : twoColor,
        });
      }
    };

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // Lịch trình các đợt pháo hoa.
    const scheduleBursts = () => {
      let t = 0;
      while (t < durationMs - 600) {
        const delay = t;
        timers.push(
          setTimeout(() => {
            if (!running) return;
            burst(rand(w() * 0.15, w() * 0.85), rand(h() * 0.15, h() * 0.5));
            // Thỉnh thoảng bắn đôi cho rộn ràng.
            if (Math.random() < 0.5) burst(rand(w() * 0.2, w() * 0.8), rand(h() * 0.2, h() * 0.55));
          }, delay),
        );
        t += rand(450, 750);
      }
    };
    // Bắn ngay 2 đợt mở màn.
    burst(w() * 0.5, h() * 0.32);
    timers.push(setTimeout(() => running && burst(w() * 0.3, h() * 0.4), 250));
    timers.push(setTimeout(() => running && burst(w() * 0.7, h() * 0.4), 400));
    scheduleBursts();

    const tick = () => {
      ctx.clearRect(0, 0, w(), h());
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.vy += GRAVITY;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
