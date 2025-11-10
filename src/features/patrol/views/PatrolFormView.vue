<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <button
          @click="handleCancel"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span class="text-sm font-medium">Back</span>
        </button>
      </div>
      
      <h1 class="text-2xl font-bold text-gray-900">
        {{ mode === 'edit' ? 'Edit Safety Patrol' : 'New Safety Patrol' }}
      </h1>
      <p class="text-sm text-gray-600 mt-1">
        {{ mode === 'edit' ? 'Update patrol details' : 'Record a new safety observation or hazard' }}
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card title="Basic Information">
        <div class="space-y-4">
          <!-- Patrol Issuer -->
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {{ userInitials }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">Patrol Issuer</p>
              <p class="text-sm text-gray-700">{{ displayName }}</p>
              <p class="text-xs text-gray-500">{{ userEmail }}</p>
            </div>
          </div>

          <!-- Patrol Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Patrol Type <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.patrol_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="scheduled">Scheduled Patrol</option>
              <option value="random">Random Patrol</option>
              <option value="incident_followup">Incident Follow-up</option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of the safety issue"
              required
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Detailed description of the safety observation..."
              required
            ></textarea>
          </div>

          <!-- Main Area -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              🏢 Main Area <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-gray-500 mb-2">(e.g., Building A, Landscape Yard)</p>
            <AreaInput
              v-model="formData.main_area"
              :project-id="selectedProject?.id"
              table="main_areas"
              placeholder="Enter or search main area..."
              @select="selectedMainAreaId = $event.id"
            />
          </div>

          <!-- Sub Area 1 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Sub Area 1
            </label>
            <p class="text-xs text-gray-500 mb-2">(e.g., Floor 2, Office Wing) - Optional - Requires Main Area</p>
            <AreaInput
              v-model="formData.sub_area_1"
              :project-id="selectedProject?.id"
              table="sub_areas_1"
              :parent-id="selectedMainAreaId"
              placeholder="Select main area first"
              :disabled="!formData.main_area"
              @select="selectedSubArea1Id = $event.id"
            />
          </div>

          <!-- Sub Area 2 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Sub Area 2
            </label>
            <p class="text-xs text-gray-500 mb-2">(e.g., Room 201, Workstation A) - Optional - Requires Sub Area 1</p>
            <AreaInput
              v-model="formData.sub_area_2"
              :project-id="selectedProject?.id"
              table="sub_areas_2"
              :parent-id="selectedSubArea1Id"
              placeholder="Select sub area 1 first"
              :disabled="!formData.sub_area_1"
              @select="selectedSubArea2Id = $event.id"
            />
          </div>

          <!-- Specific Location -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Specific Location
            </label>
            <input
              v-model="formData.specific_location"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., North wall, near column A1"
            />
          </div>
        </div>
      </Card>

      <!-- Risk Classification -->
      <Card title="Risk Classification">
        <div class="space-y-4">
          <!-- Risk Categories (Modal) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Risk Categories
            </label>
            <MultiSelectModal
              v-model="formData.risk_categories"
              :options="availableRiskCategories"
              title="Select Risk Categories"
              placeholder="Tap to select risk categories"
              label-key="name"
              description-key="description"
              value-key="id"
            />
          </div>

          <!-- Risk Items (Modal with Tabs & Search) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Risk Items
            </label>
            <RiskItemsModal
              v-model="formData.risk_items"
              :options="availableRiskItems"
              title="Select Risk Items"
              placeholder="Tap to select risk items"
              @refresh="loadRiskItems"
            />
          </div>
        </div>
      </Card>

      <!-- Risk Assessment -->
      <Card title="Risk Assessment">
        <div class="space-y-4">
          <p class="text-sm text-gray-600 mb-4">
            Click on the matrix to select likelihood and severity
          </p>
          
          <!-- Risk Matrix -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    Likelihood →<br/>Severity ↓
                  </th>
                  <th class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    Rare (1)
                  </th>
                  <th class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    Unlikely (2)
                  </th>
                  <th class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    Possible (3)
                  </th>
                  <th class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    Likely (4)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="severity in [4, 3, 2, 1]" :key="severity">
                  <td class="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    {{ getSeverityLabel(severity) }}
                  </td>
                  <td
                    v-for="likelihood in [1, 2, 3, 4]"
                    :key="likelihood"
                    @click="selectRisk(likelihood, severity)"
                    :class="getRiskCellClass(likelihood, severity)"
                    class="border border-gray-300 p-4 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div class="text-center">
                      <div class="font-bold text-lg">{{ likelihood * severity }}</div>
                      <div class="text-xs">{{ getRiskLevel(likelihood * severity) }}</div>
                      <div v-if="formData.likelihood === likelihood && formData.severity === severity" class="mt-1">
                        ✓
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Selected Risk Display -->
          <div v-if="formData.likelihood && formData.severity" class="mt-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm font-medium">
              Selected Risk: 
              <span :class="getRiskLevelColor(formData.likelihood * formData.severity)" class="ml-2 px-2 py-1 rounded text-white">
                {{ getRiskLevel(formData.likelihood * formData.severity) }}
              </span>
            </p>
            <p class="text-xs text-gray-600 mt-1">
              Likelihood: {{ formData.likelihood }} | Severity: {{ formData.severity }} | Score: {{ formData.likelihood * formData.severity }}
            </p>
          </div>
        </div>
      </Card>

      <!-- Additional Flags -->
      <Card title="Additional Information">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Remark
          </label>
          <textarea
            v-model="formData.remark"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Enter any additional remarks or notes..."
          ></textarea>
        </div>
      </Card>

      <!-- Patrol Photos -->
      <Card title="Patrol Photos">
        <div class="space-y-4">
          <!-- Upload Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              @click="openCamera"
              class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Camera</span>
            </button>
            
            <button
              type="button"
              @click="openGallery"
              class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Gallery</span>
            </button>

            <div v-if="formData.photos.length > 0" class="ml-auto text-sm text-green-600 flex items-center">
              <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ formData.photos.length }} photo(s) selected
            </div>
          </div>

          <!-- Photo Preview Grid -->
          <div v-if="formData.photos.length > 0" class="grid grid-cols-3 gap-3">
            <div
              v-for="(photo, index) in formData.photos"
              :key="index"
              class="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors group"
            >
              <img
                :src="photo.preview"
                :alt="`Photo ${index + 1}`"
                class="w-full h-full object-cover cursor-pointer"
                @click="openPhotoViewer(index)"
              />
              <!-- Remove button -->
              <button
                type="button"
                @click="removePhoto(index)"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="formData.photos.length === 0" class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">No photos added</p>
            <p class="text-xs text-gray-400">Tap Camera or Gallery to add photos</p>
          </div>

          <!-- Hidden file inputs -->
          <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            @change="handleCameraCapture"
            class="hidden"
          />
          <input
            ref="galleryInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleGallerySelect"
            class="hidden"
          />
        </div>
      </Card>

      <!-- Form Actions -->
      <div class="flex items-center justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          :loading="submitting"
        >
          {{ mode === 'edit' ? 'Update Patrol' : 'Create Patrol' }}
        </Button>
      </div>
    </form>

    <!-- Photo Viewer Modal -->
    <Teleport to="body">
      <div
        v-if="showPhotoViewer"
        class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        @click="closePhotoViewer"
      >
        <!-- Close button -->
        <button
          @click.stop="closePhotoViewer"
          class="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Photo counter -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold z-10">
          {{ currentPhotoIndex + 1 }} / {{ formData.photos.length }}
        </div>

        <!-- Previous Button -->
        <button
          v-if="currentPhotoIndex > 0"
          @click.stop="previousPhoto"
          class="absolute left-4 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Photo Container -->
        <div class="relative max-w-7xl max-h-screen px-16 py-16" @click.stop>
          <img
            :src="formData.photos[currentPhotoIndex]?.preview"
            :alt="`Photo ${currentPhotoIndex + 1}`"
            class="max-w-full max-h-full object-contain rounded"
          />
        </div>

        <!-- Next Button -->
        <button
          v-if="currentPhotoIndex < formData.photos.length - 1"
          @click.stop="nextPhoto"
          class="absolute right-4 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import AreaInput from '@/components/common/AreaInput.vue'
