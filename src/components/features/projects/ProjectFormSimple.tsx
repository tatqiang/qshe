import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

interface Project {
  id?: string;
  project_code: string;
  project_name: string;
  project_description?: string;
  start_date?: string;
  end_date?: string;
  project_status: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';
}

interface ProjectFormProps {
  project?: Project | null;
  onSave: (project: Project) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProjectFormSimple: React.FC<ProjectFormProps> = ({ 
  project, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Project>({
    project_code: '',
    project_name: '',
    project_description: '',
    project_status: 'active',
    start_date: '',
    end_date: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setFormData({
        id: project.id,
        project_code: project.project_code || '',
        project_name: project.project_name || '',
        project_description: project.project_description || '',
        project_status: project.project_status || 'active',
        start_date: project.start_date || '',
        end_date: project.end_date || ''
      });
    } else {
      // Reset form for new project
      setFormData({
        project_code: '',
        project_name: '',
        project_description: '',
        project_status: 'active',
        start_date: '',
        end_date: ''
      });
    }
    setErrors({});
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_code.trim()) {
      newErrors.project_code = 'Project code is required';
    } else if (formData.project_code.length < 3) {
      newErrors.project_code = 'Project code must be at least 3 characters';
    }

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    } else if (formData.project_name.length < 3) {
      newErrors.project_name = 'Project name must be at least 3 characters';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const projectToSave: Project = {
      ...formData,
      project_code: formData.project_code.trim().toUpperCase(),
      project_name: formData.project_name.trim(),
      project_description: formData.project_description?.trim()
    };

    onSave(projectToSave);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {project ? 'Edit Project' : 'Create New Project'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Code */}
          <div>
            <label htmlFor="project_code" className="block text-sm font-medium text-gray-700 mb-2">
              Project Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="project_code"
              name="project_code"
              value={formData.project_code}
              onChange={handleInputChange}
              disabled={!!project} // Disable editing project code for existing projects
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.project_code 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              } ${project ? 'bg-gray-100' : ''}`}
              placeholder="e.g., PROJ001"
            />
            {errors.project_code && (
              <p className="mt-1 text-sm text-red-600">{errors.project_code}</p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="project_name"
              name="project_name"
              value={formData.project_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.project_name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Enter project name"
            />
            {errors.project_name && (
              <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="project_description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              id="project_description"
              name="project_description"
              value={formData.project_description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project description..."
            />
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="project_status" className="block text-sm font-medium text-gray-700 mb-2">
              Project Status
            </label>
            <select
              id="project_status"
              name="project_status"
              value={formData.project_status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="extended">Extended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_date 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default ProjectFormSimple;