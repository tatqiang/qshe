import React from 'react';
import { 
  EnvelopeIcon,
  BuildingOfficeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { Modal } from './Modal';
import { Card } from './Card';
import { Button } from './Button';
import { ProfileImage } from './ProfileImage';
import { useUserRole } from './RoleGuard';
import type { User } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onResetPassword?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  onResetPassword 
}) => {
  const { isSystemAdmin } = useUserRole();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const statusClasses = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      invited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 text-sm rounded-full border ${statusClasses[status as keyof typeof statusClasses] || statusClasses.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUserTypeBadge = (userType: string | undefined) => {
    if (!userType) return null;
    
    const typeClasses = {
      system_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200',
      internal: 'bg-blue-100 text-blue-800 border-blue-200',
      external: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`px-3 py-1 text-sm rounded-full border ${typeClasses[userType as keyof typeof typeClasses] || typeClasses.member}`}>
        {userType.replace('_', ' ').charAt(0).toUpperCase() + userType.replace('_', ' ').slice(1)}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <ProfileImage 
                src={user.profilePhotoUrl} 
                alt={`${user.firstName || ''} ${user.lastName || ''}`}
                size="xl"
                fallbackInitials={`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                {getStatusBadge(user.status)}
                {getUserTypeBadge(user.userType)}
              </div>
              
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                  {user.positionTitle || 'No Position Assigned'}
                </div>
                {user.companyId && (
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                    Company ID: {user.companyId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Username:</span>
              <span className="font-medium">{user.username || user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="font-medium">
                {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">
                {user.updatedAt ? formatDate(user.updatedAt) : 'Unknown'}
              </span>
            </div>
            {user.profileCompletedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Profile Completed:</span>
                <span className="font-medium">
                  {formatDate(user.profileCompletedAt)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <div>
            {onResetPassword && isSystemAdmin && (
              <Button variant="outline" onClick={onResetPassword}>
                <KeyIcon className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            )}
          </div>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
