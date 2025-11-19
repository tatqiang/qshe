/**
 * Material Receive Composable
 * 
 * Manages the 3-step material receive workflow with reactive state.
 */

import { ref, computed } from 'vue'
import { materialService } from '../services/materialService'
import type {
  MaterialReceive,
  CreateMaterialReceiveDTO,
  CompleteReceiveDTO,
  AcknowledgeReceiveDTO,
  MaterialReceiveStatus
} from '../types/materialSystem'

export function useMaterialReceive(projectId: string, userId: string) {
  // State
  const receives = ref<MaterialReceive[]>([])
  const currentReceive = ref<MaterialReceive | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref({
    storeId: '',
    status: '' as MaterialReceiveStatus | '',
    fromDate: '',
    toDate: ''
  })

  // Computed
  const filteredReceives = computed(() => {
    let result = receives.value

    if (filters.value.storeId) {
      result = result.filter(r => r.store_id === filters.value.storeId)
    }
    if (filters.value.status) {
      result = result.filter(r => r.status === filters.value.status)
    }
    if (filters.value.fromDate) {
      result = result.filter(r => r.receive_date >= filters.value.fromDate)
    }
    if (filters.value.toDate) {
      result = result.filter(r => r.receive_date <= filters.value.toDate)
    }

    return result
  })

  const pendingReceives = computed(() => 
    receives.value.filter(r => r.status === 'prepared')
  )

  const completedReceives = computed(() => 
    receives.value.filter(r => r.status !== 'prepared' && r.acknowledged_at)
  )

  const canEditCurrentReceive = computed(() => {
    if (!currentReceive.value || currentReceive.value.is_locked) {
      return false
    }

    // Check if within 1-hour edit window after receive completion
    if (currentReceive.value.received_completed_at) {
      const completedAt = new Date(currentReceive.value.received_completed_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 1
    }

    return !currentReceive.value.received_completed_at
  })

  const editWindowRemaining = computed(() => {
    if (!currentReceive.value?.received_completed_at || currentReceive.value.is_locked) {
      return null
    }

    const completedAt = new Date(currentReceive.value.received_completed_at)
    const now = new Date()
    const minutesDiff = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60))
    const remainingMinutes = 60 - minutesDiff

    if (remainingMinutes <= 0) {
      return null
    }

    return {
      minutes: remainingMinutes,
      expired: false,
      warning: remainingMinutes <= 15
    }
  })

  // Methods
  async function loadReceives(filterOptions?: typeof filters.value) {
    loading.value = true
    error.value = null
    
    if (filterOptions) {
      filters.value = { ...filters.value, ...filterOptions }
    }

    try {
      receives.value = await materialService.getMaterialReceives(projectId, filters.value)
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

  /**
   * Step 5.1: Create and prepare a new material receive
   */
  async function createReceive(data: CreateMaterialReceiveDTO) {
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

  /**
   * Update an existing material receive (Step 1 - Prepare)
   */
  async function updateReceive(receiveId: string, data: CreateMaterialReceiveDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedReceive = await materialService.updateMaterialReceive(receiveId, data, userId)
      
      // Update in list
      const index = receives.value.findIndex(r => r.id === receiveId)
      if (index !== -1) {
        receives.value[index] = updatedReceive
      }
      
      currentReceive.value = updatedReceive
      return updatedReceive
    } catch (e: any) {
      error.value = e.message || 'Failed to update receive'
      console.error('Error updating receive:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Step 5.2: Complete receive check and create inventory
   */
  async function completeReceive(receiveId: string, data: CompleteReceiveDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedReceive = await materialService.completeReceiveCheck(receiveId, data)
      
      // Update in list
      const index = receives.value.findIndex(r => r.id === receiveId)
      if (index !== -1) {
        receives.value[index] = updatedReceive
      }
      
      currentReceive.value = updatedReceive
      return updatedReceive
    } catch (e: any) {
      error.value = e.message || 'Failed to complete receive'
      console.error('Error completing receive:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Step 5.3: Acknowledge and lock the receive document
   */
  async function acknowledgeReceive(receiveId: string, data: AcknowledgeReceiveDTO) {
    loading.value = true
    error.value = null
    try {
      const acknowledgedReceive = await materialService.acknowledgeReceive(receiveId, data)
      
      // Update in list
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

  function clearCurrentReceive() {
    currentReceive.value = null
  }

  function clearError() {
    error.value = null
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
    loadReceives()
  }

  function clearFilters() {
    filters.value = {
      storeId: '',
      status: '',
      fromDate: '',
      toDate: ''
    }
    loadReceives()
  }

  // Auto-load on mount
  loadReceives()

  return {
    // State
    receives,
    currentReceive,
    loading,
    error,
    filters,

    // Computed
    filteredReceives,
    pendingReceives,
    completedReceives,
    canEditCurrentReceive,
    editWindowRemaining,

    // Methods
    loadReceives,
    loadReceiveById,
    createReceive,
    updateReceive,
    completeReceive,
    acknowledgeReceive,
    clearCurrentReceive,
    clearError,
    setFilters,
    clearFilters
  }
}
