import { ref, onMounted, onUnmounted } from 'vue'
import { projectService } from '@/services/projectService'

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)

  const updateOnlineStatus = async () => {
    const wasOffline = !isOnline.value
    isOnline.value = navigator.onLine
    console.log(`🌐 Network status: ${isOnline.value ? 'ONLINE ✅' : 'OFFLINE ⚠️'}`)
    
    // Sync offline changes when coming back online
    if (isOnline.value && wasOffline) {
      console.log('🔄 Network restored - Starting sync...')
      try {
        const results = await projectService.syncOfflineChanges()
        const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length
        
        if (successful > 0) {
          console.log(`✅ Synced ${successful} offline change(s)`)
        }
        if (failed > 0) {
          console.warn(`⚠️ Failed to sync ${failed} change(s)`)
        }
        if (successful === 0 && failed === 0) {
          console.log('ℹ️ No offline changes to sync')
        }
      } catch (error) {
        console.error('❌ Sync failed:', error)
      }
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOnline
  }
}
