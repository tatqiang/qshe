<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Material Templates</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">5-column flexible classification templates</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Export/Import Buttons -->
        <button
          @click="exportToExcel"
          :disabled="!selectedGroupFilter"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="selectedGroupFilter ? 'Export selected group to Excel' : 'Please select a group first'"
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

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <div class="flex-1 max-w-xs">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filter by Group
        </label>
        <select
          v-model="selectedGroupFilter"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
        >
          <option :value="null">All Groups</option>
          <option v-for="group in materialGroups" :key="group.id" :value="group.id">
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
            v-model="mainSearchQuery"
            type="text"
            placeholder="Search multiple phrases (use comma to separate)..."
            class="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            v-if="mainSearchQuery"
            @click="mainSearchQuery = ''"
            class="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400 pt-6">
        {{ filteredTemplates.length }} row(s) displayed
      </div>
    </div>

    <!-- Excel-like Table -->
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="templates.length === 0" class="text-center py-8 text-gray-500">
      No material templates found. Click "Add Template" to create one.
    </div>
    <div v-else class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style="user-select: text;">
          <thead class="bg-gray-100 dark:bg-gray-700 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 1 (TH)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 2 (TH)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 3 (TH)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 4 (TH)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 5 (TH)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 1 (EN)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 2 (EN)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 3 (EN)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 4 (EN)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Title 5 (EN)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                Dimension Group
              </th>
              <th v-if="editMode" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              
              <!-- Title 1 TH -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_1_th')"
              >
                <span v-if="!isEditing(template.id, 'title_1_th')">{{ template.title_1_th || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_1_th"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 2 TH -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_2_th')"
              >
                <span v-if="!isEditing(template.id, 'title_2_th')">{{ template.title_2_th || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_2_th"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 3 TH -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_3_th')"
              >
                <span v-if="!isEditing(template.id, 'title_3_th')">{{ template.title_3_th || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_3_th"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 4 TH -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_4_th')"
              >
                <span v-if="!isEditing(template.id, 'title_4_th')">{{ template.title_4_th || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_4_th"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 5 TH -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_5_th')"
              >
                <span v-if="!isEditing(template.id, 'title_5_th')">{{ template.title_5_th || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_5_th"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 1 EN -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_1')"
              >
                <span v-if="!isEditing(template.id, 'title_1')">{{ template.title_1 || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_1"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 2 EN -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_2')"
              >
                <span v-if="!isEditing(template.id, 'title_2')">{{ template.title_2 || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_2"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 3 EN -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_3')"
              >
                <span v-if="!isEditing(template.id, 'title_3')">{{ template.title_3 || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_3"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 4 EN -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_4')"
              >
                <span v-if="!isEditing(template.id, 'title_4')">{{ template.title_4 || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_4"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Title 5 EN -->
              <td 
                class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-text"
                :class="editMode ? 'editable-cell' : ''"
                @click="editMode && startEdit($event, template, 'title_5')"
              >
                <span v-if="!isEditing(template.id, 'title_5')">{{ template.title_5 || '' }}</span>
                <input
                  v-else
                  ref="editInput"
                  v-model="template.title_5"
                  @blur="finishEdit(template)"
                  @keydown.enter="finishEdit(template)"
                  @keydown.esc="cancelEdit"
                  class="w-full bg-transparent border-none outline-none p-0 m-0"
                  style="font-size: inherit; font-family: inherit;"
                />
              </td>
              
              <!-- Dimension Group -->
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                <span>{{ getDimensionGroupName(template.dimension_group_id) }}</span>
              </td>
              
              <!-- Actions -->
              <td class="px-4 py-3">
                <div v-if="editMode" class="flex items-center gap-2">
                  <button
                    @click="deleteTemplate(template.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
    </div>

    <!-- Preview Section -->
    <div v-if="templates.length > 0" class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
      <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Template Previews:</h4>
      <div class="space-y-1">
        <div v-for="template in templates" :key="'preview-' + template.id" class="text-sm text-blue-700 dark:text-blue-300">
          • {{ generateTemplatePreview(template) }}
        </div>
      </div>
    </div>

    <!-- Add Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddDialog = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Material Template</h3>
        <form @submit.prevent="handleAdd">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Material Group *
              </label>
              <select
                v-model="newTemplate.material_group_id"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="null">Select Group</option>
                <option v-for="group in materialGroups" :key="group.id" :value="group.id">
                  {{ group.group_name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 1 (e.g., Material Type)
              </label>
              <input
                v-model="newTemplate.title_1"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Black Steel"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 1 (Thai)
              </label>
              <input
                v-model="newTemplate.title_1_th"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., เหล็กดำ"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 2 (e.g., Manufacturing Method)
              </label>
              <input
                v-model="newTemplate.title_2"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., ERW"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 2 (Thai)
              </label>
              <input
                v-model="newTemplate.title_2_th"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., ชนิดเชื่อม"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 3 (e.g., Specification)
              </label>
              <input
                v-model="newTemplate.title_3"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Sch 40, Grade A"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 3 (Thai)
              </label>
              <input
                v-model="newTemplate.title_3_th"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., ข้อกำหนด"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 4 (e.g., Component Type)
              </label>
              <input
                v-model="newTemplate.title_4"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., Pipe / Elbow 45°"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 4 (Thai)
              </label>
              <input
                v-model="newTemplate.title_4_th"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., ท่อ / ข้อโค้ง"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 5 (Optional)
              </label>
              <input
                v-model="newTemplate.title_5"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="Additional classification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title 5 (Thai - Optional)
              </label>
              <input
                v-model="newTemplate.title_5_th"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="เพิ่มเติม"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dimension Group (Optional)
              </label>
              <select
                v-model="newTemplate.dimension_group_id"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="null">None</option>
                <option v-for="dimGroup in dimensionGroups" :key="dimGroup.id" :value="dimGroup.id">
                  {{ dimGroup.group_name }}
                </option>
              </select>
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
                @change="filterSpreadsheetData"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="null">All Groups</option>
                <option v-for="group in materialGroups" :key="group.id" :value="group.id">
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
                  placeholder="Search multiple phrases (use comma to separate)..."
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
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 1 (TH)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 2 (TH)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 3 (TH)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 4 (TH)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 5 (TH)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 1 (EN)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 2 (EN)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 3 (EN)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 4 (EN)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">Title 5 (EN)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[200px]">Dimension Group</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(row, rowIndex) in filteredSpreadsheetData" :key="row.id || `new-${rowIndex}`">
                  <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800 z-10">{{ rowIndex + 1 }}</td>
                  <td class="px-1 py-1">
                    <select
                      v-model="row.material_group_id"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      @focus="selectCell(rowIndex, 0)"
                    >
                      <option :value="null">Select Group</option>
                      <option v-for="group in materialGroups" :key="group.id" :value="group.id">
                        {{ group.group_name }}
                      </option>
                    </select>
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_1_th"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 1}"
                      @focus="selectCell(rowIndex, 1)"
                      @keydown="handleKeyDown($event, rowIndex, 1)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_2_th"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 2}"
                      @focus="selectCell(rowIndex, 2)"
                      @keydown="handleKeyDown($event, rowIndex, 2)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_3_th"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 3}"
                      @focus="selectCell(rowIndex, 3)"
                      @keydown="handleKeyDown($event, rowIndex, 3)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_4_th"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 4}"
                      @focus="selectCell(rowIndex, 4)"
                      @keydown="handleKeyDown($event, rowIndex, 4)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_5_th"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 5}"
                      @focus="selectCell(rowIndex, 5)"
                      @keydown="handleKeyDown($event, rowIndex, 5)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_1"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 6}"
                      @focus="selectCell(rowIndex, 6)"
                      @keydown="handleKeyDown($event, rowIndex, 6)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_2"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 7}"
                      @focus="selectCell(rowIndex, 7)"
                      @keydown="handleKeyDown($event, rowIndex, 7)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_3"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 8}"
                      @focus="selectCell(rowIndex, 8)"
                      @keydown="handleKeyDown($event, rowIndex, 8)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_4"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 9}"
                      @focus="selectCell(rowIndex, 9)"
                      @keydown="handleKeyDown($event, rowIndex, 9)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model="row.title_5"
                      type="text"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      :class="{'bg-blue-50 dark:bg-blue-900/30': selectedCell?.row === rowIndex && selectedCell?.col === 10}"
                      @focus="selectCell(rowIndex, 10)"
                      @keydown="handleKeyDown($event, rowIndex, 10)"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <select
                      v-model="row.dimension_group_id"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                      @focus="selectCell(rowIndex, 11)"
                    >
                      <option :value="null">-</option>
                      <option v-for="dimGroup in dimensionGroups" :key="dimGroup.id" :value="dimGroup.id">
                        {{ dimGroup.group_name }}
                      </option>
                    </select>
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
import { ref, onMounted, computed } from 'vue'
import * as XLSX from 'xlsx'
import {
  getMaterialTemplates,
  getMaterialGroups,
  getDimensionGroups,
  createMaterialTemplate,
  updateMaterialTemplate,
  deleteMaterialTemplate,
  generateTemplatePreview
} from '@/lib/api/materialSystem'
import type { MaterialTemplate, MaterialGroup, DimensionGroup } from '@/types/materialSystem'

const templates = ref<MaterialTemplate[]>([])
const materialGroups = ref<MaterialGroup[]>([])
const dimensionGroups = ref<DimensionGroup[]>([])
const loading = ref(true)
const saving = ref(false)
const showAddDialog = ref(false)
const showSpreadsheetModal = ref(false)
const editMode = ref(false)
const editingCell = ref<{ id: number; field: string } | null>(null)
const editInput = ref<HTMLInputElement | null>(null)
const selectedGroupFilter = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const mainSearchQuery = ref('')

// Spreadsheet editor state
const spreadsheetData = ref<any[]>([])
const selectedCell = ref<{ row: number; col: number } | null>(null)
const modalGroupFilter = ref<number | null>(null)
const searchQuery = ref('')

const newTemplate = ref({
  material_group_id: null as number | null,
  title_1: '',
  title_2: '',
  title_3: '',
  title_4: '',
  title_5: '',
  title_1_th: '',
  title_2_th: '',
  title_3_th: '',
  title_4_th: '',
  title_5_th: '',
  dimension_group_id: null as number | null,
  sort_order: 0,
  is_active: true
})

const loadTemplates = async () => {
  try {
    loading.value = true
    templates.value = await getMaterialTemplates()
  } catch (error) {
    console.error('Error loading material templates:', error)
  } finally {
    loading.value = false
  }
}

const filteredTemplates = computed(() => {
  let filtered = templates.value
  
  // Filter by group
  if (selectedGroupFilter.value !== null) {
    filtered = filtered.filter(t => t.material_group_id === selectedGroupFilter.value)
  }
  
  // Filter by search query (supports multiple phrases separated by comma)
  if (mainSearchQuery.value.trim()) {
    // Split search query by comma into individual phrases
    const searchPhrases = mainSearchQuery.value.toLowerCase().trim().split(',').map(p => p.trim()).filter(p => p)
    
    filtered = filtered.filter(t => {
      // Combine all searchable fields into one string (excluding group names)
      const searchableText = [
        t.title_1 || '',
        t.title_2 || '',
        t.title_3 || '',
        t.title_4 || '',
        t.title_5 || '',
        t.title_1_th || '',
        t.title_2_th || '',
        t.title_3_th || '',
        t.title_4_th || '',
        t.title_5_th || ''
      ].join(' ').toLowerCase()
      
      // Check if ANY of the search phrases match
      return searchPhrases.some(phrase => searchableText.includes(phrase))
    })
  }
  
  return filtered
})

const filteredSpreadsheetData = computed(() => {
  let filtered = spreadsheetData.value
  
  // Filter by group
  if (modalGroupFilter.value !== null) {
    filtered = filtered.filter(t => t.material_group_id === modalGroupFilter.value)
  }
  
  // Filter by search query (supports multiple phrases separated by comma)
  if (searchQuery.value.trim()) {
    // Split search query by comma into individual phrases
    const searchPhrases = searchQuery.value.toLowerCase().trim().split(',').map(p => p.trim()).filter(p => p)
    
    filtered = filtered.filter(t => {
      // Combine all searchable fields into one string (excluding group name)
      const searchableText = [
        t.title_1 || '',
        t.title_2 || '',
        t.title_3 || '',
        t.title_4 || '',
        t.title_5 || '',
        t.title_1_th || '',
        t.title_2_th || '',
        t.title_3_th || '',
        t.title_4_th || '',
        t.title_5_th || ''
      ].join(' ').toLowerCase()
      
      // Check if ALL search phrases are found in the combined text
      return searchPhrases.every(phrase => searchableText.includes(phrase))
    })
  }
  
  return filtered
})

const loadMaterialGroups = async () => {
  try {
    materialGroups.value = await getMaterialGroups()
  } catch (error) {
    console.error('Error loading material groups:', error)
  }
}

const loadDimensionGroups = async () => {
  try {
    dimensionGroups.value = await getDimensionGroups()
  } catch (error) {
    console.error('Error loading dimension groups:', error)
  }
}

const getDimensionGroupName = (dimensionGroupId: number | null | undefined): string => {
  if (!dimensionGroupId) return '-'
  const dimGroup = dimensionGroups.value?.find(dg => dg.id === dimensionGroupId)
  return dimGroup?.group_name || '-'
}

const isEditing = (templateId: number, field: string) => {
  return editingCell.value?.id === templateId && editingCell.value?.field === field
}

const startEdit = (event: Event, template: MaterialTemplate, field: string) => {
  event.preventDefault()
  editingCell.value = { id: template.id, field }
  // Focus the input after Vue updates the DOM
  setTimeout(() => {
    const input = (event.target as HTMLElement).querySelector('input')
    if (input) {
      input.focus()
      input.select()
    }
  }, 0)
}

const finishEdit = async (template: MaterialTemplate) => {
  editingCell.value = null
  await saveTemplate(template)
}

const cancelEdit = () => {
  editingCell.value = null
}

const saveTemplate = async (template: MaterialTemplate) => {
  try {
    await updateMaterialTemplate(template.id, {
      title_1: template.title_1,
      title_2: template.title_2,
      title_3: template.title_3,
      title_4: template.title_4,
      title_5: template.title_5,
      title_1_th: template.title_1_th,
      title_2_th: template.title_2_th,
      title_3_th: template.title_3_th,
      title_4_th: template.title_4_th,
      title_5_th: template.title_5_th
    })
    // Show brief success indicator
    console.log('✅ Template saved:', generateTemplatePreview(template))
  } catch (error) {
    console.error('Error saving template:', error)
    alert('Failed to save template')
    await loadTemplates() // Reload to revert changes
  }
}

const addNewTemplate = () => {
  showAddDialog.value = true
}

const handleAdd = async () => {
  if (!newTemplate.value.material_group_id) {
    alert('Please select a material group')
    return
  }

  try {
    saving.value = true
    await createMaterialTemplate(newTemplate.value)
    showAddDialog.value = false
    newTemplate.value = {
      material_group_id: null,
      title_1: '',
      title_2: '',
      title_3: '',
      title_4: '',
      title_5: '',
      title_1_th: '',
      title_2_th: '',
      title_3_th: '',
      title_4_th: '',
      title_5_th: '',
      dimension_group_id: null,
      sort_order: 0,
      is_active: true
    }
    await loadTemplates()
  } catch (error) {
    console.error('Error creating template:', error)
    alert('Failed to create template')
  } finally {
    saving.value = false
  }
}

const deleteTemplate = async (id: number) => {
  if (!confirm('Are you sure you want to delete this template?')) return

  try {
    await deleteMaterialTemplate(id)
    await loadTemplates()
  } catch (error) {
    console.error('Error deleting template:', error)
    alert('Failed to delete template')
  }
}

const addNewRow = async () => {
  if (!selectedGroupFilter.value) {
    alert('Please select a group filter first')
    return
  }
  
  try {
    saving.value = true
    const newTemplate = {
      material_group_id: selectedGroupFilter.value,
      title_1: '',
      title_2: '',
      title_3: '',
      title_4: '',
      title_5: '',
      sort_order: templates.value.length,
      is_active: true
    }
    await createMaterialTemplate(newTemplate)
    await loadTemplates()
  } catch (error) {
    console.error('Error adding row:', error)
    alert('Failed to add new row')
  } finally {
    saving.value = false
  }
}

const duplicateRow = async (template: MaterialTemplate) => {
  try {
    saving.value = true
    const newTemplate = {
      material_group_id: template.material_group_id,
      title_1: template.title_1,
      title_2: template.title_2,
      title_3: template.title_3,
      title_4: template.title_4,
      title_5: template.title_5,
      sort_order: templates.value.length,
      is_active: true
    }
    await createMaterialTemplate(newTemplate)
    await loadTemplates()
  } catch (error) {
    console.error('Error duplicating row:', error)
    alert('Failed to duplicate row')
  } finally {
    saving.value = false
  }
}

// Export to Excel
const exportToExcel = () => {
  if (!selectedGroupFilter.value) {
    alert('Please select a group to export')
    return
  }
  
  try {
    // Export only the selected group
    const groupedData: any[] = []
    
    // Get the selected group
    const selectedGroup = materialGroups.value.find(g => g.id === selectedGroupFilter.value)
    if (!selectedGroup) {
      alert('Selected group not found')
      return
    }
    
    // Get templates for selected group only
    const group = selectedGroup
    const groupTemplates = templates.value.filter(t => t.material_group_id === group.id)
    
    if (groupTemplates.length === 0) {
      alert('No templates found for the selected group')
      return
    }
    
    // Add group header
    groupedData.push({
      'ID': '',
      'Material Group': `=== ${group.group_name} ===`,
      'Title 1 (TH)': '',
      'Title 2 (TH)': '',
      'Title 3 (TH)': '',
      'Title 4 (TH)': '',
      'Title 5 (TH)': '',
      'Title 1 (EN)': '',
      'Title 2 (EN)': '',
      'Title 3 (EN)': '',
      'Title 4 (EN)': '',
      'Title 5 (EN)': '',
      'Dimension Group': ''
    })
    
    // Add templates
    groupTemplates.forEach(template => {
      groupedData.push({
        'ID': template.id || '',
        'Material Group': group.group_name,
        'Title 1 (TH)': template.title_1_th || '',
        'Title 2 (TH)': template.title_2_th || '',
        'Title 3 (TH)': template.title_3_th || '',
        'Title 4 (TH)': template.title_4_th || '',
        'Title 5 (TH)': template.title_5_th || '',
        'Title 1 (EN)': template.title_1 || '',
        'Title 2 (EN)': template.title_2 || '',
        'Title 3 (EN)': template.title_3 || '',
        'Title 4 (EN)': template.title_4 || '',
        'Title 5 (EN)': template.title_5 || '',
        'Dimension Group': getDimensionGroupName(template.dimension_group_id)
      })
    })
    
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(groupedData)
    
    // Hide ID column by setting width to 0
    if (!ws['!cols']) ws['!cols'] = []
    ws['!cols'][0] = { hidden: true, width: 0 }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Material Templates')
    
    // Generate filename with date and group name
    const date = new Date().toISOString().split('T')[0]
    const groupName = group.group_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `material_templates_${groupName}_${date}.xlsx`
    
    // Download file
    XLSX.writeFile(wb, filename)
    
    console.log(`✅ Exported ${groupTemplates.length} templates from group "${group.group_name}" to ${filename}`)
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
      if (!row['Material Group'] || row['Material Group'].startsWith('===')) {
        continue
      }
      
      // Find the group by name
      const group = materialGroups.value.find(g => g.group_name === row['Material Group'])
      if (!group) {
        errors.push(`Row skipped: Group not found - ${row['Material Group']}`)
        continue
      }
      
      // Find dimension group by name (optional)
      let dimensionGroupId = null
      if (row['Dimension Group'] && row['Dimension Group'] !== '-') {
        const dimGroup = dimensionGroups.value.find(dg => dg.group_name === row['Dimension Group'])
        if (dimGroup) {
          dimensionGroupId = dimGroup.id
        }
      }
      
      const templateData = {
        material_group_id: group.id,
        // Support both old format (Title 1-5) and new format (Title 1-5 EN)
        title_1: row['Title 1 (EN)'] || row['Title 1'] || '',
        title_2: row['Title 2 (EN)'] || row['Title 2'] || '',
        title_3: row['Title 3 (EN)'] || row['Title 3'] || '',
        title_4: row['Title 4 (EN)'] || row['Title 4'] || '',
        title_5: row['Title 5 (EN)'] || row['Title 5'] || '',
        title_1_th: row['Title 1 (TH)'] || '',
        title_2_th: row['Title 2 (TH)'] || '',
        title_3_th: row['Title 3 (TH)'] || '',
        title_4_th: row['Title 4 (TH)'] || '',
        title_5_th: row['Title 5 (TH)'] || '',
        dimension_group_id: dimensionGroupId,
        sort_order: 0,
        is_active: true
      }
      
      // Check if ID exists - if yes, it's an update, otherwise it's a create
      const id = row['ID']
      if (id && typeof id === 'number') {
        // Verify ID exists in current templates
        const existingTemplate = templates.value.find(t => t.id === id)
        if (existingTemplate) {
          toUpdate.push({ id, ...templateData })
        } else {
          errors.push(`Row skipped: ID ${id} not found in database`)
        }
      } else {
        // No ID or invalid ID - create new
        toCreate.push(templateData)
      }
    }
    
    // Show summary
    const totalOperations = toCreate.length + toUpdate.length
    if (totalOperations === 0) {
      alert(errors.length > 0 
        ? `No valid rows found.\n\nErrors:\n${errors.join('\n')}`
        : 'No valid templates found in file')
      return
    }
    
    const confirmMessage = `Ready to import:
• ${toCreate.length} new template(s) will be added
• ${toUpdate.length} existing template(s) will be updated
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
    
    // Create new templates
    for (const template of toCreate) {
      try {
        await createMaterialTemplate(template)
        createdCount++
      } catch (error) {
        console.error('Error creating template:', error)
        errorCount++
      }
    }
    
    // Update existing templates
    for (const template of toUpdate) {
      try {
        const { id, ...updateData } = template
        await updateMaterialTemplate(id, updateData)
        updatedCount++
      } catch (error) {
        console.error('Error updating template:', error)
        errorCount++
      }
    }
    
    await loadTemplates()
    
    // Show detailed results
    const resultMessage = `✅ Import Complete!

Added: ${createdCount} template(s)
Updated: ${updatedCount} template(s)
${errorCount > 0 ? `❌ Failed: ${errorCount} template(s)` : ''}
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
    if (nextCol >= 1 && nextCol <= 10) {
      focusCell(row, nextCol)
    } else if (!event.shiftKey && nextCol > 10) {
      // Move to next row, first column
      if (row + 1 < spreadsheetData.value.length) {
        focusCell(row + 1, 1)
      }
    } else if (event.shiftKey && nextCol < 1) {
      // Move to previous row, last column
      if (row > 0) {
        focusCell(row - 1, 10)
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
      
      if (targetCol === 1) row.title_1 = cellValue
      else if (targetCol === 2) row.title_2 = cellValue
      else if (targetCol === 3) row.title_3 = cellValue
      else if (targetCol === 4) row.title_4 = cellValue
      else if (targetCol === 5) row.title_5 = cellValue
      else if (targetCol === 6) row.title_1_th = cellValue
      else if (targetCol === 7) row.title_2_th = cellValue
      else if (targetCol === 8) row.title_3_th = cellValue
      else if (targetCol === 9) row.title_4_th = cellValue
      else if (targetCol === 10) row.title_5_th = cellValue
    })
  })
}

const addRowInSpreadsheet = () => {
  spreadsheetData.value.push({
    material_group_id: modalGroupFilter.value,
    title_1: '',
    title_2: '',
    title_3: '',
    title_4: '',
    title_5: '',
    title_1_th: '',
    title_2_th: '',
    title_3_th: '',
    title_4_th: '',
    title_5_th: '',
    dimension_group_id: null,
    _isNew: true
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deleteRowInSpreadsheet = (index: number) => {
  if (confirm('Delete this row?')) {
    spreadsheetData.value.splice(index, 1)
  }
}

const saveSpreadsheetChanges = async () => {
  try {
    saving.value = true
    
    // Separate new and existing templates
    const newTemplates = spreadsheetData.value.filter(row => row._isNew && row.material_group_id)
    const existingTemplates = spreadsheetData.value.filter(row => !row._isNew && row.id)
    
    // Create new templates
    for (const template of newTemplates) {
      await createMaterialTemplate({
        material_group_id: template.material_group_id,
        title_1: template.title_1 || '',
        title_2: template.title_2 || '',
        title_3: template.title_3 || '',
        title_4: template.title_4 || '',
        title_5: template.title_5 || '',
        title_1_th: template.title_1_th || '',
        title_2_th: template.title_2_th || '',
        title_3_th: template.title_3_th || '',
        title_4_th: template.title_4_th || '',
        title_5_th: template.title_5_th || '',
        dimension_group_id: template.dimension_group_id || null,
        sort_order: 0,
        is_active: true
      })
    }
    
    // Update existing templates
    for (const template of existingTemplates) {
      await updateMaterialTemplate(template.id, {
        title_1: template.title_1,
        title_2: template.title_2,
        title_3: template.title_3,
        title_4: template.title_4,
        title_5: template.title_5,
        title_1_th: template.title_1_th,
        title_2_th: template.title_2_th,
        title_3_th: template.title_3_th,
        title_4_th: template.title_4_th,
        title_5_th: template.title_5_th,
        dimension_group_id: template.dimension_group_id || null
      })
    }
    
    await loadTemplates()
    showSpreadsheetModal.value = false
    alert(`✅ Saved ${newTemplates.length + existingTemplates.length} templates`)
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
  // Load all templates into spreadsheet
  spreadsheetData.value = templates.value.map(t => ({ ...t, _isNew: false }))
  
  // Set initial filter from main page filter
  modalGroupFilter.value = selectedGroupFilter.value
  
  showSpreadsheetModal.value = true
}

const filterSpreadsheetData = () => {
  // Filter is handled by computed property filteredSpreadsheetData
  // This function is just a handler for the change event
}

// Watch for spreadsheet modal opening
const originalShowSpreadsheetModal = showSpreadsheetModal.value
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const showSpreadsheetModalHandler = () => {
  if (showSpreadsheetModal.value && !originalShowSpreadsheetModal) {
    openSpreadsheetEditor()
  }
}

onMounted(async () => {
  await loadMaterialGroups()
  await loadDimensionGroups()
  await loadTemplates()
})
</script>

<style scoped>
.editable-cell {
  position: relative;
}

.editable-cell::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 6px 6px 0;
  border-color: transparent #60a5fa transparent transparent;
  opacity: 0.5;
}

.editable-cell:hover {
  background-color: rgba(96, 165, 250, 0.05);
}

/* Allow text selection in view mode */
table {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

/* Hide input default styles */
td input {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  font-size: inherit;
  font-family: inherit;
  color: inherit;
}
</style>
