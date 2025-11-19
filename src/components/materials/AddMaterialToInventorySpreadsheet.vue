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

    <!-- Excel-like Spreadsheet -->
    <div :class="{ 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6 flex flex-col': isFullscreen }">
      <div class="flex items-center justify-between mb-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Materials <span class="text-red-500">*</span>
        </label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="toggleFullscreen"
            class="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
          >
            <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            @click="addRow"
            class="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
        </div>
      </div>

      <!-- Top Filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Material Group</label>
          <select
            v-model="materialGroupFilter"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Groups</option>
            <option v-for="group in uniqueMaterialGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search Keywords (comma separated)</label>
          <input
            v-model="materialSearchFilter"
            type="text"
            placeholder="Enter keywords..."
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <!-- Spreadsheet Table -->
      <div :class="['overflow-auto border border-gray-300 dark:border-gray-600 rounded-md', isFullscreen ? 'flex-1' : '']">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 w-8">#</th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 300px">
                MATERIAL <span class="text-red-500">*</span>
              </th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 250px">
                DIMENSION <span class="text-red-500">*</span>
              </th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 150px">
                MATERIAL CODE
              </th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 200px">
                SPECIFIC DETAIL
              </th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 180px">
                BRAND
              </th>
              <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600" style="min-width: 120px">
                UNIT <span class="text-red-500">*</span>
              </th>
              <th class="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 w-12">
                
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="formData.items.length === 0">
              <td colspan="8" class="px-2 py-8 text-center text-gray-500 dark:text-gray-400">
                No items. Click "Add Row" to add materials.
              </td>
            </tr>
            <tr
              v-for="(item, index) in formData.items"
              :key="index"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              <!-- Line Number -->
              <td class="px-2 py-1 text-gray-600 dark:text-gray-400 align-top">
                {{ index + 1 }}
              </td>

              <!-- Material Column -->
              <td class="px-2 py-1 align-top">
                <div class="relative">
                  <input
                    v-model="materialSearchInputs[index]"
                    :ref="el => materialInputRefs[index] = el"
                    type="text"
                    @focus="openMaterialDropdown(index)"
                    @input="filterMaterials(index)"
                    :placeholder="item.material_template_id ? '' : 'Type to search material...'"
                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                      :key="material.material_template_id"
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
                        Group: {{ material.material_group }}
                      </div>
                    </div>
                    <div v-if="getFilteredMaterialsForRow(index).length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
                      No materials found
                    </div>
                  </div>
                </div>
              </td>

              <!-- Dimension Column (Multi-select) -->
              <td class="px-2 py-1 align-top">
                <div class="relative">
                  <input
                    v-model="dimensionSearchInputs[index]"
                    :ref="el => dimensionInputRefs[index] = el"
                    type="text"
                    @focus="openDimensionDropdown(index)"
                    @input="filterDimensions(index)"
                    :placeholder="item.material_template_id ? 'Select dimensions...' : 'Select material first'"
                    :disabled="!item.material_template_id"
                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  />

                  <!-- Selected Dimensions Display -->
                  <div v-if="item.selectedDimensions.length > 0 && !dimensionDropdownOpen[index]" class="absolute inset-0 px-2 py-1 bg-white dark:bg-gray-700 pointer-events-none">
                    <div class="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {{ item.selectedDimensions.length }} dimension(s) selected
                    </div>
                  </div>

                  <!-- Dimension Dropdown (Multi-select with checkboxes) -->
                  <div
                    v-if="dimensionDropdownOpen[index]"
                    class="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                  >
                    <div
                      v-for="dimension in getFilteredDimensionsForRow(index)"
                      :key="dimension.id"
                      @click="toggleDimension(index, dimension.id)"
                      class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                      :class="{ 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500': isInInventory(item.material_template_id, dimension.id) }"
                    >
                      <input
                        type="checkbox"
                        :checked="item.selectedDimensions.includes(dimension.id)"
                        class="w-4 h-4 text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <div class="flex-1">
                        <div class="text-sm text-gray-900 dark:text-gray-100">
                          {{ dimension.specific_detail }}
                        </div>
                        <div v-if="isInInventory(item.material_template_id, dimension.id)" class="text-xs text-green-600 dark:text-green-400">
                          ✓ Already in inventory
                        </div>
                      </div>
                    </div>
                    <div v-if="getFilteredDimensionsForRow(index).length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
                      No dimensions available
                    </div>
                  </div>
                </div>
              </td>

              <!-- Material Code Column -->
              <td class="px-2 py-1 align-top">
                <MaterialCodeSelector
                  v-model="item.material_code_id"
                  :project-id="projectId"
                  @select="handleMaterialCodeSelect(index, $event)"
                />
              </td>

              <!-- Specific Detail Column -->
              <td class="px-2 py-1 align-top">
                <input
                  v-model="item.specific_detail"
                  type="text"
                  placeholder="e.g., Hot dip, Red color"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </td>

              <!-- Brand Column -->
              <td class="px-2 py-1 align-top">
                <BrandSelector
                  v-model="item.brand_id"
                  @select="handleBrandSelect(index, $event)"
                />
              </td>

              <!-- Unit Column -->
              <td class="px-2 py-1 align-top">
                <UnitSelector
                  v-model="item.unit_of_measure"
                  :project-id="projectId"
                  @select="handleUnitSelect(index, $event)"
                />
              </td>

              <!-- Remove Button -->
              <td class="px-2 py-1 text-center align-top">
                <button
                  type="button"
                  @click="removeRow(index)"
                  class="text-red-600 hover:text-red-800 p-1"
                  title="Remove row"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
        class="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <svg v-if="isSaving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isSaving ? 'Saving...' : 'Save to Inventory' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMaterialInventory } from '@/composables/useMaterialInventory'
