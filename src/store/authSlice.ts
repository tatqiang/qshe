import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/api/supabase';
import { sessionManager } from '../lib/auth/sessionManager';
import type { AuthUser, AuthState, LoginCredentials, Database, UserRole } from '../types';

// Mock users for development testing
const MOCK_USERS = [
  {
    id: 'admin-001',
    email: 'admin@qshe.com',
    username: 'admin',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    userType: 'internal' as const,
    status: 'active' as const,
    role: 'system_admin' as const,
  },
  {
    id: '1',
    email: 'john.doe@example.com',
    username: 'john.doe',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'internal' as const,
    status: 'active' as const,
    role: 'admin' as const,
  },
  {
    id: '2',
    email: 'sarah.wilson@contractor.com',
    username: 'sarah.w',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Wilson',
    userType: 'external' as const,
    status: 'active' as const,
    role: 'member' as const,
  },
  {
    id: '3',
    email: 'mike.johnson@example.com',
    username: 'mike.j',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Johnson',
    userType: 'worker' as const,
    status: 'pending_completion' as const,
    role: 'member' as const,
  },
];

// Development mode flag - set to true for mock authentication
const USE_MOCK_AUTH = false; // Use Supabase authentication

// Mock authentication function
const mockLogin = async (credentials: LoginCredentials): Promise<AuthUser> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('MockLogin: Attempting login with:', { username: credentials.username, passwordLength: credentials.password.length });
  
  // First check the static MOCK_USERS (by username if available, fallback to email)
  const staticUser = MOCK_USERS.find(u => 
    (u.username === credentials.username || u.email === credentials.username) && u.password === credentials.password
  );
  
  if (staticUser) {
    console.log('MockLogin: Found static user:', staticUser.email);
    return {
      id: staticUser.id,
      email: staticUser.email,
      role: staticUser.role,
      userDetails: {
        id: staticUser.id,
        firstName: staticUser.firstName,
        lastName: staticUser.lastName,
        email: staticUser.email,
        userType: staticUser.userType as 'internal' | 'external',
        status: 'active', // Updated status value
        role: 'system_admin',
        positionId: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  }
  
  // Check dynamically created users from registration
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('qshe_mock_users');
    console.log('MockLogin: Checking localStorage for qshe_mock_users:', stored ? 'Found data' : 'No data');
    
    if (stored) {
      try {
        const dynamicUsers = JSON.parse(stored);
        console.log('MockLogin: Parsed dynamic users:', dynamicUsers.map((u: any) => ({ 
          username: u.username, 
          email: u.email, 
          hasPassword: !!u.password 
        })));
        
        const dynamicUser = dynamicUsers.find((u: any) => 
          (u.username === credentials.username || u.email === credentials.username) && u.password === credentials.password
        );
        
        if (dynamicUser) {
          console.log('MockLogin: Found dynamic user:', dynamicUser.username || dynamicUser.email);
          return {
            id: dynamicUser.id,
            email: dynamicUser.email,
            role: 'member', // Default role for registered users
            userDetails: dynamicUser
          };
        } else {
          console.log('MockLogin: No matching dynamic user found');
        }
      } catch (error) {
        console.warn('Error parsing stored users:', error);
      }
    }
  }
  
  console.log('MockLogin: No user found - throwing error');
  throw new Error('Invalid username or password');
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('loginUser called with USE_MOCK_AUTH:', USE_MOCK_AUTH);
      
      // Use mock authentication in development mode
      if (USE_MOCK_AUTH) {
        console.log('Using mock authentication');
        return await mockLogin(credentials);
      }

      console.log('Using Supabase authentication');
      
      // Since we're now using username-based login, we need to:
      // 1. Find the user by username in the users table
      // 2. Get their email for Supabase Auth
      // 3. Then authenticate with email/password
      
      const { data: userRecord, error: userLookupError } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .single();
      
      if (userLookupError || !userRecord) {
        console.log('User lookup failed:', userLookupError);
        return rejectWithValue('Invalid username or password');
      }
      
      console.log('Found user by username:', userRecord);
      
      // Try Supabase Auth with the found user's email
      if ((userRecord as any).email) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: (userRecord as any).email,
          password: credentials.password,
        });

        if (data.user && !error) {
          console.log('Supabase Auth login successful');
          // Use the userRecord we already fetched
          const userProfile = userRecord;

          console.log('Raw userProfile from database:', userProfile);
          console.log('UserProfile first_name:', (userProfile as any)?.first_name);
          console.log('UserProfile last_name:', (userProfile as any)?.last_name);

          type UserProfileRow = Database['public']['Tables']['users']['Row'];

          // Map authority level to role for backwards compatibility
          const mapAuthorityToRole = (authorityLevel: string): UserRole => {
            // If it's already a valid UserRole, return as-is
            const validRoles: UserRole[] = ['system_admin', 'admin', 'member', 'worker'];
            if (validRoles.includes(authorityLevel as UserRole)) {
              return authorityLevel as UserRole;
            }
            
            // Legacy mapping for old values (map removed roles to simplified ones)
            switch (authorityLevel) {
              case 'manager':
              case 'project_manager':
              case 'site_manager':
              case 'qshe_manager':
              case 'supervisor':
                return 'admin'; // Map all management roles to admin
              default:
                return 'member';
            }
          };

          const userAuthorityLevel = (userProfile as any)?.role || 'member';
          const userRole = mapAuthorityToRole(userAuthorityLevel);

          console.log('Role from DB:', userAuthorityLevel);
          console.log('Mapped role:', userRole);

          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email!,
            role: userRole,
            userDetails: userProfile ? {
              id: (userProfile as UserProfileRow).id,
              firstName: (userProfile as UserProfileRow).first_name,
              lastName: (userProfile as UserProfileRow).last_name,
              email: (userProfile as UserProfileRow).email,
              userType: (userProfile as UserProfileRow).user_type,
              status: (userProfile as UserProfileRow).status,
              role: userRole,
              positionId: undefined, // Will be set when positions are integrated
              createdAt: (userProfile as UserProfileRow).created_at,
              updatedAt: (userProfile as UserProfileRow).updated_at,
            } : undefined,
          };

          return authUser;
        }
      }

      // If Supabase Auth fails, try database-only authentication for web-registered users
      console.log('Supabase Auth not available for this user, trying database-only authentication');
      console.log('Looking for user with username:', credentials.username);
      
      // First, let's check if any users exist with this username (without status filter)
      // Use (supabase as any) to bypass potential TypeScript issues
      const { data: allUsersWithUsername, error: checkError } = await (supabase as any)
        .from('users')
        .select('id, username, email, status, role')
        .eq('username', credentials.username);

      console.log('All users found with this username:', allUsersWithUsername);
      console.log('Check error:', checkError);

      // Now try to get active user with explicit type casting
      const { data: dbUserRecord, error: dbError } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results gracefully

      console.log('Active user query result:', dbUserRecord);
      console.log('Active user query error:', dbError);

      if (dbError) {
        console.error('Database query error:', dbError);
        return rejectWithValue(`Database error: ${dbError.message}`);
      }

      if (!dbUserRecord) {
        console.error('No active user found with username:', credentials.username);
        // Check if user exists but is not active
        if (allUsersWithUsername && allUsersWithUsername.length > 0) {
          const userStatus = allUsersWithUsername[0].status;
          console.log('User exists but status is:', userStatus);
          return rejectWithValue(`Account exists but status is: ${userStatus}. Please contact administrator.`);
        }
        return rejectWithValue('No account found with this username');
      }

      // For database-only users (web registered), create auth response
      console.log('Found database user, allowing login for web-registered user:', (dbUserRecord as any).username || (dbUserRecord as any).email);
      
      type UserProfileRow = Database['public']['Tables']['users']['Row'];

      // Map authority level to role for backwards compatibility
      const mapAuthorityToRole = (authorityLevel: string): UserRole => {
        // If it's already a valid UserRole, return as-is
        const validRoles: UserRole[] = ['system_admin', 'admin', 'member', 'worker'];
        if (validRoles.includes(authorityLevel as UserRole)) {
          return authorityLevel as UserRole;
        }
        
        // Legacy mapping for old values (map removed roles to simplified ones)
        switch (authorityLevel) {
          case 'manager':
          case 'project_manager':
          case 'site_manager':
          case 'qshe_manager':
          case 'supervisor':
            return 'admin'; // Map all management roles to admin
          default:
            return 'member';
        }
      };

      const userAuthorityLevel = (dbUserRecord as any).role || 'member';
      const userRole = mapAuthorityToRole(userAuthorityLevel);

      console.log('Database user role from DB:', userAuthorityLevel);
      console.log('Database user mapped role:', userRole);
      console.log('Database userRecord first_name:', (dbUserRecord as any).first_name);
      console.log('Database userRecord last_name:', (dbUserRecord as any).last_name);

      const authUser: AuthUser = {
        id: (dbUserRecord as any).id,
        email: (dbUserRecord as any).email,
        role: userRole,
        userDetails: {
          id: (dbUserRecord as UserProfileRow).id,
          firstName: (dbUserRecord as UserProfileRow).first_name,
          lastName: (dbUserRecord as UserProfileRow).last_name,
          email: (dbUserRecord as UserProfileRow).email,
          userType: (dbUserRecord as UserProfileRow).user_type,
          status: (dbUserRecord as UserProfileRow).status,
          role: userAuthorityLevel,
          positionId: undefined, // Will be set when positions are integrated
          createdAt: (dbUserRecord as UserProfileRow).created_at,
          updatedAt: (dbUserRecord as UserProfileRow).updated_at,
        },
      };

      return authUser;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unexpected error occurred');
    }
  }
);

