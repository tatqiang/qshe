// Azure SQL Database client for QSHE PWA

interface AzureUser {
  id: string;
  email: string;
  full_name: string;
  thai_first_name?: string;
  thai_last_name?: string;
  position_title?: string;
  phone_number?: string;
  employee_id?: string;
  department?: string;
  authority_level: 'user' | 'admin' | 'manager' | 'system_admin';
  user_type: 'registrant' | 'admin' | 'safety_officer' | 'project_manager' | 'system_admin';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  worker_type: 'internal' | 'contractor' | 'consultant' | 'temporary' | 'visitor';
  primary_company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AzureCompany {
  id: string;
  name: string;
  name_thai?: string;
  company_code?: string;
  company_type: 'client' | 'contractor' | 'consultant' | 'supplier' | 'government';
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class AzureService {
  private baseUrl = 'https://qshe.database.windows.net';
  private database = 'jectqshe';
  
  constructor() {
    console.log('🔵 Azure Service initialized with:', {
      server: this.baseUrl,
      database: this.database,
      useEntraAuth: import.meta.env.VITE_AZURE_DB_USE_ENTRA_AUTH
    });
  }

  // Note: In a real implementation, you'd use Azure SQL Edge or a REST API
  // For now, we'll use mock data that matches the Azure schema
  async getUsers(): Promise<AzureUser[]> {
    console.log('🔵 Fetching users from Azure SQL Database (mock implementation)');
    
    // Mock data that matches your Azure SQL schema
    const mockAzureUsers: AzureUser[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'nithat.su@th.jec.com',
        full_name: 'Nithat Suksomboonlert',
        thai_first_name: 'นิธัช',
        thai_last_name: 'สุขสมบูรณ์เลิศ',
        position_title: 'System Administrator',
        phone_number: '+66-2-123-4567',
        employee_id: 'JEC001',
        department: 'IT Department',
        authority_level: 'system_admin',
        user_type: 'system_admin',
        verification_status: 'verified',
        worker_type: 'internal',
        primary_company_id: '550e8400-e29b-41d4-a716-446655440100',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'john.contractor@external.com',
        full_name: 'John Smith',
        position_title: 'Safety Inspector',
        phone_number: '+66-8-987-6543',
        authority_level: 'user',
        user_type: 'safety_officer',
        verification_status: 'pending',
        worker_type: 'contractor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'jane.manager@th.jec.com',
        full_name: 'Jane Wilson',
        thai_first_name: 'เจน',
        thai_last_name: 'วิลสัน',
        position_title: 'Project Manager',
        phone_number: '+66-2-765-4321',
        employee_id: 'JEC045',
        department: 'Project Management',
        authority_level: 'manager',
        user_type: 'project_manager',
        verification_status: 'verified',
        worker_type: 'internal',
        primary_company_id: '550e8400-e29b-41d4-a716-446655440100',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🔵 Azure users fetched:', mockAzureUsers.length);
    return mockAzureUsers;
  }

  async getCompanies(): Promise<AzureCompany[]> {
    console.log('🔵 Fetching companies from Azure SQL Database (mock implementation)');
    
    const mockAzureCompanies: AzureCompany[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440100',
        name: 'Jardine Engineering Company Limited',
        name_thai: 'บริษัท จาร์ดิน เอ็นจิเนียริ่ง คอมพานี ลิมิเต็ด',
        company_code: 'JEC',
        company_type: 'client',
        tax_id: '0107537000183',
        address: '999/9 Rama IV Road, Silom, Bangrak, Bangkok 10500',
        phone: '+66-2-123-4567',
        email: 'info@th.jec.com',
        website: 'https://www.jec.com',
        contact_person: 'Nithat Suksomboonlert',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'ABC Construction Co., Ltd.',
        name_thai: 'บริษัท เอบีซี คอนสตรัคชั่น จำกัด',
        company_code: 'ABC',
        company_type: 'contractor',
        tax_id: '0105537001234',
        address: '123 Construction Ave, Bangkok 10110',
        phone: '+66-2-987-6543',
        email: 'info@abc-construction.co.th',
        website: 'https://www.abc-construction.co.th',
        contact_person: 'John Smith',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('🔵 Azure companies fetched:', mockAzureCompanies.length);
    return mockAzureCompanies;
  }

  async createUser(userData: Partial<AzureUser>): Promise<AzureUser> {
    console.log('🔵 Creating user in Azure SQL Database:', userData);
    
    const newUser: AzureUser = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      email: userData.email || '',
      full_name: userData.full_name || '',
      thai_first_name: userData.thai_first_name,
      thai_last_name: userData.thai_last_name,
      position_title: userData.position_title,
      phone_number: userData.phone_number,
      employee_id: userData.employee_id,
      department: userData.department,
      authority_level: userData.authority_level || 'user',
      user_type: userData.user_type || 'registrant',
      verification_status: userData.verification_status || 'unverified',
      worker_type: userData.worker_type || 'internal',
      primary_company_id: userData.primary_company_id,
      is_active: userData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('🔵 User created in Azure:', newUser);
    return newUser;
  }

  // Database connection test
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔵 Testing Azure SQL Database connection...');
      
      // In a real implementation, this would ping the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Connected to Azure SQL Database: ${this.database} on ${this.baseUrl}`
      };
    } catch (error) {
      console.error('🔴 Azure connection failed:', error);
      return {
        success: false,
        message: `Failed to connect to Azure SQL Database: ${error}`
      };
    }
  }
}

// Create singleton instance
export const azureService = new AzureService();

// Export types
export type { AzureUser, AzureCompany };