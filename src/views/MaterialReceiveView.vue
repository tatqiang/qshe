<template>
  <div class="p-3 sm:p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-3 sm:mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Material Receive
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            3-step workflow: Prepare → Receive Check → Acknowledge
          </p>
        </div>
        <button
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Step Indicator -->
    <div class="mb-4 sm:mb-8">
      <div class="flex items-center justify-center">
        <!-- Step 1 -->
        <div class="flex items-center">
          <div :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
            currentStep >= 1 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
          ]">
            <svg v-if="currentStep > 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>1</span>
          </div>
          <div class="ml-3 text-left">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Prepare</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Create receive list</div>
          </div>
        </div>

        <!-- Connector -->
        <div :class="[
          'w-16 h-1 mx-4',
          currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        ]"></div>

        <!-- Step 2 -->
        <div class="flex items-center">
          <div :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
            currentStep >= 2 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
          ]">
            <svg v-if="currentStep > 2" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>2</span>
          </div>
          <div class="ml-3 text-left">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Receive Check</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Verify quantities</div>
          </div>
        </div>

        <!-- Connector -->
        <div :class="[
          'w-16 h-1 mx-4',
          currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        ]"></div>

        <!-- Step 3 -->
        <div class="flex items-center">
          <div :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
            currentStep >= 3 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
          ]">
            3
          </div>
          <div class="ml-3 text-left">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Acknowledge</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Final confirmation</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6">
      <Step1Prepare
        v-if="currentStep === 1"
        v-model="receiveData"
        :readonly="!!receiveData.id"
        @save="handleStep1Save"
        @cancel="handleCancel"
      />

      <Step2ReceiveCheck
        v-if="currentStep === 2"
        v-model="receiveData"
        @next="handleStep2Next"
        @back="currentStep = 1"
      />

      <Step3Acknowledge
        v-if="currentStep === 3"
        :receive-data="receiveData"
        @acknowledge="handleAcknowledge"
        @back="currentStep = 2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMaterialReceive } from '@/composables/useMaterialReceive'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import Step1Prepare from '@/components/materials/receive/Step1Prepare.vue'
import Step2ReceiveCheck from '@/components/materials/receive/Step2ReceiveCheck.vue'
import Step3Acknowledge from '@/components/materials/receive/Step3Acknowledge.vue'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { selectedProject } = storeToRefs(projectStore)

const projectId = computed(() => selectedProject.value?.id || '')
const userId = authStore.user?.id || ''

const currentStep = ref(1)
const receiveData = ref<any>({
  store_id: '',
  supplier_id: null,
  project_id: projectId.value,
  receive_date: new Date().toISOString().split('T')[0],
  items: [],
  areas: []
})

const {
  createReceive,
  updateReceive,
  completeReceive,
  acknowledgeReceive,
  loadReceiveById
} = useMaterialReceive(projectId.value, userId)

const handleStep1Save = async (data: any) => {
  try {
    console.log('Step 1 Save - Received data:', data)
    receiveData.value = { ...receiveData.value, ...data }
    
    if (!receiveData.value.id) {
      // Create new receive with status='prepared'
      const created = await createReceive(receiveData.value)
      receiveData.value = created // Use the full receive data from database
      console.log('Created receive:', created)
      
      // Show success message
      alert('Material receive prepared successfully! Receive Number: ' + created.receive_number)
      
      // Navigate back to receives list
      router.push('/materials/receives')
    } else {
      // Update existing receive
      console.log('Updating existing receive:', receiveData.value.id)
      const updated = await updateReceive(receiveData.value.id, receiveData.value)
      receiveData.value = updated
      console.log('Updated receive:', updated)
      
      // Show success and navigate back
      alert('Changes saved successfully!')
      router.push('/materials/receives')
    }
  } catch (error) {
    console.error('Error saving prepared receive:', error)
    alert('Failed to save prepared receive: ' + (error as Error).message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleStep1Next = async (data: any) => {
  try {
    receiveData.value = { ...receiveData.value, ...data }
    
    // Create the receive if it doesn't exist yet
    if (!receiveData.value.id) {
      const created = await createReceive(receiveData.value)
      receiveData.value = created // Use the full receive data from database
    }
    
    currentStep.value = 2
  } catch (error) {
    console.error('Error in step 1:', error)
    alert('Failed to save receive data')
  }
}

const handleStep2Next = async (data: any) => {
  try {
    if (!receiveData.value.id) {
      throw new Error('No receive ID found')
    }

    await completeReceive(receiveData.value.id, data)
    currentStep.value = 3
  } catch (error) {
    console.error('Error in step 2:', error)
    alert('Failed to complete receive check')
  }
}

const handleAcknowledge = async (data: any) => {
  try {
    if (!receiveData.value.id) {
      throw new Error('No receive ID found')
    }

    await acknowledgeReceive(receiveData.value.id, data)
    
    alert('Material receive completed successfully!')
    router.push('/materials')
  } catch (error) {
    console.error('Error acknowledging receive:', error)
    alert('Failed to acknowledge receive')
  }
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
    router.push('/materials')
  }
}

onMounted(async () => {
  // Redirect if no project selected
  if (!selectedProject.value || !projectId.value) {
    console.warn('No project selected, redirecting to dashboard')
    router.push('/dashboard')
    return
  }

  // If editing existing receive
  const receiveId = route.params.id as string
  if (receiveId) {
    const receive = await loadReceiveById(receiveId)
    if (receive) {
      // Map the loaded data to match Step1Prepare format
      receiveData.value = {
        id: receive.id,
        receive_number: receive.receive_number,
        store_id: receive.store_id,
        store: receive.stores, // Add store object for Step 3
        supplier_id: receive.supplier_id,
        project_id: receive.project_id,
        receive_date: receive.receive_date,
        status: receive.status,
        prepared_by: receive.prepared_by,
        prepared_at: receive.prepared_at,
        remarks: receive.remarks,
        // Add acknowledge and lock fields for Step 3
        acknowledged_by: receive.acknowledged_by,
        acknowledged_at: receive.acknowledged_at,
        acknowledged_notes: receive.acknowledged_notes,
        is_locked: receive.is_locked,
        received_completed_at: receive.received_completed_at,
        items: (receive.material_receive_items || []).map((item: any) => {
          // Build Thai description from template if available
          const template = item.material_template
          let material_description_th = ''
          if (template) {
            material_description_th = [
              template.title_1_th,
              template.title_2_th,
              template.title_3_th,
              template.title_4_th,
              template.title_5_th
            ].filter(Boolean).join(' ')
          }
          
          return {
            id: item.id, // Preserve the actual database UUID
            line_number: item.line_number,
            material_inventory_id: item.material_inventory_id,
            material_template_id: item.material_template_id,
            dimension_id: item.dimension_id,
            material_code: item.material_code?.material_code || '',
            material_description: item.material_description || '',
            material_description_th: material_description_th,
            material_template: template, // Keep template for reference
            specific_detail: item.specific_detail || '',
            unit_of_measure: item.unit_of_measure,
            current_quantity: 0, // Will be loaded from inventory
            brand: item.material_code?.brand || '',
            prepared_quantity: item.prepared_quantity,
            received_quantity: item.received_quantity || 0,
            rejected_quantity: item.rejected_quantity || 0,
            unit_price: item.unit_price,
            remark: item.remark
          }
        }),
        areas: (receive.material_receive_areas || []).map((area: any) => ({
          main_area_id: area.main_area_id,
          sub_area_1_id: area.sub_area_1_id,
          sub_area_2_id: area.sub_area_2_id,
          specific_location: area.specific_location,
          display_order: area.display_order,
          main_area_name: area.main_area?.main_area_name,
          sub_area_1_name: area.sub_area_1?.sub_area_1_name,
          sub_area_2_name: area.sub_area_2?.sub_area_2_name
        }))
      }
      
      // Determine current step based on receive status
      if (receive.acknowledged_at) {
        currentStep.value = 3
      } else if (receive.received_at) {
        currentStep.value = 2
      } else {
        currentStep.value = 1
      }
      
      // Check for step query parameter
      const stepParam = route.query.step
      if (stepParam) {
        const step = parseInt(stepParam as string)
        if (step >= 1 && step <= 3) {
          currentStep.value = step
        }
      }
    }
  }
})
</script>
