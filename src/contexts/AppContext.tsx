/**
 * Global App Context
 * 
 * Provides global state management for:
 * - Current User ID
 * - Selected Project ID and Project Data
 * - Other app-wide state variables
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppSelector } from '../hooks/redux';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  project_manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AppContextType {
  // User State
  userId: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Project State
  projectId: string | null;
  project: Project | null;
  setProject: (project: Project | null) => void;
  
  // Organization/Company State (for future expansion)
  organizationId: string | null;
  setOrganizationId: (id: string | null) => void;
  
  // Utility functions
  clearAllData: () => void;
  isReady: boolean; // True when initial data is loaded
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  USER: 'app-user',
  PROJECT: 'selected-project',
  ORGANIZATION: 'organization-id'
} as const;

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Redux state integration
  const authUser = useAppSelector((state) => state.auth.user);
  
  // State
  const [user, setUserState] = useState<User | null>(null);
  const [project, setProjectState] = useState<Project | null>(null);
  const [organizationId, setOrganizationIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load initial data from localStorage
  useEffect(() => {
    const loadInitialData = () => {
      try {
        // Load user
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserState(userData);
          console.log('✅ AppContext: Loaded user from localStorage:', userData);
        }

        // Load project
        const storedProject = localStorage.getItem(STORAGE_KEYS.PROJECT);
        if (storedProject) {
          const projectData = JSON.parse(storedProject);
          setProjectState(projectData);
          console.log('✅ AppContext: Loaded project from localStorage:', projectData);
        }

        // Load organization
        const storedOrganization = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
        if (storedOrganization) {
          setOrganizationIdState(storedOrganization);
          console.log('✅ AppContext: Loaded organization from localStorage:', storedOrganization);
        }

        setIsReady(true);
        console.log('✅ AppContext: Initial data loaded successfully');
      } catch (error) {
        console.error('❌ AppContext: Failed to load initial data:', error);
        setIsReady(true); // Still mark as ready even if loading failed
      }
    };

    loadInitialData();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          setUserState(userData);
          console.log('🔄 AppContext: User updated from storage change:', userData);
        } catch (error) {
          console.error('❌ AppContext: Failed to parse user from storage change:', error);
        }
      } else if (e.key === STORAGE_KEYS.PROJECT && e.newValue) {
        try {
          const projectData = JSON.parse(e.newValue);
          setProjectState(projectData);
          console.log('🔄 AppContext: Project updated from storage change:', projectData);
        } catch (error) {
          console.error('❌ AppContext: Failed to parse project from storage change:', error);
        }
      } else if (e.key === STORAGE_KEYS.ORGANIZATION && e.newValue) {
        setOrganizationIdState(e.newValue);
        console.log('🔄 AppContext: Organization updated from storage change:', e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events (same tab updates)
    const handleProjectChange = () => {
      const storedProject = localStorage.getItem(STORAGE_KEYS.PROJECT);
      if (storedProject) {
        try {
          const projectData = JSON.parse(storedProject);
          setProjectState(projectData);
          console.log('🔄 AppContext: Project updated from custom event:', projectData);
        } catch (error) {
          console.error('❌ AppContext: Failed to parse project from custom event:', error);
        }
      } else {
        setProjectState(null);
        console.log('🔄 AppContext: Project cleared from custom event');
      }
    };

    window.addEventListener('project-changed', handleProjectChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-changed', handleProjectChange);
    };
  }, []);

  // Sync with Redux auth state
  useEffect(() => {
    if (authUser && authUser.userDetails) {
      // Convert Redux auth user to our global context User format
      // Map database fields (first_name, last_name) to context fields (firstName, lastName)
      const contextUser: User = {
        id: authUser.id,
        firstName: authUser.userDetails.firstName || '',
        lastName: authUser.userDetails.lastName || '',
        name: `${authUser.userDetails.firstName || ''} ${authUser.userDetails.lastName || ''}`.trim() || undefined,
        email: authUser.email,
        role: authUser.userDetails.role || 'member',
        created_at: authUser.userDetails.createdAt || new Date().toISOString(),
        updated_at: authUser.userDetails.updatedAt || new Date().toISOString()
      };
      
      console.log('AppContext: authUser.userDetails:', authUser.userDetails);
      console.log('AppContext: contextUser created:', contextUser);
      
      // Only update if different from current user
      if (!user || user.id !== contextUser.id || user.email !== contextUser.email) {
        console.log('🔄 AppContext: Syncing user from Redux auth state:', contextUser);
        setUser(contextUser);
      }
    } else if (authUser === null && user !== null) {
      // User logged out in Redux, clear global context
      console.log('🔄 AppContext: Clearing user due to Redux logout');
      setUser(null);
    }
  }, [authUser, user]);

  // Wrapper functions with localStorage persistence
  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      console.log('💾 AppContext: User saved to localStorage:', userData);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      console.log('🗑️ AppContext: User removed from localStorage');
    }
  };

  const setProject = (projectData: Project | null) => {
    setProjectState(projectData);
    if (projectData) {
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(projectData));
      console.log('💾 AppContext: Project saved to localStorage:', projectData);
      
      // Dispatch custom event for backwards compatibility
      window.dispatchEvent(new CustomEvent('project-changed', { detail: projectData }));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROJECT);
      console.log('🗑️ AppContext: Project removed from localStorage');
      
      // Dispatch custom event for backwards compatibility
      window.dispatchEvent(new CustomEvent('project-changed', { detail: null }));
    }
  };

  const setOrganizationId = (id: string | null) => {
    setOrganizationIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZATION, id);
      console.log('💾 AppContext: Organization ID saved to localStorage:', id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
      console.log('🗑️ AppContext: Organization ID removed from localStorage');
    }
  };

  const clearAllData = () => {
    setUserState(null);
    setProjectState(null);
    setOrganizationIdState(null);
    
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PROJECT);
    localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
    
    console.log('🧹 AppContext: All data cleared');
  };

  // Context value
  const contextValue: AppContextType = {
    // User
    userId: user?.id || null,
    user,
    setUser,
    
    // Project
    projectId: project?.id || null,
    project,
    setProject,
    
    // Organization
    organizationId,
    setOrganizationId,
    
    // Utilities
    clearAllData,
    isReady
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Convenience hooks for specific values
export const useUserId = () => {
  const { userId } = useAppContext();
  return userId;
};

export const useProjectId = () => {
  const { projectId } = useAppContext();
  return projectId;
};

export const useCurrentProject = () => {
  const { project } = useAppContext();
  return project;
};

export const useCurrentUser = () => {
  const { user } = useAppContext();
  return user;
};

// Helper function for components that need to ensure a project is selected
export const useRequireProject = () => {
  const { project, projectId } = useAppContext();
  
  if (!project || !projectId) {
    throw new Error('This component requires a project to be selected');
  }
  
  return { project, projectId };
};

// Helper function for components that need to ensure a user is logged in
export const useRequireUser = () => {
  const { user, userId } = useAppContext();
  
  if (!user || !userId) {
    throw new Error('This component requires a user to be logged in');
  }
  
  return { user, userId };
};
