/**
 * Construction Project Planning Types
 * Defines the data structure for construction project Gantt charts
 * Integrated with existing Supabase projects table
 */

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'delayed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'phase' | 'milestone' | 'task' | 'subtask'

/**
 * Area and Location information for tasks
 */
export interface TaskLocation {
  mainAreaId?: string
  mainAreaName?: string
  subArea1Id?: string
  subArea1Name?: string
  locationDetail?: string // Specific description: "Building A, Floor 3, Room 301"
}

export interface ConstructionTask {
  id: string // UUID from database
  taskId: string // Custom ID for dependencies (e.g., task-1-1)
  projectId?: string // Link to projects table
  parentTaskId?: string | null // Parent task ID for subtasks
  displayOrder: number // Manual sort order
  name: string
  type: TaskType
  start: Date
  end: Date
  progress: number // 0-100
  status: TaskStatus
  priority: TaskPriority
  dependencies: string[] // taskId values of dependent tasks
  assignee?: string
  description?: string
  cost?: number
  actualStart?: Date
  actualEnd?: Date
  notes?: string
  
  // Area and Location fields
  location?: TaskLocation
  
  crew?: string
  equipment?: string[]
  materials?: string[]
  
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface ConstructionProject {
  id: string // UUID from projects table
  projectCode?: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  status: TaskStatus
  budget?: number
  actualCost?: number
  client?: string
  projectManager?: string
  location?: string
  tasks: ConstructionTask[]
  googleSheetId?: string
  lastSynced?: Date
  isTestProject?: boolean
}

/**
 * Main Area structure from database
 */
export interface MainArea {
  id: string
  projectId: string
  mainAreaName: string
  areaCode?: string
  description?: string
  areaType?: string
  status?: string
}

/**
 * Sub Area structure from database
 */
export interface SubArea1 {
  id: string
  mainAreaId: string
  subArea1Name: string
  subArea1Code?: string
  description?: string
  areaType?: string
  floorNumber?: number
  status?: string
}

/**
 * Construction System (HVAC, Plumbing, Fire Protection, etc.)
 */
export interface ConstructionSystem {
  id: string
  projectId: string
  item: number
  systemCode: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * ITR Type (Installation and Test, Materials, Benchmark, Training)
 */
export interface ITRType {
  id: string
  projectId: string
  item: number
  typeName: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * ITP (Inspection and Test Plan) from Google Sheets
 */
export interface ITPDocument {
  item: string
  discipline: string
  docNo: string
  title: string
}

/**
 * Material from Google Sheets
 */
export interface MaterialDocument {
  item: string
  discipline: string
  docNo: string
  title: string
  link?: string
}

/**
 * ITR Status Code (fixed enum for workflow logic)
 */
export type ITRStatusCode = 'plan' | 'internal_requested' | 'confirm_requested' | 'in_review' | 'approved' | 'rejected'

/**
 * ITR Status Definition (editable labels)
 */
export interface ITRStatusDefinition {
  code: ITRStatusCode
  displayName: string
  description?: string
  color?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  canEdit: boolean
}

/**
 * Project Team
 */
export interface ProjectTeam {
  id: string
  projectId: string
  teamName: string
  teamCode: string
  description?: string
  isActive: boolean
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Project Team Member
 */
export interface ProjectTeamMember {
  id: string
  projectTeamId: string
  projectMemberId: string
  roleInTeam?: string
  assignedAt: Date
  assignedBy?: string
  isActive: boolean
  // Populated fields
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    position?: {
      positionTitle: string
      code: string
    }
  }
}

/**
 * File Attachment
 */
export interface FileAttachment {
  url: string
  name: string
  type: 'pdf' | 'image' // pdf, jpg, png, etc.
  size?: number
  uploadedAt: Date
  uploadedBy?: string
}

/**
 * Inspection and Test Request (ITR) - Enhanced with workflow
 */
export interface ConstructionITR {
  id: string
  taskId: string
  task?: ConstructionTask
  projectId: string
  
  // ITR identification
  itrNo?: string
  itrTitle: string
  
  // Foreign keys to project-specific tables
  systemId?: string
  system?: ConstructionSystem
  itrTypeId?: string
  itrType?: ITRType
  
  // ITP reference (from Google Sheet)
  itpNo?: string
  itpDocNo?: string
  itpTitle?: string
  
  // Location information (from task but editable)
  mainAreaId?: string
  mainArea?: MainArea
  subArea1Id?: string
  subArea1?: SubArea1
  locationDetail?: string
  
  // Person in Charge
  picUserId?: string
  picUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
    position?: string
  }
  
  // Workflow tracking
  statusCode: ITRStatusCode
  statusDisplay?: string // From status definition
  statusColor?: string
  statusIcon?: string
  
