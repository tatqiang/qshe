import { defineStore } from 'pinia'
import { ref } from 'vue'
import { APP_CONFIG } from '@/constants'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light')

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY)
  if (savedTheme) {
    theme.value = savedTheme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    theme,
    toggleTheme,
    setTheme
  }
})
