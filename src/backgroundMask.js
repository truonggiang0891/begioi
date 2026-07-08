// Giới hạn ô nền (path .colorable đầu tiên) chỉ tô ở vùng NGOÀI nhân vật.
//
// Tranh Brainrot/Tổng hợp có 1 hình chữ nhật nền phủ kín canvas, nằm dưới mọi thứ.
// Vì vậy tô nền lem qua các khe hở bên trong (kẽ sọc áo, khoảng trống...) -> "tô nền thì áo đổi".
// Cách xử lý: rasterize riêng lớp nét vẽ (outline), flood-fill từ mép canvas để tìm vùng nền thật
// (ngoài bóng nhân vật), rồi VẼ LẠI path nền = đúng vùng đó (không dùng mask -> chạy được mọi trình duyệt).
// Khe hở bên trong sẽ để trắng (nền trắng của khung SVG). Chạy 1 lần/nhân vật, không sửa dữ liệu gốc.

const RASTER_WIDTH = 340;

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

// Nở dày nét vẽ thêm R pixel để bịt các khe hở nhỏ (kẽ sọc áo) -> flood-fill không lọt vào trong.
const dilateBarrier = (data, width, height, radius) => {
    const dark = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i += 1) {
        const o = i * 4;
        if ((0.3 * data[o] + 0.59 * data[o + 1] + 0.11 * data[o + 2]) < 128) dark[i] = 1;
    }
    if (radius <= 0) return dark;
    // max-filter ngang rồi dọc (Chebyshev radius)
    const tmp = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let v = 0;
            for (let dx = -radius; dx <= radius; dx += 1) {
                const nx = x + dx;
                if (nx >= 0 && nx < width && dark[y * width + nx]) { v = 1; break; }
            }
            tmp[y * width + x] = v;
        }
    }
    const out = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let v = 0;
            for (let dy = -radius; dy <= radius; dy += 1) {
                const ny = y + dy;
                if (ny >= 0 && ny < height && tmp[ny * width + x]) { v = 1; break; }
            }
            out[y * width + x] = v;
        }
    }
    return out;
};

// flood-fill từ 4 mép, đi qua pixel không phải nét vẽ (đã nở dày), trả về mask vùng ngoài.
const computeOuterMask = (data, width, height, radius) => {
    const barrier = dilateBarrier(data, width, height, radius);
    const outer = new Uint8Array(width * height);
    const stack = [];
    const visit = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = y * width + x;
        if (outer[i] || barrier[i]) return;
        outer[i] = 1;
        stack.push(i);
    };
    for (let x = 0; x < width; x += 1) { visit(x, 0); visit(x, height - 1); }
    for (let y = 0; y < height; y += 1) { visit(0, y); visit(width - 1, y); }
    while (stack.length) {
        const i = stack.pop();
        const x = i % width;
        const y = (i / width) | 0;
        visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1);
    }
    return outer;
};

