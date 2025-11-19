// ============================================
// MATERIAL SYSTEM API
// Multi-column strategy with 5 flexible title fields
// ============================================

import { supabase } from '../supabase'
import type {
  MaterialGroup,
  MaterialTemplate,
  DimensionGroup,
  Dimension,
  Material,
  MaterialWithDetails,
  MaterialCreateInput,
  DimensionForTemplate,
  Brand,
  AddToInventoryItem
} from '@/types/materialSystem'

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
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching material groups:', error)
    throw error
  }

  return data || []
}

/**
 * Get single material group by ID
 */
export async function getMaterialGroup(id: number): Promise<MaterialGroup | null> {
  const { data, error } = await supabase
    .from('material_groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching material group:', error)
    throw error
  }

  return data
}

/**
 * Create new material group
 */
export async function createMaterialGroup(group: Omit<MaterialGroup, 'id' | 'created_at' | 'updated_at'>): Promise<MaterialGroup> {
  const { data, error } = await supabase
    .from('material_groups')
    .insert(group)
    .select()
    .single()

  if (error) {
    console.error('Error creating material group:', error)
    throw error
  }

  return data
}

/**
 * Update material group
 */
export async function updateMaterialGroup(id: number, updates: Partial<MaterialGroup>): Promise<MaterialGroup> {
  const { data, error } = await supabase
    .from('material_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating material group:', error)
    throw error
  }

  return data
}

/**
 * Delete material group
 */
export async function deleteMaterialGroup(id: number): Promise<void> {
  const { error } = await supabase
    .from('material_groups')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting material group:', error)
    throw error
  }
}

// ============================================
// MATERIAL TEMPLATES
// ============================================

/**
 * Get all material templates (optionally filtered by group)
 */
export async function getMaterialTemplates(groupId?: number): Promise<MaterialTemplate[]> {
  let query = supabase
    .from('material_templates')
    .select(`
      *,
      material_group:material_groups(*),
      dimension_group:dimension_groups(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (groupId) {
    query = query.eq('material_group_id', groupId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching material templates:', error)
    throw error
  }

  return data || []
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
    .single()

  if (error) {
    console.error('Error fetching material template:', error)
    throw error
  }

  return data
}

/**
 * Create new material template
 */
export async function createMaterialTemplate(template: Omit<MaterialTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<MaterialTemplate> {
  const { data, error } = await supabase
    .from('material_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    console.error('Error creating material template:', error)
    throw error
  }

  return data
}

/**
 * Update material template
 */
export async function updateMaterialTemplate(id: number, updates: Partial<MaterialTemplate>): Promise<MaterialTemplate> {
  const { data, error } = await supabase
    .from('material_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating material template:', error)
    throw error
  }

  return data
}

/**
 * Delete material template
 */
export async function deleteMaterialTemplate(id: number): Promise<void> {
  const { error } = await supabase
    .from('material_templates')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting material template:', error)
    throw error
  }
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
  ].filter(Boolean) // Remove null/undefined

  return parts.join(' | ')
}

// ============================================
// BRANDS
// ============================================

/**
 * Get all brands
 */
export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('brand_title', { ascending: true })

  if (error) {
    console.error('Error fetching brands:', error)
    throw error
  }

  return data || []
}

/**
 * Create new brand
 */
export async function createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single()

  if (error) {
    console.error('Error creating brand:', error)
    throw error
  }

  return data
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
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching dimension groups:', error)
    throw error
  }

  return data || []
}

/**
 * Create new dimension group
 */
export async function createDimensionGroup(group: Omit<DimensionGroup, 'id' | 'created_at' | 'updated_at'>): Promise<DimensionGroup> {
  const { data, error } = await supabase
    .from('dimension_groups')
    .insert(group)
    .select()
    .single()

  if (error) {
    console.error('Error creating dimension group:', error)
    throw error
  }

  return data
}

/**
 * Update dimension group
 */
export async function updateDimensionGroup(id: number, updates: Partial<DimensionGroup>): Promise<DimensionGroup> {
  const { data, error } = await supabase
    .from('dimension_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating dimension group:', error)
    throw error
  }

  return data
}

/**
 * Delete dimension group
 */
export async function deleteDimensionGroup(id: number): Promise<void> {
  const { error } = await supabase
    .from('dimension_groups')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting dimension group:', error)
    throw error
  }
}

// ============================================
// DIMENSIONS
// ============================================

/**
 * Get dimensions for a specific template (calls RPC function)
 * This function automatically filters dimensions based on the template's dimension_group_id
 */
export async function getDimensionsForTemplate(templateId: number): Promise<DimensionForTemplate[]> {
  const { data, error } = await supabase.rpc('get_dimensions_for_template', {
    p_template_id: templateId
  })

  if (error) {
    console.error('Error fetching dimensions for template:', error)
    throw error
  }

  return data || []
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
    .order('display_order', { ascending: true })

  if (dimensionType) {
    query = query.eq('dimension_type', dimensionType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching dimensions:', error)
    throw error
  }

  return data || []
}

/**
 * Get all dimensions (optionally filtered by group)
 */
export async function getDimensions(dimensionGroupId?: number): Promise<Dimension[]> {
  let query = supabase
    .from('dimensions')
    .select(`
      *,
      dimension_group:dimension_groups(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (dimensionGroupId) {
    query = query.eq('dimension_group_id', dimensionGroupId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching dimensions:', error)
    throw error
  }

  return data || []
}

/**
 * Create new dimension
 */
export async function createDimension(dimension: Omit<Dimension, 'id' | 'created_at' | 'updated_at'>): Promise<Dimension> {
  const { data, error } = await supabase
    .from('dimensions')
    .insert(dimension)
    .select()
    .single()

  if (error) {
    console.error('Error creating dimension:', error)
    throw error
  }

  return data
}

/**
 * Update dimension
 */
export async function updateDimension(id: number, updates: Partial<Dimension>): Promise<Dimension> {
  const { data, error } = await supabase
    .from('dimensions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating dimension:', error)
    throw error
  }

  return data
}

/**
 * Delete dimension
 */
export async function deleteDimension(id: number): Promise<void> {
  const { error } = await supabase
    .from('dimensions')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting dimension:', error)
    throw error
  }
}

/**
 * Format dimension display text
 * Example: "1/2 inch / 15 mm"
 */
export function formatDimensionDisplay(dimension: Dimension): string {
  const parts = [dimension.size_1, dimension.size_2, dimension.size_3].filter(Boolean)

  return parts.join(' / ')
}

// ============================================
// MATERIALS
// ============================================

/**
 * Get all materials with full details
 */
export async function getMaterials(): Promise<MaterialWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching materials:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching materials:', err)
    return []
  }
}

