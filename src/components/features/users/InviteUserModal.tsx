import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { useAppDispatch } from '../../../hooks/redux';
import { createPreRegistration } from '../../../store/preRegistrationSlice';
import { useActionWithLoading } from '../../../hooks/useActionWithLoading';

interface InviteUserFormData {
  email: string;
  userType: 'internal' | 'external';
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  // Action hook for invite user with loading state
  const { loading: isSubmitting, execute: executeInvite } = useActionWithLoading({
    successMessage: 'Invitation sent successfully!',
    errorMessage: 'Failed to send invitation. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: false, // We'll handle errors manually for better UX
    onSuccess: () => {
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to invite user:', error);
      const errorMessage = error.message;
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setError('A user with this email address already exists.');
      } else {
        setError(errorMessage || 'Failed to send invitation. Please try again.');
      }
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InviteUserFormData>({
    defaultValues: {
      userType: 'external',
    },
  });

  const userType = watch('userType');

  const onSubmit = async (data: InviteUserFormData) => {
    setError(null);
    
    executeInvite(async () => {
      await dispatch(createPreRegistration({
        email: data.email,
        userType: data.userType
      })).unwrap();
      
      reset();
    });
  };

  const handleClose = () => {
    setError(null);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite New User"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          })}
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            User Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="internal"
                className="mr-2"
                {...register('userType', { required: 'User type is required' })}
              />
              <span className="text-sm text-gray-700">Internal (Company Employee)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="external"
                className="mr-2"
                {...register('userType', { required: 'User type is required' })}
              />
              <span className="text-sm text-gray-700">External (Contractor/Vendor)</span>
            </label>
          </div>
          {errors.userType && (
            <p className="text-sm text-red-600">{errors.userType.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};