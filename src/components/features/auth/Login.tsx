import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { azureAuthService } from '../../../lib/auth/azureAuthService';
import { setAzureUser } from '../../../store/authSlice';
import { supabase } from '../../../lib/api/supabase';
import { sessionManager } from '../../../lib/auth/sessionManager';
import { getFormattedVersion } from '../../../utils/version';

interface LoginProps {
  onNavigateToRegister?: () => void;
}

export const Login: React.FC<LoginProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [azureUserData, setAzureUserData] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasCheckedSession = useRef(false); // Prevent multiple session checks

  // Handle redirect after Microsoft login
  useEffect(() => {
    console.log('🔍 [DEBUG] Login useEffect triggered - hasCheckedSession:', hasCheckedSession.current);
    console.log('🔍 [DEBUG] Current URL:', window.location.href);
    
    // Prevent multiple executions
    if (hasCheckedSession.current) {
      console.log('⏸️ Session already checked, skipping...');
      return;
    }
    
    hasCheckedSession.current = true;
    console.log('🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...');
    console.log('🔍 [DEBUG] Has auth params:', window.location.search.includes('code=') || window.location.hash.includes('access_token'));
    
    const handleLoginComplete = async () => {
      console.log('🔍 [DEBUG] ===== handleLoginComplete STARTED =====');
      console.log('🔍 [DEBUG] Current pathname:', window.location.pathname);
      
      // CRITICAL: If we're already on dashboard, don't process login again
      if (window.location.pathname.includes('/dashboard')) {
        console.log('⚠️ Already on dashboard, skipping handleLoginComplete to prevent loop');
        return;
      }
      
      try {
        console.log('🎉 Login redirect completed, processing user...');
        setIsLoading(true);

        // Get Azure user profile
        const azureUser = await azureAuthService.getCurrentAzureUser();
        if (!azureUser) {
          throw new Error('Failed to get Azure user profile');
        }
        console.log('✅ Current Azure user retrieved:', azureUser.email);

        // Check if user exists in Supabase
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('email', azureUser.email)
          .maybeSingle() as { data: any, error: any };

        if (checkError) {
          console.error('❌ Error checking user existence:', checkError);
          throw checkError;
        }

        if (existingUser) {
          // Existing user - auto login
          console.log('✅ User already exists, logging in...');
          console.log('🔍 [DEBUG] Existing user:', { id: existingUser.id, email: existingUser.email, role: existingUser.role });
          
          dispatch(setAzureUser({
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            userDetails: {
              id: existingUser.id,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name,
              email: existingUser.email,
              role: existingUser.role,
              userType: existingUser.user_type,
              status: existingUser.status,
              createdAt: existingUser.created_at,
              updatedAt: existingUser.updated_at
            }
          }));

          // Save session
          sessionManager.saveSession({
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            userDetails: {
              id: existingUser.id,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name,
              email: existingUser.email,
              role: existingUser.role,
              userType: existingUser.user_type,
              status: existingUser.status,
              createdAt: existingUser.created_at,
              updatedAt: existingUser.updated_at
            }
          });

          console.log('🔍 [DEBUG] About to handle redirect - Current URL:', window.location.href);
          
          // Check if there's a saved redirect path (from before login redirect)
          const savedRedirectPath = sessionStorage.getItem('redirect_after_login');
          
          // CRITICAL: If we're already on the target page (page refresh scenario), don't redirect!
          // This happens when user refreshes a protected page - they're already there
          const currentPath = window.location.pathname + window.location.search + window.location.hash;
          
          if (savedRedirectPath && currentPath === savedRedirectPath) {
            console.log('✅ Already on target page after refresh, staying here:', currentPath);
            // Don't redirect, just stay on current page - AuthWrapper will handle cleanup
            setIsLoading(false);
            return;
          }
          
          // Otherwise, redirect to saved path or dashboard
          const redirectPath = savedRedirectPath || '/dashboard';
          console.log('🔍 [DEBUG] Redirect happening in 100ms to:', redirectPath);
          
          // Add small delay to ensure state is saved before redirect
          setTimeout(() => {
            console.log('🚀 REDIRECTING TO:', redirectPath);
            window.location.href = redirectPath;
          }, 100);
          
          return; // Exit early to prevent further execution
        } else {
          // New user - show registration modal
          console.log('🆕 New user detected, showing registration modal...');
          setAzureUserData(azureUser);
          setShowRegistrationModal(true);
          setIsLoading(false); // Stop loading when showing modal
        }
      } catch (error) {
        console.error('❌ Login complete error:', error);
        setError(error instanceof Error ? error.message : 'Login failed');
        setIsLoading(false);
      }
    };

    // Always set up the callback first (MSAL may call it immediately)
    azureAuthService.setLoginCompleteCallback(handleLoginComplete);
    
    // Then check if user is already logged in (for page reloads)
    // Use a small delay to let MSAL process any pending redirects first
    setTimeout(() => {
      console.log('🔍 [DEBUG] Delayed check - isLoggedIn:', azureAuthService.isLoggedIn());
      
      if (azureAuthService.isLoggedIn()) {
        // Check if we already handled a redirect (callback would have been called)
        // If not, this is a page reload with existing session
        console.log('✅ Checking existing Azure AD session...');
        const hasAuthParams = window.location.search.includes('code=') || 
                             window.location.hash.includes('access_token');
        
        console.log('🔍 [DEBUG] Has auth params:', hasAuthParams);
        
        if (!hasAuthParams) {
          // No auth params means this is just a page reload, not a redirect
          console.log('✅ Found existing session, auto-logging in...');
          console.log('🔍 [DEBUG] Calling handleLoginComplete from setTimeout...');
          handleLoginComplete();
        } else {
          console.log('🔍 [DEBUG] Auth params present, MSAL callback should handle this');
        }
      } else {
        console.log('🔍 [DEBUG] No existing session found');
      }
    }, 100);
  }, []); // Empty deps - only run once on mount

  const handleCompanyLogin = async () => {
    // Prevent multiple clicks
    if (isLoading) {
      console.log('⏸️ Login already in progress, ignoring click');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting Jardine Engineering company login...');
      await azureAuthService.loginWithMicrosoft();
      
      // If we reach here, something went wrong (redirect should have happened)
      console.log('⚠️ Login redirect may have failed - page should have redirected');
      setIsLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Company login error:', error);
      
      // Check if it's the "interaction_in_progress" error
      if (errorMsg.includes('interaction_in_progress')) {
        console.log('🔄 MSAL is already processing authentication, please wait...');
        setError('Authentication is already in progress. Please wait...');
      } else {
        setError(errorMsg);
        setIsLoading(false);
      }
    }
  };

  const handleRegistrationConfirm = async () => {
    if (!azureUserData) return;

    try {
      setIsLoading(true);
      console.log('🔄 Confirming user registration...');

      // Register user in Supabase
      const result = await (supabase as any)
        .from('users')
        .insert({
          email: azureUserData.email,
          first_name: azureUserData.firstName || '',
          last_name: azureUserData.lastName || '',
          azure_user_id: azureUserData.id,
          role: 'member',
          user_type: 'internal',
          status: 'active',
          job_title: azureUserData.jobTitle || null,
          department: azureUserData.department || null,
          registration_completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      const { data: newUser, error: insertError } = result;

      if (insertError) throw insertError;
      if (!newUser) throw new Error('User registration failed - no user data returned');
      
      console.log('✅ User registered successfully:', newUser);

      // Set user in Redux with full userDetails
      dispatch(setAzureUser({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role || 'member',
        userDetails: {
          id: newUser.id,
          firstName: newUser.first_name || '',
          lastName: newUser.last_name || '',
          email: newUser.email,
          role: newUser.role || 'member',
          userType: newUser.user_type,
          status: newUser.status,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at
        }
      }));

      // Save session
      sessionManager.saveSession({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role || 'member',
        userDetails: {
          id: newUser.id,
          firstName: newUser.first_name || '',
          lastName: newUser.last_name || '',
          email: newUser.email,
          role: newUser.role || 'member',
          userType: newUser.user_type,
          status: newUser.status,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at
        }
      });

      console.log('🔍 [DEBUG] New user registered, redirecting...');
      
      // Check if there's a saved redirect path (from before login redirect)
      const redirectPath = sessionStorage.getItem('redirect_after_login') || '/dashboard';
      // DON'T clear here - will be cleared in AuthWrapper after successful auth
      
      // Redirect to saved path or dashboard (direct path to avoid intermediate redirect)
      setTimeout(() => {
        console.log('🚀 REDIRECTING TO:', redirectPath, 'after registration');
        window.location.href = redirectPath;
      }, 100);
    } catch (error) {
      console.error('❌ Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      setIsLoading(false);
    }
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
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Sign in with your Jardine Engineering company account
              </p>
              
              <Button
                onClick={handleCompanyLogin}
                fullWidth
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                    Sign in with Company Account
                  </span>
                )}
              </Button>

              <div className="text-xs text-gray-500">
                Use your @th.jec.com email and company password
              </div>
            </div>
          </div>
          
          {/* Version Display */}
          <div className="mt-6 text-center">
            <span className="text-xs text-gray-500">{getFormattedVersion()}</span>
          </div>
        </Card>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && azureUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card padding="lg" className="max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Welcome to QSHE!
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We found your company account:
              </p>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name: </span>
                  <span className="text-sm text-gray-900">
                    {azureUserData.firstName} {azureUserData.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email: </span>
                  <span className="text-sm text-gray-900">{azureUserData.email}</span>
                </div>
                {azureUserData.jobTitle && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Job Title: </span>
                    <span className="text-sm text-gray-900">{azureUserData.jobTitle}</span>
                  </div>
                )}
                {azureUserData.department && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Department: </span>
                    <span className="text-sm text-gray-900">{azureUserData.department}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Click confirm to complete your registration and access the system.
              </p>
              <Button
                onClick={handleRegistrationConfirm}
                fullWidth
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Registering...' : 'Confirm Registration'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
