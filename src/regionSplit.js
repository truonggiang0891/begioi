// Tách các vùng tô (.colorable) bị gộp trong tranh Brainrot / Tổng hợp.
//
// Các tranh này được vector hoá tự động nên nhiều mảng rời (tóc, da, quần áo, nền…)
// bị gộp chung trong MỘT <path class="colorable"> -> bấm 1 chỗ tô luôn nhiều chỗ.
// Hàm này tách mỗi path gộp thành nhiều path theo từng khối lớn tách biệt, đồng thời
// gộp các mảnh vụn nhỏ (< ngưỡng) vào khối lớn gần nhất để bé không phải tô từng mảnh li ti.
//
// Chạy ở thời điểm nạp SVG (DOM), KHÔNG sửa dữ liệu gốc -> có thể bật/tắt dễ dàng.

const DEFAULT_MIN_AREA_FRAC = 0.004; // khối nhỏ hơn 0.4% khung tranh sẽ gộp vào khối lớn gần nhất
// (đủ nhỏ để mũi/mắt kính/tai tách riêng, đủ lớn để không xé vụn mảng gạch sọc áo)

const splitSubpaths = (d) => d.split(/(?=[Mm])/).map(s => s.trim()).filter(Boolean);

const bboxOf = (segment) => {
    const nums = segment.match(/-?\d*\.?\d+/g);
    if (!nums) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = Number(nums[i]);
        const y = Number(nums[i + 1]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) return null;
    const w = Math.max(0, maxX - minX);
    const h = Math.max(0, maxY - minY);
    return { minX, minY, maxX, maxY, area: w * h, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

const contains = (outer, inner) => (
    inner.minX >= outer.minX - 0.5 && inner.maxX <= outer.maxX + 0.5 &&
    inner.minY >= outer.minY - 0.5 && inner.maxY <= outer.maxY + 0.5
);

// Trả về mảng chuỗi 'd', mỗi phần tử là một vùng tô độc lập.
const groupRegions = (d, viewBoxArea, minAreaFrac) => {
    const subs = splitSubpaths(d)
        .map(segment => ({ d: segment, box: bboxOf(segment) }))
        .filter(item => item.box && item.box.area > 0);

    if (subs.length <= 1) return [d];

    // Xác định subpath "ngoài" (không nằm gọn trong subpath lớn hơn) — subpath nằm trong là lỗ.
    subs.forEach((sub, i) => {
        sub.outer = true;
        for (let j = 0; j < subs.length; j += 1) {
            if (i !== j && subs[j].box.area > sub.box.area * 1.05 && contains(subs[j].box, sub.box)) {
                sub.outer = false;
                sub.parent = j;
                break;
            }
        }
    });

    // Mỗi subpath ngoài -> một nhóm; lỗ gắn vào nhóm ngoài bao quanh nó.
    const groups = new Map();
    subs.forEach((sub, i) => {
        if (sub.outer) {
            groups.set(i, { ds: [sub.d], area: sub.box.area, cx: sub.box.cx, cy: sub.box.cy });
        }
    });
    subs.forEach((sub) => {
        if (sub.outer) return;
        let parent = sub.parent;
        let guard = 0;
        while (parent != null && !subs[parent].outer && guard < 50) {
            parent = subs[parent].parent;
            guard += 1;
        }
        if (parent != null && groups.has(parent)) {
            groups.get(parent).ds.push(sub.d);
        } else if (groups.size > 0) {
            groups.values().next().value.ds.push(sub.d);
        }
    });

    const regions = [...groups.values()];
    const minArea = viewBoxArea * minAreaFrac;
    const bigRegions = regions.filter(region => region.area >= minArea);
    const smallRegions = regions.filter(region => region.area < minArea);

    // Nếu tất cả đều nhỏ -> giữ nguyên 1 vùng (không xé vụn).
    if (bigRegions.length === 0) return [d];

    // Gộp mỗi mảnh nhỏ vào khối lớn gần nhất (theo tâm).
    smallRegions.forEach((small) => {
        let best = null;
        let bestDist = Infinity;
        bigRegions.forEach((big) => {
            const dx = big.cx - small.cx;
            const dy = big.cy - small.cy;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
                bestDist = dist;
                best = big;
            }
        });
        if (best) best.ds.push(...small.ds);
    });

    return bigRegions.map(region => region.ds.join(' '));
};

const getViewBoxArea = (svgElement) => {
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) return null;
    const values = viewBox.split(/[\s,]+/).map(Number);
    if (values.length < 4 || values.some(v => !Number.isFinite(v))) return null;
    return Math.abs(values[2] * values[3]);
};

// Tách các path .colorable gộp ngay trên DOM SVG. Bỏ qua ô nền (path đơn đầu tiên).
export const splitColorableRegions = (svgElement, options = {}) => {
    if (!svgElement) return;
    const minAreaFrac = options.minAreaFrac ?? DEFAULT_MIN_AREA_FRAC;
    const viewBoxArea = getViewBoxArea(svgElement);
    if (!viewBoxArea) return;

    const paths = Array.from(svgElement.querySelectorAll('path.colorable'));
    let backgroundSeen = false;

    paths.forEach((path) => {
        const d = path.getAttribute('d');
        if (!d) return;

        // Giữ nguyên ô nền: path đơn đầu tiên (thường là hình chữ nhật nền).
        if (!backgroundSeen && splitSubpaths(d).length === 1) {
            backgroundSeen = true;
            return;
        }

        const groups = groupRegions(d, viewBoxArea, minAreaFrac);
        if (groups.length <= 1) return;

        const fragment = svgElement.ownerDocument.createDocumentFragment();
        groups.forEach((groupD) => {
            const clone = path.cloneNode(false);
            clone.setAttribute('d', groupD);
            fragment.appendChild(clone);
        });
        path.replaceWith(fragment);
    });
};
