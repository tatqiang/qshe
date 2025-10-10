import React, { useState } from 'react';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClockIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { ProfileImage } from '../../common/ProfileImage';
import { PhotoUpload } from '../../common/PhotoUpload';
import { useUserRole } from '../../common/RoleGuard';
import type { User } from '../../../types';

interface UserProfileProps {
  user: User;
  isEditing?: boolean;
  onSave?: (user: User) => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  isEditing = false, 
  onSave, 
  onCancel, 
  onEdit 
}) => {
  const [editedUser, setEditedUser] = useState<User>(user);
  const [profileImage, setProfileImage] = useState<string | null>(user.profilePhotoUrl || null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { isSystemAdmin } = useUserRole();

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const updatedUser = {
      ...editedUser,
      profilePhotoUrl: profileImage || undefined,
      updatedAt: new Date().toISOString()
    };
    onSave?.(updatedUser);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUploaded = (photoUrl: string) => {
    setProfileImage(photoUrl);
    setShowPhotoUpload(false);
  };

  const handlePhotoError = (error: string) => {
    console.error('Photo upload error:', error);
    alert('Failed to upload photo. Please try again.');
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-full border ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    const typeClasses = {
      internal: 'bg-blue-100 text-blue-800 border-blue-200',
      external: 'bg-purple-100 text-purple-800 border-purple-200',
      worker: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-full border ${typeClasses[userType as keyof typeof typeClasses]}`}>
        {userType.charAt(0).toUpperCase() + userType.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayUser = isEditing ? editedUser : user;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit User Profile' : 'User Profile'}
        </h1>
        
        {!isEditing && isSystemAdmin && (
          <div className="flex space-x-2">
            <Button onClick={() => window.location.href = `/users/${user.id}/edit`}>
              <PencilIcon className="w-5 h-5 mr-2" />
              Edit Profile
            </Button>
            
            {/* Show Generate Reset Link only for invited users */}
            {user.status === 'invited' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Generate invitation link for password reset
                  const resetLink = `${window.location.origin}/complete-profile?token=${user.invitationToken}`;
                  navigator.clipboard.writeText(resetLink);
                  alert('Password reset link copied to clipboard!');
                }}
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Generate Reset Link
              </Button>
            )}
          </div>
        )}
        
        {isEditing && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              <XMarkIcon className="w-5 h-5 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card>
        <div className="flex items-start space-x-6">
          {/* Profile Image */}
          <div className="relative">
            <ProfileImage 
              src={profileImage || displayUser.profilePhotoUrl} 
              alt={`${displayUser.firstName || ''} ${displayUser.lastName || ''}`}
              size="xl"
              fallbackInitials={`${displayUser.firstName?.[0] || ''}${displayUser.lastName?.[0] || ''}`}
            />
            
            {isEditing && (
              <button
                onClick={() => setShowPhotoUpload(true)}
                className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {displayUser.firstName} {displayUser.lastName}
              </h2>
              {getStatusBadge(displayUser.status)}
              {getUserTypeBadge(displayUser.userType)}
            </div>
            
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                {displayUser.email}
              </div>
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                {displayUser.positionTitle || 'No Position Assigned'}
              </div>
              {displayUser.companyId && (
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                  Company ID: {displayUser.companyId}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            {isEditing ? (
              <Input
                value={editedUser.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('firstName', e.target.value)
                }
                fullWidth
              />
            ) : (
              <p className="text-gray-900">{displayUser.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <Input
                value={editedUser.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('lastName', e.target.value)
                }
                fullWidth
              />
            ) : (
              <p className="text-gray-900">{displayUser.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={editedUser.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('email', e.target.value)
                }
                fullWidth
              />
            ) : (
              <p className="text-gray-900">{displayUser.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            {isEditing ? (
              <Input
                value={editedUser.positionTitle || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('positionTitle', e.target.value)
                }
                fullWidth
              />
            ) : (
              <p className="text-gray-900">{displayUser.positionTitle || 'No Position Assigned'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            {isEditing ? (
              <select
                value={editedUser.userType}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="worker">Worker</option>
              </select>
            ) : (
              <p className="text-gray-900">{getUserTypeBadge(displayUser.userType)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            {isEditing ? (
              <select
                value={editedUser.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <p className="text-gray-900">{getStatusBadge(displayUser.status)}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card title="Account Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Created Date
            </label>
            <p className="text-gray-900">{formatDate(displayUser.createdAt)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Last Updated
            </label>
            <p className="text-gray-900">{formatDate(displayUser.updatedAt)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <p className="text-gray-900 font-mono text-sm">{displayUser.id}</p>
          </div>

          {displayUser.companyId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company ID
              </label>
              <p className="text-gray-900 font-mono text-sm">{displayUser.companyId}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Profile Photo</h3>
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <PhotoUpload
              userId={user.id}
              currentPhotoUrl={profileImage || user.profilePhotoUrl}
              onPhotoUploaded={(photoUrl, fileName) => handlePhotoUploaded(photoUrl)}
              onError={handlePhotoError}
            />
          </div>
        </div>
      )}
    </div>
  );
};
