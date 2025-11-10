import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const canInstall = ref(false)

export function useInstallPrompt() {
  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the default browser install prompt
    e.preventDefault()
    
    // Store the event for later use
    deferredPrompt.value = e as BeforeInstallPromptEvent
    
    // Show install option
    canInstall.value = true
  }

  const installApp = async () => {
    if (!deferredPrompt.value) {
      console.log('No install prompt available')
      return
    }

    // Show the install prompt
    await deferredPrompt.value.prompt()

    // Wait for user's choice
    const choiceResult = await deferredPrompt.value.userChoice

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferred prompt
    deferredPrompt.value = null
    canInstall.value = false
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      canInstall.value = false
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  return {
    canInstall,
    installApp
  }
}