// Truy vết biên vùng outer thành các vòng kín -> chuỗi 'd' cho path.
// Quy ước cạnh có hướng (ô outer nằm bên trái) để nối thành vòng.
const traceOuterPath = (outer, width, height, scaleX, scaleY) => {
    const isOuter = (x, y) => x >= 0 && y >= 0 && x < width && y < height && outer[y * width + x] === 1;
    const key = (x, y) => x * (height + 1) + y;
    const edges = new Map(); // startVertexKey -> [ [sx,sy,ex,ey], ... ]
    const addEdge = (sx, sy, ex, ey) => {
        const k = key(sx, sy);
        let list = edges.get(k);
        if (!list) { list = []; edges.set(k, list); }
        list.push([sx, sy, ex, ey]);
    };

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (outer[y * width + x] !== 1) continue;
            if (!isOuter(x, y - 1)) addEdge(x + 1, y, x, y);       // cạnh trên: phải -> trái
            if (!isOuter(x - 1, y)) addEdge(x, y, x, y + 1);       // cạnh trái: trên -> dưới
            if (!isOuter(x, y + 1)) addEdge(x, y + 1, x + 1, y + 1); // cạnh dưới: trái -> phải
            if (!isOuter(x + 1, y)) addEdge(x + 1, y + 1, x + 1, y); // cạnh phải: dưới -> trên
        }
    }

    const loops = [];
    for (const [, list] of edges) {
        while (list.length) {
            // bắt đầu một vòng mới từ cạnh chưa dùng
            let [sx, sy, ex, ey] = list.pop();
            const startX = sx, startY = sy;
            const pts = [[sx, sy]];
            let guard = 0;
            while (!(ex === startX && ey === startY) && guard < width * height * 4) {
                pts.push([ex, ey]);
                const nList = edges.get(key(ex, ey));
                if (!nList || nList.length === 0) break;
                const next = nList.pop();
                sx = next[0]; sy = next[1]; ex = next[2]; ey = next[3];
                guard += 1;
            }
            if (pts.length >= 3) loops.push(pts);
        }
    }
    if (!loops.length) return '';

    // Rút gọn điểm thẳng hàng để path nhẹ hơn.
    const simplify = (pts) => {
        const out = [];
        for (let i = 0; i < pts.length; i += 1) {
            const a = pts[(i - 1 + pts.length) % pts.length];
            const b = pts[i];
            const c = pts[(i + 1) % pts.length];
            const collinear = (b[0] - a[0]) * (c[1] - a[1]) === (b[1] - a[1]) * (c[0] - a[0]);
            if (!collinear) out.push(b);
        }
        return out.length >= 3 ? out : pts;
    };

    const fmt = (v) => (Math.round(v * 100) / 100);
    return loops.map((raw) => {
        const pts = simplify(raw);
        let d = `M ${fmt(pts[0][0] * scaleX)} ${fmt(pts[0][1] * scaleY)}`;
        for (let i = 1; i < pts.length; i += 1) d += ` L ${fmt(pts[i][0] * scaleX)} ${fmt(pts[i][1] * scaleY)}`;
        return d + ' Z';
    }).join(' ');
};

export const applyOuterBackgroundMask = async (svgElement, cacheKey) => {
    if (!svgElement || svgElement.dataset.bgMasked === '1' || typeof document === 'undefined') return;
    const backgroundPath = svgElement.querySelector('path.colorable');
    if (!backgroundPath) return;

    const viewBox = (svgElement.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    if (viewBox.length < 4 || viewBox.some(v => !Number.isFinite(v))) return;
    const [, , viewWidth, viewHeight] = viewBox;
    const width = RASTER_WIDTH;
    const height = Math.max(1, Math.round(width * viewHeight / viewWidth));

    svgElement.dataset.bgMasked = '1';

    try {
        // SVG chỉ có lớp nét vẽ (bỏ mọi .colorable) để tìm bóng nhân vật.
        const outlineSvg = svgElement.cloneNode(true);
        outlineSvg.querySelectorAll('.colorable').forEach(el => el.remove());
        outlineSvg.setAttribute('width', String(width));
        outlineSvg.setAttribute('height', String(height));
        const serialized = new XMLSerializer().serializeToString(outlineSvg);
        const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(serialized)))}`;
        const img = await loadImage(url);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);

        const outer = computeOuterMask(data, width, height, 3);
        let outerCount = 0;
        for (let i = 0; i < outer.length; i += 1) outerCount += outer[i];
        // vùng ngoài quá nhỏ (nét hở làm rò) hoặc quá lớn (không có nhân vật) -> bỏ, giữ nguyên.
        if (outerCount < outer.length * 0.03 || outerCount > outer.length * 0.985) return;

        const d = traceOuterPath(outer, width, height, viewWidth / width, viewHeight / height);
        if (!d) return;

        backgroundPath.setAttribute('d', d);
        backgroundPath.setAttribute('fill-rule', 'nonzero');
    } catch {
        svgElement.dataset.bgMasked = 'failed';
    }
};
