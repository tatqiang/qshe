<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'
import { useAuthStore } from '@/stores/authStore'

defineOptions({
  name: 'Sidebar'
})

const router = useRouter()
const route = useRoute()
const { isDark } = useDarkMode()
const authStore = useAuthStore()

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', route: '/dashboard' },
  { id: 'patrol', label: 'Patrol', icon: 'clipboard', route: '/patrol' },
  { id: 'risk', label: 'Risk Assessment', icon: 'warning', route: '/risk-assessment' },
  { id: 'materials', label: 'Materials', icon: 'cube', route: '/materials' },
  { id: 'material-config', label: 'Material Config', icon: 'cog', route: '/admin/material-config', requiresAdmin: true },
  { id: 'system', label: 'System', icon: 'settings', route: '/system', requiresAdmin: true }
]

// Filter menu items based on user role
const menuItems = computed(() => {
  return allMenuItems.filter(item => {
    // If item requires admin, only show to system_admin users
    if (item.requiresAdmin) {
      return authStore.userRole === 'system_admin'
    }
    return true
  })
})

const activeItem = computed(() => {
  const item = menuItems.value.find(m => route.path.startsWith(m.route))
  return item?.id || 'dashboard'
})

const navigateTo = (routePath: string) => {
  router.push(routePath)
}
</script>

<template>
  <aside :class="[
    'hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 transition-colors duration-200 z-30',
    isDark ? 'bg-gray-900' : 'bg-[#F6F6F2]'
  ]">
    <!-- Header with Logo - Match TopNav height (h-16) -->
    <div :class="[
      'flex items-center gap-3 px-6 h-16',
      isDark ? 'bg-gray-800' : 'bg-[#388087]'
    ]">
      <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
        <img src="/logo.svg" alt="QSHE Logo" class="w-8 h-8" />
      </div>
      <span class="text-white text-xl font-semibold tracking-wide flex-1">QSHE</span>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 px-4 py-6">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.id">
          <button
            @click="navigateTo(item.route)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
              activeItem === item.id
                ? (isDark ? 'bg-[#6FB3B8] text-white' : 'bg-[#6FB3B8] text-white')
                : (isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#BADFE7]')
            ]"
          >
            <!-- Icon -->
            <span class="w-6 h-6 flex items-center justify-center">
              <!-- Home Icon -->
              <svg v-if="item.icon === 'home'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              
              <!-- Clipboard Icon -->
              <svg v-if="item.icon === 'clipboard'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              
              <!-- Warning Icon -->
              <svg v-if="item.icon === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              
              <!-- Cube Icon (Materials) -->
              <svg v-if="item.icon === 'cube'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              
              <!-- Cog Icon (Material Config) -->
              <svg v-if="item.icon === 'cog'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              
              <!-- Settings Icon -->
              <svg v-if="item.icon === 'settings'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            
            <span class="font-medium">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>
