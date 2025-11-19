<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import TopNav from './components/layout/TopNav.vue'
import BottomNav from './components/layout/BottomNav.vue'
// import InstallPrompt from './components/InstallPrompt.vue'
import { useAuthStore } from './stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

// Check if current route is a print view
const isPrintView = computed(() => route.path.includes('/print'))

onMounted(async () => {
  // Initialize authentication
  await authStore.initialize()
})
</script>

<template>
  <!-- Login view (no sidebar/navbar) -->
  <div v-if="route.name === 'login'" class="w-full h-screen">
    <RouterView />
  </div>

  <!-- Print view (no navigation) -->
  <div v-else-if="isPrintView" class="w-full h-screen">
    <RouterView />
  </div>

  <!-- Authenticated views (with sidebar and top nav) -->
  <div v-else class="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
    <!-- Sidebar (Desktop only - has its own hidden lg:flex classes) -->
    <Sidebar />
    
    <!-- Main Content Area with TopNav -->
    <div class="flex-1 flex flex-col overflow-hidden lg:ml-64">
      <!-- Top Navigation -->
      <TopNav />
      
      <!-- Main Content (with padding for bottom nav on mobile) -->
      <main class="flex-1 overflow-y-auto bg-[#F6F6F2] dark:bg-gray-800 transition-colors duration-200 mt-16 pb-16 lg:pb-0">
        <RouterView />
      </main>
      
      <!-- Bottom Navigation (Mobile only) -->
      <BottomNav />
    </div>
    
    <!-- Install Prompt (hidden - now in user menu) -->
    <!-- <InstallPrompt /> -->
  </div>
</template>


<style scoped>
/* Additional app-level styles */
</style>

<style>
/* Global print styles - hide all navigation when printing */
@media print {
  /* Hide all navigation elements */
  nav,
  .sidebar,
  .top-nav,
  .bottom-nav,
  header,
  footer,
  [role="navigation"],
  .no-print {
    display: none !important;
  }
  
  /* Reset body for printing */
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
  
  /* Ensure only print content shows */
  .print-page {
    display: block !important;
  }
}
</style>
