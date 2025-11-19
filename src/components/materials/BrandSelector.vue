<template>
  <div class="relative">
    <!-- Brand Dropdown -->
    <div @click="toggleDropdown" class="cursor-pointer">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        type="text"
        placeholder="Select or search brand..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
      />
    </div>

    <!-- Dropdown List -->
    <div
      v-if="showDropdown"
      class="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      <!-- Add New Brand Option -->
      <div
        @click="openAddBrandModal"
        class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-blue-600 dark:text-blue-400 font-medium border-b border-gray-200 dark:border-gray-700"
      >
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Brand
        </span>
      </div>

      <!-- Brand List -->
      <div
        v-for="brand in filteredBrands"
        :key="brand.id"
        @click="selectBrand(brand)"
        class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div class="font-medium">{{ brand.brand_title_th || brand.brand_title }}</div>
        <div v-if="brand.brand_title_th" class="text-sm text-gray-500 dark:text-gray-400">
          {{ brand.brand_title }}
        </div>
      </div>

      <!-- No Results -->
      <div v-if="filteredBrands.length === 0" class="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
        No brands found
      </div>
    </div>

    <!-- Add Brand Modal -->
    <div
      v-if="showAddBrandModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="closeAddBrandModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Brand</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand Name (English) <span class="text-red-500">*</span>
            </label>
            <input
              v-model="newBrand.brand_title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand Name (Thai)
            </label>
            <input
              v-model="newBrand.brand_title_th"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note
            </label>
            <textarea
              v-model="newBrand.note"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            @click="closeAddBrandModal"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleAddBrand"
            :disabled="!newBrand.brand_title"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Brand
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getBrands, createBrand } from '@/lib/api/materialSystem'
import type { Brand } from '@/types/materialSystem'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [brand: Brand]
}>()

const brands = ref<Brand[]>([])
const searchQuery = ref('')
const showDropdown = ref(false)
const showAddBrandModal = ref(false)
const selectedBrandId = ref<string | null>(props.modelValue)

const newBrand = ref({
  brand_title: '',
  brand_title_th: '',
  note: '',
  is_active: true
})

const filteredBrands = computed(() => {
  if (!searchQuery.value) return brands.value

  const query = searchQuery.value.toLowerCase()
  return brands.value.filter(brand =>
    brand.brand_title.toLowerCase().includes(query) ||
    (brand.brand_title_th && brand.brand_title_th.toLowerCase().includes(query))
  )
})

async function loadBrands() {
  try {
    brands.value = await getBrands()
    
    // Set display value if already selected
    if (selectedBrandId.value) {
      const selected = brands.value.find(b => b.id === selectedBrandId.value)
      if (selected) {
        searchQuery.value = selected.brand_title_th || selected.brand_title
      }
    }
  } catch (error) {
    console.error('Error loading brands:', error)
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleSearch() {
  showDropdown.value = true
}

function selectBrand(brand: Brand) {
  selectedBrandId.value = brand.id
  searchQuery.value = brand.brand_title_th || brand.brand_title
  showDropdown.value = false
  
  emit('update:modelValue', brand.id)
  emit('select', brand)
}

function openAddBrandModal() {
  showDropdown.value = false
  showAddBrandModal.value = true
  newBrand.value = {
    brand_title: searchQuery.value,
    brand_title_th: '',
    note: '',
    is_active: true
  }
}

function closeAddBrandModal() {
  showAddBrandModal.value = false
  newBrand.value = {
    brand_title: '',
    brand_title_th: '',
    note: '',
    is_active: true
  }
}

async function handleAddBrand() {
  if (!newBrand.value.brand_title) return

  try {
    const created = await createBrand(newBrand.value)
    brands.value.push(created)
    selectBrand(created)
    closeAddBrandModal()
  } catch (error) {
    console.error('Error creating brand:', error)
    alert('Failed to create brand')
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedBrandId.value = newValue
    const selected = brands.value.find(b => b.id === newValue)
    if (selected) {
      searchQuery.value = selected.brand_title_th || selected.brand_title
    }
  } else {
    selectedBrandId.value = null
    searchQuery.value = ''
  }
})

onMounted(() => {
  loadBrands()
})
</script>
