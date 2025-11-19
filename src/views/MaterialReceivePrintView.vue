<template>
  <div class="print-container fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
    <!-- Only show print button on screen, hide when printing -->
    <div class="no-print fixed top-4 right-4 z-50 flex gap-2">
      <button
        @click="handlePrint"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>
      <button
        @click="handleClose"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 shadow-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Close
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-white">Loading...</div>
    </div>

    <div v-else-if="!receive" class="flex items-center justify-center min-h-screen">
      <div class="text-red-600">Material Receive not found</div>
    </div>

    <!-- A4 Paper Modal - Fixed Size -->

    <div v-else class="print-page bg-white mx-auto my-8 shadow-2xl" style="width: 210mm; min-height: 297mm; padding: 15mm;">
      <!-- Header with Logo -->
      <div class="border-b-2 border-gray-800 pb-4 mb-4">
        <div class="flex justify-between items-start">
          <div class="flex items-start gap-2">
            <!-- JEC Logo for Material Receive Report -->
            <img src="/jec-logo.svg" alt="JEC Logo" class="w-18 h-18 object-contain" />
            <div>
              <h1 class="text-xl font-bold text-gray-900 mb-1">MATERIAL RECEIVE REPORT</h1>
              <div class="text-sm text-gray-600">
                <div><strong>Receive No:</strong> {{ receive.receive_number }}</div>
                <div><strong>Date:</strong> {{ formatDate(receive.receive_date) }}</div>
              </div>
            </div>
          </div>
          <div class="text-right text-sm">
            <div><strong>Project:</strong> {{ receive.project?.name || 'N/A' }}</div>
            <div><strong>Store:</strong> {{ receive.stores?.store_name || 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Supplier Information -->
      <div class="mb-4">
        <div class="text-sm">
          <strong>Supplier:</strong> {{ getSupplierName() }}
          <span v-if="receive.suppliers?.supplier_code" class="ml-4">
            <strong>Code:</strong> {{ receive.suppliers.supplier_code }}
          </span>
        </div>
      </div>

      <!-- Material Items -->
      <div class="mb-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">Material Items</h2>
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 5%">#</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 12%">Material Code</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 38%">Description</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 20%">Dimension</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 8%">Unit</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 8%">Received</th>
              <th class="border border-gray-300 px-1 py-1 text-center" style="width: 9%">Rejected</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in receive.material_receive_items" :key="item.id">
              <td class="border border-gray-300 px-1 py-1 text-center">{{ item.line_number }}</td>
              <td class="border border-gray-300 px-1 py-1">{{ item.material_code?.material_code || 'N/A' }}</td>
              <td class="border border-gray-300 px-1 py-1">{{ getMaterialDescription(item) }}</td>
              <td class="border border-gray-300 px-1 py-1">{{ item.specific_detail || '-' }}</td>
              <td class="border border-gray-300 px-1 py-1 text-center">{{ item.unit_of_measure || '-' }}</td>
              <td class="border border-gray-300 px-1 py-1 text-right">{{ formatNumber(item.received_quantity) }}</td>
              <td class="border border-gray-300 px-1 py-1 text-right">{{ formatNumber(item.rejected_quantity) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50 font-semibold">
              <td colspan="5" class="border border-gray-300 px-1 py-1 text-right">Total:</td>
              <td class="border border-gray-300 px-1 py-1 text-right">{{ getTotalReceived() }}</td>
              <td class="border border-gray-300 px-1 py-1 text-right">{{ getTotalRejected() }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Usage Areas -->
      <div v-if="receive.material_receive_areas && receive.material_receive_areas.length > 0" class="mb-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Usage Areas</h2>
        <div class="text-xs">
          <span v-for="(area, index) in receive.material_receive_areas" :key="area.id">
            <span v-if="index > 0">; </span>
            <span>{{ getAreaText(area) }}</span>
          </span>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="receive.remarks || receive.received_notes || receive.acknowledged_notes" class="mb-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-1">Notes</h2>
        <div class="text-xs space-y-1">
          <div v-if="receive.remarks">
            <strong>Preparation Notes:</strong> {{ receive.remarks }}
          </div>
          <div v-if="receive.received_notes">
            <strong>Receive Notes:</strong> {{ receive.received_notes }}
          </div>
          <div v-if="receive.acknowledged_notes">
            <strong>Acknowledgement Notes:</strong> {{ receive.acknowledged_notes }}
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="mt-8 grid grid-cols-2 gap-12">
        <div class="text-center">
          <div class="border-b-2 border-gray-800 mb-2 pb-16"></div>
          <div class="text-sm">
            <div class="font-semibold">Received By</div>
            <div class="text-gray-600 text-xs mt-1">Date: {{ formatDate(receive.received_at) }}</div>
          </div>
        </div>
        <div class="text-center">
          <div class="border-b-2 border-gray-800 mb-2 pb-16"></div>
          <div class="text-sm">
            <div class="font-semibold">Approved By</div>
            <div class="text-gray-600 text-xs mt-1">Date: {{ formatDate(receive.acknowledged_at) }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { materialService } from '@/services/materialService'

const route = useRoute()
const router = useRouter()

const receive = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  const receiveId = route.params.id as string
  if (receiveId) {
    try {
      receive.value = await materialService.getMaterialReceiveById(receiveId)
    } catch (error) {
      console.error('Error loading receive:', error)
    } finally {
      loading.value = false
    }
  }
})

function handlePrint() {
  window.print()
}

function handleClose() {
  router.back()
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = date.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = date.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day} ${month} ${year} ${hours}:${minutes}`
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  return value.toLocaleString()
}

function getMaterialDescription(item: any): string {
  if (item.material_template) {
    const template = item.material_template
    const parts = [
      template.title_1,
      template.title_2,
      template.title_3,
      template.title_4,
      template.title_5
    ].filter(Boolean)
    
    if (parts.length > 0) {
      return parts.join(' ') // Concatenate without pipes
    }
  }
  
  return item.material_description || 'N/A'
}

function getAreaText(area: any): string {
  const parts = [
    area.main_area?.main_area_name,
    area.sub_area_1?.sub_area_1_name,
    area.sub_area_2?.sub_area_2_name,
    area.specific_location
  ].filter(Boolean)
  
  return parts.join(' > ') || 'N/A'
}

function getSupplierName(): string {
  if (!receive.value?.suppliers) return 'N/A'
  const supplier = receive.value.suppliers
  return supplier.company?.name || supplier.company?.name_th || 'N/A'
}

function getTotalReceived(): string {
  if (!receive.value?.material_receive_items) return '0'
  const total = receive.value.material_receive_items.reduce((sum: number, item: any) => 
    sum + (item.received_quantity || 0), 0
  )
  return formatNumber(total)
}

function getTotalRejected(): string {
  if (!receive.value?.material_receive_items) return '0'
  const total = receive.value.material_receive_items.reduce((sum: number, item: any) => 
    sum + (item.rejected_quantity || 0), 0
  )
  return formatNumber(total)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    prepared: 'Prepared',
    received_all: 'Received (All)',
    received_with_note: 'Received (With Notes)',
    rejected: 'Rejected',
    acknowledged: 'Acknowledged'
  }
  return labels[status] || status
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    prepared: 'bg-yellow-100 text-yellow-800',
    received_all: 'bg-green-100 text-green-800',
    received_with_note: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    acknowledged: 'bg-purple-100 text-purple-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .print-container {
    background: white !important;
    position: static !important;
    overflow: visible !important;
  }

  .print-page {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    padding: 0 !important;
    position: relative;
  }

  @page {
    size: A4;
    margin: 15mm;
  }

  /* Page footer - appears at bottom of every printed page */
  .page-footer {
    position: fixed;
    bottom: 5mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    color: #666;
    z-index: 9999;
  }

  .print-only {
    display: block !important;
  }

  /* Ensure proper page breaks */
  table {
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  /* Remove background colors for printing */
  .bg-gray-100,
  .bg-gray-50 {
    background: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* Screen styles - Fixed A4 size modal */
@media screen {
  .print-container {
    overflow-y: auto;
    padding: 20px;
  }
  
  .print-page {
    width: 210mm !important;
    min-height: 297mm !important;
    box-sizing: border-box;
    position: relative;
  }

  .page-footer {
    display: none !important;
  }
}
</style>
