import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ProfileCompletionState, TokenData, EditUserData } from './types/profile-completion.types';
import { ImprovedProfileCompletionService } from '../../services/ImprovedProfileCompletionService';
import { StepIndicator } from './shared/StepIndicator';
import { Step1PasswordForm } from './steps/Step1PasswordForm';
import { Step2PhotoCapture } from './steps/Step2PhotoCapture';
import { Step3FaceRecognition } from './steps/Step3FaceRecognition';
import { Step4DuplicateDetection } from './steps/Step4DuplicateDetection';

interface ProfileEditWizardProps {
  mode: 'completion' | 'edit';
  userId?: string; // For edit mode
}

export const ProfileEditWizard: React.FC<ProfileEditWizardProps> = ({ mode, userId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Helper functions for localStorage persistence (simplified for edit mode)
  const getStorageKey = () => `profileEdit_${userId || token || 'default'}`;
  
  const clearStoredState = () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn('Failed to clear stored state:', error);
    }
  };

  const [state, setState] = useState<ProfileCompletionState>({
    mode,
    token: token,
    tokenValid: false,
    tokenValidating: mode === 'completion',
    userData: null,
    currentStep: 1,
    passwordData: null,
    photoData: null,
    faceData: null,
    duplicateCheck: null,
    isLoading: false,
    error: null,
  });

  // Initialize based on mode
  useEffect(() => {
    if (mode === 'completion') {
      validateToken();
    } else if (mode === 'edit' && userId) {
      loadUserForEdit(userId);
    }
  }, [mode, userId, token]);

  // Token validation for completion mode (existing logic)
  const validateToken = async () => {
    if (!token) {
      setState(prev => ({
        ...prev,
        error: 'Invalid invitation link. Please contact your administrator.',
        tokenValidating: false,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, tokenValidating: true, error: null }));

      // Decode token
      let decodedData: TokenData;
      try {
        decodedData = JSON.parse(atob(token));
        console.log('✅ Token decoded:', { id: decodedData.id, email: decodedData.email, status: decodedData.status });
      } catch (decodeError: any) {
        throw new Error(`Invalid token format: ${decodeError.message}`);
      }

      // Validate token structure and expiry
      if (!decodedData.id || decodedData.email === undefined || !decodedData.timestamp) {
        throw new Error('Invalid token format - missing required fields');
      }

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - decodedData.timestamp > sevenDaysInMs) {
        throw new Error('Invitation link has expired');
      }

      // Check database status
      console.log('🔍 Checking current user status in database...');
      
      try {
        const { supabase } = await import('../../lib/api/supabase');

        const { data: currentUser, error: dbError } = await supabase
          .from('users')
          .select('status, profile_completed_at, face_descriptors')
          .eq('id', decodedData.id)
          .single() as { data: any; error: any };

        if (dbError) {
          console.warn('⚠️ Database status check failed:', dbError.message);
          if (decodedData.status === 'invited') {
            console.log('✅ Allowing invited user to proceed despite database check failure');
            const fallbackTokenData = {
              ...decodedData,
              currentStatus: 'invited' as const,
              profileCompleted: false,
              hasFaceData: false
            };
            
            setState(prev => ({
              ...prev,
              userData: fallbackTokenData,
              tokenValid: true,
              tokenValidating: false,
            }));
            return;
          } else {
            throw new Error('Cannot validate user status - database unavailable');
          }
        }

        // Strict validation for completion mode
        if (currentUser.status === 'active') {
          console.log('❌ Rejecting active user - profile already complete');
          throw new Error('This invitation link is no longer valid. Your profile is already complete and active.');
        }

        if (currentUser.status !== 'invited') {
          console.log('❌ Rejecting user with invalid status:', currentUser.status);
          throw new Error(`Invalid user status: ${currentUser.status}. Only invited users can complete profiles.`);
        }

        const updatedTokenData = {
          ...decodedData,
          currentStatus: currentUser.status,
          profileCompleted: !!currentUser.profile_completed_at,
          hasFaceData: !!currentUser.face_descriptors
        };

        console.log('✅ Invited user validation successful:', {
          tokenStatus: decodedData.status,
          currentStatus: currentUser.status,
          profileCompleted: !!currentUser.profile_completed_at,
          hasFaceData: !!currentUser.face_descriptors
        });

        setState(prev => ({
          ...prev,
          userData: updatedTokenData,
          tokenValid: true,
          tokenValidating: false,
        }));

      } catch (networkError: any) {
        console.error('❌ Database validation error:', networkError.message);
        
        if (decodedData.status === 'invited' && networkError.message.includes('fetch')) {
          console.warn('⚠️ Network error - allowing invited user to proceed');
          const fallbackTokenData = {
            ...decodedData,
            currentStatus: 'invited' as const,
            profileCompleted: false,
            hasFaceData: false
          };
          
          setState(prev => ({
            ...prev,
            userData: fallbackTokenData,
            tokenValid: true,
            tokenValidating: false,
          }));
        } else {
          throw networkError;
        }
      }

    } catch (error: any) {
      console.error('❌ Token validation error:', error);
      setState(prev => ({
        ...prev,
        error: `Invalid or expired invitation link: ${error.message}`,
        tokenValid: false,
        tokenValidating: false,
      }));
    }
  };

  // Load user data for edit mode
  const loadUserForEdit = async (id: string) => {
    setState(prev => ({ ...prev, tokenValidating: true, error: null }));

    try {
      const { supabase } = await import('../../lib/api/supabase');

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          positions!inner(position_title),
          companies(name)
        `)
        .eq('id', id)
        .single() as { data: any; error: any };

      if (error) {
        throw new Error(`Failed to load user: ${error.message}`);
      }

      console.log('✅ User loaded for editing:', userData);

      const editUserData: EditUserData = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        userType: userData.user_type,
        role: userData.role,
        firstName: userData.first_name,
        lastName: userData.last_name,
        firstNameThai: userData.first_name_thai, // Add Thai first name
        lastNameThai: userData.last_name_thai,   // Add Thai last name
        nationality: userData.nationality,       // Add nationality
        positionId: userData.position_id?.toString(), // Convert to string
        positionTitle: userData.positions?.position_title || userData.position_title || 'Not specified',
        companyId: userData.company_id?.toString(), // Convert to string like positionId
        companyName: userData.companies?.name || userData.company_name,
        status: userData.status,
        profile_photo_url: userData.profile_photo_url,
        face_descriptors: userData.face_descriptors,
        profile_completed_at: userData.profile_completed_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      setState(prev => ({
        ...prev,
        userData: editUserData,
        tokenValid: true,
        tokenValidating: false,
      }));

    } catch (error: any) {
      console.error('❌ Error loading user for edit:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to load user: ${error.message}`,
        tokenValid: false,
        tokenValidating: false,
      }));
    }
  };

  const handleNext = async (data?: any) => {
    // Handle completion differently based on mode
    if (state.currentStep === 4) {
      console.log(`🎯 ${mode === 'edit' ? 'Updating' : 'Completing'} profile with all collected data...`);
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const updatedState = {
          ...state,
          duplicateCheck: data
        };
        
        // Use different services based on mode
        const result = mode === 'edit' 
          ? await ImprovedProfileCompletionService.updateUserProfile(updatedState)
          : await ImprovedProfileCompletionService.completeProfileFromWizardState(updatedState);
        
        if (result.success) {
          console.log(`✅ Profile ${mode === 'edit' ? 'update' : 'completion'} successful!`);
          
          // Clear stored state on successful completion
          clearStoredState();
          
          setState(prev => ({
            ...prev,
            duplicateCheck: data,
            currentStep: 5,
            isLoading: false,
            error: null
          }));
        } else {
          console.error(`❌ Profile ${mode} failed:`, result.error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.message || `Profile ${mode} failed`
          }));
        }
      } catch (error: any) {
        console.error(`❌ Error during profile ${mode}:`, error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || `Profile ${mode} failed`
        }));
      }
      return;
    }

    // Regular step progression
    setState(prev => {
      const newState = { ...prev };
      
      switch (prev.currentStep) {
        case 1:
          newState.passwordData = data;
          break;
        case 2:
          newState.photoData = data;
          break;
        case 3:
          newState.faceData = data;
          break;
        case 4:
          newState.duplicateCheck = data;
          break;
      }
      
      if (prev.currentStep < 5) {
        newState.currentStep = prev.currentStep + 1;
      }
      
      return newState;
    });
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
    }));
  };

  const handleError = (error: string) => {
    setState(prev => ({ ...prev, error }));
  };

  // Loading state
  if (state.tokenValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {mode === 'edit' ? 'Loading user data...' : 'Validating invitation link...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error || !state.tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {mode === 'edit' ? 'Cannot Load User' : 'Invalid Link'}
            </h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <button
              onClick={() => navigate(mode === 'edit' ? '/users' : '/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              {mode === 'edit' ? 'Back to Users' : 'Return to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main wizard interface
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'edit' ? 'Edit Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-600">
            {mode === 'edit' 
              ? `Update ${state.userData?.firstName}'s profile information and face recognition data.`
              : `Welcome ${state.userData?.firstName}! Please complete your profile setup with face-api.js.`
            }
          </p>
        </div>

        {/* Welcome Message */}
        {state.userData && (
          <div className="mb-6">
            <div className={`border rounded-md p-4 ${
              mode === 'edit' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${
                    mode === 'edit' ? 'text-blue-400' : 'text-green-400'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    mode === 'edit' ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    {mode === 'edit' ? 'Profile Update' : 'New Profile Setup'}
                  </h3>
                  <div className={`mt-1 text-sm ${
                    mode === 'edit' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    <p>
                      {mode === 'edit' 
                        ? 'Update profile information, photo, and face recognition data using face-api.js.'
                        : 'Let\'s set up your profile with password, photo, and face recognition using face-api.js.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={state.currentStep} />

        {/* Error Alert */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setState(prev => ({ ...prev, error: null }))}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Steps */}
        <div className="bg-white rounded-lg shadow p-6">
          {state.currentStep === 1 && (
            <Step1PasswordForm 
              state={state} 
              onNext={handleNext} 
              onError={handleError}
              mode={mode}
            />
          )}
          {state.currentStep === 2 && (
            <Step2PhotoCapture 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError}
              mode={mode}
            />
          )}
          {state.currentStep === 3 && (
            <Step3FaceRecognition 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError}
              mode={mode}
            />
          )}
          {state.currentStep === 4 && (
            <Step4DuplicateDetection 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError}
              mode={mode}
            />
          )}
          {state.currentStep === 5 && state.isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'edit' ? 'Updating Profile...' : 'Completing Profile...'}
              </h2>
              <p className="text-gray-600 mb-6">
                {mode === 'edit' ? 'Saving your updated data.' : 'Saving your data and activating your account.'}
              </p>
              <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700 space-y-1">
                  <p>📸 {mode === 'edit' ? 'Updating' : 'Uploading'} profile photo...</p>
                  <p>💾 {mode === 'edit' ? 'Updating' : 'Saving'} user information...</p>
                  {mode === 'completion' && <p>🔐 Setting up password...</p>}
                  <p>🎯 Processing face recognition data...</p>
                  <p>✅ {mode === 'edit' ? 'Updating account...' : 'Activating account...'}</p>
                </div>
              </div>
            </div>
          )}
          {state.currentStep === 5 && !state.isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'edit' ? 'Profile Updated!' : 'Profile Complete!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {mode === 'edit' 
                  ? 'User profile has been successfully updated.'
                  : 'Your account has been successfully set up.'
                }
              </p>
              <button
                onClick={() => {
                  clearStoredState(); // Clear any remaining stored state
                  navigate(mode === 'edit' ? '/users' : '/dashboard');
                }}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                {mode === 'edit' ? 'Back to Users' : 'Continue to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
