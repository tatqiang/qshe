import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ProfileCompletionState, TokenData, EditUserData } from './types/profile-completion.types';
import { ImprovedProfileCompletionService } from '../../services/ImprovedProfileCompletionService';
import { StepIndicator } from './shared/StepIndicator';
import { Step1PasswordForm } from './steps/Step1PasswordForm';
import { Step2PhotoCapture } from './steps/Step2PhotoCapture';
import { Step3FaceRecognition } from './steps/Step3FaceRecognition';
import { Step4DuplicateDetection } from './steps/Step4DuplicateDetection';

// Development debug utility
if (process.env.NODE_ENV === 'development') {
  import('../../utils/wizardStateDebug').then(({ debugWizardState }) => {
    (window as any).debugWizardState = debugWizardState;
  });
}

// Helper functions for registrant flow
const isRegistrantUser = (userData: TokenData | EditUserData | null): boolean => {
  return userData?.role === 'registrant';
};

const getInitialStep = (userData: TokenData | EditUserData | null): number => {
  // Registrants skip password step (Step 1), start at photo capture (Step 2)
  return isRegistrantUser(userData) ? 2 : 1;
};

const getTotalSteps = (userData: TokenData | EditUserData | null): number => {
  // Registrants have 3 steps (photo, face, duplicates), others have 4 (password, photo, face, duplicates)
  return isRegistrantUser(userData) ? 3 : 4;
};

const getStepTitle = (step: number, userData: TokenData | EditUserData | null): string => {
  const isRegistrant = isRegistrantUser(userData);
  
  if (isRegistrant) {
    // Registrant steps: 2=photo, 3=face, 4=duplicates
    switch (step) {
      case 2: return 'Photo Capture';
      case 3: return 'Face Recognition';
      case 4: return 'Duplicate Check';
      default: return '';
    }
  } else {
    // Normal steps: 1=password, 2=photo, 3=face, 4=duplicates
    switch (step) {
      case 1: return 'Password Setup';
      case 2: return 'Photo Capture';
      case 3: return 'Face Recognition';
      case 4: return 'Duplicate Check';
      default: return '';
    }
  }
};

