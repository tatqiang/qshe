/**
 * Supabase Construction Tasks Service
 * Handles CRUD operations for construction tasks in Supabase
 */

import { supabase } from '@/lib/supabase'
import type { 
  ConstructionTask, 
  ConstructionProject, 
  MainArea, 
  SubArea1,
  TaskLocation 
} from '@/types/construction-project'

export interface ConstructionTaskDb {
  id: string
  project_id: string
  task_id: string
  parent_task_id: string | null
  display_order: number
  name: string
  type: string
  start_date: string
  end_date: string
  progress: number
  status: string
  priority: string
  dependencies: string | null
  assignee: string | null
  description: string | null
  cost: number | null
  actual_start: string | null
  actual_end: string | null
  notes: string | null
  main_area_id: string | null
  sub_area_1_id: string | null
  location_detail: string | null
  crew: string | null
  equipment: string | null
  materials: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

class ConstructionTasksService {
  /**
   * Get all tasks for a project
   */
  async getTasksByProject(projectId: string): Promise<ConstructionTask[]> {
    const { data, error } = await supabase
      .from('construction_tasks')
      .select(`
        *,
        main_areas:main_area_id (
          id,
          main_area_name,
          area_code
        ),
        sub_areas_1:sub_area_1_id (
          id,
          sub_area_1_name,
          sub_area_1_code,
          floor_number
        )
      `)
      .eq('project_id', projectId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return (data || []).map(this.mapDbToTask)
  }

  /**
   * Create a new task
   */
  async createTask(task: Partial<ConstructionTask>): Promise<ConstructionTask> {
    if (!task.projectId) {
      throw new Error('Project ID is required')
    }

    const dbTask = this.mapTaskToDb(task)

    const { data, error } = await supabase
      .from('construction_tasks')
      .insert(dbTask)
      .select(`
        *,
        main_areas:main_area_id (
          id,
          main_area_name,
          area_code
        ),
        sub_areas_1:sub_area_1_id (
          id,
          sub_area_1_name,
          sub_area_1_code,
          floor_number
        )
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      console.error('Task data sent:', dbTask)
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return this.mapDbToTask(data)
  }

  /**
   * Create multiple tasks (batch insert)
   */
  async createTasks(tasks: Partial<ConstructionTask>[]): Promise<ConstructionTask[]> {
    if (tasks.length === 0) return []

    const projectId = tasks[0]?.projectId
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const dbTasks = tasks.map(task => this.mapTaskToDb(task))

    const { data, error } = await supabase
      .from('construction_tasks')
      .insert(dbTasks)
      .select(`
        *,
        main_areas:main_area_id (
          id,
          main_area_name,
          area_code
        ),
        sub_areas_1:sub_area_1_id (
          id,
          sub_area_1_name,
          sub_area_1_code,
          floor_number
        )
      `)

    if (error) {
      console.error('Error creating tasks:', error)
      throw new Error(`Failed to create tasks: ${error.message}`)
    }

    return (data || []).map(this.mapDbToTask)
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<ConstructionTask>): Promise<ConstructionTask> {
    const dbUpdates = this.mapTaskToDb(updates, true)

    const { data, error } = await supabase
      .from('construction_tasks')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`
        *,
        main_areas:main_area_id (
          id,
          main_area_name,
          area_code
        ),
        sub_areas_1:sub_area_1_id (
          id,
          sub_area_1_name,
          sub_area_1_code,
          floor_number
        )
      `)
      .single()

    if (error) {
      console.error('Error updating task:', error)
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return this.mapDbToTask(data)
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('construction_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }

  /**
   * Delete all tasks for a project
   */
  async deleteTasksByProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('construction_tasks')
      .delete()
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting tasks:', error)
      throw new Error(`Failed to delete tasks: ${error.message}`)
    }
  }

  /**
   * Change task parent (move task to different parent or top-level)
   */
  async changeTaskParent(taskId: string, newParentId: string | null, tasks: ConstructionTask[]): Promise<void> {
    // Validate no circular reference
    if (newParentId) {
      if (this.wouldCreateCircularReference(taskId, newParentId, tasks)) {
        throw new Error('Cannot create circular reference: task cannot be moved under its own descendant')
      }
    }

    const { error } = await supabase
      .from('construction_tasks')
      .update({ parent_task_id: newParentId })
      .eq('id', taskId)

    if (error) {
      console.error('Error changing task parent:', error)
      throw new Error(`Failed to change task parent: ${error.message}`)
    }
  }

  /**
   * Move task up/down in display order
   */
  async moveTask(taskId: string, direction: 'up' | 'down', projectId: string): Promise<void> {
    // Get all tasks
    const tasks = await this.getTasksByProject(projectId)
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) return
    
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1
    
    if (targetIndex < 0 || targetIndex >= tasks.length) return
    
    // Swap display orders
    const task = tasks[taskIndex]
    const targetTask = tasks[targetIndex]
    
    if (!task || !targetTask) return
    
    const tempOrder = task.displayOrder
    task.displayOrder = targetTask.displayOrder
    targetTask.displayOrder = tempOrder
    
    // Update both tasks
    await this.updateTask(task.id, { displayOrder: task.displayOrder })
    await this.updateTask(targetTask.id, { displayOrder: targetTask.displayOrder })
  }

  /**
   * Calculate parent task dates from children
   */
  calculateParentDates(parentId: string, tasks: ConstructionTask[]): { start: Date; end: Date } | null {
    const children = tasks.filter(t => t.parentTaskId === parentId)
    
    if (children.length === 0) return null
    
    const starts = children.map(c => c.start.getTime())
    const ends = children.map(c => c.end.getTime())
    
    return {
      start: new Date(Math.min(...starts)),
      end: new Date(Math.max(...ends))
    }
  }

  /**
   * Check if moving taskId under newParentId would create circular reference
   */
  private wouldCreateCircularReference(taskId: string, newParentId: string, tasks: ConstructionTask[]): boolean {
    let currentId: string | null = newParentId
    
    while (currentId) {
      if (currentId === taskId) return true
      
      const parent = tasks.find(t => t.id === currentId)
      currentId = parent?.parentTaskId || null
    }
    
    return false
  }

  /**
   * Get all descendants of a task (recursive)
   */
  getDescendants(taskId: string, tasks: ConstructionTask[]): ConstructionTask[] {
    const descendants: ConstructionTask[] = []
    const children = tasks.filter(t => t.parentTaskId === taskId)
    
    for (const child of children) {
      descendants.push(child)
      descendants.push(...this.getDescendants(child.id, tasks))
    }
    
    return descendants
  }

  /**
   * Get main areas for a project
   */
  async getMainAreas(projectId: string): Promise<MainArea[]> {
    const { data, error } = await supabase
      .from('main_areas')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .order('main_area_name')

    if (error) {
      console.error('Error fetching main areas:', error)
      throw new Error(`Failed to fetch main areas: ${error.message}`)
    }

    return (data || []).map(area => ({
      id: area.id,
      projectId: area.project_id,
      mainAreaName: area.main_area_name,
      areaCode: area.area_code,
      description: area.description,
      areaType: area.area_type,
      status: area.status
    }))
  }

  /**
   * Get sub areas for a main area
   */
  async getSubAreas(mainAreaId: string): Promise<SubArea1[]> {
    const { data, error } = await supabase
      .from('sub_areas_1')
      .select('*')
      .eq('main_area_id', mainAreaId)
      .eq('status', 'active')
      .order('sub_area_1_name')

    if (error) {
      console.error('Error fetching sub areas:', error)
      throw new Error(`Failed to fetch sub areas: ${error.message}`)
    }

    return (data || []).map(area => ({
      id: area.id,
      mainAreaId: area.main_area_id,
      subArea1Name: area.sub_area_1_name,
      subArea1Code: area.sub_area_1_code,
      description: area.description,
      areaType: area.area_type,
      floorNumber: area.floor_number,
      status: area.status
    }))
  }

  /**
   * Map database record to ConstructionTask
   */
  private mapDbToTask(dbTask: any): ConstructionTask {
    const location: TaskLocation = {}
    
    if (dbTask.main_areas) {
      location.mainAreaId = dbTask.main_areas.id
      location.mainAreaName = dbTask.main_areas.main_area_name
    }
    
    if (dbTask.sub_areas_1) {
      location.subArea1Id = dbTask.sub_areas_1.id
      location.subArea1Name = dbTask.sub_areas_1.sub_area_1_name
    }
    
    if (dbTask.location_detail) {
      location.locationDetail = dbTask.location_detail
    }

    return {
      id: dbTask.id,
      taskId: dbTask.task_id,
      projectId: dbTask.project_id,
      parentTaskId: dbTask.parent_task_id || null,
      displayOrder: dbTask.display_order || 0,
      name: dbTask.name,
      type: dbTask.type as any,
      start: new Date(dbTask.start_date),
      end: new Date(dbTask.end_date),
      progress: dbTask.progress,
      status: dbTask.status as any,
      priority: dbTask.priority as any,
      dependencies: dbTask.dependencies ? dbTask.dependencies.split(',').map((d: string) => d.trim()) : [],
      assignee: dbTask.assignee || undefined,
      description: dbTask.description || undefined,
      cost: dbTask.cost || undefined,
      actualStart: dbTask.actual_start ? new Date(dbTask.actual_start) : undefined,
      actualEnd: dbTask.actual_end ? new Date(dbTask.actual_end) : undefined,
      notes: dbTask.notes || undefined,
      location: Object.keys(location).length > 0 ? location : undefined,
      crew: dbTask.crew || undefined,
      equipment: dbTask.equipment ? JSON.parse(dbTask.equipment) : undefined,
      materials: dbTask.materials ? JSON.parse(dbTask.materials) : undefined,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      createdBy: dbTask.created_by || undefined
    }
  }

  /**
   * Map ConstructionTask to database record
   */
  private mapTaskToDb(task: Partial<ConstructionTask>, isUpdate = false): Partial<ConstructionTaskDb> {
    const dbTask: any = {}

    if (!isUpdate) {
      dbTask.id = task.id || crypto.randomUUID()
      dbTask.task_id = task.taskId || `task-${Date.now()}`
      dbTask.project_id = task.projectId
    }

    if (task.displayOrder !== undefined) dbTask.display_order = task.displayOrder
    if (task.parentTaskId !== undefined) dbTask.parent_task_id = task.parentTaskId
    if (task.name !== undefined) dbTask.name = task.name
    if (task.type !== undefined) dbTask.type = task.type
    if (task.start !== undefined) dbTask.start_date = task.start.toISOString().split('T')[0]
    if (task.end !== undefined) dbTask.end_date = task.end.toISOString().split('T')[0]
    if (task.progress !== undefined) dbTask.progress = task.progress
    if (task.status !== undefined) dbTask.status = task.status
    if (task.priority !== undefined) dbTask.priority = task.priority
    if (task.dependencies !== undefined) dbTask.dependencies = task.dependencies.join(', ')
    if (task.assignee !== undefined) dbTask.assignee = task.assignee
    if (task.description !== undefined) dbTask.description = task.description
    if (task.cost !== undefined) dbTask.cost = task.cost
    if (task.actualStart !== undefined) dbTask.actual_start = task.actualStart?.toISOString().split('T')[0]
    if (task.actualEnd !== undefined) dbTask.actual_end = task.actualEnd?.toISOString().split('T')[0]
    if (task.notes !== undefined) dbTask.notes = task.notes
    if (task.crew !== undefined) dbTask.crew = task.crew
    
    // Handle location
    if (task.location) {
      if (task.location.mainAreaId !== undefined) dbTask.main_area_id = task.location.mainAreaId
      if (task.location.subArea1Id !== undefined) dbTask.sub_area_1_id = task.location.subArea1Id
      if (task.location.locationDetail !== undefined) dbTask.location_detail = task.location.locationDetail
    }
    
    // Handle arrays
    if (task.equipment !== undefined) {
      dbTask.equipment = JSON.stringify(task.equipment)
    }
    if (task.materials !== undefined) {
      dbTask.materials = JSON.stringify(task.materials)
    }

    return dbTask
  }
}

// Export singleton instance
export const constructionTasksService = new ConstructionTasksService()
