<template>
  <div 
    :class="[
      'border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden',
      isFullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-800 flex flex-col' : ''
    ]"
  >
    <!-- Header -->
    <div class="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between shrink-0">
      <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
        Excel-like Spreadsheet Editor
      </h3>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="toggleFullscreen"
          class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        >
          <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ isFullscreen ? 'Exit' : 'Fullscreen' }}
        </button>
        <button
          type="button"
          @click="addRow"
          class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Row
        </button>
      </div>
    </div>

    <!-- Material Selection Filters -->
    <div v-if="!props.readonly" class="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 shrink-0">
      <div class="grid grid-cols-3 gap-3">
        <!-- Filter 1: Material Group -->
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Material Group
          </label>
          <select
            v-model="materialGroupFilter"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Groups</option>
            <option v-for="group in uniqueMaterialGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>

        <!-- Filter 2: Material Code -->
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Material Code
          </label>
          <select
            v-model="materialCodeFilter"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Codes</option>
            <option v-for="code in uniqueMaterialCodes" :key="code" :value="code">
              {{ code }}
            </option>
          </select>
        </div>

        <!-- Filter 3: Search Keywords -->
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Keywords (comma separated)
          </label>
          <input
            v-model="materialSearchFilter"
            type="text"
            placeholder="Enter keywords..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div :class="['overflow-auto', isFullscreen ? 'flex-1' : '']">
      <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
              #
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[350px]">
              Material <span class="text-red-500">*</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
              Dimension <span class="text-red-500">*</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
              Quantity <span class="text-red-500">*</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
              Remark
            </th>
            <th v-if="!props.readonly" class="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(item, index) in props.modelValue"
            :key="index"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {{ index + 1 }}
            </td>
            
            <!-- Material Column with Searchable Dropdown -->
            <td class="px-3 py-2 relative">
              <div class="relative">
                <input
                  :ref="el => { if (el) materialInputRefs[index] = el }"
                  v-model="materialSearchInputs[index]"
                  type="text"
                  :disabled="props.readonly"
                  @focus="!props.readonly && openMaterialDropdown(index)"
                  @input="filterMaterials(index)"
                  :placeholder="item.material_template_id ? '' : 'Type to search material...'"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                
                <!-- Selected Material Display -->
                <div v-if="item.material_template_id && !materialDropdownOpen[index]" class="absolute inset-0 px-2 py-1 bg-white dark:bg-gray-700 pointer-events-none">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ item.material_description_th || item.material_description }}
                  </div>
                </div>

                <!-- Material Dropdown -->
                <div
                  v-if="materialDropdownOpen[index]"
                  class="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                >
                  <div
                    v-for="material in getFilteredMaterialsForRow(index)"
                    :key="material.id"
                    @click="selectMaterial(index, material)"
                    class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700"
                  >
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ material.material_description_th }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">
                      {{ material.material_description }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Code: {{ material.material_code }} • Brand: {{ material.brand }} • {{ material.variant_count }} variant(s)
                    </div>
                  </div>
                  <div v-if="getFilteredMaterialsForRow(index).length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
                    No materials found
                  </div>
                </div>
              </div>
            </td>

            <!-- Dimension Column with Searchable Dropdown -->
            <td class="px-3 py-2 relative">
              <div class="relative">
                <input
                  :ref="el => { if (el) dimensionInputRefs[index] = el }"
                  v-model="dimensionSearchInputs[index]"
                  type="text"
                  :disabled="!item.material_template_id || props.readonly"
                  @focus="!props.readonly && openDimensionDropdown(index)"
                  @input="filterDimensions(index)"
                  :placeholder="item.material_template_id ? (item.material_inventory_id ? '' : 'Type to search dimension...') : 'Select material first'"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                
                <!-- Selected Dimension Display -->
                <div v-if="item.material_inventory_id && !dimensionDropdownOpen[index]" class="absolute inset-0 px-2 py-1 bg-white dark:bg-gray-700 pointer-events-none">
                  <div class="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {{ item.specific_detail }}
                  </div>
                </div>

                <!-- Dimension Dropdown -->
                <div
                  v-if="dimensionDropdownOpen[index] && item.material_template_id"
                  class="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                >
                  <div
                    v-for="dimension in getFilteredDimensionsForRow(index)"
                    :key="dimension.id"
                    @click="selectDimension(index, dimension)"
                    class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex justify-between items-start">
                      <div class="text-sm text-gray-900 dark:text-gray-100">
                        {{ dimension.specific_detail }}
                      </div>
                      <div :class="['text-xs px-2 py-0.5 rounded', dimension.current_quantity > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800']">
                        {{ dimension.current_quantity }} {{ dimension.unit_of_measure }}
                      </div>
                    </div>
                  </div>
                  <div v-if="getFilteredDimensionsForRow(index).length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
                    No dimensions found
                  </div>
                </div>
              </div>
            </td>

            <!-- Quantity Column -->
            <td class="px-3 py-2">
              <input
                v-model.number="item.prepared_quantity"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                :disabled="!item.material_inventory_id || props.readonly"
                @input="updateItem(index)"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </td>

            <!-- Remark Column -->
            <td class="px-3 py-2">
              <input
                v-model="item.remark"
                type="text"
                placeholder="Optional note"
                :disabled="props.readonly"
                @input="updateItem(index)"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </td>

            <!-- Actions -->
            <td v-if="!props.readonly" class="px-3 py-2">
              <button
                type="button"
                @click="removeRow(index)"
                class="text-red-600 hover:text-red-800 dark:text-red-400"
                title="Remove row"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>

          <tr v-if="props.modelValue.length === 0">
            <td colspan="6" class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No items. Click "Add Row" to add materials.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'

interface ReceiveItem {
  line_number?: number
  material_inventory_id: string | null
  material_template_id?: number | null
  dimension_id: number | null
  material_code: string
  brand: string
  material_description: string
  material_description_th: string
  specific_detail: string
  prepared_quantity?: number
  remark: string
  current_quantity: number
  unit_of_measure: string
}

interface MaterialOption {
  id: string
  material_template_id: number
  material_code: string
  brand: string
  material_description: string
  material_description_th: string
  variant_count: number
  material_group: string
}

interface DimensionOption {
  id: string
  dimension_id: number
  specific_detail: string
  current_quantity: number
  unit_of_measure: string
}

interface Props {
  modelValue: ReceiveItem[]
  projectId: string
  storeId: string
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: ReceiveItem[]): void
}>()

