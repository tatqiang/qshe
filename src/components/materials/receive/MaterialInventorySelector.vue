<template>
  <div class="space-y-2">
    <!-- Step 1: Material Selection -->
    <div class="relative">
      <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
        1. Select Material
      </label>
      
      <!-- Show selected material in green box -->
      <div v-if="selectedMaterial && !showMaterialDropdown" class="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-md mb-2">
        <div class="flex items-center justify-between">
          <div>
            <div v-if="selectedMaterial.base_description_th" class="font-medium text-sm text-gray-900 dark:text-gray-100">
              {{ selectedMaterial.base_description_th }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400" :class="{ 'mt-1': selectedMaterial.base_description_th }">
              {{ selectedMaterial.base_description }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span v-if="selectedMaterial.material_code">Code: {{ selectedMaterial.material_code }}</span>
              <span v-if="selectedMaterial.brand" class="ml-2">• Brand: {{ selectedMaterial.brand }}</span>
            </div>
          </div>
          <button
            type="button"
            @click="clearMaterialSelection"
            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            title="Change material"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Search box (only show when no material selected or dropdown is open) -->
      <div v-if="!selectedMaterial || showMaterialDropdown" @click="toggleMaterialDropdown" class="cursor-pointer">
        <input
          v-model="materialSearchQuery"
          @input="handleMaterialSearch"
          type="text"
          placeholder="Search material..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Material Dropdown -->
      <div
        v-if="showMaterialDropdown"
        class="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto"
      >
        <div v-if="loading" class="p-4 text-center text-gray-500">
          Loading materials...
        </div>
        
        <div v-else-if="groupedMaterials.length === 0" class="p-4 text-center text-gray-500">
          No materials found
        </div>
        
        <div v-else>
          <div
            v-for="material in groupedMaterials"
            :key="material.base_description"
            @click="selectMaterial(material)"
            class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
          >
            <!-- Thai description on top -->
            <div v-if="material.base_description_th" class="font-medium text-gray-900 dark:text-gray-100">
              {{ material.base_description_th }}
            </div>
            <!-- English description -->
            <div class="text-sm text-gray-600 dark:text-gray-400" :class="{ 'mt-1': material.base_description_th }">
              {{ material.base_description }}
            </div>
            <!-- Code, brand, and sizes -->
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span v-if="material.material_code">Code: {{ material.material_code }}</span>
              <span v-if="material.brand" class="ml-2">• Brand: {{ material.brand }}</span>
              <span class="ml-2 text-blue-600 dark:text-blue-400">• {{ material.variants.length }} size(s) available</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Dimension Selection (shown after material is selected) -->
    <div v-if="selectedMaterial && !selectedInventory" class="relative">
      <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
        2. Select Size/Dimension
      </label>
      
      <!-- Search box for dimensions -->
      <input
        v-model="dimensionSearchQuery"
        type="text"
        placeholder="Search dimensions..."
        class="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
      />
      
      <!-- Dimension Radio Buttons Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md max-h-64 overflow-y-auto">
        <div
          v-for="variant in filteredDimensionVariants"
          :key="variant.id"
          @click="selectDimension(variant)"
          class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        >
          <input
            type="radio"
            :id="`variant-${variant.id}`"
            :value="variant.id"
            :checked="false"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <label :for="`variant-${variant.id}`" class="flex-1 text-sm cursor-pointer">
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ variant.specific_detail || buildDimensionDisplay(variant.dimensions) }}
            </div>
            <div class="text-xs mt-0.5" :class="variant.current_quantity > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'">
              {{ variant.current_quantity || 0 }} {{ variant.unit_of_measure || 'PCS' }}
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Show selected dimension (after selection) -->
    <div v-if="selectedInventory" class="relative">
      <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
        2. Selected Size/Dimension
      </label>
      <div class="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-md">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-sm text-gray-900 dark:text-gray-100">
              {{ selectedInventory.specific_detail || buildDimensionDisplay(selectedInventory.dimensions) }}
            </div>
            <div class="text-xs mt-1 text-blue-600 dark:text-blue-400">
              Stock: {{ selectedInventory.current_quantity || 0 }} {{ selectedInventory.unit_of_measure || 'PCS' }}
            </div>
          </div>
          <button
            type="button"
            @click="clearDimensionSelection"
            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            title="Change selection"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

