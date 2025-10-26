// User Auto-Registration Service
// Handles automatic user creation when employees login for the first time
// CURRENTLY DISABLED - May be used in future
// This file uses old database API that needs to be updated to Supabase

/*
import { db } from './database';

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
  
  // Auto-register user on first login
  async registerOrUpdateUser(azureUser: AzureADUser): Promise<any> {
    try {
      console.log('🔍 Checking user registration for:', azureUser.mail);
      
      // Check if user already exists
      const existingUser = await database.query(`
        SELECT id, email, is_active, last_login, azure_ad_id 
        FROM users 
        WHERE azure_ad_id = ? OR email = ?
      `, [azureUser.id, azureUser.mail]);

      if (existingUser.length > 0) {
        // User exists - update last login and info
        const user = existingUser[0];
        
        await database.query(`
          UPDATE users SET 
            last_login = GETDATE(),
            display_name = ?,
            job_title = ?,
            department = ?,
            phone_number = ?,
            office_location = ?,
            updated_at = GETDATE()
          WHERE id = ?
        `, [
          azureUser.displayName,
          azureUser.jobTitle || null,
          azureUser.department || null,
          azureUser.mobilePhone || null,
          azureUser.officeLocation || null,
          user.id
        ]);

        console.log('✅ Updated existing user:', azureUser.displayName);
        
        // Get user with roles
        return this.getUserWithRoles(user.id);
      }

      // New user - create account
      console.log('🆕 Creating new user account for:', azureUser.displayName);
      
      const newUserId = await this.createNewUser(azureUser);
      
      // Assign default role
      await this.assignDefaultRole(newUserId, azureUser.mail);
      
      // Get complete user info
      const newUser = await this.getUserWithRoles(newUserId);
      
      console.log('✅ User auto-registered successfully:', azureUser.displayName);
      
      return newUser;

    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  // Create new user in database
  private async createNewUser(azureUser: AzureADUser): Promise<string> {
    const userId = this.generateUUID();
    
    await database.query(`
      INSERT INTO users (
        id, azure_ad_id, email, first_name, last_name, display_name,
        job_title, department, phone_number, office_location,
        is_active, created_at, updated_at, last_login, profile_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, GETDATE(), GETDATE(), GETDATE(), 0)
    `, [
      userId,
      azureUser.id,
      azureUser.mail || azureUser.userPrincipalName,
      azureUser.givenName || '',
      azureUser.surname || '',
      azureUser.displayName,
      azureUser.jobTitle || null,
      azureUser.department || null,
      azureUser.mobilePhone || null,
      azureUser.officeLocation || null
    ]);

    return userId;
  }

  // Assign appropriate role based on email and department
  private async assignDefaultRole(userId: string, email: string): Promise<void> {
    let roleToAssign = 'employee'; // Default role

    // Special role assignments
    if (email === 'nithat.su@th.jec.com') {
      roleToAssign = 'system_admin';
      console.log('🔑 Assigning system_admin role to nithat.su@th.jec.com');
    } else if (email.includes('qshe') || email.includes('safety')) {
      roleToAssign = 'safety_officer';
    } else if (email.includes('manager') || email.includes('supervisor')) {
      roleToAssign = 'supervisor';
    }

    // Get role ID
    const roleResult = await database.query(`
      SELECT id FROM roles WHERE role_name = ?
    `, [roleToAssign]);

    if (roleResult.length === 0) {
      console.warn(`⚠️ Role '${roleToAssign}' not found, assigning 'employee'`);
      roleToAssign = 'employee';
      
      const defaultRoleResult = await database.query(`
        SELECT id FROM roles WHERE role_name = 'employee'
      `);
      
      if (defaultRoleResult.length === 0) {
        throw new Error('No default employee role found');
      }
    }

    const roleId = roleResult[0]?.id || defaultRoleResult[0].id;

    // Assign role
    await database.query(`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at, is_active)
      VALUES (?, ?, ?, ?, GETDATE(), 1)
    `, [
      this.generateUUID(),
      userId,
      roleId,
      userId // Self-assigned for auto-registration
    ]);

    console.log(`✅ Assigned role '${roleToAssign}' to user`);
  }

  // Get user with all roles
  private async getUserWithRoles(userId: string): Promise<any> {
    const userResult = await database.query(`
      SELECT 
        u.*,
        STRING_AGG(r.role_name, ',') as roles,
        MIN(r.hierarchy_level) as highest_role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id, u.azure_ad_id, u.email, u.first_name, u.last_name, 
               u.display_name, u.job_title, u.department, u.phone_number,
               u.is_active, u.created_at, u.updated_at, u.last_login,
               u.profile_completed, u.employee_id, u.office_location, u.manager_email
    `, [userId]);

    if (userResult.length === 0) {
      throw new Error('User not found after creation');
    }

    const user = userResult[0];
    
    return {
      id: user.id,
      azureAdId: user.azure_ad_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name,
      jobTitle: user.job_title,
      department: user.department,
      phoneNumber: user.phone_number,
      officeLocation: user.office_location,
      isActive: user.is_active,
      lastLogin: user.last_login,
      profileCompleted: user.profile_completed,
      roles: user.roles ? user.roles.split(',') : ['employee'],
      highestRoleLevel: user.highest_role_level || 999,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  // Check user permissions
  async checkUserPermissions(userId: string, requiredRole?: string): Promise<boolean> {
    if (!requiredRole) return true;

    const permissionResult = await database.query(`
      SELECT r.role_name, r.hierarchy_level
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND ur.is_active = 1
    `, [userId]);

    if (permissionResult.length === 0) return false;

    const userRoles = permissionResult.map(p => p.role_name);
    
    // Check if user has required role or higher
    if (userRoles.includes('system_admin')) return true;
    if (userRoles.includes(requiredRole)) return true;
    
    // Check hierarchy level
    const requiredRoleResult = await database.query(`
      SELECT hierarchy_level FROM roles WHERE role_name = ?
    `, [requiredRole]);

    if (requiredRoleResult.length === 0) return false;

    const requiredLevel = requiredRoleResult[0].hierarchy_level;
    const userHighestLevel = Math.min(...permissionResult.map(p => p.hierarchy_level));

    return userHighestLevel <= requiredLevel;
  }

  // Assign additional role to user
  async assignRole(userId: string, roleName: string, assignedBy: string): Promise<void> {
    // Check if role exists
    const roleResult = await database.query(`
      SELECT id FROM roles WHERE role_name = ?
    `, [roleName]);

    if (roleResult.length === 0) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const roleId = roleResult[0].id;

    // Check if user already has this role
    const existingRole = await database.query(`
      SELECT id FROM user_roles 
      WHERE user_id = ? AND role_id = ? AND is_active = 1
    `, [userId, roleId]);

    if (existingRole.length > 0) {
      throw new Error('User already has this role');
    }

    // Assign role
    await database.query(`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at, is_active)
      VALUES (?, ?, ?, ?, GETDATE(), 1)
    `, [
      this.generateUUID(),
      userId,
      roleId,
      assignedBy
    ]);

    console.log(`✅ Assigned role '${roleName}' to user ${userId}`);
  }

  // Get all users with roles (for admin interface)
  async getAllUsersWithRoles(): Promise<any[]> {
    const result = await database.query(`
      SELECT 
        u.id, u.email, u.display_name, u.job_title, u.department,
        u.is_active, u.last_login, u.created_at,
        STRING_AGG(r.role_name, ',') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.email, u.display_name, u.job_title, u.department,
               u.is_active, u.last_login, u.created_at
      ORDER BY u.last_login DESC, u.created_at DESC
    `);

    return result.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : ['employee']
    }));
  }

  // Utility function to generate UUID (simple version)
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export const userRegistrationService = new UserRegistrationService();
*/