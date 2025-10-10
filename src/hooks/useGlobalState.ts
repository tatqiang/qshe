/**
 * Global Hooks
 * 
 * Convenient hooks that combine global context with common patterns
 */

import { useAppContext, useCurrentProject, useCurrentUser } from '../contexts/AppContext';
import { ERROR_MESSAGES } from '../constants';

// Hook that provides project ID and handles missing project gracefully
export const useProjectId = (): string | null => {
  const currentProject = useCurrentProject();
  return currentProject?.id || null;
};

// Hook that provides user ID and handles missing user gracefully  
export const useUserId = (): string | null => {
  const currentUser = useCurrentUser();
  return currentUser?.id || null;
};

// Hook that ensures a project is selected, throws error if not
export const useRequiredProjectId = (): string => {
  const projectId = useProjectId();
  
  if (!projectId) {
    throw new Error(ERROR_MESSAGES.PROJECT_REQUIRED);
  }
  
  return projectId;
};

// Hook that ensures a user is logged in, throws error if not
export const useRequiredUserId = (): string => {
  const userId = useUserId();
  
  if (!userId) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  
  return userId;
};

// Hook that provides both project and user IDs, with fallbacks
export const useGlobalIds = () => {
  const projectId = useProjectId();
  const userId = useUserId();
  
  return {
    projectId,
    userId,
    hasProject: !!projectId,
    hasUser: !!userId,
    isReady: !!(projectId && userId),
  };
};

// Hook that provides organization context (for future multi-org support)
export const useOrganizationId = (): string | null => {
  const { organizationId } = useAppContext();
  return organizationId;
};

// Hook for components that need to show project selection UI
export const useProjectSelection = () => {
  const { project, setProject } = useAppContext();
  
  const selectProject = (newProject: any) => {
    setProject(newProject);
  };
  
  const clearProject = () => {
    setProject(null);
  };
  
  return {
    currentProject: project,
    hasProject: !!project,
    selectProject,
    clearProject,
  };
};

// Hook for authentication state management
export const useAuth = () => {
  const { user, setUser, clearAllData } = useAppContext();
  
  const login = (userData: any) => {
    setUser(userData);
  };
  
  const logout = () => {
    clearAllData();
  };
  
  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
};

// Hook that provides form defaults with global context
export const useFormDefaults = () => {
  const projectId = useProjectId();
  const userId = useUserId();
  
  return {
    projectId: projectId || '',
    createdBy: userId || '',
    patrolDate: new Date().toISOString().split('T')[0],
    patrolType: 'scheduled' as const,
    likelihood: 1 as const,
    severity: 1 as const,
    immediateHazard: false,
    workStopped: false,
  };
};

// Hook for debugging global state (development only)
export const useGlobalStateDebug = () => {
  const context = useAppContext();
  
  const logGlobalState = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Global State Debug:', {
        projectId: context.projectId,
        project: context.project,
        userId: context.userId,
        user: context.user,
        organizationId: context.organizationId,
        isReady: context.isReady,
      });
    }
  };
  
  return { logGlobalState };
};
