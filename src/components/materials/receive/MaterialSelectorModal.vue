<template>
  <!-- Modal Overlay - Full Screen -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Material</h3>
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
          placeholder="Search material..."
          autofocus
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Material List -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="loading" class="text-center py-8 text-gray-500">
          Loading materials...
        </div>
        
        <div v-else-if="filteredMaterials.length === 0" class="text-center py-8 text-gray-500">
          No materials found
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="material in filteredMaterials"
            :key="material.material_template_id"
            @click="selectMaterial(material)"
            class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div v-if="material.material_description_th" class="font-medium text-gray-900 dark:text-gray-100">
              {{ material.material_description_th }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400" :class="{ 'mt-1': material.material_description_th }">
              {{ material.material_description }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span v-if="material.material_code">Code: {{ material.material_code }}</span>
              <span v-if="material.brand" class="ml-2">• Brand: {{ material.brand }}</span>
              <span class="ml-2 text-blue-600 dark:text-blue-400">• {{ material.variant_count }} size(s) available</span>
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
  projectId: string
  storeId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', material: any): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const loading = ref(false)
const materials = ref<any[]>([])

const filteredMaterials = computed(() => {
  if (!searchQuery.value) return materials.value
  
  const query = searchQuery.value.toLowerCase()
  return materials.value.filter(mat => {
    const searchText = [
      mat.material_description,
      mat.material_description_th,
      mat.material_code,
      mat.brand
    ].filter(Boolean).join(' ').toLowerCase()
    
    return searchText.includes(query)
  })
})

async function loadMaterials() {
  loading.value = true
  try {
    let query = supabase
      .from('material_inventory')
      .select(`
        material_template_id,
        material_description,
        material_description_th,
        material_codes:material_code_id (material_code),
        brands:brand_id (brand_title),
        material_templates:material_template_id (
          id,
          title_1,
          title_2,
          title_3,
          title_4,
          title_5,
          title_1_th,
          title_2_th,
          title_3_th,
          title_4_th,
          title_5_th
        )
      `)
      .eq('project_id', props.projectId)
      .eq('is_active', true)
    
    // Only filter by store if storeId is provided and not empty
    if (props.storeId && props.storeId.trim() !== '') {
      query = query.eq('store_id', props.storeId)
    }
    
    const { data, error } = await query

    if (error) throw error

    // Group by material_template_id
    const grouped = new Map<number, any>()
    data?.forEach(item => {
      const templateId = item.material_template_id
      if (!templateId) return

      if (!grouped.has(templateId)) {
        grouped.set(templateId, {
          material_template_id: templateId,
          material_description: item.material_description,
          material_description_th: buildThaiDescription(item.material_templates),
          material_code: Array.isArray(item.material_codes) && item.material_codes[0]?.material_code || '',
          brand: Array.isArray(item.brands) && item.brands[0]?.brand_title || '',
          variant_count: 1
        })
      } else {
        grouped.get(templateId)!.variant_count++
      }
    })

    materials.value = Array.from(grouped.values())
  } catch (error) {
    console.error('Error loading materials:', error)
  } finally {
    loading.value = false
  }
}

function buildThaiDescription(template: any): string {
  if (!template) return ''
  const parts = [
    template.title_1_th,
    template.title_2_th,
    template.title_3_th,
    template.title_4_th,
    template.title_5_th
  ].filter(Boolean)
  return parts.join(' ')
}

function selectMaterial(material: any) {
  emit('select', material)
}

onMounted(() => {
  loadMaterials()
})
</script>
