<template>
  <nav class="fixed top-0 left-0 right-0 lg:left-64 bg-primary-500 lg:bg-background-light dark:bg-gray-800 border-b border-primary-600 lg:border-gray-200 dark:border-gray-700 z-50">
    <div class="px-4 sm:px-6 lg:px-8 relative">
      <div class="flex justify-between items-center h-16">
        <!-- Left side: Logo (mobile) + Project Selector -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <!-- Logo for mobile (without text) -->
          <div class="lg:hidden">
            <Logo :show-text="false" />
          </div>
          
          <!-- Project Name and Selector Button -->
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-base sm:text-lg font-semibold text-white lg:text-gray-900 dark:text-white truncate">
              {{ projectDisplayName }}
            </span>
            <button
              @click="showProjectSelector = true"
              class="p-2 rounded-lg hover:bg-primary-600 lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              :title="'Select project'"
            >
              <svg class="w-5 h-5 text-white/90 lg:text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Right side: Theme toggle and user menu -->
        <div class="flex items-center gap-3">
          <!-- Offline Indicator -->
          <div v-if="!isOnline" class="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-lg text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span class="hidden sm:inline">Offline Mode</span>
          </div>

          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="p-2 rounded-lg hover:bg-primary-600 lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
          >
            <svg v-if="theme === 'light'" class="w-5 h-5 text-white lg:text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
            <svg v-else class="w-5 h-5 text-white lg:text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </button>

          <!-- User Avatar Dropdown (Mobile only) -->
          <div class="relative lg:hidden">
            <button
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-primary-600 lg:hover:bg-gray-100 transition-colors"
            >
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full bg-white/20 lg:bg-primary-500 flex items-center justify-center text-white lg:text-white font-semibold text-sm">
                {{ userInitials }}
              </div>
              <!-- Dropdown Icon -->
              <svg class="w-4 h-4 text-white/90 lg:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showUserMenu"
              v-click-outside="closeUserMenu"
              class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[100]"
            >
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ displayName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
              </div>
              <button
                @click.stop="handleSignOut"
                class="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Selector Modal -->
    <ProjectSelector v-model="showProjectSelector" />
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDarkMode } from '@/composables/useDarkMode'
import { useProject } from '@/composables/useProject'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import Logo from '@/components/common/Logo.vue'
import ProjectSelector from '@/components/common/ProjectSelector.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const { theme, toggleTheme } = useDarkMode()
const { displayName: projectDisplayName } = useProject()
const { isOnline } = useOnlineStatus()

const showProjectSelector = ref(false)
const showUserMenu = ref(false)

const displayName = computed(() => {
  if (user.value?.first_name && user.value?.last_name) {
    return `${user.value.first_name} ${user.value.last_name}`
  }
  return user.value?.email?.split('@')[0] || 'Guest'
})

const userEmail = computed(() => user.value?.email || '')

const userInitials = computed(() => {
  if (user.value?.first_name && user.value?.last_name) {
    return `${user.value.first_name[0]}${user.value.last_name[0]}`.toUpperCase()
  }
  const email = user.value?.email || 'U'
  return email[0].toUpperCase()
})

const closeUserMenu = () => {
  showUserMenu.value = false
}

const handleSignOut = async () => {
  showUserMenu.value = false
  try {
    await signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    setTimeout(() => {
      document.addEventListener('click', el.clickOutsideEvent)
    }, 0)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>
