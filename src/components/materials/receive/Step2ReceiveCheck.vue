<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Step 2: Receive Check</h2>

    <p class="text-gray-600 dark:text-gray-400">
      Verify received quantities and mark any rejected items.
    </p>

    <!-- Received By & At -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Received By
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
          Received At
        </label>
        <input
          :value="currentDateTime"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
        />
      </div>
    </div>

    <!-- Items Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">#</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prepared</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Received</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rejected</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Accepted</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="(item, index) in items" :key="index">
            <td class="px-4 py-3 text-sm">{{ index + 1 }}</td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium">{{ getItemDescription(item) }}</div>
              <div class="text-gray-500 text-xs">{{ item.unit_of_measure }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-right">{{ item.prepared_quantity }}</td>
            <td class="px-4 py-3">
              <input
                v-model.number="item.received_quantity"
                type="number"
                step="0.01"
                min="0"
                :max="item.prepared_quantity"
                class="w-24 px-2 py-1 text-right border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
            </td>
            <td class="px-4 py-3">
              <input
                v-model.number="item.rejected_quantity"
                type="number"
                step="0.01"
                min="0"
                :max="item.received_quantity"
                class="w-24 px-2 py-1 text-right border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
            </td>
            <td class="px-4 py-3 text-sm text-right font-semibold">
              {{ (item.received_quantity - item.rejected_quantity).toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Receive Notes
      </label>
      <textarea
        v-model="receiveNotes"
        rows="3"
        placeholder="Any notes about the receive process..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('back')"
        class="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
      >
        ← Back
      </button>

      <Button
        variant="primary"
        size="lg"
        :loading="isProcessing"
        @click="handleNext"
        class="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      >
        Complete Receive →
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  next: [data: any]
  back: []
}>()

const authStore = useAuthStore()
const isProcessing = ref(false)

const items = ref(props.modelValue.items.map((item: any) => ({
  ...item,
  received_quantity: item.received_quantity || item.prepared_quantity,
  rejected_quantity: item.rejected_quantity || 0
})))

const receiveNotes = ref('')

// Current user info (same pattern as Step1Prepare)
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

function getItemDescription(item: any): string {
  // If item has material_template, build description from title_th fields
  if (item.material_template) {
    const template = item.material_template
    const parts = [
      template.title_th_1,
      template.title_th_2,
      template.title_th_3,
      template.title_th_4,
      template.title_th_5
    ].filter(Boolean) // Remove null/undefined/empty values
    
    if (parts.length > 0) {
      return parts.join(' | ')
    }
  }
  
  // Fallback to material_description or dimension
  if (item.dimension?.dimension_value) {
    return item.dimension.dimension_value
  }
  
  return item.material_description || 'N/A'
}

async function handleNext() {
  isProcessing.value = true
  
  try {
    const completeData = {
      received_by: authStore.user?.id || '', // Use user ID (UUID), not display name
      received_at: new Date().toISOString(),
      received_notes: receiveNotes.value,
      items: items.value.map((item: any) => ({
        id: item.id, // Use the actual item ID from the database
        received_quantity: item.received_quantity,
        rejected_quantity: item.rejected_quantity
      }))
    }

    emit('next', completeData)
  } finally {
    // Keep spinner showing for at least 300ms
    setTimeout(() => {
      isProcessing.value = false
    }, 300)
  }
}
</script>
