import React, { useState, useEffect } from 'react';

import SafetyPatrolList from './SafetyPatrolList';
import SafetyPatrolForm from './SafetyPatrolForm';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

// Enhanced service for real Supabase integration
import { SafetyPatrolService } from '../../../services/SafetyPatrolService';
import { getRiskCategories, getRiskItems } from '../../../lib/api/riskApi'; // Import risk API

// Global state management - Use optional project selection
import { useAppContext } from '../../../contexts/AppContext';

import type { 
  SafetyPatrol, 
  SafetyPatrolFormData,
  RiskCategory,
  RiskItem
} from '../../../types/safetyPatrol';

const SafetyPatrolDashboard: React.FC = () => {
  // Use optional project selection - show all patrols if no project selected
  const { project, projectId } = useAppContext();
  
  const [currentView, setCurrentView] = useState<'loading' | 'list' | 'create' | 'edit' | 'view' | 'corrective-actions'>('loading');
  const [selectedPatrol, setSelectedPatrol] = useState<SafetyPatrol | null>(null);
  const [patrols, setPatrols] = useState<SafetyPatrol[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);

  // Load patrols when project changes or on initial load
  useEffect(() => {
    console.log('🎯 Loading patrols...', project ? `for project: ${project.project_code}` : 'all projects');
    setCurrentView('list');
    loadPatrols();
    loadRiskData();
  }, [project, projectId]);

  const loadRiskData = async () => {
    try {
      console.log('🎯 Loading risk categories and items...');
      
      // Load risk categories
      const categories = await getRiskCategories();
      setRiskCategories(categories || []);
      console.log('✅ Loaded risk categories:', categories?.length || 0);
      
      // Load risk items
      const items = await getRiskItems();
      setRiskItems(items || []);
      console.log('✅ Loaded risk items:', items?.length || 0);
      
    } catch (error) {
      console.error('❌ Failed to load risk data:', error);
      // Set empty arrays as fallback
      setRiskCategories([]);
      setRiskItems([]);
    }
  };

  const loadPatrols = async () => {
    setLoading(true);
    try {
      // Pass project.id if project is selected, otherwise undefined to load all patrols
      const patrolRecords = await SafetyPatrolService.getPatrols(project?.id);
      console.log('✅ Loaded patrols from Supabase:', patrolRecords?.length || 0);
      setPatrols(patrolRecords || []);
    } catch (error) {
      console.error('❌ Failed to load patrols from Supabase:', error);
      setPatrols([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatrol = async (
    data: SafetyPatrolFormData, 
    photos: string[]
  ) => {
    console.log('📝 Creating patrol...', { 
      projectCode: project?.project_code
    });
    
    if (!project) {
      alert('Please select a project first to create a new patrol');
      return;
    }

    try {
      setLoading(true);
      const newPatrol = await SafetyPatrolService.createPatrol({
        ...data,
        projectId: project.id
      }, photos);
      
      if (newPatrol) {
        console.log('✅ Patrol created successfully');
        await loadPatrols();
        setCurrentView('list');
      }
    } catch (error) {
      console.error('❌ Failed to create patrol:', error);
      alert('Failed to create patrol');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPatrol(null);
  };

  const handleUpdatePatrol = async (
    data: SafetyPatrolFormData, 
    photos: string[]
  ) => {
    console.log('📝 Updating patrol...', { 
      patrolId: selectedPatrol?.id,
      projectCode: project?.project_code
    });
    
    if (!project || !selectedPatrol) {
      alert('No project or patrol selected');
      return;
    }

    try {
      setLoading(true);
      const updatedPatrol = await SafetyPatrolService.updatePatrol(selectedPatrol.id, {
        ...data,
        projectId: project.id
      }, photos);
      
      if (updatedPatrol) {
        console.log('✅ Patrol updated successfully');
        await loadPatrols();
        setCurrentView('list');
        setSelectedPatrol(null);
      }
    } catch (error) {
      console.error('❌ Failed to update patrol:', error);
      alert('Failed to update patrol');
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate view
  const renderCurrentView = () => {
    if (loading && currentView === 'loading') {
      return (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patrol data...</p>
        </Card>
      );
    }

    switch (currentView) {
      case 'create':
        return (
          <SafetyPatrolForm
            onSubmit={handleCreatePatrol}
            onCancel={handleBackToList}
            riskCategories={riskCategories}
            riskItems={riskItems}
          />
        );

      case 'edit':
        return selectedPatrol ? (
          <SafetyPatrolForm
            onSubmit={handleUpdatePatrol}
            onCancel={handleBackToList}
            riskCategories={riskCategories}
            riskItems={riskItems}
            initialData={selectedPatrol}
            mode="edit"
          />
        ) : (
          <div>Patrol not found</div>
        );

      case 'view':
        return selectedPatrol ? (
          <SafetyPatrolForm
            onSubmit={handleUpdatePatrol} // Allow updates when switching to edit mode
            onCancel={handleBackToList}
            riskCategories={riskCategories}
            riskItems={riskItems}
            initialData={selectedPatrol}
            initialPhotos={selectedPatrol.photos?.map(p => p.filePath) || []}
            patrolId={selectedPatrol.id}
            mode="view"
          />
        ) : (
          <div>Patrol not found</div>
        );

      case 'list':
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Safety Patrol Dashboard</h1>
                <p className="text-gray-600">
                  {project 
                    ? `Project: ${project.name} (${project.project_code})`
                    : 'Showing all patrols across all projects'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentView('create')}
                  disabled={!project}
                >
                  Create New Patrol
                </Button>
              </div>
            </div>

            <SafetyPatrolList
              patrols={patrols}
              loading={loading}
              onCreateNew={() => setCurrentView('create')}
              onView={async (patrol) => {
                // Fetch full patrol details to ensure we have all fields including remark
                try {
                  const fullPatrol = await SafetyPatrolService.getPatrolById(patrol.id);
                  if (fullPatrol) {
                    setSelectedPatrol(fullPatrol);
                    setCurrentView('view');
                  } else {
                    console.error('Failed to load patrol details');
                  }
                } catch (error) {
                  console.error('Error loading patrol details:', error);
                }
              }}
              riskCategories={riskCategories}
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderCurrentView()}
    </div>
  );
};

export default SafetyPatrolDashboard;
