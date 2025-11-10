import { PublicClientApplication } from '@azure/msal-browser'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_COMPANY_CLIENT_ID || '618098ec-e3e8-4d7b-a718-c10c23e82407',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'd6bb4e04-1f12-4303-95a7-71d94f834f0a'}`,
    redirectUri: window.location.origin + '/',
    postLogoutRedirectUri: window.location.origin + '/',
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true // Enable cookies for mobile support
  }
}

const loginRequest = {
  scopes: ['User.Read', 'profile', 'email', 'openid']
}

class AzureAuthService {
  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig)
    this.initialized = false
    this.initPromise = null
  }

  async ensureInitialized() {
    if (this.initialized) return
    
    if (!this.initPromise) {
      this.initPromise = this.initializeMsal()
    }
    
    await this.initPromise
  }

  async initializeMsal() {
    try {
      await this.msalInstance.initialize()
      
      // Handle redirect promise (important for mobile redirect flow)
      const redirectResponse = await this.msalInstance.handleRedirectPromise()
      if (redirectResponse) {
        console.log('✅ Redirect login successful:', redirectResponse)
        // Store the account info
        this.currentAccount = redirectResponse.account
      }
      
      this.initialized = true
      console.log('✅ MSAL initialized successfully')
    } catch (error) {
      console.error('❌ MSAL initialization error:', error)
      this.initialized = false
      throw error
    }
  }

  async loginWithMicrosoft() {
    try {
      await this.ensureInitialized()
      console.log('🔐 Starting Microsoft login...')
      
      // Use redirect flow on mobile devices, popup on desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        console.log('📱 Mobile detected - using redirect flow')
        await this.msalInstance.loginRedirect(loginRequest)
        return null // Redirect will reload the page
      } else {
        console.log('💻 Desktop detected - using popup flow')
        const response = await this.msalInstance.loginPopup(loginRequest)
        console.log('✅ Login successful:', response)
        return response
      }
    } catch (error) {
      console.error('❌ Microsoft login error:', error)
      throw error
    }
  }

  async logout() {
    try {
      await this.ensureInitialized()
      const account = this.msalInstance.getAllAccounts()[0]
      if (account) {
        await this.msalInstance.logoutPopup({ account })
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      throw error
    }
  }

  async isLoggedIn() {
    try {
      await this.ensureInitialized()
      const accounts = this.msalInstance.getAllAccounts()
      return accounts.length > 0
    } catch (error) {
      console.error('❌ Error checking login status:', error)
      return false
    }
  }

  async getCurrentAccount() {
    try {
      await this.ensureInitialized()
      const accounts = this.msalInstance.getAllAccounts()
      return accounts[0] || null
    } catch (error) {
      console.error('❌ Error getting account:', error)
      return null
    }
  }

  async getAccessToken() {
    try {
      await this.ensureInitialized()
      const account = await this.getCurrentAccount()
      if (!account) return null

      const response = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account
      })
      return response.accessToken
    } catch (error) {
      console.error('❌ Token acquisition error:', error)
      return null
    }
  }

  async getUserProfile() {
    try {
      await this.ensureInitialized()
      const account = await this.getCurrentAccount()
      if (!account) return null

      return {
        id: account.localAccountId,
        email: account.username,
        displayName: account.name || '',
        firstName: account.name?.split(' ')[0] || '',
        lastName: account.name?.split(' ').slice(1).join(' ') || ''
      }
    } catch (error) {
      console.error('❌ Error getting user profile:', error)
      return null
    }
  }
}

export const azureAuthService = new AzureAuthService()
