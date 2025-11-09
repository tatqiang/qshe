<template>
  <div class="min-h-screen bg-background-light dark:bg-gray-900 text-gray-900 dark:text-white">
    <!-- Left Sidebar (Desktop only) -->
    <LeftSidebar v-if="!isLoginPage" />
    
    <!-- Top Nav -->
    <TopNav v-if="!isLoginPage" />
    
    <!-- Main Content -->
    <main :class="mainClasses">
      <RouterView />
    </main>
    
    <!-- Bottom Nav (Mobile only) -->
    <BottomNav v-if="!isLoginPage" class="lg:hidden" />
    
    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TopNav from '@/components/layout/TopNav.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import InstallPrompt from '@/components/common/InstallPrompt.vue'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')

const mainClasses = computed(() => {
  if (isLoginPage.value) {
    return ''
  }
  return 'pt-16 pb-16 lg:pb-0 lg:pl-64'
})

onMounted(() => {
  // Force light mode
  document.documentElement.classList.remove('dark')
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
