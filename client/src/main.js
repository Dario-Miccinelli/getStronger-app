import { createApp } from 'vue'
import './style.css'
import './styles/app.scss'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Mount only after the router finishes initial navigation
// This ensures global guards (e.g., redirect to /select) run before first paint
router.isReady().then(() => {
  app.mount('#app')
})
