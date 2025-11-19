import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')

// Register service worker for offline support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ PWA: Service Worker registered', registration)
        
        // Check for updates every 5 minutes
        setInterval(() => {
          registration.update()
        }, 5 * 60 * 1000)
      })
      .catch(err => {
        console.error('❌ PWA: Service Worker registration failed', err)
      })
  })
}
