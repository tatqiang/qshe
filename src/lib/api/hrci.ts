// HRCi Enterprise Application Integration
// App ID: 939ca5ce-c355-4b79-a5b0-...

interface HRCiEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  manager?: string;
  location: string;
  status: 'Active' | 'Inactive';
  hireDate: string;
  _source: 'hrci';
}

interface HRCiResponse {
  employees: HRCiEmployee[];
  totalCount: number;
  departments: string[];
  locations: string[];
}

export class HRCiService {
  private baseUrl = '/api/hrci'; // Proxy endpoint
  private appId = '939ca5ce-c355-4b79-a5b0-9691c6d836a8'; // Replace with full App ID

  // Test if HRCi API is accessible
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.warn('HRCi connection test failed:', error);
      return false;
    }
  }

  // Get all employees from HRCi
  async getEmployees(options?: {
    department?: string;
    location?: string;
    searchTerm?: string;
  }): Promise<HRCiEmployee[]> {
    try {
      const params = new URLSearchParams();
      if (options?.department) params.append('department', options.department);
      if (options?.location) params.append('location', options.location);
      if (options?.searchTerm) params.append('search', options.searchTerm);

      const response = await fetch(`${this.baseUrl}/employees?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HRCi API error: ${response.status}`);
      }

      const data: HRCiResponse = await response.json();
      return data.employees;
    } catch (error) {
      console.warn('Failed to fetch employees from HRCi:', error);
      throw error;
    }
  }

  // Get specific employee by ID
  async getEmployee(employeeId: string): Promise<HRCiEmployee | null> {
    try {
      const response = await fetch(`${this.baseUrl}/employees/${employeeId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HRCi API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch employee from HRCi:', error);
      return null;
    }
  }

  // Search employees by name or email
  async searchEmployees(searchTerm: string): Promise<HRCiEmployee[]> {
    return this.getEmployees({ searchTerm });
  }

  // Get departments list
  async getDepartments(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/departments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HRCi API error: ${response.status}`);
      }

      const data = await response.json();
      return data.departments || [];
    } catch (error) {
      console.warn('Failed to fetch departments from HRCi:', error);
      return [];
    }
  }

  // Mock implementation for testing
  async getMockEmployees(): Promise<HRCiEmployee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        employeeId: 'JEC001',
        firstName: 'Nithat',
        lastName: 'Suksomboonlert',
        email: 'nithat.su@th.jec.com',
        department: 'Information Technology',
        position: 'IT Manager',
        manager: 'Sarah Chen',
        location: 'Bangkok Office',
        status: 'Active',
        hireDate: '2020-01-15',
        _source: 'hrci'
      },
      {
        employeeId: 'JEC002',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@th.jec.com',
        department: 'Quality, Safety, Health & Environment',
        position: 'QSHE Manager',
        manager: 'David Wong',
        location: 'Bangkok Office',
        status: 'Active',
        hireDate: '2019-03-10',
        _source: 'hrci'
      },
      {
        employeeId: 'JEC003',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.thompson@th.jec.com',
        department: 'Engineering',
        position: 'Senior Project Engineer',
        manager: 'Sarah Chen',
        location: 'Site Office 1',
        status: 'Active',
        hireDate: '2021-06-20',
        _source: 'hrci'
      },
      {
        employeeId: 'JEC004',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@th.jec.com',
        department: 'Safety',
        position: 'Safety Coordinator',
        manager: 'Sarah Chen',
        location: 'Bangkok Office',
        status: 'Active',
        hireDate: '2022-02-14',
        _source: 'hrci'
      },
      {
        employeeId: 'JEC005',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@th.jec.com',
        department: 'Operations',
        position: 'Operations Manager',
        manager: 'David Wong',
        location: 'Site Office 2',
        status: 'Active',
        hireDate: '2018-11-05',
        _source: 'hrci'
      }
    ];
  }

  // Get access token for HRCi API (would need proper implementation)
  private async getAccessToken(): Promise<string> {
    // This would typically involve:
    // 1. Azure AD authentication
    // 2. Getting token for HRCi application
    // 3. Proper scope and permissions
    
    // For now, return empty - real implementation needed
    return '';
  }

  // Convert HRCi employee to our user format
  toCompanyUser(hrciEmployee: HRCiEmployee) {
    return {
      id: hrciEmployee.employeeId,
      firstName: hrciEmployee.firstName,
      lastName: hrciEmployee.lastName,
      email: hrciEmployee.email,
      department: hrciEmployee.department,
      position: hrciEmployee.position,
      isActive: hrciEmployee.status === 'Active',
      source: 'hrci' as const
    };
  }
}

export const hrciService = new HRCiService();
export type { HRCiEmployee, HRCiResponse };