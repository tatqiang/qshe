<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="showPrompt"
        class="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-2xl"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <div class="max-w-4xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold">Install QSHE App</p>
              <p class="text-xs opacity-90 mt-0.5">
                {{ isIOS ? 'Tap Share → Add to Home Screen for the best experience' : 'Add to your home screen for offline access' }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                v-if="!isIOS && deferredPrompt"
                @click="handleInstall"
                class="px-4 py-2 bg-white text-primary-600 rounded-lg text-sm font-medium hover:bg-background-light transition-colors"
              >
                Install
              </button>
              <button
                @click="handleDismiss"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showPrompt = ref(false)
const deferredPrompt = ref(null)
const isIOS = ref(false)

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// Check if running in standalone mode
const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

// Check if recently dismissed
const wasRecentlyDismissed = () => {
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  
  const dismissedTime = parseInt(dismissed, 10)
  const now = Date.now()
  
  return (now - dismissedTime) < DISMISS_DURATION
}

// Detect iOS
const detectIOS = () => {
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  return iOS && webkit && !window.MSStream
}

// Handle beforeinstallprompt event (Chrome/Edge/Android)
const handleBeforeInstallPrompt = (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  
  // Show prompt if conditions met
  if (!isStandalone() && !wasRecentlyDismissed()) {
    showPrompt.value = true
  }
}

// Handle install button click
const handleInstall = async () => {
  if (!deferredPrompt.value) return
  
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  
  console.log(`User response to install prompt: ${outcome}`)
  
  // Hide prompt after user choice
  showPrompt.value = false
  deferredPrompt.value = null
  
  // If user dismissed, remember it
  if (outcome === 'dismissed') {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }
}

// Handle dismiss button click
const handleDismiss = () => {
  showPrompt.value = false
  localStorage.setItem(DISMISS_KEY, Date.now().toString())
}

onMounted(() => {
  isIOS.value = detectIOS()
  
  // Check if should show prompt immediately
  if (!isStandalone() && !wasRecentlyDismissed()) {
    // For iOS, show prompt after short delay
    if (isIOS.value) {
      setTimeout(() => {
        showPrompt.value = true
      }, 2000)
    }
  }
  
  // Listen for install prompt event (non-iOS)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
