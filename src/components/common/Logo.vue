<template>
  <div class="flex items-center gap-3">
    <img src="/logo.svg" alt="QSHE Logo" class="w-10 h-10" />
    <h1 v-if="showText" :class="textColor">QSHE</h1>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  showText: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'light', // 'light' or 'dark'
    validator: (value) => ['light', 'dark'].includes(value)
  }
})

const textColor = computed(() => {
  return props.variant === 'dark' 
    ? 'text-xl font-bold text-white dark:text-white'
    : 'text-xl font-bold text-white dark:text-white'
})
</script>
