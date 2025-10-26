// Database service switcher for QSHE PWA
// Allows switching between Supabase (legacy) and Azure (new)

import { supabase } from './supabase';
import { azureService, type AzureUser, type AzureCompany } from './azure';
import { azureADService } from './azureAD';

// Feature flags from environment
const USE_AZURE_DATABASE = import.meta.env.VITE_USE_AZURE_DATABASE === 'true';
const USE_AZURE_AUTH = import.meta.env.VITE_USE_AZURE_AUTH === 'true';
const USE_AZURE_STORAGE = import.meta.env.VITE_USE_AZURE_STORAGE === 'true';

export interface DatabaseUser {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  thai_first_name?: string;
  thai_last_name?: string;
  position_title?: string;
  phone_number?: string;
  employee_id?: string;
  department?: string;
  authority_level?: string;
  user_type?: string;
  verification_status?: string;
  worker_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Database source indicator
  _source: 'supabase' | 'azure';
}

export interface DatabaseCompany {
  id: string;
  name: string;
  name_thai?: string;
  company_code?: string;
  company_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _source: 'supabase' | 'azure';
}

class DatabaseService {
  private currentSource: 'supabase' | 'azure' = USE_AZURE_DATABASE ? 'azure' : 'supabase';

  constructor() {
    console.log('🔄 Database Service initialized:', {
      currentSource: this.currentSource,
      featureFlags: {
        USE_AZURE_DATABASE,
        USE_AZURE_AUTH,
        USE_AZURE_STORAGE
      }
    });
  }

  // Get current database source
  getCurrentSource(): 'supabase' | 'azure' {
    return this.currentSource;
  }

  // Switch database source (for testing)
  switchSource(source: 'supabase' | 'azure'): void {
    console.log(`🔄 Switching database source from ${this.currentSource} to ${source}`);
    this.currentSource = source;
  }

  // Unified user fetching - ALWAYS from Supabase only
  async getUsers(): Promise<DatabaseUser[]> {
    console.log('📊 Fetching users from SUPABASE ONLY');

    // ALWAYS use Supabase - this is the single source of truth
    // DO NOT fetch from Azure AD (requires admin permissions and shows users not in our system)
    try {
      console.log('🟡 Fetching from Supabase users table...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔴 Supabase error:', error);
        throw error;
      }

      console.log(`✅ Supabase users fetched: ${data?.length || 0} users`);
      
      return (data as any[] || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        thai_first_name: user.first_name_thai,
        thai_last_name: user.last_name_thai,
        position_title: user.position,
        phone_number: user.phone_number,
        employee_id: user.employee_id,
        department: user.department,
        authority_level: user.role, // Supabase uses 'role' field
        user_type: user.user_type,
        verification_status: user.status, // Supabase uses 'status' field
        worker_type: user.user_type === 'external' ? 'contractor' : 'internal',
        is_active: user.status === 'active',
        created_at: user.created_at,
        updated_at: user.updated_at,
        _source: 'supabase'
      }));
    } catch (error) {
      console.error('🔴 Supabase fetch failed:', error);
      throw error;
    }
  }

  // Unified company fetching
  async getCompanies(): Promise<DatabaseCompany[]> {
    console.log(`🏢 Fetching companies from ${this.currentSource.toUpperCase()}`);

    if (this.currentSource === 'azure') {
      try {
        const azureCompanies = await azureService.getCompanies();
        return azureCompanies.map(company => ({
          id: company.id,
          name: company.name,
          name_thai: company.name_thai,
          company_code: company.company_code,
          company_type: company.company_type,
          is_active: company.is_active,
          created_at: company.created_at,
          updated_at: company.updated_at,
          _source: 'azure'
        }));
      } catch (error) {
        console.error('🔴 Azure company fetch failed:', error);
        this.currentSource = 'supabase';
        return this.getCompanies();
      }
    } else {
      // Supabase implementation
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('🔴 Supabase companies error:', error);
          throw error;
        }

        return (data as any[] || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          name_thai: company.name_thai,
          company_code: company.company_code,
          company_type: company.company_type,
          is_active: company.status === 'active',
          created_at: company.created_at,
          updated_at: company.updated_at,
          _source: 'supabase'
        }));
      } catch (error) {
        console.error('🔴 Supabase company fetch failed:', error);
        throw error;
      }
    }
  }

  // Database connection test
  async testConnection(): Promise<{ success: boolean; message: string; source: string }> {
    if (this.currentSource === 'azure') {
      const result = await azureService.testConnection();
      return { ...result, source: 'azure' };
    } else {
      // Test Supabase connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        
        return {
          success: true,
          message: 'Connected to Supabase successfully',
          source: 'supabase'
        };
      } catch (error) {
        return {
          success: false,
          message: `Supabase connection failed: ${error}`,
          source: 'supabase'
        };
      }
    }
  }

  // Get configuration info
  getConfig() {
    return {
      currentSource: this.currentSource,
      featureFlags: {
        USE_AZURE_DATABASE,
        USE_AZURE_AUTH,
        USE_AZURE_STORAGE
      },
      environments: {
        supabase: {
          url: import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'
        },
        azure: {
          server: import.meta.env.VITE_AZURE_SQL_SERVER ? '✅ Configured' : '❌ Missing',
          database: import.meta.env.VITE_AZURE_DATABASE ? '✅ Configured' : '❌ Missing',
          storage: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT ? '✅ Configured' : '❌ Missing'
        }
      }
    };
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).databaseService = databaseService;
}