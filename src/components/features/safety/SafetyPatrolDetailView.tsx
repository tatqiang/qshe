import React from 'react';
import type { SafetyPatrol, RiskCategory, RiskItem } from '../../../types/safetyPatrol';

interface SafetyPatrolDetailViewProps {
  patrol: SafetyPatrol;
  photos: string[];
  riskCategories: RiskCategory[];
  riskItems: RiskItem[];
  onPhotoClick?: (photoUrl: string, photoIndex: number) => void;
  canEdit?: boolean;
  onEdit?: () => void;
  currentUser?: any;
}

const SafetyPatrolDetailView: React.FC<SafetyPatrolDetailViewProps> = ({
  patrol,
  photos,
  riskCategories,
  riskItems,
  onPhotoClick,
  canEdit = false,
  onEdit,
  currentUser
}) => {
  // Get patrol type display text
  const getPatrolTypeDisplay = (type: string) => {
    const typeMap = {
      'scheduled': 'Scheduled Patrol',
      'random': 'Random Patrol', 
      'incident_followup': 'Incident Follow-up'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Get risk level color and text - Updated classification
  const getRiskLevel = (likelihood: number, severity: number) => {
    const riskScore = likelihood * severity;
    if (riskScore >= 12) return { level: 'EXTREMELY HIGH', color: 'bg-red-100 text-red-800', priority: '🔴' };
    if (riskScore >= 8) return { level: 'HIGH', color: 'bg-orange-100 text-orange-800', priority: '�' };
    if (riskScore >= 3) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800', priority: '�' };
    return { level: 'LOW', color: 'bg-green-100 text-green-800', priority: '🟢' };
  };

  // Get selected risk categories and items for display
  const getSelectedRiskCategories = () => {
    return patrol.riskCategories || [];
  };

  const getSelectedRiskItems = () => {
    return patrol.riskItems || [];
  };

  // Check if patrol can be edited (creator within 60 minutes of creation)
  const canEditPatrol = (): boolean => {
    if (!patrol.createdAt) return false;
    if (!currentUser?.id) return false;
    if (patrol.createdBy !== currentUser.id) return false;
    
    const creationTime = new Date(patrol.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDifferenceMinutes = (currentTime - creationTime) / (1000 * 60);
    
    return timeDifferenceMinutes <= 60;
  };

  const riskInfo = getRiskLevel(patrol.likelihood || 1, patrol.severity || 1);
  const selectedCategories = getSelectedRiskCategories();
  const selectedItems = getSelectedRiskItems();

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Combined Safety Patrol Information - Single Blue Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <div>
            <h3 className="font-medium text-blue-900 flex items-center text-base sm:text-lg">
              🛡️ Safety Patrol Report
            </h3>
            {patrol.createdAt && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Created: {new Date(patrol.createdAt).toLocaleDateString()} {new Date(patrol.createdAt).toLocaleTimeString()}
                {!canEditPatrol() && <span className="text-red-600"> (Edit period expired)</span>}
              </p>
            )}
          </div>
          {(() => {
            const withinTimeLimit = canEditPatrol();
            const hasPermission = canEdit && onEdit;
            const showButton = hasPermission; // Always show if user has permission
            
            if (!showButton) return null;
            
            const isDisabled = !withinTimeLimit;
            const creationDate = patrol.createdAt ? new Date(patrol.createdAt) : null;
            const alertMessage = creationDate 
              ? `Created: ${creationDate.toLocaleDateString()} ${creationDate.toLocaleTimeString()} (Edit period expired)`
              : 'Edit period expired';
            
            return (
              <button
                type="button"
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border text-xs sm:text-sm rounded flex items-center space-x-1.5 sm:space-x-2 font-medium ${
                  isDisabled 
                    ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' 
                    : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                }`}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) {
                    alert(alertMessage);
                  } else if (onEdit) {
                    onEdit();
                  }
                }}
                title={isDisabled ? 'Edit period expired' : 'Edit this patrol'}
              >
                <span>✏️</span>
                <span>Edit</span>
              </button>
            );
          })()}
        </div>
        
        {/* Basic Information Section */}
        <div className="mb-3 sm:mb-6">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📋 Patrol Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Patrol Type: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{getPatrolTypeDisplay(patrol.patrolType || 'scheduled')}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Patrol Date: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{patrol.createdAt ? new Date(patrol.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          {/* Title and Description - moved here and styled like input */}
          <div className="mb-2 sm:mb-4">
            <div className="mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Title: </span>
              <div className="mt-1 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded border text-sm sm:text-base font-medium text-gray-900">
                {patrol.title || 'No title provided'}
              </div>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Description: </span>
              <div className="mt-1 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded border text-xs sm:text-base text-gray-900 min-h-[50px] sm:min-h-[60px] leading-normal sm:leading-relaxed">
                {patrol.description || 'No description provided'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Location: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{patrol.location || 'No location specified'}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Specific Location: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{patrol.specificLocation || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <div className="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">⚠️ Risk Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Risk Level: </span>
              <span className={`inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs sm:text-sm font-medium rounded-full ${riskInfo.color}`}>
                {riskInfo.priority} {riskInfo.level}
              </span>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Score: {(patrol.likelihood || 1) * (patrol.severity || 1)}</div>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Likelihood: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">Level {patrol.likelihood || 1} of 5</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Severity: </span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">Level {patrol.severity || 1} of 5</span>
            </div>
          </div>

          {/* Immediate Hazard & Work Stopped - removed "Actions Required" label */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Immediate Hazard: </span>
              <span className={`inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                patrol.immediateHazard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {patrol.immediateHazard ? '🚨 YES' : '✅ NO'}
              </span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Work Stopped: </span>
              <span className={`inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                patrol.workStopped ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {patrol.workStopped ? '🛑 YES' : '▶️ NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Categories & Items Section */}
        {(selectedCategories.length > 0 || selectedItems.length > 0) && (
          <div className="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📋 Risk Categories & Items</h4>
            
            {selectedCategories.length > 0 && (
              <div className="mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Categories: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCategories.map((category) => (
                    <span key={category.id} className="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 rounded">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.length > 0 && (
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Items: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedItems.map((item) => (
                    <span key={item.id} className="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 rounded">
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence Photos Section */}
        {photos.length > 0 && (
          <div className="pt-2 sm:pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 sm:mb-4 text-sm sm:text-base">📸 Evidence Photos</h4>
            
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {photos.map((photoUrl, index) => (
                <div key={index} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={photoUrl}
                    alt={`Evidence photo ${index + 1}`}
                    className="w-full h-16 sm:h-20 object-cover rounded border"
                    onClick={() => onPhotoClick && onPhotoClick(photoUrl, index)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 text-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-600">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
            </div>
          </div>
        )}

        {/* Remark Section */}
        <div className="pt-2 sm:pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">💬 Remark</h4>
          <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
            {patrol.remark && patrol.remark.trim() ? (
              <p className="text-xs sm:text-base text-gray-700 whitespace-pre-wrap leading-normal sm:leading-relaxed">{patrol.remark}</p>
            ) : (
              <p className="text-xs sm:text-base text-gray-500 italic">No remark provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPatrolDetailView;