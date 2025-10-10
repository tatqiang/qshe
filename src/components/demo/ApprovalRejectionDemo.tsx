import React, { useState } from 'react';
import { useApprovalAction, useRejectionAction } from '../../hooks/useActionWithLoading';
import { Button } from '../common/Button';

/**
 * Demo component showcasing the specialized approval and rejection action hooks
 * for green and red buttons with appropriate loading states and messaging.
 */
const ApprovalRejectionDemo: React.FC = () => {
  const [lastAction, setLastAction] = useState<string>('');

  // Mock data for testing
  const mockItems = [
    { id: '1', title: 'Safety Violation Report #001', description: 'Missing safety equipment detected' },
    { id: '2', title: 'Corrective Action #456', description: 'Install additional safety barriers' },
    { id: '3', title: 'Inspection Result #789', description: 'Electrical panel requires maintenance' }
  ];

  // Mock async approval function (simulates API call)
  const mockApproveAction = async (itemId: string): Promise<void> => {
    console.log(`🟢 Starting approval process for item: ${itemId}`);
    
    // Simulate API delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    // Simulate potential failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Network timeout during approval');
    }
    
    console.log(`✅ Item ${itemId} approved successfully`);
    setLastAction(`Approved item ${itemId} at ${new Date().toLocaleTimeString()}`);
  };

  // Mock async rejection function (simulates API call)
  const mockRejectAction = async (itemId: string): Promise<void> => {
    console.log(`🔴 Starting rejection process for item: ${itemId}`);
    
    // Simulate API delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    // Simulate potential failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Database error during rejection');
    }
    
    console.log(`❌ Item ${itemId} rejected successfully`);
    setLastAction(`Rejected item ${itemId} at ${new Date().toLocaleTimeString()}`);
  };

  // Setup approval action hook (green button)
  const { loading: approvalLoading, execute: executeApproval } = useApprovalAction({
    onSuccess: () => {
      console.log('🎉 Approval action completed successfully!');
    },
    onError: (error) => {
      console.error('💥 Approval action failed:', error);
    }
  });

  // Setup rejection action hook (red button)
  const { loading: rejectionLoading, execute: executeRejection } = useRejectionAction({
    onSuccess: () => {
      console.log('🎉 Rejection action completed successfully!');
    },
    onError: (error) => {
      console.error('💥 Rejection action failed:', error);
    }
  });

  // Handle approval button click
  const handleApprove = (itemId: string) => {
    executeApproval(() => mockApproveAction(itemId));
  };

  // Handle rejection button click
  const handleReject = (itemId: string) => {
    executeRejection(() => mockRejectAction(itemId));
  };

  const isAnyActionLoading = approvalLoading || rejectionLoading;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Approval & Rejection Demo
        </h2>
        <p className="text-gray-600 mb-6">
          Test the specialized approval (green) and rejection (red) action hooks with loading states.
        </p>

        {/* Status display */}
        {lastAction && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-blue-700">
              <strong>Last Action:</strong> {lastAction}
            </p>
          </div>
        )}

        {/* Demo items */}
        <div className="space-y-4">
          {mockItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                </div>
                
                <div className="flex space-x-3 ml-4">
                  {/* Approval Button (Green) */}
                  <button
                    type="button"
                    className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 min-w-[120px] justify-center transition-all ${
                      approvalLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => handleApprove(item.id)}
                    disabled={isAnyActionLoading}
                  >
                    {approvalLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Approve</span>
                      </>
                    )}
                  </button>

                  {/* Rejection Button (Red) */}
                  <button
                    type="button"
                    className={`px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2 min-w-[120px] justify-center transition-all ${
                      rejectionLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => handleReject(item.id)}
                    disabled={isAnyActionLoading}
                  >
                    {rejectionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <>
                        <span>✗</span>
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click any <span className="text-green-600 font-medium">Approve</span> button to test the green approval action</li>
            <li>• Click any <span className="text-red-600 font-medium">Reject</span> button to test the red rejection action</li>
            <li>• Watch the loading spinner and text changes during processing</li>
            <li>• Both buttons are disabled while any action is in progress</li>
            <li>• Success/error messages will appear as alerts</li>
            <li>• 10% chance of simulated failure for error testing</li>
          </ul>
        </div>

        {/* Loading state indicator */}
        {isAnyActionLoading && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="font-medium">
              {approvalLoading ? 'Processing approval...' : 'Processing rejection...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalRejectionDemo;