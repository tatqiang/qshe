<template>
  <div class="relative">
    <!-- Dropdown with Add New Option -->
    <div class="relative">
      <select
        v-model="selectedUnit"
        @change="handleChange"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 appearance-none"
      >
        <option value="">Select Unit</option>
        <option v-for="unit in commonUnits" :key="unit.value" :value="unit.value">
          {{ unit.label_th }} / {{ unit.label_en }}
        </option>
        <option value="__ADD_NEW__">+ Add New Unit</option>
        <option value="__MANAGE__">⚙️ Manage Units...</option>
      </select>
      <!-- Dropdown icon -->
      <svg class="w-5 h-5 absolute right-3 top-2.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Add New Unit Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeAddModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Unit</h3>
        
        <div class="space-y-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit Code / Abbreviation
            </label>
            <input
              ref="newUnitInput"
              v-model="newUnit.value"
              type="text"
              placeholder="e.g., pcs, kg, m"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              @keydown.enter="addNewUnit"
              @keydown.esc="closeAddModal"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thai Name
            </label>
            <input
              v-model="newUnit.label_th"
              type="text"
              placeholder="e.g., ชิ้น, กิโลกรัม"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              @keydown.enter="addNewUnit"
              @keydown.esc="closeAddModal"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              English Name
            </label>
            <input
              v-model="newUnit.label_en"
              type="text"
              placeholder="e.g., Piece, Kilogram"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              @keydown.enter="addNewUnit"
              @keydown.esc="closeAddModal"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="closeAddModal"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="addNewUnit"
            :disabled="!newUnit.value.trim() || !newUnit.label_th.trim() || !newUnit.label_en.trim()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add Unit
          </button>
        </div>
      </div>
    </div>

    <!-- Manage Units Modal -->
    <div
      v-if="showManageModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeManageModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Units</h3>
          <button
            type="button"
            @click="closeManageModal"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="overflow-y-auto flex-1">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Thai</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">English</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(unit, index) in commonUnits"
                :key="unit.value"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <input
                    v-if="editingIndex === index"
                    v-model="unit.value"
                    type="text"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span v-else>{{ unit.value }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <input
                    v-if="editingIndex === index"
                    v-model="unit.label_th"
                    type="text"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span v-else>{{ unit.label_th }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <input
                    v-if="editingIndex === index"
                    v-model="unit.label_en"
                    type="text"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span v-else>{{ unit.label_en }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-center">
                  <div v-if="editingIndex === index" class="flex items-center justify-center gap-2">
                    <button
                      @click="saveEdit(index)"
                      class="text-green-600 hover:text-green-800 dark:text-green-400"
                      title="Save"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click="cancelEdit"
                      class="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                      title="Cancel"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-else class="flex items-center justify-center gap-2">
                    <button
                      @click="startEdit(index)"
                      class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      title="Edit"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteUnit(index)"
                      class="text-red-600 hover:text-red-800 dark:text-red-400"
                      title="Delete"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ commonUnits.length }} unit(s) total
          </p>
          <button
            type="button"
            @click="closeManageModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  projectId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

interface Unit {
  value: string
  label_th: string
  label_en: string
}

const selectedUnit = ref(props.modelValue || '')
const showAddModal = ref(false)
const showManageModal = ref(false)
const editingIndex = ref<number | null>(null)
const newUnit = ref<Unit>({ value: '', label_th: '', label_en: '' })
const newUnitInput = ref<HTMLInputElement>()

// Common units with Thai and English labels - You can edit this list
const commonUnits = ref<Unit[]>([
  { value: 'pcs', label_th: 'ชิ้น', label_en: 'Piece' },
  { value: 'box', label_th: 'กล่อง', label_en: 'Box' },
  { value: 'set', label_th: 'ชุด', label_en: 'Set' },
  { value: 'kg', label_th: 'กิโลกรัม', label_en: 'Kilogram' },
  { value: 'g', label_th: 'กรัม', label_en: 'Gram' },
  { value: 'ton', label_th: 'ตัน', label_en: 'Ton' },
  { value: 'm', label_th: 'เมตร', label_en: 'Meter' },
  { value: 'cm', label_th: 'เซนติเมตร', label_en: 'Centimeter' },
  { value: 'mm', label_th: 'มิลลิเมตร', label_en: 'Millimeter' },
  { value: 'm²', label_th: 'ตารางเมตร', label_en: 'Square Meter' },
  { value: 'm³', label_th: 'ลูกบาศก์เมตร', label_en: 'Cubic Meter' },
  { value: 'L', label_th: 'ลิตร', label_en: 'Liter' },
  { value: 'mL', label_th: 'มิลลิลิตร', label_en: 'Milliliter' },
  { value: 'ft', label_th: 'ฟุต', label_en: 'Feet' },
  { value: 'in', label_th: 'นิ้ว', label_en: 'Inch' },
  { value: 'yd', label_th: 'หลา', label_en: 'Yard' },
  { value: 'sqft', label_th: 'ตารางฟุต', label_en: 'Square Feet' },
  { value: 'roll', label_th: 'ม้วน', label_en: 'Roll' },
  { value: 'sheet', label_th: 'แผ่น', label_en: 'Sheet' },
  { value: 'pack', label_th: 'แพ็ค', label_en: 'Pack' },
  { value: 'case', label_th: 'ลัง', label_en: 'Case' },
  { value: 'dozen', label_th: 'โหล', label_en: 'Dozen' },
  { value: 'pair', label_th: 'คู่', label_en: 'Pair' },
  { value: 'length', label_th: 'เส้น', label_en: 'Length' },
  { value: 'coil', label_th: 'ขด', label_en: 'Coil' },
  { value: 'bundle', label_th: 'มัด', label_en: 'Bundle' },
])

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedUnit.value = newVal || ''
})

