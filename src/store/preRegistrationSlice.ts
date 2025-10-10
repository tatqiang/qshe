import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/api/supabase';
import type { PreRegistration, PreRegistrationData } from '../types';

interface PreRegistrationState {
  preRegistrations: PreRegistration[];
  isLoading: boolean;
  error: string | null;
}

// Mock pre-registrations for development
const INITIAL_MOCK_PRE_REGISTRATIONS: PreRegistration[] = [
  {
    id: 'pre-001',
    email: 'alice.smith@example.com',
    userType: 'internal',
    invitedBy: 'admin-001',
    status: 'pending',
    invitationToken: 'token-001',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pre-002',
    email: 'bob.contractor@external.com',
    userType: 'external',
    invitedBy: 'admin-001',
    status: 'pending',
    invitationToken: 'token-002',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pre-003',
    email: 'completed@example.com',
    userType: 'internal',
    invitedBy: 'admin-001',
    status: 'registered',
    invitationToken: 'token-003',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    registeredAt: new Date().toISOString(),
  },
];

// Get mock data from localStorage or use initial data
const getMockPreRegistrations = (): PreRegistration[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('qshe_mock_preregistrations');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // If parsing fails, use initial data
      }
    }
  }
  return [...INITIAL_MOCK_PRE_REGISTRATIONS];
};

// Save mock data to localStorage
const saveMockPreRegistrations = (preRegistrations: PreRegistration[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('qshe_mock_preregistrations', JSON.stringify(preRegistrations));
  }
};

// Initialize mock data
let MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();

// Development mode flag
// Configuration: Use Supabase if configured, otherwise fall back to mock data
const USE_MOCK_DATA = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('PreRegistration USE_MOCK_DATA:', USE_MOCK_DATA, {
  url: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing'
});

// Generate invitation token
const generateInvitationToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Check for duplicate email in both users and pre_registrations tables
// Temporarily disabled due to 406 errors - database constraints will handle duplicates
/*
const checkForDuplicateEmail = async (email: string) => {
  try {
    // Check in users table
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (userData) return true;

    // Check in pre_registrations table
    const { data: preRegData } = await (supabase as any)
      .from('pre_registrations')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    return !!preRegData;
  } catch (error) {
    // If we can't check for duplicates, allow the creation to proceed
    // The database constraints will catch actual duplicates
    console.warn('Could not check for duplicate email, proceeding with creation:', error);
    return false;
  }
};
*/

// Async thunks
export const fetchPreRegistrations = createAsyncThunk(
  'preRegistration/fetchPreRegistrations',
  async () => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Supabase not configured, using mock data for pre-registrations');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Get fresh data from localStorage
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        return MOCK_PRE_REGISTRATIONS;
      }

      console.log('Using Supabase for pre-registrations');
      const { data, error } = await (supabase as any)
        .from('pre_registrations')
        .select(`
          id,
          email,
          user_type,
          status,
          invitation_token,
          expires_at,
          created_at,
          registered_at,
          invited_by
        `)
        .in('status', ['pending', 'registered', 'expired'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase error, falling back to mock data:', error);
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        return MOCK_PRE_REGISTRATIONS;
      }

      // Transform Supabase data to match our PreRegistration interface
      const transformedData: PreRegistration[] = (data || []).map((item: any) => ({
        id: item.id,
        email: item.email,
        userType: item.user_type,
        invitedBy: item.invited_by,
        status: item.status,
        invitationToken: item.invitation_token,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        registeredAt: item.registered_at || undefined,
      }));

      return transformedData;
    } catch (error: any) {
      console.warn('Database connection failed, using mock data:', error);
      MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
      return MOCK_PRE_REGISTRATIONS;
    }
  }
);

