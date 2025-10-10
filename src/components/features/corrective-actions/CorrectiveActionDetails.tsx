import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CameraIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Modal } from '../../common/Modal';
import type { 
  CorrectiveActionEnhanced, 
  ApprovalFormData, 
  ActionPhotoType,
  ApprovalLevel,
  ActionStatusEnhanced,
  CorrectiveActionPhoto
} from '../../../types/correctiveActionsEnhanced';

interface CorrectiveActionDetailsProps {
  actionId: string;
  onBack: () => void;
  currentUserId: string;
  currentUserRole: string;
  onApprove?: (actionId: string, approvalLevel: ApprovalLevel, data: ApprovalFormData) => Promise<void>;
  onUpdateStatus?: (actionId: string, status: ActionStatusEnhanced) => Promise<void>;
  onUploadPhotos?: (actionId: string, photoType: ActionPhotoType, files: FileList) => Promise<void>;
}

const CorrectiveActionDetails: React.FC<CorrectiveActionDetailsProps> = ({
  actionId,
  onBack,
  currentUserId,
  currentUserRole,
  onApprove,
  onUpdateStatus,
  onUploadPhotos
}) => {
  const [action, setAction] = useState<CorrectiveActionEnhanced | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<ActionPhotoType>('evidence');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<CorrectiveActionPhoto[]>([]);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  const [approvalData, setApprovalData] = useState<ApprovalFormData>({
    decision: 'approved',
    notes: '',
    conditions: '',
    rejectionReason: ''
  });

  useEffect(() => {
    loadActionDetails();
  }, [actionId]);

  const loadActionDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const actionData = await CorrectiveActionServiceEnhanced.getCorrectiveActionById(actionId);
      
      // Mock action data for demo
      const mockAction: CorrectiveActionEnhanced = {
        id: actionId,
        patrolId: 'patrol-1',
        actionNumber: 'CA-2025001',
        description: 'Repair damaged safety barrier and install additional warning signs',
        actionType: 'immediate',
        rootCauseAnalysis: 'Safety barrier was damaged due to vehicle impact. Root cause: Inadequate vehicle speed control in the area.',
        assignedTo: currentUserId,
        assignedToUser: { 
          id: currentUserId, 
          email: 'user@example.com', 
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          userType: 'internal' as const,
          status: 'active' as const,
          role: 'member' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        assignedDate: '2025-01-15',
        dueDate: '2025-01-22',
        status: 'in_progress',
        progressPercentage: 60,
        progressUpdates: [],
        approvals: [
          {
            id: 'approval-1',
            actionId: actionId,
            approvalLevel: 'supervisor',
            requiredApproverRole: 'supervisor',
            approverId: 'supervisor-1',
            approvalStatus: 'approved',
            approvalDate: '2025-01-16',
            approvalNotes: 'Approved with high priority',
            conditions: 'Must be completed before end of week',
            sequenceOrder: 1,
            isFinalApproval: true,
            createdAt: '2025-01-15',
            updatedAt: '2025-01-16'
          }
        ],
        currentApprovalLevel: undefined,
        pendingApprovals: [],
        estimatedCost: 1500,
        actualCost: undefined,
        resourcesRequired: ['Safety barriers', 'Warning signs', 'Installation tools', 'Traffic cones'],
        photos: [],
        planningPhotos: [],
        beforePhotos: [],
        duringPhotos: [],
        afterPhotos: [],
        evidencePhotos: [],
        verificationPhotos: [],
        notifications: [],
        createdAt: '2025-01-15',
        updatedAt: '2025-01-20',
        createdBy: 'creator-1',
        createdByUser: { 
          id: 'creator-1', 
          email: 'creator@example.com', 
          displayName: 'Safety Inspector',
          firstName: 'Safety',
          lastName: 'Inspector',
          userType: 'internal' as const,
          status: 'active' as const,
          role: 'admin' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      setAction(mockAction);
    } catch (error) {
      console.error('Failed to load action details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadPhotos || !e.target.files) return;
    
    try {
      await onUploadPhotos(actionId, selectedPhotoType, e.target.files);
      await loadActionDetails(); // Reload to show new photos
      setShowPhotoModal(false);
    } catch (error) {
      console.error('Failed to upload photos:', error);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!onApprove || !action?.currentApprovalLevel) return;
    
    try {
      await onApprove(actionId, action.currentApprovalLevel, approvalData);
      await loadActionDetails(); // Reload to show updated approval status
      setShowApprovalModal(false);
    } catch (error) {
      console.error('Failed to submit approval:', error);
    }
  };

  const getStatusColor = (status: ActionStatusEnhanced) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      pending_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  const PhotoGallery = ({ photos, title }: { photos: CorrectiveActionPhoto[]; title: string }) => {
    if (photos.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div 
              key={photo.id}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80"
              onClick={() => {
                setSelectedPhotos([photo]);
                setShowPhotoViewer(true);
              }}
            >
              <img
                src={photo.r2Url}
                alt={photo.caption || 'Action photo'}
                className="w-full h-full object-cover"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading action details...</span>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Action Not Found</h3>
        <p className="text-gray-600 mb-4">The requested corrective action could not be found.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const canApprove = action.currentApprovalLevel && ['supervisor', 'manager', 'safety_officer', 'admin', 'system_admin'].includes(currentUserRole);
  const isAssigned = action.assignedTo === currentUserId;
  const daysUntilDue = Math.ceil((new Date(action.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{action.actionNumber}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                  {action.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(action.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {canApprove && (
              <Button onClick={() => setShowApprovalModal(true)}>
                Review & Approve
              </Button>
            )}
            
            {isAssigned && action.status === 'approved' && (
              <Button
                variant="outline"
                onClick={() => onUpdateStatus?.(action.id, 'in_progress')}
              >
                Start Work
              </Button>
            )}
            
            {isAssigned && action.status === 'in_progress' && (
              <Button
                variant="outline"
                onClick={() => setShowPhotoModal(true)}
              >
                Add Photos
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Description */}
            <Card title="Action Description" className="p-4">
              <p className="text-gray-700">{action.description}</p>
            </Card>

            {/* Root Cause Analysis */}
            {action.rootCauseAnalysis && (
              <Card title="Root Cause Analysis" className="p-4">
                <p className="text-gray-700">{action.rootCauseAnalysis}</p>
              </Card>
            )}

            {/* Progress Tracking */}
            <Card title="Progress Tracking" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-900">{action.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${action.progressPercentage}%` }}
                  />
                </div>

                {/* Progress Updates */}
                {action.progressUpdates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Progress Updates</h4>
                    {action.progressUpdates.map((update, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <p className="text-sm text-gray-700">{update.description}</p>
                        <p className="text-xs text-gray-500">{update.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Photos */}
            <Card title="Documentation Photos" className="p-4">
              <div className="space-y-6">
                <PhotoGallery photos={action.planningPhotos} title="Planning Photos" />
                <PhotoGallery photos={action.beforePhotos} title="Before Implementation" />
                <PhotoGallery photos={action.duringPhotos} title="During Implementation" />
                <PhotoGallery photos={action.afterPhotos} title="After Implementation" />
                <PhotoGallery photos={action.evidencePhotos} title="Evidence Photos" />
                <PhotoGallery photos={action.verificationPhotos} title="Verification Photos" />
                
                {action.photos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p>No photos uploaded yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Key Information */}
            <Card title="Key Information" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="font-medium">Assigned To</p>
                    <p className="text-gray-600">{action.assignedToUser?.displayName || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className={`${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {new Date(action.dueDate).toLocaleDateString()}
                      {daysUntilDue < 0 && ' (Overdue)'}
                      {daysUntilDue >= 0 && ` (${daysUntilDue} days)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="font-medium">Action Type</p>
                    <p className="text-gray-600">{action.actionType.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>

                {action.estimatedCost && (
                  <div className="flex items-center text-sm">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium">Estimated Cost</p>
                      <p className="text-gray-600">${action.estimatedCost.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Approval Workflow */}
            {action.approvals.length > 0 && (
              <Card title="Approval Workflow" className="p-4">
                <div className="space-y-3">
                  {action.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-center space-x-3">
                      {approval.approvalStatus === 'approved' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                      {approval.approvalStatus === 'rejected' && (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                      {approval.approvalStatus === 'pending' && (
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      )}
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {approval.approvalLevel.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {approval.approvalStatus === 'approved' && approval.approvalDate && 
                            `Approved ${new Date(approval.approvalDate).toLocaleDateString()}`}
                          {approval.approvalStatus === 'rejected' && 'Rejected'}
                          {approval.approvalStatus === 'pending' && 'Pending approval'}
                        </p>
                        {approval.approvalNotes && (
                          <p className="text-xs text-gray-500 mt-1">{approval.approvalNotes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Resources Required */}
            {action.resourcesRequired && action.resourcesRequired.length > 0 && (
              <Card title="Resources Required" className="p-4">
                <ul className="space-y-1">
                  {action.resourcesRequired.map((resource, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {resource}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Upload Progress Photos"
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
          </div>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Review Corrective Action"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Action Summary</h4>
            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
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
              {approvalData.decision === 'approved' ? 'Notes' : 'Rejection Reason'}
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={approvalData.decision === 'approved' ? approvalData.notes : approvalData.rejectionReason}
              onChange={(e) => setApprovalData({
                ...approvalData,
                [approvalData.decision === 'approved' ? 'notes' : 'rejectionReason']: e.target.value
              })}
              placeholder={approvalData.decision === 'approved' ? 'Optional notes...' : 'Required: Reason for rejection...'}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
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

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        title="Photo Viewer"
        size="lg"
      >
        {selectedPhotos.length > 0 && (
          <div className="space-y-4">
            <img
              src={selectedPhotos[0].r2Url}
              alt={selectedPhotos[0].caption || 'Action photo'}
              className="w-full h-auto rounded-lg"
            />
            {selectedPhotos[0].caption && (
              <p className="text-sm text-gray-600">{selectedPhotos[0].caption}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CorrectiveActionDetails;
