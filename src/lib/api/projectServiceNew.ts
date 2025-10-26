// Project Service for CRUD operations
// Uses backend API with Azure SQL Database integration
// Falls back to localStorage when API is unavailable

interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  project_manager_id?: string;
  created_at: string;
  updated_at: string;
  // Additional Azure SQL fields
  client_name?: string;
  site_location?: string;
  start_date?: string;
  end_date?: string;
  safety_requirements?: string;
  risk_level?: string;
  created_by?: string;
}

export class ProjectService {
  private static STORAGE_KEY = 'qshe_projects';
  private static API_BASE_URL = 'http://localhost:3001/api';

  // ==========================================
  // API METHODS (Primary)
  // ==========================================

  // Get all projects - tries API first, falls back to localStorage
  static async getAllProjects(): Promise<Project[]> {
    try {
      console.log('📋 Fetching projects from API...');
      
      const response = await fetch(`${this.API_BASE_URL}/projects`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Projects loaded from API:', result.projects.length);
          // Also save to localStorage for offline access
          this.saveProjectsToStorage(result.projects);
          return result.projects;
        }
      }
      
      throw new Error('API call failed');
    } catch (error) {
      console.warn('⚠️ API unavailable, using localStorage fallback:', error);
      return this.getProjectsFromStorage();
    }
  }

  // Get project by ID
  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.project;
        }
      }
      
      if (response.status === 404) {
        return null;
      }
      
      throw new Error('API call failed');
    } catch (error) {
      console.warn('⚠️ API unavailable, using localStorage fallback');
      return this.getProjectFromStorage(id);
    }
  }

  // Create new project
  static async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    try {
      // Get current user ID for created_by field
      const currentUser = JSON.parse(localStorage.getItem('azure_registered_users') || '[]')[0];
      const created_by = currentUser?.id || null;

      const response = await fetch(`${this.API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          project_code: projectData.project_code.toUpperCase(),
          created_by
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Project created in Azure SQL:', result.project.name);
          return result.project;
        }
      }

      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create project');
    } catch (error) {
      console.warn('⚠️ API unavailable, using localStorage fallback');
      return this.createProjectInStorage(projectData);
    }
  }

  // Update existing project
  static async updateProject(id: string, projectData: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          project_code: projectData.project_code ? projectData.project_code.toUpperCase() : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Project updated in Azure SQL:', result.project.name);
          return result.project;
        }
      }

      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update project');
    } catch (error) {
      console.warn('⚠️ API unavailable, using localStorage fallback');
      return this.updateProjectInStorage(id, projectData);
    }
  }

  // Delete project
  static async deleteProject(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Project deleted from Azure SQL');
          return true;
        }
      }

      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete project');
    } catch (error) {
      console.warn('⚠️ API unavailable, using localStorage fallback');
      return this.deleteProjectFromStorage(id);
    }
  }

  // ==========================================
  // LOCALSTORAGE METHODS (Fallback)
  // ==========================================

  // Generate simple UUID
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get projects from localStorage
  private static getProjectsFromStorage(): Project[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultProjects();
    } catch (error) {
      console.error('Error loading projects from storage:', error);
      return this.getDefaultProjects();
    }
  }

  // Save projects to localStorage
  private static saveProjectsToStorage(projects: Project[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects to storage:', error);
    }
  }

  // Get project from localStorage by ID
  private static getProjectFromStorage(id: string): Project | null {
    const projects = this.getProjectsFromStorage();
    return projects.find(project => project.id === id) || null;
  }

  // Create project in localStorage
  private static createProjectInStorage(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const projects = this.getProjectsFromStorage();
    
    // Check if project code already exists
    const existingProject = projects.find(p => p.project_code.toLowerCase() === projectData.project_code.toLowerCase());
    if (existingProject) {
      throw new Error(`Project with code "${projectData.project_code}" already exists`);
    }

    const newProject: Project = {
      id: this.generateId(),
      ...projectData,
      project_code: projectData.project_code.toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    projects.push(newProject);
    this.saveProjectsToStorage(projects);
    
    console.log('✅ Project created in localStorage:', newProject.name);
    return newProject;
  }

  // Update project in localStorage
  private static updateProjectInStorage(id: string, projectData: Partial<Omit<Project, 'id' | 'created_at'>>): Project {
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(project => project.id === id);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    // Check if project code already exists (excluding current project)
    if (projectData.project_code) {
      const existingProject = projects.find(p => 
        p.project_code.toLowerCase() === projectData.project_code.toLowerCase() && p.id !== id
      );
      if (existingProject) {
        throw new Error(`Project with code "${projectData.project_code}" already exists`);
      }
    }

    const updatedProject: Project = {
      ...projects[projectIndex],
      ...projectData,
      project_code: projectData.project_code ? projectData.project_code.toUpperCase() : projects[projectIndex].project_code,
      updated_at: new Date().toISOString()
    };

    projects[projectIndex] = updatedProject;
    this.saveProjectsToStorage(projects);
    
    console.log('✅ Project updated in localStorage:', updatedProject.name);
    return updatedProject;
  }

  // Delete project from localStorage
  private static deleteProjectFromStorage(id: string): boolean {
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(project => project.id === id);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1);
    this.saveProjectsToStorage(projects);
    
    console.log('✅ Project deleted from localStorage:', deletedProject.name);
    return true;
  }

  // Get default sample projects
  private static getDefaultProjects(): Project[] {
    const defaultProjects: Project[] = [
      {
        id: '1',
        project_code: 'OFFICE001',
        name: 'Office Building Construction',
        description: 'Main office building construction project',
        status: 'active',
        project_manager_id: 'pm001',
        client_name: 'Jardine Engineering Company Limited',
        site_location: 'Bangkok, Thailand',
        risk_level: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        project_code: 'FACTORY002',
        name: 'Manufacturing Facility',
        description: 'New manufacturing facility setup',
        status: 'active',
        project_manager_id: 'pm002',
        client_name: 'Industrial Solutions Ltd',
        site_location: 'Rayong, Thailand',
        risk_level: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        project_code: 'WAREHOUSE003',
        name: 'Storage Warehouse',
        description: 'Automated storage warehouse project',
        status: 'completed',
        project_manager_id: 'pm001',
        client_name: 'Logistics Company',
        site_location: 'Chonburi, Thailand',
        risk_level: 'low',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Save default projects to localStorage
    this.saveProjectsToStorage(defaultProjects);
    return defaultProjects;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  // Search projects
  static async searchProjects(query: string): Promise<Project[]> {
    const projects = await this.getAllProjects();
    const searchTerm = query.toLowerCase();
    
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.project_code.toLowerCase().includes(searchTerm) ||
      (project.description && project.description.toLowerCase().includes(searchTerm)) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchTerm))
    );
  }

  // Get projects by status
  static async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const projects = await this.getAllProjects();
    return projects.filter(project => project.status === status);
  }

  // Clear all projects (for testing)
  static clearAllProjects(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ All projects cleared from localStorage');
  }

  // Export projects (for backup)
  static async exportProjects(): Promise<string> {
    const projects = await this.getAllProjects();
    return JSON.stringify(projects, null, 2);
  }

  // Import projects (for restore)
  static importProjects(projectsJson: string): void {
    try {
      const projects = JSON.parse(projectsJson);
      if (Array.isArray(projects)) {
        this.saveProjectsToStorage(projects);
        console.log('✅ Projects imported successfully');
      } else {
        throw new Error('Invalid project data format');
      }
    } catch (error) {
      console.error('❌ Error importing projects:', error);
      throw new Error('Failed to import projects');
    }
  }
}

// Export the Project interface for use in components
export type { Project };