export const createPreRegistration = createAsyncThunk(
  'preRegistration/createPreRegistration',
  async (data: PreRegistrationData, { rejectWithValue, getState }) => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get current data from localStorage
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        
        // Check if email already exists in current data
        const existingPreReg = MOCK_PRE_REGISTRATIONS.find((pr: PreRegistration) => pr.email === data.email);
        if (existingPreReg) {
          throw new Error('Email already pre-registered');
        }

        const newPreRegistration: PreRegistration = {
          id: `pre-${Date.now()}`,
          email: data.email,
          userType: data.userType,
          invitedBy: 'admin-001', // Current user ID in real implementation
          status: 'pending',
          invitationToken: generateInvitationToken(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };

        // Add to mock data and save to localStorage
        MOCK_PRE_REGISTRATIONS.unshift(newPreRegistration);
        saveMockPreRegistrations(MOCK_PRE_REGISTRATIONS);

        // Return the new pre-registration (Redux will handle adding it to state)
        return newPreRegistration;
      }

      const state = getState() as any;
      const currentUserId = state.auth.user?.id;

      if (!currentUserId) {
        return rejectWithValue('User not authenticated');
      }

      // Temporarily disable duplicate email check due to 406 errors
      // The database unique constraints will handle duplicates
      // const emailExists = await checkForDuplicateEmail(data.email);
      // if (emailExists) {
      //   return rejectWithValue('A user with this email address already exists.');
      // }

      const invitationToken = generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create pre-registration record
      const insertData = {
        email: data.email,
        user_type: data.userType,
        status: 'pending',
        invitation_token: invitationToken,
        expires_at: expiresAt,
        invited_by: currentUserId,
      };

      const { data: preRegRecord, error } = await (supabase as any)
        .from('pre_registrations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Transform the returned data to match our PreRegistration interface
      const transformedPreRegistration: PreRegistration = {
        id: (preRegRecord as any).id,
        email: (preRegRecord as any).email,
        userType: (preRegRecord as any).user_type,
        invitedBy: (preRegRecord as any).invited_by,
        status: 'pending',
        invitationToken: (preRegRecord as any).invitation_token,
        expiresAt: (preRegRecord as any).expires_at,
        createdAt: (preRegRecord as any).created_at,
        registeredAt: (preRegRecord as any).registered_at || undefined,
      };

      return transformedPreRegistration;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create pre-registration');
    }
  }
);

export const deletePreRegistration = createAsyncThunk(
  'preRegistration/deletePreRegistration',
  async (id: string, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get current data from localStorage
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        
        const index = MOCK_PRE_REGISTRATIONS.findIndex(pr => pr.id === id);
        if (index === -1) {
          throw new Error('Pre-registration not found');
        }

        MOCK_PRE_REGISTRATIONS.splice(index, 1);
        saveMockPreRegistrations(MOCK_PRE_REGISTRATIONS);
        return id;
      }

      const { error } = await (supabase as any)
        .from('pre_registrations')
        .delete()
        .eq('id', id);

      if (error) {
        return rejectWithValue(error.message);
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete pre-registration');
    }
  }
);

export const resendInvitation = createAsyncThunk(
  'preRegistration/resendInvitation',
  async (id: string, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const preReg = MOCK_PRE_REGISTRATIONS.find(pr => pr.id === id);
        if (!preReg) {
          throw new Error('Pre-registration not found');
        }

        // Update expiration date
        preReg.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        return preReg;
      }

      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await (supabase as any)
        .from('pre_registrations')
        .update({ expires_at: newExpiresAt })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // TODO: Send email invitation
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resend invitation');
    }
  }
);

