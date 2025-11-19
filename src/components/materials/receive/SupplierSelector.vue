<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Supplier
    </label>
    
    <div class="relative">
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search supplier by company name..."
        :disabled="props.disabled"
        class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        @input="handleSearch"
        @focus="!props.disabled && (showDropdown = true)"
      />
      
      <!-- Search Icon -->
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Dropdown Results -->
      <div
        v-if="!props.disabled && showDropdown && (filteredSuppliers.length > 0 || searchQuery.length > 0)"
        class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
        <!-- Existing Suppliers -->
        <div
          v-for="supplier in filteredSuppliers"
          :key="supplier.id"
          @click="selectSupplier(supplier)"
          class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
        >
          <div class="font-medium text-gray-900 dark:text-gray-100">
            {{ supplier.company?.name || supplier.company?.name_th || 'Unknown' }}
            <span v-if="supplier.is_preferred" class="ml-2">⭐</span>
          </div>
          <div v-if="supplier.company?.name_th && supplier.company?.name" class="text-sm text-gray-600 dark:text-gray-400">
            {{ supplier.company.name_th }}
          </div>
          <div v-if="supplier.supplier_code" class="text-xs text-gray-500 dark:text-gray-500">
            Code: {{ supplier.supplier_code }}
          </div>
        </div>

        <!-- No results - Add New -->
        <div
          v-if="filteredSuppliers.length === 0 && searchQuery.length > 0"
          class="px-3 py-2"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No supplier found
          </div>
          <button
            type="button"
            @click="openAddSupplierModal"
            class="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Supplier
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Supplier Display -->
    <div
      v-if="selectedSupplier"
      class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-between"
    >
      <div>
        <div class="font-medium text-gray-900 dark:text-gray-100">
          {{ selectedSupplier.company?.name || selectedSupplier.company?.name_th }}
          <span v-if="selectedSupplier.is_preferred" class="ml-2">⭐</span>
        </div>
        <div v-if="selectedSupplier.supplier_code" class="text-sm text-gray-600 dark:text-gray-400">
          Code: {{ selectedSupplier.supplier_code }}
        </div>
      </div>
      <button
        type="button"
        @click="clearSelection"
        class="text-red-600 hover:text-red-800"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Add Supplier Modal -->
    <AddSupplierModal
      v-if="showAddModal"
      :initial-search="searchQuery"
      @close="showAddModal = false"
      @saved="handleSupplierAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AddSupplierModal from './AddSupplierModal.vue'

const props = defineProps<{
  modelValue: string | null
  suppliers: any[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'supplier-added': []
}>()

const searchQuery = ref('')
const showDropdown = ref(false)
const showAddModal = ref(false)

const selectedSupplier = computed(() => {
  if (!props.modelValue) return null
  return props.suppliers.find(s => s.id === props.modelValue)
})

const filteredSuppliers = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.suppliers.slice(0, 10) // Show first 10 by default
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return props.suppliers.filter(supplier => {
    const companyName = supplier.company?.name?.toLowerCase() || ''
    const companyNameTh = supplier.company?.name_th?.toLowerCase() || ''
    const supplierCode = supplier.supplier_code?.toLowerCase() || ''
    
    return companyName.includes(query) || 
           companyNameTh.includes(query) || 
           supplierCode.includes(query)
  })
})

function handleSearch() {
  showDropdown.value = true
}

function selectSupplier(supplier: any) {
  emit('update:modelValue', supplier.id)
  searchQuery.value = supplier.company?.name || supplier.company?.name_th || ''
  showDropdown.value = false
}

function clearSelection() {
  emit('update:modelValue', null)
  searchQuery.value = ''
  showDropdown.value = false
}

function openAddSupplierModal() {
  showDropdown.value = false
  showAddModal.value = true
}

function handleSupplierAdded(newSupplier: any) {
  showAddModal.value = false
  emit('supplier-added')
  // Auto-select the newly added supplier
  if (newSupplier?.id) {
    emit('update:modelValue', newSupplier.id)
    searchQuery.value = newSupplier.company?.name || newSupplier.company?.name_th || ''
  }
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showDropdown.value = false
    }
  })
}

// Initialize search query from selected supplier
watch(() => props.modelValue, (newValue) => {
  if (newValue && selectedSupplier.value) {
    searchQuery.value = selectedSupplier.value.company?.name || selectedSupplier.value.company?.name_th || ''
  } else if (!newValue) {
    searchQuery.value = ''
  }
}, { immediate: true })
</script>
