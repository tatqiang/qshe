<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <button
          @click="router.push('/materials')"
          class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Materials
        </button>
        
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Add New Materials
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Select a material template and dimensions to create materials in bulk
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <form @submit.prevent="handleSubmit">
          <div class="p-6 space-y-6">
            <!-- Material Selection -->
            <div class="border-b dark:border-gray-700 pb-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Material Classification</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Material Group -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Group *
                  </label>
                  <select
                    v-model="selectedGroupId"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option :value="null">Select Group</option>
                    <option v-for="group in materialGroups" :key="group.id" :value="group.id">
                      {{ group.group_name }}
                    </option>
                  </select>
                </div>

                <!-- Unit of Measure -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit of Measure *
                  </label>
                  <select
                    v-model="unitOfMeasure"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="M">M (Meters)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                    <option value="SET">SET</option>
                    <option value="BOX">BOX</option>
                    <option value="ROLL">ROLL</option>
                  </select>
                </div>
              </div>

              <!-- Material Template Selection -->
              <div v-if="selectedGroupId" class="mt-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Material Template *
                </label>
                <select
                  v-model="selectedTemplateId"
                  @change="handleTemplateChange"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  <option :value="null">Select Template</option>
                  <option v-for="template in materialTemplates" :key="template.id" :value="template.id">
                    {{ generateTemplatePreview(template) }}
                  </option>
                </select>
              </div>

              <!-- Template Preview -->
              <div v-if="templatePreview" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Template Preview:
                </p>
                <p class="text-lg text-blue-700 dark:text-blue-300 font-semibold">
                  {{ templatePreview }}
                </p>
              </div>
            </div>

            <!-- Dimension Selection -->
            <div v-if="availableDimensions.length > 0" class="border-b dark:border-gray-700 pb-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Select Dimensions/Sizes *
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ selectedDimensions.length }} dimension(s) selected
                  </p>
                </div>
                
                <!-- Type Filter -->
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
                  <select
                    v-model="dimensionTypeFilter"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All Types</option>
                    <option value="common">Common Only</option>
                    <option value="custom">Custom Only</option>
                  </select>
                </div>
              </div>

              <div class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div class="max-h-96 overflow-y-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th class="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            :checked="selectedDimensions.length === filteredDimensions.length && filteredDimensions.length > 0"
                            @change="toggleAllDimensions"
                            class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Dimension
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr v-for="dim in filteredDimensions" :key="dim.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td class="px-6 py-4">
                          <input
                            type="checkbox"
                            :checked="selectedDimensions.includes(dim.id)"
                            @change="handleDimensionToggle(dim.id)"
                            class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <span 
                            :class="dim.dimension_type === 'common'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'"
                            class="inline-flex px-3 py-1 text-xs font-semibold rounded-full"
                          >
                            {{ dim.dimension_type }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {{ formatDimensionDisplay(dim) }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {{ dim.remark || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Tracking Options -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tracking Options</h2>
              <div class="flex flex-wrap gap-6">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="requiresLotTracking"
                    class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Lot Tracking</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="requiresSerialTracking"
                    class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Serial Tracking</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    v-model="requiresExpiryTracking"
                    class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Tracking</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3 border-t dark:border-gray-600">
            <button
              type="button"
              @click="router.push('/materials')"
              :disabled="loading"
              class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ loading ? 'Creating...' : `Create ${selectedDimensions.length || 1} Material(s)` }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMaterialGroups,
  getMaterialTemplates,
  getDimensionsForTemplate,
  createMaterialsBulk,
  generateTemplatePreview,
  formatDimensionDisplay
} from '@/lib/api/materialSystem'
import type {
  MaterialGroup,
  MaterialTemplate,
  Dimension,
  MaterialCreateInput
} from '@/types/materialSystem'

const router = useRouter()

const loading = ref(false)

// Master data
const materialGroups = ref<MaterialGroup[]>([])
const materialTemplates = ref<MaterialTemplate[]>([])
const availableDimensions = ref<Dimension[]>([])

// Form selections
const selectedGroupId = ref<number | null>(null)
const selectedTemplateId = ref<number | null>(null)
const selectedTemplate = ref<MaterialTemplate | null>(null)
const dimensionTypeFilter = ref<'all' | 'common' | 'custom'>('all')
const selectedDimensions = ref<number[]>([])

// Material properties
const unitOfMeasure = ref('PCS')
const requiresLotTracking = ref(false)
const requiresSerialTracking = ref(false)
const requiresExpiryTracking = ref(false)

const filteredDimensions = computed(() => {
  if (dimensionTypeFilter.value === 'all') return availableDimensions.value
  return availableDimensions.value.filter(dim => dim.dimension_type === dimensionTypeFilter.value)
})

const templatePreview = computed(() => {
  return selectedTemplate.value ? generateTemplatePreview(selectedTemplate.value) : ''
})

// Load material groups on mount
onMounted(() => {
  loadMaterialGroups()
})

// Watch for group changes
watch(selectedGroupId, (newGroupId) => {
  if (newGroupId) {
    loadMaterialTemplates(newGroupId)
  } else {
    materialTemplates.value = []
    selectedTemplateId.value = null
    selectedTemplate.value = null
  }
})

// Watch for template changes
watch(selectedTemplateId, (newTemplateId) => {
  if (newTemplateId) {
    loadDimensions(newTemplateId)
  } else {
    availableDimensions.value = []
    selectedDimensions.value = []
  }
})

const loadMaterialGroups = async () => {
  try {
    materialGroups.value = await getMaterialGroups()
  } catch (error) {
    console.error('Error loading material groups:', error)
  }
}

const loadMaterialTemplates = async (groupId: number) => {
  try {
    materialTemplates.value = await getMaterialTemplates(groupId)
  } catch (error) {
    console.error('Error loading material templates:', error)
  }
}

const loadDimensions = async (templateId: number) => {
  try {
    availableDimensions.value = await getDimensionsForTemplate(templateId)
    selectedDimensions.value = []
  } catch (error) {
    console.error('Error loading dimensions:', error)
    availableDimensions.value = []
  }
}

const handleTemplateChange = () => {
  const template = materialTemplates.value.find(t => t.id === selectedTemplateId.value)
  selectedTemplate.value = template || null
}

const handleDimensionToggle = (dimensionId: number) => {
  const index = selectedDimensions.value.indexOf(dimensionId)
  if (index > -1) {
    selectedDimensions.value.splice(index, 1)
  } else {
    selectedDimensions.value.push(dimensionId)
  }
}

const toggleAllDimensions = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedDimensions.value = filteredDimensions.value.map(d => d.id)
  } else {
    selectedDimensions.value = []
  }
}

