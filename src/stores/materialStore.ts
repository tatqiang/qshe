/**
 * Material Store (Pinia)
 * 
 * Global state management for material inventory system.
 * Provides centralized access to stores, inventory, and receives across components.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { materialService } from '../services/materialService'
import type {
  Store,
  MaterialCode,
  MaterialInventory,
  MaterialReceive,
  CreateStoreDTO,
  CreateMaterialCodeDTO,
  CreateMaterialReceiveDTO,
  CompleteReceiveDTO,
  AcknowledgeReceiveDTO
} from '../types/materialSystem'

export const useMaterialStore = defineStore('material', () => {
  // State
  const stores = ref<Store[]>([])
  const materialCodes = ref<MaterialCode[]>([])
  const inventory = ref<MaterialInventory[]>([])
  const receives = ref<MaterialReceive[]>([])
  
  const currentProjectId = ref<string>('')
  const currentStoreId = ref<string>('')
  const currentReceive = ref<MaterialReceive | null>(null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentStore = computed(() => 
    stores.value.find(s => s.id === currentStoreId.value)
  )

  const mainStore = computed(() => 
    stores.value.find(s => s.is_main_store && s.is_active)
  )

  const activeStores = computed(() => 
    stores.value.filter(s => s.is_active)
  )

  const activeMaterialCodes = computed(() => 
    materialCodes.value.filter(c => c.is_active)
  )

  const currentStoreInventory = computed(() => {
    if (!currentStoreId.value) return inventory.value
    return inventory.value.filter(item => item.store_id === currentStoreId.value)
  })

  const pendingReceives = computed(() => 
    receives.value.filter(r => r.status === 'prepared')
  )

  const completedReceives = computed(() => 
    receives.value.filter(r => r.status !== 'prepared' && r.acknowledged_at)
  )

  // Actions
  async function initialize(projectId: string, storeId?: string) {
    currentProjectId.value = projectId
    
    await Promise.all([
      loadStores(),
      loadMaterialCodes()
    ])

    if (storeId) {
      currentStoreId.value = storeId
    } else if (mainStore.value) {
      currentStoreId.value = mainStore.value.id
    }

    if (currentStoreId.value) {
      await loadInventory()
    }
  }

  async function loadStores() {
    if (!currentProjectId.value) return

    loading.value = true
    error.value = null
    try {
      stores.value = await materialService.getStores(currentProjectId.value)
    } catch (e: any) {
      error.value = e.message || 'Failed to load stores'
      console.error('Error loading stores:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadMaterialCodes() {
    if (!currentProjectId.value) return

    loading.value = true
    error.value = null
    try {
      materialCodes.value = await materialService.getMaterialCodes(currentProjectId.value)
    } catch (e: any) {
      error.value = e.message || 'Failed to load material codes'
      console.error('Error loading material codes:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadInventory() {
    if (!currentStoreId.value) {
      inventory.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      inventory.value = await materialService.getInventoryByStore(currentStoreId.value)
    } catch (e: any) {
      error.value = e.message || 'Failed to load inventory'
      console.error('Error loading inventory:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadReceives(filters?: any) {
    if (!currentProjectId.value) return

    loading.value = true
    error.value = null
    try {
      receives.value = await materialService.getMaterialReceives(currentProjectId.value, filters)
    } catch (e: any) {
      error.value = e.message || 'Failed to load receives'
      console.error('Error loading receives:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadReceiveById(receiveId: string) {
    loading.value = true
    error.value = null
    try {
      currentReceive.value = await materialService.getMaterialReceiveById(receiveId)
      return currentReceive.value
    } catch (e: any) {
      error.value = e.message || 'Failed to load receive'
      console.error('Error loading receive:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createStore(data: CreateStoreDTO) {
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

  async function createMaterialCode(data: CreateMaterialCodeDTO) {
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

  async function createReceive(data: CreateMaterialReceiveDTO, userId: string) {
    loading.value = true
    error.value = null
    try {
      const newReceive = await materialService.createMaterialReceive(data, userId)
      receives.value.unshift(newReceive)
      currentReceive.value = newReceive
      return newReceive
    } catch (e: any) {
      error.value = e.message || 'Failed to create receive'
      console.error('Error creating receive:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeReceive(receiveId: string, data: CompleteReceiveDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedReceive = await materialService.completeReceiveCheck(receiveId, data)
      
      const index = receives.value.findIndex(r => r.id === receiveId)
      if (index !== -1) {
        receives.value[index] = updatedReceive
      }
      
      currentReceive.value = updatedReceive
      
      // Reload inventory to show new items
      await loadInventory()
      
      return updatedReceive
    } catch (e: any) {
      error.value = e.message || 'Failed to complete receive'
      console.error('Error completing receive:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function acknowledgeReceive(receiveId: string, data: AcknowledgeReceiveDTO) {
    loading.value = true
    error.value = null
    try {
      const acknowledgedReceive = await materialService.acknowledgeReceive(receiveId, data)
      
      const index = receives.value.findIndex(r => r.id === receiveId)
      if (index !== -1) {
        receives.value[index] = acknowledgedReceive
      }
      
      currentReceive.value = acknowledgedReceive
      return acknowledgedReceive
    } catch (e: any) {
      error.value = e.message || 'Failed to acknowledge receive'
      console.error('Error acknowledging receive:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function searchInventory(searchTerm: string) {
    if (!currentProjectId.value) return

    loading.value = true
    error.value = null
    try {
      inventory.value = await materialService.searchInventory(currentProjectId.value, searchTerm)
    } catch (e: any) {
      error.value = e.message || 'Failed to search inventory'
      console.error('Error searching inventory:', e)
    } finally {
      loading.value = false
    }
  }

  function setCurrentStore(storeId: string) {
    currentStoreId.value = storeId
    loadInventory()
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    stores.value = []
    materialCodes.value = []
    inventory.value = []
    receives.value = []
    currentProjectId.value = ''
    currentStoreId.value = ''
    currentReceive.value = null
    error.value = null
  }

  return {
    // State
    stores,
    materialCodes,
    inventory,
    receives,
    currentProjectId,
    currentStoreId,
    currentReceive,
    loading,
    error,

    // Computed
    currentStore,
    mainStore,
    activeStores,
    activeMaterialCodes,
    currentStoreInventory,
    pendingReceives,
    completedReceives,

    // Actions
    initialize,
    loadStores,
    loadMaterialCodes,
    loadInventory,
    loadReceives,
    loadReceiveById,
    createStore,
    createMaterialCode,
    createReceive,
    completeReceive,
    acknowledgeReceive,
    searchInventory,
    setCurrentStore,
    clearError,
    reset
  }
})
