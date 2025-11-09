<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Risk Assessment</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Identify and manage workplace risks</p>
    </div>

    <!-- Action Buttons -->
    <div class="mb-6">
      <button class="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
        Create New Assessment
      </button>
    </div>

    <!-- Assessment List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Assessments</h2>
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No risk assessments found</p>
          <p class="text-sm mt-2">Create your first assessment to begin</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Risk Assessment logic will be added here
</script>