import MultiSelectModal from '@/components/common/MultiSelectModal.vue'
import RiskItemsModal from '@/components/common/RiskItemsModal.vue'
import { patrolService } from '@/services/patrolService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const { user } = storeToRefs(authStore)
const { selectedProject } = storeToRefs(projectStore)

// Determine mode and patrolId from route
const mode = computed(() => route.name === 'patrol-edit' ? 'edit' : 'create')
const patrolId = computed(() => route.params.id as string | undefined)

const submitting = ref(false)
const isLoadingPatrol = ref(false)

// Track selected area IDs for cascading dropdowns
const selectedMainAreaId = ref<string | null>(null)
const selectedSubArea1Id = ref<string | null>(null)
const selectedSubArea2Id = ref<string | null>(null)

// Photo viewer state
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const showPhotoViewer = ref(false)
const currentPhotoIndex = ref(0)

// Risk categories and items from database
const availableRiskCategories = ref<any[]>([])
const availableRiskItems = ref<any[]>([])
const removedPhotoIds = ref<string[]>([]) // Track IDs of removed existing photos

const formData = ref({
  patrol_type: 'scheduled',
  title: '',
  description: '',
  main_area: '',
  sub_area_1: '',
  sub_area_2: '',
  specific_location: '',
  risk_categories: [] as string[], // Array of category IDs
  risk_items: [] as string[], // Array of item IDs
  likelihood: null as number | null,
  severity: null as number | null,
  remark: '',
  photos: [] as any[] // Array of photo objects
})

