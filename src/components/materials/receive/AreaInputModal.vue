<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Storage Location</h3>

      <div class="space-y-4">
        <!-- Main Area -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Main Area <span class="text-red-500">*</span>
          </label>
          <AreaInput
            v-model="areaData.main_area_name"
            :project-id="projectId"
            table="main_areas"
            placeholder="Select or create main area"
            @select="handleMainAreaSelect"
          />
        </div>

        <!-- Sub Area 1 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sub Area 1
          </label>
          <AreaInput
            v-model="areaData.sub_area_1_name"
            :project-id="projectId"
            table="sub_areas_1"
            :parent-id="areaData.main_area_id"
            :disabled="!areaData.main_area_name"
            placeholder="Select or create sub area 1"
            @select="handleSubArea1Select"
          />
        </div>

        <!-- Sub Area 2 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sub Area 2
          </label>
          <AreaInput
            v-model="areaData.sub_area_2_name"
            :project-id="projectId"
            table="sub_areas_2"
            :parent-id="areaData.sub_area_1_id"
            :disabled="!areaData.sub_area_1_name"
            placeholder="Select or create sub area 2"
            @select="handleSubArea2Select"
          />
        </div>

        <!-- Specific Location -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Specific Location
          </label>
          <input
            v-model="areaData.specific_location"
            type="text"
            placeholder="e.g., Rack A3, Shelf 2"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSave"
          :disabled="!canSave"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Location
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AreaInput from '@/components/common/AreaInput.vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  save: [data: any]
  close: []
}>()

const areaData = ref({
  main_area_id: '',
  main_area_name: '',
  sub_area_1_id: '',
  sub_area_1_name: '',
  sub_area_2_id: '',
  sub_area_2_name: '',
  specific_location: ''
})

const canSave = computed(() => {
  return !!areaData.value.main_area_name
})

function handleMainAreaSelect(area: any) {
  areaData.value.main_area_id = area.id
  areaData.value.main_area_name = area.name
  // Clear sub areas when main area changes
  areaData.value.sub_area_1_id = ''
  areaData.value.sub_area_1_name = ''
  areaData.value.sub_area_2_id = ''
  areaData.value.sub_area_2_name = ''
}

function handleSubArea1Select(area: any) {
  areaData.value.sub_area_1_id = area.id
  areaData.value.sub_area_1_name = area.name
  // Clear sub area 2 when sub area 1 changes
  areaData.value.sub_area_2_id = ''
  areaData.value.sub_area_2_name = ''
}

function handleSubArea2Select(area: any) {
  areaData.value.sub_area_2_id = area.id
  areaData.value.sub_area_2_name = area.name
}

function handleSave() {
  if (!canSave.value) return

  emit('save', { ...areaData.value })
  
  // Reset for next use
  areaData.value = {
    main_area_id: '',
    main_area_name: '',
    sub_area_1_id: '',
    sub_area_1_name: '',
    sub_area_2_id: '',
    sub_area_2_name: '',
    specific_location: ''
  }
}
</script>
