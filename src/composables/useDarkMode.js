import { ref, watch } from 'vue'

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = () => {
  const saved = localStorage.getItem('theme')
  console.log('Initial theme from localStorage:', saved)
  return saved || 'light'
}

const theme = ref(getInitialTheme())

// Apply theme immediately
const applyTheme = (newTheme) => {
  console.log('Applying theme:', newTheme)
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Apply initial theme
applyTheme(theme.value)

export function useDarkMode() {
  const setTheme = (newTheme) => {
    console.log('setTheme called with:', newTheme)
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    console.log('toggleTheme: switching from', theme.value, 'to', newTheme)
    setTheme(newTheme)
  }

  return {
    theme,
    setTheme,
    toggleTheme
  }
}
