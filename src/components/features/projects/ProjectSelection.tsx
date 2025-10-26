import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { ProjectService } from '../../../lib/api/projectService';
import type { Project } from '../../../lib/api/projectService';

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
    console.log('🔄 ProjectSelection: Starting to load projects...');
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ ProjectSelection: Query timeout after 10 seconds');
      setLoading(false);
      setProjects([]);
    }, 10000);
    
    try {
      // Load projects using ProjectService from Supabase
      const allProjects = await ProjectService.getAllProjects();
      console.log('📦 ProjectSelection: All projects from service:', allProjects.length);
      
      // Filter only active projects
      const activeProjects = allProjects.filter(project => project.status === 'active');
      
      console.log('✅ ProjectSelection: Active projects filtered:', activeProjects.length);
      setProjects(activeProjects);
    } catch (error) {
      console.error('❌ ProjectSelection: Failed to load projects:', error);
      // Set empty array as fallback
      setProjects([]);
    } finally {
      clearTimeout(timeoutId);
      console.log('✅ ProjectSelection: Loading complete, setting loading=false');
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
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'extended': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'extended': return 'Extended';
      case 'cancelled': return 'Cancelled';
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
                  {project.description && (
                    <div>
                      <span className="font-medium text-gray-700">📝 Description:</span>
                      <span className="ml-1 text-gray-600">{project.description}</span>
                    </div>
                  )}

                  {(project.project_start || project.project_end) && (
                    <div>
                      <span className="font-medium text-gray-700">🗓️ Timeline:</span>
                      <span className="ml-1 text-gray-600">
                        {project.project_start && `Start: ${new Date(project.project_start).toLocaleDateString('en-US')}`}
                        {project.project_start && project.project_end && ' | '}
                        {project.project_end && `End: ${new Date(project.project_end).toLocaleDateString('en-US')}`}
                      </span>
                    </div>
                  )}
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
