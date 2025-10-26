import { useState, useEffect, useCallback } from 'react';
import { azureADService } from '../lib/api/azureAD';

export interface CompanyUser {
  id: string;
  email: string;
  full_name: string;
  position_title?: string;
  department?: string;
  employee_id?: string;
  authority_level?: string;
  user_type?: string;
  _source: 'azure_ad' | 'mock';
}

interface UseCompanyUsersReturn {
  users: CompanyUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCompanyUsers = (): UseCompanyUsersReturn => {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching company users for assignment...');
      
      // Try to get users from Azure AD service
      const azureUsers = await azureADService.getAllUsers();
      
      if (azureUsers && azureUsers.length > 0) {
        console.log(`✅ Got ${azureUsers.length} users from Azure AD service`);
        
        // Convert Azure AD users to CompanyUser format
        const companyUsers: CompanyUser[] = azureUsers.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          position_title: user.position_title,
          department: user.department,
          employee_id: user.employee_id,
          authority_level: user.authority_level,
          user_type: user.user_type,
          _source: 'azure_ad' as const
        }));
        
        setUsers(companyUsers);
      } else {
        // Fallback to mock Jardine Engineering users
        console.log('⚠️ Using fallback mock users for assignment');
        setUsers(getMockJardineUsers());
      }
    } catch (err) {
      console.error('❌ Error fetching company users:', err);
      
      // Fallback to mock users on error
      console.log('🔄 Falling back to mock users due to error');
      setUsers(getMockJardineUsers());
      setError('Using mock data - Azure AD connection unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};

// Mock Jardine Engineering users for assignment dropdown
const getMockJardineUsers = (): CompanyUser[] => {
  return [
    // Management Level
    {
      id: 'jec-001',
      email: 'nithat.su@th.jec.com',
      full_name: 'Nithat Suksomboonlert',
      position_title: 'IT Manager',
      department: 'Information Technology',
      employee_id: 'JEC001',
      authority_level: 'system_admin',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-002',
      email: 'sarah.chen@th.jec.com',
      full_name: 'Sarah Chen',
      position_title: 'QSHE Manager',
      department: 'Quality, Safety, Health & Environment',
      employee_id: 'JEC002',
      authority_level: 'admin',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-003',
      email: 'david.wong@th.jec.com',
      full_name: 'David Wong',
      position_title: 'Project Manager',
      department: 'Engineering',
      employee_id: 'JEC003',
      authority_level: 'admin',
      user_type: 'admin',
      _source: 'mock'
    },
    
    // Senior Staff
    {
      id: 'jec-004',
      email: 'lisa.tan@th.jec.com',
      full_name: 'Lisa Tan',
      position_title: 'Senior Safety Engineer',
      department: 'Safety Engineering',
      employee_id: 'JEC004',
      authority_level: 'manager',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-005',
      email: 'michael.lim@th.jec.com',
      full_name: 'Michael Lim',
      position_title: 'Site Supervisor',
      department: 'Operations',
      employee_id: 'JEC005',
      authority_level: 'manager',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-006',
      email: 'anna.wang@th.jec.com',
      full_name: 'Anna Wang',
      position_title: 'Quality Control Specialist',
      department: 'Quality Control',
      employee_id: 'JEC006',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    
    // Engineers
    {
      id: 'jec-007',
      email: 'james.kim@th.jec.com',
      full_name: 'James Kim',
      position_title: 'Structural Engineer',
      department: 'Engineering',
      employee_id: 'JEC007',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-008',
      email: 'emma.zhao@th.jec.com',
      full_name: 'Emma Zhao',
      position_title: 'Environmental Engineer',
      department: 'Environmental',
      employee_id: 'JEC008',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-009',
      email: 'robert.lee@th.jec.com',
      full_name: 'Robert Lee',
      position_title: 'Mechanical Engineer',
      department: 'Engineering',
      employee_id: 'JEC009',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    
    // Coordinators
    {
      id: 'jec-010',
      email: 'sophia.ng@th.jec.com',
      full_name: 'Sophia Ng',
      position_title: 'Safety Coordinator',
      department: 'Safety Engineering',
      employee_id: 'JEC010',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-011',
      email: 'kevin.park@th.jec.com',
      full_name: 'Kevin Park',
      position_title: 'Project Coordinator',
      department: 'Operations',
      employee_id: 'JEC011',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-012',
      email: 'melissa.hui@th.jec.com',
      full_name: 'Melissa Hui',
      position_title: 'Health & Safety Coordinator',
      department: 'Health & Safety',
      employee_id: 'JEC012',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    
    // Analysts
    {
      id: 'jec-013',
      email: 'alex.brown@th.jec.com',
      full_name: 'Alex Brown',
      position_title: 'Risk Analyst',
      department: 'Risk Management',
      employee_id: 'JEC013',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-014',
      email: 'jenny.liu@th.jec.com',
      full_name: 'Jenny Liu',
      position_title: 'Compliance Analyst',
      department: 'Compliance',
      employee_id: 'JEC014',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    },
    {
      id: 'jec-015',
      email: 'tom.garcia@th.jec.com',
      full_name: 'Tom Garcia',
      position_title: 'Data Analyst',
      department: 'Analytics',
      employee_id: 'JEC015',
      authority_level: 'user',
      user_type: 'admin',
      _source: 'mock'
    }
  ];
};