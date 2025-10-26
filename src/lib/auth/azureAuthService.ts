// Azure Authentication Service - Microsoft Entra ID Integration
import { 
  PublicClientApplication, 
  InteractionType 
} from '@azure/msal-browser';
import type { 
  AuthenticationResult, 
  SilentRequest,
  PopupRequest,
  EndSessionRequest 
} from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { sessionManager } from './sessionManager';

// Debug environment variables
console.log('🔍 Azure Environment Variables:', {
  clientId: import.meta.env.VITE_AZURE_COMPANY_CLIENT_ID || 'NOT SET',
  tenantId: import.meta.env.VITE_AZURE_TENANT_ID || 'NOT SET',
  redirectUri: window.location.origin,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_AZURE'))
});

console.log('🔍 Raw Environment Check:', {
  VITE_AZURE_TENANT_ID: import.meta.env.VITE_AZURE_TENANT_ID,
  VITE_AZURE_COMPANY_CLIENT_ID: import.meta.env.VITE_AZURE_COMPANY_CLIENT_ID
});

// Temporary alert to debug environment loading
if (!import.meta.env.VITE_AZURE_TENANT_ID) {
  console.error('❌ VITE_AZURE_TENANT_ID is not loaded!');
  console.error('Available VITE vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: '618098ec-e3e8-4d7b-a718-c10c23e82407',
    authority: 'https://login.microsoftonline.com/d6bb4e04-1f12-4303-95a7-71d94f834f0a',
    redirectUri: 'http://localhost:5173',
    postLogoutRedirectUri: 'http://localhost:5173',
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'localStorage'
  }
};

console.log('🔍 Final MSAL Config:', msalConfig);

// Required scopes for Microsoft Graph
const loginRequest: PopupRequest = {
  scopes: [
    'User.Read',
    'profile',
    'email',
    'openid'
  ]
};

export interface MicrosoftUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  employeeId?: string;
}

export interface AzureAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  userPrincipalName: string;
  companyEmail: string;
  jobTitle?: string;
  department?: string;
  isCompanyUser: boolean;
  accessToken: string;
}

