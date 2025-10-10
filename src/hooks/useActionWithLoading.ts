import { useState, useCallback } from 'react';

interface UseActionWithLoadingOptions {
  onSuccess?: (result?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessAlert?: boolean;
  showErrorAlert?: boolean;
}

interface UseActionWithLoadingReturn {
  loading: boolean;
  execute: (actionFn: () => Promise<any>) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for handling async actions with loading state and optional success/error handling
 * 
 * @param options Configuration options for success/error handling
 * @returns Object containing loading state, execute function, and reset function
 * 
 * @example
 * const { loading, execute } = useActionWithLoading({
 *   successMessage: 'Operation completed successfully!',
 *   errorMessage: 'Operation failed. Please try again.',
 *   onSuccess: (result) => console.log('Success:', result),
 *   onError: (error) => console.error('Error:', error)
 * });
 * 
 * const handleSubmit = () => {
 *   execute(async () => {
 *     const result = await apiCall();
 *     return result;
 *   });
 * };
 */
export const useActionWithLoading = (options: UseActionWithLoadingOptions = {}): UseActionWithLoadingReturn => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessAlert = true,
    showErrorAlert = true
  } = options;

  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (actionFn: () => Promise<any>): Promise<void> => {
    if (loading) {
      console.warn('Action already in progress, ignoring duplicate call');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting action execution...');
      const startTime = Date.now();
      
      const result = await actionFn();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Action completed successfully in ${duration}ms`, result);

      // Handle success
      if (successMessage && showSuccessAlert) {
        alert(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Action failed:', errorObj);

      // Handle error
      const finalErrorMessage = errorMessage || errorObj.message || 'An unexpected error occurred';
      
      if (showErrorAlert) {
        alert(finalErrorMessage);
      }
      
      if (onError) {
        onError(errorObj);
      }

    } finally {
      setLoading(false);
      console.log('🏁 Action execution finished');
    }
  }, [loading, onSuccess, onError, successMessage, errorMessage, showSuccessAlert, showErrorAlert]);

  const reset = useCallback(() => {
    setLoading(false);
  }, []);

  return {
    loading,
    execute,
    reset
  };
};

/**
 * Simplified version of useActionWithLoading for basic use cases
 * 
 * @param successMessage Optional success message to show
 * @param errorMessage Optional error message to show
 * @returns Object containing loading state and execute function
 * 
 * @example
 * const { loading, execute } = useSimpleAction('Saved successfully!');
 * 
 * const handleSave = () => {
 *   execute(() => saveData());
 * };
 */
export const useSimpleAction = (successMessage?: string, errorMessage?: string) => {
  return useActionWithLoading({
    successMessage,
    errorMessage,
    showSuccessAlert: !!successMessage,
    showErrorAlert: !!errorMessage
  });
};

/**
 * Specialized hook for approval actions (green buttons)
 * 
 * @param options Optional configuration to override defaults
 * @returns Object containing loading state and execute function with approval-specific defaults
 * 
 * @example
 * const { loading: approvalLoading, execute: executeApproval } = useApprovalAction({
 *   onSuccess: () => refreshData()
 * });
 * 
 * const handleApprove = (actionId: string) => {
 *   executeApproval(() => approveAction(actionId));
 * };
 */
export const useApprovalAction = (options: UseActionWithLoadingOptions = {}) => {
  return useActionWithLoading({
    successMessage: 'Successfully approved!',
    errorMessage: 'Failed to approve. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    ...options
  });
};

/**
 * Specialized hook for rejection actions (red buttons)
 * 
 * @param options Optional configuration to override defaults
 * @returns Object containing loading state and execute function with rejection-specific defaults
 * 
 * @example
 * const { loading: rejectionLoading, execute: executeRejection } = useRejectionAction({
 *   onSuccess: () => refreshData()
 * });
 * 
 * const handleReject = (actionId: string) => {
 *   executeRejection(() => rejectAction(actionId));
 * };
 */
export const useRejectionAction = (options: UseActionWithLoadingOptions = {}) => {
  return useActionWithLoading({
    successMessage: 'Successfully rejected!',
    errorMessage: 'Failed to reject. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    ...options
  });
};

/**
 * Specialized hook for deletion actions (red buttons with confirmation)
 * 
 * @param options Optional configuration to override defaults
 * @returns Object containing loading state and execute function with deletion-specific defaults
 * 
 * @example
 * const { loading: deletionLoading, execute: executeDeletion } = useDeletionAction({
 *   onSuccess: () => refreshUserList()
 * });
 * 
 * const handleDelete = (userId: string) => {
 *   if (confirm('Are you sure you want to delete this user?')) {
 *     executeDeletion(() => deleteUser(userId));
 *   }
 * };
 */
export const useDeletionAction = (options: UseActionWithLoadingOptions = {}) => {
  return useActionWithLoading({
    successMessage: 'Successfully deleted!',
    errorMessage: 'Failed to delete. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    ...options
  });
};