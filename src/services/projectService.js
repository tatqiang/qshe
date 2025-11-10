import { supabase } from '@/lib/supabase'
import { offlineDB } from '@/utils/offlineDB'

export const projectService = {
  /**
   * Get all projects (with offline support)
   */
  async getAll() {
    try {
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')
      
      if (error) throw error

      // Store in offline DB
      if (data) {
        await offlineDB.ensureDB()
        await offlineDB.clear('projects')
        for (const project of data) {
          await offlineDB.put('projects', project)
        }
      }
      
      console.log('✅ Projects loaded from server:', data?.length || 0)
      return data
    } catch (error) {
      console.warn('⚠️ Network unavailable - Loading from offline storage')
      // Fallback to offline DB
      const offlineData = await offlineDB.getAll('projects')
      console.log('📦 Projects loaded from IndexedDB:', offlineData.length)
      return offlineData
    }
  },

  /**
   * Get active projects only (excludes test projects for non-admin users)
   * @param {Object} user - Current user object with role information
   */
  async getActive(user = null) {
    const allProjects = await this.getAll()
    
    // Filter active projects
    let activeProjects = allProjects.filter(p => p.status === 'active')
    
    // Hide test projects from non-admin users
    if (!user || user.role !== 'system_admin') {
      activeProjects = activeProjects.filter(p => p.is_test_project !== true)
    }
    
    return activeProjects
  },

  /**
   * Get project by ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Online fetch failed, using offline data:', error)
      return await offlineDB.get('projects', id)
    }
  },

  /**
   * Create new project
   */
  async create(project) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single()
      
      if (error) throw error

      // Store in offline DB
      await offlineDB.put('projects', data)
      
      console.log('✅ Project created online:', data.name)
      return data
    } catch (error) {
      console.warn('⚠️ OFFLINE MODE: Project queued for sync')
      // Generate temporary ID
      const tempId = `temp_${Date.now()}`
      const offlineProject = { ...project, id: tempId, _offline: true }
      
      // Store in offline DB
      await offlineDB.put('projects', offlineProject)
      
      // Queue for sync
      await offlineDB.addToSyncQueue('create', 'projects', offlineProject)
      
      console.log('📦 Offline project created:', offlineProject)
      return offlineProject
    }
  },

  /**
   * Update project
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      // Update offline DB
      await offlineDB.put('projects', data)
      
      console.log('✅ Project updated online:', data.name)
      return data
    } catch (error) {
      console.warn('⚠️ OFFLINE MODE: Update queued for sync')
      // Get current project from offline DB
      const currentProject = await offlineDB.get('projects', id)
      const updatedProject = { ...currentProject, ...updates }
      
      // Update offline DB
      await offlineDB.put('projects', updatedProject)
      
      // Queue for sync
      await offlineDB.addToSyncQueue('update', 'projects', { id, updates })
      
      console.log('📦 Offline update saved:', updatedProject)
      return updatedProject
    }
  },

  /**
   * Delete project
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      // Delete from offline DB
      await offlineDB.delete('projects', id)
      
      return true
    } catch (error) {
      console.warn('Online delete failed, queuing for sync:', error)
      // Mark as deleted in offline DB
      const project = await offlineDB.get('projects', id)
      if (project) {
        project._deleted = true
        await offlineDB.put('projects', project)
      }
      
      // Queue for sync
      await offlineDB.addToSyncQueue('delete', 'projects', { id })
      
      return true
    }
  },

  /**
   * Sync offline changes to server
   */
  async syncOfflineChanges() {
    const unsyncedItems = await offlineDB.getUnsyncedItems()
    const results = []

    console.log(`🔄 Syncing ${unsyncedItems.length} offline change(s)...`)

    for (const item of unsyncedItems) {
      try {
        if (item.table === 'projects') {
          switch (item.action) {
            case 'create':
              const { error: createError } = await supabase.from('projects').insert([item.data])
              if (createError) throw createError
              console.log('✅ Synced CREATE:', item.data.name)
              break
            case 'update':
              console.log('🔍 Syncing update - ID:', item.data.id, 'Updates:', item.data.updates)
              const { data: updatedData, error: updateError } = await supabase
                .from('projects')
                .update(item.data.updates)
                .eq('id', item.data.id)
                .select()
                .single()
              
              if (updateError) throw updateError
              console.log('✅ Synced UPDATE:', updatedData?.name || item.data.id, '- DB Response:', updatedData)
              break
            case 'delete':
              const { error: deleteError } = await supabase.from('projects').delete().eq('id', item.data.id)
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
