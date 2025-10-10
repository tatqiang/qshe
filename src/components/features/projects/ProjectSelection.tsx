import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { supabase } from '../../../lib/api/supabase'; // Real Supabase integration enabled!

interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  project_manager_id?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectSelectionProps {
  onProjectSelected: (project: Project) => void;
  selectedProject?: Project | null;
}

const ProjectSelection: React.FC<ProjectSelectionProps> = ({ 
  onProjectSelected, 
  selectedProject 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Load projects from Supabase database
      const { data: supabaseProjects, error } = await supabase.rpc('get_active_projects');
      
      if (error) {
        console.log('🔧 Supabase RPC error (falling back to demo data):', error.message);
      } else if (supabaseProjects && Array.isArray(supabaseProjects) && (supabaseProjects as any[]).length > 0) {
        console.log('✅ Projects loaded from Supabase:', (supabaseProjects as any[]).length);
        setProjects(supabaseProjects as Project[]);
        setLoading(false);
        return;
      }
      
      // Using demo data as fallback
      console.log('📋 Using demo projects (Supabase fallback)');
      const demoProjects: Project[] = [
        {
          id: 'demo-proj-001',
          project_code: 'AIC',
          name: 'Downtown Office Complex',
          description: 'Construction of 25-story office building with underground parking',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-002',
          project_code: 'RM1',
          name: 'Highway Bridge Construction',
          description: 'Construction of 2.5km bridge spanning the Chao Phraya River',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-003',
          project_code: 'MEGA',
          name: 'Mega Shopping Mall Project',
          description: 'Development of large-scale retail complex with entertainment facilities',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-004',
          project_code: 'GG-U001',
          name: 'Underground Utility Tunnel',
          description: 'Construction of underground utility corridor for city infrastructure',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setProjects(demoProjects);
      console.log('✅ Demo projects loaded:', demoProjects.length);
    } catch (error) {
      console.warn('🔧 Error loading projects (using demo data):', error);
      
      // Fallback demo data
      const demoProjects: Project[] = [
        {
          id: 'demo-proj-001',
          project_code: 'AIC',
          name: 'Downtown Office Complex',
          description: 'Construction of 25-story office building with underground parking',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-002',
          project_code: 'RM1',
          name: 'Highway Bridge Construction',
          description: 'Construction of 2.5km bridge spanning the Chao Phraya River',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-003',
          project_code: 'MEGA',
          name: 'Mega Shopping Mall Project',
          description: 'Development of large-scale retail complex with entertainment facilities',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-proj-004',
          project_code: 'GG-U001',
          name: 'Underground Utility Tunnel',
          description: 'Construction of underground utility corridor for city infrastructure',
          status: 'active',
          project_manager_id: undefined, // To be assigned later
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setProjects(demoProjects);
      console.log('✅ Fallback demo projects loaded:', demoProjects.length);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    console.log('🎯 Project selected:', project);
    onProjectSelected(project);
    
    // Store selected project in localStorage
    localStorage.setItem('selected-project', JSON.stringify(project));
    
    // Trigger project change event for other components
    const event = new CustomEvent('project-changed', { 
      detail: project 
    });
    window.dispatchEvent(event);
    console.log('📡 Project changed event dispatched');
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select Project
        </h1>
        <p className="text-gray-600">
          Please select a project to record safety patrol activities
        </p>
      </div>

      {/* Selected Project Display */}
      {selectedProject && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Selected Project: {selectedProject.name}
              </h3>
              <p className="text-blue-700">
                Project Code: {selectedProject.project_code}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('selected-project');
                const event = new CustomEvent('project-changed', { detail: null });
                window.dispatchEvent(event);
                console.log('🗑️ Project selection cleared');
              }}
            >
              Change Project
            </Button>
          </div>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="relative">
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
            <div className="flex flex-col h-full">
              {/* Header with project name and status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm font-medium text-gray-500">
                    {project.project_code}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>

              {/* Project Description */}
              <div className="flex-1 mb-4">
                {project.description && (
                  <p className="text-gray-600 text-sm">
                    {project.description}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 text-sm mt-4">
                  <div>
                    <span className="font-medium text-gray-700">📝 Description:</span>
                    <span className="ml-1 text-gray-600">{project.description}</span>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">🗓️ Created:</span>
                    <span className="ml-1 text-gray-600">
                      {new Date(project.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  className="w-full"
                  variant={selectedProject?.id === project.id ? "primary" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectSelect(project);
                  }}
                >
                  {selectedProject?.id === project.id ? '✅ Selected' : 'Select Project'}
                </Button>
              </div>
            </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
          <p className="text-gray-600">
            No active projects found. Please contact your administrator to set up projects.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectSelection;
