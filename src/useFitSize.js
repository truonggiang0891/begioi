import { useState, useRef, useEffect } from 'react';

// Co giãn canvas (giữ tỉ lệ W:H) để lấp đầy tối đa vùng chứa (thẻ cha ref).
// Trả về { ref, size } — gắn ref vào thẻ bọc flex-1, đặt canvas style width/height = size.
export function useFitSize(W, H) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: W, h: H });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const aw = el.clientWidth;
      const ah = el.clientHeight;
      if (!aw || !ah) return;
      const s = Math.min(aw / W, ah / H);
      setSize({ w: Math.max(1, Math.round(W * s)), h: Math.max(1, Math.round(H * s)) });
    };
    fit();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(fit);
      ro.observe(el);
    }
    window.addEventListener('resize', fit);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [W, H]);

  return { ref, size };
}
