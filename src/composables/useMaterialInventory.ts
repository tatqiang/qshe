/**
 * Material Inventory Composable
 * 
 * Provides reactive state management for material inventory operations.
 */

import { ref, computed, watch } from 'vue'
import { materialService } from '../services/materialService'
import type {
  Store,
  MaterialCode,
  MaterialInventory
} from '../types/materialSystem'

export function useMaterialInventory(projectId: string, initialStoreId?: string) {
  // State
  const stores = ref<Store[]>([])
  const materialCodes = ref<MaterialCode[]>([])
  const inventory = ref<MaterialInventory[]>([])
  const suppliers = ref<any[]>([])
  const selectedStoreId = ref<string>(initialStoreId || '')
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const selectedStore = computed(() => 
    stores.value.find(s => s.id === selectedStoreId.value)
  )

  const mainStore = computed(() => 
    stores.value.find(s => s.is_main_store)
  )

  const filteredInventory = computed(() => {
    if (!selectedStoreId.value) return inventory.value
    return inventory.value.filter(item => item.store_id === selectedStoreId.value)
  })

  const inventoryByMaterialCode = computed(() => {
    const grouped = new Map<string, MaterialInventory[]>()
    inventory.value.forEach(item => {
      const code = item.material_code?.material_code || 'NO_CODE'
      if (!grouped.has(code)) {
        grouped.set(code, [])
      }
      grouped.get(code)!.push(item)
    })
    return grouped
  })

  // Methods
  async function loadStores() {
    if (!projectId) {
      console.warn('⚠️ useMaterialInventory.loadStores - No project ID provided')
      return
    }
    
    console.log('🔄 useMaterialInventory.loadStores - Starting for projectId:', projectId)
    loading.value = true
    error.value = null
    try {
      stores.value = await materialService.getStores(projectId)
      console.log('✅ useMaterialInventory.loadStores - Loaded stores:', stores.value.length, stores.value)
      
      // Auto-select main store if no store selected
      if (!selectedStoreId.value && mainStore.value) {
        selectedStoreId.value = mainStore.value.id
        console.log('🏪 Auto-selected main store:', mainStore.value)
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to load stores'
      console.error('❌ Error loading stores:', e)
      console.error('❌ Error details:', e.code, e.details, e.hint)
    } finally {
      loading.value = false
    }
  }

  async function loadMaterialCodes() {
    if (!projectId) {
      console.warn('No project ID provided to loadMaterialCodes')
      return
    }
    
    loading.value = true
    error.value = null
    try {
      materialCodes.value = await materialService.getMaterialCodes(projectId)
    } catch (e: any) {
      error.value = e.message || 'Failed to load material codes'
      console.error('Error loading material codes:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadSuppliers() {
    loading.value = true
    error.value = null
    try {
      suppliers.value = await materialService.getSuppliers()
    } catch (e: any) {
      error.value = e.message || 'Failed to load suppliers'
      console.error('Error loading suppliers:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadInventory() {
    if (!selectedStoreId.value) {
      inventory.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      inventory.value = await materialService.getInventoryByStore(selectedStoreId.value)
    } catch (e: any) {
      error.value = e.message || 'Failed to load inventory'
      console.error('Error loading inventory:', e)
    } finally {
      loading.value = false
    }
  }

  async function searchInventory(searchTerm: string) {
    if (!searchTerm.trim()) {
      await loadInventory()
      return
    }

    if (!projectId) {
      console.warn('No project ID provided to searchInventory')
      return
    }

    loading.value = true
    error.value = null
    try {
      inventory.value = await materialService.searchInventory(projectId, searchTerm)
    } catch (e: any) {
      error.value = e.message || 'Failed to search inventory'
      console.error('Error searching inventory:', e)
    } finally {
      loading.value = false
    }
  }

  async function getInventoryById(inventoryId: string) {
    loading.value = true
    error.value = null
    try {
      const item = await materialService.getInventoryById(inventoryId)
      return item
    } catch (e: any) {
      error.value = e.message || 'Failed to load inventory item'
      console.error('Error loading inventory item:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createStore(data: any) {
    loading.value = true
    error.value = null
    try {
      const newStore = await materialService.createStore(data)
      stores.value.push(newStore)
      return newStore
    } catch (e: any) {
      error.value = e.message || 'Failed to create store'
      console.error('Error creating store:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMaterialCode(data: any) {
    loading.value = true
    error.value = null
    try {
      const newCode = await materialService.createMaterialCode(data)
      materialCodes.value.push(newCode)
      return newCode
    } catch (e: any) {
      error.value = e.message || 'Failed to create material code'
      console.error('Error creating material code:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  // Watch store selection to reload inventory
  watch(selectedStoreId, () => {
    if (selectedStoreId.value) {
      loadInventory()
    } else {
      inventory.value = []
    }
  })

  // Auto-load on mount only if we have a valid project ID
  if (projectId) {
    loadStores()
    loadMaterialCodes()
  }

  return {
    // State
    stores,
    materialCodes,
    inventory,
    suppliers,
    selectedStoreId,
    loading,
    error,

    // Computed
    selectedStore,
    mainStore,
    filteredInventory,
    inventoryByMaterialCode,

    // Methods
    loadStores,
    loadMaterialCodes,
    loadSuppliers,
    loadInventory,
    searchInventory,
    getInventoryById,
    createStore,
    createMaterialCode,
    clearError
  }
}
