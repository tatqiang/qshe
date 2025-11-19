import { supabase } from '@/lib/supabase'
import { offlineDB } from '@/utils/offlineDB'
import type { Patrol, PatrolPhoto, CorrectiveAction, RiskCalculation } from '@/types/patrol'

/**
 * Calculate risk score and level from 4x4 matrix
 */
function calculateRisk(likelihood: number, severity: number): RiskCalculation {
  const score = likelihood * severity
  
  let risk_level: RiskCalculation['risk_level']
  let recommended_action: RiskCalculation['recommended_action']
  
  if (score <= 3) {
    risk_level = 'low'
    recommended_action = 'monitor'
  } else if (score <= 8) {
    risk_level = 'medium'
    recommended_action = 'control'
  } else if (score <= 12) {
    risk_level = 'high'
    recommended_action = 'mitigate'
  } else {
    risk_level = 'extremely_high'
    recommended_action = 'stop_work'
  }
  
  return { score, risk_level, recommended_action }
}

/**
 * Generate patrol number
 */
function generatePatrolNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `PAT-${year}${month}-${timestamp}`
}

export const patrolService = {
  /**
   * Get all patrols with offline support
   */
  async getAll(): Promise<Patrol[]> {
    try {
      // Load patrols with area names joined
      const { data: patrols, error: patrolError } = await supabase
        .from('safety_patrols')
        .select(`
          *,
          main_areas:main_area_id(main_area_name),
          sub_areas_1:sub_area_1_id(sub_area_1_name),
          sub_areas_2:sub_area_2_id(sub_area_2_name)
        `)
        .order('patrol_date', { ascending: false })
      
      if (patrolError) throw patrolError

      if (!patrols || patrols.length === 0) {
        console.log('✅ Patrols loaded from server: 0')
        return []
      }

      // Get unique IDs
      const projectIds = [...new Set(patrols.filter((p: any) => p.project_id).map((p: any) => p.project_id))]
      const userIds = [...new Set(patrols.filter((p: any) => p.created_by).map((p: any) => p.created_by))]
      const patrolIds = patrols.map((p: any) => p.id)
      
      // Load referenced projects
      let projectMap: Record<string, any> = {}
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .in('id', projectIds)
        
        if (projects) {
          projects.forEach(p => {
            projectMap[p.id] = p
          })
        }
      }

      // Load users (inspectors)
      let userMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        
        if (users) {
          users.forEach(u => {
            userMap[u.id] = u
          })
        }
      }

      // Load risk categories and items for patrols
      const { data: patrolRiskCategories } = await supabase
        .from('patrol_risk_categories')
        .select('patrol_id, risk_category_id')
        .in('patrol_id', patrolIds)

      const { data: patrolRiskItems } = await supabase
        .from('patrol_risk_items')
        .select('patrol_id, risk_item_id')
        .in('patrol_id', patrolIds)

      // Map risk categories/items to patrols
      const riskCategoryMap: Record<string, string[]> = {}
      const riskItemMap: Record<string, string[]> = {}

      patrolRiskCategories?.forEach((prc: any) => {
        if (!riskCategoryMap[prc.patrol_id]) riskCategoryMap[prc.patrol_id] = []
        riskCategoryMap[prc.patrol_id]!.push(prc.risk_category_id)
      })

      patrolRiskItems?.forEach((pri: any) => {
        if (!riskItemMap[pri.patrol_id]) riskItemMap[pri.patrol_id] = []
        riskItemMap[pri.patrol_id]!.push(pri.risk_item_id)
      })

      // Enrich patrol data
      const enrichedPatrols = patrols.map((patrol: any) => ({
        ...patrol,
        project: projectMap[patrol.project_id] || null,
        inspector: userMap[patrol.created_by] || null,
        risk_category_ids: riskCategoryMap[patrol.id] || [],
        risk_item_ids: riskItemMap[patrol.id] || []
      }))

      // Store in offline DB
      await offlineDB.ensureDB()
      await offlineDB.clear('patrols')
      for (const patrol of enrichedPatrols) {
        await offlineDB.put('patrols', patrol)
      }

      console.log('✅ Patrols loaded from server:', enrichedPatrols.length)
      return enrichedPatrols
    } catch (error) {
      console.warn('⚠️ Network unavailable - Loading from offline storage:', error)
      const offlineData = await offlineDB.getAll('patrols')
      console.log('📦 Patrols loaded from IndexedDB:', offlineData.length)
      return offlineData as Patrol[]
    }
  },

  /**
   * Get patrol by ID
   */
  async getById(id: string): Promise<Patrol | null> {
    try {
      const { data, error } = await supabase
        .from('safety_patrols')
        .select(`
          *,
          main_areas:main_area_id(main_area_name),
          sub_areas_1:sub_area_1_id(sub_area_1_name),
          sub_areas_2:sub_area_2_id(sub_area_2_name)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error

      // Get project info if project_id exists
      let project = null
      if (data.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .eq('id', data.project_id)
          .single()
        project = projectData
      }

      // Get creator/inspector info
      let inspector = null
      if (data.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', data.created_by)
          .single()
        inspector = userData
      }
      
      // Load risk categories and items
      const { data: categories } = await supabase
        .from('patrol_risk_categories')
        .select('risk_category_id')
        .eq('patrol_id', id)

      const { data: items } = await supabase
        .from('patrol_risk_items')
        .select('risk_item_id')
        .eq('patrol_id', id)

      return {
        ...data,
        project,
        inspector,
        creator_name: inspector ? `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || inspector.email || 'Unknown' : 'Unknown',
        risk_category_ids: categories?.map((c: any) => c.risk_category_id) || [],
        risk_item_ids: items?.map((i: any) => i.risk_item_id) || []
      }
    } catch (error) {
      console.warn('Online fetch failed, using offline data:', error)
      return await offlineDB.get('patrols', id) as Patrol | null
    }
  },

  /**
   * Create new patrol
   */
  async create(formData: any, userId: string): Promise<Patrol> {
    const patrolNumber = generatePatrolNumber()
    const riskCalc = calculateRisk(formData.likelihood, formData.severity)

    const patrolData: Partial<Patrol> = {
      patrol_number: patrolNumber,
      title: formData.title,
      description: formData.description,
      project_id: formData.project_id,
      patrol_date: formData.patrol_date,
      patrol_type: formData.patrol_type,
      main_area: formData.main_area,
      main_area_id: formData.main_area_id,
      sub_area_1: formData.sub_area_1,
      sub_area_1_id: formData.sub_area_1_id,
      sub_area_2: formData.sub_area_2,
      sub_area_2_id: formData.sub_area_2_id,
      specific_location: formData.specific_location,
      likelihood: formData.likelihood,
      severity: formData.severity,
      risk_level: riskCalc.risk_level,
      remark: formData.remark,
      immediate_hazard: formData.immediate_hazard || false,
      status: 'open',
      created_by: userId
    }

    try {
      const { data: patrol, error } = await supabase
        .from('safety_patrols')
        .insert([patrolData])
        .select()
        .single()

      if (error) throw error

      // Insert risk categories and items if provided
      if (formData.risk_categories?.length > 0) {
        await supabase.from('patrol_risk_categories').insert(
          formData.risk_categories.map((cat_id: string) => ({
            patrol_id: patrol.id,
            risk_category_id: cat_id
          }))
        )
      }

      if (formData.risk_items?.length > 0) {
        await supabase.from('patrol_risk_items').insert(
          formData.risk_items.map((item_id: string) => ({
            patrol_id: patrol.id,
            risk_item_id: item_id
          }))
        )
      }

      console.log('✅ Patrol created:', patrol.patrol_number)
      return patrol
    } catch (error) {
      console.error('❌ Create patrol error:', error)
      throw error
    }
  },

  /**
   * Update patrol
   */
  async update(id: string, updates: Partial<Patrol>): Promise<Patrol> {
    try {
      // Recalculate risk if likelihood or severity changed
      if (updates.likelihood !== undefined && updates.severity !== undefined) {
        const riskCalc = calculateRisk(updates.likelihood, updates.severity)
        updates.risk_level = riskCalc.risk_level
      }

      const { data, error } = await supabase
        .from('safety_patrols')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      await offlineDB.put('patrols', data)
      console.log('✅ Patrol updated:', data.patrol_number)
      return data
    } catch (error) {
      console.error('❌ Update patrol error:', error)
      throw error
    }
  },

  /**
   * Delete patrol
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('safety_patrols')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await offlineDB.delete('patrols', id)
      return true
    } catch (error) {
      console.error('❌ Delete patrol error:', error)
      throw error
    }
  },

  /**
   * Get patrol photos
   */
  async getPhotos(patrolId: string): Promise<PatrolPhoto[]> {
    const { data, error } = await supabase
      .from('patrol_photos')
      .select('*')
      .eq('patrol_id', patrolId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Generate public URLs for photos that only have file_path
    const photosWithUrls = (data || []).map(photo => {
      // If photo already has a url, use it
      if (photo.url) {
        return photo
      }
      
      // If file_path looks like a storage path (not a full URL), generate public URL
      if (photo.file_path && !photo.file_path.startsWith('http')) {
        const { data: { publicUrl } } = supabase.storage
          .from('qshe')
          .getPublicUrl(photo.file_path)
        
        return {
          ...photo,
          url: publicUrl
        }
      }
      
      // If file_path is already a URL, use it as url
      return {
        ...photo,
        url: photo.file_path
      }
    })

    return photosWithUrls
  },

  /**
   * Delete patrol photos
   */
  async deletePatrolPhotos(photoIds: string[]): Promise<void> {
    for (const photoId of photoIds) {
      const { error } = await supabase
        .from('patrol_photos')
        .delete()
        .eq('id', photoId)
      
      if (error) throw error
    }
  },

  /**
   * Create corrective action
   */
  async createAction(patrolId: string, formData: any, userId: string): Promise<CorrectiveAction> {
    // Generate action number
    const actionNumber = `CA-${Date.now().toString().slice(-8)}`
    
    const actionData: Partial<CorrectiveAction> = {
      patrol_id: patrolId,
      action_number: actionNumber,
      action_type: formData.action_type,
      description: formData.action_description || formData.description,
      assigned_to: formData.assigned_to || userId,
      due_date: formData.due_date,
      status: 'assigned',
      created_by: userId
    }

    const { data, error } = await supabase
      .from('corrective_actions')
      .insert([actionData])
      .select()
      .single()
    
    if (error) throw error

    // Upload photos if any
    if (formData.photos && formData.photos.length > 0) {
      await this.uploadActionPhotos(patrolId, data.id, formData.photos, userId)
    }

    return data
  },

  /**
   * Get corrective actions for patrol
   */
  async getActions(patrolId: string): Promise<any[]> {
    const { data: actions, error } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('patrol_id', patrolId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // For each action, fetch related data
    const actionsWithDetails = await Promise.all(
      (actions || []).map(async (action) => {
        // Get assigned user info
        let assigned_to_name = 'Unknown'
        if (action.assigned_to) {
          const { data: assignedUser } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', action.assigned_to)
            .single()
          assigned_to_name = assignedUser 
            ? `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() || assignedUser.email || 'Unknown'
            : 'Unknown'
        }

        // Get verifier info
        let verified_by_name = null
        if (action.verified_by) {
          const { data: verifier } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', action.verified_by)
            .single()
          verified_by_name = verifier 
            ? `${verifier.first_name || ''} ${verifier.last_name || ''}`.trim() || verifier.email || 'Unknown'
            : 'Unknown'
        }

        // Get action photos (from corrective_action_photos table)
        // First check ALL photos for this action
        const { data: allPhotos } = await supabase
          .from('corrective_action_photos')
          .select('*')
          .eq('action_id', action.id)
        
        console.log(`🔍 ALL photos for action ${action.id}:`, allPhotos)
        
        const { data: photos, error: photosError } = await supabase
          .from('corrective_action_photos')
          .select('*')
          .eq('action_id', action.id)
          .eq('photo_type', 'evidence')
        
        console.log(`🔍 Querying photos for action ${action.id}, photo_type='evidence':`, photos, photosError)
        
        // Get verification photos (using 'after' photo_type)
        const { data: verificationPhotos, error: verificationPhotosError } = await supabase
          .from('corrective_action_photos')
          .select('*')
          .eq('action_id', action.id)
          .eq('photo_type', 'after')
        
        console.log(`🔍 Querying verification photos for action ${action.id}, photo_type='after':`, verificationPhotos, verificationPhotosError)

        // Generate URLs for photos (corrective_action_photos uses r2_url)
        const photosWithUrls = (photos || []).map(photo => {
          // corrective_action_photos has r2_url field
          if (photo.r2_url) return { ...photo, url: photo.r2_url }
          if (photo.url) return photo
          if (photo.file_path && !photo.file_path.startsWith('http')) {
            const { data: { publicUrl } } = supabase.storage
              .from('qshe')
              .getPublicUrl(photo.file_path)
            return { ...photo, url: publicUrl }
          }
          return { ...photo, url: photo.file_path }
        })

        const verificationPhotosWithUrls = (verificationPhotos || []).map(photo => {
          // corrective_action_photos has r2_url field
          if (photo.r2_url) return { ...photo, url: photo.r2_url }
          if (photo.url) return photo
          if (photo.file_path && !photo.file_path.startsWith('http')) {
            const { data: { publicUrl } } = supabase.storage
              .from('qshe')
              .getPublicUrl(photo.file_path)
            return { ...photo, url: publicUrl }
          }
          return { ...photo, url: photo.file_path }
        })

        return {
          ...action,
          assigned_to_name,
          verified_by_name,
          photos: photosWithUrls,
          verification_photos: verificationPhotosWithUrls
        }
      })
    )

    return actionsWithDetails
  },

  /**
   * Update corrective action
   */
  async updateCorrectiveAction(actionId: string, updates: any): Promise<CorrectiveAction> {
    const { data, error} = await supabase
      .from('corrective_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Upload action photos
   */
  async uploadActionPhotos(patrolId: string, actionId: string, photos: File[], userId?: string): Promise<void> {
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${actionId}_${Date.now()}.${fileExt}`
      const filePath = `patrols/${patrolId}/actions/${actionId}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('qshe')
        .upload(filePath, photo)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Save photo record to patrol_photos table
      await supabase.from('patrol_photos').insert({
        patrol_id: patrolId,
        action_id: actionId,
        file_name: fileName,
        file_path: filePath,
        photo_type: 'evidence', // Changed from 'action' to valid enum value
        taken_by: userId
      })
    }
  },

  /**
   * Upload verification photos
   */
  async uploadVerificationPhotos(actionId: string, photos: File[]): Promise<void> {
    // Get the action to find the patrol_id
    const { data: action } = await supabase
      .from('corrective_actions')
      .select('patrol_id')
      .eq('id', actionId)
      .single()

    if (!action) {
      throw new Error('Action not found')
    }

    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `verify_${actionId}_${Date.now()}.${fileExt}`
      const filePath = `patrols/${action.patrol_id}/actions/${actionId}/verification/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('qshe')
        .upload(filePath, photo)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Save photo record to patrol_photos table
      await supabase.from('patrol_photos').insert({
        patrol_id: action.patrol_id,
        action_id: actionId,
        file_name: fileName,
        file_path: filePath,
        photo_type: 'after' // Changed from 'verification' to valid enum value
      })
    }
  },

  /**
   * Delete action photos
   */
  async deleteActionPhotos(photoIds: string[]): Promise<void> {
    // First get the file paths
    const { data: photos } = await supabase
      .from('patrol_photos')
      .select('file_path')
      .in('id', photoIds)

    if (photos) {
      // Delete from storage
      for (const photo of photos) {
        // file_path is the storage path, not a full URL
        await supabase.storage.from('qshe').remove([photo.file_path])
      }
    }

    // Delete from database
    await supabase.from('patrol_photos').delete().in('id', photoIds)
  },

  /**
   * Sync offline changes
   */
  async syncOfflineChanges(): Promise<any[]> {
    const unsyncedItems = await offlineDB.getUnsyncedItems()
    const results = []

    for (const item of unsyncedItems) {
      try {
        if (item.table === 'patrols') {
          // Sync patrol changes
          await offlineDB.markAsSynced(item.id!)
          results.push({ success: true, item })
        }
      } catch (error) {
        results.push({ success: false, item, error })
      }
    }

    return results
  }
}
