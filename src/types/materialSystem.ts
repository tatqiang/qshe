// ============================================
// MATERIAL SYSTEM TYPES
// Multi-column strategy with 5 flexible title fields
// ============================================

/**
 * Material Group - Top-level categorization
 * Example: "Pipes & Fittings", "Valves and Accessories"
 */
export interface MaterialGroup {
  id: number
  group_code: string
  group_name: string
  group_name_th?: string | null
  description?: string | null
  sort_order?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Material Template - Flexible 5-column classification
 * Example: "Black Steel | ERW | Sch 40, Grade A | Pipe"
 */
export interface MaterialTemplate {
  id: number
  material_group_id: number | null
  title_1?: string | null // e.g., "Black Steel"
  title_2?: string | null // e.g., "ERW"
  title_3?: string | null // e.g., "Sch 40, Grade A"
  title_4?: string | null // e.g., "Pipe" or "Elbow 45"
  title_5?: string | null // Optional extra classification
  title_1_th?: string | null // Thai translation of title_1
  title_2_th?: string | null // Thai translation of title_2
  title_3_th?: string | null // Thai translation of title_3
  title_4_th?: string | null // Thai translation of title_4
  title_5_th?: string | null // Thai translation of title_5
  dimension_group_id?: number | null
  technical_spec_template?: any
  sort_order?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  // Joins
  material_group?: MaterialGroup
  dimension_group?: DimensionGroup
}

/**
 * Dimension Group - Collection of related dimensions
 * Example: "Nominal Pipe", "Copper Pipe", "Wire Way"
 */
export interface DimensionGroup {
  id: number
  group_code: string
  group_name: string
  group_name_th?: string | null
  display_format: 'table' | 'dropdown'
  sort_order?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Dimension - Size specifications with type filtering
 * Example: "1/2 inch / 15 mm" (common) or custom dimensions
 */
export interface Dimension {
  id: number
  dimension_group_id: number | null
  size_1?: string | null // e.g., "1/2 inch"
  size_2?: string | null // e.g., "15 mm"
  size_3?: string | null // Optional third dimension
  dimension_type: 'common' | 'custom' // Filter for standard vs special order
  display_order?: number | null
  remark?: string | null // Notes for custom dimensions
  is_active: boolean
  created_at?: string
  updated_at?: string
  // Joins
  dimension_group?: DimensionGroup
}

/**
 * Brand - Product brands for material inventory
 */
export interface Brand {
  id: string // UUID
  brand_title: string
  brand_title_th?: string | null
  note?: string | null
  is_active: boolean
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Material - Actual inventory item (template + dimension)
 * Generated description: "Black Steel | ERW | Sch 40, Grade A | Pipe | 1/2 inch / 15 mm"
 */
export interface Material {
  id: string // VARCHAR(50) - e.g., "MAT-1730304562000-0"
  material_code: string
  material_template_id: number
  material_group_id?: number | null
  dimension_id?: number | null
  material_description: string // Auto-generated from template + dimension
  material_description_th?: string | null
  unit_of_measure: string
  requires_lot_tracking: boolean
  requires_serial_tracking: boolean
  requires_expiry_tracking: boolean
  shelf_life_days?: number | null
  barcode?: string | null
  qr_code?: string | null
  primary_picture_url?: string | null
  technical_specs?: any
  min_stock_level?: number | null
  max_stock_level?: number | null
  reorder_point?: number | null
  standard_cost?: number | null
  company_id?: string | null // UUID - NULL = JEC, otherwise customer
  project_id?: string | null // UUID - NULL = stock item, otherwise project-specific
  is_active: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  // Joins
  material_template?: MaterialTemplate
  dimension?: Dimension
}

/**
 * Material with all related data for display
 */
export interface MaterialWithDetails extends Material {
  material_template?: MaterialTemplate & {
    material_group?: MaterialGroup
  }
  dimension?: Dimension & {
    dimension_group?: DimensionGroup
  }
}

/**
 * Form data for bulk material creation
 */
export interface MaterialCreateInput {
  material_template_id: number
  dimension_id?: number | null
  unit_of_measure: string
  requires_lot_tracking?: boolean
  requires_serial_tracking?: boolean
  requires_expiry_tracking?: boolean
  company_id?: string | null
  project_id?: string | null
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
  template_id: number
  preview: string // e.g., "Black Steel | ERW | Sch 40, Grade A | Pipe"
  has_dimensions: boolean
}

// ============================================================================
// MATERIAL INVENTORY SYSTEM - MULTI-STORE WITH 3-STEP RECEIVE WORKFLOW
// ============================================================================

/**
 * Store - Physical storage locations within projects
 */
export type StoreType = 'warehouse' | 'site_storage' | 'tool_room' | 'consumables_store'

export interface Store {
  id: string
  store_code: string
  store_name: string
  store_name_th?: string
  project_id: string
  company_id?: string
  store_type: StoreType
  location_address?: string
  store_manager_id?: string
  contact_phone?: string
  is_main_store: boolean
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  
  // Joined data
  project?: {
    id: string
    name: string
    project_code: string
  }
}

/**
 * Material Code - User-defined project-specific codes
 */
export interface MaterialCode {
  id: string
  project_id: string
  material_code: string
  description?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Material Inventory - Actual physical materials in stores
 */
export interface MaterialInventory {
  id: string
  inventory_code: string
  material_template_id: number
  material_code_id?: string
  store_id: string
  project_id: string
  company_id?: string
  dimension_id?: number
  
