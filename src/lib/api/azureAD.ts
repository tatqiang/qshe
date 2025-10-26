// Azure AD Service for Company Authentication and Employee Directory Access
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

// Azure AD configuration for Jardine Engineering
const azureConfig = {
  auth: {
    clientId: '618098ec-e3e8-4d7b-a718-c10c23e82407',
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: window.location.origin // Use current origin instead of hardcoded port
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

// Microsoft Graph API scopes - THIS IS THE KEY FOR EMPLOYEE DROPDOWN
const graphScopes = [
  'User.Read',              // Read current user profile (works for everyone)
  'User.ReadBasic.All'      // Read ALL users in organization (requires admin consent)
];

class AzureADService {
  private msalInstance: PublicClientApplication;
  private accessToken: string | null = null;
  private initializePromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.msalInstance = new PublicClientApplication(azureConfig);
    console.log('🔵 Azure AD Service created');
  }

  // Initialize the service
  async initialize() {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = this._initialize();
    return this.initializePromise;
  }

  private async _initialize() {
    try {
      await this.msalInstance.initialize();
      this.isInitialized = true;
      console.log('✅ Azure AD MSAL initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Azure AD MSAL:', error);
      throw error;
    }
  }

  // Ensure initialization before any operation
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Handle redirect response after login
  async handleRedirectResponse() {
    try {
      await this.ensureInitialized();
      const redirectResponse = await this.msalInstance.handleRedirectPromise();
      
      if (redirectResponse) {
        console.log('✅ Redirect response received:', redirectResponse);
        
        // Get user info
        const userInfo = await this.getCurrentUser();
        
        return {
          success: true,
          user: {
            id: redirectResponse.account?.homeAccountId || '',
            email: redirectResponse.account?.username || '',
            name: redirectResponse.account?.name || '',
            role: 'user' // Default role, will be determined by backend
          }
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('❌ Handle redirect response failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  // Login with company account (new method for Login component)
  async loginWithCompanyAccount() {
    try {
      await this.ensureInitialized();
      console.log('🔵 Starting Azure AD company login...');
      
      // Use loginRedirect for better UX
      await this.msalInstance.loginRedirect({
        scopes: graphScopes,
        prompt: 'select_account'
      });

      // The redirect will happen, so we return success
      return { success: true };
    } catch (error) {
      console.error('❌ Azure AD company login failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  // Login with company account (original method for backward compatibility)
  async login() {
    return this.loginWithCompanyAccount();
  }

  // Get access token for Graph API calls
  private async getAccessToken(): Promise<string> {
    try {
      await this.ensureInitialized();
      
      if (this.accessToken) {
        return this.accessToken;
      }

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please login first.');
      }

      const silentRequest = {
        scopes: graphScopes,
        account: accounts[0]
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      this.accessToken = response.accessToken;
      return this.accessToken;

    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        console.log('🔄 Interaction required, redirecting...');
        await this.msalInstance.acquireTokenRedirect({
          scopes: graphScopes,
          account: this.msalInstance.getAllAccounts()[0]
        });
        throw error;
      }
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      await this.ensureInitialized();
      
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please login first.');
      }

      // Get access token and user info
      const token = await this.getAccessToken();
      
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Graph API failed: ${response.status}`);
      }

      const user = await response.json();
      console.log('✅ Current user:', user.displayName);
      
      // Return in a consistent format
      return {
        id: user.id,
        email: user.mail || user.userPrincipalName,
        name: user.displayName,
        firstName: user.givenName,
        lastName: user.surname,
        jobTitle: user.jobTitle,
        department: user.department
      };
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      
      // If we can't get from Graph API, try to get basic info from MSAL account
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        return {
          id: account.homeAccountId,
          email: account.username,
          name: account.name || '',
          firstName: '',
          lastName: '',
          jobTitle: '',
          department: ''
        };
      }
      
      throw error;
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0;
  }

  // THIS IS THE METHOD FOR EMPLOYEE DROPDOWN
  async getAllUsers() {
    try {
      await this.ensureInitialized();
      console.log('🔍 Attempting to fetch ALL users for employee dropdown...');
      
      const token = await this.getAccessToken();
      
      // Try to get all users in organization
      const response = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,givenName,surname,mail,jobTitle,department&$filter=accountEnabled eq true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('🚫 PERMISSION DENIED: Cannot read all users');
          console.warn('📋 Reason: User.ReadBasic.All requires ADMIN CONSENT');
          console.warn('💡 Solution: Admin must grant consent in Azure Portal');
          
          // Return mock data as fallback
          return this.getMockEmployeeList();
        }
        throw new Error(`Graph API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ SUCCESS: Fetched ${data.value?.length || 0} real employees!`);

      // Convert to our format
      return data.value?.map((user: any) => ({
        id: user.id,
        firstName: user.givenName || '',
        lastName: user.surname || '',
        email: user.mail || '',
        department: user.department || 'Unknown',
        position: user.jobTitle || 'Employee',
        isActive: true,
        source: 'azure_ad_real'
      })) || [];

    } catch (error) {
      console.error('❌ Failed to fetch all users:', error);
      console.log('📋 Using mock employee data instead...');
      return this.getMockEmployeeList();
    }
  }

  // Mock employee data when real data is not accessible
  private getMockEmployeeList() {
    console.log('📋 Returning mock employee data (simulates 823 Jardine employees)');
    
    return [
      {
        id: 'emp-001',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@th.jec.com',
        department: 'Quality, Safety, Health & Environment',
        position: 'QSHE Manager',
        isActive: true,
        source: 'mock'
      },
      {
        id: 'emp-002',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.thompson@th.jec.com',
        department: 'Engineering',
        position: 'Senior Project Engineer',
        isActive: true,
        source: 'mock'
      },
      {
        id: 'emp-003',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@th.jec.com',
        department: 'Safety',
        position: 'Safety Coordinator',
        isActive: true,
        source: 'mock'
      },
      {
        id: 'emp-004',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@th.jec.com',
        department: 'Operations',
        position: 'Operations Manager',
        isActive: true,
        source: 'mock'
      },
      {
        id: 'emp-005',
        firstName: 'Lisa',
        lastName: 'Wong',
        email: 'lisa.wong@th.jec.com',
        department: 'Quality Control',
        position: 'QC Specialist',
        isActive: true,
        source: 'mock'
      }
    ];
  }

  // Check if user has admin consent for reading all users
  async checkAdminConsent(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const token = await this.getAccessToken();
      
      // Try a simple test call to see if we can read other users
      const response = await fetch('https://graph.microsoft.com/v1.0/users?$top=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const hasConsent = response.ok;
      console.log(`🔐 Admin consent status: ${hasConsent ? 'GRANTED' : 'REQUIRED'}`);
      return hasConsent;
      
    } catch (error) {
      console.log('🔐 Admin consent: REQUIRED (cannot test)');
      return false;
    }
  }

  // Logout
  async logout() {
    try {
      await this.ensureInitialized();
      await this.msalInstance.logoutRedirect();
      this.accessToken = null;
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }
}

export const azureADService = new AzureADService();