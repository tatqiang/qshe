<template>
  <div class="space-y-4 md:space-y-6">
    <h2 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Add Materials to Inventory</h2>

    <!-- Store Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Store <span class="text-red-500">*</span>
      </label>
      <select
        v-model="formData.store_id"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
      >
        <option value="">Select Store</option>
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.store_name }} {{ store.is_main_store ? '(Main)' : '' }}
        </option>
      </select>
    </div>

    <!-- Line Items -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Materials <span class="text-red-500">*</span>
      </label>

      <div class="space-y-3 md:space-y-4">
        <div
          v-for="(item, index) in formData.items"
          :key="index"
          class="p-3 md:p-4 border border-gray-200 dark:border-gray-600 rounded-md space-y-2 md:space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Item #{{ index + 1 }}</span>
            <button
              v-if="formData.items.length > 1"
              type="button"
              @click="removeLineItem(index)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <!-- Material Template Selector -->
            <div class="sm:col-span-2">
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Material Template <span class="text-red-500">*</span>
              </label>
              <MaterialTemplateSelector
                v-model="item.material_template_id"
                :project-id="projectId"
                :show-inventory-indicator="true"
                @select="handleTemplateSelect(index, $event)"
              />
            </div>

            <!-- Multi-Dimension Selector (if template has dimension group) -->
            <div v-if="item.dimension_group_id" class="sm:col-span-2">
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Dimensions ({{ item.dimension_group_name }}) - Select all that apply
              </label>
              
              <!-- Search box for dimensions -->
              <input
                v-model="item.dimensionSearch"
                type="text"
                placeholder="Search dimensions..."
                class="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded">
                <div
                  v-for="dimension in getFilteredDimensions(item)"
                  :key="dimension.id"
                  class="flex items-center gap-2"
                  :class="{ 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2': isInInventory(item.material_template_id, dimension.id) }"
                >
                  <input
                    type="checkbox"
                    :id="`dim-${index}-${dimension.id}`"
                    :value="dimension.id"
                    v-model="item.selectedDimensions"
                    class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label :for="`dim-${index}-${dimension.id}`" class="text-sm text-gray-700 dark:text-gray-300">
                    {{ formatDimensionDisplay(dimension) }}
                    <span v-if="isInInventory(item.material_template_id, dimension.id)" class="text-xs text-green-600 dark:text-green-400"> ✓</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Material Code</label>
              <MaterialCodeSelector
                v-model="item.material_code_id"
                :project-id="projectId"
                @select="handleMaterialCodeSelect(index, $event)"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Specific Detail</label>
              <input
                v-model="item.specific_detail"
                type="text"
                placeholder="e.g., Hot dip, Galvanized, Red color"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Brand</label>
              <BrandSelector
                v-model="item.brand_id"
                @select="handleBrandSelect(index, $event)"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unit <span class="text-red-500">*</span></label>
              <UnitSelector
                v-model="item.unit_of_measure"
                :project-id="projectId"
                @select="handleUnitSelect(index, $event)"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add Item Button (centered below cards) -->
      <div class="flex justify-center mt-4">
        <button
          type="button"
          @click="addLineItem"
          class="px-4 py-2 bg-blue-600 text-white text-sm md:text-base rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$router.back()"
        class="px-4 md:px-6 py-2 text-sm md:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        Cancel
      </button>

      <button
        type="button"
        @click="handleSave"
        :disabled="!canProceed || isSaving"
        class="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {{ isSaving ? 'Saving...' : 'Save to Inventory' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMaterialInventory } from '@/composables/useMaterialInventory'
import { useProjectStore } from '@/stores/projectStore'
import { supabase } from '@/lib/supabase'
import { getDimensionsByGroup, addMaterialsToInventory } from '@/lib/api/materialSystem'
import type { MaterialTemplate, Dimension, Brand, AddToInventoryItem } from '@/types/materialSystem'
import MaterialTemplateSelector from './receive/MaterialTemplateSelector.vue'
import MaterialCodeSelector from './receive/MaterialCodeSelector.vue'
import UnitSelector from './receive/UnitSelector.vue'
import BrandSelector from './BrandSelector.vue'

const router = useRouter()
const projectStore = useProjectStore()
const { selectedProject } = storeToRefs(projectStore)
const projectId = computed(() => selectedProject.value?.id || '')

const { stores, loadStores } = useMaterialInventory(projectId.value)

const formData = ref({
  store_id: '',
  project_id: projectId.value,
  items: [createEmptyLineItem()]
})

// Track existing inventory for indicators
const existingInventory = ref<Set<string>>(new Set())

const isSaving = ref(false)

function createEmptyLineItem() {
  return {
    line_number: 1,
    material_template_id: null as number | null,
    material_code_id: null as string | null,
    brand_id: null as string | null,
    specific_detail: '',
    unit_of_measure: '',
    unit_id: null as string | null,
    // Dimension-related fields
    dimension_group_id: null as number | null,
    dimension_group_name: '',
    availableDimensions: [] as Dimension[],
    selectedDimensions: [] as number[], // Multi-select
    dimensionSearch: '' // Search filter for dimensions
  }
}