interface MaterialInventory {
  id: string
  material_template_id: number
  material_description: string
  material_description_th?: string
  current_quantity: number
  unit_of_measure: string
  specific_detail?: string
  material_codes?: {
    id: string
    material_code: string
  }
  brands?: {
    id: string
    brand_title: string
  }
  material_templates?: {
    id: number
    title_1: string
    title_2?: string
    title_3?: string
    title_4?: string
    title_5?: string
    title_1_th?: string
    title_2_th?: string
    title_3_th?: string
    title_4_th?: string
    title_5_th?: string
  }
  dimension_id?: number
  dimensions?: {
    size_1?: string
    size_2?: string
    size_3?: string
  }
}

interface GroupedMaterial {
  base_description: string
  base_description_th: string // Thai description
  material_code: string
  brand: string
  variants: MaterialInventory[]
}

const props = defineProps<{
  projectId: string
  storeId?: string
  modelValue?: string // inventory_id
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'select', inventory: MaterialInventory): void
}>()

const inventory = ref<MaterialInventory[]>([])
const materialSearchQuery = ref('')
const dimensionSearchQuery = ref('')
const showMaterialDropdown = ref(false)
const showDimensionDropdown = ref(false)
const loading = ref(false)
const selectedMaterial = ref<GroupedMaterial | null>(null)
const selectedInventory = ref<MaterialInventory | null>(null)

// Helper function to build material name from template titles
function buildMaterialName(template: any): string {
  const titles = [
    template?.title_1,
    template?.title_2,
    template?.title_3,
    template?.title_4,
    template?.title_5
  ].filter(Boolean)
  return titles.join(' | ') || 'Unknown'
}

// Helper function to build dimension display from dimension object
function buildDimensionDisplay(dimension: any): string {
  if (!dimension) return 'Standard'
  const sizes = [
    dimension.size_1,
    dimension.size_2,
    dimension.size_3
  ].filter(Boolean)
  return sizes.length > 0 ? sizes.join(' / ') : 'Standard'
}

// Group inventory by material_template_id
const groupedMaterials = computed(() => {
  const grouped = new Map<number, GroupedMaterial>()
  
  const itemsToGroup = materialSearchQuery.value 
    ? inventory.value.filter(item => {
        const templateName = buildMaterialName(item.material_templates).toLowerCase()
        const code = item.material_codes?.material_code?.toLowerCase() || ''
        const thaiDesc = item.material_description_th?.toLowerCase() || ''
        
        // Support comma-separated search terms
        const searchTerms = materialSearchQuery.value
          .toLowerCase()
          .split(',')
          .map(term => term.trim())
          .filter(term => term.length > 0)
        
        // Item matches if ALL search terms are found in template name, code, or Thai description
        return searchTerms.every(term => 
          templateName.includes(term) || code.includes(term) || thaiDesc.includes(term)
        )
      })
    : inventory.value
  
  itemsToGroup.forEach(item => {
    const templateId = item.material_template_id
    if (!templateId) return
    
    if (!grouped.has(templateId)) {
      // Build base description from template titles (English)
      const baseDescription = buildMaterialName(item.material_templates)
      
      // Build Thai description from template Thai titles (without dimensions)
      let baseDescriptionTh = ''
      if (item.material_templates) {
        const thaiTitles = [
          item.material_templates.title_1_th,
          item.material_templates.title_2_th,
          item.material_templates.title_3_th,
          item.material_templates.title_4_th,
          item.material_templates.title_5_th
        ].filter(Boolean)
        baseDescriptionTh = thaiTitles.join(' ')
      }
      
      grouped.set(templateId, {
        base_description: baseDescription,
        base_description_th: baseDescriptionTh,
        material_code: item.material_codes?.material_code || '',
        brand: item.brands?.brand_title || '',
        variants: []
      })
    }
    
    grouped.get(templateId)!.variants.push(item)
  })
  
  return Array.from(grouped.values())
})

