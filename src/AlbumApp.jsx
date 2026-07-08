import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Folder, Camera } from 'lucide-react';
import { ALBUM_CONFIG, isAlbumConfigured } from './albumConfig';

// --- ALBUM CỦA BÉ ---
// Xem lại ảnh/video kỷ niệm, đọc trực tiếp từ Google Drive (xem albumConfig.js).
// Mỗi folder con của folder mẹ = 1 album. Không cần backend.

const API = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

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

const isVideo = (m) => typeof m === 'string' && m.startsWith('video/');
const thumbUrl = (id, w = 600) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const fullImgUrl = (id) => `https://lh3.googleusercontent.com/d/${id}=w1600`;
const videoEmbedUrl = (id) => `https://drive.google.com/file/d/${id}/preview`;

// Ảnh Drive thỉnh thoảng hỏng link — thử lại bằng endpoint thumbnail.
const handleImgError = (e, id, w) => {
  const el = e.currentTarget;
  if (el.dataset.fallback) return;
  el.dataset.fallback = '1';
  el.src = thumbUrl(id, w);
};

// Bộ nhớ đệm trong phiên: giữ dữ liệu đã tải để mở lại album là hiện ngay,
// không phải chờ tải lại. Cache tự xóa khi tải lại trang (F5) -> ảnh mới thêm
// vào Drive sẽ xuất hiện lại sau khi reload.
let albumsCache = null;         // danh sách album + ảnh bìa đã tải
const mediaCache = new Map();   // albumId -> mảng ảnh/video đã tải

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

  const [current, setCurrent] = useState(null); // album đang mở {id, name}
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [lightbox, setLightbox] = useState(null); // index trong media

  // Tải danh sách album (folder con) + ảnh bìa. Nếu đã có trong bộ nhớ đệm thì bỏ qua.
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
        const withCovers = await Promise.all(
          folders.map(async (f) => {
            try {
              const first = await driveList(
                `'${f.id}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
                { orderBy: 'createdTime desc', pageSize: '1' }
              );
              return { id: f.id, name: f.name, cover: first[0]?.id || null, count: first.length };
            } catch {
              return { id: f.id, name: f.name, cover: null, count: 0 };
            }
          })
        );
        if (alive) { setAlbums(withCovers); albumsCache = withCovers; }
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
    // Đã tải album này trong phiên -> hiện ngay từ bộ nhớ đệm.
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
      const files = await driveList(
        `'${album.id}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
        { orderBy: 'createdTime' }
      );
      setMedia(files);
      mediaCache.set(album.id, files);
    } catch (err) {
      setMediaError(err.message || 'Không tải được nội dung album');
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const closeAlbum = () => { setCurrent(null); setMedia([]); setLightbox(null); };

  // Điều hướng trong lightbox bằng bàn phím.
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft') setLightbox((i) => (i > 0 ? i - 1 : i));
      else if (e.key === 'ArrowRight') setLightbox((i) => (i < media.length - 1 ? i + 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, media.length]);

  if (!isAlbumConfigured()) return <NeedConfig onBack={onBack} />;

  // ----- LIGHTBOX -----
  const renderLightbox = () => {
    if (lightbox === null || !media[lightbox]) return null;
    const item = media[lightbox];
    const video = isVideo(item.mimeType);
    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
          <span className="truncate text-sm font-bold opacity-80">{item.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold opacity-70">{lightbox + 1}/{media.length}</span>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Đóng"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
          {lightbox > 0 && (
            <button
              type="button"
              onClick={() => setLightbox((i) => i - 1)}
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
            <img
              key={item.id}
              src={fullImgUrl(item.id)}
              onError={(e) => handleImgError(e, item.id, 1600)}
              alt={item.name}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          )}

          {lightbox < media.length - 1 && (
            <button
              type="button"
              onClick={() => setLightbox((i) => i + 1)}
              className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
              aria-label="Sau"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
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
            className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow transition hover:bg-slate-50"
          >
            <ChevronLeft size={18} /> Khoảnh khắc
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-xl font-black text-slate-700 md:text-2xl">
            {current.name}
          </h1>
          <div className="w-[92px]" />
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
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                {video && (
                  <span className="absolute inset-0 grid place-items-center">
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
        {albums.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openAlbum(a)}
            className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] transition active:translate-y-1"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-violet-100 to-sky-200">
              {a.cover ? (
                <img
                  src={thumbUrl(a.cover, 600)}
                  onError={(e) => handleImgError(e, a.cover, 600)}
                  alt={a.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
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
            <span className="truncate px-3 py-2 text-center text-sm font-black text-slate-700">
              {a.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
