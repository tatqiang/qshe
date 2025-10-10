import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { CameraModal } from '../../common/CameraModal';
import { FaceCapture } from './FaceCapture';
import type { UserProfileCompletionData } from '../../../types';

export const ProfileCompletionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'validation' | 'form' | 'photo' | 'face' | 'complete'>('validation');
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState<UserProfileCompletionData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<Float32Array[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserProfileCompletionData>();

  const password = watch('password');

  // Function to resize image for profile photo
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to data URL with compression (0.8 quality for good balance)
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(resizedDataUrl);
        }
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid invitation link. Please contact your administrator.');
        return;
      }

      try {
        // Handle test/placeholder tokens
        if (token === 'your-token' || token === 'test-token') {
          console.log('🧪 Using test token, loading demo data');
          setUserData({
            id: 'test-user-id',
            email: 'test@example.com',
            username: 'testuser',
            userType: 'internal',
            role: 'employee',
            firstName: 'Test',
            lastName: 'User',
            positionId: '1',
            positionTitle: 'Test Position',
            companyId: '1',
            status: 'invited',
          });
          setStep('form');
          return;
        }

        // Try to decode the token (expecting base64 encoded JSON)
        let decodedData;
        try {
          decodedData = JSON.parse(atob(token));
        } catch (decodeError: any) {
          throw new Error(`Invalid token format: ${decodeError.message}`);
        }
        
        // Validate token structure and age (7 days max)
        if (!decodedData.id || !decodedData.email || !decodedData.timestamp) {
          throw new Error('Invalid token format - missing required fields');
        }
        
        // Check if token is not older than 7 days (7 * 24 * 60 * 60 * 1000 ms)
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - decodedData.timestamp > sevenDaysInMs) {
          throw new Error('Invitation link has expired');
        }
        
        // Set user data from token
        setUserData({
          id: decodedData.id,
          email: decodedData.email,
          username: decodedData.username,
          userType: decodedData.userType,
          role: decodedData.role,
          firstName: decodedData.firstName,
          lastName: decodedData.lastName,
          positionId: decodedData.positionId,
          positionTitle: decodedData.positionTitle,
          companyId: decodedData.companyId,
          status: decodedData.status,
        });
        
        setStep('form');
      } catch (err: any) {
        console.error('Token validation error:', err);
        setError(`Invalid or expired invitation link: ${err.message}. Please contact your administrator.`);
      }
    };

    validateToken();
  }, [token]);

  const onFormSubmit = (data: UserProfileCompletionData) => {
    setFormData(data);
    setStep('photo');
  };

  const handleSkipPhoto = () => {
    setStep('face');
  };

  const handleFaceComplete = (faceDescriptors: Float32Array[]) => {
    setFaceData(faceDescriptors);
    setStep('complete');
  };

  const handleSkipFace = () => {
    setStep('complete');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full space-y-8" padding="lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Access Error</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'validation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full space-y-8" padding="lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Validating Invitation</h2>
            <p className="mt-2 text-sm text-gray-600">Please wait while we validate your invitation link...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome {userData?.firstName || userData?.email}! Please complete your profile setup.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            {['form', 'photo', 'face', 'complete'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-blue-600 text-white' :
                  ['form', 'photo', 'face', 'complete'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <Card padding="lg">
          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...register('firstName', { required: 'First name is required' })}
                  error={errors.firstName?.message}
                  defaultValue={userData?.firstName || ''}
                />
                <Input
                  label="Last Name"
                  {...register('lastName', { required: 'Last name is required' })}
                  error={errors.lastName?.message}
                  defaultValue={userData?.lastName || ''}
                />
              </div>

              <Input
                label="Username"
                {...register('username', { required: 'Username is required' })}
                error={errors.username?.message}
                defaultValue={userData?.username || ''}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                error={errors.password?.message}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                }
              />

              <Button type="submit" className="w-full">
                Continue to Photo
              </Button>
            </form>
          )}

          {/* Photo Step */}
          {step === 'photo' && (
            <div className="space-y-6">
              {previewPhoto ? (
                <div className="space-y-4">
                  <div className="mx-auto h-32 w-32 rounded-full overflow-hidden">
                    <img src={previewPhoto} alt="Profile preview" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 text-center">Perfect! Your photo looks great.</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setStep('face')}
                      className="w-full"
                    >
                      Continue to Face Recognition
                    </Button>
                    <Button
                      onClick={() => setPreviewPhoto(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Take Another Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add Profile Photo</h3>
                  <p className="text-gray-600">Add a profile photo to help others recognize you.</p>
                  
                  <div className="space-y-3">
                    {/* Web Camera Option */}
                    <Button
                      onClick={() => setIsCameraOpen(true)}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 616 0z" />
                      </svg>
                      <span>Take Photo</span>
                    </Button>

                    {/* File Upload Option */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('File photo selected:', file.name, `${(file.size / 1024).toFixed(1)}KB`);
                            const resizedUrl = await resizeImage(file);
                            setPreviewPhoto(resizedUrl);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="file-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2"
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload from Gallery</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Face Recognition Step */}
          {step === 'face' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Face Recognition Setup</h3>
                <p className="text-gray-600">Set up face recognition for secure authentication.</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setShowFaceCapture(true)}
                  className="w-full"
                >
                  Set Up Face Recognition
                </Button>
                <Button
                  onClick={handleSkipFace}
                  variant="outline"
                  className="w-full"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Profile Complete!</h3>
              <p className="text-gray-600">
                Your profile has been successfully set up. You can now access the system.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </Card>

        {/* Camera Modal */}
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={async (file: File) => {
            console.log('Camera photo captured:', file.name, `${(file.size / 1024).toFixed(1)}KB`);
            const resizedUrl = await resizeImage(file);
            setPreviewPhoto(resizedUrl);
            setIsCameraOpen(false);
          }}
        />

        {/* Face Capture Modal */}
        {showFaceCapture && (
          <FaceCapture
            onComplete={handleFaceComplete}
            onClose={() => setShowFaceCapture(false)}
          />
        )}
      </div>
    </div>
  );
};