const handleSubmit = async () => {
  if (!selectedTemplateId.value) {
    alert('Please select a material template')
    return
  }

  if (availableDimensions.value.length > 0 && selectedDimensions.value.length === 0) {
    alert('Please select at least one dimension')
    return
  }

  try {
    loading.value = true

    const materials: MaterialCreateInput[] = []

    if (selectedDimensions.value.length > 0) {
      // Create material for each selected dimension
      selectedDimensions.value.forEach(dimensionId => {
        materials.push({
          material_template_id: selectedTemplateId.value!,
          dimension_id: dimensionId,
          unit_of_measure: unitOfMeasure.value,
          requires_lot_tracking: requiresLotTracking.value,
          requires_serial_tracking: requiresSerialTracking.value,
          requires_expiry_tracking: requiresExpiryTracking.value
        })
      })
    } else {
      // Create single material without dimension
      materials.push({
        material_template_id: selectedTemplateId.value,
        dimension_id: null,
        unit_of_measure: unitOfMeasure.value,
        requires_lot_tracking: requiresLotTracking.value,
        requires_serial_tracking: requiresSerialTracking.value,
        requires_expiry_tracking: requiresExpiryTracking.value
      })
    }

    await createMaterialsBulk(materials)
    alert(`Successfully created ${materials.length} material(s)`)
    router.push('/materials')
  } catch (error) {
    console.error('Error creating materials:', error)
    alert('Failed to create materials')
  } finally {
    loading.value = false
  }
}
</script>
