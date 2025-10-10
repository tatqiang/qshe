import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useAppDispatch } from '../../../hooks/redux';
import { loginUser, registerUser } from '../../../store/authSlice';

const MOCK_USERS = [
  {
    email: 'nithat.su@th.jec.com',
    password: 'jeCt1234',
    name: 'Nithat Su',
    role: 'System Admin',
    description: 'Complete system administration access'
  },
  {
    email: 'snithat@gmail.com',
    password: 'password123',
    name: 'Nithat Kondee',
    role: 'Member',
    description: 'Regular member access'
  },
];

export const DevLoginHelper: React.FC = () => {
  const dispatch = useAppDispatch();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleQuickLogin = async (email: string, password: string) => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('qshe_mock_users');
    console.log('Cleared localStorage - qshe_mock_users');
  };

  const showLocalStorage = () => {
    const stored = localStorage.getItem('qshe_mock_users');
    console.log('Current localStorage qshe_mock_users:', stored);
    
    // Check if users are stored under any other keys
    console.log('All localStorage keys:', Object.keys(localStorage));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('user') || key.includes('qshe'))) {
        console.log(`${key}:`, localStorage.getItem(key));
      }
    }
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Parsed users:', parsed);
      } catch (e) {
        console.log('Failed to parse:', e);
      }
    }
  };

  return (
    <Card title="🧑‍💻 Development Mode - Quick Login" className="mb-6 border-2 border-blue-200 bg-blue-50">
      <div className="space-y-4">
        <p className="text-sm text-blue-700 mb-4">
          Click any button below to quickly login with mock users (Development Mode Only)
        </p>
        
        <div className="grid gap-3">
          {MOCK_USERS.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-blue-600">{user.email}</div>
                <div className="text-sm text-gray-600">{user.role}</div>
                <div className="text-xs text-gray-500">{user.description}</div>
              </div>
              <Button
                size="sm"
                onClick={() => handleQuickLogin(user.email, user.password)}
                className="ml-4"
              >
                Quick Login
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Password for all accounts:</strong> password123<br/>
            <strong>Note:</strong> This helper only appears in development mode and will be automatically hidden in production.
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Button size="sm" onClick={showLocalStorage} variant="secondary">
              Show localStorage
            </Button>
            <Button size="sm" onClick={clearLocalStorage} variant="secondary">
              Clear localStorage
            </Button>
            <Button size="sm" onClick={() => {
              // Test static user login
              handleQuickLogin('john.doe@example.com', 'password123');
            }} variant="secondary">
              Test Static User
            </Button>
            <Button size="sm" onClick={() => {
              // Add users directly to localStorage as a workaround for rate limits
              const users = [
                {
                  id: 'nithat-su-001',
                  firstName: 'Nithat',
                  lastName: 'Su',
                  email: 'nithat.su@th.jec.com',
                  position: 'User',
                  userType: 'internal',
                  status: 'active',
                  password: 'password123', // Change this to the actual password used
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 's-nithat-001',
                  firstName: 'S',
                  lastName: 'Nithat',
                  email: 's.nithat@gmail.com',
                  position: 'User',
                  userType: 'internal',
                  status: 'active',
                  password: 'password123', // Change this to the actual password used
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              ];
              
              localStorage.setItem('qshe_mock_users', JSON.stringify(users));
              console.log('Added users to localStorage for temporary login');
            }} variant="secondary">
              Add Users to LocalStorage
            </Button>
            <Button size="sm" onClick={() => {
              // Switch back to mock auth temporarily
              console.log('Note: You need to change USE_MOCK_AUTH to true in authSlice.ts to use localStorage users');
            }} variant="secondary">
              Switch to Mock Auth
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
