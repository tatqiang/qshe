import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { hrciService } from '../../lib/api/hrci';
import type { HRCiEmployee } from '../../lib/api/hrci';

export const HRCiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockEmployees, setMockEmployees] = useState<HRCiEmployee[]>([]);

  // Test 1: Analyze what we know about HRCi
  const analyzeHRCiAccess = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      console.log('🔍 Analyzing HRCi access possibilities...');
      
      const analysis = `
Current HRCi Information:
- App ID: 939ca5ce-c355-4b79-a5b0-... (partial)
- Type: Enterprise Application
- Purpose: Employee directory access

What we need to determine:
1. Complete App ID from Azure Portal
2. Available API endpoints
3. Required permissions/scopes
4. Authentication method
5. Data structure/schema

Current limitations:
❌ No complete App ID
❌ No API endpoint URLs
❌ No authentication tokens
❌ Unknown data schema

Possible investigation paths:
✅ Azure Portal investigation
✅ Microsoft Graph API exploration
✅ Mock data structure planning
✅ Hybrid approach design
      `;
      
      setTestResults([{
        name: 'HRCi Access Analysis',
        status: 'Information Needed',
        success: false,
        data: analysis
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Test Azure Portal investigation steps
  const testAzurePortalSteps = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Outlining Azure Portal investigation...');
      
      const steps = `
Azure Portal Investigation Steps:

1. Go to Azure Portal (portal.azure.com)
2. Navigate to "Enterprise Applications"
3. Search for "HRCi" or App ID "939ca5ce-c355-4b79-a5b0"
4. Click on the HRCi application
5. Check the following sections:

   📋 Overview:
   - Application ID (complete)
   - Object ID
   - Application type
   - Publisher information

   🔑 API Permissions:
   - What permissions are granted?
   - Microsoft Graph permissions?
   - Custom API permissions?

   🔐 Single Sign-On:
   - How is authentication configured?
   - What user data is accessible?

   ⚙️ Properties:
   - User assignment required?
   - Visible to users?
   - App roles defined?

Manual checks needed:
1. Complete App ID
2. Available API endpoints
3. User data access scope
4. Authentication requirements
      `;
      
      setTestResults([{
        name: 'Azure Portal Investigation Guide',
        status: 'Manual Action Required',
        success: true,
        data: steps
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Investigation guide failed');
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Test mock employee data structure
  const testMockEmployeeStructure = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Testing mock employee data structure...');
      
      const employees = await hrciService.getMockEmployees();
      setMockEmployees(employees);
      
      setTestResults([{
        name: 'Mock Employee Data Structure',
        status: `${employees.length} employees loaded`,
        success: true,
        data: `Found ${employees.length} mock employees:
${employees.map(emp => `- ${emp.firstName} ${emp.lastName} (${emp.position}) - ${emp.department}`).join('\n')}

This demonstrates the data structure we expect from HRCi:
- Employee ID (JEC001, JEC002, etc.)
- Full name (firstName + lastName)
- Department and position
- Email (@th.jec.com format)
- Location and status
- Manager hierarchy`
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mock data test failed');
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Plan integration strategy
  const planIntegrationStrategy = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Planning integration strategy...');
      
      const strategy = `
HRCi Integration Strategy Options:

OPTION 1: Direct HRCi API Integration
✅ Pros: Real-time data, accurate employee info
❌ Cons: Need complete App ID, API documentation, authentication setup
📋 Requirements: App ID, API endpoints, authentication tokens

OPTION 2: Microsoft Graph API via HRCi
✅ Pros: Uses existing Azure AD auth, standardized API
❌ Cons: May not expose all HRCi employee data
📋 Requirements: Graph API permissions, HRCi service principal access

OPTION 3: Enhanced Mock Data (Immediate)
✅ Pros: Works now, realistic testing, full control
❌ Cons: Not real data, manual maintenance
📋 Requirements: None - ready to use

OPTION 4: Hybrid Approach
✅ Pros: Azure AD auth + HRCi data when available
❌ Cons: Complex fallback logic
📋 Requirements: Both real API and mock data systems

RECOMMENDATION:
Start with Option 3 (enhanced mock data) while investigating Option 1 or 2.
This allows immediate user assignment functionality while working on real data access.

Current Status:
- Mock data: ✅ Ready (5 employees, expandable to 823)
- User assignment: ✅ Working
- Real HRCi access: ❓ Under investigation
      `;
      
      setTestResults([{
        name: 'Integration Strategy Planning',
        status: 'Strategy Outlined',
        success: true,
        data: strategy
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strategy planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              HRCi Integration Investigation
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Investigate HRCi Enterprise Application access and plan integration strategy for 823 Jardine Engineering employees
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
              <strong>Current Status:</strong> Partial App ID available (939ca5ce-c355-4b79-a5b0-...) <br/>
              <strong>Need:</strong> Complete App ID, API endpoints, authentication method<br/>
              <strong>Goal:</strong> Replace mock data with real employee directory
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={analyzeHRCiAccess}
              loading={loading}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Analyze HRCi Access
            </Button>

            <Button
              onClick={testAzurePortalSteps}
              loading={loading}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Azure Portal Guide
            </Button>

            <Button
              onClick={testMockEmployeeStructure}
              loading={loading}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Test Mock Data Structure
            </Button>

            <Button
              onClick={planIntegrationStrategy}
              loading={loading}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Plan Integration Strategy
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Test Results:</h3>
              
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-md p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <span className={`text-sm px-2 py-1 rounded ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <pre className="whitespace-pre-wrap overflow-x-auto max-h-64">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-md font-medium text-yellow-900 mb-2">Next Steps for HRCi Integration:</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <div>1. <strong>Check Azure Portal:</strong> Verify HRCi app permissions and endpoints</div>
              <div>2. <strong>API Discovery:</strong> Find HRCi employee API endpoints</div>
              <div>3. <strong>Authentication:</strong> Setup proper Azure AD authentication for HRCi</div>
              <div>4. <strong>Data Mapping:</strong> Map HRCi employee fields to our user structure</div>
              <div>5. <strong>Integration:</strong> Replace mock data with real HRCi employee data</div>
            </div>
          </div>

          {mockEmployees.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Mock Employee Data Preview:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {mockEmployees.map(emp => (
                  <div key={emp.employeeId} className="border border-gray-300 rounded p-2 bg-white">
                    <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                    <div className="text-gray-600">{emp.position}</div>
                    <div className="text-gray-500 text-xs">{emp.department} • {emp.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};