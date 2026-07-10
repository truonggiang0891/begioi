import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',     // tự cập nhật khi có bản deploy mới (không kẹt bản cũ)
      injectRegister: false,          // tự đăng ký trong main.jsx (để bắt sự kiện offline-ready)
      manifest: false,                // dùng public/manifest.webmanifest có sẵn
      workbox: {
        // Precache app shell + code (gồm cả chunk Tô màu 2.8MB) + icon + puzzle.
        // KHÔNG precache 25MB ảnh Tập đọc và nhạc -> để runtime cache (cache dần khi dùng).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['**/reading/**', '**/music/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // cho phép chunk ColoringApp ~2.8MB
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html', // SPA: mở offline vẫn ra app
        runtimeCaching: [
          {
            // Ảnh bài Tập đọc: cache khi bé mở lần đầu -> sau đó offline được.
            urlPattern: ({ url }) => url.pathname.startsWith('/reading/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'reading-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Nhạc nền Album.
            urlPattern: ({ url }) => url.pathname.startsWith('/music/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'music',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
})
