import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Modal } from '../../common/Modal';
import CorrectiveActionCard from './CorrectiveActionCard';
import CorrectiveActionForm from './CorrectiveActionForm';
import CorrectiveActionDetails from './CorrectiveActionDetails';

import type { 
  CorrectiveActionEnhanced,
  CorrectiveActionDashboardData,
  CorrectiveActionFilters,
  CorrectiveActionFormDataEnhanced,
  ApprovalFormData,
  ActionPhotoType,
  ApprovalLevel,
  ActionStatusEnhanced
} from '../../../types/correctiveActionsEnhanced';

interface CorrectiveActionDashboardProps {
  patrolId?: string;
  projectId?: string;
  currentUserId: string;
  currentUserRole: string;
}

const CorrectiveActionDashboard: React.FC<CorrectiveActionDashboardProps> = ({
  patrolId,
  projectId,
  currentUserId,
  currentUserRole
}) => {
  // State management
  const [actions, setActions] = useState<CorrectiveActionEnhanced[]>([]);
  const [dashboardData, setDashboardData] = useState<CorrectiveActionDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'create' | 'details'>('dashboard');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CorrectiveActionFilters>({});

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    loadActions();
  }, [projectId, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await CorrectiveActionServiceEnhanced.getDashboardData(currentUserId, currentUserRole, projectId);
      
      // Mock dashboard data for demo
      const mockDashboardData: CorrectiveActionDashboardData = {
        totalActions: 24,
        pendingApproval: 3,
        inProgress: 8,
        overdue: 2,
        completedThisMonth: 6,
        averageApprovalTime: 2.5,
        rejectionRate: 15,
        escalationRate: 8,
        recentActions: [],
        pendingMyApproval: [],
        myAssignedActions: [],
        statusDistribution: [
          { status: 'submitted', count: 3, percentage: 12.5 },
          { status: 'approved', count: 5, percentage: 20.8 },
          { status: 'in_progress', count: 8, percentage: 33.3 },
          { status: 'completed', count: 6, percentage: 25 },
          { status: 'overdue', count: 2, percentage: 8.3 }
        ],
        completionTrends: []
      };
      
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const actionsData = await CorrectiveActionServiceEnhanced.getCorrectiveActions(filters);
      
      // Mock actions data for demo
      const mockActions: CorrectiveActionEnhanced[] = [];
      setActions(mockActions);
    } catch (error) {
      console.error('Failed to load actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (formData: CorrectiveActionFormDataEnhanced) => {
    try {
      if (!patrolId) {
        alert('No patrol selected for creating corrective action');
        return;
      }
      
      // TODO: Replace with actual API call
      // const result = await CorrectiveActionServiceEnhanced.createCorrectiveAction(patrolId, formData, currentUserId);
      
      console.log('Creating corrective action:', formData);
      setShowCreateModal(false);
      await loadActions();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to create corrective action:', error);
    }
  };

  const handleApprove = async (actionId: string, approvalLevel: ApprovalLevel, data: ApprovalFormData) => {
    try {
      // TODO: Replace with actual API call
      // await CorrectiveActionServiceEnhanced.processApproval(actionId, approvalLevel, currentUserId, data);
      
      console.log('Processing approval:', { actionId, approvalLevel, data });
      await loadActions();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  };

  const handleUpdateStatus = async (actionId: string, status: ActionStatusEnhanced) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating status:', { actionId, status });
      await loadActions();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUploadPhotos = async (actionId: string, photoType: ActionPhotoType, files: FileList) => {
    try {
      // TODO: Replace with actual API call
      console.log('Uploading photos:', { actionId, photoType, fileCount: files.length });
      await loadActions();
    } catch (error) {
      console.error('Failed to upload photos:', error);
    }
  };

  const handleViewDetails = (actionId: string) => {
    setSelectedActionId(actionId);
    setCurrentView('details');
  };

  // Filter actions based on search term
  const filteredActions = actions.filter(action =>
    action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.actionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.assignedToUser?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentView === 'details' && selectedActionId) {
    return (
      <CorrectiveActionDetails
        actionId={selectedActionId}
        onBack={() => setCurrentView('dashboard')}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onApprove={handleApprove}
        onUpdateStatus={handleUpdateStatus}
        onUploadPhotos={handleUploadPhotos}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corrective Actions</h1>
          <p className="text-gray-600">Manage and track corrective actions from safety patrols</p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setCurrentView(currentView === 'dashboard' ? 'list' : 'dashboard')}
          >
            {currentView === 'dashboard' ? (
              <><ChartBarIcon className="h-4 w-4 mr-2" />List View</>
            ) : (
              <><ChartBarIcon className="h-4 w-4 mr-2" />Dashboard</>
            )}
          </Button>
          
          {patrolId && (
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Action
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalActions}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardData.pendingApproval}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.inProgress}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.completedThisMonth}</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.overdue}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Workflow Performance" className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Approval Time</span>
                  <span className="font-medium">{dashboardData.averageApprovalTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rejection Rate</span>
                  <span className="font-medium">{dashboardData.rejectionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Escalation Rate</span>
                  <span className="font-medium">{dashboardData.escalationRate}%</span>
                </div>
              </div>
            </Card>

            <Card title="Status Distribution" className="p-4">
              <div className="space-y-2">
                {dashboardData.statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="My Actions" className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Pending My Approval</p>
                  <p className="text-xl font-bold text-yellow-600">{dashboardData.pendingMyApproval.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned to Me</p>
                  <p className="text-xl font-bold text-blue-600">{dashboardData.myAssignedActions.length}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setCurrentView('list')}
                >
                  View All Actions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">All Statuses</option>
                    <option value="submitted">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">All Types</option>
                    <option value="immediate">Immediate</option>
                    <option value="short_term">Short Term</option>
                    <option value="long_term">Long Term</option>
                    <option value="preventive">Preventive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Any Date</option>
                    <option value="overdue">Overdue</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Anyone</option>
                    <option value="me">Me</option>
                    <option value="my_team">My Team</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Actions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading actions...</p>
              </div>
            ) : filteredActions.length === 0 ? (
              <Card className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Actions Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No actions match your search criteria.' : 'No corrective actions have been created yet.'}
                </p>
                {patrolId && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create First Action
                  </Button>
                )}
              </Card>
            ) : (
              filteredActions.map((action) => (
                <CorrectiveActionCard
                  key={action.id}
                  action={action}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onApprove={handleApprove}
                  onUpdateStatus={handleUpdateStatus}
                  onUploadPhotos={handleUploadPhotos}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Action Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Corrective Action"
        size="xl"
      >
        <CorrectiveActionForm
          onSubmit={handleCreateAction}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default CorrectiveActionDashboard;
