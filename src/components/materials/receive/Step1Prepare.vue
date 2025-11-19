<template>
  <div class="space-y-4 md:space-y-6">
    <h2 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Step 1: Prepare Receive</h2>

    <!-- Store Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Store <span class="text-red-500">*</span>
      </label>
      <select
        v-model="formData.store_id"
        :disabled="props.readonly && !isEditing"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <option value="">Select Store</option>
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.store_name }} {{ store.is_main_store ? '(Main)' : '' }}
        </option>
      </select>
    </div>

    <!-- Supplier Selection -->
    <SupplierSelector
      v-model="formData.supplier_id"
      :suppliers="suppliers"
      :disabled="props.readonly && !isEditing"
      @supplier-added="handleSupplierAdded"
    />

    <!-- Prepared By & At -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prepared By
        </label>
        <input
          :value="currentUserName"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prepared At
        </label>
        <input
          :value="currentDateTime"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
        />
      </div>
    </div>

    <!-- Areas (Multi) -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Intended Usage Area(s)
        </label>
        <button
          v-if="!props.readonly || isEditing"
          type="button"
          @click="showAreaModal = true"
          class="px-3 py-1.5 bg-green-600 text-white text-xs md:text-sm rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Usage Area
        </button>
      </div>
      
      <div v-if="formData.areas && formData.areas.length > 0" class="mt-2 space-y-2">
        <div
          v-for="(area, index) in formData.areas"
          :key="index"
          class="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
        >
          <div class="text-sm">
            <span class="font-medium">{{ area.main_area_name }}</span>
            <span v-if="area.sub_area_1_name"> → {{ area.sub_area_1_name }}</span>
            <span v-if="area.sub_area_2_name"> → {{ area.sub_area_2_name }}</span>
            <span v-if="area.specific_location" class="text-gray-600 dark:text-gray-400"> ({{ area.specific_location }})</span>
          </div>
          <button
            v-if="!props.readonly || isEditing"
            type="button"
            @click="removeArea(index)"
            class="text-red-600 hover:text-red-800"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Line Items - Spreadsheet Table -->
    <div>
      <MaterialReceiveItemsTable
        v-model="formData.items"
        :project-id="projectId"
        :store-id="formData.store_id"
        :readonly="props.readonly && !isEditing"
      />
    </div>

    <!-- Remarks -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Remarks
      </label>
      <textarea
        v-model="formData.remarks"
        :disabled="props.readonly && !isEditing"
        rows="3"
        placeholder="Optional remarks or notes"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
      <!-- View Mode Buttons -->
      <template v-if="props.readonly && !isEditing">
        <Button
          variant="ghost"
          size="lg"
          @click="$emit('cancel')"
        >
          Back to List
        </Button>

        <Button
          variant="primary"
          size="lg"
          @click="isEditing = true"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Button>
      </template>

      <!-- Edit Mode Buttons -->
      <template v-else>
        <Button
          variant="ghost"
          size="lg"
          @click="props.readonly ? (isEditing = false) : $emit('cancel')"
        >
          {{ props.readonly ? 'Cancel Edit' : 'Cancel' }}
        </Button>

        <Button
          variant="primary"
          size="lg"
          :disabled="!canProceed"
          :loading="isSaving"
          @click="handleSavePrepared"
          class="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          Save Prepared Material Receive
        </Button>
      </template>
    </div>

    <!-- Area Input Modal -->
    <AreaInputModal
      v-if="showAreaModal"
      :project-id="projectId"
      @save="handleAreaSave"
      @close="showAreaModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMaterialInventory } from '@/composables/useMaterialInventory'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import MaterialReceiveItemsTable from './MaterialReceiveItemsTable.vue'
import AreaInputModal from './AreaInputModal.vue'
import SupplierSelector from './SupplierSelector.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  modelValue: any
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  next: [data: any]
  save: [data: any]
  cancel: []
}>()

const projectStore = useProjectStore()
const authStore = useAuthStore()
const { selectedProject } = storeToRefs(projectStore)
const projectId = computed(() => selectedProject.value?.id || '')

const { stores, suppliers, loadStores, loadSuppliers } = useMaterialInventory(projectId.value)

console.log('Step1Prepare - projectId:', projectId.value)
console.log('Step1Prepare - readonly prop:', props.readonly)
console.log('Step1Prepare - stores initial:', stores.value)

// Watch stores to see when they update
watch(stores, (newStores) => {
  console.log('👀 Step1Prepare - stores updated:', newStores.length, newStores)
}, { deep: true })

// Reload stores and suppliers when component mounts
onMounted(async () => {
  console.log('Step1Prepare mounted, reloading stores and suppliers for project:', projectId.value)
  if (projectId.value) {
    await loadStores()
    await loadSuppliers()
    console.log('Step1Prepare - stores after loadStores:', stores.value)
    console.log('Step1Prepare - suppliers after loadSuppliers:', suppliers.value)
  }
})

const formData = ref(props.modelValue || {
  store_id: '',
  supplier_id: null,
  project_id: projectId.value,
  items: [],
  areas: [],
  remarks: ''
})