import { useProjectStore } from '@/stores/projectStore'
import { supabase } from '@/lib/supabase'
import { addMaterialsToInventory } from '@/lib/api/materialSystem'
import type { AddToInventoryItem } from '@/types/materialSystem'
import BrandSelector from './BrandSelector.vue'
import UnitSelector from './receive/UnitSelector.vue'
import MaterialCodeSelector from './receive/MaterialCodeSelector.vue'

const router = useRouter()
const projectStore = useProjectStore()
const { selectedProject } = storeToRefs(projectStore)
const projectId = computed(() => selectedProject.value?.id || '')

const { stores, loadStores } = useMaterialInventory(projectId.value)

interface InventoryItem {
  line_number: number
  material_template_id: number | null
  material_description: string
  material_description_th: string
  material_group: string
  selectedDimensions: number[]
  material_code_id: string | null
  specific_detail: string
  brand_id: string | null
  unit_of_measure: string
  unit_id: string | null
}

interface MaterialOption {
  material_template_id: number
  material_description: string
  material_description_th: string
  material_group: string
}

interface DimensionOption {
  id: number
  dimension_id: number
  specific_detail: string
}

const formData = ref({
  store_id: '',
  items: [] as InventoryItem[]
})

const isSaving = ref(false)

// Material dropdown state
const allMaterials = ref<MaterialOption[]>([])
const materialGroupFilter = ref('')
const materialSearchFilter = ref('')
const materialDropdownOpen = reactive<Record<number, boolean>>({})
const materialSearchInputs = reactive<Record<number, string>>({})
const materialInputRefs = reactive<Record<number, any>>({})

// Dimension dropdown state
const dimensionsByTemplate = reactive<Record<number, DimensionOption[]>>({})
const dimensionDropdownOpen = reactive<Record<number, boolean>>({})
const dimensionSearchInputs = reactive<Record<number, string>>({})
const dimensionInputRefs = reactive<Record<number, any>>({})

// Track existing inventory
const existingInventory = ref<Set<string>>(new Set())

// Fullscreen state
const isFullscreen = ref(false)