export const ProfileCompletionWizard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  let token = searchParams.get('token');

  // Fallback: Try to restore token from localStorage if missing from URL
  if (!token) {
    console.log('🔍 No token in URL, checking localStorage for existing sessions...');
    try {
      // Look for any existing profile completion sessions
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('profileCompletion_') && !key.endsWith('_default')
      );
      
      if (storageKeys.length > 0) {
        // Use the most recent session
        const mostRecentKey = storageKeys.reduce((latest, current) => {
          const latestData = JSON.parse(localStorage.getItem(latest) || '{}');
          const currentData = JSON.parse(localStorage.getItem(current) || '{}');
          return (currentData.lastSaved || 0) > (latestData.lastSaved || 0) ? current : latest;
        });
        
        const restoredData = JSON.parse(localStorage.getItem(mostRecentKey) || '{}');
        if (restoredData.token) {
          token = restoredData.token;
          console.log('✅ Restored token from localStorage:', { 
            storageKey: mostRecentKey,
            hasToken: !!token 
          });
          
          // Update URL to include the token parameter for consistency
          const newUrl = `/complete-profile?token=${encodeURIComponent(token)}`;
          navigate(newUrl, { replace: true });
        }
      }
    } catch (error) {
      console.warn('Failed to restore token from localStorage:', error);
    }
  }

  // Helper functions for localStorage persistence
  const getStorageKey = () => `profileCompletion_${token || 'default'}`;
  
  const saveStateToStorage = (stateToSave: ProfileCompletionState) => {
    try {
      // Don't save File objects to localStorage (they can't be serialized)
      const sanitizedState = {
        ...stateToSave,
        photoData: stateToSave.photoData ? {
          ...stateToSave.photoData,
          file: null, // Don't persist File object
        } : null,
        faceData: stateToSave.faceData ? {
          ...stateToSave.faceData,
          descriptor: null, // Don't persist Float32Array
        } : null,
      };
      
      console.log('💾 Saving wizard state to localStorage:', {
        storageKey: getStorageKey(),
        currentStep: sanitizedState.currentStep,
        hasPasswordData: !!sanitizedState.passwordData,
        passwordDataKeys: sanitizedState.passwordData ? Object.keys(sanitizedState.passwordData) : [],
        hasPhotoData: !!sanitizedState.photoData,
        hasFaceData: !!sanitizedState.faceData,
        dataSize: JSON.stringify(sanitizedState).length
      });
      
      localStorage.setItem(getStorageKey(), JSON.stringify(sanitizedState));
      
      // Verify save was successful
      const verification = localStorage.getItem(getStorageKey());
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log('✅ Storage verification successful:', {
          hasPasswordData: !!parsed.passwordData,
          currentStep: parsed.currentStep
        });
      }
    } catch (error) {
      console.warn('Failed to save wizard state to localStorage:', error);
    }
  };

  const loadStateFromStorage = (): Partial<ProfileCompletionState> | null => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      console.log('🔍 Loading state from localStorage:', {
        storageKey: getStorageKey(),
        hasData: !!saved,
        dataSize: saved ? saved.length : 0
      });
      
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Only restore if the token matches and it's not too old (24 hours)
        if (parsedState.token === token && parsedState.userData) {
          const now = Date.now();
          const stateAge = now - (parsedState.lastSaved || 0);
          if (stateAge < 24 * 60 * 60 * 1000) { // 24 hours
            console.log('✅ Restored wizard state from localStorage:', {
              currentStep: parsedState.currentStep,
              hasPasswordData: !!parsedState.passwordData,
              passwordDataKeys: parsedState.passwordData ? Object.keys(parsedState.passwordData) : [],
              hasPhotoData: !!parsedState.photoData,
              tokenMatches: parsedState.token === token,
              ageHours: Math.round(stateAge / (60 * 60 * 1000) * 10) / 10
            });
            return parsedState;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load wizard state from localStorage:', error);
    }
    return null;
  };

  const clearStoredState = () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn('Failed to clear stored state:', error);
    }
  };

  // Initialize state with localStorage restoration
  const initializeState = (): ProfileCompletionState => {
    const savedState = loadStateFromStorage();
    
    const defaultState: ProfileCompletionState = {
      mode: 'completion',
      token: token,
      tokenValid: false,
      tokenValidating: true,
      userData: null,
      currentStep: 1,
      passwordData: null,
      photoData: null,
      faceData: null,
      duplicateCheck: null,
      isLoading: false,
      error: null,
    };

    if (savedState) {
      console.log('🔄 Restoring wizard state from localStorage:', {
        restoredStep: savedState.currentStep,
        hasPasswordData: !!savedState.passwordData,
        hasPhotoData: !!savedState.photoData,
        hasFaceData: !!savedState.faceData,
        token: savedState.token
      });
      
      return {
        ...defaultState,
        ...savedState,
        tokenValidating: true, // Always revalidate token on page load
        isLoading: false,
        error: null,
      };
    }

    console.log('🆕 Starting fresh wizard state');
    return defaultState;
  };

  const [state, setState] = useState<ProfileCompletionState>(initializeState);

  // Detect page refresh and ensure state continuity
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current state before page unloads
      if (state.tokenValid && state.userData) {
        console.log('📝 Saving state before page unload');
        saveStateToStorage(state);
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Detect back/forward navigation or page refresh
      if (event.persisted || (window.performance && window.performance.navigation.type === 1)) {
        console.log('🔄 Page refresh detected, checking for stored state...');
        
        // Give a small delay to ensure localStorage is accessible
        setTimeout(() => {
          const restored = loadStateFromStorage();
          if (restored && token) {
            console.log('🔄 Restoring state after page refresh');
            setState(prev => ({
              ...prev,
              ...restored,
              tokenValidating: true, // Re-validate token after refresh
            }));
          }
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [state.tokenValid, state.userData, token]);

  // Save state to localStorage whenever it changes (except for loading states)
  useEffect(() => {
    if (state.tokenValid && state.userData) {
      const stateToSave = {
        ...state,
        lastSaved: Date.now(),
        tokenValidating: false, // Don't save loading states
        isLoading: false,
        error: null,
      };
      saveStateToStorage(stateToSave);
    }
  }, [state.currentStep, state.passwordData, state.photoData, state.faceData, state.duplicateCheck]);

  // Clear stored state when profile is completed
  const handleProfileCompletion = () => {
    clearStoredState();
    // Navigate to success page or dashboard
  };

  // Token validation on component mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      console.log('❌ No token available for validation');
      
      // Check if we have any stored sessions that could be restored
      const storedSessions = Object.keys(localStorage).filter(key => 
        key.startsWith('profileCompletion_') && !key.endsWith('_default')
      );
      
      let errorMessage = 'No invitation link found.';
      if (storedSessions.length > 0) {
        errorMessage += ' We found previous session data, but the invitation link is missing. Please use your original invitation link or contact your administrator.';
        console.log('🔍 Found stored sessions but no token:', storedSessions);
      } else {
        errorMessage += ' Please use your invitation link or contact your administrator.';
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        tokenValidating: false,
      }));
      return;
    }

    try {
      // Store current step before validation (for localStorage restoration)
      const currentStepBeforeValidation = state.currentStep;
      const hasRestoredState = state.passwordData || state.photoData || state.faceData;
      
      console.log('🔍 Token validation starting:', {
        currentStep: currentStepBeforeValidation,
        hasRestoredState,
        hasPasswordData: !!state.passwordData,
        hasPhotoData: !!state.photoData,
        hasFaceData: !!state.faceData
      });
      
      setState(prev => ({ ...prev, tokenValidating: true, error: null }));

      // Handle test tokens for development
      if (token === 'test-token' || token === 'your-token') {
        console.log('🧪 Using test token');
        const testData: TokenData = {
          id: 'test-user-123',
          email: 'adder.baiden@example.com',
          username: 'adder_baiden',
          userType: 'internal',
          role: 'employee',
          firstName: 'Adder',
          lastName: 'Baiden',
          positionTitle: 'Safety Inspector',
          companyId: '1',
          status: 'pending',
          timestamp: Date.now(),
        };
        
        console.log('🧪 Test token data:', {
          userType: testData.userType,
          isRegistrant: isRegistrantUser(testData),
          initialStep: getInitialStep(testData),
          restoredStep: currentStepBeforeValidation,
          hasRestoredState
        });
        
        setState(prev => ({
          ...prev,
          userData: testData,
          tokenValid: true,
          tokenValidating: false,
          // Preserve restored step if we have restored state, otherwise use initial step
          currentStep: hasRestoredState ? currentStepBeforeValidation : getInitialStep(testData),
        }));
        return;
      }

      // Decode real token (base64 encoded JSON)
      let decodedData: TokenData;
      try {
        decodedData = JSON.parse(atob(token));
        console.log('✅ Token decoded:', { id: decodedData.id, email: decodedData.email, status: decodedData.status });
      } catch (decodeError: any) {
        throw new Error(`Invalid token format: ${decodeError.message}`);
      }

      // Validate token structure
      if (!decodedData.id || decodedData.email === undefined || !decodedData.timestamp) {
        throw new Error('Invalid token format - missing required fields');
      }

      // Check token expiry (7 days)
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - decodedData.timestamp > sevenDaysInMs) {
        throw new Error('Invitation link has expired');
      }

      // Check current user status in database (strict validation for active users)
      console.log('🔍 Checking current user status in database...');
      
      try {
        // Use existing Supabase client to avoid multiple instances
        const { supabase } = await import('../../lib/api/supabase');

        const { data: currentUser, error: dbError } = await (supabase
          .from('users') as any)
          .select(`
            status, 
            profile_completed_at, 
            face_descriptors,
            first_name_thai,
            last_name_thai,
            nationality,
            position_id,
            company_id,
            positions!inner(position_title),
            companies(name)
          `)
          .eq('id', decodedData.id)
          .single();

        if (dbError) {
          console.warn('⚠️ Database status check failed:', dbError.message);
          // For network issues, allow invited users to proceed (graceful fallback)
          if (decodedData.status === 'invited') {
            console.log('✅ Allowing invited user to proceed despite database check failure');
            const fallbackTokenData = {
              ...decodedData,
              // Use token data as fallback when database is unavailable
              firstNameThai: decodedData.firstNameThai || '',
              lastNameThai: decodedData.lastNameThai || '',
              nationality: decodedData.nationality || '',
              positionId: decodedData.positionId || '',
              companyId: decodedData.companyId || '',
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

        // STRICT VALIDATION: Reject active users
        if (currentUser && currentUser.status === 'active') {
          console.log('❌ Rejecting active user - profile already complete');
          throw new Error('This invitation link is no longer valid. Your profile is already complete and active.');
        }

        // STRICT VALIDATION: Only allow invited users
        if (currentUser && currentUser.status !== 'invited') {
          console.log('❌ Rejecting user with invalid status:', currentUser.status);
          throw new Error(`Invalid user status: ${currentUser.status}. Only invited users can complete profiles.`);
        }

        // User is invited - allow profile completion
        const updatedTokenData = {
          ...decodedData,
          // Ensure username is available with fallback
          username: decodedData.username || 
                   (decodedData.email ? decodedData.email.split('@')[0] : null) ||
                   (currentUser as any).username ||
                   ((currentUser as any).email ? (currentUser as any).email.split('@')[0] : 'user'),
          // Update with current database values
          firstNameThai: (currentUser as any).first_name_thai || decodedData.firstNameThai,
          lastNameThai: (currentUser as any).last_name_thai || decodedData.lastNameThai,
          nationality: (currentUser as any).nationality || decodedData.nationality,
          positionId: (currentUser as any).position_id?.toString() || decodedData.positionId,
          positionTitle: (currentUser as any).positions?.position_title || decodedData.positionTitle,
          companyId: (currentUser as any).company_id || decodedData.companyId,
          companyName: (currentUser as any).companies?.name || decodedData.companyName,
          // Status tracking
          currentStatus: (currentUser as any).status,
          profileCompleted: !!(currentUser as any).profile_completed_at,
          hasFaceData: !!(currentUser as any).face_descriptors
        };

        console.log('✅ Invited user validation successful:', {
          tokenStatus: decodedData.status,
          currentStatus: (currentUser as any).status,
          profileCompleted: !!(currentUser as any).profile_completed_at,
          hasFaceData: !!(currentUser as any).face_descriptors,
          userType: updatedTokenData.userType,
          isRegistrant: isRegistrantUser(updatedTokenData),
          initialStep: getInitialStep(updatedTokenData),
          restoredStep: currentStepBeforeValidation,
          hasRestoredState
        });

        setState(prev => ({
          ...prev,
          userData: updatedTokenData,
          tokenValid: true,
          tokenValidating: false,
          // Preserve restored step if we have restored state, otherwise use initial step
          currentStep: hasRestoredState ? currentStepBeforeValidation : getInitialStep(updatedTokenData),
        }));

      } catch (networkError: any) {
        console.error('❌ Database validation error:', networkError.message);
        
        // Only allow graceful fallback for invited users during network issues
        if (decodedData.status === 'invited' && networkError.message.includes('fetch')) {
          console.warn('⚠️ Network error - allowing invited user to proceed');
          const fallbackTokenData = {
            ...decodedData,
            currentStatus: 'invited' as const,
            profileCompleted: false,
            hasFaceData: false
          };
          
          console.log('⚠️ Using fallback data:', {
            userType: fallbackTokenData.userType,
            isRegistrant: isRegistrantUser(fallbackTokenData),
            initialStep: getInitialStep(fallbackTokenData),
            restoredStep: currentStepBeforeValidation,
            hasRestoredState
          });
          
          setState(prev => ({
            ...prev,
            userData: fallbackTokenData,
            tokenValid: true,
            tokenValidating: false,
            // Preserve restored step if we have restored state, otherwise use initial step
            currentStep: hasRestoredState ? currentStepBeforeValidation : getInitialStep(fallbackTokenData),
          }));
        } else {
          // Reject for any other errors (including active user rejection)
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

  const handleNext = async (data?: any) => {
    // If we're completing step 4 (duplicate detection), perform the actual profile completion
    if (state.currentStep === 4) {
      console.log('🎯 Completing profile with all collected data...');
      
      // Set loading state
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Save the step 4 data first
        const updatedState = {
          ...state,
          duplicateCheck: data
        };
        
        // Complete the profile using our improved service
        const result = await ImprovedProfileCompletionService.completeProfileFromWizardState(updatedState);
        
        if (result.success) {
          console.log('✅ Profile completion successful!');
          
          // Clear stored state on successful completion
          clearStoredState();
          
          // Update state with success and move to final step
          setState(prev => ({
            ...prev,
            duplicateCheck: data,
            currentStep: 5,
            isLoading: false,
            error: null
          }));
        } else {
          console.error('❌ Profile completion failed:', result.error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.message || 'Profile completion failed'
          }));
        }
      } catch (error: any) {
        console.error('❌ Profile completion error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Profile completion failed: ${error.message}`
        }));
      }
      
      return; // Don't continue with normal flow
    }
    
    // Normal flow for other steps
    setState(prev => {
      const newState = { ...prev };
      
      // Save data based on current step
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
      
      // Determine next step
      let nextStep = prev.currentStep + 1;
      
      // Skip Step 4 (duplicate detection) if face recognition was skipped
      if (prev.currentStep === 3 && data?.faceRecognitionSkipped) {
        console.log('🔄 Face recognition was skipped, jumping to Step 5 (completion)');
        nextStep = 5; // Skip duplicate detection and go directly to completion
      }
      
      // Move to next step (max 5 steps)
      if (prev.currentStep < 5 && nextStep <= 5) {
        newState.currentStep = nextStep;
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

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Loading state during token validation
  if (state.tokenValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation link...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('🔍 ProfileCompletionWizard render:', {
    currentStep: state.currentStep,
    userData: state.userData ? {
      userType: state.userData.userType,
      firstName: state.userData.firstName,
      isRegistrant: isRegistrantUser(state.userData)
    } : null,
    tokenValid: state.tokenValid,
    tokenValidating: state.tokenValidating
  });

  // Main wizard interface
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">
            Welcome {state.userData?.firstName}! Please complete your profile setup with face-api.js.
          </p>
        </div>

        {/* Welcome Message for Invited Users Only */}
        {state.userData && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">New Profile Setup</h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>Let's set up your profile with password, photo, and face recognition using face-api.js.</p>
                    {(state.userData as any).hasFaceData && (
                      <p className="mt-1">🔄 <strong>Note:</strong> Existing face data will be updated with new face-api.js technology.</p>
                    )}
                    {!(state.userData as any).currentStatus && (
                      <p className="mt-1 text-xs">ℹ️ Database status check unavailable - proceeding with token validation.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator 
          currentStep={state.currentStep} 
          userRole={state.userData?.role}
        />

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
                <button 
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {state.currentStep === 1 && !state.userData && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading user data...</p>
            </div>
          )}
          
          {/* Step 1: Password Form - Skip for registrants */}
          {state.currentStep === 1 && state.userData && !isRegistrantUser(state.userData) && (
            <Step1PasswordForm 
              state={state} 
              onNext={handleNext} 
              onError={handleError} 
              mode="completion"
            />
          )}
          
          {/* Step 2: Photo Capture - First step for workers, second for others */}
          {state.currentStep === 2 && (
            <Step2PhotoCapture 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError} 
              mode="completion"
            />
          )}
          
          {/* Step 3: Face Recognition */}
          {state.currentStep === 3 && (
            <Step3FaceRecognition 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError} 
              mode="completion"
            />
          )}
          
          {/* Step 4: Duplicate Detection */}
          {state.currentStep === 4 && (
            <Step4DuplicateDetection 
              state={state} 
              onNext={handleNext} 
              onBack={handleBack}
              onError={handleError} 
              mode="completion"
            />
          )}
          {state.currentStep === 5 && state.isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Profile...</h2>
              <p className="text-gray-600 mb-6">Saving your data and activating your account.</p>
              <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700 space-y-1">
                  <p>📸 Uploading profile photo...</p>
                  <p>💾 Updating user information...</p>
                  <p>🔐 Setting up password...</p>
                  <p>🎯 Processing face recognition data...</p>
                  <p>✅ Activating account...</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
              <p className="text-gray-600 mb-6">Your account has been successfully set up.</p>
              <button
                onClick={() => {
                  clearStoredState(); // Clear any remaining stored state
                  navigate('/dashboard');
                }}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
