import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  LinkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import { SystemAdminOnly } from '../../common/RoleGuard';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchPreRegistrations,
  createPreRegistration,
  deletePreRegistration,
  resendInvitation,
  clearError
} from '../../../store/preRegistrationSlice';
import { fetchUsers } from '../../../store/usersSlice';
import type { PreRegistration } from '../../../types';

interface InviteFormData {
  email: string;
  userType: 'internal' | 'external';
}

export const PreRegistrationManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'registered' | 'expired'>('all');

  const dispatch = useAppDispatch();
  const { preRegistrations, isLoading, error } = useAppSelector((state) => state.preRegistration);
  const { users } = useAppSelector((state) => state.users);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>();

  useEffect(() => {
    dispatch(fetchPreRegistrations());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filter pre-registrations
  const filteredPreRegistrations = preRegistrations.filter(preReg => {
    const matchesSearch = preReg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || preReg.status === selectedFilter;
    const matchesExpired = selectedFilter === 'expired' ? new Date(preReg.expiresAt) < new Date() : true;
    
    return matchesSearch && matchesFilter && matchesExpired;
  });

  // Helper function to find the user that completed registration for a pre-registration
  const getRegisteredUser = (preReg: PreRegistration) => {
    if (preReg.status === 'registered') {
      return users.find(user => user.email === preReg.email);
    }
    return null;
  };

  const handleInviteUser = async (data: InviteFormData) => {
    try {
      await dispatch(createPreRegistration(data)).unwrap();
      setIsInviteModalOpen(false);
      reset();
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to invite user:', error);
    }
  };

  const handleDeletePreRegistration = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pre-registration?')) {
      try {
        await dispatch(deletePreRegistration(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete pre-registration:', error);
      }
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await dispatch(resendInvitation(id)).unwrap();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleCopyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(invitationUrl).then(() => {
      // You could add a toast notification here
      alert('Invitation link copied to clipboard!');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = invitationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Invitation link copied to clipboard!');
    });
  };

  const getStatusBadge = (preReg: PreRegistration) => {
    const isExpired = new Date(preReg.expiresAt) < new Date();
    
    if (isExpired && preReg.status === 'pending') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">
          Expired
        </span>
      );
    }

    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      registered: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${statusClasses[preReg.status]}`}>
        {preReg.status.charAt(0).toUpperCase() + preReg.status.slice(1)}
      </span>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    const typeClasses = {
      internal: 'bg-blue-100 text-blue-800 border-blue-200',
      external: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${typeClasses[userType as keyof typeof typeClasses]}`}>
        {userType.charAt(0).toUpperCase() + userType.slice(1)}
      </span>
    );
  };

  const getStats = () => {
    const total = preRegistrations.length;
    const pending = preRegistrations.filter(pr => pr.status === 'pending').length;
    const registered = preRegistrations.filter(pr => pr.status === 'registered').length;
    const expired = preRegistrations.filter(pr => 
      new Date(pr.expiresAt) < new Date() && pr.status === 'pending'
    ).length;

    return { total, pending, registered, expired };
  };

  const stats = getStats();

  return (
    <SystemAdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pre-registration Management</h1>
            <p className="text-gray-600">Manage user invitations and pre-registrations</p>
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card padding="md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Invited</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.registered}</p>
                <p className="text-sm text-gray-600">Registered</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  fullWidth
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              {['all', 'pending', 'registered', 'expired'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as any)}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    selectedFilter === filter
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => dispatch(clearError())}
                  className="text-sm text-red-600 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pre-registrations List */}
        <Card title="Pre-registrations" subtitle={`${filteredPreRegistrations.length} invitations`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPreRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pre-registrations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPreRegistrations.map((preReg) => {
                const registeredUser = getRegisteredUser(preReg);
                
                return (
                  <div
                    key={preReg.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        {registeredUser?.profilePhotoUrl ? (
                          <img
                            src={registeredUser.profilePhotoUrl}
                            alt={`${preReg.email} profile`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircleIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{preReg.email}</h3>
                          {getStatusBadge(preReg)}
                          {getUserTypeBadge(preReg.userType)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Invited: {new Date(preReg.createdAt).toLocaleDateString()}</span>
                          <span>Expires: {new Date(preReg.expiresAt).toLocaleDateString()}</span>
                          {preReg.registeredAt && (
                            <span>Registered: {new Date(preReg.registeredAt).toLocaleDateString()}</span>
                          )}
                          {registeredUser && (
                            <span className="font-medium">
                              {registeredUser.firstName} {registeredUser.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                    {preReg.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(preReg.id)}
                      >
                        <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                        Resend
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInvitationLink(preReg.invitationToken)}
                      title="Copy invitation link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePreRegistration(preReg.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Invite User Modal */}
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite New User"
          size="md"
        >
          <form onSubmit={handleSubmit(handleInviteUser)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              fullWidth
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="internal"
                    {...register('userType', { required: 'User type is required' })}
                    className="mr-2"
                  />
                  <span className="text-sm">Internal (Company Employee)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="external"
                    {...register('userType', { required: 'User type is required' })}
                    className="mr-2"
                  />
                  <span className="text-sm">External (Contractor/Vendor)</span>
                </label>
              </div>
              {errors.userType && (
                <p className="text-sm text-red-600 mt-1">{errors.userType.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </SystemAdminOnly>
  );
};
