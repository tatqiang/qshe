import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useUserRole } from '../common/RoleGuard';
import { useCurrentProject, useAppContext } from '../../contexts/AppContext';
import ProjectSelection from './projects/ProjectSelection';
import { DashboardService, type DashboardStats, type RecentActivity } from '../../services/DashboardService';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  WrenchScrewdriverIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  // Global state for current project (for creating records, navbar display)
  const currentProject = useCurrentProject();
  const { setProject } = useAppContext();
  
  // Local state for project selection UI (backward compatibility)
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  
  // Local state for project filter dropdown (for filtering data display)
  const [filterProject, setFilterProject] = useState<string>('');
  
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalWorkers: 0,
    totalIssues: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSystemAdmin } = useUserRole();

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Only pass filterProject to methods that should be filtered (not selectedProject)
      const projectIdForFilter = filterProject || undefined;
      
      const [stats, activities, projects] = await Promise.all([
        DashboardService.getDashboardStats(projectIdForFilter), // Members/Workers global, Issues filtered
        DashboardService.getRecentActivities(projectIdForFilter, 5), // Activities filtered by project
        DashboardService.getProjects()
      ]);

      setDashboardStats(stats);
      setRecentActivities(activities);
      setAvailableProjects(projects);
      console.log('📊 Dashboard data loaded:', { 
        stats, 
        activitiesCount: activities.length, 
        projectsCount: projects.length,
        filterProject: projectIdForFilter || 'all',
        globalProject: currentProject?.name || 'none',
        projects: projects.map(p => ({ id: p.id, name: p.name, code: p.project_code }))
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts or filter changes
  useEffect(() => {
    if (currentProject || selectedProject || !showProjectSelection) {
      loadDashboardData();
    }
  }, [currentProject, selectedProject, filterProject]);

  // Check for global project first, then fall back to localStorage
  useEffect(() => {
    if (currentProject) {
      // We have a global project, use it
      setSelectedProject(currentProject);
      setShowProjectSelection(false);
    } else {
      // Check localStorage for backward compatibility
      try {
        const storedProject = localStorage.getItem('selected-project');
        if (storedProject) {
          const project = JSON.parse(storedProject);
          setSelectedProject(project);
          setProject(project); // Also set as global project
          setShowProjectSelection(false);
        } else {
          setShowProjectSelection(true);
        }
      } catch (error) {
        console.warn('Failed to load selected project:', error);
        setShowProjectSelection(true);
      }
    }
  }, []);

  // Listen for project selection events from header
  useEffect(() => {
    const handleShowProjectSelection = () => {
      console.log('🎯 Dashboard received show-project-selection event, showing project selection');
      setShowProjectSelection(true);
    };

    const handleProjectChange = () => {
      console.log('🔄 Dashboard received project-changed event, reloading project data');
      try {
        const storedProject = localStorage.getItem('selected-project');
        if (storedProject) {
          setSelectedProject(JSON.parse(storedProject));
          setShowProjectSelection(false);
        }
      } catch (error) {
        console.warn('Failed to reload selected project:', error);
        setShowProjectSelection(true);
      }
    };

    console.log('🔧 Dashboard setting up event listeners');
    window.addEventListener('show-project-selection', handleShowProjectSelection);
    window.addEventListener('project-changed', handleProjectChange);
    
    return () => {
      console.log('🔧 Dashboard cleaning up event listeners');
      window.removeEventListener('show-project-selection', handleShowProjectSelection);
      window.removeEventListener('project-changed', handleProjectChange);
    };
  }, []);

  // Handle project selection in dashboard
  const handleProjectSelected = (project: any) => {
    console.log('✅ Dashboard: Project selected', project);
    
    // Update local state for backward compatibility
    setSelectedProject(project);
    setShowProjectSelection(false);
    
    // Update global state (this is the main project context)
    setProject(project);
    
    // Store in localStorage for backward compatibility
    localStorage.setItem('selected-project', JSON.stringify(project));
    
    // Dispatch project-changed event for backward compatibility
    window.dispatchEvent(new Event('project-changed'));
  };

  // Show project selection if no project is selected
  if (showProjectSelection || (!currentProject && !selectedProject)) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <ProjectSelection onProjectSelected={handleProjectSelected} />
      </div>
    );
  }

  const handleSwitchProject = () => {
    console.log('🔄 Switch Project button clicked in Dashboard');
    setShowProjectSelection(true);
  };

  // Generate stats array from real data
  const stats = [
    { 
      label: 'Total Members', 
      value: isLoading ? '...' : dashboardStats.totalMembers.toString(), 
      icon: UsersIcon, 
      color: 'blue' 
    },
    { 
      label: 'Total Workers', 
      value: isLoading ? '...' : dashboardStats.totalWorkers.toString(), 
      icon: ShieldCheckIcon, 
      color: 'green' 
    },
    { 
      label: 'Total Issues', 
      value: isLoading ? '...' : dashboardStats.totalIssues.toString(), 
      icon: DocumentTextIcon, 
      color: 'red' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your safety management dashboard</p>
      </div>

      {/* Current Project Display */}
      <Card title="Current Project">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {currentProject ? currentProject.name : 'No Project Selected'}
            </h3>
            <p className="text-sm text-gray-600">
              {currentProject ? 
                `${currentProject.status === 'active' ? 'Active' : currentProject.status} • ${currentProject.description || 'No location'}` :
                'Please select a project to continue'
              }
            </p>
          </div>
          <Button variant="outline" onClick={handleSwitchProject}>
            Switch Project
          </Button>
        </div>
      </Card>

      {/* Filter Section */}
      <Card title="Data Filters">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <div className="flex-1">
            <label htmlFor="filter-project" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Project (for Issues & Activities)
            </label>
            <select
              id="filter-project"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="md">
            <div className="flex items-center">
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No recent activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${activity.type === 'issue' ? 'bg-red-100 text-red-800' : ''}
                  ${activity.type === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
                  ${activity.type === 'permit' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Demo Section - Only for System Admins */}
      {isSystemAdmin && (
        <Card title="🧪 Demo Features">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">QC Punch List Demo</h3>
                  <p className="text-sm text-blue-700">
                    Test the new Quality Control punch list feature with auto-complete areas and evidence photo optimization
                  </p>
                </div>
                <Link
                  to="/punch-list-demo"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Demo
                </Link>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <strong>QC Features:</strong> Auto-complete area search, new area creation, optimized evidence photos (1200x1200px), form validation
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
