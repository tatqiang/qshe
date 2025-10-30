// ============================================
// NEW MATERIAL SYSTEM TYPES
// Multi-column strategy with 5 flexible title fields
// ============================================

/**
 * Material Group - Top-level categorization
 * Example: "Pipes & Fittings", "Valves and Accessories"
 */
export interface MaterialGroup {
  id: number;
  group_code: string;
  group_name: string;
  group_name_th?: string | null;
  sort_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Material Template - Flexible 5-column classification
 * Example: "Black Steel | ERW | Sch 40, Grade A | Pipe"
 */
export interface MaterialTemplate {
  id: number;
  material_group_id: number;
  title_1?: string | null;  // e.g., "Black Steel"
  title_2?: string | null;  // e.g., "ERW"
  title_3?: string | null;  // e.g., "Sch 40, Grade A"
  title_4?: string | null;  // e.g., "Pipe" or "Elbow 45"
  title_5?: string | null;  // Optional extra classification
  dimension_group_id?: number | null;
  sort_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joins
  material_group?: MaterialGroup;
  dimension_group?: DimensionGroup;
}

/**
 * Dimension Group - Collection of related dimensions
 * Example: "Nominal Pipe", "Copper Pipe", "Wire Way"
 */
export interface DimensionGroup {
  id: number;
  group_code: string;
  group_name: string;
  group_name_th?: string | null;
  display_format: 'table' | 'dropdown';
  sort_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Dimension - Size specifications with type filtering
 * Example: "1/2 inch / 15 mm" (common) or custom dimensions
 */
export interface Dimension {
  id: number;
  dimension_group_id: number;
  size_1?: string | null;      // e.g., "1/2 inch"
  size_2?: string | null;      // e.g., "15 mm"
  size_3?: string | null;      // Optional third dimension
  dimension_type: 'common' | 'custom';  // Filter for standard vs special order
  display_order?: number | null;
  remark?: string | null;      // Notes for custom dimensions
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joins
  dimension_group?: DimensionGroup;
}

/**
 * Material - Actual inventory item (template + dimension)
 * Generated description: "Black Steel | ERW | Sch 40, Grade A | Pipe | 1/2 inch / 15 mm"
 */
export interface Material {
  id: string;  // VARCHAR(50) - e.g., "MAT-1730304562000-0"
  material_code: string;
  material_template_id: number;
  material_group_id?: number | null;
  dimension_id?: number | null;
  material_description: string;  // Auto-generated from template + dimension
  material_description_th?: string | null;
  unit_of_measure: string;
  requires_lot_tracking: boolean;
  requires_serial_tracking: boolean;
  requires_expiry_tracking: boolean;
  shelf_life_days?: number | null;
  barcode?: string | null;
  qr_code?: string | null;
  barcode_type?: string | null;
  primary_picture_url?: string | null;
  picture_gallery_urls?: string | null;
  technical_specs?: any;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  reorder_point?: number | null;
  economic_order_quantity?: number | null;
  standard_cost?: number | null;
  last_purchase_cost?: number | null;
  average_cost?: number | null;
  company_id?: string | null;  // UUID - NULL = JEC, otherwise customer
  project_id?: string | null;   // UUID - NULL = stock item, otherwise project-specific
  is_active: boolean;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
  // Joins
  material_template?: MaterialTemplate;
  dimension?: Dimension;
}

/**
 * Material with all related data for display
 */
export interface MaterialWithDetails extends Material {
  material_template?: MaterialTemplate & {
    material_group?: MaterialGroup;
  };
  dimension?: Dimension & {
    dimension_group?: DimensionGroup;
  };
}

/**
 * Form data for bulk material creation
 */
export interface MaterialCreateInput {
  material_template_id: number;
  dimension_id?: number | null;
  unit_of_measure: string;
  requires_lot_tracking?: boolean;
  requires_serial_tracking?: boolean;
  requires_expiry_tracking?: boolean;
  company_id?: string | null;
  project_id?: string | null;
}

/**
 * RPC function response for dimensions filtered by template
 */
export interface DimensionForTemplate extends Dimension {
  // Inherits all Dimension fields
}

/**
 * Display format for template preview
 */
export interface TemplatePreview {
  template_id: number;
  preview: string;  // e.g., "Black Steel | ERW | Sch 40, Grade A | Pipe"
  has_dimensions: boolean;
}