const showAreaModal = ref(false)
const isSaving = ref(false)
const isEditing = ref(false) // Always start in view mode if readonly

// Watch readonly prop to reset edit mode
watch(() => props.readonly, (newReadonly) => {
  console.log('👁️ readonly prop changed:', newReadonly, '- setting isEditing to false')
  if (newReadonly) {
    isEditing.value = false
  }
}, { immediate: true })

// Watch for changes to modelValue from parent
watch(() => props.modelValue, (newValue) => {
  // Update formData when modelValue changes, unless we're actively editing
  // This allows loading existing receives while preventing modal closure from clearing data
  if (newValue && Object.keys(newValue).length > 0) {
    // Check if this is a new receive being loaded (has id) vs just modal state changes
    const isLoadingExistingReceive = newValue.id && newValue.id !== formData.value.id
    
    // Update if:
    // 1. Loading a different receive (has different id), OR
    // 2. No items/areas exist yet (first load)
    if (isLoadingExistingReceive || (!formData.value.items?.length && !formData.value.areas?.length)) {
      console.log('Step1Prepare - modelValue changed, updating formData:', newValue)
      formData.value = { ...newValue }
    }
  }
}, { deep: true })

// Current user info
const currentUserName = computed(() => {
  return authStore.azureUser?.displayName || authStore.user?.email?.split('@')[0] || 'Unknown User'
})

const currentDateTime = computed(() => {
  const now = new Date()
  const day = now.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${day} ${month} ${year} ${hours}:${minutes}`
})

function createEmptyLineItem() {
  return {
    line_number: 1,
    material_inventory_id: null,
    material_code: '',
    material_description: '',
    specific_detail: '',
    unit_of_measure: '',
    current_quantity: 0,
    brand: '',
    prepared_quantity: 0,
    unit_price: null,
    remark: ''
  }
}

const canProceed = computed(() => {
  return formData.value.store_id &&
    formData.value.items.length > 0 &&
    formData.value.items.every((item: any) => {
      // For existing items, check if material_description exists (already saved)
      // For new items, check if material_inventory_id is selected
      const hasMaterial = item.material_inventory_id || (item.material_description && item.material_description.trim() !== '')
      return hasMaterial && item.prepared_quantity > 0
    })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addLineItem() {
  formData.value.items.push({
    ...createEmptyLineItem(),
    line_number: formData.value.items.length + 1
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function removeLineItem(index: number) {
  formData.value.items.splice(index, 1)
  // Renumber remaining items
  formData.value.items.forEach((item: any, i: number) => {
    item.line_number = i + 1
  })
}

// Handle inventory selection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleInventorySelect(index: number, inventoryRecord: any) {
  const item = formData.value.items[index]
  
  console.log('Inventory selected:', inventoryRecord)
  
  // Store inventory ID
  item.material_inventory_id = inventoryRecord.id
  
  // Auto-fill all fields from inventory
  item.material_code = inventoryRecord.material_codes?.material_code || ''
  item.material_description = inventoryRecord.material_description || ''
  item.specific_detail = inventoryRecord.specific_detail || ''
  item.unit_of_measure = inventoryRecord.unit_of_measure || ''
  item.current_quantity = inventoryRecord.current_quantity || 0
  item.brand = inventoryRecord.brands?.brand_title || ''
  
  console.log('Auto-filled from inventory:', item)
}

function handleAreaSave(areaData: any) {
  formData.value.areas.push({
    ...areaData,
    display_order: formData.value.areas.length + 1
  })
  showAreaModal.value = false
}

function removeArea(index: number) {
  formData.value.areas.splice(index, 1)
  // Renumber display_order
  formData.value.areas.forEach((area: any, i: number) => {
    area.display_order = i + 1
  })
}

async function handleSupplierAdded() {
  // Reload suppliers after adding a new one
  await loadSuppliers()
}

async function handleSavePrepared() {
  if (!canProceed.value || isSaving.value) return
  
  console.log('💾 Starting save, setting isSaving to true')
  isSaving.value = true
  
  try {
    // Clean up items data
    const cleanedData = {
      ...formData.value,
      status: 'prepared',
      prepared_by: currentUserName.value,
      prepared_at: new Date().toISOString(),
      items: formData.value.items.map((item: any) => ({
        line_number: item.line_number,
        material_inventory_id: item.material_inventory_id,
        material_template_id: item.material_template_id,
        dimension_id: item.dimension_id,
        material_code: item.material_code,
        material_description: item.material_description,
        specific_detail: item.specific_detail,
        unit_of_measure: item.unit_of_measure,
        current_quantity: item.current_quantity,
        prepared_quantity: item.prepared_quantity,
        unit_price: item.unit_price,
        remark: item.remark
      }))
    }
    
    console.log('💾 Emitting save event with data:', cleanedData)
    emit('update:modelValue', cleanedData)
    emit('save', cleanedData)
    
    // Keep spinner showing for at least 500ms to provide visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Error saving prepared receive:', error)
    isSaving.value = false
  }
  // Note: Don't reset isSaving here - parent will navigate away after save completes
}
</script>
