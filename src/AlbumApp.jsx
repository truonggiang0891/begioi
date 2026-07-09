import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Download, Folder, Camera, Star } from 'lucide-react';
import { ALBUM_CONFIG, isAlbumConfigured } from './albumConfig';

// --- ALBUM CỦA BÉ ("Khoảnh khắc") ---
// Xem lại ảnh/video kỷ niệm, đọc trực tiếp từ Google Drive (xem albumConfig.js).
// Mỗi folder con của folder mẹ = 1 album. Không cần backend.

const API = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const IMAGE_SLIDESHOW_MS = 2000; // ảnh: mỗi 2s (video thì chờ phát hết)

// Gọi Drive API list. Chỉ cần API key vì folder đã chia sẻ công khai.
const driveList = async (query, extra = {}) => {
  const params = new URLSearchParams({
    q: query,
    key: ALBUM_CONFIG.apiKey,
    fields: 'files(id,name,mimeType,createdTime)',
    pageSize: '1000',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    ...extra,
  });
  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) {
    let msg = `Lỗi ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = body.error.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
};

const MEDIA_QUERY = (folderId) =>
  `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`;

const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const thumbUrl = (id, w = 600) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const fullImgUrl = (id) => `https://lh3.googleusercontent.com/d/${id}=w1600`;
const videoEmbedUrl = (id) => `https://drive.google.com/file/d/${id}/preview`;
const downloadUrl = (id) => `https://drive.google.com/uc?export=download&id=${id}`;

// Ẩn tiền tố số dùng để sắp thứ tự (VD "1. Siro" -> "Siro"), vẫn giữ trên Drive.
const cleanName = (n) => (n || '').replace(/^\s*\d+\s*[.)\-–]\s*/, '') || n;

const fadeIn = (e) => e.currentTarget.classList.remove('opacity-0');
const handleImgError = (e, id, w) => {
  const el = e.currentTarget;
  el.classList.remove('opacity-0');
  if (el.dataset.fallback) return;
  el.dataset.fallback = '1';
  el.src = thumbUrl(id, w);
};

// Bộ nhớ đệm trong phiên: mở lại album là hiện ngay, không phải chờ tải lại.
// Cache tự xóa khi tải lại trang (F5) -> ảnh mới thêm vào Drive hiện lại sau reload.
let albumsCache = null;         // danh sách album + ảnh bìa + số lượng
const mediaCache = new Map();   // albumId -> mảng ảnh/video (cũ -> mới)

// Ảnh bìa do người dùng tự chọn (lưu trên máy này). { albumId: fileId }
const COVERS_KEY = 'album_covers';
const loadCovers = () => {
  try {
    const o = JSON.parse(localStorage.getItem(COVERS_KEY) || '{}');
    return o && typeof o === 'object' ? o : {};
  } catch { return {}; }
};

// ----- Ảnh xem to: vuốt qua lại, chụm để phóng to, nhấp đúp để zoom -----
function ZoomableImage({ src, alt, onError, onPrev, onNext }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const g = useRef({});

  useEffect(() => { setScale(1); setTx(0); setTy(0); }, [src]);

  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    const t = e.touches;
    if (t.length === 2) {
      g.current.mode = 'pinch';
      g.current.startDist = dist(t) || 1;
      g.current.startScale = scale;
      setDragging(true);
      return;
    }
    const now = Date.now();
    if (g.current.lastTap && now - g.current.lastTap < 300) {
      g.current.lastTap = 0;
      g.current.mode = null;
      if (scale > 1) { setScale(1); setTx(0); setTy(0); } else { setScale(2.4); }
      return;
    }
    g.current.lastTap = now;
    g.current.mode = scale > 1 ? 'pan' : 'swipe';
    g.current.startX = t[0].clientX;
    g.current.startY = t[0].clientY;
    g.current.startTx = tx;
    g.current.startTy = ty;
  };

  const onTouchMove = (e) => {
    const t = e.touches;
    if (g.current.mode === 'pinch' && t.length === 2) {
      setScale(Math.min(4, Math.max(1, g.current.startScale * (dist(t) / g.current.startDist))));
    } else if (g.current.mode === 'pan' && t.length === 1) {
      setTx(g.current.startTx + (t[0].clientX - g.current.startX));
      setTy(g.current.startTy + (t[0].clientY - g.current.startY));
    }
  };

  const onTouchEnd = (e) => {
    if (g.current.mode === 'swipe') {
      const dx = e.changedTouches[0].clientX - g.current.startX;
      const dy = e.changedTouches[0].clientY - g.current.startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onNext?.(); else onPrev?.();
      }
    } else if (g.current.mode === 'pinch' && scale < 1.05) {
      setScale(1); setTx(0); setTy(0);
    }
    g.current.mode = null;
    setDragging(false);
  };

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      onError={onError}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      draggable={false}
      className="max-h-full max-w-full select-none rounded-xl object-contain"
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        transition: dragging ? 'none' : 'transform 0.22s ease',
        touchAction: 'none',
      }}
    />
  );
}

