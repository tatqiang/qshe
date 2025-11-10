import { ref, readonly } from 'vue'

const currentFilePath = ref('')
const currentLine = ref(0)
const currentColumn = ref(0)

export function useDevTools() {
  const setCurrentFile = (filePath: string, line: number = 0, column: number = 0) => {
    currentFilePath.value = filePath
    currentLine.value = line
    currentColumn.value = column
  }

  const clearCurrentFile = () => {
    currentFilePath.value = ''
    currentLine.value = 0
    currentColumn.value = 0
  }

  return {
    currentFilePath: readonly(currentFilePath),
    currentLine: readonly(currentLine),
    currentColumn: readonly(currentColumn),
    setCurrentFile,
    clearCurrentFile
  }
}
