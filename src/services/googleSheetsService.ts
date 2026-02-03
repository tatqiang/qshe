/**
 * Google Sheets Service
 * Handles reading and writing construction project data to/from Google Sheets
 */

import { googleAuthService } from './googleAuthService'
import type { ConstructionProject, ConstructionTask } from '../types/construction-project'

export interface SheetRange {
  range: string
  values: any[][]
}

class GoogleSheetsService {
  private readonly SHEET_NAME = 'Construction Project'
  private readonly TASKS_START_ROW = 2 // Header row is 1

  /**
   * Create a new Google Sheet for a construction project
   */
  async createProjectSheet(project: ConstructionProject): Promise<string> {
    const client = googleAuthService.getGapiClient()
    
    // Create a new spreadsheet
    const response = await client.sheets.spreadsheets.create({
      properties: {
        title: project.name
      },
      sheets: [
        {
          properties: {
            title: this.SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 20
            }
          }
        }
      ]
    })

    const spreadsheetId = response.result.spreadsheetId

    // Write project data to the sheet
    await this.writeProjectToSheet(spreadsheetId, project)

    return spreadsheetId
  }

  /**
   * Write project data to an existing Google Sheet
   */
  async writeProjectToSheet(spreadsheetId: string, project: ConstructionProject): Promise<void> {
    const client = googleAuthService.getGapiClient()

    // Prepare header row
    const headers = [
      'Task ID',
      'Task Name',
      'Type',
      'Start Date',
      'End Date',
      'Progress (%)',
      'Status',
      'Priority',
      'Dependencies',
      'Assignee',
      'Description',
      'Cost',
      'Actual Start',
      'Actual End',
      'Location',
      'Crew',
      'Equipment',
      'Materials',
      'Notes'
    ]

    // Prepare task rows
    const taskRows = project.tasks.map(task => [
      task.id,
      task.name,
      task.type,
      task.start.toISOString().split('T')[0],
      task.end.toISOString().split('T')[0],
      task.progress,
      task.status,
      task.priority,
      task.dependencies.join(', '),
      task.assignee || '',
      task.description || '',
      task.cost || '',
      task.actualStart?.toISOString().split('T')[0] || '',
      task.actualEnd?.toISOString().split('T')[0] || '',
      task.location || '',
      task.crew || '',
      task.equipment?.join(', ') || '',
      task.materials?.join(', ') || '',
      task.notes || ''
    ])

    // Write data to sheet
    const range = `${this.SHEET_NAME}!A1:S${taskRows.length + 1}`
    await client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers, ...taskRows]
      }
    })

    // Apply formatting
    await this.formatSheet(spreadsheetId)
  }

  /**
   * Read project data from Google Sheet
   */
  async readProjectFromSheet(spreadsheetId: string): Promise<Partial<ConstructionProject>> {
    const client = googleAuthService.getGapiClient()

    // Get spreadsheet metadata
    const spreadsheet = await client.sheets.spreadsheets.get({
      spreadsheetId
    })

    const projectName = spreadsheet.result.properties.title

    // Read all task data
    const range = `${this.SHEET_NAME}!A2:S1000` // Read up to 1000 rows
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    })

    const rows = response.result.values || []

    if (rows.length === 0) {
      throw new Error('No data found in sheet')
    }

    // Parse tasks
    const tasks: ConstructionTask[] = rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      type: row[2] as any || 'task',
      start: new Date(row[3] || new Date()),
      end: new Date(row[4] || new Date()),
      progress: Number(row[5]) || 0,
      status: row[6] as any || 'not-started',
      priority: row[7] as any || 'medium',
      dependencies: row[8] ? row[8].split(',').map((d: string) => d.trim()) : [],
      assignee: row[9] || undefined,
      description: row[10] || undefined,
      cost: row[11] ? Number(row[11]) : undefined,
      actualStart: row[12] ? new Date(row[12]) : undefined,
      actualEnd: row[13] ? new Date(row[13]) : undefined,
      location: row[14] || undefined,
      crew: row[15] || undefined,
      equipment: row[16] ? row[16].split(',').map((e: string) => e.trim()) : undefined,
      materials: row[17] ? row[17].split(',').map((m: string) => m.trim()) : undefined,
      notes: row[18] || undefined
    }))

    // Calculate project dates from tasks
    const startDate = new Date(Math.min(...tasks.map(t => t.start.getTime())))
    const endDate = new Date(Math.max(...tasks.map(t => t.end.getTime())))

    return {
      name: projectName,
      startDate,
      endDate,
      tasks,
      googleSheetId: spreadsheetId,
      lastSynced: new Date()
    }
  }

  /**
   * Update specific task in Google Sheet
   */
  async updateTask(spreadsheetId: string, taskId: string, updates: Partial<ConstructionTask>): Promise<void> {
    const client = googleAuthService.getGapiClient()

    // Find the row for this task
    const range = `${this.SHEET_NAME}!A2:A1000`
    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    })

    const rows = response.result.values || []
    const rowIndex = rows.findIndex((row: any[]) => row[0] === taskId)

    if (rowIndex === -1) {
      throw new Error(`Task ${taskId} not found in sheet`)
    }

    // Prepare update values based on what changed
    const updateRequests: any[] = []

    if (updates.progress !== undefined) {
      updateRequests.push({
        range: `${this.SHEET_NAME}!F${rowIndex + 2}`,
        values: [[updates.progress]]
      })
    }

    if (updates.status !== undefined) {
      updateRequests.push({
        range: `${this.SHEET_NAME}!G${rowIndex + 2}`,
        values: [[updates.status]]
      })
    }

    if (updates.actualStart !== undefined) {
      updateRequests.push({
        range: `${this.SHEET_NAME}!M${rowIndex + 2}`,
        values: [[updates.actualStart.toISOString().split('T')[0]]]
      })
    }

    if (updates.actualEnd !== undefined) {
      updateRequests.push({
        range: `${this.SHEET_NAME}!N${rowIndex + 2}`,
        values: [[updates.actualEnd.toISOString().split('T')[0]]]
      })
    }

    // Batch update all changes
    if (updateRequests.length > 0) {
      await client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: updateRequests
        }
      })
    }
  }

  /**
   * Format the sheet with colors and styling
   */
  private async formatSheet(spreadsheetId: string): Promise<void> {
    const client = googleAuthService.getGapiClient()

    const requests = [
      // Format header row
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.5, blue: 0.53 },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true
              },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 19
          }
        }
      }
    ]

    await client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests
      }
    })
  }

  /**
   * Get the URL to view the sheet in browser
   */
  getSheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  }

  /**
   * Share sheet with specific email addresses
   */
  async shareSheet(spreadsheetId: string, emails: string[], role: 'reader' | 'writer' | 'owner' = 'writer'): Promise<void> {
    const client = googleAuthService.getGapiClient()

    for (const email of emails) {
      await client.drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          type: 'user',
          role: role,
          emailAddress: email
        },
        sendNotificationEmail: true
      })
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService()
