import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/api/supabase';
import type { User, UserRegistrationData } from '../types';

interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

// Mock data helpers (fallback for development)
const getMockUsers = (): User[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('qshe_mock_users');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return INITIAL_MOCK_USERS;
};

const saveMockUsers = (users: User[]) => {
  if (typeof window !== 'undefined') {
    console.log('saveMockUsers called with:', users.length, 'users');
    console.log('Users being saved:', users.map(u => ({ email: u.email, id: u.id })));
    try {
      localStorage.setItem('qshe_mock_users', JSON.stringify(users));
      console.log('Successfully saved to localStorage');
      
      // Verify the save worked
      const verification = localStorage.getItem('qshe_mock_users');
      if (verification) {
        const parsed = JSON.parse(verification);
        console.log('Verification - saved users count:', parsed.length);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  } else {
    console.log('saveMockUsers: window not available');
  }
};

// Initial mock users
const INITIAL_MOCK_USERS: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    positionId: 1, // Changed from position to positionId
    userType: 'internal',
    role: 'admin',
    status: 'active',
    companyId: 'comp1',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@contractor.com',
    positionId: 2, // Changed from position to positionId
    userType: 'external',
    role: 'member',
    status: 'active',
    companyId: 'comp2',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    positionId: 3, // Changed from position to positionId
    userType: 'external', // Changed from 'worker' to 'external'
    role: 'worker', // Keep worker as role
    status: 'invited',
    companyId: 'comp1',
    createdAt: new Date('2024-01-25').toISOString(),
    updatedAt: new Date('2024-01-25').toISOString(),
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    positionId: 4, // Changed from position to positionId
    userType: 'internal',
    role: 'member',
    status: 'active',
    companyId: 'comp1',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@contractor.com',
    positionId: 5, // Changed from position to positionId
    userType: 'external',
    role: 'worker',
    status: 'inactive',
    companyId: 'comp3',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
];

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured, using mock data');
        return getMockUsers();
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          positions!position_id (
            id,
            position_title,
            code,
            level
          )
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 Supabase query result:', { 
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
        dataCount: data?.length || 0,
        sampleData: data?.[0] || null
      });

      if (error) {
        console.warn('Supabase error, falling back to mock data:', error);
        return getMockUsers();
      }

      // Debug: Log raw face data from database
      console.log('🧪 Raw face data from database:');
      data?.forEach((user: any, index: number) => {
        if (user.face_descriptors) {
          console.log(`  ${index + 1}. ${user.first_name} ${user.last_name}:`, {
            faceDescriptorsType: typeof user.face_descriptors,
            faceDescriptors: user.face_descriptors,
            hasDescriptor: !!user.face_descriptors?.descriptor,
            hasFaceDescriptor: !!user.face_descriptors?.face_descriptor,
            descriptorLength: user.face_descriptors?.descriptor?.length || 0,
            faceDescriptorLength: user.face_descriptors?.face_descriptor?.length || 0
          });
        }
      });

      // Transform Supabase data to match our User interface
      const transformedUsers: User[] = (data || []).map(user => {
        const userData = user as any; // Cast to bypass TypeScript issues
        const position = userData.positions; // Position data from join
        
        return {
          id: userData.id,
          email: userData.email,
          username: userData.username || userData.email?.split('@')[0] || undefined, // ✅ FIX: Add username mapping
          firstName: userData.first_name,
          lastName: userData.last_name,
          positionId: userData.position_id || undefined,
          positionTitle: userData.job_title || position?.position_title || undefined, // ✅ FIX: Use job_title first, then positions join
          positionCode: position?.code || undefined, // From positions join (fixed column name)
          positionLevel: position?.level || undefined, // From positions join
          userType: userData.user_type,
          role: userData.role || 'member',
          status: userData.status,
          profilePhotoUrl: userData.profile_photo_url || undefined,
          companyId: userData.company_id || undefined,
          // ✅ FIX: Properly handle face_descriptors from database
          faceDescriptors: (() => {
            if (!userData.face_descriptors) {
              return undefined;
            }
            
            // Only log for first user to avoid spam
            const shouldLog = userData.first_name === 'Kan Viyatat';
            if (shouldLog) {
              console.log(`🔬 Processing face data for ${userData.first_name} ${userData.last_name}:`, userData.face_descriptors);
            }
            
            // Handle different face data formats
            const faceData = userData.face_descriptors;
            
            // Format 1: Direct descriptor array
            if (faceData.descriptor && Array.isArray(faceData.descriptor)) {
              if (shouldLog) console.log(`  ✅ Found descriptor field (length: ${faceData.descriptor.length})`);
              return [new Float32Array(faceData.descriptor)];
            }
            
            // Format 2: face_descriptor field
            if (faceData.face_descriptor && Array.isArray(faceData.face_descriptor)) {
              if (shouldLog) console.log(`  ✅ Found face_descriptor field (length: ${faceData.face_descriptor.length})`);
              return [new Float32Array(faceData.face_descriptor)];
            }
            
            // Format 3: Already an array of descriptors
            if (Array.isArray(faceData) && faceData.length > 0 && faceData[0].descriptor) {
              if (shouldLog) console.log(`  ✅ Found nested descriptor in array[0] (length: ${faceData[0].descriptor.length})`);
              return [new Float32Array(faceData[0].descriptor)];
            }
            
            // Format 4: Direct array of Float32Array-like objects (most common case)
            if (Array.isArray(faceData) && faceData.length > 0) {
              const firstDescriptor = faceData[0];
              // Check if it's a Float32Array-like object with numeric values
              if (firstDescriptor && typeof firstDescriptor === 'object' && 
                  (firstDescriptor.length === 128 || Object.keys(firstDescriptor).length === 128)) {
                if (shouldLog) console.log(`  ✅ Found direct descriptor array (length: ${firstDescriptor.length || Object.keys(firstDescriptor).length})`);
                // Convert object with numeric indices to proper array
                const descriptorArray = Array.isArray(firstDescriptor) 
                  ? firstDescriptor 
                  : Object.values(firstDescriptor).filter(v => typeof v === 'number');
                
                if (descriptorArray.length === 128) {
                  return [new Float32Array(descriptorArray)];
                }
              }
            }
            
            // Only log errors for first few users to avoid spam
            if (shouldLog) {
              console.warn(`  ❌ User ${userData.email} has face_descriptors but no valid descriptor:`, faceData);
            }
            return undefined;
          })(),
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        };
      });

      // Debug: Summary of transformation results
      const usersWithFaceData = transformedUsers.filter(u => u.faceDescriptors);
      console.log(`📊 Transformation complete: ${transformedUsers.length} total users, ${usersWithFaceData.length} with face data`);
      
      usersWithFaceData.forEach(user => {
        console.log(`  ✅ ${user.firstName} ${user.lastName}: ${user.faceDescriptors?.[0]?.length || 0} descriptor values`);
      });

      return transformedUsers;
    } catch (error) {
      console.warn('Database connection failed, using mock data:', error);
      return getMockUsers();
    }
  }
);

