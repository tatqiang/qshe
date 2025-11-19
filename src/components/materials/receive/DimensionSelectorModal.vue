<template>
  <!-- Modal Overlay - Full Screen -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Dimension/Size</h3>
        <button
          type="button"
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search dimensions..."
          autofocus
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Dimension Grid -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="loading" class="text-center py-8 text-gray-500">
          Loading dimensions...
        </div>
        
        <div v-else-if="filteredDimensions.length === 0" class="text-center py-8 text-gray-500">
          No dimensions found
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="dimension in filteredDimensions"
            :key="dimension.id"
            @click="selectDimension(dimension)"
            class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ dimension.specific_detail || buildDimensionDisplay(dimension) }}
            </div>
            <div class="text-sm mt-1" :class="dimension.current_quantity > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'">
              Stock: {{ dimension.current_quantity || 0 }} {{ dimension.unit_of_measure || 'PCS' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

interface Props {
  materialTemplateId: number
  storeId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', inventory: any): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const loading = ref(false)
const dimensions = ref<any[]>([])

const filteredDimensions = computed(() => {
  if (!searchQuery.value) return dimensions.value
  
  const searchWords = searchQuery.value.toLowerCase().trim().split(/\s+/)
  
  return dimensions.value.filter(dim => {
    const displayText = (dim.specific_detail || buildDimensionDisplay(dim)).toLowerCase()
    return searchWords.every(word => displayText.includes(word))
  })
})

async function loadDimensions() {
  loading.value = true
  try {
    let query = supabase
      .from('material_inventory')
      .select(`
        id,
        dimension_id,
        specific_detail,
        current_quantity,
        unit_of_measure,
        dimensions:dimension_id (
          size_1,
          size_2,
          size_3
        )
      `)
      .eq('material_template_id', props.materialTemplateId)
      .eq('is_active', true)
    
    // Only filter by store if storeId is provided and not empty
    if (props.storeId && props.storeId.trim() !== '') {
      query = query.eq('store_id', props.storeId)
    }
    
    const { data, error } = await query

    if (error) throw error

    dimensions.value = data || []
  } catch (error) {
    console.error('Error loading dimensions:', error)
  } finally {
    loading.value = false
  }
}

function buildDimensionDisplay(dimension: any): string {
  if (!dimension.dimensions) return '-'
  const parts = [
    dimension.dimensions.size_1,
    dimension.dimensions.size_2,
    dimension.dimensions.size_3
  ].filter(Boolean)
  return parts.join(' / ')
}

function selectDimension(dimension: any) {
  emit('select', dimension)
}

onMounted(() => {
  loadDimensions()
})
</script>