/**
 * Get single material by ID
 */
export async function getMaterial(id: string): Promise<MaterialWithDetails | null> {
  const { data, error } = await supabase.from('materials').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching material:', error)
    return null
  }

  return data
}

/**
 * Create materials in bulk from template + dimension selections
 * Automatically generates descriptions using RPC function
 */
export async function createMaterialsBulk(materials: MaterialCreateInput[]): Promise<Material[]> {
  // Generate IDs and descriptions for each material
  const timestamp = Date.now()

  const materialsWithIds = await Promise.all(
    materials.map(async (material, index) => {
      // Generate unique ID
      const id = `MAT-${timestamp}-${index}`

      // Call RPC to generate description
      const { data: description, error: descError } = await supabase.rpc(
        'generate_material_description',
        {
          p_template_id: material.material_template_id,
          p_dimension_id: material.dimension_id || null
        }
      )

      if (descError) {
        console.error('Error generating description:', descError)
        throw descError
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
      }
    })
  )

  // Bulk insert
  const { data, error } = await supabase.from('materials').insert(materialsWithIds).select()

  if (error) {
    console.error('Error creating materials:', error)
    throw error
  }

  return data || []
}

/**
 * Update existing material
 */
export async function updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating material:', error)
    throw error
  }

  return data
}

/**
 * Delete (deactivate) material
 */