// State
const isFullscreen = ref(false)
const materialGroupFilter = ref('')
const materialCodeFilter = ref('')
const materialSearchFilter = ref('')

// Dropdown states
const materialDropdownOpen = reactive<Record<number, boolean>>({})
const dimensionDropdownOpen = reactive<Record<number, boolean>>({})
const materialSearchInputs = reactive<Record<number, string>>({})
const dimensionSearchInputs = reactive<Record<number, string>>({})
const materialInputRefs = reactive<Record<number, any>>({})
const dimensionInputRefs = reactive<Record<number, any>>({})

// Data
const allMaterials = ref<MaterialOption[]>([])
const dimensionsByTemplate = reactive<Record<number, DimensionOption[]>>({})

// Load materials
onMounted(async () => {
  if (props.storeId && props.storeId.trim() !== '') {
    await loadMaterials()
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for store changes and reload materials
watch(() => props.storeId, async (newStoreId, oldStoreId) => {
  if (newStoreId && newStoreId.trim() !== '' && newStoreId !== oldStoreId) {
    console.log('Store changed, reloading materials for store:', newStoreId)
    await loadMaterials()
    // Clear dimension cache when store changes
    Object.keys(dimensionsByTemplate).forEach(key => {
      delete dimensionsByTemplate[Number(key)]
    })
  }
})

async function loadMaterials() {
  try {
    let query = supabase
      .from('material_inventory')
      .select(`
        id, 
        material_template_id, 
        dimension_id, 
        current_quantity, 
        unit_of_measure,
        material_codes!material_inventory_material_code_id_fkey(material_code),
        brands!material_inventory_brand_id_fkey(brand_title),
        material_templates!inner(
          material_group_id,
          title_1,
          title_2,
          title_3,
          title_4,
          title_5,
          title_1_th,
          title_2_th,
          title_3_th,
          title_4_th,
          title_5_th,
          material_groups(group_name, group_name_th)
        )
      `)
      .eq('project_id', props.projectId)
      .limit(5000) // Supabase default is 1000, increase for large inventories

    if (props.storeId && props.storeId.trim() !== '') {
      query = query.eq('store_id', props.storeId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by material_template_id
    const materialsMap = new Map<number, MaterialOption>()
    
    data?.forEach((item: any) => {
      if (!materialsMap.has(item.material_template_id)) {
        const materialCode = item.material_codes?.material_code || ''
        const brandTitle = item.brands?.brand_title || ''
        const groupName = item.material_templates?.material_groups?.group_name_th || 
                         item.material_templates?.material_groups?.group_name || 
                         'Other'

        // Build material description WITHOUT dimensions from template titles
        const englishDesc = [
          item.material_templates?.title_1,
          item.material_templates?.title_2,
          item.material_templates?.title_3,
          item.material_templates?.title_4,
          item.material_templates?.title_5
        ].filter(Boolean).join(' ')

        const thaiDesc = [
          item.material_templates?.title_1_th,
          item.material_templates?.title_2_th,
          item.material_templates?.title_3_th,
          item.material_templates?.title_4_th,
          item.material_templates?.title_5_th
        ].filter(Boolean).join(' ')

        materialsMap.set(item.material_template_id, {
          id: item.id,
          material_template_id: item.material_template_id,
          material_code: materialCode,
          brand: brandTitle,
          material_description: englishDesc,
          material_description_th: thaiDesc,
          variant_count: 0,
          material_group: groupName
        })
      }
      materialsMap.get(item.material_template_id)!.variant_count++
    })

    allMaterials.value = Array.from(materialsMap.values())
  } catch (error) {
    console.error('Error loading materials:', error)
  }
}

async function loadDimensionsForTemplate(templateId: number) {
  if (dimensionsByTemplate[templateId]) return

  try {
    let query = supabase
      .from('material_inventory')
      .select(`
        id, 
        dimension_id, 
        specific_detail, 
        current_quantity, 
        unit_of_measure,
        dimensions(size_1, size_2, size_3)
      `)
      .eq('project_id', props.projectId)
      .eq('material_template_id', templateId)

    if (props.storeId && props.storeId.trim() !== '') {
      query = query.eq('store_id', props.storeId)
    }

    const { data, error } = await query

    if (error) throw error

    // Build dimension display from dimensions table if specific_detail is empty
    dimensionsByTemplate[templateId] = (data || []).map((item: any) => {
      let displayDetail = item.specific_detail
      
      // If specific_detail is empty, build from dimensions
      if (!displayDetail && item.dimensions) {
        const sizes = [
          item.dimensions.size_1,
          item.dimensions.size_2,
          item.dimensions.size_3
        ].filter(Boolean)
        displayDetail = sizes.join(' / ') || 'No dimension'
      }
      
      return {
        id: item.id,
        dimension_id: item.dimension_id,
        specific_detail: displayDetail || 'No dimension',
        current_quantity: item.current_quantity || 0,
        unit_of_measure: item.unit_of_measure || 'PCS'
      }
    })
  } catch (error) {
    console.error('Error loading dimensions:', error)
    dimensionsByTemplate[templateId] = []
  }
}

// Computed
const uniqueMaterialGroups = computed(() => {
  const groups = new Set(allMaterials.value.map(m => m.material_group))
  return Array.from(groups).sort()
})

const uniqueMaterialCodes = computed(() => {
  const codes = new Set(allMaterials.value.map(m => m.material_code).filter(Boolean))
  return Array.from(codes).sort()
})

const filteredMaterials = computed(() => {
  let filtered = allMaterials.value

  if (materialGroupFilter.value) {
    filtered = filtered.filter(m => m.material_group === materialGroupFilter.value)
  }

  if (materialCodeFilter.value) {
    filtered = filtered.filter(m => m.material_code === materialCodeFilter.value)
  }

  if (materialSearchFilter.value) {
    const searchTerms = materialSearchFilter.value
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0)

    filtered = filtered.filter(material => {
      const searchableText = [
        material.material_description,
        material.material_description_th,
        material.material_code,
        material.brand
      ].filter(Boolean).join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  return filtered
})

function getFilteredMaterialsForRow(index: number): MaterialOption[] {
  const searchInput = materialSearchInputs[index]?.toLowerCase() || ''
  
  if (!searchInput) return filteredMaterials.value

  return filteredMaterials.value.filter(material => {
    const searchableText = [
      material.material_description,
      material.material_description_th,
      material.material_code,
      material.brand
    ].filter(Boolean).join(' ').toLowerCase()

    return searchableText.includes(searchInput)
  })
}

function getFilteredDimensionsForRow(index: number): DimensionOption[] {
  const item = props.modelValue[index]
  if (!item?.material_template_id) return []

  const dimensions = dimensionsByTemplate[item.material_template_id] || []
  const searchInput = dimensionSearchInputs[index]?.toLowerCase() || ''

  if (!searchInput) return dimensions

  // Multi-word search
  const searchTerms = searchInput.split(/\s+/).filter(Boolean)
  
  return dimensions.filter(dimension => {
    const searchableText = dimension.specific_detail.toLowerCase()
    return searchTerms.every(term => searchableText.includes(term))
  })
}

// Functions
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function addRow() {
  const newRow: ReceiveItem = {
    line_number: props.modelValue.length + 1,
    material_inventory_id: null,
    material_template_id: null,
    dimension_id: null,
    material_code: '',
    brand: '',
    material_description: '',
    material_description_th: '',
    specific_detail: '',
    prepared_quantity: 0,
    remark: '',
    current_quantity: 0,
    unit_of_measure: 'PCS'
  }
  
  emit('update:modelValue', [...props.modelValue, newRow])
}

function removeRow(index: number) {
  const newItems = props.modelValue.filter((_, i) => i !== index)
  // Renumber items
  newItems.forEach((item, i) => {
    item.line_number = i + 1
  })
  emit('update:modelValue', newItems)
  
  // Clean up dropdown states
  delete materialDropdownOpen[index]
  delete dimensionDropdownOpen[index]
  delete materialSearchInputs[index]
  delete dimensionSearchInputs[index]
}

function openMaterialDropdown(index: number) {
  materialDropdownOpen[index] = true
  Object.keys(materialDropdownOpen).forEach(key => {
    const keyNum = Number(key)
    if (keyNum !== index) {
      materialDropdownOpen[keyNum] = false
    }
  })
  Object.keys(dimensionDropdownOpen).forEach(key => {
    dimensionDropdownOpen[Number(key)] = false
  })
}

function openDimensionDropdown(index: number) {
  const item = props.modelValue[index]
  if (!item?.material_template_id) return

  dimensionDropdownOpen[index] = true
  loadDimensionsForTemplate(item.material_template_id)
  
  Object.keys(dimensionDropdownOpen).forEach(key => {
    const keyNum = Number(key)
    if (keyNum !== index) {
      dimensionDropdownOpen[keyNum] = false
    }
  })
  Object.keys(materialDropdownOpen).forEach(key => {
    materialDropdownOpen[Number(key)] = false
  })
}

function filterMaterials(_index: number) {
  // Dropdown already open, just filtering
}

function filterDimensions(_index: number) {
  // Dropdown already open, just filtering
}

function selectMaterial(index: number, material: MaterialOption) {
  const newItems = [...props.modelValue]
  const existing = newItems[index]
  if (!existing) return
  newItems[index] = {
    ...existing,
    material_template_id: material.material_template_id,
    material_code: material.material_code,
    brand: material.brand,
    material_description: material.material_description,
    material_description_th: material.material_description_th,
    // Reset dimension when material changes
    material_inventory_id: null,
    dimension_id: null,
    specific_detail: '',
    current_quantity: 0,
    unit_of_measure: 'PCS',
    prepared_quantity: existing.prepared_quantity || 0
  } as ReceiveItem
  
  emit('update:modelValue', newItems)
  materialDropdownOpen[index] = false
  materialSearchInputs[index] = ''
  
  // Auto-open dimension dropdown
  setTimeout(() => {
    loadDimensionsForTemplate(material.material_template_id)
    dimensionInputRefs[index]?.focus()
    openDimensionDropdown(index)
  }, 100)
}

function selectDimension(index: number, dimension: DimensionOption) {
  const newItems = [...props.modelValue]
  const existing = newItems[index]
  if (!existing) return
  newItems[index] = {
    ...existing,
    material_inventory_id: dimension.id,
    dimension_id: dimension.dimension_id,
    specific_detail: dimension.specific_detail,
    current_quantity: dimension.current_quantity,
    unit_of_measure: dimension.unit_of_measure,
    prepared_quantity: existing.prepared_quantity || 0
  } as ReceiveItem
  
  emit('update:modelValue', newItems)
  dimensionDropdownOpen[index] = false
  dimensionSearchInputs[index] = ''
}

function updateItem(_index: number) {
  emit('update:modelValue', [...props.modelValue])
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  
  // Check if click is outside all dropdowns
  if (!target.closest('td')) {
    Object.keys(materialDropdownOpen).forEach(key => {
      materialDropdownOpen[Number(key)] = false
    })
    Object.keys(dimensionDropdownOpen).forEach(key => {
      dimensionDropdownOpen[Number(key)] = false
    })
  }
}
</script>