function handleChange() {
  if (selectedUnit.value === '__ADD_NEW__') {
    // Open add new modal
    showAddModal.value = true
    selectedUnit.value = props.modelValue // Reset to previous value
    nextTick(() => {
      newUnitInput.value?.focus()
    })
  } else if (selectedUnit.value === '__MANAGE__') {
    // Open manage units modal
    showManageModal.value = true
    selectedUnit.value = props.modelValue // Reset to previous value
  } else {
    // Emit selected unit
    emit('update:modelValue', selectedUnit.value)
  }
}

function addNewUnit() {
  const trimmedValue = newUnit.value.value.trim()
  const trimmedTH = newUnit.value.label_th.trim()
  const trimmedEN = newUnit.value.label_en.trim()
  
  if (!trimmedValue || !trimmedTH || !trimmedEN) return

  // Check if unit already exists
  const exists = commonUnits.value.find(u => u.value === trimmedValue)
  if (!exists) {
    // Add to list
    commonUnits.value.push({
      value: trimmedValue,
      label_th: trimmedTH,
      label_en: trimmedEN
    })
    // Sort by value
    commonUnits.value.sort((a, b) => a.value.localeCompare(b.value))
  }

  // Select the new unit
  selectedUnit.value = trimmedValue
  emit('update:modelValue', trimmedValue)

  // Close modal
  closeAddModal()
}

function closeAddModal() {
  showAddModal.value = false
  newUnit.value = { value: '', label_th: '', label_en: '' }
}

function closeManageModal() {
  showManageModal.value = false
  editingIndex.value = null
}

function startEdit(_index: number) {
  editingIndex.value = _index
}

function saveEdit(_index: number) {
  editingIndex.value = null
  // Sort after edit
  commonUnits.value.sort((a, b) => a.value.localeCompare(b.value))
}

function cancelEdit() {
  editingIndex.value = null
}

function deleteUnit(index: number) {
  if (confirm('Are you sure you want to delete this unit?')) {
    commonUnits.value.splice(index, 1)
  }
}
</script>

<style scoped>
/* Remove default select arrow for custom styling */
select {
  background-image: none;
}
</style>