  material_description: string
  material_description_th?: string
  specific_detail?: string
  technical_specs?: Record<string, any>
  
  unit_of_measure: string
  current_quantity: number
  reserved_quantity: number
  available_quantity: number // Generated column
  
  min_stock_level: number
  max_stock_level?: number
  reorder_point?: number
  
  average_cost: number
  last_purchase_cost?: number
  
  requires_lot_tracking: boolean
  requires_serial_tracking: boolean
  requires_expiry_tracking: boolean
  shelf_life_days?: number
  
  barcode?: string
  qr_code?: string
  primary_picture_url?: string
  
  bin_location?: string
  rack_location?: string
  
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  
  // Joined data
  store?: Store
  material_code?: MaterialCode
  material_template?: MaterialTemplate
  dimension?: Dimension
}

/**
 * Material Receive - 3-Step Workflow
 */
export type MaterialReceiveStatus = 'prepared' | 'received_all' | 'received_with_note' | 'rejected'
export type InspectionStatus = 'pending' | 'passed' | 'failed'
export type TransactionType = 'receive' | 'issue' | 'transfer' | 'adjustment' | 'return'

export interface PhotoAttachment {
  url: string
  caption?: string
  timestamp: string
  uploaded_by?: string
}

export interface DocumentAttachment {
  url: string
  filename: string
  type: 'camera' | 'gallery'
  timestamp: string
  caption?: string
}

export interface MaterialReceive {
  id: string
  receive_number: string
  store_id: string
  project_id: string
  company_id?: string
  
  purchase_order_id?: string
  supplier_id?: string
  supplier_invoice_number?: string
  delivery_note_number?: string
  
  receive_date: string
  invoice_date?: string
  
  status: MaterialReceiveStatus
  
  // Step 5.1: Prepare
  prepared_by?: string
  prepared_at?: string
  prepared_photos?: PhotoAttachment[]
  
  // Step 5.2: Receive Check
  received_by?: string
  received_at?: string
  received_completed_at?: string
  received_photos?: PhotoAttachment[]
  received_notes?: string
  
  // Step 5.3: Acknowledge
  acknowledged_by?: string
  acknowledged_at?: string
  acknowledged_photos?: PhotoAttachment[]
  acknowledged_notes?: string
  
  // Attachments
  delivery_order_attachments?: DocumentAttachment[]
  purchase_order_attachments?: DocumentAttachment[]
  other_attachments?: DocumentAttachment[]
  
  remarks?: string
  rejection_reason?: string
  
  is_locked: boolean
  
  created_by?: string
  created_at: string
  updated_at: string
  
  // Joined data
  store?: Store
  stores?: Store // Alias for compatibility
  supplier?: {
    id: string
    name: string
    code?: string
  }
  suppliers?: { // Alias for compatibility
    id: string
    name: string
    code?: string
  }
  project?: {
    id: string
    name: string
    project_code: string
  }
  material_receive_items?: MaterialReceiveItem[]
  items?: MaterialReceiveItem[]
  material_receive_areas?: MaterialReceiveArea[]
  areas?: MaterialReceiveArea[]
  