// Validate invitation token
export const validateInvitationToken = createAsyncThunk(
  'preRegistration/validateInvitationToken',
  async (token: string, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get current data from localStorage
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        
        const preRegistration = MOCK_PRE_REGISTRATIONS.find((pr: PreRegistration) => pr.invitationToken === token);
        
        if (!preRegistration) {
          throw new Error('Invalid invitation token');
        }

        return preRegistration;
      }

      console.log('Using Supabase for invitation validation, token:', token);
      const { data, error } = await (supabase as any)
        .from('pre_registrations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('Validation result:', { data, error });

      if (error) {
        console.error('Supabase validation error:', error);
        return rejectWithValue('Invalid invitation token');
      }

      // Transform the returned data to match our PreRegistration interface
      const transformedData = {
        id: (data as any).id,
        email: (data as any).email,
        userType: (data as any).user_type,
        invitedBy: (data as any).invited_by,
        status: (data as any).status,
        invitationToken: (data as any).invitation_token,
        expiresAt: (data as any).expires_at,
        createdAt: (data as any).created_at,
        registeredAt: (data as any).registered_at || undefined,
      };

      console.log('Transformed invitation data:', transformedData);
      return transformedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to validate token');
    }
  }
);

// Mark pre-registration as completed
export const markPreRegistrationAsCompleted = createAsyncThunk(
  'preRegistration/markAsCompleted',
  async (token: string, { rejectWithValue }) => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get current data from localStorage
        MOCK_PRE_REGISTRATIONS = getMockPreRegistrations();
        
        const preRegIndex = MOCK_PRE_REGISTRATIONS.findIndex((pr: PreRegistration) => pr.invitationToken === token);
        
        if (preRegIndex === -1) {
          throw new Error('Pre-registration not found');
        }

        // Update status to 'registered' and set registeredAt timestamp
        MOCK_PRE_REGISTRATIONS[preRegIndex] = {
          ...MOCK_PRE_REGISTRATIONS[preRegIndex],
          status: 'registered',
          registeredAt: new Date().toISOString(),
        };

        // Save updated data to localStorage
        saveMockPreRegistrations(MOCK_PRE_REGISTRATIONS);
        
        return MOCK_PRE_REGISTRATIONS[preRegIndex];
      }

      const { data, error } = await (supabase as any)
        .from('pre_registrations')
        .update({ 
          status: 'registered',
          registered_at: new Date().toISOString(),
        })
        .eq('invitation_token', token)
        .select()
        .single();

      if (error) {
        return rejectWithValue('Failed to update pre-registration status');
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as completed');
    }
  }
);

// Initial state
const initialState: PreRegistrationState = {
  preRegistrations: [],
  isLoading: false,
  error: null,
};

// Pre-registration slice
const preRegistrationSlice = createSlice({
  name: 'preRegistration',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pre-registrations
      .addCase(fetchPreRegistrations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPreRegistrations.fulfilled, (state, action: PayloadAction<PreRegistration[]>) => {
        state.isLoading = false;
        state.preRegistrations = action.payload;
        state.error = null;
      })
      .addCase(fetchPreRegistrations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create pre-registration
      .addCase(createPreRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPreRegistration.fulfilled, (state, action: PayloadAction<PreRegistration>) => {
        state.isLoading = false;
        state.preRegistrations.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPreRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete pre-registration
      .addCase(deletePreRegistration.fulfilled, (state, action: PayloadAction<string>) => {
        state.preRegistrations = state.preRegistrations.filter(pr => pr.id !== action.payload);
      })
      
      // Resend invitation
      .addCase(resendInvitation.fulfilled, (state, action: PayloadAction<PreRegistration>) => {
        const index = state.preRegistrations.findIndex(pr => pr.id === action.payload.id);
        if (index !== -1) {
          state.preRegistrations[index] = action.payload;
        }
      })
      
      // Mark pre-registration as completed
      .addCase(markPreRegistrationAsCompleted.fulfilled, (state, action: PayloadAction<PreRegistration>) => {
        const index = state.preRegistrations.findIndex(pr => pr.invitationToken === action.payload.invitationToken);
        if (index !== -1) {
          state.preRegistrations[index] = action.payload;
        }
      });
  },
});

export const { clearError } = preRegistrationSlice.actions;
export default preRegistrationSlice.reducer;
