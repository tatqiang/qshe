<template>
  <div :class="cardClasses">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  padding: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value)
  },
  hover: {
    type: Boolean,
    default: false
  }
})

const cardClasses = computed(() => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow'
  
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }
  
  const hoverClass = props.hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
  
  return [
    baseClasses,
    paddingClasses[props.padding],
    hoverClass
  ].filter(Boolean).join(' ')
})
</script>