// Computed
const uniqueMaterialGroups = computed(() => {
  const groups = new Set(allMaterials.value.map(m => m.material_group))
  return Array.from(groups).sort()
})

const filteredMaterials = computed(() => {
  let filtered = allMaterials.value

  if (materialGroupFilter.value) {
    filtered = filtered.filter(m => m.material_group === materialGroupFilter.value)
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
        material.material_group
      ].filter(Boolean).join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  return filtered
})

const canProceed = computed(() => {
  return formData.value.store_id &&
    formData.value.items.length > 0 &&
    formData.value.items.every((item: InventoryItem) => 
      item.material_template_id &&
      item.selectedDimensions.length > 0 &&
      item.unit_of_measure
    )
})

// Functions
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function getFilteredMaterialsForRow(index: number): MaterialOption[] {
  const searchInput = materialSearchInputs[index]?.toLowerCase() || ''
  
  if (!searchInput) return filteredMaterials.value

  return filteredMaterials.value.filter(material => {
    const searchableText = [
      material.material_description,
      material.material_description_th,
      material.material_group
    ].filter(Boolean).join(' ').toLowerCase()

    return searchableText.includes(searchInput)
  })
}

function getFilteredDimensionsForRow(index: number): DimensionOption[] {
  const item = formData.value.items[index]
  if (!item?.material_template_id) return []

  const dimensions = dimensionsByTemplate[item.material_template_id] || []
  const searchInput = dimensionSearchInputs[index]?.toLowerCase() || ''

  if (!searchInput) return dimensions

  const searchTerms = searchInput.split(/\s+/).filter(Boolean)
  
  return dimensions.filter(dimension => {
    const searchableText = dimension.specific_detail.toLowerCase()
    return searchTerms.every(term => searchableText.includes(term))
  })
}

function addRow() {
  const newRow: InventoryItem = {
    line_number: formData.value.items.length + 1,
    material_template_id: null,
    material_description: '',
    material_description_th: '',
    material_group: '',
    selectedDimensions: [],
    material_code_id: null,
    specific_detail: '',
    brand_id: null,
    unit_of_measure: '',
    unit_id: null
  }
  
  formData.value.items.push(newRow)
}

function removeRow(index: number) {
  formData.value.items.splice(index, 1)
  // Renumber items
  formData.value.items.forEach((item, i) => {
    item.line_number = i + 1
  })
  
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
  const item = formData.value.items[index]
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
  const item = formData.value.items[index]
  if (!item) return
  
  item.material_template_id = material.material_template_id
  item.material_description = material.material_description
  item.material_description_th = material.material_description_th
  item.material_group = material.material_group
  item.selectedDimensions = [] // Reset dimensions when material changes
  
  materialDropdownOpen[index] = false
  materialSearchInputs[index] = ''
  
  // Load existing inventory for this template
  loadExistingInventoryForTemplate(material.material_template_id)
  
  // Auto-open dimension dropdown
  setTimeout(() => {
    loadDimensionsForTemplate(material.material_template_id)
    dimensionInputRefs[index]?.focus()
    openDimensionDropdown(index)
  }, 100)
}

function toggleDimension(index: number, dimensionId: number) {
  const item = formData.value.items[index]
  if (!item) return
  const dimIndex = item.selectedDimensions.indexOf(dimensionId)
  
  if (dimIndex > -1) {
    item.selectedDimensions.splice(dimIndex, 1)
  } else {
    item.selectedDimensions.push(dimensionId)
  }
}

function handleMaterialCodeSelect(index: number, code: any) {
  const item = formData.value.items[index]
  if (!item) return
  item.material_code_id = code.id
}

function handleBrandSelect(index: number, brand: any) {
  const item = formData.value.items[index]
  if (!item) return
  item.brand_id = brand.id
}

function handleUnitSelect(index: number, unit: any) {
  const item = formData.value.items[index]
  if (!item) return
  item.unit_id = unit.id
}

