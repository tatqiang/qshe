<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add New Supplier
          </h3>
          <button
            type="button"
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Company Search Section -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Company Information</h4>
          
          <!-- Company Name (English) -->
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name (English)
            </label>
            <div class="relative">
              <input
                v-model="formData.company_name"
                type="text"
                placeholder="Search or enter company name..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                @input="searchCompanies"
                @focus="showCompanyDropdown = true"
              />
              
              <!-- Company Search Results -->
              <div
                v-if="showCompanyDropdown && filteredCompanies.length > 0"
                class="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="company in filteredCompanies"
                  :key="company.id"
                  @click="selectExistingCompany(company)"
                  class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ company.name }}</div>
                  <div v-if="company.name_th" class="text-sm text-gray-600 dark:text-gray-400">{{ company.name_th }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Company Name (Thai) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name (Thai)
            </label>
            <input
              v-model="formData.company_name_th"
              type="text"
              placeholder="Search or enter company name in Thai..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              @input="searchCompanies"
              @focus="showCompanyDropdown = true"
            />
          </div>

          <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span class="text-red-500">*</span> At least one company name is required
          </div>

          <!-- Selected Existing Company Notice -->
          <div
            v-if="selectedExistingCompany"
            class="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm"
          >
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-green-700 dark:text-green-300">
                Existing company selected. Will link to this company.
              </span>
            </div>
          </div>
        </div>

        <!-- Supplier-Specific Fields -->
        <div class="space-y-4">
          <h4 class="font-medium text-gray-900 dark:text-gray-100">Supplier Details</h4>

          <!-- Supplier Code -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier Code
            </label>
            <input
              v-model="formData.supplier_code"
              type="text"
              placeholder="e.g., SUP-001"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <!-- Payment Terms & Delivery Lead Days -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms
              </label>
              <input
                v-model="formData.payment_terms"
                type="text"
                placeholder="e.g., Net 30, COD"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Lead Days
              </label>
              <input
                v-model.number="formData.delivery_lead_days"
                type="number"
                min="0"
                placeholder="Days"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <!-- Preferred Supplier & Credit Limit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex items-center">
              <input
                v-model="formData.is_preferred"
                type="checkbox"
                id="is_preferred"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="is_preferred" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred Supplier ⭐
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Limit
              </label>
              <input
                v-model.number="formData.credit_limit"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <!-- Contact Person -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Person
            </label>
            <input
              v-model="formData.contact_person"
              type="text"
              placeholder="Contact name"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <!-- Contact Phone & Email -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone
              </label>
              <input
                v-model="formData.contact_phone"
                type="tel"
                placeholder="Phone number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Email
              </label>
              <input
                v-model="formData.contact_email"
                type="email"
                placeholder="email@example.com"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              v-model="formData.notes"
              rows="3"
              placeholder="Additional notes..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            ></textarea>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSaving || !canSave"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSaving ? 'Saving...' : 'Save Supplier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps<{
  initialSearch?: string
}>()

const emit = defineEmits<{
  close: []
  saved: [supplier: any]
}>()

const formData = ref({
  company_name: props.initialSearch || '',
  company_name_th: '',
  supplier_code: '',
  payment_terms: '',
  delivery_lead_days: null as number | null,
  is_preferred: false,
  credit_limit: null as number | null,
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  notes: ''
})

const companies = ref<any[]>([])
const filteredCompanies = ref<any[]>([])
const selectedExistingCompany = ref<any>(null)
const showCompanyDropdown = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

const canSave = computed(() => {
  return formData.value.company_name.trim() || formData.value.company_name_th.trim()
})

onMounted(async () => {
  await loadCompanies()
})

async function loadCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, name_th, status')
      .eq('status', 'active')
      .order('name')

    if (error) throw error
    companies.value = data || []
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

function searchCompanies() {
  selectedExistingCompany.value = null
  showCompanyDropdown.value = true
  
  const nameQuery = formData.value.company_name.toLowerCase().trim()
  const nameTHQuery = formData.value.company_name_th.toLowerCase().trim()
  
  if (!nameQuery && !nameTHQuery) {
    filteredCompanies.value = []
    return
  }
  
  filteredCompanies.value = companies.value.filter(company => {
    const matchName = nameQuery && company.name?.toLowerCase().includes(nameQuery)
    const matchNameTH = nameTHQuery && company.name_th?.toLowerCase().includes(nameTHQuery)
    return matchName || matchNameTH
  })
}

function selectExistingCompany(company: any) {
  selectedExistingCompany.value = company
  formData.value.company_name = company.name || ''
  formData.value.company_name_th = company.name_th || ''
  showCompanyDropdown.value = false
}

async function handleSubmit() {
  if (!canSave.value) {
    errorMessage.value = 'Please provide at least one company name (English or Thai)'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    let companyId = selectedExistingCompany.value?.id

    // Step 1: Create or use existing company
    if (!companyId) {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.value.company_name.trim() || null,
          name_th: formData.value.company_name_th.trim() || null,
          status: 'active'
        })
        .select()
        .single()

      if (companyError) throw companyError
      companyId = newCompany.id
    }

    // Step 2: Create supplier with company_id
    const { data: newSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        company_id: companyId,
        supplier_code: formData.value.supplier_code.trim() || null,
        payment_terms: formData.value.payment_terms.trim() || null,
        delivery_lead_days: formData.value.delivery_lead_days,
        is_preferred: formData.value.is_preferred,
        credit_limit: formData.value.credit_limit,
        contact_person: formData.value.contact_person.trim() || null,
        contact_phone: formData.value.contact_phone.trim() || null,
        contact_email: formData.value.contact_email.trim() || null,
        notes: formData.value.notes.trim() || null,
        status: 'active'
      })
      .select(`
        *,
        company:company_id(id, name, name_th)
      `)
      .single()

    if (supplierError) throw supplierError

    emit('saved', newSupplier)
  } catch (error: any) {
    console.error('Error saving supplier:', error)
    errorMessage.value = error.message || 'Failed to save supplier. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showCompanyDropdown.value = false
    }
  })
}
</script>
