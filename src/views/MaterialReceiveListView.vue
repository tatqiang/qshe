<template>
  <div class="p-3 sm:p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-4 sm:mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Material Receives
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage material receiving workflow
          </p>
        </div>
        <button
          @click="createNewReceive"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 justify-center"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Material Receive
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Search -->
        <div class="lg:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by receive number..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="prepared">Prepared</option>
            <option value="received_all">Received All</option>
            <option value="received_with_note">Received with Note</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Store Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Store
          </label>
          <select
            v-model="storeFilter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Stores</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.store_name }}
            </option>
          </select>
        </div>

        <!-- Date Sort -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort by Date
          </label>
          <select
            v-model="dateSortOrder"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Receives List -->
    <div v-else-if="filteredReceives.length > 0" class="space-y-3">
      <div
        v-for="receive in filteredReceives"
        :key="receive.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
        @click="openReceive(receive)"
      >
        <div class="p-4">
          <!-- Header Row -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ receive.receive_number }}
                </h3>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusClass(receive.status)
                  ]"
                >
                  {{ getStatusLabel(receive.status) }}
                </span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ formatDate(receive.receive_date) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{{ receive.stores?.store_name || 'Unknown Store' }}</span>
                </div>
                <div v-if="receive.suppliers" class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{{ receive.suppliers.name || 'Unknown Supplier' }}</span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-2">
              <button
                v-if="receive.status === 'prepared'"
                @click.stop="continueToStep2(receive)"
                class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Continue to Receive Check
              </button>
              <button
                @click.stop="printReceive(receive)"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1"
                title="Print Report"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                @click.stop="viewDetails(receive)"
                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                View Details
              </button>
            </div>
          </div>

          <!-- Items Summary -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">{{ receive.material_receive_items?.length || 0 }}</span> items
              <span v-if="receive.prepared_by" class="ml-4">
                Prepared by: <span class="font-medium">{{ receive.prepared_by }}</span>
              </span>
              <span v-if="receive.prepared_at" class="ml-4">
                {{ formatDateTime(receive.prepared_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No material receives found</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        {{ searchQuery || statusFilter || storeFilter ? 'Try adjusting your filters' : 'Get started by creating a new material receive' }}
      </p>
      <button
        @click="createNewReceive"
        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create First Material Receive
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { useMaterialReceive } from '@/composables/useMaterialReceive'
import { useMaterialInventory } from '@/composables/useMaterialInventory'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { selectedProject } = storeToRefs(projectStore)

const projectId = computed(() => selectedProject.value?.id || '')
const userId = authStore.user?.id || ''

const { receives, loading, error, loadReceives } = useMaterialReceive(projectId.value, userId)
const { stores, loadStores } = useMaterialInventory(projectId.value)

const searchQuery = ref('')
const statusFilter = ref('')
const storeFilter = ref('')
const dateSortOrder = ref<'asc' | 'desc'>('desc')

const filteredReceives = computed(() => {
  let filtered = receives.value || []

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(receive =>
      receive.receive_number?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(receive => receive.status === statusFilter.value)
  }

  // Store filter
  if (storeFilter.value) {
    filtered = filtered.filter(receive => receive.store_id === storeFilter.value)
  }

  // Sort by date
  filtered.sort((a, b) => {
    const dateA = new Date(a.receive_date || a.created_at).getTime()
    const dateB = new Date(b.receive_date || b.created_at).getTime()
    return dateSortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
  })

  return filtered
})

function getStatusClass(status: string): string {
  const classes = {
    prepared: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    received_all: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    received_with_note: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function getStatusLabel(status: string): string {
  const labels = {
    prepared: 'Prepared',
    received_all: 'Received All',
    received_with_note: 'Received with Note',
    rejected: 'Rejected'
  }
  return labels[status as keyof typeof labels] || status
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function createNewReceive() {
  router.push('/materials/receive/new')
}

function openReceive(receive: any) {
  viewDetails(receive)
}

function viewDetails(receive: any) {
  router.push(`/materials/receive/${receive.id}`)
}

function continueToStep2(receive: any) {
  router.push(`/materials/receive/${receive.id}?step=2`)
}

function printReceive(receive: any) {
  router.push(`/materials/receive/${receive.id}/print`)
}

onMounted(async () => {
  if (projectId.value) {
    await Promise.all([
      loadReceives(),
      loadStores()
    ])
  }
})
</script>