export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').update({ is_active: false }).eq('id', id)

  if (error) {
    console.error('Error deleting material:', error)
    throw error
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get full material description (template + dimension)
 * Builds description from template's title fields
 */
export async function generateMaterialDescription(
  templateId: number,
  dimensionId?: number | null
): Promise<string> {
  try {
    // Get template titles
    const { data: template, error: templateError } = await supabase
      .from('material_templates')
      .select('title_1, title_2, title_3, title_4, title_5')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // Build description from title fields
    const titleParts = [
      template.title_1,
      template.title_2,
      template.title_3,
      template.title_4,
      template.title_5
    ].filter(Boolean)

    let description = titleParts.join(' ')

    // Add dimension if provided
    if (dimensionId && dimensionId > 0) {
      const { data: dimension, error: dimError } = await supabase
        .from('dimensions')
        .select('size_1, size_2, size_3')
        .eq('id', dimensionId)
        .single()

      if (!dimError && dimension) {
        const sizeParts = [dimension.size_1, dimension.size_2, dimension.size_3].filter(Boolean)
        if (sizeParts.length > 0) {
          description += ' ' + sizeParts.join(' / ')
        }
      }
    }

    return description
  } catch (error) {
    console.error('Error generating material description:', error)
    return ''
  }
}

/**
 * Get full material description in Thai (template + dimension)
 * Builds description from template's Thai title fields
 */
export async function generateMaterialDescriptionTh(
  templateId: number,
  dimensionId?: number | null
): Promise<string> {
  try {
    // Get template Thai titles (note: columns are title_1_th, title_2_th, etc.)
    const { data: template, error: templateError } = await supabase
      .from('material_templates')
      .select('title_1_th, title_2_th, title_3_th, title_4_th, title_5_th')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // Build Thai description from title_th fields
    const titleParts = [
      template.title_1_th,
      template.title_2_th,
      template.title_3_th,
      template.title_4_th,
      template.title_5_th
    ].filter(Boolean)

    let description = titleParts.join(' ')

    // Add dimension if provided
    if (dimensionId && dimensionId > 0) {
      const { data: dimension, error: dimError } = await supabase
        .from('dimensions')
        .select('size_1, size_2, size_3')
        .eq('id', dimensionId)
        .single()

      if (!dimError && dimension) {
        const sizeParts = [dimension.size_1, dimension.size_2, dimension.size_3].filter(Boolean)
        if (sizeParts.length > 0) {
          description += ' ' + sizeParts.join(' / ')
        }
      }
    }

    return description
  } catch (error) {
    console.error('Error generating Thai material description:', error)
    return ''
  }
}

/**
 * Get material inventory record by template ID and project ID
 * Returns the material_code if already exists in inventory
 */
export async function getMaterialInventoryByTemplate(
  templateId: number,
  projectId: string,
  dimensionId?: number | null
): Promise<any | null> {
  let query = supabase
    .from('material_inventory')
    .select('id, material_code_id, material_codes(*)')
    .eq('material_template_id', templateId)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .limit(1)
  
  if (dimensionId) {
    query = query.eq('dimension_id', dimensionId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error fetching material inventory by template:', error)
    return null
  }

  return data
}

// ============================================
// MATERIAL INVENTORY - ADD TO INVENTORY
// ============================================

/**
 * Add multiple material items to inventory (without quantities)
 * Creates inventory records for selected templates + dimensions
 */
export async function addMaterialsToInventory(
  projectId: string,
  items: AddToInventoryItem[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const item of items) {
    // For each template, create one record per selected dimension
    for (const dimensionId of item.dimension_ids) {
      try {
        // Check if this combination already exists
        const existing = await getMaterialInventoryByTemplate(
          item.material_template_id,
          projectId,
          dimensionId
        )

        if (existing) {
          results.errors.push(`Template ${item.material_template_id} with dimension ${dimensionId} already exists`)
          results.failed++
          continue
        }

        // Create new inventory record
        // Generate description from template
        const description = await generateMaterialDescription(item.material_template_id, dimensionId)
        const descriptionTh = await generateMaterialDescriptionTh(item.material_template_id, dimensionId)
        
        const { error } = await supabase
          .from('material_inventory')
          .insert({
            project_id: projectId,
            material_template_id: item.material_template_id,
            dimension_id: dimensionId,
            store_id: item.store_id,
            material_code_id: item.material_code_id || null,
            brand_id: item.brand_id || null,
            specific_detail: item.specific_detail || null,
            unit_of_measure: item.unit_of_measure || 'PCS',
            material_description: description,
            material_description_th: descriptionTh,
            current_quantity: 0, // Default to 0 until materials are received
            is_active: true
          })

        if (error) {
          console.error('Error adding to inventory:', error)
          results.errors.push(error.message)
          results.failed++
        } else {
          results.success++
        }
      } catch (err) {
        console.error('Error processing inventory item:', err)
        results.errors.push(err instanceof Error ? err.message : 'Unknown error')
        results.failed++
      }
    }
  }

  return results
}