// Filter dimensions based on search query
const filteredDimensionVariants = computed(() => {
  if (!selectedMaterial.value) return []
  
  if (!dimensionSearchQuery.value || dimensionSearchQuery.value.trim() === '') {
    return selectedMaterial.value.variants
  }
  
  // Split search into multiple words
  const searchWords = dimensionSearchQuery.value.toLowerCase().trim().split(/\s+/)
  
  return selectedMaterial.value.variants.filter(variant => {
    const dimensionText = (variant.specific_detail || buildDimensionDisplay(variant.dimensions)).toLowerCase()
    // Check if all search words are present
    return searchWords.every(word => dimensionText.includes(word))
  })
})

async function loadInventory() {
  loading.value = true
  try {
    let query = supabase
      .from('material_inventory')
      .select(`
        id,
        material_template_id,
        material_description,
        material_description_th,
        current_quantity,
        unit_of_measure,
        specific_detail,
        dimension_id,
        material_codes:material_code_id (
          id,
          material_code
        ),
        brands:brand_id (
          id,
          brand_title
        ),
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
        ),
        dimensions:dimension_id (
          size_1,
          size_2,
          size_3
        )
      `)
      .eq('project_id', props.projectId)
      .eq('is_active', true)
      .order('material_description')
      .order('specific_detail')

    if (props.storeId) {
      query = query.eq('store_id', props.storeId)
    }

    const { data, error } = await query

    if (error) throw error

    inventory.value = (data || []) as unknown as MaterialInventory[]
    console.log('Loaded inventory items:', inventory.value.length)
  } catch (error) {
    console.error('Error loading inventory:', error)
  } finally {
    loading.value = false
  }
}

function toggleMaterialDropdown() {
  showMaterialDropdown.value = !showMaterialDropdown.value
  showDimensionDropdown.value = false
  if (showMaterialDropdown.value && inventory.value.length === 0) {
    loadInventory()
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toggleDimensionDropdown() {
  if (selectedMaterial.value) {
    showDimensionDropdown.value = !showDimensionDropdown.value
    showMaterialDropdown.value = false
  }
}

function handleMaterialSearch() {
  showMaterialDropdown.value = true
  showDimensionDropdown.value = false
}

function selectMaterial(material: GroupedMaterial) {
  selectedMaterial.value = material
  selectedInventory.value = null
  showMaterialDropdown.value = false
  materialSearchQuery.value = '' // Clear search
  
  // Auto-select if only one variant
  if (material.variants.length === 1 && material.variants[0]) {
    selectDimension(material.variants[0])
  } else {
    showDimensionDropdown.value = true
  }
}

function clearMaterialSelection() {
  selectedMaterial.value = null
  selectedInventory.value = null
  materialSearchQuery.value = ''
  showMaterialDropdown.value = false
  emit('update:modelValue', null)
}

function selectDimension(variant: MaterialInventory) {
  selectedInventory.value = variant
  
  emit('update:modelValue', variant.id)
  emit('select', variant)
  
  console.log('Selected inventory variant:', variant)
}

function clearDimensionSelection() {
  selectedInventory.value = null
  dimensionSearchQuery.value = ''
  emit('update:modelValue', null)
}

// Close dropdowns when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const selector = target.closest('.space-y-2')
  if (!selector || !selector.contains(target)) {
    showMaterialDropdown.value = false
    showDimensionDropdown.value = false
  }
}

// Watch for store changes
watch(() => props.storeId, () => {
  if (props.storeId) {
    loadInventory()
  }
})

// Load initial data if storeId is provided
onMounted(() => {
  if (props.storeId) {
    loadInventory()
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