const canProceed = computed(() => {
  return formData.value.store_id &&
    formData.value.items.length > 0 &&
    formData.value.items.every((item: any) => 
      item.material_template_id &&
      item.unit_of_measure &&
      // Must have at least one dimension selected if dimension group exists
      (!item.dimension_group_id || (item.selectedDimensions && item.selectedDimensions.length > 0))
    )
})

function addLineItem() {
  formData.value.items.push({
    ...createEmptyLineItem(),
    line_number: formData.value.items.length + 1
  })
}

function removeLineItem(index: number) {
  formData.value.items.splice(index, 1)
  // Renumber remaining items
  formData.value.items.forEach((item: any, i: number) => {
    item.line_number = i + 1
  })
}

// Load existing inventory for a template
async function loadExistingInventoryForTemplate(templateId: number) {
  try {
    const { data } = await supabase
      .from('material_inventory')
      .select('material_template_id, dimension_id')
      .eq('project_id', projectId.value)
      .eq('material_template_id', templateId)
      .eq('is_active', true)
    
    if (data) {
      // Clear existing entries for this template
      const newSet = new Set(existingInventory.value)
      // Remove old entries for this template
      for (const key of newSet) {
        if (key.startsWith(`${templateId}-`)) {
          newSet.delete(key)
        }
      }
      // Add new entries
      data.forEach(item => {
        const key = `${item.material_template_id}-${item.dimension_id || 0}`
        newSet.add(key)
      })
      existingInventory.value = newSet
    }
  } catch (error) {
    console.error('Error loading existing inventory:', error)
  }
}

// Handle template selection
async function handleTemplateSelect(index: number, template: MaterialTemplate) {
  const item = formData.value.items[index]
  if (!item) return
  
  item.material_template_id = template.id
  
  // Load existing inventory for this template
  await loadExistingInventoryForTemplate(template.id)
  
  // Check if template has dimension group
  if (template.dimension_group_id && template.dimension_group) {
    item.dimension_group_id = template.dimension_group_id
    item.dimension_group_name = template.dimension_group.group_name || ''
    
    // Load dimensions for this group
    try {
      const dimensions = await getDimensionsByGroup(template.dimension_group_id)
      item.availableDimensions = dimensions
      item.selectedDimensions = [] // Reset selection
    } catch (error) {
      console.error('Error loading dimensions:', error)
    }
  } else {
    // No dimensions
    item.dimension_group_id = null
    item.dimension_group_name = ''
    item.availableDimensions = []
    item.selectedDimensions = []
  }
}

function handleMaterialCodeSelect(index: number, code: any) {
  const item = formData.value.items[index]
  if (!item) return
  item.material_code_id = code.id
  console.log('Selected material code:', code, 'for item', index)
}

function handleBrandSelect(index: number, brand: Brand) {
  const item = formData.value.items[index]
  if (!item) return
  item.brand_id = brand.id
  console.log('Selected brand:', brand, 'for item', index)
}

function handleUnitSelect(index: number, unit: any) {
  const item = formData.value.items[index]
  if (!item) return
  item.unit_id = unit.id
  console.log('Selected unit:', unit, 'for item', index)
}

function formatDimensionDisplay(dimension: Dimension): string {
  const parts = [dimension.size_1, dimension.size_2, dimension.size_3].filter(Boolean)
  return parts.join(' / ')
}

function getFilteredDimensions(item: any): Dimension[] {
  if (!item.dimensionSearch || item.dimensionSearch.trim() === '') {
    return item.availableDimensions
  }
  
  // Split search into multiple words and filter by all words
  const searchWords = item.dimensionSearch.toLowerCase().trim().split(/\s+/)
  
  return item.availableDimensions.filter((dim: Dimension) => {
    const displayText = formatDimensionDisplay(dim).toLowerCase()
    // Check if all search words are present in the dimension text
    return searchWords.every((word: string) => displayText.includes(word))
  })
}

function isInInventory(templateId: number | null, dimensionId: number): boolean {
  if (!templateId) return false
  const key = `${templateId}-${dimensionId}`
  return existingInventory.value.has(key)
}

async function handleSave() {
  if (!canProceed.value || isSaving.value) return
  
  isSaving.value = true
  
  try {
    // Build API payload
    const apiItems: AddToInventoryItem[] = formData.value.items.map((item: any) => ({
      material_template_id: item.material_template_id,
      dimension_ids: item.dimension_group_id && item.selectedDimensions.length > 0 
        ? item.selectedDimensions 
        : [0], // If no dimension group, use [0] to create one record
      store_id: formData.value.store_id, // UUID string, don't parse
      material_code_id: item.material_code_id || null,
      brand_id: item.brand_id || null,
      specific_detail: item.specific_detail || null,
      unit_of_measure: item.unit_of_measure || null
    }))

    console.log('Saving materials to inventory:', apiItems)
    
    const result = await addMaterialsToInventory(projectId.value, apiItems)
    
    if (result.success > 0) {
      alert(`Successfully added ${result.success} material(s) to inventory!${result.failed > 0 ? `\n${result.failed} failed: ${result.errors.join(', ')}` : ''}`)
      router.push('/materials')
    } else {
      alert(`Failed to add materials:\n${result.errors.join('\n')}`)
    }
  } catch (error) {
    console.error('Error saving to inventory:', error)
    alert('Error saving to inventory. Please try again.')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await loadStores()
  // TODO: Load existing inventory for indicators
})
</script>