export const fetchCurrentUserProfile = createAsyncThunk(
  'users/fetchCurrentUserProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Since we're removing Supabase dependencies, return a mock user profile
      // In the future, this should call your Azure SQL Database API
      console.log('📱 Mock user profile fetch for userId:', userId);
      
      const mockUserProfile = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Demo',
        last_name: 'User',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return mockUserProfile;
    } catch (error) {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

// Helper function to generate username from user data
function generateUsernameFromData(userData: any): string {
  if (userData.email && userData.email.trim()) {
    // If email exists, use email prefix
    return userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
  } else if (userData.firstName && userData.lastName) {
    // If no email, generate from name
    const firstName = userData.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastNameInitial = userData.lastName.charAt(0).toLowerCase();
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    return `${firstName}.${lastNameInitial}${timestamp}`;
  } else {
    // Fallback
    return `user_${Date.now().toString().slice(-6)}`;
  }
}

// Helper function to generate unique email for external users without email
function generateUniqueEmail(userData: any): string {
  if (userData.userType === 'external' || userData.userType === 'worker') {
    // For external users, generate a unique temp email
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    const firstName = userData.firstName ? userData.firstName.toLowerCase().replace(/[^a-z]/g, '') : 'user';
    return `${firstName}_${timestamp}_${random}@external.temp`;
  } else {
    // For internal users, this should not happen but provide fallback
    return `internal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@temp.local`;
  }
}

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: UserRegistrationData & { firstNameThai?: string; lastNameThai?: string; nationality?: string }, { rejectWithValue }) => {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Use mock data for development
        const mockUsers = getMockUsers();
        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          positionId: userData.positionId,
          userType: userData.userType,
          role: userData.role || 'member',
          status: 'invited',
          companyId: userData.companyId || 'default-company',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const updatedUsers = [newUser, ...mockUsers];
        saveMockUsers(updatedUsers);
        return newUser;
      }

      // Use supabase client without typing restrictions to bypass Database type issues
      const supabaseGeneric = supabase as any;
      const { data, error } = await supabaseGeneric
        .from('users')
        .insert({
          email: userData.email && userData.email.trim() ? userData.email.trim() : generateUniqueEmail(userData), // Generate unique email if empty
          username: userData.username || generateUsernameFromData(userData), // Use provided username or generate one
          first_name: userData.firstName,
          last_name: userData.lastName,
          first_name_thai: userData.firstNameThai || null, // Include Thai first name
          last_name_thai: userData.lastNameThai || null, // Include Thai last name
          nationality: (userData as any).nationality || null, // Include nationality field
          position_id: userData.positionId || null,
          user_type: userData.userType,
          role: userData.role || 'member',
          company_id: userData.companyId || null, // Use null instead of undefined
          status: 'invited' // Use 'invited' status for admin-created users
        })
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Cast to any to bypass TypeScript issues with Database types
      const userData_any = data as any;

      // Transform back to our User interface
      const transformedUser: User = {
        id: userData_any.id,
        email: userData_any.email,
        username: userData_any.username,
        firstName: userData_any.first_name,
        lastName: userData_any.last_name,
        positionId: userData_any.position_id,
        userType: userData_any.user_type,
        role: userData_any.role,
        status: userData_any.status,
        profilePhotoUrl: userData_any.profile_photo_url || undefined,
        companyId: userData_any.company_id || undefined,
        invitationToken: userData_any.invitation_token || undefined,
        invitedBy: userData_any.invited_by || undefined,
        invitationExpiresAt: userData_any.invitation_expires_at || undefined,
        profileCompletedAt: userData_any.profile_completed_at || undefined,
        createdAt: userData_any.created_at,
        updatedAt: userData_any.updated_at,
      };

      return transformedUser;
    } catch (error) {
      return rejectWithValue('Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk<User, { id: string; updates: Partial<User> }>(
  'users/updateUser',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      // Prepare update data with only the fields we want to update
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Only add fields that are actually being updated
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.userType !== undefined) updateData.user_type = updates.userType;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
      if (updates.profilePhotoUrl !== undefined) updateData.profile_photo_url = updates.profilePhotoUrl;

      // Use supabase client without typing restrictions
      const supabaseGeneric = supabase as any;
      const { data, error } = await supabaseGeneric
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Cast to any to bypass TypeScript issues with Database types
      const data_any = data as any;

      // Transform the database response to match our User type
      const transformedUser: User = {
        id: data_any.id,
        email: data_any.email,
        username: data_any.username,
        firstName: data_any.first_name,
        lastName: data_any.last_name,
        userType: data_any.user_type,
        role: data_any.role,
        status: data_any.status,
        profilePhotoUrl: data_any.profile_photo_url,
        companyId: data_any.company_id,
        positionId: data_any.position_id,
        invitationToken: data_any.invitation_token,
        invitedBy: data_any.invited_by,
        invitationExpiresAt: data_any.invitation_expires_at,
        profileCompletedAt: data_any.profile_completed_at,
        createdAt: data_any.created_at,
        updatedAt: data_any.updated_at,
        faceDescriptors: data_any.face_descriptors
      };

      return transformedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return rejectWithValue(error.message);
      }

      return userId;
    } catch (error) {
      return rejectWithValue('Failed to delete user');
    }
  }
);

