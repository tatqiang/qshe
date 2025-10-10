import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { UserProfileModal } from '../common/UserProfileModal';
import { ProfileImage } from '../common/ProfileImage';
import { IOSDebugPanel, useTripleTapDebug } from '../debug/IOSDebugPanel';
import { SessionStatusBadge } from '../dev/SessionStatusBadge';
import { sessionManager } from '../../lib/auth/sessionManager';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logoutUser } from '../../store/authSlice';
import { fetchCurrentUserProfile } from '../../store/usersSlice';
import { useCurrentProject } from '../../contexts/AppContext';
import { getFormattedVersion } from '../../utils/version';
import type { User } from '../../types';

export const MainLayout: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser: fullUserProfile } = useAppSelector((state) => state.users);
  const currentProject = useCurrentProject();
  
  // iOS Debug panel hook
  const { showDebug, setShowDebug } = useTripleTapDebug();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleUserProfileClick = () => {
    setShowProfileModal(true);
    setShowUserDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update session info when dropdown opens
  useEffect(() => {
    if (showUserDropdown) {
      const info = sessionManager.getSessionInfo();
      setSessionInfo(info);
    }
  }, [showUserDropdown]);

  const handleResetPassword = () => {
    if (currentUser?.id) {
      // Create password reset token - same as in UserManagement
      const resetTokenData = {
        id: currentUser.id,
        email: currentUser.email || '',
        type: 'password-reset',
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
      };
      
      const resetToken = btoa(JSON.stringify(resetTokenData));
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      // Copy to clipboard and show confirmation
      navigator.clipboard.writeText(resetLink).then(() => {
        alert(`Password reset link copied to clipboard!\n\nLink: ${resetLink}\n\nThis link expires in 24 hours.`);
      }).catch(() => {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = resetLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Password reset link copied to clipboard!\n\nLink: ${resetLink}\n\nThis link expires in 24 hours.`);
      });
    }
  };

  // Fetch complete user profile when component mounts
  useEffect(() => {
    // Only fetch if we have a user ID and either:
    // 1. No fullUserProfile exists, OR
    // 2. The fullUserProfile doesn't have a profilePhotoUrl but the auth user does
    const shouldFetch = user?.id && (
      !fullUserProfile || 
      (!fullUserProfile.profilePhotoUrl && user?.userDetails?.profilePhotoUrl)
    );
    
    if (shouldFetch) {
      console.log('Fetching user profile for:', user.id);
      dispatch(fetchCurrentUserProfile(user.id));
    }
  }, [dispatch, user?.id, fullUserProfile?.profilePhotoUrl, user?.userDetails?.profilePhotoUrl]);

  // Use the complete user profile if available, otherwise fallback to auth user
  // Always prioritize the user with profile photo data
  const currentUser = user; // Start with auth user since it has the profile photo
  
  // Get profile photo URL from the correct source - prioritize auth user
  const profilePhotoUrl = user?.userDetails?.profilePhotoUrl || 
                          fullUserProfile?.profilePhotoUrl;

  // Create a normalized user object for components that expect the User interface
  const normalizedUser = currentUser ? {
    id: currentUser.id,
    email: currentUser.email,
    username: currentUser?.userDetails?.username,
    firstName: currentUser?.userDetails?.firstName,
    lastName: currentUser?.userDetails?.lastName,
    userType: currentUser?.userDetails?.userType || 'internal',
    status: currentUser?.userDetails?.status || 'active',
    role: currentUser.role,
    profilePhotoUrl: profilePhotoUrl,
    positionId: currentUser?.userDetails?.positionId,
    companyId: currentUser?.userDetails?.companyId,
    createdAt: currentUser?.userDetails?.createdAt,
    updatedAt: currentUser?.userDetails?.updatedAt,
    profileCompletedAt: currentUser?.userDetails?.profileCompletedAt,
  } : null;

  // If no user is logged in, redirect would happen at route level
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Desktop header content */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/logo.svg" 
                      alt="QSHE Logo" 
                      className="h-8 w-8"
                    />
                    <h1 className="text-xl font-semibold text-gray-900">
                      {currentProject?.name || 'QSHE'}
                    </h1>
                  </div>
                </div>

                {/* User menu */}
                <div className="flex items-center space-x-4">
                  {/* User profile dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded p-1"
                    >
                      <ProfileImage
                        src={profilePhotoUrl}
                        alt={`${currentUser?.userDetails?.firstName || ''} ${currentUser?.userDetails?.lastName || ''}`}
                        size="sm"
                        fallbackInitials={`${currentUser?.userDetails?.firstName?.[0] || ''}${currentUser?.userDetails?.lastName?.[0] || ''}`}
                      />
                      <span>{currentUser?.userDetails?.username || currentUser?.userDetails?.firstName || 'nithat.su'}</span>
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        {/* Session Status */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-green-700">Logged In</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Online</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <div className="font-medium">
                              {currentUser?.userDetails?.firstName} {currentUser?.userDetails?.lastName}
                            </div>
                            <div className="text-gray-500 mt-1">
                              {currentUser?.email}
                            </div>
                            {sessionInfo?.hasSession && (
                              <div className="mt-2 text-xs text-gray-400">
                                Session expires: {sessionInfo.expiresIn}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={handleUserProfileClick}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <div className="px-4 py-2 text-xs text-gray-500">
                          {getFormattedVersion()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 px-6 py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile logo and project name */}
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.svg" 
                alt="QSHE Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {currentProject?.name || 'QSHE'}
              </h1>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              {/* Online/Offline indicator */}
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </div>
              
              {/* User profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none p-1 rounded"
                >
                  <ProfileImage
                    src={profilePhotoUrl}
                    alt={`${currentUser?.userDetails?.firstName || ''} ${currentUser?.userDetails?.lastName || ''}`}
                    size="sm"
                    fallbackInitials={`${currentUser?.userDetails?.firstName?.[0] || ''}${currentUser?.userDetails?.lastName?.[0] || ''}`}
                  />
                  <span>{currentUser?.userDetails?.username || currentUser?.userDetails?.firstName || 'nithat.su'}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={handleUserProfileClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <div className="px-4 py-2 text-xs text-gray-500">
                      {getFormattedVersion()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="px-4 py-4 pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* User Profile Modal */}
      {showProfileModal && normalizedUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          user={normalizedUser}
          onClose={() => setShowProfileModal(false)}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* iOS Debug Panel - Triple tap to show */}
      <IOSDebugPanel
        isVisible={showDebug}
        onClose={() => setShowDebug(false)}
      />

      {/* Session Status Badge - Development only */}
      <SessionStatusBadge />
    </div>
  );
};