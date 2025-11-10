<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
const deferredPrompt = ref<any>(null)

onMounted(() => {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Save the event so it can be triggered later
    deferredPrompt.value = e
    // Show install button
    showInstallPrompt.value = true
  })

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallPrompt.value = false
  }
})

const installApp = async () => {
  if (!deferredPrompt.value) return

  // Show the install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  }

  // Clear the deferredPrompt
  deferredPrompt.value = null
  showInstallPrompt.value = false
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  // Remember dismissal for this session
  sessionStorage.setItem('installPromptDismissed', 'true')
}

// Check if user dismissed in this session
onMounted(() => {
  if (sessionStorage.getItem('installPromptDismissed')) {
    showInstallPrompt.value = false
  }
})
</script>

<template>
  <!-- Install Prompt Banner -->
  <div
    v-if="showInstallPrompt"
    class="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50 p-4"
  >
    <div class="flex items-start gap-3">
      <div class="w-12 h-12 bg-[#388087] rounded-lg flex items-center justify-center shrink-0">
        <img src="/logo.svg" alt="QSHE" class="w-10 h-10" />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">
          Install QSHE App
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Install this app on your device for quick and easy access
        </p>
        <div class="flex gap-2">
          <button
            @click="installApp"
            class="px-4 py-2 bg-[#388087] hover:bg-[#2a6a70] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Install
          </button>
          <button
            @click="dismissPrompt"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        @click="dismissPrompt"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>
