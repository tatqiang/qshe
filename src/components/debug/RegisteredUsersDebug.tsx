import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';

export const RegisteredUsersDebug: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadUsers = () => {
      try {
        const registeredUsers = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
        setUsers(registeredUsers);
      } catch (error) {
        console.error('Error loading registered users:', error);
        setUsers([]);
      }
    };

    loadUsers();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClear = () => {
    localStorage.removeItem('azure_registered_users');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Auto-Registered Users Debug</h3>
        <div className="space-x-2">
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
          <button 
            onClick={handleClear}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          <p>No users have been auto-registered yet.</p>
          <p className="text-sm mt-2">Users will appear here after successful Azure AD login.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Total registered users: <span className="font-semibold">{users.length}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Department</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id || index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">{user.email}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{user.display_name}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'system_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-orange-100 text-orange-800' :
                        user.role === 'member' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{user.department || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a demo implementation using localStorage. 
          In production, users would be saved to the Azure SQL Database via an API.
        </p>
      </div>
    </Card>
  );
};