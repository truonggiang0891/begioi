import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Đăng ký service worker (PWA offline). Gọi 1 lần ở module scope (không bị StrictMode gọi 2 lần).
registerSW({
  immediate: true,
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