// User registration completion with Supabase integration
export const completeUserRegistration = createAsyncThunk(
  'users/completeUserRegistration',
  async (userData: UserRegistrationData & { faceData?: string }, { rejectWithValue }) => {
    try {
      // Since we're using mock authentication, always use mock data for user creation
      // Real Supabase user creation requires going through Supabase Auth first
      console.log('Creating user with mock data (Supabase requires Auth integration)');
      console.log('Registration userData:', { 
        ...userData, 
        password: userData.password ? '[PRESENT]' : '[MISSING]',
        passwordLength: userData.password ? userData.password.length : 0
      });
      
      const mockUsers = getMockUsers();
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        positionId: userData.positionId,
        userType: userData.userType,
        role: userData.role || 'member',
        status: 'active',
        profilePhotoUrl: userData.faceData,
        companyId: userData.companyId === 'default-company' ? undefined : userData.companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Store the password separately for authentication
      const userWithPassword = {
        ...newUser,
        password: userData.password // Add password for mock authentication
      };
      
      console.log('Storing user with password:', { 
        email: userWithPassword.email, 
        hasPassword: !!userWithPassword.password,
        passwordLength: userWithPassword.password ? userWithPassword.password.length : 0
      });
      
      const updatedUsers = [userWithPassword, ...mockUsers];
      saveMockUsers(updatedUsers);
      
      console.log('Saved users to localStorage:', updatedUsers.map(u => ({ 
        email: u.email, 
        hasPassword: !!(u as any).password 
      })));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      return rejectWithValue('Failed to complete user registration');
    }
  }
);

// Initial state with mock data for testing
const initialState: UsersState = {
  users: getMockUsers(),
  currentUser: null,
  isLoading: false,
  error: null,
};

// Users slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    // Temporary action for testing face recognition
    updateUsersForTesting: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      console.log('🧪 Updated users for testing:', action.payload.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        hasFaceDescriptors: !!u.faceDescriptors?.length
      })));
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users cases
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch current user profile cases
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload as unknown as User;
      })
      
      // Create user cases
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user cases
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      
      // Delete user cases
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      
      // Complete user registration cases
      .addCase(completeUserRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeUserRegistration.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.users = [action.payload, ...state.users];
        state.error = null;
      })
      .addCase(completeUserRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentUser, updateUsersForTesting } = usersSlice.actions;
export default usersSlice.reducer;
