/**
 * Google Authentication Service
 * Handles Google OAuth 2.0 authentication and API client initialization
 */

interface GoogleAuthConfig {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scopes: string
}

class GoogleAuthService {
  private gapi: any = null
  private googleAuth: any = null
  private isInitialized = false
  private config: GoogleAuthConfig

  constructor() {
    // These will need to be configured with your Google Cloud Project credentials
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      discoveryDocs: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
      ],
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive.file'
      ].join(' ')
    }
  }

  /**
   * Load Google API client library
   */
  async loadGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if gapi is already loaded
      if (typeof (window as any).gapi !== 'undefined') {
        this.gapi = (window as any).gapi
        resolve()
        return
      }

      // Load the Google API client library
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        this.gapi = (window as any).gapi
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load Google API'))
      document.head.appendChild(script)
    })
  }

  /**
   * Initialize Google API client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    if (!this.config.clientId || !this.config.apiKey) {
      throw new Error(
        'Google API credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your .env file'
      )
    }

    await this.loadGapi()

    return new Promise((resolve, reject) => {
      this.gapi.load('client:auth2', async () => {
        try {
          await this.gapi.client.init({
            apiKey: this.config.apiKey,
            clientId: this.config.clientId,
            discoveryDocs: this.config.discoveryDocs,
            scope: this.config.scopes
          })

          this.googleAuth = this.gapi.auth2.getAuthInstance()
          this.isInitialized = true
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * Sign in to Google
   */
  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.googleAuth) {
      throw new Error('Google Auth not initialized')
    }

    try {
      await this.googleAuth.signIn()
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (this.googleAuth) {
      await this.googleAuth.signOut()
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.googleAuth?.isSignedIn.get() ?? false
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): any {
    if (!this.isSignedIn()) return null
    
    const user = this.googleAuth.currentUser.get()
    const profile = user.getBasicProfile()
    
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl()
    }
  }

  /**
   * Get access token for API requests
   */
  getAccessToken(): string | null {
    if (!this.isSignedIn()) return null
    
    const user = this.googleAuth.currentUser.get()
    const authResponse = user.getAuthResponse()
    return authResponse.access_token
  }

  /**
   * Get the gapi client instance
   */
  getGapiClient(): any {
    return this.gapi?.client
  }

  /**
   * Listen for sign-in state changes
   */
  onSignInChange(callback: (isSignedIn: boolean) => void): void {
    if (this.googleAuth) {
      this.googleAuth.isSignedIn.listen(callback)
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService()
