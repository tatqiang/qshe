import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { azureAuthService, type UserProfile } from '@/lib/azureAuth'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: string
  [key: string]: unknown
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const azureUser = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'system_admin')
  const userId = computed(() => user.value?.id || null)
  const userRole = computed(() => user.value?.role || null)

  const initialize = async (): Promise<void> => {
    loading.value = true
    try {
      // Clear existing user state first
      user.value = null
      azureUser.value = null
      
      console.log('🔍 Initializing auth...')
      
      const isLoggedIn = await azureAuthService.isLoggedIn()
      console.log('📊 isLoggedIn:', isLoggedIn)
      
      if (!isLoggedIn) {
        console.log('❌ No valid Azure session found')
        return
      }

      // Verify we can get a valid access token
      const token = await azureAuthService.getAccessToken()
      console.log('🔑 Access token:', token ? 'EXISTS' : 'NULL')
      
      if (!token) {
        console.log('❌ Cannot get valid access token - clearing session')
        user.value = null
        azureUser.value = null
        return
      }

      const profile = await azureAuthService.getUserProfile()
      console.log('👤 User profile:', profile ? profile.email : 'NULL')
      
      if (!profile) {
        console.log('❌ Cannot get user profile')
        return
      }

      azureUser.value = profile
      
      // Try to get user from Supabase (if configured)
      try {
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', profile.email)
          .single()
        
        if (dbError) {
          console.warn('User not found in database or Supabase not configured:', dbError.message)
          // Create a basic user object from Azure profile
          user.value = {
            id: profile.id,
            email: profile.email,
            role: 'user'
          }
          console.log('✅ Created user from Azure profile (fallback)')
        } else if (data) {
          user.value = data
          console.log('✅ User loaded from database:', data.email, 'Role:', data.role)
        }
      } catch (dbErr) {
        console.warn('Supabase error (might not be configured):', dbErr)
        // Use Azure profile as fallback
        user.value = {
          id: profile.id,
          email: profile.email,
          role: 'user'
        }
        console.log('✅ Created user from Azure profile (exception fallback)')
      }
      
      console.log('✅ Auth initialization complete. Authenticated:', !!user.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Auth initialization error:', err)
      // Clear user on error
      user.value = null
      azureUser.value = null
    } finally {
      loading.value = false
    }
  }

  const signIn = async (): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      // Login with Azure
      await azureAuthService.loginWithMicrosoft()
      
      // Get user profile
      const profile = await azureAuthService.getUserProfile()
      if (profile) {
        azureUser.value = profile
        
        // Try to get user from Supabase (if configured)
        try {
          const { data, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', profile.email)
            .single()
          
          if (dbError) {
            console.warn('User not found in database or Supabase not configured:', dbError.message)
            // Create a basic user object from Azure profile
            user.value = {
              id: profile.id,
              email: profile.email,
              role: 'user'
            }
          } else if (data) {
            user.value = data
          }
        } catch (dbErr) {
          console.warn('Supabase error (might not be configured):', dbErr)
          // Use Azure profile as fallback
          user.value = {
            id: profile.id,
            email: profile.email,
            role: 'user'
          }
        }
        
        return true
      }
      return false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Sign in error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const signOut = async (): Promise<void> => {
    loading.value = true
    try {
      await azureAuthService.logout()
      user.value = null
      azureUser.value = null
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Sign out error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    azureUser,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    userId,
    userRole,
    initialize,
    signIn,
    signOut
  }
})
