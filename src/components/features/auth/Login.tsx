import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { loginUser, clearError } from '../../../store/authSlice';
import { getFormattedVersion } from '../../../utils/version';
import type { LoginCredentials } from '../../../types';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginProps {
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    
    // Debug: Show what we're trying to login with
    console.log('Login attempt:', { username: data.username, passwordLength: data.password.length });
    
    // Debug: Show what's in localStorage
    const stored = localStorage.getItem('qshe_mock_users');
    if (stored) {
      try {
        const users = JSON.parse(stored);
        console.log('Users in localStorage:', users.map((u: any) => ({ 
          username: u.username,
          email: u.email, 
          hasPassword: !!u.password, 
          passwordLength: u.password ? u.password.length : 0 
        })));
      } catch (e) {
        console.log('Error parsing localStorage:', e);
      }
    } else {
      console.log('No users in localStorage');
    }
    
    const credentials: LoginCredentials = {
      username: data.username,
      password: data.password,
    };
    dispatch(loginUser(credentials));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src="/logo.svg" 
            alt="QSHE Logo" 
            className="h-12 w-12"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to QSHE
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Construction Site Safety Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="Username"
              type="text"
              fullWidth
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters long',
                },
              })}
              placeholder="Enter your username"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          {/* Version Display */}
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500">{getFormattedVersion()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
