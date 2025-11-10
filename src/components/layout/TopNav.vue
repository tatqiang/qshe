<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import ProjectSelector from '@/components/common/ProjectSelector.vue'
import packageJson from '../../../package.json'
import { useDarkMode } from '@/composables/useDarkMode'
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const projectStore = useProjectStore()
const authStore = useAuthStore()
const { isDark, toggleDarkMode } = useDarkMode()
const { isOnline } = useOnlineStatus()
const { canInstall, installApp } = useInstallPrompt()

const showProjectSelector = ref(false)
const showUserMenu = ref(false)

// Get user initials for display
const userInitials = computed(() => {
  if (!authStore.azureUser) return ''
  const name = authStore.azureUser.displayName || ''
  const parts = name.split(' ')
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    const firstChar = parts[0]?.[0]
    const lastChar = parts[parts.length - 1]?.[0]
    return firstChar && lastChar ? (firstChar + lastChar).toUpperCase() : '??'
  }
  return name.substring(0, 2).toUpperCase()
})

const handleSignOut = async () => {
  showUserMenu.value = false
  await authStore.signOut()
}
</script>

<template>
  <nav :class="[
    'fixed top-0 left-0 right-0 lg:left-64 z-40',
    // Mobile: teal background, Desktop: beige background
    isDark 
      ? 'bg-gray-800' 
      : 'bg-[#388087] lg:bg-[#F6F6F2]'
  ]">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Mobile: Logo + Project name on left -->
        <div class="lg:hidden flex items-center gap-2 flex-1 min-w-0">
          <img src="/logo.svg" alt="QSHE" class="w-8 h-8 shrink-0" />
          <button
            @click="showProjectSelector = true"
            class="text-base font-semibold text-white truncate"
          >
            {{ projectStore.displayName }}
          </button>
          <svg class="w-5 h-5 text-white/90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        <!-- Desktop: Project Selector -->
        <div class="hidden lg:flex items-center gap-2 flex-1 min-w-0">
          <span :class="[
            'text-base sm:text-lg font-semibold truncate',
            isDark ? 'text-white' : 'text-gray-800'
          ]">
            {{ projectStore.displayName }}
          </span>
          <button
            @click="showProjectSelector = true"
            :class="[
              'p-2 rounded-lg transition-colors shrink-0',
              isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'
            ]"
            title="Select project"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
        
        <!-- Right side: Offline Indicator + Dark Mode Toggle + Avatar -->
        <div class="flex items-center gap-2">
          <!-- Offline Indicator -->
          <div v-if="!isOnline" 
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium rounded-full"
            title="You are offline. Changes will sync when connection is restored."
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
            </svg>
            <span>Offline</span>
          </div>
          
          <!-- Mobile-only small offline indicator -->
          <div v-if="!isOnline" 
            class="sm:hidden flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full"
            title="Offline mode"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
            </svg>
          </div>
          
          <!-- Dark Mode Toggle -->
          <button 
            @click="toggleDarkMode"
            :class="[
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 lg:hover:bg-gray-100 text-white lg:text-gray-600'
            ]"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <!-- Mobile & Desktop Avatar -->
          <div class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                isDark ? 'bg-[#6FB3B8]' : 'bg-white/20 lg:bg-[#388087]'
              ]"
            >
              {{ userInitials }}
            </button>
            
            <!-- Dropdown Menu (Mobile) -->
            <div
              v-if="showUserMenu"
              @click.stop
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
            >
              <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.azureUser?.displayName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.azureUser?.email }}</p>
              </div>
              <button
                v-if="canInstall"
                @click="installApp(); showUserMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Install App
              </button>
              <button
                @click="handleSignOut"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
              <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-400">Version {{ packageJson.version }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Project Selector Modal -->
  <ProjectSelector v-model="showProjectSelector" />
  
  <!-- Click outside to close menu -->
  <div
    v-if="showUserMenu"
    @click="showUserMenu = false"
    class="fixed inset-0 z-30"
  ></div>
</template>
