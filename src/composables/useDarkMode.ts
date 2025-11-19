import { ref, watch } from 'vue'

// Initialize dark mode state from localStorage or system preference
const savedMode = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null
const isDark = ref(savedMode === 'true')

// Update DOM and localStorage whenever isDark changes
const updateDarkMode = () => {
  if (typeof window === 'undefined') return
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

// Watch for changes and update DOM
watch(isDark, () => {
  updateDarkMode()
}, { immediate: true })

export function useDarkMode() {
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
  }

  const setDarkMode = (value: boolean) => {
    isDark.value = value
  }

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  }
}
