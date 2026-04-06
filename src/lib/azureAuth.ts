import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_COMPANY_CLIENT_ID || '618098ec-e3e8-4d7b-a718-c10c23e82407',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'd6bb4e04-1f12-4303-95a7-71d94f834f0a'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    // Use sessionStorage so MSAL tokens don't compete with form data in
    // localStorage and cause cache_quota_exceeded on login.
    // storeAuthStateInCookie covers mobile / Safari ITP as a fallback.
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: true // Enable cookies for mobile support
  },
  system: {
    allowRedirectInIframe: false,
    loggerOptions: {
      logLevel: 3, // Error level
      piiLoggingEnabled: false
    }
  }
}

const loginRequest = {
  scopes: ['User.Read', 'profile', 'email', 'openid']
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName: string
  lastName: string
}

class AzureAuthService {
  private msalInstance: PublicClientApplication
  private initialized: boolean
  private initPromise: Promise<void> | null

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig)
    this.initialized = false
    this.initPromise = null
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return
    
    if (!this.initPromise) {
      this.initPromise = this.initializeMsal()
    }
    
    await this.initPromise
  }

  private async initializeMsal(): Promise<void> {
    try {
      await this.msalInstance.initialize()
      
      // Handle redirect promise (important for mobile redirect flow)
      const redirectResponse = await this.msalInstance.handleRedirectPromise()
      if (redirectResponse) {
        console.log('✅ Redirect login successful:', redirectResponse)
        
        // Clear the hash from URL to prevent hash_empty_error
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      }
      
      this.initialized = true
      console.log('✅ MSAL initialized successfully')
    } catch (error) {
      console.error('❌ MSAL initialization error:', error)
      this.initialized = false
      throw error
    }
  }

  async loginWithMicrosoft(): Promise<AuthenticationResult | null> {
    try {
      await this.ensureInitialized()
      console.log('🔐 Starting Microsoft login...')
      
      // Use redirect flow for both mobile and desktop (more reliable)
      console.log('� Using redirect flow')
      await this.msalInstance.loginRedirect(loginRequest)
      return null // Redirect will reload the page
    } catch (error) {
      console.error('❌ Microsoft login error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await this.ensureInitialized()
      const account = this.msalInstance.getAllAccounts()[0]
      if (account) {
        await this.msalInstance.logoutRedirect({ account })
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      throw error
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.ensureInitialized()
      const accounts = this.msalInstance.getAllAccounts()
      return accounts.length > 0
    } catch (error) {
      console.error('❌ Error checking login status:', error)
      return false
    }
  }

  async getCurrentAccount(): Promise<AccountInfo | null> {
    try {
      await this.ensureInitialized()
      const accounts = this.msalInstance.getAllAccounts()
      return accounts[0] || null
    } catch (error) {
      console.error('❌ Error getting account:', error)
      return null
    }
  }

  async getAccessToken(): Promise<string | null> {
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

  async getUserProfile(): Promise<UserProfile | null> {
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
