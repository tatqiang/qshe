<template>
  <div>
    <!-- Trigger Button -->
    <button
      type="button"
      @click="isOpen = true"
      class="w-full px-4 py-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div v-if="modelValue.length === 0" class="text-gray-500">
            {{ placeholder }}
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-sm font-medium text-primary-700">
              {{ modelValue.length }} selected
            </span>
            <div class="flex gap-1 flex-wrap">
              <span
                v-for="id in modelValue.slice(0, 3)"
                :key="id"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700"
              >
                {{ getOptionLabel(id) }}
              </span>
              <span
                v-if="modelValue.length > 3"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                +{{ modelValue.length - 3 }} more
              </span>
            </div>
          </div>
        </div>
        <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </button>

    <!-- Main Modal -->
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
            class="relative bg-white w-full sm:max-w-lg shadow-xl transform transition-all flex flex-col overflow-hidden z-10"
            :class="[
              'max-h-[85vh]',
              'rounded-lg'
            ]"
            @touchmove.stop
            @wheel.stop
          >
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  @click="close"
                  class="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Search -->
              <div class="mt-3 relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search risk items..."
                  class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Category Tabs -->
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="selectedCategory = null"
                  class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                  :class="selectedCategory === null 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                >
                  All ({{ filteredOptions.length }})
                </button>
                <button
                  v-for="cat in categories"
                  :key="cat"
                  type="button"
                  @click="selectedCategory = cat"
                  class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                  :class="selectedCategory === cat 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                >
                  {{ cat }} ({{ getCountByCategory(cat) }})
                </button>
              </div>

              <!-- Selected count -->
              <div v-if="selectedItems.length > 0" class="mt-3 flex items-center justify-between px-3 py-2 bg-primary-50 rounded-md">
                <span class="text-sm font-medium text-primary-700">
                  {{ selectedItems.length }} selected
                </span>
                <button
                  type="button"
                  @click="clearAll"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>

            <!-- Options List -->
            <div class="flex-1 overflow-y-auto px-4 py-2 sm:px-6">
              <div v-if="filteredOptions.length === 0" class="py-12 text-center text-sm text-gray-500">
                No items found
              </div>

              <label
                v-for="option in filteredOptions"
                :key="option.id"
                class="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors"
                :class="{ 'bg-primary-50': isSelected(option.id) }"
              >
                <!-- Checkbox -->
                <input
                  type="checkbox"
                  :checked="isSelected(option.id)"
                  @change="toggleOption(option.id)"
                  class="w-5 h-5 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                />

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900">
                    {{ option.name }}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span v-if="option.category" class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {{ option.category }}
                    </span>
                    <span v-if="option.description" class="text-xs text-gray-500">
                      {{ option.description }}
                    </span>
                  </div>
                </div>
              </label>
            </div>

            <!-- Footer -->
            <div class="bg-white border-t border-gray-200 px-3 py-2.5 flex gap-2 flex-shrink-0">
              <button
                type="button"
                @click="showAddModal = true"
                class="px-3 py-2 border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 text-sm font-medium flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add
              </button>
              <button
                type="button"
                @click="close"
                class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="apply"
                class="flex-1 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm font-medium"
              >
                Apply ({{ selectedItems.length }})
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add New Item Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddModal"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
          @click.self="showAddModal = false"
          @touchmove.prevent
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black bg-opacity-50"></div>

          <!-- Add Modal Content -->
          <div
            class="relative bg-white w-full max-w-md rounded-lg shadow-xl z-10 p-6"
            @touchmove.stop
          >
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Risk Item</h3>
            
            <div class="space-y-4">
              <!-- Item Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Item Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="newItem.name"
                  type="text"
                  placeholder="e.g., Missing Guardrail"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Category <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="newItem.category"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select category...</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  v-model="newItem.description"
                  rows="2"
                  placeholder="Brief description..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                ></textarea>
              </div>
            </div>

            <!-- Add Modal Footer -->
            <div class="mt-6 flex gap-2">
              <button
                type="button"
                @click="cancelAdd"
                class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="confirmAdd"
                :disabled="!newItem.name || !newItem.category"
                class="flex-1 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: 'Select Risk Items'
  },
  placeholder: {
    type: String,
    default: 'Select...'
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = ref(false)
const showAddModal = ref(false)
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedItems = ref([...props.modelValue])

const newItem = ref({
  name: '',
  category: '',
  description: ''
})

// Get unique categories from options
const categories = computed(() => {
  const cats = props.options
    .map(opt => opt.category)
    .filter(cat => cat && cat.trim())
  return [...new Set(cats)].sort()
})

// Filter options by search and category
const filteredOptions = computed(() => {
  let filtered = props.options

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(opt => opt.category === selectedCategory.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(opt => {
      const name = opt.name?.toLowerCase() || ''
      const desc = opt.description?.toLowerCase() || ''
      const cat = opt.category?.toLowerCase() || ''
      return name.includes(query) || desc.includes(query) || cat.includes(query)
    })
  }

  return filtered
})

// Get count by category
const getCountByCategory = (category) => {
  return props.options.filter(opt => opt.category === category).length
}

// Get option label by ID
const getOptionLabel = (id) => {
  const option = props.options.find(opt => opt.id === id)
  return option ? option.name : ''
}

// Check if option is selected
const isSelected = (optionId) => {
  return selectedItems.value.includes(optionId)
}

// Toggle option selection
const toggleOption = (optionId) => {
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
  searchQuery.value = ''
  selectedCategory.value = null
  selectedItems.value = [...props.modelValue]
}

// Apply selections
const apply = () => {
  emit('update:modelValue', selectedItems.value)
  isOpen.value = false
  searchQuery.value = ''
  selectedCategory.value = null
}

// Cancel add
const cancelAdd = () => {
  showAddModal.value = false
  newItem.value = { name: '', category: '', description: '' }
}

// Confirm add new item
const confirmAdd = async () => {
  if (!newItem.value.name || !newItem.value.category) return

  try {
    const { data, error } = await supabase
      .from('risk_items')
      .insert([{
        name: newItem.value.name.trim(),
        category: newItem.value.category,
        description: newItem.value.description?.trim() || null
      }])
      .select()
      .single()

    if (error) throw error

    // Notify parent to refresh options
    emit('refresh')

    // Auto-select the newly added item
    selectedItems.value = [...selectedItems.value, data.id]

    // Close add modal
    showAddModal.value = false
    newItem.value = { name: '', category: '', description: '' }

    alert('Risk item added successfully!')
  } catch (error) {
    console.error('Error adding risk item:', error)
    alert('Failed to add risk item. Please try again.')
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  selectedItems.value = [...newVal]
})

// Prevent body scroll when modal is open
watch([isOpen, showAddModal], ([mainOpen, addOpen]) => {
  if (mainOpen || addOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
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
