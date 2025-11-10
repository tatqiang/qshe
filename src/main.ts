import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)

app.use(pinia)
app.use(router)

// Initialize auth before mounting
const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})
