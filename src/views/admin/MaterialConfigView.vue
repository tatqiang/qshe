<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center space-x-3">
          <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Material Configuration</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage material groups, templates, dimension groups, and dimensions
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-blue-900/20 dark:bg-blue-900/40 rounded-xl p-1 flex space-x-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectedTab = tab.id"
          :class="[
            'flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
            'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
            selectedTab === tab.id
              ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
              : 'text-blue-700 dark:text-blue-300 hover:bg-white/[0.12] hover:text-blue-800 dark:hover:text-blue-200'
          ]"
        >
          <div class="flex items-center justify-center space-x-2">
            <component :is="tab.icon" class="h-5 w-5" />
            <span class="hidden sm:inline">{{ tab.name }}</span>
          </div>
        </button>
      </div>

      <!-- Tab Panels -->
      <div class="mt-6 rounded-xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-lg">
        <!-- Material Groups Panel -->
        <div v-if="selectedTab === 'groups'">
          <MaterialGroupsManager />
        </div>

        <!-- Material Templates Panel -->
        <div v-if="selectedTab === 'templates'">
          <MaterialTemplatesManager />
        </div>

        <!-- Dimension Groups Panel -->
        <div v-if="selectedTab === 'dimension-groups'">
          <DimensionGroupsManager />
        </div>

        <!-- Dimensions Panel -->
        <div v-if="selectedTab === 'dimensions'">
          <DimensionsManager />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MaterialGroupsManager from '@/components/materials/config/MaterialGroupsManager.vue'
import MaterialTemplatesManager from '@/components/materials/config/MaterialTemplatesManager.vue'
import DimensionGroupsManager from '@/components/materials/config/DimensionGroupsManager.vue'
import DimensionsManager from '@/components/materials/config/DimensionsManager.vue'

// Icon components (using SVG directly)
const FolderIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>`
}

const TagIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>`
}

const RectangleGroupIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
  </svg>`
}

const CubeIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>`
}

const selectedTab = ref('groups')

const tabs = [
  {
    id: 'groups',
    name: 'Material Groups',
    icon: FolderIcon,
    description: 'Top-level categories (Pipes, Valves, etc.)'
  },
  {
    id: 'templates',
    name: 'Material Templates',
    icon: TagIcon,
    description: '5-column flexible classification templates'
  },
  {
    id: 'dimension-groups',
    name: 'Dimension Groups',
    icon: RectangleGroupIcon,
    description: 'Size categories (Nominal Pipe, Copper Pipe)'
  },
  {
    id: 'dimensions',
    name: 'Dimensions',
    icon: CubeIcon,
    description: 'Individual sizes (1/2", 3/4") with common/custom filtering'
  }
]
</script>
