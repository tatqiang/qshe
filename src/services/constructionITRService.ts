/**
 * Construction ITR Service
 * Handles CRUD operations for Inspection and Test Requests (ITR)
 * Includes Google Sheets integration for ITP and Materials data
 */

import { supabase } from '@/lib/supabase'
import type { 
  ConstructionITR, 
  ConstructionSystem, 
  ITRType,
  ITPDocument,
  MaterialDocument
} from '@/types/construction-project'

class ConstructionITRService {
  
  // ==================== Systems ====================
  
  /**
   * Get all systems for a project
   */
  async getSystemsByProject(projectId: string): Promise<ConstructionSystem[]> {
    const { data, error } = await supabase
      .from('construction_systems')
      .select('*')
      .eq('project_id', projectId)
      .order('item', { ascending: true })

    if (error) {
      console.error('Error fetching systems:', error)
      throw new Error(`Failed to fetch systems: ${error.message}`)
    }

    // Map database columns to TypeScript interface
    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      item: row.item,
      systemCode: row.system_code,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }))
  }

  /**
   * Create a new system
   */
  async createSystem(system: Omit<ConstructionSystem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConstructionSystem> {
    const { data, error } = await supabase
      .from('construction_systems')
      .insert({
        project_id: system.projectId,
        item: system.item,
        system_code: system.systemCode,
        description: system.description
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating system:', error)
      throw new Error(`Failed to create system: ${error.message}`)
    }

    return data
  }

  /**
   * Seed default systems for a project
   */
  async seedDefaultSystems(projectId: string): Promise<void> {
    const defaultSystems = [
      { item: 1, systemCode: 'M', description: 'HVAC' },
      { item: 2, systemCode: 'P', description: 'Plumbing-Process Piping' },
      { item: 3, systemCode: 'FP', description: 'Fire Protection' },
      { item: 4, systemCode: 'E', description: 'Electrical' },
      { item: 5, systemCode: 'S', description: 'Structural' }
    ]

    for (const system of defaultSystems) {
      await this.createSystem({ projectId, ...system })
    }
  }

  // ==================== ITR Types ====================
  
  /**
   * Get all ITR types for a project
   */
  async getITRTypesByProject(projectId: string): Promise<ITRType[]> {
    const { data, error } = await supabase
      .from('construction_itr_types')
      .select('*')
      .eq('project_id', projectId)
      .order('item', { ascending: true })

    if (error) {
      console.error('Error fetching ITR types:', error)
      throw new Error(`Failed to fetch ITR types: ${error.message}`)
    }

    // Map database columns to TypeScript interface
    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      item: row.item,
      typeName: row.type_name,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }))
  }

  /**
   * Create a new ITR type
   */
  async createITRType(itrType: Omit<ITRType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITRType> {
    const { data, error } = await supabase
      .from('construction_itr_types')
      .insert({
        project_id: itrType.projectId,
        item: itrType.item,
        type_name: itrType.typeName
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ITR type:', error)
      throw new Error(`Failed to create ITR type: ${error.message}`)
    }

    return data
  }

  /**
   * Seed default ITR types for a project
   */
  async seedDefaultITRTypes(projectId: string): Promise<void> {
    const defaultTypes = [
      { item: 1, typeName: 'Installation and Test' },
      { item: 2, typeName: 'Materials' },
      { item: 3, typeName: 'Benchmark' },
      { item: 4, typeName: 'Training' }
    ]

    for (const type of defaultTypes) {
      await this.createITRType({ projectId, ...type })
    }
  }

  // ==================== Google Sheets Integration ====================
  
  /**
   * Fetch ITP documents from Google Sheet
   * Sheet ID: 1DvfGfTpIdevgHk3JQJy9n6I6LyTzvR7j4x6VNQjop-k
   */
  async fetchITPDocuments(): Promise<ITPDocument[]> {
    try {
      const sheetId = '1DvfGfTpIdevgHk3JQJy9n6I6LyTzvR7j4x6VNQjop-k'
      const range = 'Sheet1!A:D' // Columns: Item, Discipline, Doc_no, Title
      
      // Use Supabase edge function or direct API call
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch ITP documents')
      }

      const data = await response.json()
      const rows = data.values || []
      
      // Skip header row and map to interface
      return rows.slice(1).map((row: string[]) => ({
        item: row[0] || '',
        discipline: row[1] || '',
        docNo: row[2] || '',
        title: row[3] || ''
      }))
    } catch (error) {
      console.error('Error fetching ITP documents:', error)
      return []
    }
  }

  /**
   * Fetch Material documents from Google Sheet
   * Sheet ID: 1TLPnJFUGduj3Ypjba0pNPb3IKZrcqCKazxz9fCocnok
   */
  async fetchMaterialDocuments(): Promise<MaterialDocument[]> {
    try {
      const sheetId = '1TLPnJFUGduj3Ypjba0pNPb3IKZrcqCKazxz9fCocnok'
      const range = 'Sheet1!A:E' // Columns: Item, Discipline, Doc_no, Title, Link
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch Material documents')
      }

      const data = await response.json()
      const rows = data.values || []
      
      // Skip header row and map to interface
      return rows.slice(1).map((row: string[]) => ({
        item: row[0] || '',
        discipline: row[1] || '',
        docNo: row[2] || '',
        title: row[3] || '',
        link: row[4] || ''
      }))
    } catch (error) {
      console.error('Error fetching Material documents:', error)
      return []
    }
  }

  // ==================== ITR CRUD ====================
  
  /**
   * Get all ITRs for a task
   */
  async getITRsByTask(taskId: string): Promise<ConstructionITR[]> {
    const { data, error } = await supabase
      .from('construction_itrs')
      .select(`
        *,
        system:construction_systems(*),
        itrType:construction_itr_types(*),
        mainArea:main_areas(*),
        subArea1:sub_areas_1(*)
      `)
      .eq('task_id', taskId)
      .order('created_date', { ascending: false })

    if (error) {
      console.error('Error fetching ITRs:', error)
      throw new Error(`Failed to fetch ITRs: ${error.message}`)
    }

    return (data || []).map(this.mapITRFromDatabase)
  }

  /**
   * Get all ITRs for a project
   */
  async getITRsByProject(projectId: string): Promise<ConstructionITR[]> {
    const { data, error } = await supabase
      .from('construction_itrs')
      .select(`
        *,
        task:construction_tasks(*),
        system:construction_systems(*),
        itrType:construction_itr_types(*),
        mainArea:main_areas(*),
        subArea1:sub_areas_1(*)
      `)
      .eq('project_id', projectId)
      .order('created_date', { ascending: false })

    if (error) {
      console.error('Error fetching ITRs:', error)
      throw new Error(`Failed to fetch ITRs: ${error.message}`)
    }

    return (data || []).map(this.mapITRFromDatabase)
  }

  /**
   * Create a new ITR (draft)
   */
  async createITR(itr: Partial<ConstructionITR>): Promise<ConstructionITR> {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('construction_itrs')
      .insert({
        task_id: itr.taskId,
        project_id: itr.projectId,
        itr_no: itr.itrNo,
        itr_title: itr.itrTitle,
        system_id: itr.systemId,
        itr_type_id: itr.itrTypeId,
        itp_no: itr.itpNo,
        itp_doc_no: itr.itpDocNo,
        itp_title: itr.itpTitle,
        main_area_id: itr.mainAreaId,
        sub_area_1_id: itr.subArea1Id,
        location_detail: itr.locationDetail,
        created_by: user?.id,
        drawing_no: itr.drawingNo,
        drawing_file_url: itr.drawingFileUrl,
        material_no: itr.materialNo,
        material_doc_no: itr.materialDocNo,
        material_title: itr.materialTitle,
        status_code: 'draft'
      })
      .select(`
        *,
        system:construction_systems(*),
        itrType:construction_itr_types(*),
        mainArea:main_areas(*),
        subArea1:sub_areas_1(*)
      `)
      .single()

    if (error) {
      console.error('Error creating ITR:', error)
      throw new Error(`Failed to create ITR: ${error.message}`)
    }

    return this.mapITRFromDatabase(data)
  }

  /**
   * Update an ITR
   */
  async updateITR(id: string, updates: Partial<ConstructionITR>): Promise<ConstructionITR> {
    const { data, error } = await supabase
      .from('construction_itrs')
      .update({
        itr_no: updates.itrNo,
        itr_title: updates.itrTitle,
        system_id: updates.systemId,
        itr_type_id: updates.itrTypeId,
        itp_no: updates.itpNo,
        itp_doc_no: updates.itpDocNo,
        itp_title: updates.itpTitle,
        main_area_id: updates.mainAreaId,
        sub_area_1_id: updates.subArea1Id,
        location_detail: updates.locationDetail,
        drawing_no: updates.drawingNo,
        drawing_file_url: updates.drawingFileUrl,
        material_no: updates.materialNo,
        material_doc_no: updates.materialDocNo,
        material_title: updates.materialTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        system:construction_systems(*),
        itrType:construction_itr_types(*),
        mainArea:main_areas(*),
        subArea1:sub_areas_1(*)
      `)
      .single()

    if (error) {
      console.error('Error updating ITR:', error)
      throw new Error(`Failed to update ITR: ${error.message}`)
    }

    return this.mapITRFromDatabase(data)
  }

  /**
   * Submit an ITR (change status from draft to submitted)
   */
  async submitITR(id: string): Promise<ConstructionITR> {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('construction_itrs')
      .update({
        status: 'submitted',
        request_date: new Date().toISOString(),
        requested_by: user?.id
      })
      .eq('id', id)
      .select(`
        *,
        system:construction_systems(*),
        itrType:construction_itr_types(*),
        mainArea:main_areas(*),
        subArea1:sub_areas_1(*)
      `)
      .single()

    if (error) {
      console.error('Error submitting ITR:', error)
      throw new Error(`Failed to submit ITR: ${error.message}`)
    }

    return this.mapITRFromDatabase(data)
  }

  /**
   * Delete an ITR
   */
  async deleteITR(id: string): Promise<void> {
    const { error } = await supabase
      .from('construction_itrs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting ITR:', error)
      throw new Error(`Failed to delete ITR: ${error.message}`)
    }
  }

  /**
   * Upload drawing file to Supabase Storage
   */
  async uploadDrawingFile(file: File, projectId: string, itrId: string): Promise<string> {
    const fileName = `construction-itrs/${projectId}/${itrId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('qshe')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading drawing:', error)
      throw new Error(`Failed to upload drawing: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('qshe')
      .getPublicUrl(data.path)

    return publicUrl
  }

  /**
   * Map database response to ConstructionITR interface
   */
  private mapITRFromDatabase(data: any): ConstructionITR {
    return {
      id: data.id,
      taskId: data.task_id,
      task: data.task,
      projectId: data.project_id,
      itrNo: data.itr_no,
      itrTitle: data.itr_title,
      systemId: data.system_id,
      system: data.system,
      itrTypeId: data.itr_type_id,
      itrType: data.itrType,
      itpNo: data.itp_no,
      itpDocNo: data.itp_doc_no,
      itpTitle: data.itp_title,
      mainAreaId: data.main_area_id,
      mainArea: data.mainArea,
      subArea1Id: data.sub_area_1_id,
      subArea1: data.subArea1,
      locationDetail: data.location_detail,
      createdDate: new Date(data.created_date),
      createdBy: data.created_by,
      drawingNo: data.drawing_no,
      drawingFileUrl: data.drawing_file_url,
      materialNo: data.material_no,
      materialDocNo: data.material_doc_no,
      materialTitle: data.material_title,
      statusCode: data.status_code,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }
  }

  // ==================== Attachments ====================

  /**
   * Upload attachment file to storage and save record
   */
  async uploadAttachment(
    file: File, 
    itrId: string, 
    attachmentType: string,
    currentUserId?: string
  ): Promise<string> {
    // Get user ID from parameter or fallback to Supabase auth
    let userId = currentUserId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    
    if (!userId) {
      throw new Error('User not authenticated')
    }
    
    // Get project ID from ITR
    const { data: itr } = await supabase
      .from('construction_itrs')
      .select('project_id')
      .eq('id', itrId)
      .single()
    
    if (!itr) throw new Error('ITR not found')
    
    // Upload file to R2
    const filePath = `construction-itrs/${itr.project_id}/${itrId}/${attachmentType}/${this.sanitizeFileName(file.name)}`
    const fileUrl = await this.uploadFileToR2(file, filePath)
    
    // Save attachment record
    const { data, error } = await supabase
      .from('construction_itr_attachments')
      .insert({
        itr_id: itrId,
        attachment_type: attachmentType,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving attachment:', error)
      console.error('User ID:', userId)
      console.error('ITR ID:', itrId)
      throw new Error(`Failed to save attachment: ${error.message}`)
    }
    
    return fileUrl
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFileName(fileName: string): string {
    // Get file extension
    const lastDot = fileName.lastIndexOf('.')
    const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName
    const ext = lastDot > 0 ? fileName.substring(lastDot) : ''
    
    // Remove Thai characters and special characters, keep only alphanumeric, dash, underscore
    const sanitized = name
      .replace(/[^\w\s-]/g, '') // Remove special chars except space, dash, underscore
      .replace(/\s+/g, '_')      // Replace spaces with underscore
      .replace(/_+/g, '_')       // Replace multiple underscores with single
      .replace(/^_|_$/g, '')     // Remove leading/trailing underscores
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now()
    
    return `${sanitized}_${timestamp}${ext}`
  }

  /**
   * Upload file to R2 storage using S3-compatible API
   */
  private async uploadFileToR2(file: File, filePath: string): Promise<string> {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error('R2 configuration is missing. Please check environment variables.')
    }

    // R2 endpoint
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${filePath}`
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const timestamp = new Date().toISOString()
    
    // AWS Signature Version 4
    const region = 'auto'
    const service = 's3'
    
    // Create signature
    const dateStamp = (timestamp.split('T')[0] || '').replace(/-/g, '')
    const amzDate = timestamp.replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    // Step 1: Create canonical request
    const payloadHash = await this.sha256(arrayBuffer)
    const canonicalHeaders = `host:${accountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
    const canonicalRequest = `PUT\n/${bucketName}/${filePath}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
    
    // Step 2: Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const canonicalRequestHash = await this.sha256(new TextEncoder().encode(canonicalRequest))
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`
    
    // Step 3: Calculate signature
    const signingKey = await this.getSignatureKey(secretAccessKey, dateStamp, region, service)
    const signature = await this.hmac(signingKey, new TextEncoder().encode(stringToSign))
    
    // Step 4: Create authorization header
    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    
    // Upload to R2
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: arrayBuffer
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('R2 upload error:', errorText)
      throw new Error(`Failed to upload to R2: ${response.status} ${response.statusText}`)
    }
    
    // Return public URL
    return `${publicUrl}/${filePath}`
  }

  // Helper: SHA256 hash
  private async sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
    const arrayBuffer: ArrayBuffer = data instanceof Uint8Array ? data.buffer.slice(0) as ArrayBuffer : data
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Helper: HMAC-SHA256
  private async hmac(key: ArrayBuffer, data: Uint8Array): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const arrayBuffer: ArrayBuffer = data.buffer.slice(0) as ArrayBuffer
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, arrayBuffer)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Helper: Get AWS Signature V4 signing key
  private async getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
    const kDate = await this.hmacBuffer(new TextEncoder().encode(`AWS4${key}`).buffer, new TextEncoder().encode(dateStamp))
    const kRegion = await this.hmacBuffer(kDate, new TextEncoder().encode(region))
    const kService = await this.hmacBuffer(kRegion, new TextEncoder().encode(service))
    const kSigning = await this.hmacBuffer(kService, new TextEncoder().encode('aws4_request'))
    return kSigning
  }

  // Helper: HMAC that returns ArrayBuffer
  private async hmacBuffer(key: ArrayBuffer, data: Uint8Array): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const arrayBuffer: ArrayBuffer = data.buffer.slice(0) as ArrayBuffer
    return await crypto.subtle.sign('HMAC', cryptoKey, arrayBuffer)
  }

  /**
   * Get all attachments for an ITR
   */
  async getAttachments(itrId: string) {
    const { data, error } = await supabase
      .from('construction_itr_attachments')
      .select('*')
      .eq('itr_id', itrId)
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching attachments:', error)
      throw new Error(`Failed to fetch attachments: ${error.message}`)
    }
    
    // Transform snake_case to camelCase for frontend
    return (data || []).map(att => ({
      id: att.id,
      itrId: att.itr_id,
      attachmentType: att.attachment_type,
      fileName: att.file_name,
      fileUrl: att.file_url,
      fileSize: att.file_size,
      mimeType: att.mime_type,
      description: att.description,
      uploadedBy: att.uploaded_by,
      uploadedAt: att.uploaded_at,
      createdAt: att.created_at,
      updatedAt: att.updated_at
    }))
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('construction_itr_attachments')
      .delete()
      .eq('id', attachmentId)
    
    if (error) {
      console.error('Error deleting attachment:', error)
      throw new Error(`Failed to delete attachment: ${error.message}`)
    }
  }
}

export const constructionITRService = new ConstructionITRService()