// Reset child areas when parent changes (but not during initial load)
watch(() => formData.value.main_area, () => {
  if (isLoadingPatrol.value) return
  formData.value.sub_area_1 = ''
  formData.value.sub_area_2 = ''
  selectedSubArea1Id.value = null
  selectedSubArea2Id.value = null
})

watch(() => formData.value.sub_area_1, () => {
  if (isLoadingPatrol.value) return
  formData.value.sub_area_2 = ''
  selectedSubArea2Id.value = null
})

// User display info
const displayName = computed(() => {
  const u = user.value
  if (u?.first_name && u?.last_name) {
    return `${u.first_name} ${u.last_name}`
  }
  return u?.email?.split('@')[0] || 'User'
})

const userEmail = computed(() => user.value?.email || '')

const userInitials = computed(() => {
  const u = user.value as any
  if (u?.first_name && u?.last_name) {
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  }
  return u?.email?.[0]?.toUpperCase() || 'U'
})

// Risk Matrix Helpers
const getSeverityLabel = (severity: number) => {
  const labels: Record<number, string> = {
    1: 'Minor (1)',
    2: 'Moderate (2)',
    3: 'Major (3)',
    4: 'Critical (4)'
  }
  return labels[severity]
}

const getRiskLevel = (score: number) => {
  if (score <= 3) return 'LOW'
  if (score <= 8) return 'MEDIUM'
  if (score <= 12) return 'HIGH'
  return 'EXTREME'
}

const getRiskCellClass = (likelihood: number, severity: number) => {
  const score = likelihood * severity
  if (score <= 3) return 'bg-green-200 text-green-900'
  if (score <= 8) return 'bg-yellow-200 text-yellow-900'
  if (score <= 12) return 'bg-orange-300 text-orange-900'
  return 'bg-red-400 text-red-900'
}

const getRiskLevelColor = (score: number) => {
  if (score <= 3) return 'bg-green-600'
  if (score <= 8) return 'bg-yellow-600'
  if (score <= 12) return 'bg-orange-600'
  return 'bg-red-600'
}

const selectRisk = (likelihood: number, severity: number) => {
  formData.value.likelihood = likelihood
  formData.value.severity = severity
}

// Load risk categories and items from database
const loadRiskCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('risk_categories')
      .select('id, name, description, color, icon')
      .order('name')
    
    if (error) throw error
    
    // Map icon text to actual emojis
    const iconMap: Record<string, string> = {
      'space': '🏢',
      'crane': '🏗️',
      'electrical': '⚡',
      'elevation': '🪜',
      'fire': '🔥',
      'lock': '🔒',
      'chemical': '⚗️',
      'vehicle': '🚗',
      'machinery': '⚙️',
      'fall': '⬇️',
      'struck': '💥'
    }
    
    availableRiskCategories.value = (data || []).map((cat: any) => ({
      ...cat,
      icon: iconMap[cat.icon?.toLowerCase()] || cat.icon || ''
    }))
  } catch (error) {
    console.error('Error loading risk categories:', error)
  }
}

const loadRiskItems = async () => {
  try {
    const { data, error } = await supabase
      .from('risk_items')
      .select('id, name, category, description')
      .order('name')
    
    if (error) throw error
    availableRiskItems.value = data || []
  } catch (error) {
    console.error('Error loading risk items:', error)
  }
}

