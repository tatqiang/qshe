import React, { useMemo } from 'react';

interface CorrectiveActionDetailViewProps {
  action: any; // Using any for now since we need to check the actual data structure
  onPhotoClick?: (photoUrl: string, photoIndex: number) => void;
  onVerificationPhotoClick?: (photoUrl: string, photoIndex: number, verificationPhotos: string[]) => void; // New prop for verification photos
  canEdit?: boolean;
  onEdit?: () => void;
  onEditVerification?: () => void;
  onOpenVerification?: () => void;
  onCreateCorrection?: (patrolId: string) => void; // New prop for creating corrections
  currentUser?: any;
  isVerificationFormOpen?: boolean; // Add prop to track if verification form is open
  allCorrectiveActions?: any[]; // Add prop to check for newer corrective actions
  isCorrectiveActionFormOpen?: boolean; // Add prop to track if corrective action form is open
  patrolData?: any; // Add prop to check patrol creator
  verificationFormContent?: React.ReactNode; // Add prop to render verification form inside
}

const CorrectiveActionDetailView: React.FC<CorrectiveActionDetailViewProps> = ({
  action,
  onPhotoClick,
  onVerificationPhotoClick,
  canEdit = false,
  onEdit,
  onEditVerification,
  onOpenVerification,
  onCreateCorrection,
  currentUser,
  isVerificationFormOpen = false,
  allCorrectiveActions = [],
  isCorrectiveActionFormOpen = false,
  patrolData,
  verificationFormContent
}) => {
  // Check if within 60-minute edit window
  const isWithinEditWindow = (verificationDate: string): boolean => {
    const verificationTime = new Date(verificationDate).getTime();
    const currentTime = new Date().getTime();
    const timeDifferenceMinutes = (currentTime - verificationTime) / (1000 * 60);
    return timeDifferenceMinutes <= 60;
  };

  // Check if action can be edited (assigned user within 60 minutes of creation)
  const canEditAction = (): boolean => {
    console.log('🔍 Checking edit permissions:', {
      hasCreatedAt: !!action.created_at,
      hasCurrentUser: !!currentUser?.id,
      currentUserId: currentUser?.id,
      assignedTo: action.assigned_to,
      createdBy: action.created_by,
      action: action
    });
    
    if (!action.created_at) {
      console.log('❌ No creation date');
      return false;
    }
    if (!currentUser?.id) {
      console.log('❌ No current user');
      return false;
    }
    if (action.assigned_to !== currentUser.id && action.created_by !== currentUser.id) {
      console.log('❌ User not authorized - not assigned to or creator');
      return false;
    }
    
    const creationTime = new Date(action.created_at).getTime();
    const currentTime = new Date().getTime();
    const timeDifferenceMinutes = (currentTime - creationTime) / (1000 * 60);
    const withinTimeLimit = timeDifferenceMinutes <= 60;
    
    console.log('🔍 Time check:', {
      creationTime: new Date(action.created_at),
      currentTime: new Date(),
      timeDifferenceMinutes,
      withinTimeLimit
    });
    
    return withinTimeLimit;
  };

  // Get verification data
  const getVerificationData = () => {
    const verificationDate = action.verified_date || action.verification_date;
    if (!verificationDate) return null;
    
    const isRejected = action.verification_notes?.startsWith('REJECTED:');
    
    return {
      verifierName: action.verified_by || 'Unknown',
      verificationDate: new Date(verificationDate).toLocaleString(),
      verificationNotes: action.verification_notes || '',
      isRejected: isRejected
    };
  };

  const verificationData = getVerificationData();
  
  // Check if there are newer corrective actions after this rejected one
  const hasNewerCorrectiveActions = () => {
    if (!verificationData?.isRejected || !allCorrectiveActions.length) return false;
    
    const thisActionCreated = new Date(action.created_at).getTime();
    
    // Check if there are any corrective actions created after this rejected one
    return allCorrectiveActions.some(otherAction => {
      if (otherAction.id === action.id) return false; // Skip self
      const otherActionCreated = new Date(otherAction.created_at).getTime();
      return otherActionCreated > thisActionCreated;
    });
  };

  // Check if current user can start verification (only patrol creator) - Memoized to prevent excessive re-calculations
  const canStartVerification = useMemo(() => {
    if (!currentUser || !patrolData) {
      console.log('🔍 Verification check: Missing user or patrol data');
      return false;
    }
    
    const isCreator = currentUser.id === patrolData.createdBy;
    console.log('🔍 Verification permission result:', { isCreator, userId: currentUser.id, createdBy: patrolData.createdBy });
    
    // Only the patrol creator can start verification
    return isCreator;
  }, [currentUser?.id, patrolData?.createdBy]);

  // Get action type display text
  const getActionTypeDisplay = (type: string) => {
    const typeMap = {
      'immediate': 'Immediate Action',
      'short_term': 'Short Term',
      'long_term': 'Long Term',
      'preventive': 'Preventive'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Get status color and text
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'assigned': { text: 'Assigned', color: 'bg-blue-100 text-blue-800', icon: '📋' },
      'in_progress': { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: '🔄' },
      'completed': { text: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
      'verified': { text: 'Verified', color: 'bg-purple-100 text-purple-800', icon: '✔️' },
      'overdue': { text: 'Overdue', color: 'bg-red-100 text-red-800', icon: '⚠️' },
      'rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' }
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '📄' };
  };

  const statusInfo = getStatusDisplay(action.status || 'assigned');
  const regularPhotos = action.photos || [];
  const verificationPhotos = action.verificationPhotos || [];

  return (
    <div className="space-y-6">
      {/* Single Yellow Box for All Corrective Action Details */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
          {/* Title section - full width */}
          <div className="mb-2">
            <h3 className="font-medium text-yellow-900 flex items-center text-sm sm:text-base md:text-lg">
              🔧 Corrective Action Details
            </h3>
          </div>
          
          {/* Date section - full width */}
          {action.created_at && (
            <div className="mb-2">
              <p className="text-xs sm:text-sm text-gray-600">
                Created: {new Date(action.created_at).toLocaleDateString()} {new Date(action.created_at).toLocaleTimeString()}
                {!canEditAction() && <span className="text-red-600"> (Edit period expired)</span>}
              </p>
            </div>
          )}
          
          {/* Edit button section - separate row */}
          {(() => {
            const withinTimeLimit = canEditAction();
            const hasPermission = canEdit && onEdit;
            const showButton = hasPermission; // Always show if user has permission
            
            console.log('🔍 Edit button visibility:', {
              canEdit,
              canEditAction: withinTimeLimit,
              hasOnEdit: !!onEdit,
              withinTimeLimit,
              hasPermission,
              showButton
            });
            
            if (!showButton) return null;
            
            const isDisabled = !withinTimeLimit;
            const creationDate = action.created_at ? new Date(action.created_at) : null;
            const alertMessage = creationDate 
              ? `Created: ${creationDate.toLocaleDateString()} ${creationDate.toLocaleTimeString()} (Edit period expired)`
              : 'Edit period expired';
            
            return (
              <button
                type="button"
                className={`px-4 py-2 border text-sm rounded flex items-center space-x-2 font-medium w-fit ${
                  isDisabled 
                    ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' 
                    : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                }`}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) {
                    alert(alertMessage);
                  } else {
                    console.log('🔍 Edit button clicked!');
                    onEdit();
                  }
                }}
              >
                <span>✏️</span>
                <span>Edit</span>
                {isDisabled && <span className="text-xs">(Expired)</span>}
              </button>
            );
          })()}
        </div>
        
        {/* Action Information */}
        <div className="mb-6">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Action By: </span>
            <span className="text-base text-gray-900 font-medium">
              {(() => {
                console.log('🔍 Action assigned_to:', action.assigned_to);
                console.log('🔍 Action assignedToUser:', action.assignedToUser);
                
                if (action.assignedToUser?.first_name && action.assignedToUser?.last_name) {
                  return `${action.assignedToUser.first_name} ${action.assignedToUser.last_name}`;
                }
                if (action.assignedToUser?.firstName && action.assignedToUser?.lastName) {
                  return `${action.assignedToUser.firstName} ${action.assignedToUser.lastName}`;
                }
                if (action.assignedToUser?.email) {
                  return action.assignedToUser.email;
                }
                if (action.assigned_to_email) {
                  return action.assigned_to_email;
                }
                return action.assigned_to || 'Not assigned';
              })()} 
            </span>
          </div>

          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Action Date: </span>
            <span className="text-base text-gray-900 font-medium">
              {action.due_date ? new Date(action.due_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          {/* Description - styled like input */}
          <div className="mb-6">
            <span className="text-sm font-medium text-gray-700">Description: </span>
            <div className="mt-1 bg-white px-3 py-2 rounded border text-sm sm:text-base text-gray-900 min-h-[60px] leading-relaxed">
              {action.description || 'No description provided'}
            </div>
          </div>

          {/* Root Cause Analysis */}
          {action.root_cause_analysis && (
            <div className="mb-6">
              <span className="text-sm font-medium text-gray-700">Root Cause Analysis: </span>
              <div className="text-base text-gray-900 mt-1">
                {action.root_cause_analysis}
              </div>
            </div>
          )}
        </div>

        {/* Evidence Photos Section */}
        {regularPhotos.length > 0 && (
          <div className="pt-4 border-t border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-4 text-sm sm:text-base">📸 Evidence Photos</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {regularPhotos.map((photoUrl: string, index: number) => (
                <div key={index} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={photoUrl}
                    alt={`Evidence photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                    onClick={() => onPhotoClick && onPhotoClick(photoUrl, index)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              {regularPhotos.length} evidence photo{regularPhotos.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Cost & Resources (if available) */}
        {(action.estimated_cost || action.actual_cost || action.resources_required) && (
          <div className="pt-4 border-t border-yellow-200 mt-4">
            <h4 className="font-medium text-yellow-800 mb-3 text-base">💰 Cost & Resources</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {action.estimated_cost && (
                <div>
                  <span className="font-medium text-gray-700">Estimated: </span>
                  <span className="text-gray-900">${action.estimated_cost.toLocaleString()}</span>
                </div>
              )}
              {action.actual_cost && (
                <div>
                  <span className="font-medium text-gray-700">Actual: </span>
                  <span className="text-gray-900">${action.actual_cost.toLocaleString()}</span>
                </div>
              )}
              {action.resources_required && (
                <div>
                  <span className="font-medium text-gray-700">Resources: </span>
                  <span className="text-gray-900">{action.resources_required}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Section - Always show INSIDE corrective action box only */}
        {(() => {
          console.log('🔍 Verification section check:', {
            hasVerifiedDate: !!action.verified_date,
            hasVerificationDate: !!action.verification_date,
            status: action.status,
            isCompleted: action.status === 'completed',
            needsVerification: (action.status === 'completed' || action.status === 'assigned' || action.status === 'in_progress') && !action.verified_date && !action.verification_date,
            verificationData: verificationData,
            verificationNotes: action.verification_notes,
            verifiedBy: action.verified_by
          });
          
          // Check both verified_date and verification_date fields
          const hasVerification = action.verified_date || action.verification_date;
          
          if (hasVerification && verificationData && !isVerificationFormOpen) {
            return (
              <div className={`border-t border-yellow-200 mt-6 pt-6 px-4 py-4 rounded-lg ${
                verificationData.isRejected
                  ? 'bg-red-50 border-red-200'
                  : action.status === 'completed' || action.status === 'verified' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="mb-4">
                  {/* Status section - full width */}
                  <div className="mb-2">
                    <h4 className={`font-medium text-sm sm:text-base ${
                      verificationData.isRejected
                        ? 'text-red-900'
                        : action.status === 'completed' || action.status === 'verified'
                        ? 'text-green-900'
                        : 'text-gray-900'
                    }`}>
                      {verificationData.isRejected ? '❌ Rejected' : '✅ Verified'}
                    </h4>
                  </div>
                  
                  {/* Date section - full width */}
                  {action.verification_date && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        Verified: {new Date(action.verification_date).toLocaleDateString()} {new Date(action.verification_date).toLocaleTimeString()}
                        {!canEditAction() && <span className="text-red-600"> (Edit period expired)</span>}
                      </p>
                    </div>
                  )}
                  {action.verified_date && !action.verification_date && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        Verified: {new Date(action.verified_date).toLocaleDateString()} {new Date(action.verified_date).toLocaleTimeString()}
                        {!canEditAction() && <span className="text-red-600"> (Edit period expired)</span>}
                      </p>
                    </div>
                  )}
                  
                  {/* Edit button section - separate row */}
                  {(() => {
                    const verificationDate = action.verification_date || action.verified_date;
                    const withinTimeLimit = canEditAction();
                    const hasPermission = canEdit && onEditVerification;
                    const showButton = hasPermission;
                    
                    if (!showButton) return null;
                    
                    const isDisabled = !withinTimeLimit;
                    const dateObj = verificationDate ? new Date(verificationDate) : null;
                    const alertMessage = dateObj 
                      ? `Verified: ${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()} (Edit period expired)`
                      : 'Edit period expired';
                    
                    return (
                      <button
                        type="button"
                        className={`px-3 py-1 text-sm rounded flex items-center space-x-1 font-medium w-fit ${
                          isDisabled 
                            ? 'border border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) {
                            alert(alertMessage);
                          } else {
                            console.log('🔍 Verification edit button clicked!');
                            onEditVerification();
                          }
                        }}
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                        {isDisabled && <span className="text-xs">(Expired)</span>}
                      </button>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Verified By: </span>
                    <span className="text-base text-gray-900 font-medium">
                      {(() => {
                        if (action.verifiedByUser?.first_name && action.verifiedByUser?.last_name) {
                          return `${action.verifiedByUser.first_name} ${action.verifiedByUser.last_name}`;
                        }
                        if (action.verifiedByUser?.email) {
                          return action.verifiedByUser.email;
                        }
                        return verificationData.verifierName;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Verification Date: </span>
                    <span className="text-base text-gray-900 font-medium">{verificationData.verificationDate}</span>
                  </div>
                </div>
                {verificationData.verificationNotes && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-700">Notes: </span>
                    <div className="text-base text-gray-900 mt-1">{verificationData.verificationNotes}</div>
                  </div>
                )}

                {/* Add Correction button for rejected actions */}
                {verificationData.isRejected && onCreateCorrection && !hasNewerCorrectiveActions() && !isCorrectiveActionFormOpen && (
                  <div className="mt-6 pt-4 border-t border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-red-900 text-sm">Need to Create Correction?</h5>
                        <p className="text-xs text-red-700 mt-1">
                          This action was rejected. You can create a new corrective action to address the concerns.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                        onClick={() => {
                          console.log('🔧 Creating correction for rejected action:', action.id);
                          onCreateCorrection(action.patrol_id);
                        }}
                      >
                        <span>🔧</span>
                        <span>Add Correction</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Verification Photos Section - Always show inside corrective action box */}
                {action.verificationPhotos && action.verificationPhotos.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-4 text-base">📸 Verification Photos</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {action.verificationPhotos.map((photoUrl: string, index: number) => (
                        <div key={index} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                          <img
                            src={photoUrl}
                            alt={`Verification photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            onClick={() => {
                              // Use specialized verification photo click handler if available
                              if (onVerificationPhotoClick) {
                                onVerificationPhotoClick(photoUrl, index, action.verificationPhotos);
                              } else if (onPhotoClick) {
                                // Fallback to regular photo click
                                onPhotoClick(photoUrl, index);
                              }
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                            Verification {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600">
                      {action.verificationPhotos.length} verification photo{action.verificationPhotos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Show message when correction has been addressed */}
                {verificationData.isRejected && hasNewerCorrectiveActions() && (
                  <div className="mt-6 pt-4 border-t border-green-200 bg-green-50 p-3 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <h5 className="font-medium text-green-900 text-sm">Correction Addressed</h5>
                        <p className="text-xs text-green-700 mt-1">
                          New corrective actions have been created to address this rejection.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          } else if ((action.status === 'completed' || action.status === 'assigned' || action.status === 'in_progress') && !hasVerification) {
            console.log('🟢 Showing verification required section for status:', action.status);
            return (
              <div className="mt-6 pt-6 px-4 py-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-orange-900 text-sm sm:text-base">
                      ⚠️ Verification Required
                    </h4>
                  </div>
                  {!isVerificationFormOpen && canStartVerification && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center space-x-2 font-medium"
                      onClick={() => {
                        console.log('🔍 Verification button clicked!');
                        if (onOpenVerification) {
                          onOpenVerification();
                        }
                      }}
                    >
                      <span>📋</span>
                      <span>Start Verification</span>
                    </button>
                  )}
                  {!isVerificationFormOpen && !canStartVerification && (
                    <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border border-gray-300 flex items-center space-x-2 font-medium">
                      <span>📋</span>
                      <span>Only Patrol Creator Can Verify</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          return null;
        })()}

        {/* Render Verification Form Inside the Yellow Box */}
        {isVerificationFormOpen && verificationFormContent && (
          <div className="mt-4 pt-4 border-t border-yellow-300">
            {verificationFormContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectiveActionDetailView;