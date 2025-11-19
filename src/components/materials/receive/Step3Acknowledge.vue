<template>
  <div class="space-y-6">
    <!-- Loading Overlay -->
    <LoadingOverlay
      :show="isProcessing"
      title="Processing Acknowledgement"
      :message="`Updating ${receiveData.items?.length || 0} items in inventory...\nPlease wait, this may take a moment.`"
    />

    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Step 3: Acknowledge</h2>

    <!-- Edit Window Warning -->
    <div v-if="editWindowRemaining" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Edit window: {{ editWindowRemaining }} minutes remaining
        </span>
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Store:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ receiveData.store?.store_name || '-' }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Receive Date:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(receiveData.receive_date) }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Total Items:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ receiveData.items?.length || 0 }}</span>
      </div>
    </div>

    <!-- Acknowledged By & At -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Acknowledged By
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
          Acknowledged At
        </label>
        <input
          :value="currentDateTime"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
        />
      </div>
    </div>

    <!-- Items Summary -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Received Items</h3>
      <div class="space-y-2">
        <div
          v-for="(item, index) in receiveData.items"
          :key="index"
          class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">{{ getItemDescription(item) }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Accepted: {{ item.received_quantity || 0 }} {{ item.unit_of_measure }}
                <span v-if="item.rejected_quantity > 0" class="text-red-600"> (Rejected: {{ item.rejected_quantity }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acknowledgement Notes -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Acknowledgement Notes
      </label>
      <textarea
        v-model="acknowledgeNotes"
        rows="3"
        placeholder="Final comments or notes..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        v-if="!isDocumentLocked"
        type="button"
        @click="$emit('back')"
        class="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
      >
        ← Back
      </button>

      <Button
        variant="primary"
        size="lg"
        :disabled="isDocumentLocked"
        @click="handleAcknowledge"
        :class="isDocumentLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'"
      >
        <span v-if="isDocumentLocked">✓ Document Already Locked</span>
        <span v-else>Acknowledge & Lock Document</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button.vue'
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'

const props = defineProps<{
  receiveData: any
}>()

const emit = defineEmits<{
  acknowledge: [data: any]
  back: []
}>()

const authStore = useAuthStore()
const acknowledgeNotes = ref('')
const isProcessing = ref(false)

// Check if document is already locked/acknowledged
const isDocumentLocked = computed(() => {
  return !!(props.receiveData.is_locked || props.receiveData.acknowledged_at)
})

// Current user info (same pattern as Step 1 and Step 2)
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

const editWindowRemaining = computed(() => {
  if (!props.receiveData.received_completed_at || isDocumentLocked.value) {
    return null
  }

  const completedAt = new Date(props.receiveData.received_completed_at)
  const now = new Date()
  const minutesDiff = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60))
  const remaining = 60 - minutesDiff

  return remaining > 0 ? remaining : null
})

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = date.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function getItemDescription(item: any): string {
  // If item has material_template, build description from title fields
  if (item.material_template) {
    const template = item.material_template
    const parts = [
      template.title_1,
      template.title_2,
      template.title_3,
      template.title_4,
      template.title_5
    ].filter(Boolean)
    
    if (parts.length > 0) {
      return parts.join(' ') // Concatenate without pipes
    }
  }
  
  return item.material_description || 'N/A'
}

async function handleAcknowledge() {
  // Prevent acknowledging if already locked
  if (isDocumentLocked.value) {
    alert('This document has already been acknowledged and locked.')
    return
  }

  if (!confirm('This will lock the document. Continue?')) return

  isProcessing.value = true
  
  try {
    const acknowledgeData = {
      acknowledged_by: authStore.user?.id || '', // Use user ID (UUID)
      acknowledged_at: new Date().toISOString(),
      acknowledged_notes: acknowledgeNotes.value
    }

    emit('acknowledge', acknowledgeData)
  } catch (error) {
    console.error('Error acknowledging:', error)
    alert('Failed to acknowledge receive: ' + (error as Error).message)
    isProcessing.value = false
  }
  // Note: isProcessing will be reset by parent after success/navigation
}
</script>