// Load existing patrol data for edit mode
const loadPatrol = async () => {
  if (mode.value === 'edit' && patrolId.value) {
    isLoadingPatrol.value = true
    try {
      const patrol = await patrolService.getById(patrolId.value)
      console.log('🔍 DEBUG: Loaded patrol data:', patrol)
      
      if (patrol) {
        // Load associated risk categories
        const { data: categoryLinks } = await supabase
          .from('patrol_risk_categories')
          .select('risk_category_id')
          .eq('patrol_id', patrolId.value)
        
        // Load associated risk items
        const { data: itemLinks } = await supabase
          .from('patrol_risk_items')
          .select('risk_item_id')
          .eq('patrol_id', patrolId.value)
        
        console.log('🔍 DEBUG: Area IDs from DB:', {
          main_area_id: patrol.main_area_id,
          sub_area_1_id: patrol.sub_area_1_id,
          sub_area_2_id: patrol.sub_area_2_id
        })
        
        // Set the area IDs FIRST so the inputs aren't disabled
        selectedMainAreaId.value = patrol.main_area_id || null
        selectedSubArea1Id.value = patrol.sub_area_1_id || null
        selectedSubArea2Id.value = patrol.sub_area_2_id || null
        
        // Extract area names from joined data (Supabase returns as nested objects)
        let mainAreaName = ''
        let subArea1Name = ''
        let subArea2Name = ''
        
        // Check if data has joined objects from Supabase select
        const patrolData = patrol as any
        if (patrolData.main_areas && typeof patrolData.main_areas === 'object') {
          mainAreaName = patrolData.main_areas.main_area_name || ''
        }
        if (patrolData.sub_areas_1 && typeof patrolData.sub_areas_1 === 'object') {
          subArea1Name = patrolData.sub_areas_1.sub_area_1_name || ''
        }
        if (patrolData.sub_areas_2 && typeof patrolData.sub_areas_2 === 'object') {
          subArea2Name = patrolData.sub_areas_2.sub_area_2_name || ''
        }
        
        console.log('🔍 DEBUG: Extracted area names:', {
          mainAreaName,
          subArea1Name,
          subArea2Name
        })
        
        // Wait for DOM to update before setting text values
        await nextTick()
        
        // Load existing photos if in edit mode
        let existingPhotos: any[] = []
        if (mode.value === 'edit') {
          try {
            const photos = await patrolService.getPhotos(patrolId.value!)
            existingPhotos = photos.map((photo: any) => ({
              preview: photo.url || photo.photo_data,
              name: photo.file_name,
              existing: true, // Mark as existing photo (not new upload)
              id: photo.id
            }))
          } catch (err) {
            console.warn('Could not load existing photos:', err)
          }
        }
        
        // Then set the form data
        formData.value = {
          patrol_type: patrol.patrol_type,
          title: patrol.title,
          description: patrol.description,
          main_area: mainAreaName,
          sub_area_1: subArea1Name,
          sub_area_2: subArea2Name,
          specific_location: patrol.specific_location || '',
          risk_categories: categoryLinks?.map((c: any) => c.risk_category_id) || [],
          risk_items: itemLinks?.map((i: any) => i.risk_item_id) || [],
          likelihood: patrol.likelihood,
          severity: patrol.severity,
          remark: patrol.remark || '',
          photos: existingPhotos // Show existing photos in edit mode
        }
        
        console.log('🔍 DEBUG: Set formData and IDs:', {
          formData: formData.value,
          selectedMainAreaId: selectedMainAreaId.value,
          selectedSubArea1Id: selectedSubArea1Id.value,
          selectedSubArea2Id: selectedSubArea2Id.value
        })
        
        // Wait one more tick then disable loading flag
        await nextTick()
        isLoadingPatrol.value = false
      }
    } catch (error) {
      console.error('Error loading patrol:', error)
      alert('Failed to load patrol data')
      router.push('/patrol')
    }
  }
}

