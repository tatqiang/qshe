import React from 'react';
import { useParams } from 'react-router-dom';
import { ProfileEditWizard } from './ProfileEditWizard';

/**
 * Edit Profile route component
 * Route: /admin/users/:userId/edit
 */
export const EditProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid User ID</h2>
          <p className="text-gray-600">No user ID provided for editing.</p>
        </div>
      </div>
    );
  }

  return <ProfileEditWizard mode="edit" userId={userId} />;
};
