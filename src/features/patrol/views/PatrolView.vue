<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Safety Patrol</h1>
      <Button @click="handleCreate" variant="primary">
        + New Patrol
      </Button>
    </div>

    <!-- Filters -->
    <Card padding="sm" class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <!-- Search -->
        <div class="md:col-span-2 lg:col-span-3 xl:col-span-2">
          <input
            type="text"
            v-model="filters.search"
            placeholder="Search by patrol number, title..."
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <select
            v-model="filters.status"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Risk Level Filter -->
        <div>
          <select
            v-model="filters.risk_level"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="extremely_high">Extremely High</option>
          </select>
        </div>

        <!-- Sort By Modified Date -->
        <div>
          <select
            v-model="filters.sortByDate"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        <!-- Risk Category Filter -->
        <div>
          <select
            v-model="filters.risk_category"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option v-for="category in riskCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Risk Item Filter - Modal Trigger Button -->
        <div>
          <button
            type="button"
            @click="showRiskItemModal = true"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
          >
            <span v-if="!filters.risk_item" class="text-gray-500 dark:text-gray-400">All Risk Items</span>
            <span v-else class="text-gray-900 dark:text-white">{{ getRiskItemName(filters.risk_item) }}</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
      </div>
    </Card>

    <!-- Results Count -->
    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      Showing {{ filteredPatrols.length }} of {{ patrols.length }} patrols
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading patrols...</span>
    </div>

    <!-- Empty State -->
    <Card v-else-if="filteredPatrols.length === 0" padding="md" class="text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-4">
        {{ patrols.length === 0 ? 'No patrols found. Create your first patrol!' : 'No patrols match your search criteria.' }}
      </p>
      <Button v-if="patrols.length === 0" @click="handleCreate" variant="primary">
        Create First Patrol
      </Button>
    </Card>

    <!-- Patrol Cards -->
    <div v-else class="grid grid-cols-1 gap-4">
      <Card
        v-for="patrol in filteredPatrols"
        :key="patrol.id"
        padding="md"
        hover
      >
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <!-- Main Content -->
          <div class="flex-1 min-w-0">
            <!-- Header -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-sm font-mono text-gray-500 dark:text-gray-400 shrink-0">
                {{ patrol.patrol_number }}
              </span>
              <span :class="getStatusClass(patrol.status)" class="px-2 py-1 rounded-full text-xs font-medium shrink-0">
                {{ getStatusLabel(patrol.status) }}
              </span>
              <span :class="getRiskLevelClass(patrol.risk_level)" class="px-2 py-1 rounded-full text-xs font-medium shrink-0">
                {{ getRiskLevelLabel(patrol.risk_level) }}
              </span>
              <span v-if="patrol.immediate_hazard" class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 shrink-0">
                ⚠️ IMMEDIATE HAZARD
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ patrol.title }}
            </h3>

            <!-- Description -->
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {{ patrol.description }}
            </p>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(patrol.patrol_date) }}
              </div>
              
              <div v-if="patrol.project" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ patrol.project.name }}
              </div>

              <div v-if="patrol.main_area" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ [patrol.main_area, patrol.sub_area1, patrol.sub_area2].filter(Boolean).join(' › ') }}
              </div>

              <div v-if="patrol.inspector" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ patrol.inspector.first_name }} {{ patrol.inspector.last_name }}
              </div>
            </div>
          </div>

          <!-- Right Section - Risk Score & View Button -->
          <div class="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-3 sm:gap-3 shrink-0 w-full sm:w-auto">
            <div class="text-left sm:text-right">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Score</div>
              <div class="text-2xl font-bold" :class="getRiskScoreColor(patrol.risk_score)">
                {{ patrol.risk_score || (patrol.likelihood * patrol.severity) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                L{{ patrol.likelihood }} × S{{ patrol.severity }}
              </div>
            </div>
            
            <!-- View Button with Loading State -->
            <Button 
              @click="handleView(patrol)" 
              variant="primary" 
              size="sm"
              :loading="loadingPatrolId === patrol.id"
              class="shrink-0"
            >
              <template v-if="loadingPatrolId !== patrol.id">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </template>
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Risk Item Filter Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRiskItemModal"
          class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8"
          @click.self="showRiskItemModal = false"
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="showRiskItemModal = false"></div>

          <!-- Modal Content -->
          <div class="relative bg-white dark:bg-gray-800 w-full sm:max-w-lg shadow-xl rounded-lg transform transition-all flex flex-col overflow-hidden z-10 max-h-[80vh]">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Risk Item
                </h3>
                <button
                  type="button"
                  @click="showRiskItemModal = false"
                  class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Search -->
              <div class="mt-3 relative">
                <input
                  v-model="riskItemSearch"
                  type="text"
                  placeholder="Search risk items..."
                  class="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto p-4">
              <div class="space-y-2">
                <!-- All option -->
                <button
                  type="button"
                  @click="selectRiskItem('')"
                  class="w-full px-4 py-3 text-left rounded-lg border transition-colors"
                  :class="filters.risk_item === '' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'"
                >
                  <div class="font-medium">All Risk Items</div>
                </button>

                <!-- Risk items -->
                <button
                  v-for="item in filteredRiskItems"
                  :key="item.id"
                  type="button"
                  @click="selectRiskItem(item.id)"
                  class="w-full px-4 py-3 text-left rounded-lg border transition-colors"
                  :class="filters.risk_item === item.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'"
                >
                  <div class="font-medium">{{ item.name }}</div>
                  <div v-if="item.category" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.category }}</div>
                </button>
              </div>

              <div v-if="filteredRiskItems.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No risk items found
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { patrolService } from '@/services/patrolService'
import { useProject } from '@/composables/useProject'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const { selectedProject } = useProject()

