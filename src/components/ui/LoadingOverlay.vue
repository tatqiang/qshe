<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div 
        v-if="show" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style="backdrop-filter: blur(2px); z-index: 9999;"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md mx-4">
          <div class="flex flex-col items-center">
            <!-- Spinner -->
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            
            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              {{ title }}
            </h3>
            
            <!-- Message -->
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
              {{ message }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  message?: string
}>()
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-active .bg-white,
.overlay-leave-active .bg-white {
  transition: transform 0.2s ease;
}

.overlay-enter-from .bg-white,
.overlay-leave-to .bg-white {
  transform: scale(0.9);
}
</style>
