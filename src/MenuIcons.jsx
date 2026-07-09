// Bộ icon "sticker 3D" nhiều màu cho menu chính.
// Mỗi icon tự chứa gradient (id riêng để không đụng nhau), dùng như <CameraSticker className="h-8 w-8" />

export function CameraSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cam-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="cam-lens" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ede9fe" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <path d="M16 12l2.5-4h11L32 12z" fill="#8b5cf6" />
      <rect x="6" y="12" width="36" height="28" rx="8" fill="url(#cam-body)" />
      <rect x="6" y="12" width="36" height="10" rx="8" fill="#ffffff" opacity="0.18" />
      <circle cx="24" cy="27" r="9" fill="url(#cam-lens)" />
      <circle cx="24" cy="27" r="5.5" fill="#7c3aed" />
      <path d="M24 25.4c-.9-1.7-3.4-1.2-3.4.8 0 1.4 2 2.7 3.4 3.6 1.4-.9 3.4-2.2 3.4-3.6 0-2-2.5-2.5-3.4-.8z" fill="#fff" />
      <circle cx="36" cy="17.5" r="1.7" fill="#ddd6fe" />
    </svg>
  );
}

export function BookSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="book-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="book-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M24 12c-3.5-2.6-9-2.8-13.5-1.4C9 11 8 12.2 8 13.6v20c0 1.5 1.4 2.5 2.8 2.1C15 34.6 20.5 35 24 37.5z" fill="url(#book-l)" />
      <path d="M24 12c3.5-2.6 9-2.8 13.5-1.4C39 11 40 12.2 40 13.6v20c0 1.5-1.4 2.5-2.8 2.1C33 34.6 27.5 35 24 37.5z" fill="url(#book-r)" />
      <path d="M24 12v25.5" stroke="#047857" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 17.5c2.8-.7 5.6-.7 8 0M13 22.5c2.8-.7 5.6-.7 8 0M27 17.5c2.4-.7 5.2-.7 8 0M27 22.5c2.4-.7 5.2-.7 8 0" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function BrushSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brush-h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbcfe8" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="brush-t" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <rect x="27.5" y="7" width="7" height="20" rx="3.5" transform="rotate(37 31 17)" fill="url(#brush-h)" />
      <rect x="24.5" y="18" width="8" height="7" rx="2" transform="rotate(37 28.5 21.5)" fill="#f9a8d4" />
      <path d="M18 24c-4 3-6 8-6.5 13.5-.2 1.6 1.4 2.8 2.9 2.2 5-2 9.6-5 11.8-9z" fill="url(#brush-t)" />
      <path d="M13 40c1.5-3.5 3.3-5.6 6.5-7.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function PencilSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pen-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <g transform="rotate(45 24 24)">
        <rect x="20" y="8" width="8" height="24" rx="2" fill="url(#pen-b)" />
        <rect x="20" y="8" width="3" height="24" fill="#fff" opacity="0.3" />
        <path d="M20 32h8l-4 8z" fill="#fde68a" />
        <path d="M22.5 36.7h3L24 40z" fill="#4b5563" />
        <rect x="20" y="5.5" width="8" height="4" rx="1.5" fill="#fb7185" />
      </g>
    </svg>
  );
}

export function GamepadSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pad-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <path d="M14 16h20c5 0 9 4 9 9 0 4-1.5 9-6 9-3 0-4-2.5-6.5-2.5h-13C15 31.5 14 34 11 34 6.5 34 5 29 5 25c0-5 4-9 9-9z" fill="url(#pad-b)" />
      <path d="M14 16h20c5 0 9 4 9 9H5c0-5 4-9 9-9z" fill="#fff" opacity="0.15" />
      <rect x="11" y="23.5" width="8" height="3" rx="1.5" fill="#fff" />
      <rect x="13.5" y="21" width="3" height="8" rx="1.5" fill="#fff" />
      <circle cx="31" cy="22.5" r="2.1" fill="#fff" />
      <circle cx="35.5" cy="27" r="2.1" fill="#fff" />
    </svg>
  );
}

export function GemSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gem-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M14 9h20l8 10-18 21L6 19z" fill="url(#gem-a)" />
      <path d="M6 19h36l-18 21z" fill="#f59e0b" opacity="0.55" />
      <path d="M14 9l4 10h12l4-10z" fill="#fef3c7" opacity="0.75" />
      <path d="M18 19l6 21 6-21z" fill="#fbbf24" opacity="0.6" />
      <path d="M14 9L6 19h12z" fill="#fff" opacity="0.35" />
    </svg>
  );
}
