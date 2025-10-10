import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback 
}) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to access this feature.</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-gray-500">
            You don't have permission to access this feature.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Required role: {allowedRoles.join(' or ')}
          </p>
          <p className="text-sm text-gray-400">
            Your role: {user.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Convenience components for common role combinations
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['system_admin', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const SystemAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['system_admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Hook for checking user roles
export const useUserRole = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  const isManager = user?.role === 'admin' || user?.role === 'system_admin';
  
  return {
    user,
    role: user?.role,
    isSystemAdmin: user?.role === 'system_admin',
    isAdmin: user?.role === 'admin' || user?.role === 'system_admin',
    isManager,
    isSupervisor: user?.role === 'admin' || isManager,
    isMember: user?.role === 'member',
    isWorker: user?.role === 'worker',
    hasRole: (role: UserRole) => user?.role === role,
    hasAnyRole: (roles: UserRole[]) => 
      user ? roles.includes(user.role) : false,
  };
};
