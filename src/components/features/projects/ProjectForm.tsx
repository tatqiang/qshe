import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { ProjectService } from '../../../lib/api/projectService';

interface Project {
  id?: string;
  project_code: string;
  name: string;  // Actual Supabase column: name
  description?: string;  // Actual Supabase column: description
  project_start?: string;  // Actual Supabase column: project_start
  project_end?: string;  // Actual Supabase column: project_end
  status: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';  // Actual Supabase column: status
  is_test_project?: boolean;  // Actual Supabase column: is_test_project (not editable in form)
}

interface ProjectFormProps {
  project?: Project | null;
  onSave: (project: Project) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  project, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Project>({
    project_code: '',
    name: '',
    description: '',
    status: 'active',
    project_start: '',
    project_end: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setFormData({
        id: project.id,
        project_code: project.project_code || '',
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        project_start: project.project_start || '',
        project_end: project.project_end || '',
        is_test_project: project.is_test_project // Preserve but don't show in form
      });
      setCodeAvailable(true); // Current code is available
    } else {
      // Reset form for new project
      setFormData({
        project_code: '',
        name: '',
        description: '',
        status: 'active',
        project_start: '',
        project_end: '',
        is_test_project: false // Default for new projects
      });
      setCodeAvailable(null);
    }
    setErrors({});
  }, [project]);

  // Debounced project code availability check
  useEffect(() => {
    if (!formData.project_code || formData.project_code.length < 3) {
      setCodeAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingCode(true);
      try {
        const isAvailable = await ProjectService.isProjectCodeAvailable(
          formData.project_code,
          formData.id
        );
        setCodeAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking code availability:', error);
      } finally {
        setCheckingCode(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [formData.project_code, formData.id]);

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
    } else if (codeAvailable === false) {
      newErrors.project_code = 'Project code is already in use';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (formData.project_start && formData.project_end) {
      const startDate = new Date(formData.project_start);
      const endDate = new Date(formData.project_end);
      if (endDate <= startDate) {
        newErrors.project_end = 'End date must be after start date';
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
      name: formData.name.trim(),
      description: formData.description?.trim(),
      // Convert empty strings to null for date fields (PostgreSQL doesn't accept empty strings for dates)
      project_start: formData.project_start?.trim() || null,
      project_end: formData.project_end?.trim() || null,
      // Preserve is_test_project value (not editable in form)
      is_test_project: formData.is_test_project
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
            <div className="relative">
              <input
                type="text"
                id="project_code"
                name="project_code"
                value={formData.project_code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.project_code 
                    ? 'border-red-300 focus:border-red-500' 
                    : codeAvailable === false
                    ? 'border-orange-300 focus:border-orange-500'
                    : codeAvailable === true
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g., PROJ001"
              />
              {/* Availability indicator */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {checkingCode && (
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!checkingCode && codeAvailable === true && formData.project_code.length >= 3 && (
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
                {!checkingCode && codeAvailable === false && (
                  <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
            </div>
            {errors.project_code && (
              <p className="mt-1 text-sm text-red-600">{errors.project_code}</p>
            )}
            {!errors.project_code && checkingCode && (
              <p className="mt-1 text-sm text-gray-500">Checking availability...</p>
            )}
            {!errors.project_code && !checkingCode && codeAvailable === true && formData.project_code.length >= 3 && (
              <p className="mt-1 text-sm text-green-600">✓ Code available</p>
            )}
            {!errors.project_code && !checkingCode && codeAvailable === false && (
              <p className="mt-1 text-sm text-orange-600">⚠ Code already in use</p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project description..."
            />
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Project Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
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
              <label htmlFor="project_start" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="project_start"
                name="project_start"
                value={formData.project_start}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="project_end" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="project_end"
                name="project_end"
                value={formData.project_end}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.project_end 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.project_end && (
                <p className="mt-1 text-sm text-red-600">{errors.project_end}</p>
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

export default ProjectForm;