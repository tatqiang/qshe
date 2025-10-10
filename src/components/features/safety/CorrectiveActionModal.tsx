import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { CommonPhotoUpload } from '../../common/CommonPhotoUpload';
import { useCurrentUser } from '../../../contexts/AppContext';

interface CorrectiveActionModalProps {
  action: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (actionId: string, updates: any) => void;
  onApprove?: (actionId: string, reviewData: any) => void;
  onReject?: (actionId: string, reviewData: any) => void;
}

export const CorrectiveActionModal: React.FC<CorrectiveActionModalProps> = ({
  action,
  isOpen,
  onClose,
  onUpdate,
  onApprove,
  onReject
}) => {
  const currentUser = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(action?.description || '');
  const [photos, setPhotos] = useState<string[]>(action?.photos || []);
  
  // Verification states
  const [reviewDescription, setReviewDescription] = useState('');
  const [verificationPhotos, setVerificationPhotos] = useState<string[]>([]);
  
  if (!isOpen || !action) return null;

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(action.id, {
        description,
        photos
      });
    }
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(action.id, {
        reviewDescription,
        verificationPhotos,
        verifiedBy: currentUser?.email,
        verificationResult: 'approved'
      });
    }
    onClose();
  };

  const handleReject = () => {
    if (onReject) {
      onReject(action.id, {
        reviewDescription,
        verificationPhotos,
        verifiedBy: currentUser?.email,
        verificationResult: 'rejected'
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {action.action_number} - {action.action_type?.toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Created: {new Date(action.created_at).toLocaleDateString()}
              {action.due_date && ` | Due: ${new Date(action.due_date).toLocaleDateString()}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && action.status === 'assigned' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patrol Created Successfully Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✓ Patrol Created Successfully</h4>
            <p className="text-green-800 text-sm">
              This patrol has been saved. Review the corrective action details below.
            </p>
          </div>

          {/* Corrective Action Form */}
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Corrective Action' : 'Corrective Action Details'}
            </h3>

            {/* Action Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${
                  !isEditing ? 'bg-gray-50' : ''
                }`}
                placeholder="Describe the corrective action required..."
              />
            </div>

            {/* Photos Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos
              </label>
              <CommonPhotoUpload
                onPhotosUploaded={setPhotos}
                contextType="corrective-action"
                contextId={action.id}
                maxPhotos={3}
                label="Corrective Action Photos"
                placeholder="Upload photos related to this corrective action..."
                initialPhotos={photos}
                disabled={!isEditing}
              />
            </div>

            {/* Action By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action By
              </label>
              <div className="flex items-center space-x-3 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                {currentUser && (
                  <>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {currentUser.name 
                            ? currentUser.name.charAt(0).toUpperCase() 
                            : currentUser.email.charAt(0).toUpperCase()
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser.name || currentUser.email}
                      </p>
                      {currentUser.name && (
                        <p className="text-xs text-gray-500">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form Actions */}
            {isEditing && (
              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setDescription(action.description);
                    setPhotos(action.photos || []);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Verification Section */}
          {(action.status === 'pending' || action.status === 'assigned') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-yellow-900">
                📋 Verification & Approval
              </h3>

              {/* Review Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Description
                </label>
                <textarea
                  rows={3}
                  value={reviewDescription}
                  onChange={(e) => setReviewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Add your review comments and verification notes..."
                />
              </div>

              {/* Verification Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Photos
                </label>
                <CommonPhotoUpload
                  onPhotosUploaded={setVerificationPhotos}
                  contextType="corrective-action"
                  contextId={`${action.id}-verification`}
                  maxPhotos={3}
                  label="Verification Photos"
                  placeholder="Upload photos showing verification or completion status..."
                  initialPhotos={verificationPhotos}
                />
              </div>

              {/* Verify By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verify By
                </label>
                <div className="flex items-center space-x-3 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                  {currentUser && (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {currentUser.name 
                              ? currentUser.name.charAt(0).toUpperCase() 
                              : currentUser.email.charAt(0).toUpperCase()
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.name || currentUser.email}
                        </p>
                        <p className="text-xs text-gray-500">Verification Officer</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Verification Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Results
                </label>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleApprove}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>✓</span>
                    <span>Approve</span>
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                  >
                    <span>✗</span>
                    <span>Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
