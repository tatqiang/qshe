import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Login } from './Login';
import { Registration } from './Registration';
import { IOSDebugPanel, useTripleTapDebug } from '../../debug/IOSDebugPanel';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { checkAuthStatus } from '../../../store/authSlice';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/invite/', '/register/', '/complete-profile', '/reset-password', '/public/'];

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [showRegistration, setShowRegistration] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // iOS Debug panel hook
  const { showDebug, setShowDebug } = useTripleTapDebug();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname.startsWith(route));
  
  console.log('🔍 AuthWrapper render:', { 
    isAuthenticated, 
    isLoading, 
    currentPath: location.pathname,
    isPublicRoute 
  });
  
  // Special handling for profile completion - check for valid stored state
  const isProfileCompletionWithStoredState = () => {
    if (!location.pathname.startsWith('/complete-profile')) return false;
    
    try {
      // Check URL for token parameter
      const urlParams = new URLSearchParams(location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        // Check if we have stored state for this token
        const storageKey = `profileCompletion_${urlToken}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          console.log('🔍 AuthWrapper: Found stored profile completion state for token');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('AuthWrapper: Error checking stored profile state:', error);
      return false;
    }
  };

  // Treat profile completion with stored state as always public
  const shouldBypassAuth = isPublicRoute || isProfileCompletionWithStoredState();

  useEffect(() => {
    console.log('🔍 [DEBUG] AuthWrapper useEffect triggered', { shouldBypassAuth, pathname: location.pathname });
    
    // Only check auth status if not on public route or profile completion with stored state
    if (!shouldBypassAuth) {
      console.log('🔍 [DEBUG] Dispatching checkAuthStatus...');
      dispatch(checkAuthStatus());
    } else {
      console.log('🔍 [DEBUG] Bypassing auth check (public route)');
    }
  }, [dispatch, shouldBypassAuth]);

  // Always render children for public routes or profile completion with stored state
  if (shouldBypassAuth) {
    console.log('🚪 AuthWrapper: Bypassing auth check for:', location.pathname);
    return <>{children}</>;
  }

  // Show loading spinner while checking auth (only for protected routes)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, clear any saved redirect path (login flow complete)
  if (isAuthenticated) {
    const savedPath = sessionStorage.getItem('redirect_after_login');
    if (savedPath) {
      console.log('✅ User authenticated, clearing saved redirect path:', savedPath);
      sessionStorage.removeItem('redirect_after_login');
    }
  }

  // Show login/registration if not authenticated
  if (!isAuthenticated) {
    // Save current path for redirect after login
    // CRITICAL: Only save if:
    // 1. Not already on login page
    // 2. Not already in the middle of a login flow (no existing saved path)
    // This prevents infinite redirect loops
    const existingSavedPath = sessionStorage.getItem('redirect_after_login');
    if (location.pathname !== '/' && 
        location.pathname !== '/login' && 
        !existingSavedPath) {
      const fullPath = location.pathname + location.search + location.hash;
      console.log('💾 Saving redirect path for after login:', fullPath);
      sessionStorage.setItem('redirect_after_login', fullPath);
    } else if (existingSavedPath) {
      console.log('⏸️ Already have saved path, not overwriting:', existingSavedPath);
    }
    
    console.log('🔐 AuthWrapper: User not authenticated, showing login page', { 
      isAuthenticated, 
      isLoading, 
      showRegistration,
      currentPath: location.pathname,
      savedRedirectPath: existingSavedPath
    });
    
    return (
      <>
        {showRegistration ? (
          <Registration onBackToLogin={() => setShowRegistration(false)} />
        ) : (
          <Login onNavigateToRegister={() => setShowRegistration(true)} />
        )}
        
        {/* iOS Debug Panel for login issues */}
        <IOSDebugPanel
          isVisible={showDebug}
          onClose={() => setShowDebug(false)}
        />
      </>
    );
  }

  // Show main app if authenticated
  return <>{children}</>;
};
