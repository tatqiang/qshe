<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Dimensions</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Individual sizes (1/2", 3/4") with common/custom filtering
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Export/Import Buttons -->
        <button
          @click="exportToExcel"
          :disabled="!selectedGroupId"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="selectedGroupId ? 'Export selected group to Excel' : 'Please select a group first'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
        <button
          @click="triggerImport"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
          title="Import from Excel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          @change="handleFileImport"
          class="hidden"
        />
        <!-- Spreadsheet Modal Button -->
        <button
          @click="openSpreadsheetEditor"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
          title="Open Excel-like Editor"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Spreadsheet Editor
        </button>
      </div>
    </div>

    <!-- Dimension Group Filter -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Dimension Group
      </label>
      <select
        v-model="selectedGroupId"
        class="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
      >
        <option :value="null">All Groups</option>
        <option v-for="group in dimensionGroups" :key="group.id" :value="group.id">
          {{ group.group_name }}
        </option>
      </select>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="filteredDimensions.length === 0" class="text-center py-8 text-gray-500">
      No dimensions found. Click "Spreadsheet Editor" to create one.
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="dimension in filteredDimensions"
        :key="dimension.id"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        <div>
          <div class="font-medium text-gray-900 dark:text-gray-100">
            {{ formatDimensionDisplay(dimension) }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <span 
              :class="dimension.dimension_type === 'common'
                ? 'text-green-600 dark:text-green-400'
                : 'text-orange-600 dark:text-orange-400'"
              class="font-semibold"
            >
              {{ dimension.dimension_type }}
            </span>
            | Group: {{ dimension.dimension_group?.group_name || 'N/A' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddDialog = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Dimension</h3>
        <form @submit.prevent="handleAdd">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dimension Group *
              </label>
              <select
                v-model="newDimension.dimension_group_id"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="null">Select Group</option>
                <option v-for="group in dimensionGroups" :key="group.id" :value="group.id">
                  {{ group.group_name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size 1 *
              </label>
              <input
                v-model="newDimension.size_1"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 1/2 inch"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size 2
              </label>
              <input
                v-model="newDimension.size_2"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 15 mm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dimension Type *
              </label>
              <select
                v-model="newDimension.dimension_type"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="common">Common</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <input
                v-model.number="newDimension.display_order"
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

    <!-- Spreadsheet Modal -->
    <div
      v-if="showSpreadsheetModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeSpreadsheetModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg w-[95vw] h-[90vh] flex flex-col">
        <div class="p-4 border-b dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Excel-like Spreadsheet Editor</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Select cells, copy/paste, drag to fill</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="addRowInSpreadsheet"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
              <button
                @click="saveSpreadsheetChanges"
                :disabled="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ saving ? 'Saving...' : 'Save All Changes' }}
              </button>
              <button
                @click="closeSpreadsheetModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
          
          <!-- Filter in Modal -->
          <div class="flex items-center gap-4">
            <div class="flex-1 max-w-xs">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Group
              </label>
              <select
                v-model="modalGroupFilter"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="null">All Groups</option>
                <option v-for="group in dimensionGroups" :key="group.id" :value="group.id">
                  {{ group.group_name }}
                </option>
              </select>
            </div>
            <div class="flex-1 max-w-md">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search dimensions..."
                  class="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                />
                <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 pt-6">
              {{ filteredSpreadsheetData.length }} row(s) displayed
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <div class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-x-auto overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700" @paste="handlePaste">
              <thead class="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-12 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">#</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Group</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Size 1</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Size 2</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Size 3</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[150px]">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[120px]">Display Order</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(row, rowIndex) in filteredSpreadsheetData" :key="row.id || `new-${rowIndex}`">
                  <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800 z-10">{{ rowIndex + 1 }}</td>
                  <td class="px-1 py-1">
                    <select
                      v-model="row.dimension_group_id"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      @focus="selectCell(rowIndex, 0)"
                    >
                      <option :value="null">Select Group</option>
                      <option v-for="group in dimensionGroups" :key="group.id" :value="group.id">
                        {{ group.group_name }}
                      </option>
                    </select>
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.size_1"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 1}"
                      @focus="selectCell(rowIndex, 1)"
                      @keydown="handleKeyDown($event, rowIndex, 1)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.size_2"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 2}"
                      @focus="selectCell(rowIndex, 2)"
                      @keydown="handleKeyDown($event, rowIndex, 2)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.size_3"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 3}"
                      @focus="selectCell(rowIndex, 3)"
                      @keydown="handleKeyDown($event, rowIndex, 3)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <select
                      v-model="row.dimension_type"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      @focus="selectCell(rowIndex, 4)"
                    >
                      <option value="common">Common</option>
                      <option value="custom">Custom</option>
                    </select>
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="row.display_order"
                      type="number"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 5}"
                      @focus="selectCell(rowIndex, 5)"
                      @keydown="handleKeyDown($event, rowIndex, 5)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <p class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Keyboard Shortcuts:</p>
            <ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <kbd class="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Tab</kbd> / <kbd class="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Enter</kbd> - Move to next cell</li>
              <li>• <kbd class="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Shift+Tab</kbd> - Move to previous cell</li>
              <li>• <kbd class="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Ctrl+C</kbd> / <kbd class="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Ctrl+V</kbd> - Copy and paste (works with Excel!)</li>
              <li>• Select cells from Excel and paste directly into the table</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { getDimensions, getDimensionGroups, createDimension, updateDimension, deleteDimension, formatDimensionDisplay } from '@/lib/api/materialSystem'
import type { Dimension, DimensionGroup } from '@/types/materialSystem'

const dimensions = ref<Dimension[]>([])
const dimensionGroups = ref<DimensionGroup[]>([])
const loading = ref(true)
const saving = ref(false)
const showAddDialog = ref(false)
const showSpreadsheetModal = ref(false)
const selectedGroupId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Spreadsheet editor state
const spreadsheetData = ref<any[]>([])
const selectedCell = ref<{ row: number; col: number } | null>(null)
const modalGroupFilter = ref<number | null>(null)
const searchQuery = ref('')

const newDimension = ref({
  dimension_group_id: null as number | null,
  size_1: '',
  size_2: '',
  size_3: '',
  dimension_type: 'common' as 'common' | 'custom',
  display_order: 0,
  is_active: true
})

const filteredDimensions = computed(() => {
  if (!selectedGroupId.value) return dimensions.value
  return dimensions.value.filter(d => d.dimension_group_id === selectedGroupId.value)
})

const filteredSpreadsheetData = computed(() => {
  let filtered = spreadsheetData.value
  
  // Filter by group
  if (modalGroupFilter.value !== null) {
    filtered = filtered.filter(d => d.dimension_group_id === modalGroupFilter.value)
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(d => {
      const groupName = dimensionGroups.value?.find(g => g.id === d.dimension_group_id)?.group_name || ''
      const searchableText = [
        groupName,
        d.size_1 || '',
        d.size_2 || '',
        d.size_3 || '',
        d.dimension_type || ''
      ].join(' ').toLowerCase()
      
      return searchableText.includes(query)
    })
  }
  
  return filtered
})

const loadDimensions = async () => {
  try {
    loading.value = true
    dimensions.value = await getDimensions()
  } catch (error) {
    console.error('Error loading dimensions:', error)
  } finally {
    loading.value = false
  }
}

const loadDimensionGroups = async () => {
  try {
    dimensionGroups.value = await getDimensionGroups()
  } catch (error) {
    console.error('Error loading dimension groups:', error)
  }
}

const handleAdd = async () => {
  if (!newDimension.value.dimension_group_id) {
    alert('Please select a dimension group')
    return
  }

  try {
    saving.value = true
    await createDimension(newDimension.value)
    showAddDialog.value = false
    newDimension.value = {
      dimension_group_id: null,
      size_1: '',
      size_2: '',
      size_3: '',
      dimension_type: 'common',
      display_order: 0,
      is_active: true
    }
    await loadDimensions()
  } catch (error) {
    console.error('Error creating dimension:', error)
    alert('Failed to create dimension')
  } finally {
    saving.value = false
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleDelete = async (id: number) => {
  if (!confirm('Are you sure you want to delete this dimension?')) return

  try {
    await deleteDimension(id)
    await loadDimensions()
  } catch (error) {
    console.error('Error deleting dimension:', error)
    alert('Failed to delete dimension')
  }
}

// Export to Excel
const exportToExcel = () => {
  if (!selectedGroupId.value) {
    alert('Please select a group to export')
    return
  }
  
  try {
    // Export only the selected group
    const groupedData: any[] = []
    
    // Get the selected group
    const selectedGroup = dimensionGroups.value.find(g => g.id === selectedGroupId.value)
    if (!selectedGroup) {
      alert('Selected group not found')
      return
    }
    
    // Get dimensions for selected group only
    const group = selectedGroup
    const groupDimensions = dimensions.value.filter(d => d.dimension_group_id === group.id)
    
    if (groupDimensions.length === 0) {
      alert('No dimensions found for the selected group')
      return
    }
    
    // Add group header
    groupedData.push({
      'ID': '',
      'Dimension Group': `=== ${group.group_name} ===`,
      'Size 1': '',
      'Size 2': '',
      'Size 3': '',
      'Type': '',
      'Display Order': ''
    })
    
    // Add dimensions
    groupDimensions.forEach(dimension => {
      groupedData.push({
        'ID': dimension.id || '',
        'Dimension Group': group.group_name,
        'Size 1': dimension.size_1 || '',
        'Size 2': dimension.size_2 || '',
        'Size 3': dimension.size_3 || '',
        'Type': dimension.dimension_type || 'common',
        'Display Order': dimension.display_order || 0
      })
    })
    
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(groupedData)
    
    // Hide ID column by setting width to 0
    if (!ws['!cols']) ws['!cols'] = []
    ws['!cols'][0] = { hidden: true, width: 0 }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dimensions')
    
    // Generate filename with date and group name
    const date = new Date().toISOString().split('T')[0]
    const groupName = group.group_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `dimensions_${groupName}_${date}.xlsx`
    
    // Download file
    XLSX.writeFile(wb, filename)
    
    console.log(`✅ Exported ${groupDimensions.length} dimensions from group "${group.group_name}" to ${filename}`)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    alert('Failed to export to Excel')
  }
}

// Trigger file input for import
const triggerImport = () => {
  fileInput.value?.click()
}

// Handle file import with upsert logic (update if ID exists, insert if ID is null)
const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('No sheets found in workbook')
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) throw new Error('Worksheet not found')
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
    
    // Parse and validate imported data
    const toCreate: any[] = []
    const toUpdate: any[] = []
    const errors: string[] = []
    
    for (const row of jsonData as any[]) {
      // Skip header rows and empty rows
      if (!row['Dimension Group'] || row['Dimension Group'].startsWith('===')) {
        continue
      }
      
      // Find the group by name
      const group = dimensionGroups.value.find(g => g.group_name === row['Dimension Group'])
      if (!group) {
        errors.push(`Row skipped: Group not found - ${row['Dimension Group']}`)
        continue
      }
      
      const dimensionData = {
        dimension_group_id: group.id,
        size_1: row['Size 1'] || '',
        size_2: row['Size 2'] || '',
        size_3: row['Size 3'] || '',
        dimension_type: row['Type'] || 'common',
        display_order: row['Display Order'] || 0,
        is_active: true
      }
      
      // Check if ID exists - if yes, it's an update, otherwise it's a create
      const id = row['ID']
      if (id && typeof id === 'number') {
        // Verify ID exists in current dimensions
        const existingDimension = dimensions.value.find(d => d.id === id)
        if (existingDimension) {
          toUpdate.push({ id, ...dimensionData })
        } else {
          errors.push(`Row skipped: ID ${id} not found in database`)
        }
      } else {
        // No ID or invalid ID - create new
        toCreate.push(dimensionData)
      }
    }
    
    // Show summary
    const totalOperations = toCreate.length + toUpdate.length
    if (totalOperations === 0) {
      alert(errors.length > 0 
        ? `No valid rows found.\n\nErrors:\n${errors.join('\n')}`
        : 'No valid dimensions found in file')
      return
    }
    
    const confirmMessage = `Ready to import:
• ${toCreate.length} new dimension(s) will be added
• ${toUpdate.length} existing dimension(s) will be updated
${errors.length > 0 ? `\n⚠️ ${errors.length} row(s) skipped due to errors` : ''}

Continue?`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    // Perform import with progress tracking
    saving.value = true
    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0
    
    // Create new dimensions
    for (const dimension of toCreate) {
      try {
        await createDimension(dimension)
        createdCount++
      } catch (error) {
        console.error('Error creating dimension:', error)
        errorCount++
      }
    }
    
    // Update existing dimensions
    for (const dimension of toUpdate) {
      try {
        const { id, ...updateData } = dimension
        await updateDimension(id, updateData)
        updatedCount++
      } catch (error) {
        console.error('Error updating dimension:', error)
        errorCount++
      }
    }
    
    await loadDimensions()
    
    // Show detailed results
    const resultMessage = `✅ Import Complete!

Added: ${createdCount} dimension(s)
Updated: ${updatedCount} dimension(s)
${errorCount > 0 ? `❌ Failed: ${errorCount} dimension(s)` : ''}
${errors.length > 0 ? `⚠️ Skipped: ${errors.length} row(s)` : ''}`
    
    alert(resultMessage)
  } catch (error) {
    console.error('Error importing file:', error)
    alert('Failed to import file. Please check the format.')
  } finally {
    saving.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// Spreadsheet editor functions
const selectCell = (row: number, col: number) => {
  selectedCell.value = { row, col }
}

const handleKeyDown = (event: KeyboardEvent, row: number, col: number) => {
  if (event.key === 'Tab') {
    event.preventDefault()
    const nextCol = event.shiftKey ? col - 1 : col + 1
    if (nextCol >= 1 && nextCol <= 5) {
      focusCell(row, nextCol)
    } else if (!event.shiftKey && nextCol > 5) {
      // Move to next row, first column
      if (row + 1 < spreadsheetData.value.length) {
        focusCell(row + 1, 1)
      }
    } else if (event.shiftKey && nextCol < 1) {
      // Move to previous row, last column
      if (row > 0) {
        focusCell(row - 1, 5)
      }
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (row + 1 < spreadsheetData.value.length) {
      focusCell(row + 1, col)
    }
  }
}

const focusCell = (row: number, col: number) => {
  const table = document.querySelector('.fixed table')
  if (!table) return
  
  const inputs = table.querySelectorAll(`tbody tr:nth-child(${row + 1}) input`)
  const input = inputs[col - 1] as HTMLInputElement
  if (input) {
    input.focus()
    input.select()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  if (!selectedCell.value) return
  
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text')
  if (!pastedData) return
  
  // Parse pasted data (tab-separated for Excel)
  const rows = pastedData.split('\n').filter(r => r.trim())
  const startRow = selectedCell.value.row
  const startCol = selectedCell.value.col
  
  rows.forEach((rowData, rowOffset) => {
    const cells = rowData.split('\t')
    const targetRow = startRow + rowOffset
    
    // Ensure we have enough rows
    while (spreadsheetData.value.length <= targetRow) {
      addRowInSpreadsheet()
    }
    
    cells.forEach((cellValue, colOffset) => {
      const targetCol = startCol + colOffset
      const row = spreadsheetData.value[targetRow]
      
      if (targetCol === 1) row.size_1 = cellValue
      else if (targetCol === 2) row.size_2 = cellValue
      else if (targetCol === 3) row.size_3 = cellValue
    })
  })
}

const addRowInSpreadsheet = () => {
  spreadsheetData.value.push({
    dimension_group_id: modalGroupFilter.value,
    size_1: '',
    size_2: '',
    size_3: '',
    dimension_type: 'common',
    display_order: 0,
    _isNew: true
  })
}

const saveSpreadsheetChanges = async () => {
  try {
    saving.value = true
    
    // Separate new and existing dimensions
    const newDimensions = spreadsheetData.value.filter(row => row._isNew && row.dimension_group_id)
    const existingDimensions = spreadsheetData.value.filter(row => !row._isNew && row.id)
    
    // Create new dimensions
    for (const dimension of newDimensions) {
      await createDimension({
        dimension_group_id: dimension.dimension_group_id,
        size_1: dimension.size_1 || '',
        size_2: dimension.size_2 || '',
        size_3: dimension.size_3 || '',
        dimension_type: dimension.dimension_type || 'common',
        display_order: dimension.display_order || 0,
        is_active: true
      })
    }
    
    // Update existing dimensions
    for (const dimension of existingDimensions) {
      await updateDimension(dimension.id, {
        size_1: dimension.size_1,
        size_2: dimension.size_2,
        size_3: dimension.size_3,
        dimension_type: dimension.dimension_type,
        display_order: dimension.display_order
      })
    }
    
    await loadDimensions()
    showSpreadsheetModal.value = false
    alert(`✅ Saved ${newDimensions.length + existingDimensions.length} dimensions`)
  } catch (error) {
    console.error('Error saving spreadsheet changes:', error)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}

const closeSpreadsheetModal = () => {
  if (spreadsheetData.value.some(r => r._isNew || r._modified)) {
    if (!confirm('You have unsaved changes. Close anyway?')) {
      return
    }
  }
  showSpreadsheetModal.value = false
  selectedCell.value = null
}

// Open spreadsheet editor with current data
const openSpreadsheetEditor = () => {
  // Load all dimensions into spreadsheet
  spreadsheetData.value = dimensions.value.map(d => ({ ...d, _isNew: false }))
  
  // Set initial filter from main page filter
  modalGroupFilter.value = selectedGroupId.value
  
  showSpreadsheetModal.value = true
}

onMounted(async () => {
  await loadDimensionGroups()
  await loadDimensions()
})
</script>