  // Computed
  can_edit?: boolean
}

export interface MaterialReceiveItem {
  id: string
  material_receive_id: string
  line_number: number
  
  material_template_id: number
  material_code_id?: string
  dimension_id?: number
  material_description: string
  specific_detail?: string
  
  unit_of_measure: string
  unit_of_measure_th?: string
  ordered_quantity?: number
  
  prepared_quantity: number
  received_quantity?: number
  rejected_quantity: number
  accepted_quantity: number // Generated
  
  unit_price?: number
  total_price: number // Generated
  
  lot_number?: string
  serial_numbers?: string[]
  manufacture_date?: string
  expiry_date?: string
  
  inspection_status: InspectionStatus
  inspection_notes?: string
  
  bin_location?: string
  rack_location?: string
  
  remark?: string
  
  material_inventory_id?: string
  
  created_at: string
  updated_at: string
  
  // Joined data
  material_template?: MaterialTemplate
  material_code?: MaterialCode
  dimension?: Dimension
}

export interface MaterialReceiveArea {
  id: string
  material_receive_id: string
  
  main_area_id?: string
  sub_area_1_id?: string
  sub_area_2_id?: string
  specific_location?: string
  
  display_order: number
  
  created_by?: string
  created_at: string
  updated_at: string
  
  // Joined data
  main_area?: {
    id: string
    main_area_name: string
  }
  sub_area_1?: {
    id: string
    sub_area_1_name: string
  }
  sub_area_2?: {
    id: string
    sub_area_2_name: string
  }
}

export interface MaterialTransaction {
  id: string
  transaction_number: string
  material_inventory_id: string
  store_id: string
  project_id: string
  
  transaction_type: TransactionType
  transaction_date: string
  
  quantity_change: number
  quantity_before: number
  quantity_after: number
  
  unit_cost?: number
  total_cost?: number // Generated column - calculated automatically in DB
  
  reference_type?: string
  reference_id?: string
  reference_number?: string
  
  lot_number?: string
  serial_number?: string
  
  from_store_id?: string
  to_store_id?: string
  
  performed_by?: string
  approved_by?: string
  
  remarks?: string
  
  created_at: string
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateStoreDTO {
  store_code: string
  store_name: string
  store_name_th?: string
  project_id: string
  company_id?: string
  store_type: StoreType
  location_address?: string
  store_manager_id?: string
  contact_phone?: string
  is_main_store?: boolean
}

export interface CreateMaterialCodeDTO {
  project_id: string
  material_code: string
  description?: string
}

export interface CreateMaterialReceiveDTO {
  store_id: string
  project_id: string
  company_id?: string
  supplier_id?: string
  receive_date?: string
  remarks?: string
  items: CreateMaterialReceiveItemDTO[]
  areas?: CreateMaterialReceiveAreaDTO[]
}

export interface CreateMaterialReceiveItemDTO {
  line_number: number
  material_inventory_id: string  // Changed from material_template_id
  material_code?: string  // For display purposes
  material_description: string
  specific_detail?: string
  unit_of_measure: string
  current_quantity?: number  // For display purposes
  prepared_quantity: number
  unit_price?: number
  remark?: string
}

export interface CreateMaterialReceiveAreaDTO {
  main_area_id?: string
  sub_area_1_id?: string
  sub_area_2_id?: string
  specific_location?: string
  display_order: number
}

export interface CompleteReceiveDTO {
  received_by: string
  received_notes?: string
  received_photos?: PhotoAttachment[]
  items: {
    id: string
    received_quantity: number
    rejected_quantity: number
    inspection_status: InspectionStatus
    inspection_notes?: string
  }[]
}

export interface AcknowledgeReceiveDTO {
  acknowledged_by: string
  acknowledged_at?: string
  acknowledged_notes?: string
  acknowledged_photos?: PhotoAttachment[]
}

// ============================================
// ADD TO INVENTORY - Separate from Receive
// ============================================

export interface AddToInventoryItem {
  material_template_id: number
  dimension_ids: number[]
  store_id: string // UUID
  material_code_id?: string | null
  brand_id?: string | null
  specific_detail?: string | null
  unit_of_measure?: string | null
}
