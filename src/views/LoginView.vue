<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-extrabold text-white mb-2">QSHE</h1>
        <p class="text-lg text-blue-200">Quality, Safety, Health & Environment</p>
      </div>
      
      <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div v-if="error" class="mb-6 rounded-lg bg-red-900/30 border border-red-700 p-4">
          <p class="text-sm text-red-200">{{ error }}</p>
        </div>
        
        <button
          @click="handleMicrosoftLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg class="w-6 h-6" viewBox="0 0 23 23" fill="none">
            <path d="M0 0h11v11H0z" fill="#f25022"/>
            <path d="M12 0h11v11H12z" fill="#00a4ef"/>
            <path d="M0 12h11v11H0z" fill="#7fba00"/>
            <path d="M12 12h11v11H12z" fill="#ffb900"/>
          </svg>
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in with Microsoft</span>
        </button>
        
        <p class="text-center text-sm text-gray-400 mt-6">
          Use your company Microsoft account to sign in
        </p>
      </div>
      
      <p class="text-center text-xs text-gray-500 mt-6">
        Version {{ version }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signInWithMicrosoft, checkUser } = useAuth()

const loading = ref(false)
const error = ref('')
const version = ref('1.0.0')

onMounted(async () => {
  // Check if user is already logged in
  await checkUser()
  const { user } = useAuth()
  if (user.value) {
    router.push('/dashboard')
  }
})

const handleMicrosoftLogin = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await signInWithMicrosoft()
    router.push('/dashboard')
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.message || 'Failed to sign in with Microsoft'
  } finally {
    loading.value = false
  }
}
</script>
