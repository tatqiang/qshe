import React, { useState, useEffect } from 'react';
import { databaseService, type DatabaseUser } from '../lib/api/database';

interface DatabaseSwitcherProps {
  onUsersChange?: (users: DatabaseUser[]) => void;
}

export const DatabaseSwitcher: React.FC<DatabaseSwitcherProps> = ({ onUsersChange }) => {
  const [currentSource, setCurrentSource] = useState<'supabase' | 'azure'>('supabase');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Get initial configuration
    const dbConfig = databaseService.getConfig();
    setConfig(dbConfig);
    setCurrentSource(dbConfig.currentSource);
    
    // Load initial users
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await databaseService.getUsers();
      setUsers(fetchedUsers);
      onUsersChange?.(fetchedUsers);
      
      console.log(`📊 Loaded ${fetchedUsers.length} users from ${currentSource.toUpperCase()}`);
      setConnectionStatus(`✅ Loaded ${fetchedUsers.length} users from ${currentSource.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to load users:', error);
      setConnectionStatus(`❌ Failed to load users: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const switchDatabase = async (newSource: 'supabase' | 'azure') => {
    console.log(`🔄 Switching from ${currentSource} to ${newSource}`);
    
    setLoading(true);
    setCurrentSource(newSource);
    databaseService.switchSource(newSource);
    
    await loadUsers();
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await databaseService.testConnection();
      setConnectionStatus(
        result.success 
          ? `✅ ${result.message} (${result.source.toUpperCase()})`
          : `❌ ${result.message} (${result.source.toUpperCase()})`
      );
    } catch (error) {
      setConnectionStatus(`❌ Connection test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔄 Database Switcher
          <span className="text-sm font-normal text-gray-500">
            (Migration Testing Tool)
          </span>
        </h3>

      {/* Source Selection */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => switchDatabase('supabase')}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentSource === 'supabase'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          🟡 Supabase (Legacy)
        </button>
        
        <button
          onClick={() => switchDatabase('azure')}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentSource === 'azure'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          🔵 Azure SQL (New)
        </button>

        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md font-medium transition-colors"
        >
          🔧 Test Connection
        </button>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-medium transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="font-medium text-sm text-gray-700 mb-1">Status:</div>
        <div className={`text-sm ${connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {loading ? '⏳ Loading...' : connectionStatus || 'No status'}
        </div>
      </div>

      {/* Users Summary */}
      <div className="border-t pt-4">
        <div className="font-medium text-sm text-gray-700 mb-2">
          Data Summary ({users.length} users from {currentSource.toUpperCase()}):
        </div>
        
        {users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.slice(0, 3).map(user => (
              <div key={user.id} className="p-3 bg-gray-50 rounded border text-xs">
                <div className="font-medium">{user.full_name || user.email}</div>
                <div className="text-gray-600">{user.email}</div>
                <div className="text-gray-500">
                  {user.worker_type} | {user.authority_level}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Source: {user._source.toUpperCase()}
                </div>
              </div>
            ))}
            {users.length > 3 && (
              <div className="p-3 bg-gray-100 rounded border text-xs text-gray-500 flex items-center justify-center">
                +{users.length - 3} more users...
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No users found</div>
        )}
      </div>

      {/* Feature Flags Info */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <strong>Feature Flags:</strong> 
        Azure DB: {config?.featureFlags?.USE_AZURE_DATABASE ? '✅' : '❌'} | 
        Azure Auth: {config?.featureFlags?.USE_AZURE_AUTH ? '✅' : '❌'} | 
        Azure Storage: {config?.featureFlags?.USE_AZURE_STORAGE ? '✅' : '❌'}
      </div>
      </div>
    </div>
  );
};