function NeedConfig({ onBack }) {
  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-violet-50 to-sky-100 px-5 py-6">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
        >
          <ChevronLeft size={18} /> Trở về
        </button>
        <h1 className="text-2xl font-black text-slate-700">📸 Khoảnh khắc</h1>
        <div className="w-[86px]" />
      </div>
      <div className="mt-6 w-full max-w-md rounded-3xl bg-white p-6 text-slate-700 shadow-lg">
        <p className="text-lg font-black text-violet-700">Chưa cấu hình Album 🛠️</p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
          Để hiện ảnh/video của bé, cần điền <b>API key</b> và <b>ID folder Drive</b> vào
          file <code className="rounded bg-slate-100 px-1">src/albumConfig.js</code>.
          Hướng dẫn từng bước đã có sẵn trong chính file đó.
        </p>
      </div>
    </div>
  );
}

export default function AlbumApp({ onBack }) {
  const [albums, setAlbums] = useState(() => albumsCache || []);
  const [albumsLoading, setAlbumsLoading] = useState(() => !albumsCache);
  const [albumsError, setAlbumsError] = useState('');

  const [current, setCurrent] = useState(null); // album đang mở
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [lightbox, setLightbox] = useState(null); // index trong media
  const [playing, setPlaying] = useState(false);  // đang trình chiếu
  const [covers, setCovers] = useState(loadCovers); // ảnh bìa tự chọn
  const [toast, setToast] = useState('');

  // Tải danh sách album + ảnh bìa + số lượng, đồng thời cache media để mở album là hiện ngay.
  useEffect(() => {
    if (albumsCache) return undefined;
    let alive = true;
    (async () => {
      setAlbumsLoading(true);
      setAlbumsError('');
      try {
        const folders = await driveList(
          `'${ALBUM_CONFIG.rootFolderId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
          { orderBy: 'name' }
        );
        const built = await Promise.all(
          folders.map(async (f) => {
            try {
              const files = await driveList(MEDIA_QUERY(f.id), { orderBy: 'createdTime desc' });
              mediaCache.set(f.id, [...files].reverse()); // cũ -> mới cho lúc mở album
              const videoCount = files.filter((x) => isVideo(x.mimeType)).length;
              return {
                id: f.id,
                name: f.name,
                cover: files[0]?.id || null,
                imageCount: files.length - videoCount,
                videoCount,
              };
            } catch {
              return { id: f.id, name: f.name, cover: null, imageCount: 0, videoCount: 0 };
            }
          })
        );
        if (alive) { setAlbums(built); albumsCache = built; }
      } catch (err) {
        if (alive) setAlbumsError(err.message || 'Không tải được album');
      } finally {
        if (alive) setAlbumsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const openAlbum = useCallback(async (album) => {
    setCurrent(album);
    setLightbox(null);
    setPlaying(false);
    if (mediaCache.has(album.id)) {
      setMedia(mediaCache.get(album.id));
      setMediaError('');
      setMediaLoading(false);
      return;
    }
    setMedia([]);
    setMediaError('');
    setMediaLoading(true);
    try {
      const files = await driveList(MEDIA_QUERY(album.id), { orderBy: 'createdTime' });
      setMedia(files);
      mediaCache.set(album.id, files);
    } catch (err) {
      setMediaError(err.message || 'Không tải được nội dung album');
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const closeAlbum = () => { setCurrent(null); setMedia([]); setLightbox(null); setPlaying(false); };
  const closeLightbox = useCallback(() => { setLightbox(null); setPlaying(false); }, []);
  const goPrev = useCallback(() => setLightbox((i) => (i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(() => setLightbox((i) => (i < media.length - 1 ? i + 1 : i)), [media.length]);
  // Chuyển tiếp trong trình chiếu (quay vòng) — dùng khi hết giờ ảnh hoặc video phát xong.
  const goNextLoop = useCallback(() => setLightbox((i) => (i === null ? i : (i + 1) % media.length)), [media.length]);

  // Bàn phím trong lightbox.
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, goPrev, goNext, closeLightbox]);

  // Trình chiếu tự động. Ảnh: chuyển sau 2.5s. Video: KHÔNG hẹn giờ — chờ video phát xong
  // (VideoSlide gọi goNextLoop khi hết), để "phát từng video một".
  useEffect(() => {
    if (!playing || lightbox === null || media.length < 2) return undefined;
    if (isVideo(media[lightbox]?.mimeType)) return undefined;
    const t = setTimeout(goNextLoop, IMAGE_SLIDESHOW_MS);
    return () => clearTimeout(t);
  }, [playing, lightbox, media, goNextLoop]);

  // Tải sẵn ảnh kế/trước để lướt cho nhanh.
  useEffect(() => {
    if (lightbox === null) return;
    [lightbox + 1, lightbox - 1].forEach((j) => {
      const it = media[j];
      if (it && !isVideo(it.mimeType)) { const im = new Image(); im.src = fullImgUrl(it.id); }
    });
  }, [lightbox, media]);

  // Lưu lựa chọn ảnh bìa lên máy.
  useEffect(() => {
    try { localStorage.setItem(COVERS_KEY, JSON.stringify(covers)); } catch { /* ignore */ }
  }, [covers]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const setAlbumCover = useCallback((albumId, fileId) => {
    setCovers((prev) => ({ ...prev, [albumId]: fileId }));
    setToast('Đã đặt ảnh này làm bìa 👍');
  }, []);

  if (!isAlbumConfigured()) return <NeedConfig onBack={onBack} />;

  // ----- LIGHTBOX -----
  const renderLightbox = () => {
    if (lightbox === null || !media[lightbox]) return null;
    const item = media[lightbox];
    const video = isVideo(item.mimeType);
    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-3 text-white">
          <span className="min-w-0 flex-1 truncate text-sm font-bold opacity-80">{item.name}</span>
          <span className="shrink-0 text-sm font-bold opacity-70">{lightbox + 1}/{media.length}</span>
          <div className="flex shrink-0 items-center gap-2">
            {video && (
              <button
                type="button"
                onClick={goNextLoop}
                className="flex h-10 items-center gap-1 rounded-full bg-violet-500 px-3 text-sm font-black text-white shadow transition hover:bg-violet-600"
                aria-label="Chiếu tiếp"
              >
                Tiếp <ChevronRight size={18} />
              </button>
            )}
            {current && (
              <button
                type="button"
                onClick={() => setAlbumCover(current.id, item.id)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
                aria-label="Đặt làm ảnh bìa"
                title="Đặt làm ảnh bìa"
              >
                <Star size={20} className={covers[current.id] === item.id ? 'fill-yellow-300 text-yellow-300' : ''} />
              </button>
            )}
            {media.length > 1 && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
                aria-label={playing ? 'Tạm dừng trình chiếu' : 'Trình chiếu'}
              >
                {playing ? <Pause size={20} className="fill-white" /> : <Play size={20} className="translate-x-0.5 fill-white" />}
              </button>
            )}
            <a
              href={downloadUrl(item.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Tải về máy"
            >
              <Download size={20} />
            </a>
            <button
              type="button"
              onClick={closeLightbox}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Đóng"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
          {!video && lightbox > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
              aria-label="Trước"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {video ? (
            <iframe
              key={item.id}
              title={item.name}
              src={videoEmbedUrl(item.id)}
              className="h-full w-full max-w-4xl rounded-xl"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <ZoomableImage
              src={fullImgUrl(item.id)}
              alt={item.name}
              onError={(e) => handleImgError(e, item.id, 1600)}
              onPrev={goPrev}
              onNext={goNext}
            />
          )}

          {!video && lightbox < media.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
              aria-label="Sau"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {toast && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm font-bold text-white shadow-lg">
            {toast}
          </div>
        )}

        {playing && video && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur">
            Xem xong bấm nút "Tiếp" ở trên để chiếu tiếp
          </div>
        )}
      </div>
    );
  };

  // ----- BÊN TRONG 1 ALBUM -----
  if (current) {
    return (
      <div className="fixed inset-0 z-[60] flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-violet-50 to-sky-100 px-4 py-5">
        <div className="mb-4 flex w-full max-w-3xl shrink-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={closeAlbum}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
          >
            <ChevronLeft size={18} /> Khoảnh khắc
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-black text-slate-700 md:text-2xl">
            {cleanName(current.name)}
          </h1>
          {media.length > 0 ? (
            <button
              type="button"
              onClick={() => { setLightbox(0); setPlaying(true); }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-violet-500 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-violet-600"
            >
              <Play size={16} className="fill-white" /> Chiếu
            </button>
          ) : (
            <div className="w-[92px]" />
          )}
        </div>

        {mediaLoading && <p className="mt-10 font-black text-slate-500">Đang tải ảnh… ⏳</p>}
        {mediaError && <p className="mt-10 max-w-md text-center font-bold text-rose-500">{mediaError}</p>}
        {!mediaLoading && !mediaError && media.length === 0 && (
          <p className="mt-10 font-black text-slate-500">Album này chưa có ảnh nào 📭</p>
        )}

        <div className="grid w-full max-w-3xl grid-cols-2 gap-2 pb-8 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item, i) => {
            const video = isVideo(item.mimeType);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightbox(i)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-200 shadow transition active:scale-95"
              >
                <img
                  src={thumbUrl(item.id, 600)}
                  onError={(e) => handleImgError(e, item.id, 600)}
                  onLoad={fadeIn}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105"
                />
                {video && (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white">
                      <Play size={22} className="translate-x-0.5 fill-white" />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {renderLightbox()}
      </div>
    );
  }

  // ----- DANH SÁCH ALBUM -----
  return (
    <div className="fixed inset-0 z-[60] flex h-full w-full flex-col items-center overflow-y-auto bg-gradient-to-b from-violet-50 to-sky-100 px-4 py-5">
      <div className="mb-4 flex w-full max-w-3xl shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
        >
          <ChevronLeft size={18} /> Trở về
        </button>
        <h1 className="text-2xl font-black text-slate-700 md:text-3xl">📸 Khoảnh khắc</h1>
        <div className="w-[86px]" />
      </div>

      {albumsLoading && <p className="mt-10 font-black text-slate-500">Đang tải album… ⏳</p>}
      {albumsError && (
        <div className="mt-10 max-w-md rounded-2xl bg-white p-5 text-center shadow">
          <p className="font-black text-rose-500">Không tải được album 😥</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{albumsError}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Kiểm tra lại API key, ID folder và quyền chia sẻ "ai có link đều xem".
          </p>
        </div>
      )}
      {!albumsLoading && !albumsError && albums.length === 0 && (
        <p className="mt-10 max-w-md text-center font-black text-slate-500">
          Chưa có album nào. Hãy tạo folder con trong folder mẹ trên Drive nhé 🗂️
        </p>
      )}

      <div className="grid w-full max-w-3xl grid-cols-3 gap-2 pb-8 sm:gap-3 md:grid-cols-4">
        {albums.map((a) => {
          const parts = [];
          if (a.imageCount) parts.push(`${a.imageCount} ảnh`);
          if (a.videoCount) parts.push(`${a.videoCount} video`);
          // Ưu tiên ảnh bìa người dùng chọn (nếu còn tồn tại trong album), nếu không thì ảnh mới nhất.
          const chosen = covers[a.id];
          const list = mediaCache.get(a.id);
          const coverId = chosen && (!list || list.some((x) => x.id === chosen)) ? chosen : a.cover;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => openAlbum(a)}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] transition active:translate-y-1"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-violet-100 to-sky-200">
                {coverId ? (
                  <img
                    key={coverId}
                    src={thumbUrl(coverId, 600)}
                    onError={(e) => handleImgError(e, coverId, 600)}
                    onLoad={fadeIn}
                    alt={cleanName(a.name)}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-violet-400">
                    <Folder size={44} />
                  </span>
                )}
                <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-violet-500 shadow">
                  <Camera size={16} />
                </span>
              </div>
              <span className="truncate px-3 pt-2 text-center text-sm font-black text-slate-700">
                {cleanName(a.name)}
              </span>
              <span className="truncate px-3 pb-2 text-center text-[11px] font-bold text-slate-400">
                {parts.join(' · ') || 'Trống'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
