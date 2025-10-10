import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { StepProps } from '../types/profile-completion.types';
import type { Position } from '../../../types';
import { supabase } from '../../../lib/api/supabase';

interface PasswordFormData {
  firstName: string;
  lastName: string;
  firstNameThai?: string;
  lastNameThai?: string;
  nationality?: string;
  positionId?: string;
  companyId?: string;
  password: string;
  confirmPassword: string;
}

export const Step1PasswordForm: React.FC<StepProps> = ({ state, onNext, onError, mode = 'completion' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<PasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: state.userData?.firstName ?? '',
      lastName: state.userData?.lastName ?? '',
      firstNameThai: state.userData?.firstNameThai ?? '',
      lastNameThai: state.userData?.lastNameThai ?? '',
      nationality: state.userData?.nationality ?? '',
      positionId: state.userData?.positionId ?? '',
      companyId: state.userData?.companyId ?? '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const userType = state.userData?.userType;

  // Reset form values when userData changes, but preserve restored passwordData
  useEffect(() => {
    if (state.userData) {
      // Prioritize restored passwordData over userData
      const formData = state.passwordData || {
        firstName: state.userData.firstName ?? '',
        lastName: state.userData.lastName ?? '',
        firstNameThai: state.userData.firstNameThai ?? '',
        lastNameThai: state.userData.lastNameThai ?? '',
        nationality: state.userData.nationality ?? '',
        positionId: state.userData.positionId ?? '',
        companyId: state.userData.companyId ?? '',
        password: '',
        confirmPassword: ''
      };

      console.log('🔄 Resetting form with data:', {
        source: state.passwordData ? 'restored passwordData' : 'userData',
        formData: {
          positionId: formData.positionId,
          companyId: formData.companyId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          hasPassword: !!formData.password
        }
      });
      
      reset(formData);
    }
  }, [state.userData, state.passwordData, reset]);

  // Filter positions by user type (like in CreateUserModal)
  const filteredPositions = positions.filter(pos => {
    if (!userType) return true; // Show all positions if no user type available
    
    // Map user types to position types
    let requiredPositionType: string;
    if (userType === 'internal') {
      requiredPositionType = 'internal';
    } else if (userType === 'external') {
      requiredPositionType = 'external';
    } else {
      return true; // Fallback: show all positions
    }
    
    return pos.type === requiredPositionType;
  });

  // Debug the filtering (only log once when data changes)
  useEffect(() => {
    if (positions.length > 0 && !isLoadingData) {
      console.log('🔍 Position filtering debug:', {
        userType,
        totalPositions: positions.length,
        filteredPositions: filteredPositions.length,
        currentUserPositionId: state.userData?.positionId,
        externalPositions: positions.filter(p => p.type === 'external').map(p => ({ id: p.id, title: p.positionTitle })),
        internalPositions: positions.filter(p => p.type === 'internal').map(p => ({ id: p.id, title: p.positionTitle }))
      });
    }
  }, [positions.length, isLoadingData, userType]);

  // Load positions and companies data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        console.log('🔄 Loading positions and companies data, userType:', userType);
        
        // Load positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('id, level, position_title, code, type, created_at, updated_at')
          .order('level', { ascending: true });
          
        if (positionsError) throw positionsError;
        
        // Map database fields to frontend interface 
        const mappedPositions = (positionsData || []).map((pos: any) => ({
          id: pos.id,
          level: pos.level,
          positionTitle: pos.position_title,
          code: pos.code,
          type: pos.type,
          createdAt: pos.created_at,
          updatedAt: pos.updated_at
        }));
        
        console.log('✅ Loaded positions:', mappedPositions.length, 'items');
        if (mappedPositions.find(p => p.id === 12)) {
          console.log('📊 Position ID 12 details:', mappedPositions.find(p => p.id === 12));
        }
        setPositions(mappedPositions);

        // Always load companies (not just for external users, as we need them for data display)
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });
          
        if (companiesError) throw companiesError;
        console.log('✅ Loaded companies:', (companiesData || []).length, 'items');
        setCompanies(companiesData || []);
        
      } catch (error) {
        console.error('Error loading positions/companies:', error);
        onError('Failed to load form data. Please refresh and try again.');
      } finally {
        setIsLoadingData(false);
      }
    };

    // Only load data if we have state.userData (for edit mode) or if it's completion mode
    if (state.userData || !state.userData) {
      loadData();
    }
  }, [state.userData, onError]);

  // Password validation - 8 chars + 1 letter + 1 number
  const validatePassword = (value: string) => {
    // Rule 1: Minimum 8 characters
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    // Rule 2: At least 1 letter (any case)
    if (!/[a-zA-Z]/.test(value)) {
      return 'Password must contain at least 1 letter';
    }
    
    // Rule 3: At least 1 number
    if (!/\d/.test(value)) {
      return 'Password must contain at least 1 number';
    }
    
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      return 'Passwords do not match';
    }
    return true;
  };

  const getPasswordStrength = (value: string) => {
    if (!value) return { score: 0, label: '', color: '' };
    
    let score = 0;
    let issues = [];
    
    // Check length (8+ chars)
    if (value.length >= 8) {
      score += 40;
    } else {
      issues.push('8+ chars');
    }
    
    // Check for at least 1 letter
    if (/[a-zA-Z]/.test(value)) {
      score += 30;
    } else {
      issues.push('1 letter');
    }
    
    // Check for at least 1 number
    if (/\d/.test(value)) {
      score += 30;
    } else {
      issues.push('1 number');
    }
    
    // Return appropriate strength
    if (score < 40) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score < 100) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = (data: PasswordFormData) => {
    onNext({
      firstName: data.firstName,
      lastName: data.lastName,
      firstNameThai: data.firstNameThai,
      lastNameThai: data.lastNameThai,
      nationality: data.nationality,
      positionId: data.positionId,
      companyId: data.companyId,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  // Debug current form values (only when actually needed)
  const currentValues = watch();
  
  // Debug userData to see what's available
  useEffect(() => {
    if (state.userData) {
      console.log('🔍 Step1PasswordForm userData debug:', {
        username: state.userData.username,
        email: state.userData.email,
        firstName: state.userData.firstName,
        lastName: state.userData.lastName,
        allFields: Object.keys(state.userData)
      });
    }
  }, [state.userData]);
  
  // Only log matching debug when data is fully loaded
  useEffect(() => {
    if (!isLoadingData && positions.length > 0 && companies.length > 0) {
      console.log('🎯 Final form state:', {
        formPositionId: currentValues.positionId,
        formCompanyId: currentValues.companyId,
        positionMatch: filteredPositions.find(p => p.id.toString() === currentValues.positionId),
        companyMatch: companies.find(c => c.id.toString() === currentValues.companyId)
      });
    }
  }, [isLoadingData, positions.length, companies.length]);

  return (
    <div className="space-y-6">
      {/* Mode-specific header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {mode === 'edit' ? 'Update Profile Information' : 'Personal Information & Password'}
        </h2>
        <p className="text-gray-600">
          {mode === 'edit' 
            ? 'Update your name and optionally change your password.'
            : 'Please set up your password and confirm your personal information.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username (readonly) */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={
            state.userData?.username || 
            (state.userData?.email ? state.userData.email.split('@')[0] : '') ||
            'Loading...'
          }
          readOnly
          className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
          placeholder="Username will be automatically generated"
        />
        {!state.userData?.username && state.userData?.email && (
          <p className="mt-1 text-xs text-gray-500">
            Username will be: {state.userData.email.split('@')[0]}
          </p>
        )}
        {!state.userData?.email && !state.userData?.username && (
          <p className="mt-1 text-xs text-red-500">
            Username information not available in token
          </p>
        )}
      </div>

      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            {...register('firstName', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters'
              }
            })}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            {...register('lastName', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters'
              }
            })}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Thai Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstNameThai" className="block text-sm font-medium text-gray-700 mb-2">
            Thai First Name (ชื่อ)
          </label>
          <input
            type="text"
            id="firstNameThai"
            {...register('firstNameThai')}
            className="w-full px-4 py-3 border border-gray-300 rounded-md"
            placeholder="ชื่อไทย"
          />
        </div>
        <div>
          <label htmlFor="lastNameThai" className="block text-sm font-medium text-gray-700 mb-2">
            Thai Last Name (นามสกุล)
          </label>
          <input
            type="text"
            id="lastNameThai"
            {...register('lastNameThai')}
            className="w-full px-4 py-3 border border-gray-300 rounded-md"
            placeholder="นามสกุลไทย"
          />
        </div>
      </div>

      {/* Nationality */}
      <div>
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
          Nationality
        </label>
        <select
          id="nationality"
          {...register('nationality')}
          className="w-full px-4 py-3 border border-gray-300 rounded-md"
        >
          <option value="">Select nationality</option>
          <option value="Thai">Thai</option>
          <option value="Myanmar">Myanmar</option>
          <option value="Cambodian">Cambodian</option>
          <option value="Laotian">Laotian</option>
          <option value="Vietnamese">Vietnamese</option>
          <option value="Filipino">Filipino</option>
          <option value="Indonesian">Indonesian</option>
          <option value="Malaysian">Malaysian</option>
          <option value="Singaporean">Singaporean</option>
          <option value="Indian">Indian</option>
          <option value="Bangladeshi">Bangladeshi</option>
          <option value="Pakistani">Pakistani</option>
          <option value="Sri Lankan">Sri Lankan</option>
          <option value="Nepalese">Nepalese</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
          <option value="Korean">Korean</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Position */}
      <div>
        <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-2">
          Position
        </label>
        <select
          id="positionId"
          {...register('positionId')}
          value={watch('positionId') || ''}
          className="w-full px-4 py-3 border border-gray-300 rounded-md"
          disabled={isLoadingData}
        >
          <option value="">
            {!userType 
              ? "Select position" 
              : filteredPositions.length === 0 
              ? `No positions available for ${userType} users`
              : "Select position"
            }
          </option>
          {filteredPositions.map((position) => (
            <option key={position.id} value={position.id.toString()}>
              {position.positionTitle}
            </option>
          ))}
        </select>
        {isLoadingData && (
          <p className="mt-1 text-sm text-gray-500">Loading positions...</p>
        )}
        {userType && filteredPositions.length === 0 && !isLoadingData && (
          <p className="text-sm text-yellow-600 mt-1">
            No positions available for {userType} users
          </p>
        )}
      </div>

      {/* Company (External users only) */}
      {userType === 'external' && (
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <select
            id="companyId"
            {...register('companyId')}
            value={watch('companyId') || ''}
            className="w-full px-4 py-3 border border-gray-300 rounded-md"
            disabled={isLoadingData}
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id.toString()}>
                {company.name}
              </option>
            ))}
          </select>
          {isLoadingData && (
            <p className="mt-1 text-sm text-gray-500">Loading companies...</p>
          )}
        </div>
      )}

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password {mode === 'edit' && <span className="text-gray-500">(leave blank to keep current)</span>}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            {...register('password', {
              required: mode === 'completion' ? 'Password is required' : false,
              validate: password ? validatePassword : undefined
            })}
            className={`w-full px-4 py-3 border rounded-md pr-10 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={mode === 'edit' ? 'New password (optional)' : '••••••••'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${
                passwordStrength.score <= 40 ? 'text-red-600' :
                passwordStrength.score <= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}
        
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            {...register('confirmPassword', {
              required: password ? 'Please confirm your password' : false,
              validate: validateConfirmPassword
            })}
            className={`w-full px-4 py-3 border rounded-md pr-10 ${
              errors.confirmPassword ? 'border-red-300 ring-red-300' : 
              confirmPassword && !errors.confirmPassword ? 'border-blue-300 ring-blue-300' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Continue Button */}
      <button
        type="submit"
        disabled={!isValid}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          isValid 
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {mode === 'edit' ? 'Continue to Photo' : 'Continue to Photo'}
      </button>
      </form>
    </div>
  );
};
