<template>
  <div class="relative">
    <!-- Search Input with Dropdown (only show when no selection) -->
    <div v-if="!selectedTemplate" class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search material templates..."
        class="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        @focus="showDropdown = true"
        @input="showDropdown = true"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />
      <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <button
        v-if="searchQuery"
        @click="clearSelection"
        class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Filter by Group -->
    <div v-if="showDropdown" class="mt-2">
      <select
        v-model="selectedGroupFilter"
        @click.stop
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 text-sm"
      >
        <option :value="null">All Groups</option>
        <option v-for="group in materialGroups" :key="group.id" :value="group.id">
          {{ group.group_name }}
        </option>
      </select>
    </div>

    <!-- Dropdown Results -->
    <div
      v-if="showDropdown && filteredTemplates.length > 0"
      class="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
    >
      <button
        v-for="(template, index) in filteredTemplates"
        :key="template.id"
        type="button"
        @click="selectTemplate(template)"
        @mouseenter="highlightedIndex = index"
        class="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
        :class="{
          'bg-blue-50 dark:bg-gray-700': highlightedIndex === index,
          'bg-green-50 dark:bg-green-900/20': isInInventory(template.id)
        }"
      >
        <div class="flex flex-col gap-1">
          <!-- Template Titles (Thai - Priority) -->
          <div class="font-medium text-gray-900 dark:text-gray-100">
            <span v-if="template.title_1_th">{{ template.title_1_th }}</span>
            <span v-else-if="template.title_1">{{ template.title_1 }}</span>
            <span v-if="template.title_2_th"> | {{ template.title_2_th }}</span>
            <span v-else-if="template.title_2"> | {{ template.title_2 }}</span>
            <span v-if="template.title_3_th"> | {{ template.title_3_th }}</span>
            <span v-else-if="template.title_3"> | {{ template.title_3 }}</span>
            <span v-if="template.title_4_th"> | {{ template.title_4_th }}</span>
            <span v-else-if="template.title_4"> | {{ template.title_4 }}</span>
            <span v-if="template.title_5_th"> | {{ template.title_5_th }}</span>
            <span v-else-if="template.title_5"> | {{ template.title_5 }}</span>
          </div>
          <!-- Template Titles (English - Secondary) -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="template.title_1 && template.title_1_th">{{ template.title_1 }}</span>
            <span v-if="template.title_2 && template.title_2_th"> | {{ template.title_2 }}</span>
            <span v-if="template.title_3 && template.title_3_th"> | {{ template.title_3 }}</span>
            <span v-if="template.title_4 && template.title_4_th"> | {{ template.title_4 }}</span>
            <span v-if="template.title_5 && template.title_5_th"> | {{ template.title_5 }}</span>
          </div>
          <!-- Group and Dimension Info -->
          <div class="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-3">
            <span v-if="isInInventory(template.id)" class="text-green-600 dark:text-green-400 font-medium">✓ In Inventory</span>
            <span v-if="template.material_group" class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ template.material_group.group_name }}
            </span>
            <span v-if="template.dimension_group" class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              {{ template.dimension_group.group_name }}
            </span>
          </div>
        </div>
      </button>
    </div>

    <!-- No Results -->
    <div
      v-else-if="showDropdown && searchQuery && filteredTemplates.length === 0"
      class="absolute z-50 w-full mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg text-center text-gray-500 dark:text-gray-400"
    >
      No templates found matching "{{ searchQuery }}"
    </div>

    <!-- Selected Template Display -->
    <div v-if="selectedTemplate" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="text-sm font-medium text-green-900 dark:text-green-100">
            <span v-if="selectedTemplate.title_1_th">{{ selectedTemplate.title_1_th }}</span>
            <span v-else-if="selectedTemplate.title_1">{{ selectedTemplate.title_1 }}</span>
            <span v-if="selectedTemplate.title_2_th"> | {{ selectedTemplate.title_2_th }}</span>
            <span v-else-if="selectedTemplate.title_2"> | {{ selectedTemplate.title_2 }}</span>
            <span v-if="selectedTemplate.title_3_th"> | {{ selectedTemplate.title_3_th }}</span>
            <span v-else-if="selectedTemplate.title_3"> | {{ selectedTemplate.title_3 }}</span>
            <span v-if="selectedTemplate.title_4_th"> | {{ selectedTemplate.title_4_th }}</span>
            <span v-else-if="selectedTemplate.title_4"> | {{ selectedTemplate.title_4 }}</span>
            <span v-if="selectedTemplate.title_5_th"> | {{ selectedTemplate.title_5_th }}</span>
            <span v-else-if="selectedTemplate.title_5"> | {{ selectedTemplate.title_5 }}</span>
          </div>
          <div class="text-xs text-green-700 dark:text-green-300 mt-1">
            <span v-if="selectedTemplate.material_group">{{ selectedTemplate.material_group.group_name }}</span>
            <span v-if="selectedTemplate.dimension_group" class="ml-2">• {{ selectedTemplate.dimension_group.group_name }}</span>
          </div>
        </div>
        <button
          type="button"
          @click="clearSelection"
          class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getMaterialTemplates, getMaterialGroups } from '@/lib/api/materialSystem'