export class AzureAuthService {
  private msalInstance: PublicClientApplication;
  private graphClient: Client | null = null;
  private static instance: AzureAuthService | null = null;
  private onLoginComplete?: (response: AuthenticationResult) => void;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.initializeMsal();
  }

  // Singleton pattern to ensure only one instance
  static getInstance(): AzureAuthService {
    if (!AzureAuthService.instance) {
      AzureAuthService.instance = new AzureAuthService();
    }
    return AzureAuthService.instance;
  }

  // Set callback for login completion after redirect
  setLoginCompleteCallback(callback: (response: AuthenticationResult) => void): void {
    this.onLoginComplete = callback;
  }

  private async initializeMsal(): Promise<void> {
    try {
      await this.msalInstance.initialize();
      
      // Handle redirect promise for page loads after redirect
      try {
        
        const response = await this.msalInstance.handleRedirectPromise();
        
        console.log('🔍 MSAL redirect response:', response);
        
        // If MSAL doesn't recognize the redirect but we have auth params, try to get accounts manually
        if (!response && (window.location.hash || window.location.search.includes('code='))) {
          console.log('🔄 MSAL missed redirect, checking for existing accounts...');
          const accounts = this.msalInstance.getAllAccounts();
          console.log('📋 Available accounts:', accounts);
          
          if (accounts.length > 0) {
            console.log('✅ Found existing account, setting as active:', accounts[0]);
            this.msalInstance.setActiveAccount(accounts[0]);
            
            // Try to get a token silently to confirm the account works
            try {
              const silentRequest = {
                scopes: ['User.Read'],
                account: accounts[0]
              };
              const tokenResponse = await this.msalInstance.acquireTokenSilent(silentRequest);
              console.log('✅ Silent token acquisition successful, user is authenticated');
              
              this.setupGraphClient(tokenResponse.accessToken);
              
              // Clear auth params and trigger callback
              if (window.location.hash || window.location.search.includes('code=')) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              
              this.onLoginComplete?.(tokenResponse);
              return;
            } catch (silentError) {
              console.log('⚠️ Silent token acquisition failed:', silentError);
            }
          }
        }
        
        if (response && response.account) {
          console.log('✅ Azure Auth redirect handled successfully', {
            account: response.account,
            accessToken: !!response.accessToken
          });
          this.msalInstance.setActiveAccount(response.account);
          this.setupGraphClient(response.accessToken);
          
          // Clear the URL hash/query params that MSAL adds
          if (window.location.hash || window.location.search.includes('code=')) {
            console.log('🧹 Clearing auth params from URL');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Trigger callback immediately
          console.log('🎯 Triggering login complete callback');
          this.onLoginComplete?.(response);
        } else {
          console.log('❌ No MSAL response or account found', {
            hasResponse: !!response,
            hasAccount: response?.account,
            hasAuthParams: window.location.hash || window.location.search.includes('code=')
          });
          
          if (window.location.hash || window.location.search.includes('code=')) {
            console.log('🔄 Clearing auth params from URL (no valid response)');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (redirectError: any) {
        console.error('❌ MSAL redirect handling error:', redirectError);
        // Clear auth params from URL if there's an error
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (redirectError.errorCode !== 'no_token_request_cache_error') {
          console.warn('⚠️ Redirect promise handling warning:', redirectError.message);
        }
      }
    } catch (error) {
      console.error('❌ MSAL initialization failed:', error);
    }
  }

  private setupGraphClient(accessToken: string): void {
    const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
      this.msalInstance,
      {
        account: this.msalInstance.getActiveAccount()!,
        scopes: loginRequest.scopes!,
        interactionType: InteractionType.Popup
      }
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: authProvider
    });
  }

  /**
   * Login with Microsoft redirect (avoids popup CORP issues)
   */
  async loginWithMicrosoft(): Promise<void> {
    try {
      console.log('🔑 Starting Microsoft login redirect...');
      
      // Check if already logged in AND have a valid session
      const hasValidSession = this.isLoggedIn() && sessionManager.restoreSession();
      
      if (hasValidSession) {
        console.log('⏸️ User already logged in with valid session, skipping redirect');
        return;
      }
      
      // If we have an account but no valid session (e.g., after logout), clear it
      if (this.isLoggedIn() && !sessionManager.restoreSession()) {
        console.log('🧹 Found stale MSAL account without valid session, clearing...');
        const account = this.msalInstance.getActiveAccount();
        if (account) {
          // Remove the account from MSAL cache
          await this.msalInstance.logout({ account });
        }
      }
      
      // Check if user just logged out (indicated by special flag in sessionStorage)
      const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
      
      // Enhanced login request with domain hint
      const enhancedLoginRequest = {
        ...loginRequest,
        domainHint: 'th.jec.com', // Help Microsoft know which domain to expect
        // Use 'login' after logout to force fresh login and allow different account
        // Use 'select_account' for normal login to show account picker
        prompt: justLoggedOut ? 'login' : 'select_account',
        redirectUri: window.location.origin, // Explicitly set redirect URI
        loginHint: undefined, // Don't hint any specific account - let user choose
        extraQueryParameters: {
          // Additional parameters to help with authentication
        }
      };
      
      // Clear the logout flag
      if (justLoggedOut) {
        sessionStorage.removeItem('just_logged_out');
        console.log('🔄 Post-logout login - forcing fresh authentication');
      }
      
      console.log('🔑 Login request:', enhancedLoginRequest);
      
      // Use redirect instead of popup to avoid CORP issues
      await this.msalInstance.loginRedirect(enhancedLoginRequest);
      
      // loginRedirect doesn't return - it redirects the page
      // The result will be handled in initializeMsal after redirect
    } catch (error: any) {
      console.error('❌ Microsoft login redirect failed:', error);
      
      // If it's the interaction_in_progress error, user is already being processed
      if (error.errorCode === 'interaction_in_progress' || error.message?.includes('interaction_in_progress')) {
        console.log('🔄 Authentication already in progress, no action needed');
        return; // Don't throw error, just return
      }
      
      throw new Error(error.message || 'Microsoft login failed');
    }
  }

  /**
   * Get current Azure user if logged in (after redirect)
   */
  async getCurrentAzureUser(): Promise<AzureAuthUser | null> {
    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) return null;

      // Get detailed user profile from Microsoft Graph
      const userProfile = await this.getUserProfile();
      
      // Check if user belongs to company domain
      const isCompanyUser = this.isCompanyEmail(userProfile.mail || userProfile.userPrincipalName);
      
      if (!isCompanyUser) {
        await this.logout();
        throw new Error('Access denied: Only company email addresses (@th.jec.com) are allowed');
      }

      // Get access token
      const tokenResponse = await this.acquireTokenSilently();

      const azureUser: AzureAuthUser = {
        id: userProfile.id,
        email: userProfile.mail || userProfile.userPrincipalName,
        firstName: userProfile.givenName || '',
        lastName: userProfile.surname || '',
        displayName: userProfile.displayName,
        userPrincipalName: userProfile.userPrincipalName,
        companyEmail: userProfile.mail || userProfile.userPrincipalName,
        jobTitle: userProfile.jobTitle,
        department: userProfile.department,
        isCompanyUser,
        accessToken: tokenResponse || ''
      };

      console.log('✅ Current Azure user retrieved:', azureUser);
      return azureUser;
    } catch (error) {
      console.error('❌ Failed to get current Azure user:', error);
      return null;
    }
  }

  /**
   * Silent token acquisition
   */
  async acquireTokenSilently(): Promise<string | null> {
    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) return null;

      const silentRequest: SilentRequest = {
        ...loginRequest,
        account: account
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed:', error);
      return null;
    }
  }

  /**
   * Get current user profile from Microsoft Graph
   */
  async getUserProfile(): Promise<MicrosoftUser> {
    try {
      // Initialize graph client if not already done (for existing sessions)
      if (!this.graphClient) {
        const accessToken = await this.acquireTokenSilently();
        if (!accessToken) {
          throw new Error('Failed to acquire access token');
        }
        this.setupGraphClient(accessToken);
      }

      const user = await this.graphClient.api('/me').get();
      
      return {
        id: user.id,
        displayName: user.displayName,
        givenName: user.givenName,
        surname: user.surname,
        mail: user.mail,
        userPrincipalName: user.userPrincipalName,
        jobTitle: user.jobTitle,
        department: user.department,
        companyName: user.companyName,
        employeeId: user.employeeId
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile from Microsoft Graph');
    }
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    const account = this.msalInstance.getActiveAccount();
    return account !== null;
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): AzureAuthUser | null {
    const account = this.msalInstance.getActiveAccount();
    if (!account) return null;

    const isCompanyUser = this.isCompanyEmail(account.username);

    return {
      id: account.localAccountId,
      email: account.username,
      firstName: account.name?.split(' ')[0] || '',
      lastName: account.name?.split(' ').slice(1).join(' ') || '',
      displayName: account.name || account.username,
      userPrincipalName: account.username,
      companyEmail: account.username,
      isCompanyUser,
      accessToken: '' // Would need to acquire fresh token
    };
  }

  /**
   * Logout from Microsoft
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Starting Azure AD logout...');
      
      const account = this.msalInstance.getActiveAccount();
      
      // Clear session manager first
      sessionManager.clearSession();
      console.log('✅ Session manager cleared');
      
      // Set flag to indicate user just logged out
      // This will force fresh login screen (not cached account) on next login
      sessionStorage.setItem('just_logged_out', 'true');
      console.log('🔄 Set post-logout flag for fresh authentication');
      
      // Clear graph client
      this.graphClient = null;
      
      if (account) {
        console.log('🧹 Logging out account:', account.username);
        
        const logoutRequest: EndSessionRequest = {
          account: account,
          postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
        };
        
        // ✅ Use redirect instead of popup to match login flow
        // This will redirect to Azure AD logout page, then back to postLogoutRedirectUri
        console.log('🔄 Initiating Azure AD logout redirect...');
        await this.msalInstance.logoutRedirect(logoutRequest);
        console.log('✅ Microsoft logout redirect initiated');
        
        // Note: Code after logoutRedirect won't execute as it redirects the page
      } else {
        console.log('⚠️ No active account to logout, clearing MSAL cache');
        // Even if no active account, clear all accounts from cache
        const allAccounts = this.msalInstance.getAllAccounts();
        if (allAccounts.length > 0) {
          console.log(`🧹 Found ${allAccounts.length} cached accounts, removing...`);
          // MSAL doesn't have a direct "clear all" method, but logout without account parameter should work
          await this.msalInstance.logoutRedirect({
            postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
          });
        } else {
          // No Azure accounts, just clear local storage and redirect
          console.log('✅ No Azure accounts to logout, clearing local data');
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear session even if logout fails
      sessionManager.clearSession();
      this.graphClient = null;
      
      // Fallback: clear everything and redirect
      console.log('⚠️ Logout error, forcing clear and redirect');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      
      throw error;
    }
  }

  /**
   * Check if email belongs to company domain
   */
  private isCompanyEmail(email: string): boolean {
    const companyDomains = [
      '@th.jec.com',
      '@jec.com' // Add other company domains as needed
    ];
    
    return companyDomains.some(domain => 
      email.toLowerCase().endsWith(domain.toLowerCase())
    );
  }

  /**
   * Get all accounts (for multi-account scenarios)
   */
  getAllAccounts() {
    return this.msalInstance.getAllAccounts();
  }

  /**
   * Check Azure configuration
   */
  static isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_AZURE_CLIENT_ID && 
      import.meta.env.VITE_AZURE_TENANT_ID
    );
  }

  /**
   * Get user's profile photo from Microsoft Graph
   */
  async getUserPhoto(): Promise<string | null> {
    try {
      if (!this.graphClient) return null;

      const photo = await this.graphClient
        .api('/me/photo/$value')
        .responseType('blob' as any)
        .get();

      if (photo) {
        return URL.createObjectURL(photo);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get user photo:', error);
      return null;
    }
  }

  /**
   * Get user's manager information
   */
  async getUserManager(): Promise<MicrosoftUser | null> {
    try {
      if (!this.graphClient) return null;

      const manager = await this.graphClient.api('/me/manager').get();
      
      return {
        id: manager.id,
        displayName: manager.displayName,
        givenName: manager.givenName,
        surname: manager.surname,
        mail: manager.mail,
        userPrincipalName: manager.userPrincipalName,
        jobTitle: manager.jobTitle,
        department: manager.department
      };
    } catch (error) {
      console.warn('Failed to get user manager:', error);
      return null;
    }
  }
}

// Export singleton instance
export const azureAuthService = AzureAuthService.getInstance();