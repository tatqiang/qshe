<template>
  <div class="space-y-2">
    <!-- Search/Filter -->
    <div v-if="searchable" class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="searchPlaceholder"
        class="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>

    <!-- Selected count badge -->
    <div v-if="modelValue.length > 0" class="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-md">
      <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="text-sm font-medium text-primary-700">
        {{ modelValue.length }} selected
      </span>
      <button
        v-if="modelValue.length > 0"
        type="button"
        @click="clearAll"
        class="ml-auto text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        Clear all
      </button>
    </div>

    <!-- Options list with checkboxes -->
    <div class="border border-gray-300 rounded-md divide-y divide-gray-200 max-h-64 overflow-y-auto">
      <div v-if="filteredOptions.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
        {{ searchQuery ? 'No results found' : 'No options available' }}
      </div>
      
      <label
        v-for="option in filteredOptions"
        :key="option.id"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
        :class="{ 'bg-primary-50': isSelected(option.id) }"
      >
        <!-- Checkbox -->
        <input
          type="checkbox"
          :checked="isSelected(option.id)"
          @change="toggleOption(option.id)"
          class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        
        <!-- Icon (if provided) -->
        <span v-if="option.icon" class="text-xl">{{ option.icon }}</span>
        
        <!-- Option content -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900">
            {{ option[labelKey] }}
          </div>
          <div v-if="option[descriptionKey]" class="text-xs text-gray-500 truncate">
            {{ option[descriptionKey] }}
          </div>
        </div>

        <!-- Color indicator (if provided) -->
        <div
          v-if="option.color"
          class="w-4 h-4 rounded-full border border-gray-300"
          :style="{ backgroundColor: option.color }"
        ></div>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    required: true
  },
  labelKey: {
    type: String,
    default: 'name'
  },
  descriptionKey: {
    type: String,
    default: 'description'
  },
  valueKey: {
    type: String,
    default: 'id'
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  }
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')

// Filter options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => {
    const label = opt[props.labelKey]?.toLowerCase() || ''
    const desc = opt[props.descriptionKey]?.toLowerCase() || ''
    return label.includes(query) || desc.includes(query)
  })
})

// Check if option is selected
const isSelected = (optionId) => {
  return props.modelValue.includes(optionId)
}

// Toggle option selection
const toggleOption = (optionId) => {
  const newValue = isSelected(optionId)
    ? props.modelValue.filter(id => id !== optionId)
    : [...props.modelValue, optionId]
  
  emit('update:modelValue', newValue)
}

// Clear all selections
const clearAll = () => {
  emit('update:modelValue', [])
}
</script>
