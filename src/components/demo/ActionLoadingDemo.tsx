import React from 'react';
import { useActionWithLoading, useSimpleAction } from '../../hooks/useActionWithLoading';
import { Button } from '../common/Button';

/**
 * Demo component showing how to use the useActionWithLoading hook
 * This can be imported and used to test the spinner functionality
 */
export const ActionLoadingDemo: React.FC = () => {
  // Example 1: Full configuration with custom success/error handling
  const { loading: fullConfigLoading, execute: executeFullConfig } = useActionWithLoading({
    successMessage: 'Operation completed successfully! 🎉',
    errorMessage: 'Operation failed. Please try again.',
    showSuccessAlert: true,
    showErrorAlert: true,
    onSuccess: (result) => {
      console.log('Custom success handler:', result);
    },
    onError: (error) => {
      console.error('Custom error handler:', error);
    }
  });

  // Example 2: Simple usage with just messages
  const { loading: simpleLoading, execute: executeSimple } = useSimpleAction(
    'Simple operation completed!',
    'Simple operation failed!'
  );

  // Example 3: No alerts, just custom handlers
  const { loading: customLoading, execute: executeCustom } = useActionWithLoading({
    showSuccessAlert: false,
    showErrorAlert: false,
    onSuccess: () => alert('Custom success handler executed!'),
    onError: (error) => alert(`Custom error handler: ${error.message}`)
  });

  // Mock async operations for testing
  const mockSuccessOperation = async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    return 'Operation result data';
  };

  const mockFailOperation = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
    throw new Error('Simulated operation failure');
  };

  const mockCreatePatrolOperation = async (): Promise<{ id: string; title: string }> => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
    return { id: 'patrol-123', title: 'New Safety Patrol' };
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🔄 Action Loading Hook Demo
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Full Configuration Example</h3>
          <p className="text-sm text-gray-600 mb-3">
            Shows spinner for 2 seconds, then displays success message with custom handlers.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => executeFullConfig(mockSuccessOperation)}
              loading={fullConfigLoading}
              disabled={fullConfigLoading}
            >
              Test Success (2s)
            </Button>
            <Button
              onClick={() => executeFullConfig(mockFailOperation)}
              loading={fullConfigLoading}
              disabled={fullConfigLoading}
              variant="danger"
            >
              Test Error (1.5s)
            </Button>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Simple Action Example</h3>
          <p className="text-sm text-gray-600 mb-3">
            Simplified usage with just success/error messages.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => executeSimple(mockSuccessOperation)}
              loading={simpleLoading}
              disabled={simpleLoading}
              variant="secondary"
            >
              Simple Success
            </Button>
            <Button
              onClick={() => executeSimple(mockFailOperation)}
              loading={simpleLoading}
              disabled={simpleLoading}
              variant="danger"
            >
              Simple Error
            </Button>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Custom Handlers (No Alerts)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Custom success/error handlers without automatic alert messages.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => executeCustom(mockSuccessOperation)}
              loading={customLoading}
              disabled={customLoading}
              variant="outline"
            >
              Custom Success
            </Button>
            <Button
              onClick={() => executeCustom(mockFailOperation)}
              loading={customLoading}
              disabled={customLoading}
              variant="danger"
            >
              Custom Error
            </Button>
          </div>
        </div>

        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">
            🛡️ Create Safety Patrol Simulation
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Simulates the actual "Create Safety Patrol" button behavior (3 second delay).
          </p>
          <Button
            onClick={() => executeFullConfig(mockCreatePatrolOperation)}
            loading={fullConfigLoading}
            disabled={fullConfigLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {fullConfigLoading ? 'Creating Safety Patrol...' : 'Create Safety Patrol'}
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Usage Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Buttons show spinner and change text during loading</li>
          <li>• Duplicate clicks are prevented during loading</li>
          <li>• Success/error messages are configurable</li>
          <li>• Custom handlers can be used for additional logic</li>
          <li>• Loading state automatically resets after completion</li>
        </ul>
      </div>
    </div>
  );
};

export default ActionLoadingDemo;