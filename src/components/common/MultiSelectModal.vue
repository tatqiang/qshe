<template>
  <div>
    <!-- Trigger Button -->
    <button
      type="button"
      @click="isOpen = true"
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div v-if="modelValue.length === 0" class="text-gray-500 dark:text-gray-400">
            {{ placeholder }}
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-sm font-medium text-primary dark:text-primary/90">
              {{ modelValue.length }} selected
            </span>
            <div class="flex gap-1 flex-wrap">
              <span
                v-for="id in modelValue.slice(0, 3)"
                :key="id"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90"
              >
                {{ getOptionLabel(id) }}
              </span>
              <span
                v-if="modelValue.length > 3"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                +{{ modelValue.length - 3 }} more
              </span>
            </div>
          </div>
        </div>
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-16"
          @click.self="close"
          @touchmove.prevent
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="close"></div>

          <!-- Modal Content -->
          <div
            class="relative bg-white dark:bg-gray-800 w-full sm:max-w-lg shadow-xl transform transition-all flex flex-col overflow-hidden z-10 max-h-[85vh] rounded-lg"
            @touchmove.stop
            @wheel.stop
          >
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 shrink-0">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  @click="close"
                  class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Selected count -->
              <div v-if="selectedItems.length > 0" class="mt-3 flex items-center justify-between px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-md">
                <span class="text-sm font-medium text-primary dark:text-primary/90">
                  {{ selectedItems.length }} selected
                </span>
                <button
                  type="button"
                  @click="clearAll"
                  class="text-xs text-primary dark:text-primary/90 hover:text-primary-600 dark:hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>

            <!-- Options List -->
            <div class="flex-1 overflow-y-auto px-4 py-2 sm:px-6">
              <div v-if="options.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No options available
              </div>

              <label
                v-for="option in options"
                :key="option[valueKey]"
                class="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-md transition-colors"
                :class="{ 'bg-primary/5 dark:bg-primary/10': isSelected(option[valueKey]) }"
              >
                <!-- Checkbox -->
                <input
                  type="checkbox"
                  :checked="isSelected(option[valueKey])"
                  @change="toggleOption(option[valueKey])"
                  class="w-5 h-5 mt-0.5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary shrink-0"
                />

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <!-- Icon as part of title if available -->
                    <span v-if="option.icon" class="text-lg">{{ option.icon }}</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ option[labelKey] }}
                    </span>
                  </div>
                  <div v-if="option[descriptionKey]" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ option[descriptionKey] }}
                  </div>
                </div>

                <!-- Color indicator -->
                <div
                  v-if="option.color"
                  class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0"
                  :style="{ backgroundColor: option.color }"
                ></div>
              </label>
            </div>

            <!-- Footer -->
            <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 flex gap-2 shrink-0">
              <button
                type="button"
                @click="close"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="apply"
                class="flex-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-hover text-sm font-medium"
              >
                Apply ({{ selectedItems.length }})
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array as () => any[],
    default: () => []
  },
  options: {
    type: Array as () => any[],
    required: true
  },
  title: {
    type: String,
    default: 'Select Options'
  },
  placeholder: {
    type: String,
    default: 'Select...'
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
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectedItems = ref<any[]>([...props.modelValue])

// Get option label by ID
const getOptionLabel = (id: string) => {
  const option = props.options.find((opt: any) => opt[props.valueKey] === id)
  return option ? (option as any)[props.labelKey] : ''
}

// Check if option is selected
const isSelected = (optionId: string) => {
  return selectedItems.value.includes(optionId)
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  selectedItems.value = [...newVal]
})

// Prevent body scroll when modal is open
watch(isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Toggle option selection
const toggleOption = (optionId: string) => {
  if (isSelected(optionId)) {
    selectedItems.value = selectedItems.value.filter(id => id !== optionId)
  } else {
    selectedItems.value = [...selectedItems.value, optionId]
  }
}

// Clear all selections
const clearAll = () => {
  selectedItems.value = []
}

// Close modal
const close = () => {
  isOpen.value = false
  // Reset to original values on cancel
  selectedItems.value = [...props.modelValue]
}

// Apply selections
const apply = () => {
  emit('update:modelValue', selectedItems.value)
  isOpen.value = false
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative {
  transform: scale(0.95);
}

.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
