<template>
  <aside class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-background-light dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
    <!-- Logo/Brand -->
    <div class="flex items-center h-16 px-6 border-b border-primary-600 dark:border-gray-700 bg-primary-500 dark:bg-gray-800">
      <Logo variant="dark" />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      <RouterLink
        v-for="item in visibleMenuItems"
        :key="item.name"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
        :class="isActive(item.path) 
          ? 'bg-primary-500 dark:bg-primary-900/20 text-white dark:text-primary-400' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-gray-700 hover:text-primary-700'"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- User Section -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ displayName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
        </div>
      </div>
      <button
        @click="handleSignOut"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Sign Out
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, h } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Logo from '@/components/common/Logo.vue'

const route = useRoute()
const router = useRouter()
const { user, isSystemAdmin, signOut } = useAuth()

// SVG Icons as functional components
const DashboardIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
])

const PatrolIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' })
])

const RiskIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
])

const SystemIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
])

const menuItems = [
  { name: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { name: 'patrol', label: 'Patrol', path: '/patrol', icon: PatrolIcon },
  { name: 'risk-assessment', label: 'Risk Assessment', path: '/risk-assessment', icon: RiskIcon },
  { name: 'system', label: 'System', path: '/system', icon: SystemIcon, requiresAdmin: true }
]

const visibleMenuItems = computed(() => {
  return menuItems.filter(item => {
    if (item.requiresAdmin) {
      return isSystemAdmin()
    }
    return true
  })
})

const isActive = (path) => {
  return route.path === path
}

const displayName = computed(() => {
  if (user.value?.first_name && user.value?.last_name) {
    return `${user.value.first_name} ${user.value.last_name}`
  }
  return user.value?.email?.split('@')[0] || 'Guest'
})

const userEmail = computed(() => user.value?.email || '')

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>