import type { MaterialTemplate, MaterialGroup } from '@/types/materialSystem'

const props = defineProps<{
  modelValue?: number | null
  projectId: string
  showInventoryIndicator?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  select: [template: MaterialTemplate]
}>()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement>()
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const selectedGroupFilter = ref<number | null>(null)

const templates = ref<MaterialTemplate[]>([])
const materialGroups = ref<MaterialGroup[]>([])
const selectedTemplate = ref<MaterialTemplate | null>(null)
const loading = ref(false)
const existingInventory = ref<Set<number>>(new Set())

// Check if template exists in inventory
function isInInventory(templateId: number): boolean {
  return props.showInventoryIndicator && existingInventory.value.has(templateId)
}

// Load data on mount
onMounted(async () => {
  loading.value = true
  try {
    const [templatesData, groupsData] = await Promise.all([
      getMaterialTemplates(),
      getMaterialGroups()
    ])
    templates.value = templatesData
    materialGroups.value = groupsData
    
    // If modelValue provided, find and set selected template
    if (props.modelValue) {
      selectedTemplate.value = templates.value.find(t => t.id === props.modelValue) || null
      if (selectedTemplate.value) {
        searchQuery.value = formatTemplateDisplay(selectedTemplate.value)
      }
    }
  } catch (error) {
    console.error('Error loading material templates:', error)
  } finally {
    loading.value = false
  }
})

// Multi-phrase search filter (comma-separated)
const filteredTemplates = computed(() => {
  let result = templates.value

  // Filter by group
  if (selectedGroupFilter.value !== null) {
    result = result.filter(t => t.material_group_id === selectedGroupFilter.value)
  }

  // Filter by search query (multi-phrase)
  if (searchQuery.value.trim()) {
    const phrases = searchQuery.value
      .toLowerCase()
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    result = result.filter(template => {
      const searchableText = [
        template.title_1,
        template.title_2,
        template.title_3,
        template.title_4,
        template.title_5,
        template.title_1_th,
        template.title_2_th,
        template.title_3_th,
        template.title_4_th,
        template.title_5_th,
        template.material_group?.group_name,
        template.dimension_group?.group_name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      // Match ALL phrases (AND logic)
      return phrases.every(phrase => searchableText.includes(phrase))
    })
  }

  return result
})

// Keyboard navigation
function navigateDown() {
  if (highlightedIndex.value < filteredTemplates.value.length - 1) {
    highlightedIndex.value++
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  const template = filteredTemplates.value[highlightedIndex.value]
  if (template) {
    selectTemplate(template)
  }
}

function selectTemplate(template: MaterialTemplate) {
  selectedTemplate.value = template
  searchQuery.value = formatTemplateDisplay(template)
  showDropdown.value = false
  highlightedIndex.value = 0
  
  emit('update:modelValue', template.id)
  emit('select', template)
}

function formatTemplateDisplay(template: MaterialTemplate): string {
  const parts = [
    template.title_1_th || template.title_1,
    template.title_2_th || template.title_2,
    template.title_3_th || template.title_3,
    template.title_4_th || template.title_4,
    template.title_5_th || template.title_5
  ].filter(Boolean)
  return parts.join(' | ')
}

function clearSelection() {
  selectedTemplate.value = null
  searchQuery.value = ''
  showDropdown.value = false
  highlightedIndex.value = 0
  emit('update:modelValue', null)
}

function closeDropdown() {
  showDropdown.value = false
  if (selectedTemplate.value) {
    searchQuery.value = formatTemplateDisplay(selectedTemplate.value)
  } else {
    searchQuery.value = ''
  }
}

// Watch for changes in group filter
watch(selectedGroupFilter, () => {
  highlightedIndex.value = 0
})

// Watch for changes in search query
watch(searchQuery, () => {
  highlightedIndex.value = 0
})

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (searchInput.value && !searchInput.value.contains(e.target as Node)) {
      closeDropdown()
    }
  })
})
</script>

<style scoped>
/* Optional: Add smooth scrolling to highlighted item */
.hover\:bg-blue-50:hover {
  scroll-margin-top: 1rem;
  scroll-margin-bottom: 1rem;
}
</style>
