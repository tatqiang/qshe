import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  CameraIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { PositionSelector } from '../../common/PositionSelector';
import { PhotoUpload } from '../../common/PhotoUpload';
import { useAppDispatch } from '../../../hooks/redux';
import { validateInvitationToken, markPreRegistrationAsCompleted } from '../../../store/preRegistrationSlice';
import { supabase } from '../../../lib/api/supabase';
import { FaceApiCapture } from './FaceApiCapture';

interface FaceDetectionData {
  detected: boolean;
  confidence: number;
  qualityScore: number;
  landmarks: number;
  age: number | null;
  gender: string | null;
  expressions: any;
  faceDescriptor: Float32Array | null;
  imageDataUrl: string;
}

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionId: number;
  password: string;
  confirmPassword: string;
}

export const PublicRegistration: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [step, setStep] = useState<'validation' | 'form' | 'photo' | 'face' | 'complete'>('validation');
  const [preRegistration, setPreRegistration] = useState<any>(null);
  const [formData, setFormData] = useState<RegistrationFormData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<FaceDetectionData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  // Register the positionId field for validation
  React.useEffect(() => {
    register('positionId', { required: 'Position is required' });
  }, [register]);

  const password = watch('password');

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      navigate('/');
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      const result = await dispatch(validateInvitationToken(tokenValue)).unwrap();
      
      if (result.status === 'registered') {
        navigate('/login');
        return;
      }
      
      if (new Date(result.expiresAt) < new Date()) {
        navigate(`/invite/${tokenValue}`);
        return;
      }
      
      setPreRegistration(result);
      setStep('form');
    } catch (error) {
      navigate(`/invite/${tokenValue}`);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (step === 'form') {
      // Validate position is selected
      if (!selectedPositionId) {
        return; // PositionSelector will show error
      }
      
      setFormData({
        ...data, 
        positionId: selectedPositionId,
        email: preRegistration?.email || data.email || ''
      });
      setStep('photo');
      return;
    }

    if (step === 'face' && faceData && formData) {
      setIsSubmitting(true);
      try {
        // Ensure we have a valid email
        const email = formData.email || preRegistration?.email;
        if (!email) {
          throw new Error('Email is required for registration');
        }

        // Skip Supabase Auth user creation for now due to email configuration issues
        // Users will be managed through the database only
        console.log('Skipping auth user creation, proceeding with database-only registration');

        // Check if user already exists in users table
        console.log('Checking if user already exists with email:', email);
        const { data: existingUser, error: checkError } = await (supabase as any)
          .from('users')
          .select('id, status')
          .eq('email', email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking for existing user:', checkError);
          throw new Error(`Failed to check existing user: ${checkError.message}`);
        }

        let userId: string;

        if (existingUser) {
          // User already exists, update their information
          console.log('User already exists, updating record:', existingUser);
          const updateData: any = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: preRegistration?.userType || 'external',
            position_id: formData.positionId,
            status: 'active',
            role: 'member',
            registration_completed_at: new Date().toISOString(),
            face_descriptors: faceData ? {
              face_descriptor: faceData.faceDescriptor ? Array.from(faceData.faceDescriptor) : null,
              quality: faceData.qualityScore >= 80 ? 'good' : faceData.qualityScore >= 60 ? 'acceptable' : 'poor',
              confidence: faceData.confidence,
              landmarks: faceData.landmarks,
              created_at: new Date().toISOString()
            } : null,
            profile_photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          };

          const { data: updatedUser, error: updateError } = await (supabase as any)
            .from('users')
            .update(updateData)
            .eq('email', email)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating existing user record:', updateError);
            throw new Error(`Failed to update user record: ${updateError.message}`);
          }

          console.log('User record updated successfully:', updatedUser);
          userId = updatedUser.id;
        } else {
          // Create a new user record in the users table
          const userData: any = {
            email: email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: preRegistration?.userType || 'external',
            position_id: formData.positionId,
            status: 'active',
            role: 'member',
            registration_completed_at: new Date().toISOString(),
            face_descriptors: faceData ? {
              face_descriptor: faceData.faceDescriptor ? Array.from(faceData.faceDescriptor) : null,
              quality: faceData.qualityScore >= 80 ? 'good' : faceData.qualityScore >= 60 ? 'acceptable' : 'poor',
              confidence: faceData.confidence,
              landmarks: faceData.landmarks,
              created_at: new Date().toISOString()
            } : null, // Store face-api.js data as JSON
            profile_photo_url: photoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log('Creating new user record with data:', userData);
          const { data: newUser, error: createError } = await (supabase as any)
            .from('users')
            .insert(userData)
            .select()
            .single();

          if (createError) {
            console.error('Error creating user record:', createError);
            throw new Error(`Failed to create user record: ${createError.message}`);
          }

          console.log('User record created successfully:', newUser);
          userId = newUser.id;
        }

        // Update the pre-registration status to 'registered'
        if (preRegistration) {
          console.log('Updating pre-registration status to registered');
          const { error: preRegUpdateError } = await (supabase as any)
            .from('pre_registrations')
            .update({ 
              status: 'registered',
              registered_at: new Date().toISOString(),
              registered_user_id: userId
            })
            .eq('invitation_token', token);

          if (preRegUpdateError) {
            console.error('Error updating pre-registration status:', preRegUpdateError);
            // Don't throw error here as user creation was successful
          } else {
            console.log('Pre-registration status updated successfully');
            // Update Redux state to reflect the change
            if (token) {
              try {
                await dispatch(markPreRegistrationAsCompleted(token)).unwrap();
              } catch (reduxError) {
                console.warn('Redux state update failed, but registration was successful:', reduxError);
              }
            }
          }
        }

        console.log('Registration completed successfully');
        setStep('complete');
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFaceCapture = (capturedFaceData: FaceDetectionData) => {
    setFaceData(capturedFaceData);
  };

  const handlePhotoUploaded = (uploadedPhotoUrl: string) => {
    setPhotoUrl(uploadedPhotoUrl);
    setUploadError(null);
  };

  const handlePhotoError = (error: string) => {
    setUploadError(error);
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const handleBackToPhoto = () => {
    setStep('photo');
  };

  if (step === 'validation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card padding="lg">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Registration Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been successfully created. You can now login to access the QSHE system.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.svg" 
            alt="QSHE Logo" 
            className="h-12 w-12"
          />
        </div>
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          Complete Your Registration
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {preRegistration?.userType === 'internal' ? 'Internal Employee' : 'External Contractor'} Registration
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Card padding="lg">
          {step === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="First Name"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' },
                })}
              />
              <Input
                label="Last Name"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                })}
              />

              <Input
                label="Email Address"
                type="email"
                value={preRegistration?.email || ''}
                disabled
                readOnly
              />

              <Input
                label="Phone Number"
                type="tel"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[(]?[\d\s\-\(\)]{10,}$/,
                    message: 'Please enter a valid phone number',
                  },
                })}
              />

              <PositionSelector
                userType={preRegistration?.userType || 'internal'}
                value={selectedPositionId}
                onChange={(positionId) => {
                  setSelectedPositionId(positionId);
                  setValue('positionId', positionId);
                }}
                error={errors.positionId?.message}
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Continue to Photo Upload
              </Button>
            </form>
          )}

          {step === 'photo' && (
            <div className="space-y-6">
              <div className="text-center">
                <CameraIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Profile Photo Upload
                </h3>
                <p className="text-gray-600 mb-6">
                  Please upload a clear profile photo. This will be used for your ID card and identification within the system.
                </p>
              </div>

              <PhotoUpload
                userId={preRegistration?.id || 'temp-user'}
                currentPhotoUrl={photoUrl || undefined}
                onPhotoUploaded={handlePhotoUploaded}
                onError={handlePhotoError}
              />

              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                  className="flex-1"
                >
                  Back to Form
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep('face')}
                  disabled={!photoUrl}
                  className="flex-1"
                >
                  Continue to Face Verification
                </Button>
              </div>
            </div>
          )}

          {step === 'face' && (
            <div className="space-y-6">
              <div className="text-center">
                <CameraIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Face Verification Required
                </h3>
                <p className="text-gray-600 mb-6">
                  For security purposes, please capture your face photo. This will be used for identification within the construction site.
                </p>
              </div>

              <FaceApiCapture onCapture={handleFaceCapture} />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToPhoto}
                  className="flex-1"
                >
                  Back to Form
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={!faceData || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
