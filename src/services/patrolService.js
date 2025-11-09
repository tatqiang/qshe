import { supabase } from '@/lib/supabase'
import { offlineDB } from '@/utils/offlineDB'

/**
 * Calculate risk score and level from 4x4 matrix
 */
function calculateRisk(likelihood, severity) {
  const score = likelihood * severity
  
  let risk_level
  let recommended_action
  
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
function generatePatrolNumber() {
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
  async getAll() {
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

      // Get unique project IDs from patrols
      const projectIds = [...new Set(patrols.filter(p => p.project_id).map(p => p.project_id))]
      
      // Get unique user IDs from patrols (created_by)
      const userIds = [...new Set(patrols.filter(p => p.created_by).map(p => p.created_by))]
      
      // Get unique patrol IDs to fetch risk categories and items
      const patrolIds = patrols.map(p => p.id)
      
      // Load only the projects that are referenced by patrols
      let projectMap = {}
      if (projectIds.length > 0) {
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .in('id', projectIds)
        
        if (!projectError && projects) {
          projects.forEach(p => {
            projectMap[p.id] = p
          })
        }
      }

      // Load users (inspectors)
      let userMap = {}
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        
        if (!userError && users) {
          users.forEach(u => {
            userMap[u.id] = u
          })
        }
      }

      // Load risk categories for patrols
      let patrolRiskCategoriesMap = {}
      if (patrolIds.length > 0) {
        const { data: patrolCategories, error: catError } = await supabase
          .from('patrol_risk_categories')
          .select('patrol_id, risk_category_id')
          .in('patrol_id', patrolIds)
        
        if (!catError && patrolCategories) {
          patrolCategories.forEach(pc => {
            if (!patrolRiskCategoriesMap[pc.patrol_id]) {
              patrolRiskCategoriesMap[pc.patrol_id] = []
            }
            patrolRiskCategoriesMap[pc.patrol_id].push(pc.risk_category_id)
          })
        }
      }

      // Load risk items for patrols
      let patrolRiskItemsMap = {}
      if (patrolIds.length > 0) {
        const { data: patrolItems, error: itemError } = await supabase
          .from('patrol_risk_items')
          .select('patrol_id, risk_item_id')
          .in('patrol_id', patrolIds)
        
        if (!itemError && patrolItems) {
          patrolItems.forEach(pi => {
            if (!patrolRiskItemsMap[pi.patrol_id]) {
              patrolRiskItemsMap[pi.patrol_id] = []
            }
            patrolRiskItemsMap[pi.patrol_id].push(pi.risk_item_id)
          })
        }
      }

      // Join project data and flatten area names
      const enrichedPatrols = patrols.map(patrol => ({
        ...patrol,
        project: patrol.project_id ? projectMap[patrol.project_id] || null : null,
        inspector: patrol.created_by ? userMap[patrol.created_by] || null : null,
        main_area: patrol.main_areas?.main_area_name || null,
        sub_area1: patrol.sub_areas_1?.sub_area_1_name || null,
        sub_area2: patrol.sub_areas_2?.sub_area_2_name || null,
        risk_category_ids: patrolRiskCategoriesMap[patrol.id] || [],
        risk_item_ids: patrolRiskItemsMap[patrol.id] || []
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
      console.error('❌ Error loading patrols from server:', error.message, error)
      console.warn('⚠️ Network unavailable - Loading from offline storage')
      const offlineData = await offlineDB.getAll('patrols')
      console.log('📦 Patrols loaded from IndexedDB:', offlineData.length)
      return offlineData
    }
  },

  /**
   * Get patrol by ID
   */
  async getById(id) {
    try {
      // Load patrol with joined area names from master tables
      const { data: patrol, error: patrolError } = await supabase
        .from('safety_patrols')
        .select(`
          *,
          main_areas:main_area_id(main_area_name),
          sub_areas_1:sub_area_1_id(sub_area_1_name),
          sub_areas_2:sub_area_2_id(sub_area_2_name)
        `)
        .eq('id', id)
        .single()
      
      if (patrolError) throw patrolError

      // Flatten the joined data
      if (patrol) {
        patrol.main_area = patrol.main_areas?.main_area_name || null
        patrol.sub_area1 = patrol.sub_areas_1?.sub_area_1_name || null
        patrol.sub_area2 = patrol.sub_areas_2?.sub_area_2_name || null
        
        // Clean up the joined objects
        delete patrol.main_areas
        delete patrol.sub_areas_1
        delete patrol.sub_areas_2
        
        // Fetch creator name
        if (patrol.created_by) {
          try {
            const { data: creator } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', patrol.created_by)
              .maybeSingle()
            
            if (creator) {
              const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(' ')
              patrol.creator_name = fullName || creator.email || 'Unknown'
            }
          } catch (err) {
            console.warn('Could not fetch creator name:', err)
          }
        }
      }

      // Load project if patrol has project_id
      if (patrol && patrol.project_id) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .eq('id', patrol.project_id)
          .single()
        
        if (!projectError && project) {
          patrol.project = project
        }
      }
      
      console.log('✅ Patrol loaded:', patrol?.patrol_number)
      return patrol
    } catch (error) {
      console.warn('⚠️ Loading patrol from offline storage')
      return await offlineDB.get('patrols', id)
    }
  },

  /**
   * Create new patrol
   */
  async create(formData, userId) {
    const patrol_number = generatePatrolNumber()
    
    // Don't include risk calculation fields - they don't exist in the table
    const patrolData = {
      ...formData,
      patrol_number,
      created_by: userId,
      status: 'open'
    }

    try {
      const { data: patrol, error } = await supabase
        .from('safety_patrols')
        .insert([patrolData])
        .select('*')
        .single()
      
      if (error) throw error

      // Load project if patrol has project_id
      if (patrol && patrol.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .eq('id', patrol.project_id)
          .single()
        
        if (project) {
          patrol.project = project
        }
      }

      // Store in offline DB
      await offlineDB.put('patrols', patrol)
      
      console.log('✅ Patrol created online:', patrol.patrol_number)
      return patrol
    } catch (error) {
      console.warn('⚠️ OFFLINE MODE: Patrol queued for sync')
      
      // Generate temp ID for offline
      const offlinePatrol = {
        ...patrolData,
        id: `temp_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await offlineDB.put('patrols', offlinePatrol)
      await offlineDB.addToSyncQueue('create', 'patrols', offlinePatrol)
      
      console.log('📦 Offline patrol created:', offlinePatrol.patrol_number)
      return offlinePatrol
    }
  },

  /**
   * Update patrol
   */
  async update(id, updates) {
    // Don't send risk calculation fields - they don't exist in the table
    const { risk_score, risk_level, recommended_action, ...updateData } = updates

    try {
      const { data: patrol, error } = await supabase
        .from('safety_patrols')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) throw error

      // Load project if patrol has project_id
      if (patrol && patrol.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, name, project_code')
          .eq('id', patrol.project_id)
          .single()
        
        if (project) {
          patrol.project = project
        }
      }

      await offlineDB.put('patrols', patrol)
      
      console.log('✅ Patrol updated online:', patrol.patrol_number)
      return patrol
    } catch (error) {
      console.warn('⚠️ OFFLINE MODE: Update queued for sync')
      
      const currentPatrol = await offlineDB.get('patrols', id)
      const updatedPatrol = { ...currentPatrol, ...updateData }
      
      await offlineDB.put('patrols', updatedPatrol)
      await offlineDB.addToSyncQueue('update', 'patrols', { id, updates: updateData })
      
      console.log('📦 Offline update saved:', updatedPatrol.patrol_number)
      return updatedPatrol
    }
  },

  /**
   * Delete patrol
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from('safety_patrols')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      await offlineDB.delete('patrols', id)
      
      return true
    } catch (error) {
      console.warn('⚠️ OFFLINE MODE: Delete queued for sync')
      
      const patrol = await offlineDB.get('patrols', id)
      if (patrol) {
        patrol._deleted = true
        await offlineDB.put('patrols', patrol)
      }
      
      await offlineDB.addToSyncQueue('delete', 'patrols', { id })
      return true
    }
  },

  /**
   * Upload patrol photo
   */
  async uploadPhoto(patrolId, file, photoType, userId) {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `patrols/${patrolId}/${fileName}`
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('patrol-photos')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('patrol-photos')
        .getPublicUrl(filePath)
      
      // Save photo record - using patrol_photos table
      const { data, error } = await supabase
        .from('patrol_photos')
        .insert([{
          patrol_id: patrolId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          photo_type: photoType,
          taken_by: userId
        }])
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Photo uploaded:', fileName)
      return { ...data, url: urlData.publicUrl }
    } catch (error) {
      console.error('❌ Photo upload failed:', error)
      throw error
    }
  },

  /**
   * Get photos for a patrol
   */
  async getPhotos(patrolId) {
    const { data, error } = await supabase
      .from('patrol_photos')
      .select('*')
      .eq('patrol_id', patrolId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Check if file_path is already a full URL (from R2 or other storage)
    const photosWithUrls = data.map(photo => {
      // If photo_data contains a full URL, use it
      if (photo.photo_data && photo.photo_data.startsWith('http')) {
        return { ...photo, url: photo.photo_data }
      }
      
      // If file_path is already a full URL, use it directly
      if (photo.file_path && photo.file_path.startsWith('http')) {
        return { ...photo, url: photo.file_path }
      }
      
      // Otherwise, get public URL from Supabase storage (qshe bucket)
      const { data: urlData } = supabase.storage
        .from('qshe')
        .getPublicUrl(photo.file_path)
      
      return { ...photo, url: urlData.publicUrl }
    })
    
    return photosWithUrls
  },

  /**
   * Delete patrol photos
   */
  async deletePatrolPhotos(photoIds) {
    try {
      // First, get the photo records to find the storage paths
      const { data: photos, error: fetchError } = await supabase
        .from('patrol_photos')
        .select('id, file_path')
        .in('id', photoIds)

      if (fetchError) throw fetchError

      if (!photos || photos.length === 0) {
        console.warn('⚠️ No patrol photos found to delete')
        return
      }

      // Delete from storage (only if file_path is not a full URL)
      const deletePromises = photos.map(async (photo) => {
        // Skip if it's already a full URL (external storage)
        if (photo.file_path && !photo.file_path.startsWith('http')) {
          const { error: storageError } = await supabase.storage
            .from('qshe')
            .remove([photo.file_path])

          if (storageError) {
            console.error('❌ Failed to delete from storage:', photo.file_path, storageError)
          }
        }
      })

      await Promise.all(deletePromises)

      // Delete from database
      const { error: deleteError } = await supabase
        .from('patrol_photos')
        .delete()
        .in('id', photoIds)

      if (deleteError) throw deleteError

      console.log('✅ Deleted', photoIds.length, 'patrol photos')
    } catch (error) {
      console.error('❌ Failed to delete patrol photos:', error)
      throw error
    }
  },

  /**
   * Create corrective action
   */
  async createAction(patrolId, formData, userId) {
    try {
      const action_number = `CA-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`
      
      // Extract photos from formData to handle separately
      const { photos, ...actionFields } = formData
      
      const actionData = {
        ...actionFields,
        patrol_id: patrolId,
        action_number,
        assigned_date: new Date().toISOString(),
        status: 'assigned',
        progress_percentage: 0,
        created_by: userId
      }

      const { data, error } = await supabase
        .from('corrective_actions')
        .insert([actionData])
        .select('*')
        .single()
      
      if (error) throw error
      
      console.log('✅ Corrective action created:', data.action_number)
      
      // Upload photos if any
      if (photos && photos.length > 0) {
        console.log('📸 Uploading', photos.length, 'photos for action:', data.id)
        await this.uploadActionPhotos(patrolId, data.id, photos, userId)
      }
      
      // Update patrol status to pending_verification
      const { error: statusError } = await supabase
        .from('safety_patrols')
        .update({ status: 'pending_verification' })
        .eq('id', patrolId)
      
      if (statusError) {
        console.error('❌ Failed to update patrol status:', statusError)
      } else {
        console.log('✅ Patrol status updated to pending_verification')
      }
      
      return data
    } catch (error) {
      console.error('❌ Failed to create corrective action:', error)
      throw error
    }
  },

  /**
   * Upload photos for a corrective action
   */
  async uploadActionPhotos(patrolId, actionId, photos, userId) {
    try {
      const uploadPromises = photos.map(async (photoFile, index) => {
        // Upload to storage with patrol folder structure
        const fileName = `action-${actionId}-${Date.now()}-${index}.jpg`
        const filePath = `patrols/${patrolId}/${fileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qshe')
          .upload(filePath, photoFile)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('qshe')
          .getPublicUrl(filePath)

        // Insert photo record
        const { error: insertError } = await supabase
          .from('corrective_action_photos')
          .insert({
            action_id: actionId,
            r2_bucket: 'qshe',
            r2_key: filePath,
            r2_url: publicUrl,
            filename: fileName,
            original_filename: photoFile.name || fileName,
            file_size: photoFile.size || 0,
            mime_type: photoFile.type || 'image/jpeg',
            photo_type: 'evidence',
            phase: 'execution',
            taken_by: userId
          })

        if (insertError) throw insertError

        return publicUrl
      })

      const photoUrls = await Promise.all(uploadPromises)
      console.log('✅ Uploaded', photoUrls.length, 'photos')
      return photoUrls
    } catch (error) {
      console.error('❌ Failed to upload action photos:', error)
      throw error
    }
  },

  /**
   * Delete corrective action photos
   */
  async deleteActionPhotos(photoIds) {
    try {
      // First, get the photo records to find the storage paths
      const { data: photos, error: fetchError } = await supabase
        .from('corrective_action_photos')
        .select('id, r2_key, r2_bucket')
        .in('id', photoIds)

      if (fetchError) throw fetchError

      if (!photos || photos.length === 0) {
        console.warn('⚠️ No photos found to delete')
        return
      }

      // Delete from storage
      const deletePromises = photos.map(async (photo) => {
        const { error: storageError } = await supabase.storage
          .from(photo.r2_bucket || 'qshe')
          .remove([photo.r2_key])

        if (storageError) {
          console.error('❌ Failed to delete from storage:', photo.r2_key, storageError)
        }
      })

      await Promise.all(deletePromises)

      // Delete from database
      const { error: deleteError } = await supabase
        .from('corrective_action_photos')
        .delete()
        .in('id', photoIds)

      if (deleteError) throw deleteError

      console.log('✅ Deleted', photoIds.length, 'photos')
    } catch (error) {
      console.error('❌ Failed to delete action photos:', error)
      throw error
    }
  },

  /**
   * Get corrective actions for a patrol
   */
  async getActions(patrolId) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('patrol_id', patrolId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Load photos and user names for each action
    const actionsWithPhotos = await Promise.all(
      data.map(async (action) => {
        // Fetch assigned user name
        let assigned_to_name = 'Not assigned'
        if (action.assigned_to) {
          try {
            const { data: assignedUser, error: userError } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', action.assigned_to)
              .maybeSingle()
            
            if (!userError && assignedUser) {
              const fullName = [assignedUser.first_name, assignedUser.last_name].filter(Boolean).join(' ')
              assigned_to_name = fullName || assignedUser.email || 'Not assigned'
            }
          } catch (err) {
            console.warn('Could not fetch assigned user name:', err)
          }
        }
        
        // Fetch verified user name
        let verified_by_name = null
        if (action.verified_by) {
          try {
            const { data: verifiedUser, error: userError } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', action.verified_by)
              .maybeSingle()
            
            if (!userError && verifiedUser) {
              const fullName = [verifiedUser.first_name, verifiedUser.last_name].filter(Boolean).join(' ')
              verified_by_name = fullName || verifiedUser.email || 'Unknown'
            }
          } catch (err) {
            console.warn('Could not fetch verified user name:', err)
          }
        }
        
        const { data: photos } = await supabase
          .from('corrective_action_photos')
          .select('*')
          .eq('action_id', action.id)
          .order('taken_at', { ascending: true })
        
        // Separate regular photos from verification photos
        const regularPhotos = []
        const verificationPhotos = []
        
        // Ensure photos is an array
        const photoArray = Array.isArray(photos) ? photos : []
        
        photoArray.forEach(photo => {
          // Add public URLs to photos from corrective_action_photos table
          let photoWithUrl = { ...photo }
          
          // corrective_action_photos table uses r2_url field
          if (photo.r2_url) {
            photoWithUrl.url = photo.r2_url
          } else if (photo.r2_key) {
            // If no r2_url, construct it from r2_key
            const { data: urlData } = supabase.storage
              .from('qshe')
              .getPublicUrl(photo.r2_key)
            photoWithUrl.url = urlData.publicUrl
          }
          
          // For corrective_action_photos, use photo_type to determine if verification photo
          // phase can be 'execution' (regular) or 'verification'
          if (photo.phase === 'verification') {
            verificationPhotos.push(photoWithUrl)
          } else {
            regularPhotos.push(photoWithUrl)
          }
        })
        
        return { 
          ...action,
          assigned_to_name,
          verified_by_name,
          photos: regularPhotos,
          verification_photos: verificationPhotos
        }
      })
    )
    
    return actionsWithPhotos
  },

  /**
   * Update corrective action
   */
  async updateAction(actionId, updates) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update(updates)
      .eq('id', actionId)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Verify corrective action (approve)
   */
  async verifyAction(actionId, verificationNotes, userId) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        status: 'verified',
        verified_by: userId,
        verification_date: new Date().toISOString(),
        verification_notes: verificationNotes,
        approved_at: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Action verified:', actionId)
    return data
  },

  /**
   * Reject corrective action
   */
  async rejectAction(actionId, rejectionReason, userId) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        status: 'assigned',
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        progress_percentage: 0
      })
      .eq('id', actionId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('⚠️ Action rejected:', actionId)
    return data
  },

  /**
   * Update corrective action
   */
  async updateCorrectiveAction(actionId, updates) {
    console.log('🔧 updateCorrectiveAction called with:', { actionId, updates })
    
    const { data, error } = await supabase
      .from('corrective_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating corrective action:', error)
      throw error
    }
    
    console.log('✅ Corrective action updated:', data)
    return data
  },

  /**
   * Upload verification photos for a corrective action
   */
  async uploadVerificationPhotos(actionId, photos) {
    const uploadedPhotos = []
    
    // First get the patrol_id from the action
    const { data: actionData } = await supabase
      .from('corrective_actions')
      .select('patrol_id')
      .eq('id', actionId)
      .single()
    
    const patrolId = actionData?.patrol_id
    
    for (const photo of photos) {
      try {
        // Generate unique filename
        const fileExt = photo.name.split('.').pop()
        const fileName = `verification_${actionId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = patrolId ? `patrols/${patrolId}/${fileName}` : fileName
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qshe')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Failed to upload verification photo:', uploadError)
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('qshe')
          .getPublicUrl(filePath)
        
        // Save photo record to corrective_action_photos table
        const { data: photoRecord, error: dbError } = await supabase
          .from('corrective_action_photos')
          .insert({
            action_id: actionId,
            r2_bucket: 'qshe',
            r2_key: filePath,
            r2_url: publicUrl,
            filename: fileName,
            original_filename: photo.name,
            file_size: photo.size,
            mime_type: photo.type,
            photo_type: 'verification',
            phase: 'verification'
          })
          .select()
          .single()
        
        if (dbError) {
          console.error('Failed to save verification photo record:', dbError)
          continue
        }
        
        uploadedPhotos.push({ ...photoRecord, url: publicUrl })
      } catch (err) {
        console.error('Error uploading verification photo:', err)
      }
    }
    
    return uploadedPhotos
  },

  /**
   * Add progress update to action
   */
  async addProgressUpdate(actionId, updateText, progressPercentage, userId) {
    const { data, error } = await supabase
      .from('progress_updates')
      .insert([{
        action_id: actionId,
        update_text: updateText,
        progress_percentage: progressPercentage,
        update_date: new Date().toISOString(),
        updated_by: userId
      }])
      .select(`
        *,
        updated_by_user:users!updated_by(id, first_name, last_name)
      `)
      .single()
    
    if (error) throw error
    
    // Update action progress
    await this.updateAction(actionId, { 
      progress_percentage: progressPercentage,
      status: progressPercentage >= 100 ? 'completed' : 'in_progress'
    })
    
    return data
  },

  /**
   * Get progress updates for an action
   */
  async getProgressUpdates(actionId) {
    const { data, error } = await supabase
      .from('progress_updates')
      .select(`
        *,
        updated_by_user:users!updated_by(id, first_name, last_name)
      `)
      .eq('action_id', actionId)
      .order('update_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Sync offline changes
   */
  async syncOfflineChanges() {
    const unsyncedItems = await offlineDB.getUnsyncedItems()
    const results = []

    console.log(`🔄 Syncing ${unsyncedItems.length} offline patrol change(s)...`)

    for (const item of unsyncedItems) {
      try {
        if (item.table === 'patrols') {
          switch (item.action) {
            case 'create':
              const { error: createError } = await supabase
                .from('safety_patrols')
                .insert([item.data])
              
              if (createError) throw createError
              console.log('✅ Synced CREATE:', item.data.patrol_number)
              break
              
            case 'update':
              const { error: updateError } = await supabase
                .from('safety_patrols')
                .update(item.data.updates)
                .eq('id', item.data.id)
              
              if (updateError) throw updateError
              console.log('✅ Synced UPDATE:', item.data.id)
              break
              
            case 'delete':
              const { error: deleteError } = await supabase
                .from('safety_patrols')
                .delete()
                .eq('id', item.data.id)
              
              if (deleteError) throw deleteError
              console.log('✅ Synced DELETE:', item.data.id)
              break
          }
        }
        
        await offlineDB.markAsSynced(item.id)
        results.push({ success: true, item })
      } catch (error) {
        console.error('❌ Sync failed for item:', item, error)
        results.push({ success: false, item, error })
      }
    }

    return results
  }
}
