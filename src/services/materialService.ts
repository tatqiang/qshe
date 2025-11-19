/**
 * Material Inventory Service
 * 
 * Provides data access for the multi-store material inventory system with 3-step receive workflow.
 * Follows client-side Supabase query patterns with joins and optional offline support.
 */

import { supabase } from '../lib/supabase'
import type {
  Store,
  MaterialCode,
  MaterialInventory,
  MaterialReceive,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MaterialReceiveItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MaterialReceiveArea,
  MaterialTransaction,
  CreateStoreDTO,
  CreateMaterialCodeDTO,
  CreateMaterialReceiveDTO,
  CompleteReceiveDTO,
  AcknowledgeReceiveDTO,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PhotoAttachment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DocumentAttachment
} from '../types/materialSystem'

export const materialService = {
  // ============================================================================
  // STORES
  // ============================================================================
  
  /**
   * Get all active stores for a project
   */
  async getStores(projectId: string): Promise<Store[]> {
    console.log('🔄 materialService.getStores - projectId:', projectId)
    
    // Try simple query first without project join
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('is_main_store', { ascending: false })
      .order('store_name')

    if (error) {
      console.error('❌ materialService.getStores - Error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error details:', error.details)
      console.error('❌ Error hint:', error.hint)
      console.error('❌ Error message:', error.message)
      throw error
    }

    console.log('✅ materialService.getStores - Success, found stores:', data?.length, data)
    return data || []
  },

  /**
   * Get a single store by ID
   */
  async getStoreById(storeId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        project:project_id(id, name, project_code)
      `)
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Error fetching store:', error)
      throw error
    }

    return data
  },

  /**
   * Get all active suppliers with company details
   */
  async getSuppliers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        company:company_id(id, name, name_th)
      `)
      .eq('status', 'active')
      .order('is_preferred', { ascending: false })
      .order('supplier_code')

    if (error) {
      console.error('Error fetching suppliers:', error)
      throw error
    }

    return data || []
  },

  /**
   * Get main store for a project
   */
  async getMainStore(projectId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        project:project_id(id, name, project_code)
      `)
      .eq('project_id', projectId)
      .eq('is_main_store', true)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching main store:', error)
      return null
    }

    return data
  },

  /**
   * Create a new store
   */
  async createStore(dto: CreateStoreDTO): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        ...dto,
        is_main_store: dto.is_main_store ?? false
      }])
      .select(`
        *,
        project:project_id(id, name, project_code)
      `)
      .single()

    if (error) {
      console.error('Error creating store:', error)
      throw error
    }

    return data
  },

  /**
   * Update a store
   */
  async updateStore(storeId: string, updates: Partial<CreateStoreDTO>): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select(`
        *,
        project:project_id(id, name, project_code)
      `)
      .single()

    if (error) {
      console.error('Error updating store:', error)
      throw error
    }

    return data
  },

  /**
   * Deactivate a store
   */
  async deactivateStore(storeId: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: false })
      .eq('id', storeId)

    if (error) {
      console.error('Error deactivating store:', error)
      throw error
    }
  },

  // ============================================================================
  // MATERIAL CODES
  // ============================================================================

  /**
   * Get all active material codes for a project
   */
  async getMaterialCodes(projectId: string): Promise<MaterialCode[]> {
    const { data, error } = await supabase
      .from('material_codes')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('material_code')

    if (error) {
      console.error('Error fetching material codes:', error)
      throw error
    }

    return data || []
  },

  /**
   * Create a new material code
   */
  async createMaterialCode(dto: CreateMaterialCodeDTO): Promise<MaterialCode> {
    const { data, error } = await supabase
      .from('material_codes')
      .insert([dto])
      .select()
      .single()

    if (error) {
      console.error('Error creating material code:', error)
      throw error
    }

    return data
  },

  /**
   * Update a material code
   */
  async updateMaterialCode(codeId: string, updates: Partial<CreateMaterialCodeDTO>): Promise<MaterialCode> {
    const { data, error } = await supabase
      .from('material_codes')
      .update(updates)
      .eq('id', codeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating material code:', error)
      throw error
    }

    return data
  },

  // ============================================================================
  // MATERIAL INVENTORY
  // ============================================================================

  /**
   * Get inventory items for a store
   */
  async getInventoryByStore(storeId: string): Promise<MaterialInventory[]> {
    const { data, error } = await supabase
      .from('material_inventory')
      .select(`
        *,
        store:store_id(*),
        material_code:material_code_id(*),
        material_template:material_template_id(*),
        dimension:dimension_id(*)
      `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('inventory_code')

    if (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }

    return data || []
  },

  /**
   * Get inventory item by ID
   */
  async getInventoryById(inventoryId: string): Promise<MaterialInventory | null> {
    const { data, error } = await supabase
      .from('material_inventory')
      .select(`
        *,
        store:store_id(*),
        material_code:material_code_id(*),
        material_template:material_template_id(*),
        dimension:dimension_id(*)
      `)
      .eq('id', inventoryId)
      .single()

    if (error) {
      console.error('Error fetching inventory item:', error)
      throw error
    }

    return data
  },

  /**
   * Search inventory items
   */
  async searchInventory(projectId: string, searchTerm: string): Promise<MaterialInventory[]> {
    const { data, error } = await supabase
      .from('material_inventory')
      .select(`
        *,
        store:store_id(*),
        material_code:material_code_id(*),
        material_template:material_template_id(*),
        dimension:dimension_id(*)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .or(`inventory_code.ilike.%${searchTerm}%,material_description.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
      .order('inventory_code')
      .limit(50)

    if (error) {
      console.error('Error searching inventory:', error)
      throw error
    }

    return data || []
  },

  // ============================================================================
  // MATERIAL RECEIVES - 3-STEP WORKFLOW
  // ============================================================================

  /**
   * Get material receives for a project
   */
  async getMaterialReceives(projectId: string, filters?: {
    storeId?: string
    status?: string
    fromDate?: string
    toDate?: string
  }): Promise<MaterialReceive[]> {
    let query = supabase
      .from('material_receives')
      .select(`
        *,
        stores:store_id(*),
        material_receive_items(id),
        project:project_id(id, name, project_code)
      `)
      .eq('project_id', projectId)

    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.fromDate) {
      query = query.gte('receive_date', filters.fromDate)
    }
    if (filters?.toDate) {
      query = query.lte('receive_date', filters.toDate)
    }

    const { data, error } = await query.order('receive_date', { ascending: false })

    if (error) {
      console.error('Error fetching material receives:', error)
      throw error
    }

    if (!data) return []

    // Load suppliers separately for receives that have supplier_id
    const receivesWithSuppliers = await Promise.all(
      data.map(async (receive) => {
        if (receive.supplier_id) {
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('*, company:company_id(id, name, name_th)')
            .eq('id', receive.supplier_id)
            .single()
          
          if (supplier) {
            return { ...receive, suppliers: supplier }
          }
        }
        return receive
      })
    )

    return receivesWithSuppliers
  },

  /**
   * Get a single material receive with all details
   */
  async getMaterialReceiveById(receiveId: string): Promise<MaterialReceive | null> {
    // Get the main receive record
    const { data: receive, error: receiveError } = await supabase
      .from('material_receives')
      .select(`
        *,
        stores:store_id(*),
        project:project_id(id, name, project_code)
      `)
      .eq('id', receiveId)
      .single()

    if (receiveError) {
      console.error('Error fetching material receive:', receiveError)
      throw receiveError
    }

    if (!receive) return null

    // Get supplier if exists (separate query since FK might not be set up yet)
    if (receive.supplier_id) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*, company:company_id(id, name, name_th)')
        .eq('id', receive.supplier_id)
        .single()
      
      if (supplier) {
        receive.suppliers = supplier
      }
    }

    // Get receive items
    const { data: items, error: itemsError } = await supabase
      .from('material_receive_items')
      .select(`
        *,
        material_template:material_template_id(*),
        material_code:material_code_id(*),
        dimension:dimension_id(*)
      `)
      .eq('material_receive_id', receiveId)
      .order('line_number')

    if (itemsError) {
      console.error('Error fetching receive items:', itemsError)
    }

    // Get receive areas
    const { data: areas, error: areasError } = await supabase
      .from('material_receive_areas')
      .select(`
        *,
        main_area:main_area_id(id, main_area_name),
        sub_area_1:sub_area_1_id(id, sub_area_1_name),
        sub_area_2:sub_area_2_id(id, sub_area_2_name)
      `)
      .eq('material_receive_id', receiveId)
      .order('display_order')

    if (areasError) {
      console.error('Error fetching receive areas:', areasError)
    }

    return {
      ...receive,
      items: items || [], // Use 'items' to match interface
      areas: areas || [], // Use 'areas' to match interface
      material_receive_items: items || [],
      material_receive_areas: areas || []
    }
  },

  /**
   * Step 5.1: Create and prepare a material receive
   */
  async createMaterialReceive(dto: CreateMaterialReceiveDTO, userId: string): Promise<MaterialReceive> {
    // Generate receive number
    const receiveNumber = await this.generateReceiveNumber(dto.project_id)

    // Create the receive header
    const { data: receive, error: receiveError } = await supabase
      .from('material_receives')
      .insert([{
        receive_number: receiveNumber,
        store_id: dto.store_id,
        project_id: dto.project_id,
        company_id: dto.company_id,
        supplier_id: dto.supplier_id,
        receive_date: dto.receive_date || new Date().toISOString(),
        status: 'prepared',
        prepared_by: userId,
        prepared_at: new Date().toISOString(),
        remarks: dto.remarks,
        created_by: userId
      }])
      .select()
      .single()

    if (receiveError) {
      console.error('Error creating material receive:', receiveError)
      throw receiveError
    }

    // Fetch inventory records to get template_id and other required fields
    const inventoryIds = dto.items.map(item => item.material_inventory_id)
    const { data: inventoryRecords, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('id, material_template_id, material_code_id, dimension_id')
      .in('id', inventoryIds)

    if (inventoryError) {
      console.error('Error fetching inventory records:', inventoryError)
      throw inventoryError
    }

    // Create a map for quick lookup
    const inventoryMap = new Map(inventoryRecords?.map(rec => [rec.id, rec]))

    // Create receive items
    const items = dto.items.map(item => {
      const inventory = inventoryMap.get(item.material_inventory_id)
      if (!inventory) {
        throw new Error(`Inventory record not found for ID: ${item.material_inventory_id}`)
      }
      
      return {
        material_receive_id: receive.id,
        line_number: item.line_number,
        material_inventory_id: item.material_inventory_id,
        material_template_id: inventory.material_template_id,
        material_code_id: inventory.material_code_id,
        dimension_id: inventory.dimension_id,
        material_description: item.material_description,
        specific_detail: item.specific_detail,
        unit_of_measure: item.unit_of_measure,
        prepared_quantity: item.prepared_quantity,
        unit_price: item.unit_price,
        remark: item.remark,
        rejected_quantity: 0,
        inspection_status: 'pending' as const
      }
    })

    const { error: itemsError } = await supabase
      .from('material_receive_items')
      .insert(items)

    if (itemsError) {
      console.error('Error creating receive items:', itemsError)
      throw itemsError
    }

    // Create receive areas if provided
    if (dto.areas && dto.areas.length > 0) {
      const areas = dto.areas.map(area => ({
        material_receive_id: receive.id,
        main_area_id: area.main_area_id || null,
        sub_area_1_id: area.sub_area_1_id || null,
        sub_area_2_id: area.sub_area_2_id || null,
        specific_location: area.specific_location || null,
        display_order: area.display_order,
        created_by: userId
      }))

      const { error: areasError } = await supabase
        .from('material_receive_areas')
        .insert(areas)

      if (areasError) {
        console.error('Error creating receive areas:', areasError)
        // Don't throw - areas are optional
      }
    }

    // Return the complete receive
    return this.getMaterialReceiveById(receive.id) as Promise<MaterialReceive>
  },

  /**
   * Update an existing material receive (Step 1 - Prepare)
   */
  async updateMaterialReceive(receiveId: string, dto: CreateMaterialReceiveDTO, userId: string): Promise<MaterialReceive> {
    // Update the receive header
    const { error: receiveError } = await supabase
      .from('material_receives')
      .update({
        store_id: dto.store_id,
        supplier_id: dto.supplier_id,
        receive_date: dto.receive_date || new Date().toISOString(),
        remarks: dto.remarks,
        updated_at: new Date().toISOString()
      })
      .eq('id', receiveId)

    if (receiveError) {
      console.error('Error updating material receive:', receiveError)
      throw receiveError
    }

    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from('material_receive_items')
      .delete()
      .eq('material_receive_id', receiveId)

    if (deleteItemsError) {
      console.error('Error deleting old receive items:', deleteItemsError)
      throw deleteItemsError
    }

    // Fetch inventory records to get template_id and other required fields
    const inventoryIds = dto.items.map(item => item.material_inventory_id)
    const { data: inventoryRecords, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('id, material_template_id, material_code_id, dimension_id')
      .in('id', inventoryIds)

    if (inventoryError) {
      console.error('Error fetching inventory records:', inventoryError)
      throw inventoryError
    }

    // Create a map for quick lookup
    const inventoryMap = new Map(inventoryRecords?.map(rec => [rec.id, rec]))

    // Create new receive items
    const items = dto.items.map(item => {
      const inventory = inventoryMap.get(item.material_inventory_id)
      if (!inventory) {
        throw new Error(`Inventory record not found for ID: ${item.material_inventory_id}`)
      }
      
      return {
        material_receive_id: receiveId,
        line_number: item.line_number,
        material_inventory_id: item.material_inventory_id,
        material_template_id: inventory.material_template_id,
        material_code_id: inventory.material_code_id,
        dimension_id: inventory.dimension_id,
        material_description: item.material_description,
        specific_detail: item.specific_detail,
        unit_of_measure: item.unit_of_measure,
        prepared_quantity: item.prepared_quantity,
        unit_price: item.unit_price,
        remark: item.remark,
        rejected_quantity: 0,
        inspection_status: 'pending' as const
      }
    })

    const { error: itemsError } = await supabase
      .from('material_receive_items')
      .insert(items)

    if (itemsError) {
      console.error('Error creating receive items:', itemsError)
      throw itemsError
    }

    // Delete existing areas
    const { error: deleteAreasError } = await supabase
      .from('material_receive_areas')
      .delete()
      .eq('material_receive_id', receiveId)

    if (deleteAreasError) {
      console.error('Error deleting old receive areas:', deleteAreasError)
      // Don't throw - areas are optional
    }

    // Create new receive areas if provided
    if (dto.areas && dto.areas.length > 0) {
      const areas = dto.areas.map(area => ({
        material_receive_id: receiveId,
        main_area_id: area.main_area_id || null,
        sub_area_1_id: area.sub_area_1_id || null,
        sub_area_2_id: area.sub_area_2_id || null,
        specific_location: area.specific_location || null,
        display_order: area.display_order,
        created_by: userId
      }))

      const { error: areasError } = await supabase
        .from('material_receive_areas')
        .insert(areas)

      if (areasError) {
        console.error('Error creating receive areas:', areasError)
        // Don't throw - areas are optional
      }
    }

    // Return the complete receive
    return this.getMaterialReceiveById(receiveId) as Promise<MaterialReceive>
  },

  /**
   * Step 5.2: Complete receive check
   */
  async completeReceiveCheck(receiveId: string, dto: CompleteReceiveDTO): Promise<MaterialReceive> {
    // Get the receive to check prepared quantities
    const receive = await this.getMaterialReceiveById(receiveId)
    if (!receive) throw new Error('Receive not found')

    // Determine status based on received vs prepared quantities
    let status = 'received_all'
    const hasAnyRejected = dto.items.some(item => item.rejected_quantity > 0)
    const allFullyRejected = dto.items.every(item => {
      const preparedItem = receive.items?.find(i => i.id === item.id)
      return preparedItem && item.rejected_quantity === item.received_quantity
    })
    const hasQuantityDifference = dto.items.some(item => {
      const preparedItem = receive.items?.find(i => i.id === item.id)
      return preparedItem && (item.received_quantity !== preparedItem.prepared_quantity || item.rejected_quantity > 0)
    })

    if (allFullyRejected) {
      status = 'rejected'
    } else if (hasQuantityDifference || hasAnyRejected) {
      status = 'received_with_note'
    }

    const { error: receiveError } = await supabase
      .from('material_receives')
      .update({
        status,
        received_by: dto.received_by,
        received_at: new Date().toISOString(),
        received_completed_at: new Date().toISOString(),
        received_photos: dto.received_photos,
        received_notes: dto.received_notes
      })
      .eq('id', receiveId)

    if (receiveError) {
      console.error('Error updating receive:', receiveError)
      throw receiveError
    }

    // Update receive items (no inspection_status or inspection_notes)
    for (const item of dto.items) {
      const { error: itemError } = await supabase
        .from('material_receive_items')
        .update({
          received_quantity: item.received_quantity,
          rejected_quantity: item.rejected_quantity
        })
        .eq('id', item.id)

      if (itemError) {
        console.error('Error updating receive item:', itemError)
        throw itemError
      }
    }

    return this.getMaterialReceiveById(receiveId) as Promise<MaterialReceive>
  },

  /**
   * Step 5.3: Acknowledge receive and update inventory
   * OPTIMIZED: Parallel processing for inventory updates
   */
  async acknowledgeReceive(receiveId: string, dto: AcknowledgeReceiveDTO): Promise<MaterialReceive> {
    // Update receive header
    const { error: receiveError } = await supabase
      .from('material_receives')
      .update({
        acknowledged_by: dto.acknowledged_by,
        acknowledged_at: dto.acknowledged_at || new Date().toISOString(),
        acknowledged_photos: dto.acknowledged_photos,
        acknowledged_notes: dto.acknowledged_notes,
        is_locked: true
      })
      .eq('id', receiveId)

    if (receiveError) {
      console.error('Error acknowledging receive:', receiveError)
      throw receiveError
    }

    // Get the receive details to update inventory
    const receive = await this.getMaterialReceiveById(receiveId)
    if (!receive || !receive.items || receive.items.length === 0) {
      throw new Error('Receive not found or has no items')
    }

    // ⚡ PERFORMANCE FIX: Process all items in parallel instead of sequentially
    const updatePromises = receive.items
      .filter(item => {
        const acceptedQty = (item.received_quantity || 0) - (item.rejected_quantity || 0)
        return acceptedQty > 0
      })
      .map(item => {
        const acceptedQty = (item.received_quantity || 0) - (item.rejected_quantity || 0)
        return this.updateInventoryFromReceive(receive, item, dto.acknowledged_by, acceptedQty)
      })

    // Wait for all inventory updates to complete in parallel
    await Promise.all(updatePromises)

    return this.getMaterialReceiveById(receiveId) as Promise<MaterialReceive>
  },

  /**
   * Helper: Update inventory when receive is acknowledged
   */
  async updateInventoryFromReceive(
    receive: MaterialReceive,
    item: any,
    acknowledgedBy: string,
    acceptedQuantity: number
  ): Promise<void> {
    // Check if inventory item exists
    const { data: existing, error: searchError } = await supabase
      .from('material_inventory')
      .select('id, current_quantity, average_cost')
      .eq('store_id', receive.store_id)
      .eq('material_template_id', item.material_template_id)
      .eq('dimension_id', item.dimension_id || null)
      .eq('is_active', true)
      .maybeSingle()

    if (searchError) {
      console.error('Error searching inventory:', searchError)
      throw searchError
    }

    if (existing) {
      // Update existing inventory
      const newQuantity = existing.current_quantity + acceptedQuantity
      const newCost = item.unit_price
        ? ((existing.average_cost * existing.current_quantity) + (item.unit_price * acceptedQuantity)) / newQuantity
        : existing.average_cost

      const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
          current_quantity: newQuantity,
          average_cost: newCost,
          last_purchase_cost: item.unit_price
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating inventory:', updateError)
        throw updateError
      }

      // Link item to inventory
      await supabase
        .from('material_receive_items')
        .update({ material_inventory_id: existing.id })
        .eq('id', item.id)

      // Create transaction record
      await this.createTransaction({
        material_inventory_id: existing.id,
        store_id: receive.store_id,
        project_id: receive.project_id,
        transaction_type: 'receive',
        transaction_date: new Date().toISOString(),
        quantity_change: acceptedQuantity,
        quantity_before: existing.current_quantity,
        quantity_after: newQuantity,
        unit_cost: item.unit_price || 0,
        reference_type: 'material_receive',
        reference_id: receive.id,
        reference_number: receive.receive_number,
        lot_number: item.lot_number,
        performed_by: acknowledgedBy
      })
    } else {
      // Create new inventory item
      const inventoryCode = await this.generateInventoryCode(receive.store_id)

      const { data: newInventory, error: createError } = await supabase
        .from('material_inventory')
        .insert([{
          inventory_code: inventoryCode,
          material_template_id: item.material_template_id,
          material_code_id: item.material_code_id,
          store_id: receive.store_id,
          project_id: receive.project_id,
          company_id: receive.company_id,
          dimension_id: item.dimension_id,
          material_description: item.material_description,
          specific_detail: item.specific_detail,
          unit_of_measure: item.unit_of_measure,
          current_quantity: acceptedQuantity,
          reserved_quantity: 0,
          min_stock_level: 0,
          average_cost: item.unit_price || 0,
          last_purchase_cost: item.unit_price,
          requires_lot_tracking: false,
          requires_serial_tracking: false,
          requires_expiry_tracking: false,
          bin_location: item.bin_location,
          rack_location: item.rack_location,
          created_by: acknowledgedBy
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating inventory:', createError)
        throw createError
      }

      // Link item to new inventory
      await supabase
        .from('material_receive_items')
        .update({ material_inventory_id: newInventory.id })
        .eq('id', item.id)

      // Create transaction record
      await this.createTransaction({
        material_inventory_id: newInventory.id,
        store_id: receive.store_id,
        project_id: receive.project_id,
        transaction_type: 'receive',
        transaction_date: new Date().toISOString(),
        quantity_change: acceptedQuantity,
        quantity_before: 0,
        quantity_after: acceptedQuantity,
        unit_cost: item.unit_price || 0,
        reference_type: 'material_receive',
        reference_id: receive.id,
        reference_number: receive.receive_number,
        lot_number: item.lot_number,
        performed_by: acknowledgedBy
      })
    }
  },

  /**
   * Create a material transaction record
   */
  async createTransaction(transaction: Omit<MaterialTransaction, 'id' | 'transaction_number' | 'created_at'>): Promise<void> {
    const transactionNumber = await this.generateTransactionNumber(transaction.project_id)

    const { error } = await supabase
      .from('material_transactions')
      .insert([{
        transaction_number: transactionNumber,
        ...transaction
      }])

    if (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  },

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Generate unique receive number
   */
  async generateReceiveNumber(projectId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const prefix = `MR-${year}${month}`

    // Add a random component to avoid collisions in rapid succession
    const timestamp = Date.now().toString().slice(-4)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    const { count, error } = await supabase
      .from('material_receives')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .like('receive_number', `${prefix}%`)

    if (error) {
      console.error('Error counting receives:', error)
    }

    const sequence = (count || 0) + 1
    return `${prefix}-${String(sequence).padStart(4, '0')}-${timestamp}${random}`
  },

  /**
   * Generate unique inventory code
   */
  async generateInventoryCode(storeId: string): Promise<string> {
    const { data: store } = await supabase
      .from('stores')
      .select('store_code')
      .eq('id', storeId)
      .single()

    const storeCode = store?.store_code || 'STORE'

    const { count, error } = await supabase
      .from('material_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)

    if (error) {
      console.error('Error counting inventory:', error)
    }

    const sequence = (count || 0) + 1
    return `${storeCode}-${String(sequence).padStart(5, '0')}`
  },

  /**
   * Generate unique transaction number
   */
  async generateTransactionNumber(projectId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const prefix = `TXN-${year}${month}`

    // Add timestamp and random component to avoid collisions in rapid succession
    const timestamp = Date.now().toString().slice(-4)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

    const { count, error } = await supabase
      .from('material_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .like('transaction_number', `${prefix}%`)

    if (error) {
      console.error('Error counting transactions:', error)
    }

    const sequence = (count || 0) + 1
    return `${prefix}-${String(sequence).padStart(5, '0')}-${timestamp}${random}`
  }
}