function isInInventory(templateId: number | null, dimensionId: number): boolean {
  if (!templateId) return false
  const key = `${templateId}-${dimensionId}`
  return existingInventory.value.has(key)
}

async function loadMaterials() {
  if (!formData.value.store_id) return

  try {
    const { data, error } = await supabase
      .from('material_templates')
      .select(`
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
        title_5_th,
        material_groups(group_name, group_name_th)
      `)
      .eq('is_active', true)
      .order('id')

    if (error) throw error

    allMaterials.value = (data || []).map((template: any) => {
      const englishDesc = [
        template.title_1,
        template.title_2,
        template.title_3,
        template.title_4,
        template.title_5
      ].filter(Boolean).join(' ')

      const thaiDesc = [
        template.title_1_th,
        template.title_2_th,
        template.title_3_th,
        template.title_4_th,
        template.title_5_th
      ].filter(Boolean).join(' ')

      const groupName = template.material_groups?.group_name_th || 
                       template.material_groups?.group_name || 
                       'Other'

      return {
        material_template_id: template.id,
        material_description: englishDesc,
        material_description_th: thaiDesc,
        material_group: groupName
      }
    })
  } catch (error) {
    console.error('Error loading materials:', error)
  }
}

async function loadDimensionsForTemplate(templateId: number) {
  if (dimensionsByTemplate[templateId]) return

  try {
    // First, get the dimension_group_id from the template
    const { data: templateData, error: templateError } = await supabase
      .from('material_templates')
      .select('dimension_group_id')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    if (!templateData?.dimension_group_id) {
      dimensionsByTemplate[templateId] = []
      return
    }

    // Load all dimensions for this dimension group
    const { data, error } = await supabase
      .from('dimensions')
      .select('id, size_1, size_2, size_3')
      .eq('dimension_group_id', templateData.dimension_group_id)
      .eq('is_active', true)
      .order('size_1')

    if (error) throw error

    dimensionsByTemplate[templateId] = (data || []).map((dim: any) => {
      const sizes = [dim.size_1, dim.size_2, dim.size_3].filter(Boolean)
      const displayDetail = sizes.join(' / ') || 'No dimension'
      
      return {
        id: dim.id,
        dimension_id: dim.id,
        specific_detail: displayDetail
      }
    })
  } catch (error) {
    console.error('Error loading dimensions:', error)
    dimensionsByTemplate[templateId] = []
  }
}

async function loadExistingInventoryForTemplate(templateId: number) {
  try {
    const { data } = await supabase
      .from('material_inventory')
      .select('material_template_id, dimension_id')
      .eq('project_id', projectId.value)
      .eq('store_id', formData.value.store_id)
      .eq('material_template_id', templateId)
      .eq('is_active', true)
    
    if (data) {
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

async function handleSave() {
  if (!canProceed.value || isSaving.value) return
  
  isSaving.value = true
  
  try {
    const apiItems: AddToInventoryItem[] = formData.value.items.flatMap((item: InventoryItem) => 
      item.selectedDimensions.map(dimensionId => ({
        material_template_id: item.material_template_id!,
        dimension_ids: [dimensionId],
        store_id: formData.value.store_id,
        material_code_id: item.material_code_id || null,
        brand_id: item.brand_id || null,
        specific_detail: item.specific_detail || null,
        unit_of_measure: item.unit_of_measure || null
      }))
    )

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

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    Object.keys(materialDropdownOpen).forEach(key => {
      materialDropdownOpen[Number(key)] = false
    })
    Object.keys(dimensionDropdownOpen).forEach(key => {
      dimensionDropdownOpen[Number(key)] = false
    })
  }
}

// Watch for store changes
import { watch } from 'vue'
watch(() => formData.value.store_id, async (newStoreId) => {
  if (newStoreId) {
    await loadMaterials()
    // Clear dimension cache
    Object.keys(dimensionsByTemplate).forEach(key => {
      delete dimensionsByTemplate[Number(key)]
    })
    existingInventory.value.clear()
  }
})

onMounted(async () => {
  await loadStores()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
