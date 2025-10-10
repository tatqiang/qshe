import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { useActionWithLoading } from '../../../hooks/useActionWithLoading';
import type { AdminUserCreationData, Position } from '../../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: AdminUserCreationData) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailMessage, setEmailMessage] = useState<string>('');
  
  // Company creation confirmation state
  const [showCompanyConfirmation, setShowCompanyConfirmation] = useState(false);
  const [pendingCompanyName, setPendingCompanyName] = useState('');

  // Action hooks for form submission and company creation
  const { loading: isSubmitting, execute: executeCreateUser } = useActionWithLoading({
    successMessage: 'User created successfully!',
    errorMessage: 'Failed to create user. Please try again.',
    showSuccessAlert: false, // Parent component handles success feedback
    showErrorAlert: false, // We'll handle errors manually for better UX
    onSuccess: () => {
      reset();
      setCompanySearchTerm('');
      setShowCompanyDropdown(false);
      setUsernameAvailable(null);
      setUsernameMessage('');
      setEmailAvailable(null);
      setEmailMessage('');
      onClose();
    }
  });

  const { loading: isCreatingCompany, execute: executeCreateCompany } = useActionWithLoading({
    successMessage: 'Company created successfully!',
    errorMessage: 'Failed to create company. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true
  });

  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AdminUserCreationData>();

  const userType = watch('userType');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const username = watch('username');

  // Check username availability
  const checkUsernameAvailability = async (username: string): Promise<void> => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameMessage('Checking availability...');
    
    try {
      // Try to check against Supabase database
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        
        // Check in both auth.users and public.users tables
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();
        
        if (existingUser) {
          setUsernameAvailable(false);
          setUsernameMessage('Username is already taken');
        } else {
          setUsernameAvailable(true);
          setUsernameMessage('Username is available');
        }
      } else {
        // Mock check for development
        const mockExistingUsernames = ['admin', 'john.doe', 'jane.smith', 'test.user'];
        const isAvailable = !mockExistingUsernames.includes(username.toLowerCase());
        
        setUsernameAvailable(isAvailable);
        setUsernameMessage(isAvailable ? 'Username is available' : 'Username is already taken');
      }
    } catch (error) {
      console.warn('Error checking username availability:', error);
      setUsernameAvailable(true);
      setUsernameMessage('Unable to verify availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email: string): Promise<void> => {
    if (!email || email.length < 5) {
      setEmailAvailable(null);
      setEmailMessage('');
      return;
    }

    setIsCheckingEmail(true);
    setEmailMessage('Checking availability...');
    
    try {
      // Try to check against Supabase database
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        
        // Check in public.users table for existing email
        const { data: existingUser } = await supabase
          .from('users')
          .select('email')
          .eq('email', email.toLowerCase())
          .single();
        
        const isAvailable = !existingUser;
        setEmailAvailable(isAvailable);
        setEmailMessage(isAvailable ? 'Email is available' : 'Email is already registered');
      } else {
        // Mock check for development
        const mockExistingEmails = ['admin@example.com', 'john.doe@example.com', 'jane.smith@example.com', 'test@test.com'];
        const isAvailable = !mockExistingEmails.includes(email.toLowerCase());
        
        setEmailAvailable(isAvailable);
        setEmailMessage(isAvailable ? 'Email is available' : 'Email is already registered');
      }
    } catch (error) {
      console.warn('Error checking email availability:', error);
      setEmailAvailable(true);
      setEmailMessage('Unable to verify availability');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Generate suggested username
  const generateUsername = async (userType: string, firstName: string, lastName: string, email?: string): Promise<string> => {
    if (!firstName) return '';
    
    let suggestedUsername = '';
    
    if (userType === 'internal' && email) {
      // Internal staff: use email prefix (before @)
      suggestedUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    } else if (userType === 'external' && firstName && lastName) {
      // External users: combine firstname + "." + first letter of lastname
      const firstNameClean = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastNameInitial = lastName.charAt(0).toLowerCase();
      suggestedUsername = `${firstNameClean}.${lastNameInitial}`;
    }
    
    return suggestedUsername;
  };

  // Handle creating new company from search - with confirmation
  const handleCreateCompanyFromSearch = async () => {
    if (!companySearchTerm.trim()) return;
    
    // Show confirmation dialog instead of creating immediately
    setPendingCompanyName(companySearchTerm.trim());
    setShowCompanyConfirmation(true);
    setShowCompanyDropdown(false);
  };

  // Confirm and actually create the company
  // Confirm and actually create the company
  const confirmCreateCompany = async () => {
    if (!pendingCompanyName) return;
    
    executeCreateCompany(async () => {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        
        // Insert new company into database (RLS now allows this)
        const { data: newCompanyData, error } = await supabase
          .from('companies')
          .insert([
            { 
              name: pendingCompanyName,
              status: 'active'
            }
          ])
          .select()
          .single();
          
        if (!error && newCompanyData) {
          console.log('Successfully added company to database:', newCompanyData);
          // Add to local state
          setCompanies(prev => [...prev, newCompanyData]);
          setValue('companyId', newCompanyData.id);
          setCompanySearchTerm(newCompanyData.name);
        } else {
          console.error('Error adding company to database:', error);
          
          // Check if it's an RLS error
          if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
            console.warn('RLS policy preventing company creation. Please run the fix_companies_rls.sql script or contact admin.');
            alert('Unable to create company due to database permissions. The company will be added locally for now. Please contact your system administrator.');
          }
          
          // Fallback to local-only addition
          const tempCompany = {
            id: `temp_${Date.now()}`,
            name: pendingCompanyName
          };
          setCompanies(prev => [...prev, tempCompany]);
          setValue('companyId', tempCompany.id);
          setCompanySearchTerm(tempCompany.name);
        }
      } else {
        // No database connection - add locally only
        const tempCompany = {
          id: `temp_${Date.now()}`,
          name: pendingCompanyName
        };
        setCompanies(prev => [...prev, tempCompany]);
        setValue('companyId', tempCompany.id);
        setCompanySearchTerm(tempCompany.name);
      }
      
      // Close confirmation dialog
      setShowCompanyConfirmation(false);
      setPendingCompanyName('');
    });
  };

  // Cancel company creation
  const cancelCreateCompany = () => {
    setShowCompanyConfirmation(false);
    setPendingCompanyName('');
    setShowCompanyDropdown(true); // Reopen dropdown
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  // Check if search term matches any existing company exactly
  const exactMatch = companies.find(company =>
    company.name.toLowerCase() === companySearchTerm.toLowerCase()
  );

  // Handle company selection
  const handleCompanySelect = (company: any) => {
    setValue('companyId', company.id);
    setCompanySearchTerm(company.name);
    setShowCompanyDropdown(false);
  };

  // Auto-generate username when relevant fields change
  useEffect(() => {
    if (userType && firstName && (userType === 'internal' ? email : lastName)) {
      generateUsername(userType, firstName, lastName || '', email).then(username => {
        if (username) {
          setValue('username', username);
          // Check availability of generated username
          checkUsernameAvailability(username);
        }
      });
    }
  }, [userType, firstName, lastName, email, setValue]);

  // Click outside to close company dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    if (showCompanyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompanyDropdown]);

  // Check username availability when username changes (manual input)
  useEffect(() => {
    if (username && username.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
      setUsernameMessage('');
    }
  }, [username]);

  // Check email availability when email changes (for internal users only)
  useEffect(() => {
    if (userType === 'internal' && email && email.length >= 5 && email.includes('@')) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(email);
      }, 700); // Debounce for 700ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setEmailAvailable(null);
      setEmailMessage('');
    }
  }, [email, userType]);

  // Reset position field when user type changes
  useEffect(() => {
    if (userType) {
      setValue('positionId', undefined); // Clear position selection when user type changes
    }
  }, [userType, setValue]);

  // Load positions and companies
  useEffect(() => {
    if (!isOpen) return; // Only load when modal is open
    
    const loadData = async () => {
      try {
        // Try to load real positions from Supabase
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          // Import and use Supabase client
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
          );
          
          const { data: positionsData, error } = await supabase
            .from('positions')
            .select('id, level, position_title, code, type, created_at, updated_at')
            .order('level', { ascending: true });
            
          if (!error && positionsData && positionsData.length > 0) {
            // Map database fields to interface fields
            const mappedPositions = positionsData.map(pos => ({
              id: pos.id,
              level: pos.level,
              positionTitle: pos.position_title, // Map database field to interface field
              code: pos.code,
              type: pos.type,
              createdAt: pos.created_at,
              updatedAt: pos.updated_at
            }));
            setPositions(mappedPositions);
          } else {
            console.warn('Failed to load positions from database or no positions found:', error);
            const mockPositions = getMockPositions();
            setPositions(mockPositions);
          }
        } else {
          const mockPositions = getMockPositions();
          setPositions(mockPositions);
        }
      } catch (error) {
        console.warn('Error loading positions:', error);
        const mockPositions = getMockPositions();
        setPositions(mockPositions);
      }
      
      // Load companies from database
      try {
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
          );
          
          const { data: companiesData, error } = await supabase
            .from('companies')
            .select('id, name')
            .eq('status', 'active')
            .order('name', { ascending: true });
            
          if (!error && companiesData && companiesData.length > 0) {
            console.log('Loaded companies from database:', companiesData);
            setCompanies(companiesData);
          } else {
            console.warn('Failed to load companies from database or no companies found:', error);
            // Fallback to mock companies
            const mockCompanies = [
              { id: 'comp1', name: 'ABC Construction Co.' },
              { id: 'comp2', name: 'XYZ Engineering Ltd.' },
              { id: 'comp3', name: 'DEF Contractors Inc.' },
            ];
            setCompanies(mockCompanies);
          }
        } else {
          // Fallback to mock companies
          const mockCompanies = [
            { id: 'comp1', name: 'ABC Construction Co.' },
            { id: 'comp2', name: 'XYZ Engineering Ltd.' },
            { id: 'comp3', name: 'DEF Contractors Inc.' },
          ];
          setCompanies(mockCompanies);
        }
      } catch (error) {
        console.warn('Error loading companies:', error);
        // Fallback to mock companies
        const mockCompanies = [
          { id: 'comp1', name: 'ABC Construction Co.' },
          { id: 'comp2', name: 'XYZ Engineering Ltd.' },
          { id: 'comp3', name: 'DEF Contractors Inc.' },
        ];
        setCompanies(mockCompanies);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Helper function for mock positions (fallback)
  const getMockPositions = (): Position[] => [
    { id: 1, level: 1, positionTitle: 'Managing Director', code: 'MD', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, level: 2, positionTitle: 'General Manager', code: 'GM', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, level: 2, positionTitle: 'Head of Business Unit', code: 'BU', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, level: 3, positionTitle: 'Project Director', code: 'PD', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, level: 4, positionTitle: 'Project Manager', code: 'PM', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 6, level: 5, positionTitle: 'Assistant Project Manager', code: 'APM', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 7, level: 4, positionTitle: 'QSHE Manager', code: 'QSHEM', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 8, level: 6, positionTitle: 'Project Engineer', code: 'PE', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 9, level: 7, positionTitle: 'Site Engineer', code: 'SE', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 10, level: 8, positionTitle: 'Supervisor', code: 'SUP', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 11, level: 9, positionTitle: 'Foreman', code: 'FM', type: 'internal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 12, level: 1, positionTitle: 'Team Head', code: 'H', type: 'external', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 13, level: 2, positionTitle: 'Worker', code: 'W', type: 'external', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const onSubmitForm = async (data: AdminUserCreationData) => {
    executeCreateUser(async () => {
      await onSubmit(data);
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setCompanySearchTerm('');
      setShowCompanyDropdown(false);
      setUsernameAvailable(null);
      setUsernameMessage('');
      setEmailAvailable(null);
      setEmailMessage('');
      onClose();
      onClose();
    }
  };

  // Filter positions based on user type
  const filteredPositions = positions.filter(pos => {
    if (!userType) return true; // Show all positions if no user type selected
    
    // Map user types to position types
    let requiredPositionType: string;
    if (userType === 'internal') {
      requiredPositionType = 'internal';
    } else if (userType === 'external') {
      requiredPositionType = 'external';
    } else {
      return true; // Fallback: show all positions
    }
    
    return pos.type === requiredPositionType;
  });

  // Debug logging (only log when modal opens or userType changes)
  useEffect(() => {
    if (isOpen) {
      const filteredPositions = positions.filter(pos => {
        if (!userType) return true;
        let requiredPositionType: string;
        if (userType === 'internal') {
          requiredPositionType = 'internal';
        } else if (userType === 'external') {
          requiredPositionType = 'external';
        } else {
          return true;
        }
        return pos.type === requiredPositionType;
      });
      
      console.log('🐛 CreateUserModal Debug:', {
        userType,
        totalPositions: positions.length,
        filteredPositions: filteredPositions.length,
        internalCount: positions.filter(p => p.type === 'internal').length,
        externalCount: positions.filter(p => p.type === 'external').length
      });
    }
  }, [isOpen, userType, positions.length]);

  return (
    <>
      {/* Main Create User Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} title="Create New User">
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* User Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type *
              </label>
              <select
                {...register('userType', { required: 'User type is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select user type</option>
                <option value="internal">Internal Staff</option>
                <option value="external">External Company</option>
              </select>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select role</option>
                <option value="system_admin">System Admin</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="registrant">Registrant</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <Input
                {...register('firstName', { required: 'First name is required' })}
                error={errors.firstName?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <Input
                {...register('lastName', { required: 'Last name is required' })}
                error={errors.lastName?.message}
              />
            </div>
          </div>

          {/* Thai Names (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thai First Name (ชื่อ)
              </label>
              <Input
                {...register('firstNameThai')}
                placeholder="ชื่อไทย"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thai Last Name (นามสกุล)
              </label>
              <Input
                {...register('lastNameThai')}
                placeholder="นามสกุลไทย"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <select
                {...register('nationality')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select nationality</option>
                <option value="Thai">Thai</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Cambodian">Cambodian</option>
                <option value="Laotian">Laotian</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Filipino">Filipino</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Malaysian">Malaysian</option>
                <option value="Singaporean">Singaporean</option>
                <option value="Indian">Indian</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Sri Lankan">Sri Lankan</option>
                <option value="Nepalese">Nepalese</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Email and Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email {userType === 'internal' ? '*' : '(Optional)'}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  {...register('email', {
                    required: userType === 'internal' ? 'Email is required for internal users' : false,
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                    validate: () => {
                      if (userType === 'internal' && emailAvailable === false) {
                        return 'This email is already registered';
                      }
                      return true;
                    }
                  })}
                  error={errors.email?.message}
                  placeholder={userType === 'internal' ? 'user@company.com' : 'Optional email address'}
                  className={`pr-10 ${
                    emailAvailable === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                      : emailAvailable === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                />
                {isCheckingEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {!isCheckingEmail && emailAvailable === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!isCheckingEmail && emailAvailable === false && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              {emailMessage && (
                <p className={`mt-1 text-sm ${
                  emailAvailable === true 
                    ? 'text-green-600' 
                    : emailAvailable === false 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  {emailMessage}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username {userType === 'internal' ? '*' : '(Auto-generated)'}
              </label>
              <div className="relative">
                <Input
                  {...register('username', {
                    required: userType === 'internal' ? 'Username is required for internal users' : false,
                    pattern: {
                      value: /^[a-zA-Z0-9_.-]+$/,
                      message: 'Username can only contain letters, numbers, dots, hyphens, and underscores',
                    },
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters long',
                    },
                    validate: () => {
                      if (usernameAvailable === false) {
                        return 'This username is not available';
                      }
                      return true;
                    }
                  })}
                  error={errors.username?.message}
                  placeholder={
                    userType === 'internal' 
                      ? "Auto-generated from email" 
                      : userType === 'external' || userType === 'worker'
                      ? "Auto-generated from name"
                      : "e.g. john.doe or johndoe123"
                  }
                  className={`pr-10 ${
                    usernameAvailable === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                      : usernameAvailable === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                />
                {isCheckingUsername && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              {usernameMessage && (
                <p className={`text-xs mt-1 ${
                  usernameAvailable === true 
                    ? 'text-green-600' 
                    : usernameAvailable === false 
                    ? 'text-red-600' 
                    : 'text-gray-500'
                }`}>
                  {usernameMessage}
                </p>
              )}
              {userType && (
                <p className="text-xs text-gray-500 mt-1">
                  {userType === 'internal' 
                    ? "Username will be generated from email address"
                    : "Username will be generated as firstname.lastname_initial"
                  }
                </p>
              )}
            </div>
          </div>

          {/* Position Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <select
                {...register('positionId', { 
                  required: 'Position is required',
                  valueAsNumber: true 
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!userType}
              >
                <option value="">
                  {!userType 
                    ? "Select user type first" 
                    : filteredPositions.length === 0 
                    ? `No positions available for ${userType} users`
                    : "Select position"
                  }
                </option>
                {filteredPositions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.positionTitle}
                  </option>
                ))}
              </select>
              {errors.positionId && (
                <p className="mt-1 text-sm text-red-600">{errors.positionId.message}</p>
              )}
              {!userType && (
                <p className="text-sm text-gray-500 mt-1">
                  Please select user type first
                </p>
              )}
              {userType && filteredPositions.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  No positions available for {userType} users
                </p>
              )}
            </div>

            {userType === 'external' && (
              <div className="relative" ref={companyDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    value={companySearchTerm}
                    onChange={(e) => {
                      setCompanySearchTerm(e.target.value);
                      setShowCompanyDropdown(true);
                      // Clear the form field when searching
                      if (e.target.value === '') {
                        setValue('companyId', '');
                      }
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    placeholder="Search or select company..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  
                  {showCompanyDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md border border-gray-300 overflow-auto">
                      {/* Existing companies that match search */}
                      {filteredCompanies.length > 0 && (
                        <>
                          {filteredCompanies.map((company) => (
                            <div
                              key={company.id}
                              onClick={() => handleCompanySelect(company)}
                              className="cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600"
                            >
                              {company.name}
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Create new company option */}
                      {companySearchTerm.trim() && !exactMatch && companySearchTerm.trim().length >= 2 && (
                        <div
                          onClick={handleCreateCompanyFromSearch}
                          className="cursor-pointer px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add new company "{companySearchTerm.trim()}"...
                        </div>
                      )}
                      
                      {/* No results message */}
                      {filteredCompanies.length === 0 && !companySearchTerm.trim() && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Type to search companies or create new one
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  {...register('companyId', { required: 'Company is required for external users' })}
                />
                
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </Modal>

    {/* Company Creation Confirmation Modal */}
    <Modal 
      isOpen={showCompanyConfirmation} 
      onClose={cancelCreateCompany}
      title="Create New Company"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Create "{pendingCompanyName}"?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This will add a new company to the system. Make sure the company name is correct and not a duplicate.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> Please verify this is not a duplicate of an existing company before creating.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={cancelCreateCompany}
            disabled={isCreatingCompany}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirmCreateCompany}
            loading={isCreatingCompany}
          >
            Create Company
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};