// Fixed username-based authentication
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { email: string; password: string; firstName: string; lastName: string }, { rejectWithValue }) => {
    try {
      // Use mock registration in development mode
      if (USE_MOCK_AUTH) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists
        const existingUser = MOCK_USERS.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('User already exists with this email');
        }
        
        // Create new mock user
        const newUser: AuthUser = {
          id: Date.now().toString(), // Simple ID generation for mock
          email: userData.email,
          role: 'member',
          userDetails: {
            id: Date.now().toString(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            userType: 'internal',
            status: 'pending_completion',
            role: 'member',
            positionId: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
        
        return newUser;
      }

      // Production Supabase registration
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: 'internal',
            status: 'pending'
          } as any);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return rejectWithValue('Failed to create user profile');
        }

        return {
          id: data.user.id,
          email: data.user.email!,
          role: 'member' as const,
        };
      }

      return rejectWithValue('Registration failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unexpected error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 logoutUser: Starting logout process');
      
      // 1. Clear session manager first (most important)
      sessionManager.clearSession();
      console.log('✅ logoutUser: Session manager cleared');

      // 2. Clear localStorage items
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('✅ logoutUser: LocalStorage cleared');
      } catch (e) {
        console.warn('⚠️ localStorage clear error:', e);
      }

      // 3. Try Azure AD logout (if applicable) - don't wait for it
      try {
        const { azureAuthService } = await import('../lib/auth/azureAuthService');
        if (azureAuthService.isLoggedIn()) {
          console.log('� logoutUser: Azure AD logout detected');
          // Note: Azure logout will redirect, so this may not complete
          azureAuthService.logout().catch(err => {
            console.warn('⚠️ Azure logout error (non-blocking):', err);
          });
        }
      } catch (azureError) {
        console.warn('⚠️ Azure check/logout failed (non-critical):', azureError);
      }
      
      // 4. Try Supabase logout (if applicable)
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('⚠️ Supabase logout error (non-critical):', error.message);
        } else {
          console.log('✅ logoutUser: Supabase session cleared');
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase logout failed (non-critical):', supabaseError);
      }

      console.log('✅ logoutUser: Logout completed');
      return true;
    } catch (error) {
      console.error('❌ logoutUser: Logout error:', error);
      // Even on error, clear what we can
      sessionManager.clearSession();
      return rejectWithValue('Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // First try to restore from enhanced session manager
      const storedSession = sessionManager.restoreSession();
      if (storedSession) {
        console.log('✅ checkAuthStatus: Restored from session manager');
        // ✅ FIX: Extract the user object from session structure
        // Session manager returns { user, token, expiresAt } but we need just the user (AuthUser)
        const authUser = (storedSession as any).user || storedSession;
        console.log('✅ Extracted AuthUser:', authUser);
        return authUser as AuthUser;
      }

      // Fallback to Supabase session check with error handling
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('⚠️ Supabase session error:', error.message);
          // If it's a refresh token error, clear the session and continue
          if (error.message.includes('refresh') || error.message.includes('token')) {
            console.log('🧹 Clearing invalid Supabase session');
            await supabase.auth.signOut();
            return null;
          }
          return rejectWithValue(error.message);
        }

        if (session?.user) {
          // Fetch user profile
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn('Could not fetch user profile:', profileError);
          }

          // Map authority level to role for backwards compatibility
          const mapAuthorityToRole = (authorityLevel: string): UserRole => {
            // If it's already a valid UserRole, return as-is
            const validRoles: UserRole[] = ['system_admin', 'admin', 'member', 'worker'];
            if (validRoles.includes(authorityLevel as UserRole)) {
              return authorityLevel as UserRole;
            }
            
            // Legacy mapping for old values (map removed roles to simplified ones)
            switch (authorityLevel) {
              case 'manager':
              case 'project_manager':
              case 'site_manager':
              case 'qshe_manager':
              case 'supervisor':
                return 'admin'; // Map all management roles to admin
              default:
                return 'member';
            }
          };

          const userAuthorityLevel = (userProfile as any)?.role || 'member';
          const userRole = mapAuthorityToRole(userAuthorityLevel);

          console.log('checkAuthStatus - Role from DB:', userAuthorityLevel);
          console.log('checkAuthStatus - Mapped role:', userRole);

          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            role: userRole,
            userDetails: userProfile || undefined,
          };

          // Save to session manager for future restoration
          sessionManager.saveSession(authUser);

          return authUser;
        }
      } catch (supabaseError: any) {
        console.warn('⚠️ Supabase auth check failed:', supabaseError.message);
        // Clear any invalid session data
        try {
          await supabase.auth.signOut();
          console.log('🧹 Cleared invalid Supabase session after error');
        } catch (clearError) {
          console.warn('Could not clear Supabase session:', clearError);
        }
        // Don't throw error, just return null to allow fallback authentication
      }

      return null;
    } catch (error: any) {
      console.error('❌ checkAuthStatus error:', error);
      return rejectWithValue('Auth check failed');
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registrationSuccess: false,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registrationSuccess = false;
      
      // Clear persistent session
      sessionManager.clearSession();
      console.log('🧹 AuthSlice: All auth data cleared');
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
    setAzureUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
      
      // Save session
      sessionManager.saveSession(action.payload);
      console.log('✅ AuthSlice: Azure AD user set successfully');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        
        // Save session for persistent login
        sessionManager.saveSession(action.payload);
        console.log('🔐 AuthSlice: Session saved for persistent login');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Registration cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.registrationSuccess = true;
        state.error = null;
        // Don't auto-login on registration - user needs to manually login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.registrationSuccess = false;
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('🚪 AuthSlice: logoutUser.fulfilled - Clearing state');
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        
        // Clear persistent session
        sessionManager.clearSession();
        console.log('✅ AuthSlice: Session cleared on logout - isAuthenticated:', state.isAuthenticated);
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.error('❌ AuthSlice: logoutUser.rejected', action.payload);
        // Still clear the state even if logout API call failed
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        sessionManager.clearSession();
      })
      
      // Auth check cases
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearAuth, clearRegistrationSuccess, setAzureUser } = authSlice.actions;
export default authSlice.reducer;
