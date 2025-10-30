// ============================================
// NEW MATERIAL SYSTEM API
// Multi-column strategy with 5 flexible title fields
// ============================================

import { supabase } from './supabase';
import type {
  MaterialGroup,
  MaterialTemplate,
  DimensionGroup,
  Dimension,
  Material,
  MaterialWithDetails,
  MaterialCreateInput,
  DimensionForTemplate
} from '../../types/materialSystem';

// ============================================
// MATERIAL GROUPS
// ============================================

/**
 * Get all material groups
 */
export async function getMaterialGroups(): Promise<MaterialGroup[]> {
  const { data, error } = await supabase
    .from('material_groups')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching material groups:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get single material group by ID
 */
export async function getMaterialGroup(id: number): Promise<MaterialGroup | null> {
  const { data, error } = await supabase
    .from('material_groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching material group:', error);
    throw error;
  }

  return data;
}

// ============================================
// MATERIAL TEMPLATES
// ============================================

/**
 * Get all material templates (optionally filtered by group)
 */
export async function getMaterialTemplates(
  groupId?: number
): Promise<MaterialTemplate[]> {
  let query = supabase
    .from('material_templates')
    .select(`
      *,
      material_group:material_groups(*),
      dimension_group:dimension_groups(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (groupId) {
    query = query.eq('material_group_id', groupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching material templates:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get single material template by ID
 */
export async function getMaterialTemplate(id: number): Promise<MaterialTemplate | null> {
  const { data, error } = await supabase
    .from('material_templates')
    .select(`
      *,
      material_group:material_groups(*),
      dimension_group:dimension_groups(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching material template:', error);
    throw error;
  }

  return data;
}

/**
 * Generate template preview text (5 columns joined with |)
 * Example: "Black Steel | ERW | Sch 40, Grade A | Pipe"
 */
export function generateTemplatePreview(template: MaterialTemplate): string {
  const parts = [
    template.title_1,
    template.title_2,
    template.title_3,
    template.title_4,
    template.title_5
  ].filter(Boolean);  // Remove null/undefined

  return parts.join(' | ');
}

// ============================================
// DIMENSION GROUPS
// ============================================

/**
 * Get all dimension groups
 */
export async function getDimensionGroups(): Promise<DimensionGroup[]> {
  const { data, error } = await supabase
    .from('dimension_groups')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching dimension groups:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// DIMENSIONS
// ============================================

/**
 * Get dimensions for a specific template (calls RPC function)
 * This function automatically filters dimensions based on the template's dimension_group_id
 */
export async function getDimensionsForTemplate(
  templateId: number
): Promise<DimensionForTemplate[]> {
  const { data, error } = await (supabase as any)
    .rpc('get_dimensions_for_template', { p_template_id: templateId });

  if (error) {
    console.error('Error fetching dimensions for template:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get dimensions by dimension group ID and optional type filter
 */
export async function getDimensionsByGroup(
  dimensionGroupId: number,
  dimensionType?: 'common' | 'custom'
): Promise<Dimension[]> {
  let query = supabase
    .from('dimensions')
    .select(`
      *,
      dimension_group:dimension_groups(*)
    `)
    .eq('dimension_group_id', dimensionGroupId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (dimensionType) {
    query = query.eq('dimension_type', dimensionType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching dimensions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Format dimension display text
 * Example: "1/2 inch / 15 mm"
 */
export function formatDimensionDisplay(dimension: Dimension): string {
  const parts = [
    dimension.size_1,
    dimension.size_2,
    dimension.size_3
  ].filter(Boolean);

  return parts.join(' / ');
}

// ============================================
// MATERIALS
// ============================================

/**
 * Get all materials with full details
 */
export async function getMaterials(): Promise<MaterialWithDetails[]> {
  try {
    // Simple query first - just get materials without joins
    const { data, error } = await (supabase as any)
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Return empty array - table is likely empty after fresh schema creation
      return [];
    }

    // Return data as-is for now (no joins until PostgREST schema refreshes)
    return data || [];
  } catch (err) {
    console.error('Exception fetching materials:', err);
    return [];
  }
}

/**
 * Get single material by ID
 */
export async function getMaterial(id: string): Promise<MaterialWithDetails | null> {
  const { data, error } = await (supabase as any)
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching material:', error);
    return null;
  }

  return data;
}

/**
 * Create materials in bulk from template + dimension selections
 * Automatically generates descriptions using RPC function
 */
export async function createMaterialsBulk(
  materials: MaterialCreateInput[]
): Promise<Material[]> {
  // Generate IDs and descriptions for each material
  const timestamp = Date.now();
  
  const materialsWithIds = await Promise.all(
    materials.map(async (material, index) => {
      // Generate unique ID
      const id = `MAT-${timestamp}-${index}`;
      
      // Call RPC to generate description
      const { data: description, error: descError } = await (supabase as any)
        .rpc('generate_material_description', {
          p_template_id: material.material_template_id,
          p_dimension_id: material.dimension_id || null
        });

      if (descError) {
        console.error('Error generating description:', descError);
        throw descError;
      }

      return {
        id,
        material_code: id, // Use ID as material_code for now
        material_template_id: material.material_template_id,
        dimension_id: material.dimension_id || null,
        material_description: description || 'Unknown Material',
        unit_of_measure: material.unit_of_measure,
        requires_lot_tracking: material.requires_lot_tracking || false,
        requires_serial_tracking: material.requires_serial_tracking || false,
        requires_expiry_tracking: material.requires_expiry_tracking || false,
        company_id: material.company_id || null,
        project_id: material.project_id || null,
        is_active: true
      };
    })
  );

  // Bulk insert
  const { data, error } = await (supabase as any)
    .from('materials')
    .insert(materialsWithIds)
    .select();

  if (error) {
    console.error('Error creating materials:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update existing material
 */
export async function updateMaterial(
  id: string,
  updates: Partial<Material>
): Promise<Material> {
  const { data, error } = await (supabase as any)
    .from('materials')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating material:', error);
    throw error;
  }

  return data;
}

/**
 * Delete (deactivate) material
 */
export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('materials')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get full material description (template + dimension)
 * Uses RPC function to generate formatted description
 */
export async function generateMaterialDescription(
  templateId: number,
  dimensionId?: number | null
): Promise<string> {
  const { data, error } = await (supabase as any)
    .rpc('generate_material_description', {
      p_template_id: templateId,
      p_dimension_id: dimensionId || null
    });

  if (error) {
    console.error('Error generating material description:', error);
    throw error;
  }

  return data || '';
}
