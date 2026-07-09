// Hiệu ứng dùng chung cho các game canvas: particle (mảnh vỡ/tia lửa),
// số điểm bay lên (floater), và rung màn hình (screen shake).
// Đều là hàm thuần thao tác trên mảng do game giữ trong ref -> không phụ thuộc React.

const rand = (min, max) => min + Math.random() * (max - min);

// ---- PARTICLE ----
// Bắn 1 chùm mảnh vỡ tại (x,y). colors: 1 màu hoặc mảng màu.
export const spawnBurst = (list, x, y, colors, count = 12, opts = {}) => {
  const arr = Array.isArray(colors) ? colors : [colors];
  const spread = opts.spread ?? 4.2;
  const gravity = opts.gravity ?? 0.12;
  const size = opts.size ?? [2, 4.5];
  for (let i = 0; i < count; i += 1) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(spread * 0.35, spread);
    list.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - rand(0, 1.2),
      life: 1,
      decay: rand(0.02, 0.045),
      g: gravity,
      size: rand(size[0], size[1]),
      color: arr[(Math.random() * arr.length) | 0],
    });
  }
};

export const stepParticles = (list) => {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const p = list[i];
    p.vy += p.g;
    p.vx *= 0.98;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) list.splice(i, 1);
  }
};

export const drawParticles = (ctx, list) => {
  for (const p of list) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// ---- FLOATER (số điểm / chữ bay lên) ----
export const spawnFloater = (list, x, y, text, color = '#fde047', opts = {}) => {
  list.push({
    x, y, text, color,
    life: 1,
    decay: opts.decay ?? 0.02,
    vy: opts.vy ?? -0.9,
    size: opts.size ?? 16,
    bold: opts.bold ?? true,
  });
};

export const stepFloaters = (list) => {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const f = list[i];
    f.y += f.vy;
    f.vy *= 0.98;
    f.life -= f.decay;
    if (f.life <= 0) list.splice(i, 1);
  }
};

export const drawFloaters = (ctx, list) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of list) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.3));
    ctx.font = `${f.bold ? '900' : '700'} ${f.size}px system-ui, sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
};

// ---- SCREEN SHAKE ----
// Dùng: const shake = makeShake(); addShake(shake, 8) khi va chạm;
// trước khi vẽ: const [ox,oy] = applyShake(shake); ctx.translate(ox,oy) (nhớ save/restore).
export const makeShake = () => ({ mag: 0 });
export const addShake = (s, mag) => { s.mag = Math.max(s.mag, mag); };
export const applyShake = (s) => {
  if (s.mag <= 0.1) { s.mag = 0; return [0, 0]; }
  const ox = rand(-s.mag, s.mag);
  const oy = rand(-s.mag, s.mag);
  s.mag *= 0.86;
  return [ox, oy];
};
