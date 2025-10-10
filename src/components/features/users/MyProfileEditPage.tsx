import React from 'react';
import { useUserRole } from '../../common/RoleGuard';
import { ProfileEditWizard } from '../../profile-completion/ProfileEditWizard';

/**
 * Self Edit Profile route component
 * Route: /my-profile/edit
 * Allows any authenticated user to edit their own profile
 */
export const MyProfileEditPage: React.FC = () => {
  const { user } = useUserRole();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to edit your profile.</p>
        </div>
      </div>
    );
  }

  return <ProfileEditWizard mode="edit" userId={user.id} />;
};
