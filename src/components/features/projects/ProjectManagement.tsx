import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import ProjectForm from './ProjectForm';
import { ProjectService } from '../../../lib/api/projectService';
import type { Project } from '../../../lib/api/projectService';

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');

  // Load projects from Supabase on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await ProjectService.getAllProjects();
      setProjects(allProjects);
      console.log('📋 Loaded projects:', allProjects.length);
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleSaveProject = async (projectData: Project) => {
    setLoading(true);
    try {
      if (editingProject?.id) {
        // Update existing project
        await ProjectService.updateProject(editingProject.id, projectData);
      } else {
        // Create new project
        await ProjectService.createProject(projectData);
      }
      
      await loadProjects(); // Refresh the list
      setShowForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('❌ Failed to save project:', error);
      alert(error instanceof Error ? error.message : 'Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    // Hide test projects (is_test_project = true)
    if (project.is_test_project === true) {
      return false;
    }

    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'extended': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm) {
    return (
      <ProjectForm
        project={editingProject}
        onSave={handleSaveProject}
        onCancel={handleCancelForm}
        isLoading={loading}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 py-4 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Project Management</h1>
        <Button onClick={handleAddProject} variant="primary" className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
          + Add Project
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm" className="sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Project['status'])}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="extended">Extended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects Count */}
      <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card padding="sm" className="sm:p-8 text-center">
          <p className="text-gray-500 text-sm sm:text-base md:text-lg">
            {projects.length === 0 ? 'No projects found. Create your first project!' : 'No projects match your search criteria.'}
          </p>
          {projects.length === 0 && (
            <Button onClick={handleAddProject} variant="primary" className="mt-3 sm:mt-4 text-xs sm:text-sm">
              Create First Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} padding="sm" className="sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-gray-600 mb-1 sm:mb-2 truncate">
                    {project.project_code}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ml-2 flex-shrink-0 ${getStatusBadgeColor(project.status || 'active')}`}>
                  {project.status ? 
                    (project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1))
                    : 'Active'}
                </span>
              </div>

              {project.description && (
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                  {project.description}
                </p>
              )}

              {/* Dates */}
              {(project.project_start || project.project_end) && (
                <div className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 space-y-0.5">
                  {project.project_start && <span className="block">Start: {new Date(project.project_start).toLocaleDateString()}</span>}
                  {project.project_end && <span className="block">End: {new Date(project.project_end).toLocaleDateString()}</span>}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditProject(project)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs sm:text-sm"
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default ProjectManagement;