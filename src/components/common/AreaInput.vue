<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrevious"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="showDropdown = false"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="{ 'pr-10': searchQuery }"
      />
      
      <!-- Dropdown arrow -->
      <button
        v-if="!disabled"
        type="button"
        @mousedown.prevent="toggleDropdown"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>

    <!-- Dropdown Options -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown && !disabled"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
      >
        <!-- Loading state -->
        <div v-if="loading" class="px-4 py-3 text-sm text-gray-500">
          Loading...
        </div>

        <!-- No results / Create new option -->
        <div v-else-if="filteredOptions.length === 0">
          <button
            type="button"
            @mousedown.prevent="createNew"
            class="w-full px-4 py-3 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none"
          >
            <div class="flex items-center gap-2 text-green-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span class="font-medium">Create "{{ searchQuery }}"</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">Code will be: {{ generateCode(searchQuery) }}</div>
          </button>
        </div>

        <!-- Options list -->
        <div v-else>
          <button
            v-for="(option, index) in filteredOptions"
            :key="option.id"
            type="button"
            @mousedown.prevent="selectOption(option)"
            :class="[
              'w-full px-4 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none',
              { 'bg-primary-100': index === highlightedIndex }
            ]"
          >
            <div class="text-sm font-medium text-gray-900">{{ option.name }}</div>
            <div class="text-xs text-gray-500">{{ option.code }}</div>
          </button>

          <!-- Create new option at bottom if searching -->
          <button
            v-if="searchQuery && !exactMatch"
            type="button"
            @mousedown.prevent="createNew"
            class="w-full px-4 py-3 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200"
          >
            <div class="flex items-center gap-2 text-green-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span class="font-medium">Create "{{ searchQuery }}"</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">Code will be: {{ generateCode(searchQuery) }}</div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  projectId: {
    type: String,
    required: true
  },
  table: {
    type: String,
    required: true // 'main_areas', 'sub_areas_1', 'sub_areas_2'
  },
  parentId: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: 'Enter or search...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const inputRef = ref(null)
const searchQuery = ref(props.modelValue)
const showDropdown = ref(false)
const loading = ref(false)
const options = ref([])
const highlightedIndex = ref(-1)

// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) return options.value
  
  const query = searchQuery.value.toLowerCase()
  return options.value.filter(opt => 
    opt.name.toLowerCase().includes(query) || 
    opt.code.toLowerCase().includes(query)
  )
})

// Check if there's an exact match
const exactMatch = computed(() => {
  return filteredOptions.value.some(opt => 
    opt.name.toLowerCase() === searchQuery.value.toLowerCase()
  )
})

// Generate code from name
const generateCode = (name) => {
  if (!name) return ''
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20)
}

// Get column names based on table
const getColumnNames = () => {
  switch (props.table) {
    case 'main_areas':
      return { name: 'main_area_name', code: 'area_code' }
    case 'sub_areas_1':
      return { name: 'sub_area_1_name', code: 'sub_area_1_code' }
    case 'sub_areas_2':
      return { name: 'sub_area_2_name', code: 'sub_area_2_code' }
    default:
      return { name: 'name', code: 'code' }
  }
}

// Load options from database
const loadOptions = async () => {
  console.log(`🔍 DEBUG [AreaInput ${props.table}]: loadOptions called with:`, {
    projectId: props.projectId,
    parentId: props.parentId,
    disabled: props.disabled,
    modelValue: props.modelValue
  })
  
  if (!props.projectId && props.table === 'main_areas') return
  if (!props.parentId && (props.table === 'sub_areas_1' || props.table === 'sub_areas_2')) {
    console.log(`🔍 DEBUG [AreaInput ${props.table}]: Skipping load - no parentId`)
    return
  }
  
  loading.value = true
  try {
    const columns = getColumnNames()
    let query = supabase
      .from(props.table)
      .select(`id, ${columns.name}, ${columns.code}`)
      .order(columns.name)

    // Filter based on table type
    if (props.table === 'main_areas') {
      // Main areas are filtered by project_id
      query = query.eq('project_id', props.projectId)
    } else if (props.table === 'sub_areas_1') {
      // Sub areas 1 are filtered by main_area_id only
      query = query.eq('main_area_id', props.parentId)
    } else if (props.table === 'sub_areas_2') {
      // Sub areas 2 are filtered by sub_area_1_id only
      query = query.eq('sub_area_1_id', props.parentId)
    }

    const { data, error } = await query

    if (error) throw error
    
    console.log(`🔍 DEBUG [AreaInput ${props.table}]: Loaded ${data?.length || 0} options:`, data)
    
    // Map to standardized format
    options.value = (data || []).map(item => ({
      id: item.id,
      name: item[columns.name],
      code: item[columns.code]
    }))
    
    console.log(`🔍 DEBUG [AreaInput ${props.table}]: Mapped options:`, options.value)
  } catch (error) {
    console.error(`❌ ERROR [AreaInput ${props.table}]:`, error)
    options.value = []
  } finally {
    loading.value = false
  }
}

