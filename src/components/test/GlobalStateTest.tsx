import React from 'react';
import { useAppContext, useProjectId, useUserId } from '../../contexts/AppContext';
import { Card } from '../common/Card';

/**
 * Global State Test Component
 * 
 * This component demonstrates the global state management system working correctly.
 * It shows:
 * 1. Current user information from global context
 * 2. Current project information from global context  
 * 3. Reactive updates when state changes
 * 4. Persistence across page refreshes via localStorage
 */
const GlobalStateTest: React.FC = () => {
  const { user, project, setUser, setProject, clearAllData } = useAppContext();
  const projectId = useProjectId();
  const userId = useUserId();

  const handleSetTestProject = () => {
    const testProject = {
      id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7',
      project_code: 'DOWNTOWN_OFFICE',
      name: 'Downtown Office Complex',
      description: 'Main office building development project',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setProject(testProject);
  };

  const handleSetTestUser = () => {
    const testUser = {
      id: 'test-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      role: 'qshe_manager' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUser(testUser);
  };

  const handleClearAll = () => {
    clearAllData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🌍 Global State Management Test
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current State Display */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Current Global State
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">User Information:</h3>
              {user ? (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                </div>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-500">No user selected</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Project Information:</h3>
              {project ? (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p><strong>ID:</strong> {project.id}</p>
                  <p><strong>Code:</strong> {project.project_code}</p>
                  <p><strong>Name:</strong> {project.name}</p>
                  <p><strong>Status:</strong> {project.status}</p>
                </div>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-500">No project selected</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Hook Values:</h3>
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded">
                <p><strong>useProjectId():</strong> {projectId || 'null'}</p>
                <p><strong>useUserId():</strong> {userId || 'null'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎮 Test Actions
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={handleSetTestUser}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Set Test User
            </button>
            
            <button
              onClick={handleSetTestProject}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Set Test Project
            </button>
            
            <button
              onClick={handleClearAll}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear All Data
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-medium text-yellow-800 mb-2">💡 Test Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Click "Set Test User" to set global user state</li>
              <li>Click "Set Test Project" to set global project state</li>
              <li>Refresh the page - state should persist via localStorage</li>
              <li>Open browser dev tools to see localStorage changes</li>
              <li>Navigate to SafetyPatrolForm to see global state in action</li>
            </ol>
          </div>
        </Card>
      </div>

      {/* localStorage Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          💾 localStorage Contents
        </h2>
        <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
          <div><strong>app-user:</strong> {localStorage.getItem('app-user') || 'null'}</div>
          <div><strong>app-project:</strong> {localStorage.getItem('app-project') || 'null'}</div>
        </div>
      </Card>
    </div>
  );
};

export default GlobalStateTest;
