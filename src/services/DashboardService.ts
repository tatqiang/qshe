import { supabase } from '../lib/api/supabase';

export interface DashboardStats {
  totalMembers: number;
  totalWorkers: number;
  totalIssues: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  time: string;
  type: 'issue' | 'meeting' | 'permit';
  projectId?: string;
}

export class DashboardService {
  /**
   * Get dashboard statistics
   * Members and Workers are GLOBAL counts (not project-filtered)
   * Only Issues are filtered by project
   */
  static async getDashboardStats(filterProjectId?: string): Promise<DashboardStats> {
    try {
      console.log('📊 Getting dashboard stats with filter:', filterProjectId || 'none');
      
      // Members and Workers are ALWAYS global counts (not filtered by project)
      const totalMembers = await this.getTotalMembers();
      const totalWorkers = await this.getTotalWorkers();
      
      // Only Issues are filtered by the project filter
      const totalIssues = await this.getTotalIssues(filterProjectId);

      console.log('📊 Dashboard stats result:', { 
        totalMembers, 
        totalWorkers, 
        totalIssues, 
        filterProjectId: filterProjectId || 'all' 
      });

      return {
        totalMembers,
        totalWorkers,
        totalIssues
      };

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return fallback data
      return {
        totalMembers: 0,
        totalWorkers: 0,
        totalIssues: 0
      };
    }
  }

  /**
   * Get total members (users with role 'member') - GLOBAL count, not filtered by project
   */
  private static async getTotalMembers(): Promise<number> {
    try {
      console.log('🔍 Getting total members (role=member) - GLOBAL count');

      // Get all users with role 'member' regardless of project
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'member')
        .eq('status', 'active');

      console.log('📊 All members query result:', { 
        error: error?.message, 
        count: data?.length 
      });

      if (error) {
        console.error('Error fetching all members:', error);
        return 0;
      }
      return data?.length || 0;
    } catch (error) {
      console.error('Error in getTotalMembers:', error);
      return 0;
    }
  }

  /**
   * Get total workers (position_id 12=Team Head + 13=Worker) - GLOBAL count, not filtered by project
   */
  private static async getTotalWorkers(): Promise<number> {
    try {
      console.log('🔍 Getting total workers (position_id 12+13) - GLOBAL count');

      // Get all users with position_id 12 (Team Head) or 13 (Worker) regardless of project
      const { data, error } = await supabase
        .from('users')
        .select('id, position_id')
        .in('position_id', [12, 13])
        .eq('status', 'active');

      console.log('📊 All workers query result:', { 
        error: error?.message, 
        count: data?.length,
        sampleData: data?.slice(0, 2)
      });

      if (error) {
        console.error('Error fetching all workers:', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error in getTotalWorkers:', error);
      return 0;
    }
  }

  /**
   * Get total safety patrol issues for a project or all projects
   */
  private static async getTotalIssues(projectId?: string): Promise<number> {
    try {
      let query = supabase
        .from('safety_patrols')
        .select('id', { count: 'exact' })
        .in('status', ['open', 'pending_verification']);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching safety patrol issues:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTotalIssues:', error);
      return 0;
    }
  }

  /**
   * Get recent activities (currently only safety patrol issues)
   */
  static async getRecentActivities(projectId?: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      let query = supabase
        .from('safety_patrols')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          updated_at,
          project_id
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: patrols, error } = await query;

      if (error) {
        console.error('Error fetching recent activities:', error);
        return [];
      }

      // Transform safety patrol data to recent activities
      const activities: RecentActivity[] = (patrols || []).map((patrol: any) => {
        const timeDiff = Date.now() - new Date(patrol.created_at).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);

        let timeText = '';
        if (daysAgo > 0) {
          timeText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        } else if (hoursAgo > 0) {
          timeText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeText = 'Just now';
        }

        let actionText = '';
        switch (patrol.status) {
          case 'open':
            actionText = `New safety patrol created: ${patrol.title}`;
            break;
          case 'pending_verification':
            actionText = `Safety patrol under review: ${patrol.title}`;
            break;
          case 'closed':
            actionText = `Safety patrol completed: ${patrol.title}`;
            break;
          case 'rejected':
            actionText = `Safety patrol rejected: ${patrol.title}`;
            break;
          default:
            actionText = `Safety patrol updated: ${patrol.title}`;
        }

        return {
          id: patrol.id,
          action: actionText,
          time: timeText,
          type: 'issue' as const,
          projectId: patrol.project_id
        };
      });

      return activities;

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Get all projects for the filter dropdown
   */
  static async getProjects() {
    try {
      // Use the same method as ProjectSelection component
      const { data: supabaseProjects, error } = await supabase.rpc('get_active_projects');
      
      console.log('🔍 Projects query result (using RPC):', { 
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
        dataCount: (supabaseProjects as any)?.length || 0,
        sampleData: (supabaseProjects as any)?.[0] || null
      });

      if (error) {
        console.log('🔧 Supabase RPC error (falling back to direct query):', error.message);
        
        // Fallback to direct table query
        const { data: directProjects, error: directError } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .order('name');
          
        if (directError) {
          console.error('Direct projects query also failed:', directError);
          return this.getMockProjects();
        }
        
        if (directProjects && directProjects.length > 0) {
          return directProjects.map((project: any) => ({
            id: project.id,
            name: project.name,
            project_code: project.project_code || project.code || 'N/A',
            status: project.status || 'active'
          }));
        }
        
        return this.getMockProjects();
      }

      if (supabaseProjects && Array.isArray(supabaseProjects) && (supabaseProjects as any).length > 0) {
        console.log('✅ Projects loaded from Supabase RPC:', (supabaseProjects as any).length);
        return supabaseProjects;
      }

      // If no projects found, use mock data
      console.warn('No projects found, using mock data');
      return this.getMockProjects();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return this.getMockProjects();
    }
  }

  /**
   * Get mock projects with proper UUID format
   */
  private static getMockProjects() {
    console.log('🔄 Using mock data for testing...');
    return [
      {
        id: 'a9b6708a-bad2-4d6b-9ff8-01815a106820', // Proper UUID format
        name: 'Downtown Office Complex',
        project_code: 'AIC',
        status: 'active'
      },
      {
        id: 'b8c7719b-cae3-5e7c-a009-12926b217931', // Proper UUID format
        name: 'Highway Bridge Construction',
        project_code: 'RM1',
        status: 'active'
      },
      {
        id: 'c9d8820c-dbf4-6f8d-b110-23037c328042', // Proper UUID format
        name: 'Mega Shopping Mall Project',
        project_code: 'MEGA',
        status: 'active'
      },
      {
        id: 'd0e9931d-ecf5-709e-c221-34148d439153', // Proper UUID format
        name: 'Underground Utility Tunnel',
        project_code: 'GG-U001',
        status: 'active'
      }
    ];
  }
}