// Form handlers
const handleSubmit = async () => {
  if (!formData.value.likelihood || !formData.value.severity) {
    alert('Please select a risk level from the matrix')
    return
  }

  if (!selectedProject.value) {
    alert('Please select a project first')
    return
  }

  submitting.value = true

  try {
    const patrolData: any = {
      patrol_type: formData.value.patrol_type,
      title: formData.value.title,
      description: formData.value.description,
      specific_location: formData.value.specific_location,
      main_area_id: selectedMainAreaId.value,
      sub_area_1_id: selectedSubArea1Id.value,
      sub_area_2_id: selectedSubArea2Id.value,
      likelihood: formData.value.likelihood,
      severity: formData.value.severity,
      remark: formData.value.remark,
      project_id: selectedProject.value.id,
      patrol_date: new Date().toISOString().split('T')[0]
    }

    let patrol: any
    if (mode.value === 'edit') {
      patrol = await patrolService.update(patrolId.value!, patrolData)
      
      // Update risk categories junction table
      await supabase.from('patrol_risk_categories').delete().eq('patrol_id', patrolId.value!)
      if (formData.value.risk_categories.length > 0) {
        await supabase.from('patrol_risk_categories').insert(
          formData.value.risk_categories.map((cat_id: string) => ({
            patrol_id: patrolId.value,
            risk_category_id: cat_id
          }))
        )
      }
      
      // Update risk items junction table
      await supabase.from('patrol_risk_items').delete().eq('patrol_id', patrolId.value!)
      if (formData.value.risk_items.length > 0) {
        await supabase.from('patrol_risk_items').insert(
          formData.value.risk_items.map((item_id: string) => ({
            patrol_id: patrolId.value,
            risk_item_id: item_id
          }))
        )
      }
      
      // Delete removed photos if any
      if (removedPhotoIds.value.length > 0) {
        await patrolService.deletePatrolPhotos(removedPhotoIds.value)
      }
      
      // Upload new photos if any (skip existing ones)
      const newPhotos = formData.value.photos.filter((p: any) => !p.existing)
      if (newPhotos.length > 0) {
        await uploadPatrolPhotos(patrolId.value!, newPhotos)
      }
      
      alert('Patrol updated successfully!')
    } else {
      patrol = await patrolService.create(patrolData, user.value!.id)
      
      // Insert risk categories junction table
      if (formData.value.risk_categories.length > 0) {
        await supabase.from('patrol_risk_categories').insert(
          formData.value.risk_categories.map((cat_id: string) => ({
            patrol_id: patrol.id,
            risk_category_id: cat_id
          }))
        )
      }
      
      // Insert risk items junction table
      if (formData.value.risk_items.length > 0) {
        await supabase.from('patrol_risk_items').insert(
          formData.value.risk_items.map((item_id: string) => ({
            patrol_id: patrol.id,
            risk_item_id: item_id
          }))
        )
      }
      
      // Upload photos if any
      if (formData.value.photos.length > 0) {
        await uploadPatrolPhotos(patrol.id, formData.value.photos)
      }
      
      alert('Patrol created successfully!')
    }

    // Navigate based on mode
    if (mode.value === 'edit') {
      // After editing, go to patrol detail view
      router.push(`/patrol/${patrolId.value}`)
    } else {
      // After creating, go to patrol list
      router.push('/patrol')
    }
  } catch (error) {
    console.error('Error saving patrol:', error)
    alert('Failed to save patrol. Please try again.')
  } finally {
    submitting.value = false
  }
}

const uploadPatrolPhotos = async (patrolId: string, photos: any[]) => {
  for (const photo of photos) {
    // Skip existing photos (already in database)
    if (photo.existing) {
      continue
    }
    
    try {
      // Generate unique filename
      const fileExt = photo.file.name.split('.').pop()
      const fileName = `patrol_${patrolId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `patrols/${patrolId}/${fileName}`
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('qshe')
        .upload(filePath, photo.file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        continue
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qshe')
        .getPublicUrl(filePath)
      
      // Insert photo record into patrol_photos table
      const { error: insertError } = await supabase
        .from('patrol_photos')
        .insert({
          patrol_id: patrolId,
          file_path: filePath,
          file_name: fileName,
          file_size: photo.file.size,
          photo_type: 'issue',
          taken_by: user.value?.id,
          photo_data: urlData.publicUrl
        })
      
      if (insertError) {
        console.error('Error inserting photo record:', insertError)
      }
    } catch (err) {
      console.error('Error processing photo:', err)
    }
  }
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    router.push('/patrol')
  }
}

// Photo handling functions
const openCamera = () => {
  cameraInput.value?.click()
}

const openGallery = () => {
  galleryInput.value?.click()
}

const handleCameraCapture = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addPhotos(files)
  target.value = '' // Reset input
}

const handleGallerySelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addPhotos(files)
  target.value = '' // Reset input
}

const addPhotos = (files: File[]) => {
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.photos.push({
        file,
        preview: e.target?.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
}

const removePhoto = (index: number) => {
  const photo = formData.value.photos[index]
  
  // If this is an existing photo, track its ID for deletion
  if (photo.existing && photo.id) {
    removedPhotoIds.value.push(photo.id)
  }
  
  formData.value.photos.splice(index, 1)
}

const openPhotoViewer = (index: number) => {
  currentPhotoIndex.value = index
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < formData.value.photos.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = formData.value.photos.length - 1
  }
}

onMounted(() => {
  loadRiskCategories()
  loadRiskItems()
  loadPatrol()
})
</script>
