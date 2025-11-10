import { ref, onMounted } from 'vue'

// FORCE light mode by clearing any saved preference
if (typeof window !== 'undefined') {
  localStorage.removeItem('darkMode')
  localStorage.removeItem('qshe-theme')
  document.documentElement.classList.remove('dark')
}

// Initialize dark mode state - now forced to false
const isDark = ref(false)

export function useDarkMode() {
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    updateDarkMode()
  }

  const setDarkMode = (value: boolean) => {
    isDark.value = value
    updateDarkMode()
  }

  const updateDarkMode = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  const initDarkMode = () => {
    // Re-apply the current state
    updateDarkMode()
  }

  onMounted(() => {
    initDarkMode()
  })

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  }
}
