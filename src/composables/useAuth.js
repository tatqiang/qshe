import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { azureAuthService } from '@/lib/azureAuth'

const user = ref(null)
const userRole = ref(null)
const loading = ref(true)

export function useAuth() {
  const fetchUserProfile = async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) throw error
      
      user.value = data
      userRole.value = data?.role || null
      
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      userRole.value = null
      return null
    }
  }

  const checkUser = async () => {
    try {
      // Check Azure AD session
      const isLoggedIn = await azureAuthService.isLoggedIn()
      if (isLoggedIn) {
        const azureUser = await azureAuthService.getUserProfile()
        if (azureUser) {
          await fetchUserProfile(azureUser.email)
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
      user.value = null
      userRole.value = null
    } finally {
      loading.value = false
    }
  }

  const signInWithMicrosoft = async () => {
    try {
      const response = await azureAuthService.loginWithMicrosoft()
      const azureUser = await azureAuthService.getUserProfile()
      
      if (!azureUser) {
        throw new Error('Failed to get user profile')
      }

      // Check if user exists in database
      const dbUser = await fetchUserProfile(azureUser.email)
      
      if (!dbUser) {
        // New user - register them
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            email: azureUser.email,
            first_name: azureUser.firstName,
            last_name: azureUser.lastName,
            azure_user_id: azureUser.id,
            role: 'member',
            user_type: 'internal',
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error
        
        user.value = newUser
        userRole.value = newUser.role
      }
      
      return response
    } catch (error) {
      console.error('Microsoft sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await azureAuthService.logout()
      user.value = null
      userRole.value = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const isSystemAdmin = () => {
    return userRole.value === 'system_admin'
  }

  onMounted(() => {
    checkUser()
  })

  return {
    user,
    userRole,
    loading,
    signInWithMicrosoft,
    signOut,
    isSystemAdmin,
    checkUser
  }
}
