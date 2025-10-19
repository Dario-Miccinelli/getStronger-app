import { createApp } from 'vue'
import './style.css'
import './styles/app.scss'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { registerSW } from 'virtual:pwa-register'
import faviconUrl from './assets/images/favicon.ico'
import { setupDynamicIcons } from './lib/icons'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

// Mount only after the router finishes initial navigation
// This ensures global guards (e.g., redirect to /select) run before first paint
router.isReady().then(() => {
  app.mount('#app')
})

// Register Service Worker for PWA (autoUpdate enabled in Vite config)
try { registerSW({ immediate: true }) } catch {}

// Set favicon and dynamic icons/manifest based on selected player
try {
  const link = document.querySelector('link[rel="icon"]') || (() => { const l=document.createElement('link'); l.rel='icon'; document.head.appendChild(l); return l })()
  link.type = 'image/x-icon'
  link.href = faviconUrl
} catch {}
try { setupDynamicIcons() } catch {}

