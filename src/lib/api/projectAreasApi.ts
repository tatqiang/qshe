import { supabase } from './supabase';
import type { ProjectArea } from '../../types';

export interface CreateProjectAreaData {
  projectId: string;
  areaCode: string;
  areaName: string;
  description?: string;
}

export interface SearchAreasParams {
  projectId: string;
  query: string;
  limit?: number;
}

/**
 * Search project areas by name or code with fuzzy matching
 */
export async function searchProjectAreas({
  projectId,
  query,
  limit = 10
}: SearchAreasParams): Promise<ProjectArea[]> {
  try {
    if (!query.trim()) {
      // Return recent areas if no query
      const { data, error } = await supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }

    // Search with fuzzy matching using PostgreSQL's similarity
    const { data, error } = await supabase
      .from('project_areas')
      .select('*')
      .eq('project_id', projectId)
      .or(`area_name.ilike.%${query}%,area_code.ilike.%${query}%`)
      .order('area_name')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching project areas:', error);
    return [];
  }
}

/**
 * Create a new project area
 */
export async function createProjectArea(data: CreateProjectAreaData): Promise<ProjectArea | null> {
  try {
    const { data: newArea, error } = await (supabase
      .from('project_areas') as any)
      .insert({
        project_id: data.projectId,
        area_code: data.areaCode,
        area_name: data.areaName,
        description: data.description,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        console.warn('Area already exists:', data.areaName);
        // Try to find the existing area
        const { data: existingArea } = await supabase
          .from('project_areas')
          .select('*')
          .eq('project_id', data.projectId)
          .eq('area_name', data.areaName)
          .single();
        
        return existingArea;
      }
      throw error;
    }

    return newArea;
  } catch (error) {
    console.error('Error creating project area:', error);
    return null;
  }
}

/**
 * Get all project areas for a project
 */
export async function getProjectAreas(projectId: string): Promise<ProjectArea[]> {
  try {
    const { data, error } = await supabase
      .from('project_areas')
      .select('*')
      .eq('project_id', projectId)
      .order('area_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project areas:', error);
    return [];
  }
}

/**
 * Find or create a project area by name
 * This is the key function for auto-creation functionality
 */
export async function findOrCreateProjectArea(
  projectId: string,
  areaName: string,
  areaCode?: string
): Promise<ProjectArea | null> {
  try {
    // First, try to find existing area by exact name match
    const { data: existingArea, error: searchError } = await supabase
      .from('project_areas')
      .select('*')
      .eq('project_id', projectId)
      .eq('area_name', areaName)
      .single();

    if (existingArea && !searchError) {
      return existingArea;
    }

    // If not found, create a new area
    const generatedCode = areaCode || generateAreaCode(areaName);
    
    return await createProjectArea({
      projectId,
      areaCode: generatedCode,
      areaName: areaName.trim(),
      description: `Auto-created area: ${areaName}`
    });
  } catch (error) {
    console.error('Error in findOrCreateProjectArea:', error);
    return null;
  }
}

/**
 * Generate area code from area name
 */
function generateAreaCode(areaName: string): string {
  // Extract numbers from the area name (e.g., "Area 311" -> "311")
  const numbers = areaName.match(/\d+/);
  if (numbers) {
    return numbers[0];
  }
  
  // If no numbers, create code from first letters
  const words = areaName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  // Take first letter of each word, max 4 characters
  return words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4);
}

/**
 * Update project area
 */
export async function updateProjectArea(
  areaId: string,
  updates: Partial<CreateProjectAreaData>
): Promise<ProjectArea | null> {
  try {
    const { data, error } = await (supabase
      .from('project_areas') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project area:', error);
    return null;
  }
}

/**
 * Delete project area
 */
export async function deleteProjectArea(areaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('project_areas')
      .delete()
      .eq('id', areaId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting project area:', error);
    return false;
  }
}
