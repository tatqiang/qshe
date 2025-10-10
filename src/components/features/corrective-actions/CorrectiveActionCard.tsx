import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import type { 
  CorrectiveActionEnhanced, 
  ApprovalFormData, 
  ActionPhotoType,
  ApprovalLevel,
  ActionStatusEnhanced 
} from '../../../types/correctiveActionsEnhanced';

interface CorrectiveActionCardProps {
  action: CorrectiveActionEnhanced;
  currentUserId: string;
  currentUserRole: string;
  onApprove?: (actionId: string, approvalLevel: ApprovalLevel, data: ApprovalFormData) => Promise<void>;
  onUpdateStatus?: (actionId: string, status: ActionStatusEnhanced) => Promise<void>;
  onUploadPhotos?: (actionId: string, photoType: ActionPhotoType, files: FileList) => Promise<void>;
  onViewDetails?: (actionId: string) => void;
}

const CorrectiveActionCard: React.FC<CorrectiveActionCardProps> = ({
  action,
  currentUserId,
  currentUserRole,
  onApprove,
  onUpdateStatus,
  onUploadPhotos,
  onViewDetails
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<ActionPhotoType>('evidence');
  const [approvalData, setApprovalData] = useState<ApprovalFormData>({
    decision: 'approved',
    notes: '',
    conditions: '',
    rejectionReason: ''
  });

  // Determine if current user can approve at current level
  const canApprove = () => {
    if (!action.currentApprovalLevel) return false;
    
    const roleToApprovalLevel: Record<string, ApprovalLevel[]> = {
      'supervisor': ['supervisor'],
      'manager': ['manager'],
      'safety_officer': ['safety_officer'],
      'admin': ['supervisor', 'manager', 'safety_officer'],
      'system_admin': ['supervisor', 'manager', 'safety_officer', 'executive']
    };

    const allowedLevels = roleToApprovalLevel[currentUserRole] || [];
    return allowedLevels.includes(action.currentApprovalLevel);
  };

  // Determine if current user is assigned to this action
  const isAssigned = action.assignedTo === currentUserId;

  // Get status color and icon
  const getStatusDisplay = (status: ActionStatusEnhanced) => {
    const displays = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: DocumentTextIcon, text: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Rejected' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'In Progress' },
      pending_review: { color: 'bg-purple-100 text-purple-800', icon: ClockIcon, text: 'Pending Review' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, text: 'Cancelled' }
    };
    return displays[status] || displays.draft;
  };

  const statusDisplay = getStatusDisplay(action.status);
  const StatusIcon = statusDisplay.icon;

  const handleApprovalSubmit = async () => {
    if (!onApprove || !action.currentApprovalLevel) return;
    
    try {
      await onApprove(action.id, action.currentApprovalLevel, approvalData);
      setShowApprovalModal(false);
      setApprovalData({ decision: 'approved', notes: '', conditions: '', rejectionReason: '' });
    } catch (error) {
      console.error('Failed to submit approval:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadPhotos || !e.target.files) return;
    
    try {
      await onUploadPhotos(action.id, selectedPhotoType, e.target.files);
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Failed to upload photos:', error);
    }
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(action.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {action.actionNumber}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusDisplay.text}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {action.description}
              </p>
            </div>
            
            {/* Action Type Badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {action.actionType.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Assignment and Due Date */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span>Assigned to: {action.assignedToUser?.full_name || 'Unknown'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className={daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : ''}>
                Due: {new Date(action.dueDate).toLocaleDateString()}
                {daysUntilDue < 0 && ' (Overdue)'}
                {daysUntilDue >= 0 && ` (${daysUntilDue} days)`}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{action.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${action.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Approval Workflow */}
          {action.approvals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Approval Status</h4>
              <div className="flex items-center space-x-2">
                {action.approvals.map((approval, index) => (
                  <div
                    key={approval.id}
                    className={`flex items-center px-2 py-1 rounded text-xs ${
                      approval.approvalStatus === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : approval.approvalStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {approval.approvalStatus === 'approved' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                    {approval.approvalStatus === 'rejected' && <XCircleIcon className="h-3 w-3 mr-1" />}
                    {approval.approvalStatus === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                    <span>{approval.approvalLevel.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Summary */}
          {action.photos.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <CameraIcon className="h-4 w-4 mr-2" />
              <span>{action.photos.length} photo{action.photos.length !== 1 ? 's' : ''} attached</span>
              <div className="ml-2 flex space-x-1">
                {action.planningPhotos.length > 0 && <span className="px-1 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">Planning</span>}
                {action.beforePhotos.length > 0 && <span className="px-1 py-0.5 bg-yellow-100 text-yellow-600 rounded text-xs">Before</span>}
                {action.duringPhotos.length > 0 && <span className="px-1 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">During</span>}
                {action.afterPhotos.length > 0 && <span className="px-1 py-0.5 bg-green-100 text-green-600 rounded text-xs">After</span>}
                {action.evidencePhotos.length > 0 && <span className="px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">Evidence</span>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              {canApprove() && (
                <Button
                  size="sm"
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Review & Approve
                </Button>
              )}
              
              {isAssigned && action.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus?.(action.id, 'in_progress')}
                >
                  Start Work
                </Button>
              )}
              
              {isAssigned && action.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPhotoUpload(true)}
                >
                  Add Photos
                </Button>
              )}
              
              {isAssigned && action.status === 'in_progress' && action.progressPercentage >= 90 && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus?.(action.id, 'pending_review')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Complete
                </Button>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails?.(action.id)}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Approval Modal */}
      <Modal 
        isOpen={showApprovalModal} 
        onClose={() => setShowApprovalModal(false)}
        title={`Approve ${action.actionNumber}`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Action Description</h4>
            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="approved"
                  checked={approvalData.decision === 'approved'}
                  onChange={(e) => setApprovalData({ ...approvalData, decision: e.target.value as 'approved' | 'rejected' })}
                  className="mr-2"
                />
                Approve
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="rejected"
                  checked={approvalData.decision === 'rejected'}
                  onChange={(e) => setApprovalData({ ...approvalData, decision: e.target.value as 'approved' | 'rejected' })}
                  className="mr-2"
                />
                Reject
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {approvalData.decision === 'approved' ? 'Approval Notes' : 'Rejection Reason'}
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={approvalData.decision === 'approved' ? approvalData.notes : approvalData.rejectionReason}
              onChange={(e) => setApprovalData({
                ...approvalData,
                [approvalData.decision === 'approved' ? 'notes' : 'rejectionReason']: e.target.value
              })}
              placeholder={
                approvalData.decision === 'approved' 
                  ? 'Optional notes for approval...'
                  : 'Please provide reason for rejection...'
              }
            />
          </div>

          {approvalData.decision === 'approved' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions (Optional)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
                value={approvalData.conditions}
                onChange={(e) => setApprovalData({ ...approvalData, conditions: e.target.value })}
                placeholder="Any conditions or requirements for this approval..."
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              className={approvalData.decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalData.decision === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        title="Add Progress Photos"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo Type
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedPhotoType}
              onChange={(e) => setSelectedPhotoType(e.target.value as ActionPhotoType)}
            >
              <option value="before">Before Implementation</option>
              <option value="during">During Implementation</option>
              <option value="after">After Implementation</option>
              <option value="evidence">Evidence/Proof</option>
              <option value="verification">Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select multiple photos. Supported formats: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CorrectiveActionCard;