// Handle input change
const handleInput = () => {
  emit('update:modelValue', searchQuery.value)
  showDropdown.value = true
  highlightedIndex.value = -1
}

// Handle blur with delay for click events
const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Toggle dropdown
const toggleDropdown = () => {
  if (!props.disabled) {
    showDropdown.value = !showDropdown.value
    if (showDropdown.value) {
      inputRef.value?.focus()
    }
  }
}

// Select option
const selectOption = (option) => {
  searchQuery.value = option.name
  emit('update:modelValue', option.name)
  emit('select', option)
  showDropdown.value = false
}

// Create new option
const createNew = async () => {
  if (!searchQuery.value.trim()) return
  
  const newName = searchQuery.value.trim()
  const newCode = generateCode(newName)
  const columns = getColumnNames()
  
  try {
    const newItem = {
      [columns.name]: newName,
      [columns.code]: newCode
    }

    // Add appropriate ID based on table type
    if (props.table === 'main_areas') {
      newItem.project_id = props.projectId
    } else if (props.table === 'sub_areas_1') {
      newItem.main_area_id = props.parentId
    } else if (props.table === 'sub_areas_2') {
      newItem.sub_area_1_id = props.parentId
    }

    const { data, error } = await supabase
      .from(props.table)
      .insert([newItem])
      .select()
      .single()

    if (error) throw error

    // Map to standardized format and add to options
    const mappedData = {
      id: data.id,
      name: data[columns.name],
      code: data[columns.code]
    }
    options.value.push(mappedData)
    
    // Select the newly created option
    selectOption(mappedData)
  } catch (error) {
    console.error('Error creating new option:', error)
    alert('Failed to create new item. Please try again.')
  }
}

// Keyboard navigation
const highlightNext = () => {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

const highlightPrevious = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  } else if (filteredOptions.value.length === 0 || !exactMatch.value) {
    createNew()
  }
}

// Watch for modelValue changes from parent
watch(() => props.modelValue, (newVal, oldVal) => {
  console.log(`🔍 DEBUG [AreaInput ${props.table}]: modelValue changed from "${oldVal}" to "${newVal}"`)
  searchQuery.value = newVal
})

// Watch for disabled state changes
watch(() => props.disabled, (newVal, oldVal) => {
  console.log(`🔍 DEBUG [AreaInput ${props.table}]: disabled changed from ${oldVal} to ${newVal}`)
})

// Watch for projectId or parentId changes
watch(() => [props.projectId, props.parentId], ([newProjectId, newParentId], [oldProjectId, oldParentId]) => {
  console.log(`🔍 DEBUG [AreaInput ${props.table}]: projectId/parentId changed:`, {
    projectId: `${oldProjectId} -> ${newProjectId}`,
    parentId: `${oldParentId} -> ${newParentId}`
  })
  loadOptions()
}, { immediate: false })

// Load options on mount
onMounted(() => {
  console.log(`🔍 DEBUG [AreaInput ${props.table}]: Mounted with:`, {
    modelValue: props.modelValue,
    projectId: props.projectId,
    parentId: props.parentId,
    disabled: props.disabled
  })
  loadOptions()
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
  transform: translateY(-4px);
}
</style>
