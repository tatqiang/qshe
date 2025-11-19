<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Materials Inventory
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Multi-store material inventory with receive workflow
      </p>
    </div>

    <!-- Actions Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4 items-center">
        <!-- Store Filter -->
        <div class="w-full sm:w-64">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store</label>
          <select
            v-model="selectedStoreId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Stores</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.store_name }} {{ store.is_main_store ? '(Main)' : '' }}
            </option>
          </select>
        </div>

        <div class="flex-1 w-full">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <div class="relative">
            <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search inventory by code, description, or barcode..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="router.push({ name: 'AddMaterialToInventory' })"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add to Inventory
          </button>
          <button
            @click="router.push('/materials/receives')"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Material Receives
          </button>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
        Loading inventory...
      </div>
      
      <div v-else-if="filteredInventory.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
        No inventory items found. Click "Receive Materials" to add stock.
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Material Code
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Store
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Available Qty
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Unit
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in filteredInventory" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {{ item.material_code?.material_code || '-' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                {{ item.material_description_th || item.material_description || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {{ item.store?.store_name || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                <span :class="item.available_quantity <= item.min_stock_level
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-gray-900 dark:text-gray-100'">
                  {{ item.available_quantity.toFixed(2) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {{ item.unit_of_measure }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewInventoryDetails(item)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View Details"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMaterialInventory } from '@/composables/useMaterialInventory'
import { useProjectStore } from '@/stores/projectStore'
import type { MaterialInventory } from '@/types/materialSystem'

const router = useRouter()
const projectStore = useProjectStore()
const { selectedProject } = storeToRefs(projectStore)

const projectId = computed(() => selectedProject.value?.id || '')

const {
  stores,
  inventory,
  selectedStoreId,
  loading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error
} = useMaterialInventory(projectId.value)

const searchQuery = ref('')

const filteredInventory = computed(() => {
  let result = inventory.value

  if (!searchQuery.value) return result

  const query = searchQuery.value.toLowerCase()
  return result.filter(item => 
    item.inventory_code.toLowerCase().includes(query) ||
    item.material_description.toLowerCase().includes(query) ||
    item.material_code?.material_code.toLowerCase().includes(query) ||
    item.barcode?.toLowerCase().includes(query)
  )
})

const viewInventoryDetails = (item: MaterialInventory) => {
  // TODO: Navigate to inventory detail view
  console.log('View inventory details:', item)
}

onMounted(() => {
  // Redirect to dashboard if no project selected
  if (!projectId.value) {
    console.warn('No project selected, redirecting to dashboard')
    router.push('/dashboard')
  }
})
</script>