const patrols = ref([])
const riskCategories = ref([])
const riskItems = ref([])
const loading = ref(false)
const loadingPatrolId = ref(null) // Track which patrol is being loaded
const showRiskItemModal = ref(false)
const riskItemSearch = ref('')
const filters = ref({
  search: '',
  status: '',
  risk_level: '',
  sortByDate: 'desc',
  risk_category: '',
  risk_item: ''
})

onMounted(() => {
  loadPatrols()
  loadRiskCategories()
  loadRiskItems()
})

// Reload patrols when project changes
watch(selectedProject, () => {
  loadPatrols()
}, { deep: true })

const loadRiskCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('risk_categories')
      .select('id, name')
      .order('name')
    
    if (error) throw error
    riskCategories.value = data || []
  } catch (error) {
    console.error('Error loading risk categories:', error)
  }
}

const loadRiskItems = async () => {
  try {
    const { data, error} = await supabase
      .from('risk_items')
      .select('id, name, category')
      .order('name')
    
    if (error) throw error
    riskItems.value = data || []
  } catch (error) {
    console.error('Error loading risk items:', error)
  }
}

// Filtered risk items for modal search
const filteredRiskItems = computed(() => {
  if (!riskItemSearch.value) return riskItems.value
  
  const search = riskItemSearch.value.toLowerCase()
  return riskItems.value.filter(item => 
    item.name.toLowerCase().includes(search) ||
    (item.category && item.category.toLowerCase().includes(search))
  )
})

// Helper function to get risk item name
const getRiskItemName = (itemId) => {
  const item = riskItems.value.find(i => i.id === itemId)
  return item ? item.name : 'Unknown'
}

// Select risk item from modal
const selectRiskItem = (itemId) => {
  filters.value.risk_item = itemId
  showRiskItemModal.value = false
  riskItemSearch.value = ''
}

const loadPatrols = async () => {
  loading.value = true
  try {
    const data = await patrolService.getAll()
    // Filter by current project if set
    if (selectedProject && selectedProject.value) {
      patrols.value = data.filter(p => p.project_id === selectedProject.value.id)
      console.log('📋 Loaded patrols for project:', selectedProject.value.name, '- Count:', patrols.value.length)
    } else {
      patrols.value = data
      console.log('📋 Loaded all patrols:', patrols.value.length)
    }
  } catch (error) {
    console.error('❌ Failed to load patrols:', error)
    patrols.value = []
  } finally {
    loading.value = false
  }
}

const filteredPatrols = computed(() => {
  let result = patrols.value.filter(patrol => {
    // Search filter
    const matchesSearch = filters.value.search === '' || 
      patrol.patrol_number.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      patrol.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      (patrol.description && patrol.description.toLowerCase().includes(filters.value.search.toLowerCase()))

    // Status filter
    const matchesStatus = filters.value.status === '' || patrol.status === filters.value.status

    // Risk level filter
    const matchesRiskLevel = filters.value.risk_level === '' || patrol.risk_level === filters.value.risk_level

    // Risk category filter
    const matchesRiskCategory = filters.value.risk_category === '' || 
      (patrol.risk_category_ids && patrol.risk_category_ids.includes(filters.value.risk_category))

    // Risk item filter
    const matchesRiskItem = filters.value.risk_item === '' || 
      (patrol.risk_item_ids && patrol.risk_item_ids.includes(filters.value.risk_item))

    return matchesSearch && matchesStatus && matchesRiskLevel && matchesRiskCategory && matchesRiskItem
  })

  // Sort by modified date
  result.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at)
    const dateB = new Date(b.updated_at || b.created_at)
    
    if (filters.value.sortByDate === 'asc') {
      return dateA - dateB
    } else {
      return dateB - dateA
    }
  })

  return result
})

const handleCreate = () => {
  router.push('/patrol/new')
}

const handleView = async (patrol) => {
  loadingPatrolId.value = patrol.id
  // Small delay to show loading state
  await new Promise(resolve => setTimeout(resolve, 100))
  router.push(`/patrol/${patrol.id}`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusClass = (status) => {
  const classes = {
    'open': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'pending_verification': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'closed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

const getStatusLabel = (status) => {
  const labels = {
    'open': 'OPEN',
    'pending_verification': 'PENDING VERIFICATION',
    'closed': 'CLOSED',
    'rejected': 'REJECTED'
  }
  return labels[status] || status.toUpperCase()
}

const getRiskLevelClass = (riskLevel) => {
  const classes = {
    'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'extremely_high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return classes[riskLevel] || 'bg-gray-100 text-gray-800'
}

const getRiskLevelLabel = (riskLevel) => {
  const labels = {
    'low': 'Low Risk',
    'medium': 'Medium Risk',
    'high': 'High Risk',
    'extremely_high': 'Extremely High'
  }
  return labels[riskLevel] || riskLevel
}

const getRiskScoreColor = (score) => {
  if (score <= 3) return 'text-green-600 dark:text-green-400'
  if (score <= 8) return 'text-yellow-600 dark:text-yellow-400'
  if (score <= 12) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
