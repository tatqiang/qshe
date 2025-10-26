import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  ExclamationTriangleIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

import { useCurrentProject, useCurrentUser } from '../../../contexts/AppContext';
import { useProjectId, useUserId } from '../../../hooks/useGlobalState';
import { useActionWithLoading, useApprovalAction, useRejectionAction } from '../../../hooks/useActionWithLoading';
import RiskMatrix from '../../common/RiskMatrix';
import MultiSelect from '../../common/MultiSelect';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import { HierarchicalAreaInput } from '../../common/HierarchicalAreaInput';
import { PatrolPhotoUpload } from '../../common/PatrolPhotoUpload';
import { CorrectiveActionModal } from './CorrectiveActionModal';
import SafetyPatrolDetailView from './SafetyPatrolDetailView';
import CorrectiveActionDetailView from './CorrectiveActionDetailView';
import { SafetyPatrolService } from '../../../services/SafetyPatrolService';

import type { 
  SafetyPatrolFormData, 
  SafetyPatrol, // Add SafetyPatrol import
  RiskCategory, 
  RiskItem,
  PatrolType,
  CorrectiveActionFormData
} from '../../../types/safetyPatrol';

interface SafetyPatrolFormProps {
  onSubmit: (data: SafetyPatrolFormData, photos: string[], correctiveActions: CorrectiveActionFormData[]) => void;
  onCancel: () => void;
  initialData?: Partial<SafetyPatrolFormData> | SafetyPatrol; // Allow both types
  initialPhotos?: string[];
  patrolId?: string; // Add patrolId for edit mode
  riskCategories: RiskCategory[];
  riskItems: RiskItem[];
  projects?: Array<{ id: string; name: string }>;
  areas?: Array<{ id: string; name: string }>;
  contractors?: Array<{ id: string; name: string }>;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view'; // Add mode prop
}

// Status helper functions
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'open': 'bg-blue-100 text-blue-800',
    'pending_verification': 'bg-yellow-100 text-yellow-800',
    'closed': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-600 text-white'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    'open': <ExclamationTriangleIcon className="h-4 w-4" />,
    'pending_verification': <ClockIcon className="h-4 w-4" />,
    'closed': <CheckCircleIcon className="h-4 w-4" />,
    'rejected': <XCircleIcon className="h-4 w-4" />
  };
  return icons[status];
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'open': 'OPEN',
    'pending_verification': 'PENDING VERIFICATION',
    'closed': 'CLOSED',
    'rejected': 'REJECTED'
  };
  return labels[status] || status.toUpperCase();
};

