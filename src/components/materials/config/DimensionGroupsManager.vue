<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Dimension Groups</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Size categories (Nominal Pipe, Copper Pipe, etc.)
        </p>
      </div>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Group
      </button>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="groups.length === 0" class="text-center py-8 text-gray-500">
      No dimension groups found. Click "Add Group" to create one.
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="group in groups"
        :key="group.id"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        <div>
          <div class="font-medium text-gray-900 dark:text-gray-100">{{ group.group_name }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Code: {{ group.group_code }} | Format: {{ group.display_format }}
          </div>
        </div>
        <button
          @click="handleDelete(group.id)"
          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Add Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddDialog = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Dimension Group</h3>
        <form @submit.prevent="handleAdd">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Code *
              </label>
              <input
                v-model="newGroup.group_code"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., NPS"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name *
              </label>
              <input
                v-model="newGroup.group_name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Nominal Pipe Size"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Format *
              </label>
              <select
                v-model="newGroup.display_format"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="table">Table</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Order
              </label>
              <input
                v-model.number="newGroup.sort_order"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="showAddDialog = false"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDimensionGroups, createDimensionGroup, deleteDimensionGroup } from '@/lib/api/materialSystem'
import type { DimensionGroup } from '@/types/materialSystem'

const groups = ref<DimensionGroup[]>([])
const loading = ref(true)
const saving = ref(false)
const showAddDialog = ref(false)

const newGroup = ref({
  group_code: '',
  group_name: '',
  display_format: 'table' as 'table' | 'dropdown',
  sort_order: 0,
  is_active: true
})

const loadGroups = async () => {
  try {
    loading.value = true
    groups.value = await getDimensionGroups()
  } catch (error) {
    console.error('Error loading dimension groups:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  try {
    saving.value = true
    await createDimensionGroup(newGroup.value)
    showAddDialog.value = false
    newGroup.value = {
      group_code: '',
      group_name: '',
      display_format: 'table',
      sort_order: 0,
      is_active: true
    }
    await loadGroups()
  } catch (error) {
    console.error('Error creating dimension group:', error)
    alert('Failed to create dimension group')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Are you sure you want to delete this dimension group?')) return

  try {
    await deleteDimensionGroup(id)
    await loadGroups()
  } catch (error) {
    console.error('Error deleting dimension group:', error)
    alert('Failed to delete dimension group')
  }
}

onMounted(() => {
  loadGroups()
})
</script>
