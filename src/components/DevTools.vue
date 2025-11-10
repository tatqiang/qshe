<script setup lang="ts">
import { computed } from 'vue'
import { useDevTools } from '../composables/useDevTools'

defineOptions({
  name: 'DevTools'
})

const { currentFilePath, currentLine, currentColumn } = useDevTools()

const isDev = import.meta.env.DEV

const displayPath = computed(() => {
  if (!currentFilePath.value) return ''
  // Show relative path from src/
  const srcIndex = currentFilePath.value.indexOf('src/')
  if (srcIndex !== -1) {
    return currentFilePath.value.substring(srcIndex)
  }
  return currentFilePath.value
})

const fullPath = computed(() => {
  if (!currentFilePath.value) return ''
  let path = displayPath.value
  if (currentLine.value) {
    path += `:${currentLine.value}`
    if (currentColumn.value) {
      path += `:${currentColumn.value}`
    }
  }
  return path
})

const openInEditor = () => {
  if (!currentFilePath.value) return
  
  // Construct the path for VS Code
  let vscodeUrl = `vscode://file/${currentFilePath.value}`
  if (currentLine.value) {
    vscodeUrl += `:${currentLine.value}`
    if (currentColumn.value) {
      vscodeUrl += `:${currentColumn.value}`
    }
  }
  
  window.location.href = vscodeUrl
}
</script>

<template>
  <div 
    v-if="isDev && fullPath" 
    class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
  >
    <button
      @click="openInEditor"
      class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg shadow-lg transition-all hover:shadow-xl cursor-pointer flex items-center gap-2 font-mono"
      title="Click to go to the file"
    >
      <span>{{ fullPath }}</span>
      <span class="text-xs opacity-75 font-sans">Click to go to the file</span>
    </button>
  </div>
</template>
