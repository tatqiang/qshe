// Project Service for CRUD operations
// Uses Supabase database directly (no localStorage fallback)

import { supabase } from './supabase';

// Project interface matching ACTUAL Supabase schema (see database columns)
export interface Project {
  id: string;
  project_code: string;
  name: string;  // Actual column: name
  description?: string | null;  // Actual column: description
  project_start?: string | null;  // Actual column: project_start (NOT start_date)
  project_end?: string | null;  // Actual column: project_end (NOT end_date)
  status: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';  // Actual column: status
  is_test_project?: boolean;  // Actual column: is_test_project
  created_at?: string;
  updated_at?: string;
}

export class ProjectService {
  // Get all projects from Supabase
  static async getAllProjects(): Promise<Project[]> {
    try {
      console.log('📋 Fetching projects from Supabase...');
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('project_code', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }
      
      console.log('✅ Projects loaded from Supabase:', data?.length || 0);
      return (data as Project[]) || [];
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      throw error;
    }
  }

  // Get project by ID
  static async getProjectById(id: string): Promise<Project | null> {
    try {
      console.log('🔍 Fetching project by ID:', id);
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Project not found');
          return null;
        }
        console.error('❌ Error fetching project:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Project found:', (data as Project).name);
        return data as Project;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch project:', error);
      throw error;
    }
  }

  // Check if project code is available
  static async isProjectCodeAvailable(projectCode: string, excludeId?: string): Promise<boolean> {
    try {
      console.log('🔍 Checking project code availability:', projectCode);
      
      let query = (supabase as any)
        .from('projects')
        .select('id')
        .eq('project_code', projectCode.toUpperCase());
      
      // Exclude current project when editing
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error checking project code:', error);
        throw error;
      }
      
      const isAvailable = !data || data.length === 0;
      console.log(isAvailable ? '✅ Project code available' : '❌ Project code already in use');
      return isAvailable;
    } catch (error) {
      console.error('❌ Failed to check project code availability:', error);
      throw error;
    }
  }

  // Create new project
  static async createProject(projectData: Omit<Project, 'id'>): Promise<Project> {
    try {
      console.log('➕ Creating project:', projectData.name);
      
      const insertData = {
        ...projectData,
        project_code: projectData.project_code.toUpperCase(),
        // Ensure empty strings are converted to null for date fields
        project_start: projectData.project_start === '' ? null : projectData.project_start,
        project_end: projectData.project_end === '' ? null : projectData.project_end
      };
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating project:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Project created:', (data as Project).name);
        return data as Project;
      }
      throw new Error('No data returned from insert');
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      throw error;
    }
  }

  // Update existing project
  static async updateProject(id: string, projectData: Partial<Omit<Project, 'id'>>): Promise<Project> {
    try {
      console.log('✏️ Updating project:', id);
      
      const updateData = {
        ...projectData,
        project_code: projectData.project_code ? projectData.project_code.toUpperCase() : undefined,
        // Ensure empty strings are converted to null for date fields
        project_start: projectData.project_start === '' ? null : projectData.project_start,
        project_end: projectData.project_end === '' ? null : projectData.project_end
      };
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating project:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Project updated:', (data as Project).name);
        return data as Project;
      }
      throw new Error('No data returned from update');
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      throw error;
    }
  }

  // Delete project
  static async deleteProject(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting project:', id);
      
      const { error } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting project:', error);
        throw error;
      }
      
      console.log('✅ Project deleted');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      throw error;
    }
  }

  // Search projects
  static async searchProjects(query: string): Promise<Project[]> {
    try {
      console.log('🔍 Searching projects:', query);
      const searchTerm = `%${query}%`;
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .or(`name.ilike.${searchTerm},project_code.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('project_code', { ascending: true });
      
      if (error) {
        console.error('❌ Error searching projects:', error);
        throw error;
      }
      
      console.log('✅ Search results:', data?.length || 0);
      return (data as Project[]) || [];
    } catch (error) {
      console.error('❌ Failed to search projects:', error);
      throw error;
    }
  }

  // Get projects by status
  static async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    try {
      console.log('🔍 Fetching projects by status:', status);
      
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('status', status)
        .order('project_code', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching projects by status:', error);
        throw error;
      }
      
      console.log('✅ Projects found:', data?.length || 0);
      return (data as Project[]) || [];
    } catch (error) {
      console.error('❌ Failed to fetch projects by status:', error);
      throw error;
    }
  }

  // Export projects (for backup)
  static async exportProjects(): Promise<string> {
    const projects = await this.getAllProjects();
    return JSON.stringify(projects, null, 2);
  }

  // Import projects (for restore)
  static async importProjects(projectsJson: string): Promise<void> {
    try {
      const projects = JSON.parse(projectsJson);
      if (!Array.isArray(projects)) {
        throw new Error('Invalid project data format');
      }
      
      const { error } = await (supabase as any)
        .from('projects')
        .insert(projects);
      
      if (error) {
        console.error('❌ Error importing projects:', error);
        throw error;
      }
      
      console.log('✅ Projects imported successfully');
    } catch (error) {
      console.error('❌ Failed to import projects:', error);
      throw new Error('Failed to import projects');
    }
  }
}
