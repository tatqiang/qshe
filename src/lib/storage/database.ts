import Dexie from 'dexie';
import type { Table } from 'dexie';

// Define interfaces for our database tables
export interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameThai?: string; // Added Thai name field
  lastNameThai?: string;  // Added Thai name field
  nationality?: string;   // Added nationality field
  userType: 'internal' | 'external'; // Removed 'worker' - only organizational types
  status: 'invited' | 'pending_completion' | 'active' | 'inactive' | 'suspended' | 'expired';
  role: 'system_admin' | 'admin' | 'member' | 'registrant'; // Added role field
  positionId?: number;    // Changed from position string to position_id reference
  companyId?: string;     // Added company reference
  invitationToken?: string; // Added for invitation system
  invitedBy?: string;     // Added for invitation tracking
  invitationExpiresAt?: Date; // Added for invitation expiry
  registrationCompletedAt?: Date; // Added for completion tracking
  authUserId?: string;    // Added for auth integration
  faceDescriptors?: any;  // JSONB in database
  profilePhotoUrl?: string; // Added profile photo URL
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id?: string;
  projectId: string;
  userId: string;
  role: 'admin' | 'member';
  projectPosition?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id?: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Patrol {
  id?: string;
  projectId: string;
  title: string;
  date: Date;
  status: 'draft' | 'submitted' | 'completed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatrolIssue {
  id?: string;
  patrolId: string;
  title: string;
  description?: string;
  location?: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'closed';
  assigneeId?: string;
  reporterId: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  closedBy?: string;
}

export interface FileMetadata {
  id?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  entityType: 'user' | 'patrol' | 'meeting';
  entityId: string;
  createdAt: Date;
  createdBy: string;
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries?: number;
  error?: string;
}

export interface MediaQueueItem {
  id?: number; // Auto-incremented
  entityType: string;
  entityId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadStatus: 'pending' | 'processing' | 'completed' | 'failed';
  remoteUrl?: string;
  retries?: number;
  error?: string;
  createdAt: Date;
}

// Define our Dexie database
export class QSHEDatabase extends Dexie {
  users!: Table<User>;
  projects!: Table<Project>;
  projectMembers!: Table<ProjectMember>;
  companies!: Table<Company>;
  patrols!: Table<Patrol>;
  patrolIssues!: Table<PatrolIssue>;
  fileMetadata!: Table<FileMetadata>;
  syncQueue!: Table<SyncQueueItem>;
  mediaQueue!: Table<MediaQueueItem>;

  constructor() {
    super('qsheDatabase');
    
    this.version(1).stores({
      users: 'id, email, userType, status',
      projects: 'id, name, status',
      projectMembers: 'id, projectId, userId, [projectId+userId]',
      companies: 'id, name, status',
      patrols: 'id, projectId, status, createdBy, date',
      patrolIssues: 'id, patrolId, status, assigneeId, reporterId',
      fileMetadata: 'id, entityType, entityId, [entityType+entityId]',
      syncQueue: '++id, entityType, entityId, operation, status, timestamp',
      mediaQueue: '++id, entityType, entityId, uploadStatus'
    });
  }
}

// Export a single instance to be used throughout the app
export const db = new QSHEDatabase();
