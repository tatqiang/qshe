/**
 * Hierarchical Areas API - Real Supabase Integration
 * 
 * This API works with the hierarchical areas schema:
 * - main_areas
 * - sub_areas_1
 * - sub_areas_2
 */

import { supabase } from './supabase';
import type { MainArea, SubArea1, SubArea2 } from '../../types';

// ==================== MAIN AREAS API ====================

export async function getMainAreas(projectId?: string): Promise<MainArea[]> {
  try {
    let query = supabase
      .from('main_areas')
      .select('*')
      .order('main_area_name', { ascending: true }); // Use main_area_name for ordering

    // Filter by project if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Map database fields to our types with proper casting
    const mainAreas: MainArea[] = (data || []).map((area: any) => ({
      id: area.id,
      project_id: area.project_id,
      name: area.main_area_name, // Map from main_area_name
      code: area.area_code, // Map from area_code
      description: area.description,
      created_at: area.created_at,
      updated_at: area.updated_at,
      created_by: area.created_by
    }));

    console.log(`[HIERARCHICAL_API] Getting main areas for project ${projectId}:`, mainAreas.length);
    return mainAreas;
  } catch (error) {
    console.error('Error fetching main areas:', error);
    return [];
  }
}

export async function createMainArea(data: {
  project_id?: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<MainArea | null> {
  try {
    const newArea = {
      project_id: data.project_id || null,
      main_area_name: data.name, // Use main_area_name instead of name
      area_code: data.code || generateAreaCode(data.name), // Use area_code instead of code
      description: data.description,
    };

    const { data: inserted, error } = await supabase
      .from('main_areas')
      .insert(newArea as any)
      .select()
      .single();

    if (error) throw error;

    const mainArea: MainArea = {
      id: (inserted as any).id,
      project_id: (inserted as any).project_id,
      name: (inserted as any).main_area_name, // Map from main_area_name
      code: (inserted as any).area_code, // Map from area_code
      description: (inserted as any).description,
      created_at: (inserted as any).created_at,
      updated_at: (inserted as any).updated_at,
      created_by: (inserted as any).created_by
    };

    console.log(`[HIERARCHICAL_API] Created main area:`, mainArea);
    return mainArea;
  } catch (error) {
    console.error('Error creating main area:', error);
    return null;
  }
}

// ==================== SUB AREAS LEVEL 1 API ====================

export async function getSubAreas1(projectId?: string, mainAreaId?: string): Promise<SubArea1[]> {
  try {
    let query = supabase
      .from('sub_areas_1')
      .select('*')
      .order('sub_area1_name', { ascending: true }); // Use sub_area1_name for ordering

    // Filter by main area if provided
    if (mainAreaId) {
      query = query.eq('main_area_id', mainAreaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Map database fields to our types with proper casting
    const subAreas1: SubArea1[] = (data || []).map((area: any) => ({
      id: area.id,
      project_id: projectId || '', // We need this for compatibility
      main_area_id: area.main_area_id,
      name: area.sub_area1_name, // Map from sub_area1_name
      code: area.sub_area1_code, // Map from sub_area1_code
      description: area.description,
      created_at: area.created_at,
      updated_at: area.updated_at,
      created_by: area.created_by
    }));

    console.log(`[HIERARCHICAL_API] Getting sub areas 1 for main area ${mainAreaId}:`, subAreas1.length);
    return subAreas1;
  } catch (error) {
    console.error('Error fetching sub areas level 1:', error);
    return [];
  }
}

export async function createSubArea1(data: {
  project_id?: string;
  main_area_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<SubArea1 | null> {
  try {
    const newArea = {
      main_area_id: data.main_area_id,
      sub_area1_name: data.name, // Use sub_area1_name
      sub_area1_code: data.code || generateAreaCode(data.name), // Use sub_area1_code
      description: data.description,
    };

    const { data: inserted, error } = await supabase
      .from('sub_areas_1') // Use sub_areas_1 table
      .insert(newArea as any)
      .select()
      .single();

    if (error) throw error;

    const subArea1: SubArea1 = {
      id: (inserted as any).id,
      project_id: data.project_id || '',
      main_area_id: (inserted as any).main_area_id,
      name: (inserted as any).sub_area1_name, // Map from sub_area1_name
      code: (inserted as any).sub_area1_code, // Map from sub_area1_code
      description: (inserted as any).description,
      created_at: (inserted as any).created_at,
      updated_at: (inserted as any).updated_at,
      created_by: (inserted as any).created_by
    };

    console.log(`[HIERARCHICAL_API] Created sub area 1:`, subArea1);
    return subArea1;
  } catch (error) {
    console.error('Error creating sub area level 1:', error);
    return null;
  }
}

// ==================== SUB AREAS LEVEL 2 API ====================

export async function getSubAreas2(projectId?: string, subArea1Id?: string): Promise<SubArea2[]> {
  try {
    let query = supabase
      .from('sub_areas_2')
      .select('*')
      .order('sub_area2_name', { ascending: true }); // Use sub_area2_name for ordering

    // Filter by sub area 1 if provided
    if (subArea1Id) {
      query = query.eq('sub_area1_id', subArea1Id);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Map database fields to our types with proper casting
    const subAreas2: SubArea2[] = (data || []).map((area: any) => ({
      id: area.id,
      project_id: projectId || '', // We need this for compatibility
      main_area_id: '', // We'll need to join this if needed
      sub_area1_id: area.sub_area1_id,
      name: area.sub_area2_name, // Map from sub_area2_name
      code: area.sub_area2_code, // Map from sub_area2_code
      description: area.description,
      created_at: area.created_at,
      updated_at: area.updated_at,
      created_by: area.created_by
    }));

    console.log(`[HIERARCHICAL_API] Getting sub areas 2 for sub area 1 ${subArea1Id}:`, subAreas2.length);
    return subAreas2;
  } catch (error) {
    console.error('Error fetching sub areas level 2:', error);
    return [];
  }
}

export async function createSubArea2(data: {
  project_id?: string;
  main_area_id?: string;
  sub_area1_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<SubArea2 | null> {
  try {
    const newArea = {
      sub_area1_id: data.sub_area1_id,
      sub_area2_name: data.name, // Use sub_area2_name
      sub_area2_code: data.code || generateAreaCode(data.name), // Use sub_area2_code
      description: data.description,
    };

    const { data: inserted, error } = await supabase
      .from('sub_areas_2') // Use sub_areas_2 table
      .insert(newArea as any)
      .select()
      .single();

    if (error) throw error;

    const subArea2: SubArea2 = {
      id: (inserted as any).id,
      project_id: data.project_id || '',
      main_area_id: data.main_area_id || '',
      sub_area1_id: (inserted as any).sub_area1_id,
      name: (inserted as any).sub_area2_name, // Map from sub_area2_name
      code: (inserted as any).sub_area2_code, // Map from sub_area2_code
      description: (inserted as any).description,
      created_at: (inserted as any).created_at,
      updated_at: (inserted as any).updated_at,
      created_by: (inserted as any).created_by
    };

    console.log(`[HIERARCHICAL_API] Created sub area 2:`, subArea2);
    return subArea2;
  } catch (error) {
    console.error('Error creating sub area level 2:', error);
    return null;
  }
}

// ==================== UTILITY FUNCTIONS ====================

function generateAreaCode(name: string): string {
  // Extract numbers first
  const numbers = name.match(/\d+/g);
  if (numbers) {
    return numbers.join('');
  }
  
  // Extract initials from words
  const words = name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with'].includes(word.toLowerCase()));
  
  return words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4);
}
