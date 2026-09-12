import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Đăng ký service worker (PWA offline). Gọi 1 lần ở module scope (không bị StrictMode gọi 2 lần).
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    if (!r) return
    // iOS/PWA đã cài rất ít khi tự kiểm tra bản mới -> chủ động hỏi máy chủ:
    //  - mỗi khi bé mở lại app (từ nền hoặc chuyển tab)
    //  - và định kỳ trong lúc đang mở
    // Có bản mới thì service worker mới sẽ tự chiếm quyền và tải lại trang (registerType: autoUpdate).
    const check = () => { r.update().catch(() => {}) }
    check()
    setInterval(check, 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    window.addEventListener('focus', check)
  },
  onOfflineReady() {
    // App đã cache xong -> dùng offline được. Báo cho App hiện toast.
    window.__pwaOfflineReady = true
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'))
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
