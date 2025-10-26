// Simplified User Registration Service
// Handles auto-registration with simple role field

interface AzureADUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  officeLocation?: string;
}

export class UserRegistrationService {
  
  // Auto-register user with simplified role assignment
  async registerOrUpdateUser(azureUser: AzureADUser): Promise<any> {
    try {
      console.log('🔍 Checking user registration for:', azureUser.mail);
      
      // Call backend API to register or update user directly
      const response = await fetch('http://localhost:3001/api/auth/register-or-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azure_ad_id: azureUser.id,
          email: azureUser.mail || azureUser.userPrincipalName,
          first_name: azureUser.givenName || '',
          last_name: azureUser.surname || '',
          display_name: azureUser.displayName,
          job_title: azureUser.jobTitle || '',
          department: azureUser.department || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ User ${result.action} in Azure SQL Database:`, azureUser.displayName, 'as', result.user.role);
          
          // Also save to localStorage for offline access
          const azureUsers = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
          const existingIndex = azureUsers.findIndex((user: any) => user.email === result.user.email);
          if (existingIndex >= 0) {
            azureUsers[existingIndex] = result.user;
          } else {
            azureUsers.push(result.user);
          }
          localStorage.setItem('azure_registered_users', JSON.stringify(azureUsers));
          
          return result.user;
        }
      }
      
      throw new Error(`Backend API call failed: ${response.status}`);
      
    } catch (error) {
      console.error('❌ Backend API failed, falling back to localStorage:', error);
      
      // Fallback to localStorage method
      return this.registerOrUpdateUserLocalStorage(azureUser);
    }
  }

  // Fallback method using localStorage
  private async registerOrUpdateUserLocalStorage(azureUser: AzureADUser): Promise<any> {
    try {
      console.log('🔄 Using localStorage fallback for:', azureUser.mail);
      
      // Check if user already exists in localStorage
      const azureUsers = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
      const existingUser = azureUsers.find((user: any) => user.email === azureUser.mail);

      if (existingUser) {
        // Update existing user and login time
        await this.updateExistingUser(existingUser.id, azureUser);
        console.log('✅ Updated existing user (localStorage):', azureUser.displayName);
        return existingUser;
      }

      // Create new user with auto-assigned role
      const newUser = await this.createNewUser(azureUser);
      console.log('✅ New user auto-registered (localStorage):', azureUser.displayName, 'as', newUser.role);
      
      return newUser;

    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  // Find user by email
  private async findUserByEmail(email: string): Promise<any> {
    // Call backend API to check if user exists in Azure SQL Database
    
    try {
      // Call backend API to find user
      const response = await fetch('http://localhost:3001/api/auth/register-or-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          azure_ad_id: 'temp', // Will be updated in createNewUser
          email: email,
          first_name: '',
          last_name: '',
          display_name: '',
          job_title: '',
          department: '',
          check_only: true // Flag to indicate we're just checking existence
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user && result.action === 'updated') {
          console.log('📋 Found existing user via backend API:', email);
          return result.user;
        }
      }
    } catch (apiError) {
      console.log('⚠️ Backend API not available, using localStorage fallback');
    }

    // Option 2: Fallback to localStorage (demo mode)
    try {
      const azureUsers = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
      const existingUser = azureUsers.find((user: any) => user.email === email);
      
      if (existingUser) {
        console.log('📋 Found existing user in local registry:', email);
        return existingUser;
      }
      
      console.log('👤 No existing user found for:', email);
      return null;
    } catch (error) {
      console.error('❌ Error checking user existence:', error);
      return null;
    }
  }

  // Create new user with automatic role assignment
  private async createNewUser(azureUser: AzureADUser): Promise<any> {
    const userId = this.generateUUID();
    const assignedRole = this.determineUserRole(azureUser);
    
    const newUser = {
      id: userId,
      azure_ad_id: azureUser.id,
      email: azureUser.mail || azureUser.userPrincipalName,
      first_name: azureUser.givenName || '',
      last_name: azureUser.surname || '',
      display_name: azureUser.displayName,
      role: assignedRole, // Simple role field
      job_title: azureUser.jobTitle || null,
      department: azureUser.department || null,
      phone_number: azureUser.mobilePhone || null,
      office_location: azureUser.officeLocation || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date(),
      profile_completed: false
    };

    // Call backend API to save user to Azure SQL Database
    try {
      const response = await fetch('http://localhost:3001/api/auth/register-or-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azure_ad_id: newUser.azure_ad_id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          display_name: newUser.display_name,
          job_title: newUser.job_title,
          department: newUser.department
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ User saved to Azure SQL Database with role:', result.user.role);
          return result.user;
        }
      }
      
      throw new Error('API call failed');
    } catch (error) {
      console.error('❌ Failed to save user to database:', error);
      throw error;
    }
  }

  // Update existing user info
  private async updateExistingUser(userId: string, azureUser: AzureADUser): Promise<void> {
    // Update user information and last login
    try {
      const azureUsers = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
      const userIndex = azureUsers.findIndex((user: any) => user.id === userId);
      
      if (userIndex !== -1) {
        // Update existing user data
        azureUsers[userIndex] = {
          ...azureUsers[userIndex],
          display_name: azureUser.displayName,
          job_title: azureUser.jobTitle || null,
          department: azureUser.department || null,
          phone_number: azureUser.mobilePhone || null,
          office_location: azureUser.officeLocation || null,
          last_login: new Date(),
          updated_at: new Date()
        };
        
        localStorage.setItem('azure_registered_users', JSON.stringify(azureUsers));
        console.log('📝 Updated user info and login time for:', azureUser.displayName);
      }
    } catch (error) {
      console.error('❌ Failed to update user:', error);
    }
  }

  // Determine appropriate role based on email and Azure AD info
  private determineUserRole(azureUser: AzureADUser): string {
    const email = azureUser.mail || azureUser.userPrincipalName;
    const jobTitle = azureUser.jobTitle?.toLowerCase() || '';
    const department = azureUser.department?.toLowerCase() || '';

    // Special admin assignment - TEMPORARILY DISABLED FOR TESTING
    if (email === 'nithat.su@th.jec.com') {
      console.log('🧪 TESTING: Assigning member role to nithat.su@th.jec.com (normally system_admin)');
      return 'member';  // Changed from 'system_admin' for testing
    }

    // Admin roles - managers, directors, QSHE leads
    if (jobTitle.includes('manager') || jobTitle.includes('director') || jobTitle.includes('head') ||
        department.includes('qshe') || department.includes('safety') || department.includes('quality')) {
      return 'admin';
    }

    // Default new users start as registrant, can be promoted to member by admin
    return 'registrant';
  }

  // Check if user has required permission level
  async checkPermission(userRole: string, requiredRole: string): Promise<boolean> {
    const roleHierarchy = {
      'system_admin': 1,
      'admin': 2, 
      'member': 3,
      'registrant': 4
    };

    const userLevel = roleHierarchy[userRole] || 999;
    const requiredLevel = roleHierarchy[requiredRole] || 999;

    return userLevel <= requiredLevel;
  }

  // Check if user can perform specific action
  async canPerformAction(userRole: string, action: string): Promise<boolean> {
    const permissions = {
      'system_admin': [
        'manage_users', 'manage_system', 'view_all_projects', 'manage_projects',
        'create_patrols', 'review_patrols', 'assign_corrective_actions', 'manage_settings',
        'assign_roles', 'delete_records', 'export_data'
      ],
      'admin': [
        'view_all_projects', 'manage_projects', 'create_patrols', 'review_patrols',
        'assign_corrective_actions', 'view_reports', 'assign_roles', 'manage_users'
      ],
      'member': [
        'create_patrols', 'edit_own_patrols', 'create_observations', 'assign_corrective_actions',
        'view_assigned_projects', 'upload_photos', 'complete_corrective_actions'
      ],
      'registrant': [
        'view_own_assignments', 'view_own_patrols', 'basic_profile_edit'
      ]
    };

    const userPermissions = permissions[userRole] || [];
    return userPermissions.includes(action);
  }

  // Update user role (admin function)
  async updateUserRole(userId: string, newRole: string, updatedBy: string): Promise<void> {
    const validRoles = ['system_admin', 'admin', 'member', 'registrant'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    // Database update would happen here
    // SQL: UPDATE users SET role = ?, updated_by = ?, updated_at = GETDATE() WHERE id = ?
    
    console.log(`✅ Updated user ${userId} role to ${newRole} by ${updatedBy}`);
  }

  // Get users by role (for admin interface)
  async getUsersByRole(role: string): Promise<any[]> {
    // SQL: SELECT * FROM users WHERE role = ? AND is_active = 1
    return [];
  }

  // Get all users with their role levels (for user assignment dropdowns)
  async getAllActiveUsers(): Promise<any[]> {
    // SQL: SELECT id, display_name, email, role, department FROM users WHERE is_active = 1 ORDER BY display_name
    return [];
  }

  // Utility function to generate UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const userRegistrationService = new UserRegistrationService();

// Export permission helper functions
export const checkUserPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'system_admin': 1,
    'admin': 2,
    'member': 3,
    'registrant': 4
  };

  const userLevel = roleHierarchy[userRole] || 999;
  const requiredLevel = roleHierarchy[requiredRole] || 999;

  return userLevel <= requiredLevel;
};

export const getRoleDisplayName = (role: string): string => {
  const roleNames = {
    'system_admin': 'System Administrator',
    'admin': 'Administrator', 
    'member': 'Member',
    'registrant': 'Registrant'
  };

  return roleNames[role] || 'Unknown Role';
};