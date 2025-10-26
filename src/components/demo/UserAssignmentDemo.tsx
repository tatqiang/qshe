import React, { useState } from 'react';
import { UserSelect } from '../common/UserSelect';
import type { User } from '../common/UserSelect';
import { useCompanyUsers } from '../../hooks/useCompanyUsers';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export const UserAssignmentDemo: React.FC = () => {
  const { users, loading, error } = useCompanyUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const handleUserSelect = (userId: string, user?: User) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
    console.log('Selected user:', user);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            User Assignment Demo
          </h2>
          <p className="text-sm text-gray-600">
            This demonstrates how to assign company staff to patrol issues and corrective actions.
          </p>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <UserSelect
              label="Assign To"
              placeholder="Select a company staff member..."
              value={selectedUserId}
              onChange={handleUserSelect}
              users={users}
              required
              disabled={loading}
            />

            {loading && (
              <div className="text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading company users...
              </div>
            )}

            {!loading && (
              <div className="text-sm text-gray-600">
                📊 {users.length} company staff available for assignment
                {users.length > 0 && (
                  <span className="ml-2">
                    ({users.filter(u => u._source === 'azure_ad').length} from Azure AD, 
                     {users.filter(u => u._source === 'mock').length} mock)
                  </span>
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Assignment:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Name:</strong> {selectedUser.full_name}</div>
                <div><strong>Position:</strong> {selectedUser.position_title}</div>
                <div><strong>Department:</strong> {selectedUser.department}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Employee ID:</strong> {selectedUser.employee_id}</div>
                <div><strong>Source:</strong> {selectedUser._source === 'azure_ad' ? 'Azure AD' : 'Mock Data'}</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="text-md font-medium text-gray-900 mb-3">Integration Points:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• 🏗️ <strong>Patrol Issue Assignment:</strong> Assign safety issues to specific staff</div>
              <div>• ⚡ <strong>Corrective Action Assignment:</strong> Assign follow-up actions to responsible persons</div>
              <div>• 📋 <strong>Task Management:</strong> Track who's responsible for what</div>
              <div>• 📧 <strong>Notification System:</strong> Send notifications to assigned users</div>
              <div>• 📊 <strong>Reporting:</strong> Generate reports by assigned person</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};