<template>
  <div class="relative">
    <!-- Searchable Input -->
    <div class="relative">
      <input
        v-if="!autoFilled"
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="showDropdown = true"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrevious"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="showDropdown = false"
        class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
      />

      <input
        v-else
        :value="displayCode"
        readonly
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-100"
      />

      <!-- Dropdown arrow -->
      <button
        v-if="!autoFilled"
        type="button"
        @mousedown.prevent="toggleDropdown"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>

    <!-- Dropdown Options -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown && !autoFilled"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
      >
        <!-- Material Code Options -->
        <div v-if="filteredCodes.length > 0">
          <button
            v-for="(code, index) in filteredCodes"
            :key="code.id"
            type="button"
            @mousedown.prevent="selectCode(code)"
            class="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': index === highlightedIndex }"
          >
            <div class="font-medium text-gray-900 dark:text-white">{{ code.material_code }}</div>
            <div v-if="code.description" class="text-sm text-gray-500 dark:text-gray-400">{{ code.description }}</div>
          </button>
        </div>

        <!-- Create New Option -->
        <button
          type="button"
          @mousedown.prevent="openCreateDialog"
          class="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="font-medium">Create New Material Code</span>
          </div>
        </button>

        <!-- No results -->
        <div v-if="filteredCodes.length === 0 && searchQuery" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          No material codes found for "{{ searchQuery }}"
        </div>
      </div>
    </Transition>

    <!-- Create New Dialog -->
    <div
      v-if="showCreateDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showCreateDialog = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create Material Code</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material Code <span class="text-red-500">*</span>
            </label>
            <input
              v-model="newCode.material_code"
              type="text"
              required
              placeholder="e.g., MAT-001"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              v-model="newCode.description"
              type="text"
              placeholder="Optional description"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            @click="showCreateDialog = false"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleCreate"
            :disabled="!newCode.material_code"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMaterialInventory } from '@/composables/useMaterialInventory'

const props = defineProps<{
  modelValue: string | null
  projectId: string
  autoFilled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  select: [code: any]
}>()

const { materialCodes, createMaterialCode } = useMaterialInventory(props.projectId)

const inputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const showCreateDialog = ref(false)
const newCode = ref({
  material_code: '',
  description: ''
})

const filteredCodes = computed(() => {
  if (!searchQuery.value) return materialCodes.value

  const query = searchQuery.value.toLowerCase()
  return materialCodes.value.filter(code =>
    code.material_code.toLowerCase().includes(query) ||
    (code.description && code.description.toLowerCase().includes(query))
  )
})

const displayCode = computed(() => {
  const code = materialCodes.value.find(c => c.id === props.modelValue)
  return code ? `${code.material_code} - ${code.description || ''}` : ''
})

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    inputRef.value?.focus()
  }
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function highlightNext() {
  if (highlightedIndex.value < filteredCodes.value.length - 1) {
    highlightedIndex.value++
  }
}

function highlightPrevious() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (filteredCodes.value[highlightedIndex.value]) {
    selectCode(filteredCodes.value[highlightedIndex.value])
  }
}

function selectCode(code: any) {
  searchQuery.value = code.material_code
  emit('update:modelValue', code.id)
  emit('select', code)
  showDropdown.value = false
}

function openCreateDialog() {
  showCreateDialog.value = true
  showDropdown.value = false
}

async function handleCreate() {
  if (!newCode.value.material_code) return

  try {
    const created = await createMaterialCode({
      project_id: props.projectId,
      material_code: newCode.value.material_code,
      description: newCode.value.description,
      is_active: true
    })

    searchQuery.value = created.material_code
    emit('update:modelValue', created.id)
    emit('select', created)

    showCreateDialog.value = false
    newCode.value = { material_code: '', description: '' }
  } catch (error) {
    console.error('Error creating material code:', error)
    alert('Failed to create material code')
  }
}

// Load selected code name on mount
onMounted(() => {
  if (props.modelValue) {
    const code = materialCodes.value.find(c => c.id === props.modelValue)
    if (code) {
      searchQuery.value = code.material_code
    }
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