const SafetyPatrolForm: React.FC<SafetyPatrolFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  initialPhotos = [],
  patrolId, // Add patrolId prop
  riskCategories = [],
  riskItems = [],
  loading = false,
  mode = 'create' // Default to create mode
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [showCorrectiveActionForm, setShowCorrectiveActionForm] = useState(false); // Add state for showing corrective action form
  const [correctiveActionDescription, setCorrectiveActionDescription] = useState(''); // State for corrective action description
  const [correctiveActionPhotos, setCorrectiveActionPhotos] = useState<string[]>([]); // State for corrective action photos
  const [correctiveActionAssignedTo, setCorrectiveActionAssignedTo] = useState(''); // State for action assigned to
  const [existingCorrectiveActions, setExistingCorrectiveActions] = useState<any[]>([]); // State for existing corrective actions
  const [isLoadingCorrectiveActions, setIsLoadingCorrectiveActions] = useState(false); // Loading state for corrective actions
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>(mode || 'create'); // Internal form mode state
  const [selectedAction, setSelectedAction] = useState<any>(null); // State for selected corrective action
  const [isActionModalOpen, setIsActionModalOpen] = useState(false); // State for corrective action modal
  
  // States for edit and verification modes
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingActionData, setEditingActionData] = useState<{description?: string, photos?: string[]}>({});
  const [showVerificationForm, setShowVerificationForm] = useState<string | null>(null);
  const [verificationDescription, setVerificationDescription] = useState('');
  const [verificationPhotos, setVerificationPhotos] = useState<string[]>([]);
  const [currentUserFullName, setCurrentUserFullName] = useState<string>('');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{isOpen: boolean, photoUrl: string, photoIndex: number, photoContext?: 'evidence' | 'verification'}>({
    isOpen: false,
    photoUrl: '',
    photoIndex: 0
  });

  const isViewMode = formMode === 'view';
  const isEditMode = formMode === 'edit';
  
  // Get current project and user from global context
  const currentProject = useCurrentProject();
  const currentUser = useCurrentUser();
  
  // Action hook for form submission with loading state
  const { loading: submissionLoading, execute: executeSubmission } = useActionWithLoading({
    successMessage: isEditMode ? 'Safety patrol updated successfully!' : 'Safety patrol created successfully!',
    errorMessage: isEditMode ? 'Failed to update safety patrol. Please try again.' : 'Failed to create safety patrol. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    onSuccess: (result) => {
      console.log('✅ Form submission successful:', result);
    },
    onError: (error) => {
      console.error('❌ Form submission failed:', error);
    }
  });
  
  // Action hook for corrective action submission with loading state
  const { loading: correctiveActionLoading, execute: executeCorrectiveAction } = useActionWithLoading({
    successMessage: 'Corrective action created successfully and is now pending approval!',
    errorMessage: 'Failed to create corrective action. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    onSuccess: () => {
      // Success: Hide form, clear inputs, return to view mode
      setCorrectiveActionDescription('');
      setCorrectiveActionPhotos([]);
      setShowCorrectiveActionForm(false);
      
      // Switch to view mode to show the newly created action awaiting approval
      setFormMode('view');
      
      // Reload existing actions to show the new one in pending approval
      loadExistingCorrectiveActions();
    }
  });

  // Action hook for verification approval (green button)
  const { loading: approvalLoading, execute: executeApproval } = useApprovalAction({
    successMessage: 'Verification completed: Corrective action approved!',
    onSuccess: () => {
      // Close verification form first
      handleCloseVerification();
      // Reload actions to get updated data from database
      loadExistingCorrectiveActions();
    }
  });

  // Action hook for verification rejection (red button)
  const { loading: rejectionLoading, execute: executeRejection } = useRejectionAction({
    successMessage: 'Verification completed: Corrective action rejected!',
    onSuccess: () => {
      // Close verification form first
      handleCloseVerification();
      // Reload actions to get updated data from database
      loadExistingCorrectiveActions();
    }
  });
  
  // Function to fetch current user's full name from database
  const fetchCurrentUserFullName = async () => {
    if (!currentUser?.id) return;
    
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('../../../lib/api/supabase');
      const { data, error } = await (supabase as any)
        .from('users')
        .select('first_name, last_name')
        .eq('id', currentUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user name:', error);
        return;
      }
      
      if (data?.first_name && data?.last_name) {
        setCurrentUserFullName(`${data.first_name} ${data.last_name}`);
      } else if (data?.first_name) {
        setCurrentUserFullName(data.first_name);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };
  
  // Fetch user's full name when component mounts or user changes
  useEffect(() => {
    fetchCurrentUserFullName();
  }, [currentUser?.id]);
  
  // Debug: Log current user data to see what we have
  useEffect(() => {
    if (currentUser) {
      console.log('🔍 DEBUG: Current user data:', currentUser);
    }
  }, [currentUser]); // Add current user
  const projectId = useProjectId();

  // Toggle between view and edit modes
  const toggleEditMode = () => {
    // Check if user has permission to edit before allowing mode change
    if (formMode === 'view' && !canUserEdit()) {
      // Show a more detailed message about why editing is not allowed
      const reason = currentUser?.id !== (initialData as SafetyPatrol)?.createdBy
        ? 'Only the user who created this patrol can edit it.'
        : 'This patrol can no longer be edited. Patrols can only be edited within 60 minutes of creation.';
      
      alert(`Edit not allowed: ${reason}`);
      return;
    }
    
    if (formMode === 'view') {
      setFormMode('edit');
    } else if (formMode === 'edit') {
      setFormMode('view');
    }
  };

  // Check if we should show the "New Corrective Action" button
  // Only show if there are no pending corrective actions or if previous actions were rejected
  const shouldShowNewActionButton = () => {
    if (!isViewMode) return false; // Only show in view mode
    
    // Check if there are any actions with 'pending' status
    const hasPendingActions = existingCorrectiveActions.some(action => 
      action.status === 'pending' || action.status === 'assigned'
    );
    
    return !hasPendingActions; // Show button only if no pending actions
  };

  // Handler for approving a corrective action
  const handleApproveAction = async (actionId: string) => {
    try {
      // TODO: Implement approve API call
      console.log('Approving action:', actionId);
      alert('Corrective action approved! (Implementation pending)');
      
      // For now, update local state to remove from pending
      setExistingCorrectiveActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'approved' }
            : action
        )
      );
    } catch (error) {
      console.error('Error approving action:', error);
      alert('Failed to approve corrective action');
    }
  };

  // Handler for rejecting a corrective action
  const handleRejectAction = async (actionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      // TODO: Implement reject API call
      console.log('Rejecting action:', actionId, 'Reason:', reason);
      alert('Corrective action rejected! (Implementation pending)');
      
      // For now, update local state to remove from pending
      setExistingCorrectiveActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'rejected', rejection_reason: reason }
            : action
        )
      );
    } catch (error) {
      console.error('Error rejecting action:', error);
      alert('Failed to reject corrective action');
    }
  };

  // Handler for viewing/editing a corrective action
  const handleViewEditAction = (action: any) => {
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  // Handler for updating a corrective action
  const handleUpdateAction = async (actionId: string, updates: any) => {
    try {
      // TODO: Implement update API call
      console.log('Updating action:', actionId, updates);
      alert('Corrective action updated! (Implementation pending)');
      
      // Update local state
      setExistingCorrectiveActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, ...updates }
            : action
        )
      );
    } catch (error) {
      console.error('Error updating action:', error);
      alert('Failed to update corrective action');
    }
  };

  // Handler for approving with verification data
  const handleApproveWithVerification = async (actionId: string, reviewData: any) => {
    try {
      console.log('Approving action with verification:', actionId, reviewData);
      alert('Corrective action approved with verification! (Implementation pending)');
      
      // Update local state
      setExistingCorrectiveActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'approved', verification: reviewData }
            : action
        )
      );
    } catch (error) {
      console.error('Error approving action:', error);
      alert('Failed to approve corrective action');
    }
  };

  // Handler for rejecting with verification data
  const handleRejectWithVerification = async (actionId: string, reviewData: any) => {
    try {
      console.log('Rejecting action with verification:', actionId, reviewData);
      alert('Corrective action rejected with verification! (Implementation pending)');
      
      // Update local state
      setExistingCorrectiveActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'rejected', verification: reviewData }
            : action
        )
      );
    } catch (error) {
      console.error('Error rejecting action:', error);
      alert('Failed to reject corrective action');
    }
  };

  // Handler for editing a corrective action
  const handleEditAction = (actionId: string) => {
    console.log('🔍 handleEditAction called with actionId:', actionId);
    console.log('🔍 Current editingActionId state:', editingActionId);
    
    const action = existingCorrectiveActions.find(a => a.id === actionId);
    console.log('🔍 Found action:', action);
    
    if (action) {
      console.log('🔍 Setting editingActionId to:', actionId);
      setEditingActionId(actionId);
      setEditingActionData({
        description: action.description,
        photos: action.photos || []
      });
      console.log('🔍 Edit mode activated for action:', actionId);
    } else {
      console.log('❌ Action not found in existingCorrectiveActions');
    }
  };

  // Handler for saving edited corrective action
  const handleSaveAction = async (actionId: string) => {
    try {
      // Validate description and photos before saving
      if (!editingActionData.description?.trim()) {
        alert('Please enter a description for the corrective action');
        return;
      }

      if (!editingActionData.photos || editingActionData.photos.length === 0) {
        alert('Please add at least one photo for the corrective action');
        return;
      }

      console.log('Saving action:', actionId, editingActionData);
      
      // Call the API to update the corrective action
      const result = await SafetyPatrolService.updateCorrectiveAction(actionId, editingActionData);
      
      if (result.success) {
        alert('Corrective action saved successfully!');
        
        // Update local state with edited data
        setExistingCorrectiveActions(prev => 
          prev.map(a => 
            a.id === actionId 
              ? { ...a, ...editingActionData }
              : a
          )
        );
        
        // Clear editing state and return to view mode
        setEditingActionId(null);
        setEditingActionData({});
        if (formMode !== 'view') {
          setFormMode('view');
        }
      } else {
        alert(`Failed to save corrective action: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Failed to save corrective action');
    }
  };

  // Handler for canceling edit
  const handleCancelEdit = () => {
    setEditingActionId(null);
    setEditingActionData({});
    // Return to view mode if we were editing a corrective action
    if (formMode !== 'view') {
      setFormMode('view');
    }
  };

  // Handler for opening verification form
  const handleOpenVerification = (actionId: string) => {
    setShowVerificationForm(actionId);
    setVerificationDescription('');
    setVerificationPhotos([]);
  };

  // Handler for closing verification form
  const handleCloseVerification = () => {
    setShowVerificationForm(null);
    setVerificationDescription('');
    setVerificationPhotos([]);
  };

  // Handler for editing verification (within 60-minute window)
  const handleEditVerification = (actionId: string) => {
    const action = existingCorrectiveActions.find(a => a.id === actionId);
    if (action && action.verification_notes) {
      setShowVerificationForm(actionId);
      setVerificationDescription(action.verification_notes);
      setVerificationPhotos(action.verificationPhotos || []);
    }
  };

  // Handlers for photo modal
  const openPhotoModal = (photoUrl: string, photoIndex: number, photoContext: 'evidence' | 'verification' = 'evidence') => {
    setSelectedPhotoModal({
      isOpen: true,
      photoUrl,
      photoIndex,
      photoContext
    });
  };

  const closePhotoModal = () => {
    setSelectedPhotoModal({
      isOpen: false,
      photoUrl: '',
      photoIndex: 0
    });
  };

  const openVerificationPhotoModal = (photoUrl: string, photoIndex: number) => {
    openPhotoModal(photoUrl, photoIndex, 'verification');
  };

  const navigatePhoto = (direction: 'prev' | 'next', photos: string[]) => {
    const currentIndex = selectedPhotoModal.photoIndex;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhotoModal({
      isOpen: true,
      photoUrl: photos[newIndex],
      photoIndex: newIndex,
      photoContext: selectedPhotoModal.photoContext
    });
  };

  // Handler for approving via verification form
  const handleVerificationApprove = async (actionId: string) => {
    if (!verificationDescription.trim()) {
      alert('Please provide a verification description');
      return;
    }

    if (!userId) {
      alert('User authentication required to approve corrective action');
      return;
    }

    executeApproval(async () => {
      const result = await SafetyPatrolService.approveCorrectiveAction(actionId, {
        reviewDescription: verificationDescription,
        photos: verificationPhotos,
        verifiedBy: userId
      }, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve corrective action');
      }
    });
  };

  // Handler for rejecting via verification form
  const handleVerificationReject = async (actionId: string) => {
    if (!verificationDescription.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!userId) {
      alert('User authentication required to reject corrective action');
      return;
    }

    executeRejection(async () => {
      const result = await SafetyPatrolService.rejectCorrectiveAction(actionId, {
        reviewDescription: verificationDescription,
        photos: verificationPhotos,
        verifiedBy: userId
      }, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject corrective action');
      }
    });
  };

  // Handler for creating corrective actions
  const handleCreateCorrectiveAction = () => {
    if (!correctiveActionDescription.trim()) {
      alert('Please enter a description for the corrective action');
      return;
    }

    // Validate that at least one photo is provided
    if (!correctiveActionPhotos || correctiveActionPhotos.length === 0) {
      alert('Please add at least one photo for the corrective action');
      return;
    }

    if (!patrolId) {
      alert('Patrol ID is required to create corrective actions');
      return;
    }

    if (!userId) {
      alert('User authentication required to create corrective actions');
      return;
    }

    // Use the action hook to handle submission with loading state
    executeCorrectiveAction(async () => {
      const result = await SafetyPatrolService.createCorrectiveAction(
        patrolId,
        correctiveActionDescription,
        correctiveActionPhotos,
        userId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create corrective action');
      }

      return result;
    });
  };

  // Load existing corrective actions for view mode
  const loadExistingCorrectiveActions = async () => {
    if (patrolId) {
      setIsLoadingCorrectiveActions(true);
      try {
        const actions = await SafetyPatrolService.getCorrectiveActionsByPatrol(patrolId);
        
        // Load photos for each corrective action
        const actionsWithPhotos = await Promise.all(
          actions.map(async (action: any) => {
            const photosResult = await SafetyPatrolService.getCorrectiveActionPhotos(action.id);
            const photos = photosResult.success ? photosResult.photos : [];
            
            // Separate photos by type
            const regularPhotos = photos?.filter((photo: any) => 
              photo.photo_type === 'evidence' || 
              photo.photo_type === 'planning' || 
              photo.photo_type === 'before' ||
              photo.photo_type === 'during' ||
              photo.photo_type === 'after'
            ) || [];
            
            const verificationPhotos = photos?.filter((photo: any) => 
              photo.photo_type === 'verification'
            ) || [];
            
            // Convert database photos to URL array format expected by the component
            const regularPhotoUrls = regularPhotos.map((photo: any) => photo.r2_url || photo.url);
            const verificationPhotoUrls = verificationPhotos.map((photo: any) => photo.r2_url || photo.url);
            
            return {
              ...action,
              photos: regularPhotoUrls, // Only show regular photos in main photo section
              verificationPhotos: verificationPhotoUrls // Store verification photos separately
            };
          })
        );
        
        setExistingCorrectiveActions(actionsWithPhotos);
        setIsLoadingCorrectiveActions(false);
        console.log('📸 Loaded corrective actions with separated photos:', actionsWithPhotos);
        
        // Debug verification data for each action
        actionsWithPhotos.forEach((action, index) => {
          console.log(`🔍 Action ${index + 1} Debug:`, {
            id: action.id,
            status: action.status,
            verification_notes: action.verification_notes,
            verification_date: action.verification_date,
            verified_by: action.verified_by,
            hasVerificationNotes: !!action.verification_notes,
            isCompleted: action.status === 'completed',
            isRejected: action.status === 'rejected',
            shouldShowVerification: (action.status === 'completed' || action.status === 'rejected') && action.verification_notes
          });
        });
      } catch (error) {
        console.error('Error loading corrective actions:', error);
        setExistingCorrectiveActions([]);
        setIsLoadingCorrectiveActions(false);
      }
    }
  };

  // Load existing corrective actions on mount if in view mode
  useEffect(() => {
    if (isViewMode && patrolId) {
      loadExistingCorrectiveActions();
    }
  }, [isViewMode, patrolId]);
  const userId = useUserId();
  
  // Track location IDs for normalized schema - use current project ID
  const [locationIds, setLocationIds] = useState<{
    project_id: string;
    main_area_id?: string;
    sub_area1_id?: string;
    sub_area2_id?: string;
  }>({
    project_id: projectId || ''
  });

  // Update locationIds when currentProject changes
  useEffect(() => {
    if (projectId) {
      setLocationIds(prev => ({
        ...prev,
        project_id: projectId
      }));
      console.log('✅ SafetyPatrolForm: Updated project ID from context:', projectId);
    }
  }, [projectId]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<SafetyPatrolFormData>({
    defaultValues: {
      patrolType: 'scheduled',
      likelihood: 1,
      severity: 1,
      riskCategoryIds: [],
      riskItemIds: [],
      immediateHazard: false,
      workStopped: false,
      witnesses: [],
      legalRequirement: false,
      mainArea: '',
      subArea1: '',
      subArea2: '',
      specificLocation: '',
      remark: '', // Add remark to default values
      ...initialData
    }
  });

  // Update form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      console.log('🔄 SafetyPatrolForm: Updating form with initial data:', initialData);
      
      // Type guard to check if initialData is SafetyPatrol (has riskCategories array)
      const isSafetyPatrol = 'riskCategories' in initialData;
      
      let mappedData: Partial<SafetyPatrolFormData>;
      
      if (isSafetyPatrol) {
        // Map SafetyPatrol data to SafetyPatrolFormData format
        const patrol = initialData as SafetyPatrol;
        mappedData = {
          title: patrol.title,
          description: patrol.description,
          patrolType: patrol.patrolType,
          likelihood: patrol.likelihood,
          severity: patrol.severity,
          immediateHazard: patrol.immediateHazard,
          workStopped: patrol.workStopped,
          regulationReference: patrol.regulationReference,
          legalRequirement: patrol.legalRequirement,
          witnesses: patrol.witnesses || [],
          contractorId: patrol.contractorId,
          
          // Map area data - construct from location or use legacy fields
          mainArea: patrol.location ? patrol.location.split(' > ')[0] || '' : '',
          subArea1: patrol.location ? patrol.location.split(' > ')[1] || '' : '',
          subArea2: patrol.location ? patrol.location.split(' > ')[2] || '' : '',
          specificLocation: patrol.specificLocation || '', // Map specific location properly
          
          // Map risk categories and items - extract IDs from objects
          riskCategoryIds: (patrol.riskCategories || []).map((cat: RiskCategory) => cat.id),
          riskItemIds: (patrol.riskItems || []).map((item: RiskItem) => item.id),
          
          // Include normalized location IDs
          project_id: patrol.project_id,
          main_area_id: patrol.main_area_id,
          sub_area1_id: patrol.sub_area1_id,
          sub_area2_id: patrol.sub_area2_id
        };
        
        // Set initial photos if available
        if (patrol.photos && patrol.photos.length > 0) {
          // Extract photo URLs from SafetyPatrolPhoto objects
          const photoUrls = patrol.photos.map((photo: any) => photo.filePath);
          setPhotos(photoUrls);
        }
      } else {
        // It's already SafetyPatrolFormData format
        mappedData = initialData as Partial<SafetyPatrolFormData>;
        
        // Set initial photos if available
        if (initialPhotos && initialPhotos.length > 0) {
          setPhotos(initialPhotos);
        }
      }
      
      // Set all form values
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof SafetyPatrolFormData, value);
        }
      });

      console.log('✅ SafetyPatrolForm: Form populated with mapped data:', mappedData);
    }
  }, [initialData, initialPhotos, setValue]);

  const handleAreaChange = (mainArea: string, area?: any) => {
    setValue('mainArea', mainArea);
    setValue('subArea1', '');
    setValue('subArea2', '');
    setSelectedArea(area);
  };

  const handleSubArea1Change = async (subArea1: string) => {
    console.log(`[FORM] Sub Area 1 changing to: "${subArea1}"`);
    setValue('subArea1', subArea1);
    setValue('subArea2', '');
    console.log(`[FORM] Sub Area 1 set in form, cleared Sub Area 2`);
    
    // Force re-render and validation
    await trigger(['subArea1', 'subArea2']);
    console.log(`[FORM] Triggered re-validation for sub areas`);
  };

  const handleSubArea2Change = async (subArea2: string) => {
    console.log(`[FORM] Sub Area 2 changing to: "${subArea2}"`);
    setValue('subArea2', subArea2);
    console.log(`[FORM] Sub Area 2 set in form`);
    
    // Force re-render and validation
    await trigger('subArea2');
    console.log(`[FORM] Triggered re-validation for sub area 2`);
  };

  const handlePhotoUpload = (photoUrls: string[]) => {
    setPhotos(photoUrls);
  };

  const watchedValues = watch();
  
  // Form validation function to check if all required fields are filled
  const isFormValid = () => {
    const { title, description, mainArea, likelihood, severity } = watchedValues;
    
    // Check required fields
    const hasTitle = title && title.trim().length > 0;
    const hasDescription = description && description.trim().length > 0;
    const hasMainArea = mainArea && mainArea.trim().length > 0;
    // Risk assessment is considered valid if user has made any selection (default values count)
    const hasRiskAssessment = likelihood >= 1 && severity >= 1; 
    const hasPhotos = photos && photos.length > 0;
    
    return hasTitle && hasDescription && hasMainArea && hasRiskAssessment && hasPhotos;
  };
  
  // Function to check if current user can edit the patrol
  const canUserEdit = () => {
    // If no initial data, this is a new patrol creation, so allow editing
    if (!initialData) return true;
    
    // Check if current user is the creator of the patrol
    const isCreator = currentUser?.id === (initialData as SafetyPatrol)?.createdBy;
    if (!isCreator) return false;
    
    // Check if patrol was created within the last 60 minutes
    const createdAt = (initialData as SafetyPatrol)?.createdAt;
    if (!createdAt) return false;
    
    const createdTime = new Date(createdAt);
    const currentTime = new Date();
    const timeDifferenceInMinutes = (currentTime.getTime() - createdTime.getTime()) / (1000 * 60);
    
    return timeDifferenceInMinutes <= 60;
  };
  
  // Function to get edit time remaining information
  const getEditTimeInfo = () => {
    if (!initialData) return null;
    
    const createdAt = (initialData as SafetyPatrol)?.createdAt;
    if (!createdAt) return null;
    
    const createdTime = new Date(createdAt);
    const currentTime = new Date();
    const timeDifferenceInMinutes = (currentTime.getTime() - createdTime.getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(0, 60 - timeDifferenceInMinutes);
    
    return {
      isExpired: timeDifferenceInMinutes > 60,
      remainingMinutes: Math.floor(remainingMinutes),
      createdTime: createdTime.toLocaleString()
    };
  };

  // Debug: Log watched values when they change (reduced frequency)
  React.useEffect(() => {
    console.log('[FORM_DEBUG] Form values updated:', {
      mainArea: watchedValues.mainArea,
      subArea1: watchedValues.subArea1,
      subArea2: watchedValues.subArea2
    });
  }, [watchedValues.mainArea, watchedValues.subArea1, watchedValues.subArea2]);
  const { likelihood, severity, immediateHazard, workStopped } = watchedValues;

  // Auto-show corrective actions for high risk or immediate hazards
  useEffect(() => {
    const riskScore = likelihood * severity;
    // Note: Corrective actions are handled after patrol creation
    console.log('Risk assessment:', { riskScore, immediateHazard, workStopped });
  }, [likelihood, severity, immediateHazard, workStopped]);

  // Filter risk items based on selected categories
  const filteredRiskItems = riskItems;

  const patrolTypeOptions: Array<{ value: PatrolType; label: string; description: string }> = [
    { value: 'scheduled', label: 'Scheduled Patrol', description: 'Regular planned safety inspection' },
    { value: 'random', label: 'Random Patrol', description: 'Unplanned safety check' },
    { value: 'incident_followup', label: 'Incident Follow-up', description: 'Follow-up inspection after incident' }
  ];

  const onFormSubmit = (data: SafetyPatrolFormData) => {
    console.log('[PATROL_FORM] Form submission with area data:', {
      selectedArea,
      mainArea: data.mainArea,
      subArea1: data.subArea1,
      subArea2: data.subArea2,
      locationIds: locationIds,
      formData: data
    });
    
    // Add photos and comprehensive area data to the form data
    const formDataWithPhotos = {
      ...data,
      areaId: selectedArea?.id,
      // Include normalized location IDs and user info
      project_id: locationIds.project_id,
      main_area_id: locationIds.main_area_id,
      sub_area1_id: locationIds.sub_area1_id,
      sub_area2_id: locationIds.sub_area2_id,
      // Add user information from context
      created_by: userId,
      // Include detailed area information for proper storage/display
      areaInfo: {
        selectedArea,
        mainArea: data.mainArea || 'General Area',
        subArea1: data.subArea1 || '',
        subArea2: data.subArea2 || '',
        fullAreaName: [data.mainArea, data.subArea1, data.subArea2].filter(Boolean).join(' > ') || 'General Area'
      }
    };
    
    console.log('[PATROL_FORM] Submitting with enhanced area data:', formDataWithPhotos);
    
    // Use the action hook to handle submission with loading state
    executeSubmission(async () => {
      return onSubmit(formDataWithPhotos, photos, []); // Pass form data with area info and photos, no corrective actions during creation
    });
  };

  return (
    <div className={isViewMode ? 'space-y-3 sm:space-y-6' : ''}>
      {/* Form Header with Edit Button */}
      {(isViewMode || isEditMode) && initialData && (
        <div className="mb-3 sm:mb-6">
          <div className="flex-1">
            {/* Title section - full width */}
            <div className="mb-1.5 sm:mb-2">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight sm:leading-normal">
                {initialData.title || 'Safety Patrol'}
              </h1>
            </div>
            
            {/* Status Badge - separate row for mobile */}
            {(initialData as SafetyPatrol).status && (
              <div className="mb-1.5 sm:mb-2">
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-medium flex items-center w-fit ${getStatusColor((initialData as SafetyPatrol).status)}`}>
                  {getStatusIcon((initialData as SafetyPatrol).status)}
                  <span className="ml-1">{getStatusLabel((initialData as SafetyPatrol).status)}</span>
                </span>
              </div>
            )}
            
            <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-0.5 sm:space-y-1">
              <p>{isViewMode ? 'Viewing patrol details' : 'Editing patrol details'}</p>
              
              {/* Creator and Edit Time Information */}
              {(() => {
                const patrol = initialData as SafetyPatrol;
                const timeInfo = getEditTimeInfo();
                const isCreator = currentUser?.id === patrol?.createdBy;
                
                return (
                  <div className="text-sm space-y-1">
                    {(patrol?.createdByUser || patrol?.createdBy) && (
                      <p>
                        <span className="font-medium">Created by:</span>{' '}
                        {patrol?.createdByUser ? (
                          <>
                            {patrol.createdByUser.firstName} {patrol.createdByUser.lastName}
                            {isCreator && <span className="text-green-600 ml-1">(You)</span>}
                          </>
                        ) : (
                          <>
                            User ID: {patrol?.createdBy?.substring(0, 8)}...
                            {isCreator && <span className="text-green-600 ml-1">(You)</span>}
                          </>
                        )}
                      </p>
                    )}
                    {timeInfo && (
                      <p>
                        <span className="font-medium">Created:</span> {timeInfo.createdTime}
                        {isCreator && (
                          <span className={`ml-2 ${timeInfo.isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                            {timeInfo.isExpired 
                              ? '(Edit period expired)' 
                              : `(${timeInfo.remainingMinutes} min left to edit)`
                            }
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            {/* View Mode Button for Edit Mode */}
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={toggleEditMode}
                className="flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>View</span>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Cancel Button for Create Mode */}
        {!isViewMode && !isEditMode && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Safety Patrol
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in all required fields (*) to submit the patrol
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          </div>
        )}

        {/* View Mode: Show Detail View Only */}
        {isViewMode && initialData && !editingActionId ? (
          <>
            {/* Detail View Component */}
            <SafetyPatrolDetailView
              patrol={initialData as SafetyPatrol}
              photos={photos}
              riskCategories={riskCategories}
              riskItems={riskItems}
              onPhotoClick={openPhotoModal}
              canEdit={canUserEdit()}
              onEdit={toggleEditMode}
              currentUser={currentUser}
            />

            {/* Corrective Actions Section in View Mode */}
            {existingCorrectiveActions.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📋 Corrective Actions
                </h2>
                <div className="space-y-4">
                  {existingCorrectiveActions.map((action) => (
                    <div key={action.id}>
                      {/* Content - Use Detail View in View Mode, Form in Edit Mode */}
                      {editingActionId !== action.id ? (
                        <CorrectiveActionDetailView
                          action={action}
                          onPhotoClick={openPhotoModal}
                          onVerificationPhotoClick={openVerificationPhotoModal}
                          canEdit={currentUser?.id === action.assigned_to || currentUser?.role === 'admin' || currentUser?.role === 'system_admin'}
                          onEdit={() => handleEditAction(action.id)}
                          onEditVerification={() => handleEditVerification(action.id)}
                          onOpenVerification={() => handleOpenVerification(action.id)}
                          onCreateCorrection={(patrolId) => {
                            console.log('🔧 Creating correction for patrol:', patrolId);
                            setShowCorrectiveActionForm(true);
                          }}
                          currentUser={currentUser}
                          isVerificationFormOpen={showVerificationForm === action.id}
                          allCorrectiveActions={existingCorrectiveActions}
                          isCorrectiveActionFormOpen={showCorrectiveActionForm}
                          patrolData={initialData}
                          verificationFormContent={
                            showVerificationForm === action.id ? (
                              <div>
                                <h6 className="font-medium text-yellow-900 mb-3 sm:mb-4 text-sm sm:text-base">📋 Verification</h6>
                                
                                {/* Review Description */}
                                <div className="mb-3 sm:mb-4">
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Review Description
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={verificationDescription}
                                    onChange={(e) => setVerificationDescription(e.target.value)}
                                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add your review comments and verification notes..."
                                  />
                                </div>
                                
                                {/* Verification Photos */}
                                <div className="mb-3 sm:mb-4">
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Photo
                                  </label>
                                  <PatrolPhotoUpload
                                    onPhotosUploaded={setVerificationPhotos}
                                    patrolId={patrolId}
                                    initialPhotos={verificationPhotos}
                                    maxPhotos={5}
                                    showPreview
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4"
                                  />
                                </div>
                                
                                {/* Verify By */}
                                <div className="mb-3 sm:mb-4">
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Verify By
                                  </label>
                                  <div className="flex items-center space-x-2 sm:space-x-3 w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md bg-gray-100">
                                    {currentUser && (
                                      <>
                                        <div className="flex-shrink-0">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs sm:text-sm font-medium text-green-600">
                                              {(() => {
                                                if (currentUserFullName) {
                                                  const names = currentUserFullName.split(' ');
                                                  if (names.length >= 2) {
                                                    return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
                                                  } else {
                                                    return names[0].charAt(0).toUpperCase();
                                                  }
                                                } else if (currentUser?.email) {
                                                  return currentUser.email.charAt(0).toUpperCase();
                                                }
                                                return 'U';
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {currentUserFullName || currentUser?.email?.split('@')[0] || 'Current User'}
                                          </p>
                                          <p className="text-[10px] sm:text-xs text-gray-500">Verification Officer</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Verification Results */}
                                <div className="mb-2 sm:mb-4">
                                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                    Verification Results
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className={`px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 flex items-center space-x-1 sm:space-x-2 ${
                                        approvalLoading ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      onClick={() => handleVerificationApprove(action.id)}
                                      disabled={approvalLoading || rejectionLoading}
                                    >
                                      {approvalLoading ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                          <span>Approving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>✓</span>
                                          <span>Approve</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className={`px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 flex items-center space-x-1 sm:space-x-2 ${
                                        rejectionLoading ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      onClick={() => handleVerificationReject(action.id)}
                                      disabled={approvalLoading || rejectionLoading}
                                    >
                                      {rejectionLoading ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                          <span>Rejecting...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>✗</span>
                                          <span>Reject</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-300 text-gray-700 text-xs sm:text-sm rounded-md hover:bg-gray-400"
                                      onClick={handleCloseVerification}
                                      disabled={approvalLoading || rejectionLoading}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : null
                          }
                        />
                      ) : (
                        /* Edit Mode - Show Form */
                        <div className="bg-white border rounded-lg p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">✏️ Editing Corrective Action</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={editingActionData.description || ''}
                                onChange={(e) => {
                                  setEditingActionData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                  }));
                                }}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe the corrective action..."
                              />
                              {!editingActionData.description?.trim() && (
                                <p className="text-sm text-red-500 mt-1">Description is required</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photos <span className="text-red-500">*</span>
                              </label>
                              <PatrolPhotoUpload
                                onPhotosUploaded={(photos) => {
                                  setEditingActionData(prev => ({
                                    ...prev,
                                    photos: photos
                                  }));
                                }}
                                patrolId={patrolId}
                                initialPhotos={editingActionData.photos || []}
                                maxPhotos={5}
                                showPreview
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4"
                              />
                              {(!editingActionData.photos || editingActionData.photos.length === 0) && (
                                <p className="text-sm text-red-500 mt-1">At least one photo is required</p>
                              )}
                            </div>

                            <div className="flex space-x-3 pt-4">
                              <button
                                type="button"
                                onClick={() => handleSaveAction(action.id)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                                disabled={
                                  !editingActionData.description?.trim() ||
                                  !editingActionData.photos || 
                                  editingActionData.photos.length === 0
                                }
                              >
                                <span>💾</span>
                                <span>Save Changes</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <span>❌</span>
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Show Corrective Action Button when no corrective actions exist and form is not open and not loading */
              !showCorrectiveActionForm && !isLoadingCorrectiveActions && (
                <div className="mt-6">
                  <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">No corrective actions have been created yet.</p>
                    <button
                      type="button"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                      onClick={() => setShowCorrectiveActionForm(true)}
                    >
                      <span>📋</span>
                      <span>Add Corrective Action</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Corrective Action Form in View Mode */}
            {showCorrectiveActionForm && (
              <div className="mt-6">
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Create Corrective Action</h3>
                    <button
                      type="button"
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      onClick={() => setShowCorrectiveActionForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Description *
                    </label>
                    <textarea
                      rows={3}
                      value={correctiveActionDescription}
                      onChange={(e) => setCorrectiveActionDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the corrective action required..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action By
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {currentUserFullName ? (
                            (() => {
                              const names = currentUserFullName.split(' ');
                              return names.length > 1 
                                ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
                                : names[0].charAt(0);
                            })()
                          ) : (
                            currentUser?.email?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {currentUserFullName || currentUser?.email?.split('@')[0] || 'Current User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Automatically assigned to you
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Photos <span className="text-red-500">*</span>
                    </label>
                    <PatrolPhotoUpload
                      onPhotosUploaded={(photos) => setCorrectiveActionPhotos(photos)}
                      patrolId={patrolId}
                      initialPhotos={correctiveActionPhotos}
                      maxPhotos={5}
                      showPreview
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4"
                    />
                    {(!correctiveActionPhotos || correctiveActionPhotos.length === 0) && (
                      <p className="text-sm text-red-500 mt-1">At least one photo is required for the corrective action</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      onClick={() => setShowCorrectiveActionForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      onClick={handleCreateCorrectiveAction}
                      disabled={correctiveActionLoading || !correctiveActionDescription.trim() || !correctiveActionPhotos || correctiveActionPhotos.length === 0}
                    >
                      {correctiveActionLoading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      <span>{correctiveActionLoading ? 'Creating...' : 'Save Corrective Action'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : editingActionId ? (
          /* Corrective Action Edit Mode */
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Edit Corrective Action
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Update the corrective action details below
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editingActionData.description || ''}
                      onChange={(e) => {
                        setEditingActionData(prev => ({
                          ...prev,
                          description: e.target.value
                        }));
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the corrective action..."
                    />
                    {!editingActionData.description?.trim() && (
                      <p className="text-sm text-red-500 mt-1">Description is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos <span className="text-red-500">*</span>
                    </label>
                    <PatrolPhotoUpload
                      onPhotosUploaded={(photos) => {
                        setEditingActionData(prev => ({
                          ...prev,
                          photos: photos
                        }));
                      }}
                      patrolId={patrolId}
                      initialPhotos={editingActionData.photos || []}
                      maxPhotos={5}
                      showPreview
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4"
                    />
                    {(!editingActionData.photos || editingActionData.photos.length === 0) && (
                      <p className="text-sm text-red-500 mt-1">At least one photo is required</p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => handleSaveAction(editingActionId)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      disabled={
                        !editingActionData.description?.trim() ||
                        !editingActionData.photos || 
                        editingActionData.photos.length === 0
                      }
                    >
                      <span>💾</span>
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>❌</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : !isViewMode ? (
          /* Form Mode: Show Form Only for Create/Edit Modes */
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

            {/* Project Warning */}
            {!currentProject && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Project Selected
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please select a project first to record safety patrol activities. Areas will be filtered by your selected project.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Project Display */}
            {currentProject && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      Recording patrol for: <strong>{currentProject.name}</strong>
                    </p>
                    <p className="text-sm text-blue-600">
                      Project Code: {currentProject.project_code}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <Card title="Basic Information" padding="sm" className="sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Patrol Issuer Display */}
          {(() => {
            const patrol = initialData as SafetyPatrol;
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-base font-semibold">
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900">Patrol Issuer</h4>
                    <p className="text-xs sm:text-sm text-gray-700 mt-0.5 sm:mt-1">
                      {patrol?.createdByUser ? (
                        <span className="font-medium">
                          {patrol.createdByUser.firstName} {patrol.createdByUser.lastName}
                        </span>
                      ) : currentUser ? (
                        <span className="font-medium">
                          {currentUser.firstName} {currentUser.lastName}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not specified</span>
                      )}
                    </p>
                    {currentUser?.email && (
                      <p className="text-xs text-gray-500 mt-0.5">{currentUser.email}</p>
                    )}
                    {isEditMode && patrol?.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(patrol.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patrol Type
              </label>
              <select
                {...register('patrolType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {patrolTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Title *"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
              placeholder="Brief description of the safety issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the safety observation..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Hierarchical Area Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Area *
            </label>
            <Controller
              name="mainArea"
              control={control}
              rules={{ required: 'Main Area is required' }}
              render={({ field, fieldState }) => (
                <div>
                  <HierarchicalAreaInput
                    projectId={projectId || ''}
                    mainArea={watchedValues.mainArea || ''}
                    subArea1={watchedValues.subArea1}
                    subArea2={watchedValues.subArea2}
                    onMainAreaChange={handleAreaChange}
                    onSubArea1Change={handleSubArea1Change}
                    onSubArea2Change={handleSubArea2Change}
                    onAreaSelected={(area) => setSelectedArea(area)}
                    onLocationIdsChange={setLocationIds}
                  />
                  {fieldState.error && (
                    <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Specific Location */}
          <div>
            <Input
              label="Specific Location"
              {...register('specificLocation')}
              placeholder="e.g., North wall, near column A1"
            />
          </div>
        </div>
      </Card>

      {/* Risk Assessment */}
      <Card title="Risk Assessment *" padding="sm" className="sm:p-6">
        <RiskMatrix
          selectedLikelihood={likelihood}
          selectedSeverity={severity}
          onCellSelect={(l, s) => {
            setValue('likelihood', l);
            setValue('severity', s);
          }}
          readonly={false}
        />
      </Card>

      {/* Risk Categories and Items */}
      <Card title="Risk Classification" padding="sm" className="sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          <Controller
            name="riskCategoryIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Risk Categories"
                options={riskCategories.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  description: cat.description,
                  color: cat.color,
                  icon: cat.icon
                }))}
                selectedIds={field.value}
                onChange={field.onChange}
                placeholder="Select risk categories..."
                allowSelectAll
                showCategories={false}
              />
            )}
          />
          {errors.riskCategoryIds && (
            <p className="text-sm text-red-600">{errors.riskCategoryIds.message}</p>
          )}

          <Controller
            name="riskItemIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Risk Items"
                options={filteredRiskItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  category: item.category
                }))}
                selectedIds={field.value}
                onChange={field.onChange}
                placeholder="Select specific risk items..."
                allowSelectAll
                showCategories
              />
            )}
          />
          {errors.riskItemIds && (
            <p className="text-sm text-red-600">{errors.riskItemIds.message}</p>
          )}
        </div>
      </Card>

      {/* Issue Photos */}
      <Card title="Issue Photos *" padding="sm" className="sm:p-6">
        <PatrolPhotoUpload
          onPhotosUploaded={handlePhotoUpload}
          patrolId={patrolId} // Pass actual patrolId (undefined for new, real ID for edit)
          initialPhotos={photos}
          maxPhotos={5}
          showPreview
          className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4"
        />
        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
          Take photos showing the defect clearly. You can add up to 5 photos. Photos are uploaded to Cloudflare R2 storage.
        </p>
        
        {/* Remark Field - within the Issue section */}
        <div className="mt-3 sm:mt-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Remark
          </label>
          <textarea
            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
            placeholder="Additional remarks or notes about the observation (optional)"
            {...register('remark')}
          />
        </div>
      </Card>

      {/* Corrective Actions - Removed - Empty box that showed "Actions will be available after the patrol is created" */}

      {/* Form Actions */}
      <div className="flex flex-col items-end space-y-3 pt-6">
        {/* Show validation message when form is incomplete */}
        {!isViewMode && !isFormValid() && (
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Required fields missing:</strong> Please complete all required fields (*) including Title, Description, Main Area, Risk Assessment, and at least one Photo.
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submissionLoading}
          >
            {isViewMode ? 'Back' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              disabled={submissionLoading || !isFormValid()}
              loading={submissionLoading}
              className={(!isFormValid() && !submissionLoading) ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isEditMode ? 'Update Safety Patrol' : 'Create Safety Patrol'}
            </Button>
          )}
        </div>
      </div>
    </form>
        ) : null}
      </div>

    {/* Photo Modal */}
    {selectedPhotoModal.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-full p-4">
          {/* Close button */}
          <button
            onClick={closePhotoModal}
            className="absolute top-2 right-2 text-white text-2xl hover:text-gray-300 z-10"
          >
            ✕
          </button>
          
          {/* Photo */}
          <img
            src={selectedPhotoModal.photoUrl}
            alt="Full size verification photo"
            className="max-w-full max-h-screen object-contain"
          />
          
          {/* Navigation buttons */}
          {(() => {
            // Find the current action to get its photos for navigation
            const currentAction = existingCorrectiveActions.find(action => {
              const allPhotos = [
                ...(action.photos || []),
                ...(action.verificationPhotos || [])
              ];
              return allPhotos.includes(selectedPhotoModal.photoUrl);
            });
            
            const regularPhotos = currentAction?.photos || [];
            const verificationPhotos = currentAction?.verificationPhotos || [];
            
            // Use appropriate photo array based on context
            const contextPhotos = selectedPhotoModal.photoContext === 'verification' 
              ? verificationPhotos 
              : regularPhotos;
            
            if (contextPhotos.length > 1) {
              return (
                <>
                  {/* Previous button */}
                  <button
                    onClick={() => navigatePhoto('prev', contextPhotos)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                  >
                    ‹
                  </button>
                  
                  {/* Next button */}
                  <button
                    onClick={() => navigatePhoto('next', contextPhotos)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                  >
                    ›
                  </button>
                </>
              );
            }
            return null;
          })()}
          
          {/* Photo counter */}
          {(() => {
            const currentAction = existingCorrectiveActions.find(action => {
              const allPhotos = [
                ...(action.photos || []),
                ...(action.verificationPhotos || [])
              ];
              return allPhotos.includes(selectedPhotoModal.photoUrl);
            });
            
            const regularPhotos = currentAction?.photos || [];
            const verificationPhotos = currentAction?.verificationPhotos || [];
            
            // Use appropriate photo array and type based on context
            const contextPhotos = selectedPhotoModal.photoContext === 'verification' 
              ? verificationPhotos 
              : regularPhotos;
            const photoType = selectedPhotoModal.photoContext === 'verification' ? 'Verification' : 'Evidence';
            
            if (contextPhotos.length > 1) {
              return (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                  {photoType} {selectedPhotoModal.photoIndex + 1} of {contextPhotos.length}
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    )}

    {/* Corrective Action Modal */}
    <CorrectiveActionModal
      action={selectedAction}
      isOpen={isActionModalOpen}
      onClose={() => {
        setIsActionModalOpen(false);
        setSelectedAction(null);
      }}
      onUpdate={handleUpdateAction}
      onApprove={handleApproveWithVerification}
      onReject={handleRejectWithVerification}
    />
    </div>
  );
};

export default SafetyPatrolForm;
