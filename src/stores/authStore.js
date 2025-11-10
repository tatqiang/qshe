import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { azureAuthService } from '@/lib/azureAuth'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'system_admin')

  const initialize = async () => {
    loading.value = true
    try {
      const isLoggedIn = await azureAuthService.isLoggedIn()
      if (isLoggedIn) {
        const azureUser = await azureAuthService.getUserProfile()
        if (azureUser) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', azureUser.email)
            .single()
          
          user.value = data
        }
      }
    } catch (err) {
      error.value = err.message
      console.error('Auth initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const signIn = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await azureAuthService.signIn()
      if (result) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', result.email)
          .single()
        
        user.value = data
        return true
      }
      return false
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      await azureAuthService.signOut()
      user.value = null
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    initialize,
    signIn,
    signOut
  }
})