  // Workflow timestamps
  createdDate: Date
  createdBy: string
  internalRequestedAt?: Date
  internalRequestedBy?: string
  confirmRequestedAt?: Date
  confirmRequestedBy?: string
  itrNoAssignedAt?: Date
  reviewedAt?: Date
  reviewedBy?: string
  reviewComments?: string
  
  // Target team (usually QA/QC)
  targetTeamId?: string
  targetTeam?: ProjectTeam
  
  // Drawing information
  drawingNo?: string
  drawingFileUrl?: string
  
  // Delivery Order
  doFileUrl?: string
  doFileName?: string
  
  // Material reference (from Google Sheet)
  materialNo?: string
  materialDocNo?: string
  materialTitle?: string
  
  // Additional note
  note?: string
  
  // Additional files (PDFs and images)
  additionalFiles?: FileAttachment[]
  
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Default construction project template
 * Standard phases for a typical building construction project
 */
export const DEFAULT_CONSTRUCTION_TEMPLATE: Omit<ConstructionProject, 'id' | 'googleSheetId' | 'lastSynced' | 'projectCode'> = {
  name: 'New Construction Project',
  description: 'Standard construction project template',
  startDate: new Date(),
  endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months default
  status: 'not-started',
  tasks: [
    // Phase 1: Pre-Construction
    {
      id: crypto.randomUUID(),
      taskId: 'phase-1',
      name: 'Pre-Construction Phase',
      type: 'phase',
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: [],
      description: 'Planning and preparation phase',
      displayOrder: 1
    },
    {
      id: crypto.randomUUID(),
      taskId: 'task-1-1',
      name: 'Site Survey & Investigation',
      type: 'task',
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: [],
      description: 'Conduct site survey, soil testing, and feasibility study',
      displayOrder: 2
    },
    {
      id: crypto.randomUUID(),
      taskId: 'task-1-2',
      name: 'Pre-Construction Phase',
      type: 'phase',
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: [],
      description: 'Planning and preparation phase',
      displayOrder: 3
    },
    {
      id: 'task-1-1',
      name: 'Site Survey & Investigation',
      type: 'task',
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: [],
      description: 'Conduct site survey, soil testing, and feasibility study',
      taskId: 'task-1-1',
      displayOrder: 4
    },
    {
      id: 'task-1-2',
      name: 'Design & Engineering',
      type: 'task',
      start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-1-1'],
      description: 'Architectural and structural design, obtain approvals',
      taskId: 'task-1-2',
      displayOrder: 5
    },
    {
      id: 'task-1-3',
      name: 'Permits & Approvals',
      type: 'task',
      start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['task-1-2'],
      description: 'Obtain building permits and regulatory approvals',
      taskId: 'task-1-3',
      displayOrder: 6
    },

    // Phase 2: Site Preparation
    {
      id: 'phase-2',
      name: 'Site Preparation',
      type: 'phase',
      start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['phase-1'],
      description: 'Site clearing and preparation work',
      taskId: 'phase-2',
      displayOrder: 7
    },
    {
      id: 'task-2-1',
      name: 'Site Clearing & Grading',
      type: 'task',
      start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-1-3'],
      description: 'Clear vegetation, level ground, prepare access roads',
      taskId: 'task-2-1',
      displayOrder: 8
    },
    {
      id: 'task-2-2',
      name: 'Utility Connections',
      type: 'task',
      start: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-2-1'],
      description: 'Set up temporary power, water, and sanitation',
      taskId: 'task-2-2',
      displayOrder: 9
    },

    // Phase 3: Foundation Work
    {
      id: 'phase-3',
      taskId: 'phase-3',
      name: 'Foundation Work',
      type: 'phase',
      start: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['phase-2'],
      description: 'Foundation and basement construction',
      displayOrder: 30
    },
    {
      id: 'task-3-1',
      taskId: 'task-3-1',
      name: 'Excavation',
      type: 'task',
      start: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-2-2'],
      description: 'Excavate foundation area to required depth',
      displayOrder: 31
    },
    {
      id: 'task-3-2',
      taskId: 'task-3-2',
      name: 'Formwork & Reinforcement',
      type: 'task',
      start: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 57 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-3-1'],
      description: 'Install formwork and steel reinforcement',
      displayOrder: 32
    },
    {
      id: 'task-3-3',
      taskId: 'task-3-3',
      name: 'Concrete Pouring & Curing',
      type: 'task',
      start: new Date(Date.now() + 57 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['task-3-2'],
      description: 'Pour foundation concrete and allow curing time',
      displayOrder: 33
    },

    // Phase 4: Structural Work
    {
      id: 'phase-4',
      taskId: 'phase-4',
      name: 'Structural Construction',
      type: 'phase',
      start: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['phase-3'],
      description: 'Main structural frame and roof',
      displayOrder: 40
    },
    {
      id: 'task-4-1',
      taskId: 'task-4-1',
      name: 'Frame Construction',
      type: 'task',
      start: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['task-3-3'],
      description: 'Erect structural frame (steel/concrete/wood)',
      displayOrder: 41
    },
    {
      id: 'task-4-2',
      taskId: 'task-4-2',
      name: 'Roof Structure',
      type: 'task',
      start: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-4-1'],
      description: 'Install roof trusses and roofing material',
      displayOrder: 42
    },
    {
      id: 'task-4-3',
      taskId: 'task-4-3',
      name: 'External Walls',
      type: 'task',
      start: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-4-1'],
      description: 'Construct external walls and weatherproofing',
      displayOrder: 43
    },

    // Phase 5: MEP Installation
    {
      id: 'phase-5',
      taskId: 'phase-5',
      name: 'MEP Systems',
      type: 'phase',
      start: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-4-2'],
      description: 'Mechanical, Electrical, and Plumbing systems',
      displayOrder: 50
    },
    {
      id: 'task-5-1',
      taskId: 'task-5-1',
      name: 'Electrical Rough-In',
      type: 'task',
      start: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 115 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-4-2'],
      description: 'Install electrical wiring, conduits, and panels',
      displayOrder: 51
    },
    {
      id: 'task-5-2',
      taskId: 'task-5-2',
      name: 'Plumbing Installation',
      type: 'task',
      start: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 115 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-4-2'],
      description: 'Install water supply and drainage systems',
      displayOrder: 52
    },
    {
      id: 'task-5-3',
      taskId: 'task-5-3',
      name: 'HVAC Installation',
      type: 'task',
      start: new Date(Date.now() + 115 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['task-5-1', 'task-5-2'],
      description: 'Install heating, ventilation, and air conditioning',
      displayOrder: 53
    },

    // Phase 6: Interior Finishing
    {
      id: 'phase-6',
      taskId: 'phase-6',
      name: 'Interior Finishing',
      type: 'phase',
      start: new Date(Date.now() + 125 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'medium',
      dependencies: ['task-5-3', 'task-4-3'],
      description: 'Interior walls, flooring, and finishing work',
      displayOrder: 60
    },
    {
      id: 'task-6-1',
      taskId: 'task-6-1',
      name: 'Drywall & Insulation',
      type: 'task',
      start: new Date(Date.now() + 125 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'medium',
      dependencies: ['task-5-3'],
      description: 'Install insulation and drywall partitions',
      displayOrder: 61
    },
    {
      id: 'task-6-2',
      taskId: 'task-6-2',
      name: 'Flooring',
      type: 'task',
      start: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 155 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'medium',
      dependencies: ['task-6-1'],
      description: 'Install flooring materials (tile, hardwood, carpet)',
      displayOrder: 62
    },
    {
      id: 'task-6-3',
      taskId: 'task-6-3',
      name: 'Painting & Trim',
      type: 'task',
      start: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'low',
      dependencies: ['task-6-1'],
      description: 'Paint walls, install trim and moldings',
      displayOrder: 63
    },

    // Phase 7: Final Completion
    {
      id: 'phase-7',
      taskId: 'phase-7',
      name: 'Final Completion',
      type: 'phase',
      start: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'high',
      dependencies: ['phase-6'],
      description: 'Final inspections and handover',
      displayOrder: 70
    },
    {
      id: 'task-7-1',
      taskId: 'task-7-1',
      name: 'Fixtures & Fittings',
      type: 'task',
      start: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 170 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'medium',
      dependencies: ['task-6-2', 'task-6-3'],
      description: 'Install final fixtures, appliances, and hardware',
      displayOrder: 71
    },
    {
      id: 'task-7-2',
      taskId: 'task-7-2',
      name: 'Cleanup & Landscaping',
      type: 'task',
      start: new Date(Date.now() + 170 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 175 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'low',
      dependencies: ['task-7-1'],
      description: 'Site cleanup and basic landscaping',
      displayOrder: 72
    },
    {
      id: 'task-7-3',
      taskId: 'task-7-3',
      name: 'Final Inspections',
      type: 'task',
      start: new Date(Date.now() + 175 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 178 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['task-7-2'],
      description: 'Building inspections and safety certifications',
      displayOrder: 73
    },
    {
      id: 'milestone-completion',
      taskId: 'milestone-completion',
      name: 'Project Handover',
      type: 'milestone',
      start: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      progress: 0,
      status: 'not-started',
      priority: 'critical',
      dependencies: ['task-7-3'],
      description: 'Official project completion and handover to client',
      displayOrder: 74
    }
  ]
}
