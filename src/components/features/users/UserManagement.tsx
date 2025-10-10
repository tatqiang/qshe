import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserIcon,
  TrashIcon,
  LinkIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import { ProfileImage } from '../../common/ProfileImage';
import { QRCodeModal } from '../../common/QRCodeModal';
import { UserProfile } from './UserProfile';
import { CreateUserModal } from '../admin/CreateUserModal';
import { FaceScanModal } from './FaceScanModal';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchUsers, updateUser, createUser } from '../../../store/usersSlice';
import { useUserRole } from '../../common/RoleGuard';
import { useActionWithLoading, useDeletionAction } from '../../../hooks/useActionWithLoading';
import type { User, AdminUserCreationData, UserRegistrationData } from '../../../types';
import type { RootState } from '../../../store';

export const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFaceScanModalOpen, setIsFaceScanModalOpen] = useState(false);
  const [currentInvitationLink, setCurrentInvitationLink] = useState('');
  
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state: RootState) => state.users);
  const { isSystemAdmin } = useUserRole(); // Get current user's role

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Force refresh users data (especially useful after code changes)
  const handleRefreshUsers = () => {
    console.log('🔄 Force refreshing users data...');
    dispatch(fetchUsers());
  };

  // Handle face scan modal opening with data refresh
  const handleFaceScanModalOpen = () => {
    console.log('🎥 Opening face scan modal...');
    // Force refresh users to ensure we have latest face data
    dispatch(fetchUsers()).then(() => {
      console.log('✅ Users refreshed, opening face scan modal');
      setIsFaceScanModalOpen(true);
    });
  };

  // Action hooks for user management operations
  const { loading: createUserLoading, execute: executeCreateUser } = useActionWithLoading({
    successMessage: 'User created successfully! The user will receive profile completion instructions.',
    errorMessage: 'Failed to create user. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    onSuccess: () => {
      setIsCreateUserModalOpen(false);
      dispatch(fetchUsers()); // Refresh the user list
    }
  });

  const { loading: passwordResetLoading, execute: executePasswordReset } = useActionWithLoading({
    successMessage: 'Password reset link copied to clipboard!',
    errorMessage: 'Failed to generate password reset link. Please try again.',
    showSuccessAlert: false, // We'll show custom alert in the handler
    showErrorAlert: true
  });

  const { loading: profileLinkLoading, execute: executeProfileLink } = useActionWithLoading({
    successMessage: 'Profile completion link generated successfully!',
    errorMessage: 'Failed to generate profile completion link. Please try again.',
    showSuccessAlert: false, // We'll show QR modal instead
    showErrorAlert: true
  });

  const { loading: deletionLoading, execute: executeDeletion } = useDeletionAction({
    successMessage: 'User deleted successfully!',
    onSuccess: () => {
      dispatch(fetchUsers()); // Refresh the user list
    }
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user: User) =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      invited: 'bg-yellow-100 text-yellow-800', // User created, awaiting profile completion
      pending_completion: 'bg-blue-100 text-blue-800', // User started profile completion
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    
    const displayStatus = status === 'invited' ? 'Pending Profile' : 
                       status === 'pending_completion' ? 'Completing Profile' : 
                         status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {displayStatus}
      </span>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    const typeClasses = {
      internal: 'bg-blue-100 text-blue-800',
      external: 'bg-purple-100 text-purple-800',
      worker: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${typeClasses[userType as keyof typeof typeClasses]}`}>
        {userType.charAt(0).toUpperCase() + userType.slice(1)}
      </span>
    );
  };

  const getPositionBadge = (positionTitle?: string) => {
    if (!positionTitle) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          No Position
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        {positionTitle}
      </span>
    );
  };

  const handleUserAction = (action: string, user: User) => {
    setSelectedUser(user);
    setShowDropdown(null);
    
    switch (action) {
      case 'editProfile':
        // Navigate to profile editing wizard
        window.location.href = `/admin/users/${user.id}/edit`;
        break;
      case 'delete':
        // Show confirmation dialog and execute deletion if confirmed
        if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
          executeDeletion(async () => {
            // TODO: Implement actual user deletion API call
            // For now, just simulate the operation
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('User deleted:', user);
            // The actual deletion would be:
            // await dispatch(deleteUser(user.id)).unwrap();
          });
        }
        break;
      case 'view':
        setIsModalOpen(true);
        break;
      case 'generateLink':
        generateProfileCompletionQR(user); // Open QR modal instead of just copying link
        break;
      case 'generatePasswordReset':
        generatePasswordResetLink(user);
        break;
    }
  };

  const generateProfileCompletionQR = (user: User) => {
    executeProfileLink(async () => {
      // Generate username if not available
      const generateUsername = (user: User): string => {
        if (user.username) return user.username;
        if (user.email) return user.email.split('@')[0];
        if (user.firstName && user.lastName) {
          return `${user.firstName.toLowerCase()}.${user.lastName.charAt(0).toLowerCase()}`;
        }
        return `user_${user.id.slice(-6)}`;
      };

      // Create token with complete user data
      const tokenData = {
        id: user.id,
        email: user.email || '',
        username: generateUsername(user),
        userType: user.userType || 'internal',
        role: user.role || 'member',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        positionTitle: user.positionTitle || 'Not specified',
        positionId: user.positionId, // ✅ Now properly mapped from database via usersSlice
        companyId: user.companyId || null,
        status: user.status || 'invited',
        timestamp: Date.now()
      };
      
      const token = btoa(JSON.stringify(tokenData));
      const link = `${window.location.origin}/complete-profile?token=${token}`;
      
      // Set the invitation link and open QR modal
      setCurrentInvitationLink(link);
      setSelectedUser(user);
      setIsQRModalOpen(true);
    });
  };

  const generatePasswordResetLink = (user: User) => {
    executePasswordReset(async () => {
      // Create password reset token
      const resetTokenData = {
        id: user.id,
        email: user.email || '',
        type: 'password-reset',
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
      };
      
      const resetToken = btoa(JSON.stringify(resetTokenData));
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(resetLink);
        alert(`Password reset link copied to clipboard!\n\nLink: ${resetLink}\n\nThis link expires in 24 hours.`);
      } catch (clipboardError) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = resetLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Password reset link copied to clipboard!\n\nLink: ${resetLink}\n\nThis link expires in 24 hours.`);
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Handle user creation
  const handleCreateUser = async (userData: AdminUserCreationData) => {
    executeCreateUser(async () => {
      // Convert AdminUserCreationData to UserRegistrationData format
      const userRegistrationData: UserRegistrationData & { firstNameThai?: string; lastNameThai?: string; nationality?: string } = {
        email: userData.email, // Pass email as-is, usersSlice will handle empty values
        password: 'temp123!', // Temporary password - user will set real password during profile completion
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        firstNameThai: userData.firstNameThai, // Include Thai first name
        lastNameThai: userData.lastNameThai, // Include Thai last name
        nationality: userData.nationality, // Include nationality field
        positionId: userData.positionId || 0,
        userType: userData.userType,
        role: userData.role,
        companyId: userData.companyId,
        username: userData.username, // Pass the username from the form
      };
      
      const result = await dispatch(createUser(userRegistrationData)).unwrap();
      
      // Provide user-friendly error messages for common issues
      if (!result) {
        throw new Error('Failed to create user. Please try again.');
      }
    });
  };

  const handleSaveUser = async (updatedUser: User) => {
    try {
      await dispatch(updateUser({
        id: updatedUser.id,
        updates: updatedUser
      }));
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage team members and their access</p>
        </div>
        {/* Action buttons for system_admin */}
        {isSystemAdmin && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={handleFaceScanModalOpen}
              className="flex-1 sm:flex-none"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              Face Scan
            </Button>
            <Button 
              onClick={() => setIsCreateUserModalOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create User
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card padding="md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <UserIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.status === 'invited').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.userType === 'internal').length}
              </p>
              <p className="text-sm text-gray-600">Internal</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                fullWidth
              />
            </div>
          </div>
          <Button variant="outline" className="flex-shrink-0">Filter</Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Users List */}
      <Card title="Team Members" subtitle={`${filteredUsers.length} users found`}>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="flex items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <ProfileImage
                    src={user.profilePhotoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    fallbackInitials={`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      {getStatusBadge(user.status)}
                      {getPositionBadge(user.positionTitle)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowDropdown(showDropdown === user.id ? null : user.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>

                  {showDropdown === user.id && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-md shadow-lg z-10 border">
                      <div className="py-1">
                        <button
                          onClick={() => handleUserAction('view', user)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        
                        {/* Only show Edit Profile for system_admin */}
                        {isSystemAdmin && (
                          <button
                            onClick={() => handleUserAction('editProfile', user)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Edit Profile
                          </button>
                        )}
                        
                        {/* Password Reset Link - For active users - Only system_admin */}
                        {isSystemAdmin && user.status === 'active' && (
                          <button
                            onClick={() => handleUserAction('generatePasswordReset', user)}
                            className={`flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 w-full text-left ${
                              passwordResetLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={passwordResetLoading || profileLinkLoading || deletionLoading}
                          >
                            {passwordResetLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Generate Password Reset Link
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Profile Completion Links - Only for 'invited' users - Only system_admin */}
                        {isSystemAdmin && user.status === 'invited' && (
                          <>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleUserAction('generateLink', user)}
                              className={`flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left ${
                                profileLinkLoading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={passwordResetLoading || profileLinkLoading || deletionLoading}
                            >
                              {profileLinkLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-4 h-4 mr-2" />
                                  Generate Profile Link
                                </>
                              )}
                            </button>
                            <hr className="my-1" />
                          </>
                        )}
                        
                        {/* Only show Delete for system_admin */}
                        {isSystemAdmin && (
                          <button
                            onClick={() => handleUserAction('delete', user)}
                            className={`flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left ${
                              deletionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={passwordResetLoading || profileLinkLoading || deletionLoading}
                          >
                            {deletionLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Delete User
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Invite User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* User Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="User Details"
        size="xl"
      >
        {selectedUser && (
          <UserProfile
            user={selectedUser}
            isEditing={false}
            onSave={handleSaveUser}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        user={selectedUser}
        invitationLink={currentInvitationLink}
      />

      {/* Face Scan Modal */}
      <FaceScanModal
        isOpen={isFaceScanModalOpen}
        onClose={() => setIsFaceScanModalOpen(false)}
      />
    </div>
  );
};
