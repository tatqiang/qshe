import type { ProjectArea } from '../../types';

// Mock data for testing hierarchical areas - properly nested by project
const mockAreas: ProjectArea[] = [
  // Main Areas (Level 1)
  {
    id: '1',
    projectId: 'project-123',
    areaCode: 'BA',
    areaName: 'Building A',
    description: 'Main office building',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '2',
    projectId: 'project-123',
    areaCode: 'BB',
    areaName: 'Building B',
    description: 'Secondary office building',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '3',
    projectId: 'project-123',
    areaCode: 'WH',
    areaName: 'Warehouse',
    description: 'Storage and logistics area',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '4',
    projectId: 'project-123',
    areaCode: 'OD',
    areaName: 'Outdoor Areas',
    description: 'External areas and parking',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },

  // Building A - Sub Areas (Level 2)
  {
    id: '11',
    projectId: 'project-123',
    areaCode: 'BA',
    areaName: 'Building A',
    subArea1Code: 'F1',
    subArea1Name: 'Floor 1',
    description: 'Ground floor of Building A',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '12',
    projectId: 'project-123',
    areaCode: 'BA',
    areaName: 'Building A',
    subArea1Code: 'F2',
    subArea1Name: 'Floor 2',
    description: 'Second floor of Building A',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '13',
    projectId: 'project-123',
    areaCode: 'BA',
    areaName: 'Building A',
    subArea1Code: 'F3',
    subArea1Name: 'Floor 3',
    description: 'Third floor of Building A',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },

  // Building A, Floor 1 - Rooms (Level 3)
  {
    id: '111',
    projectId: 'project-123',
    areaCode: 'BA',
    areaName: 'Building A',
    subArea1Code: 'F1',
    subArea1Name: 'Floor 1',
    subArea2Code: '101',
    subArea2Name: 'Room 101',
    description: 'Office room 101',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '5',
    projectId: 'project-123',
    areaCode: 'YARD',
    areaName: 'Landscape Yard',
    description: 'Outdoor landscaping area',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  },
  {
    id: '6',
    projectId: 'project-123',
    areaCode: 'YARD',
    areaName: 'Landscape Yard',
    subArea1Code: 'ZA',
    subArea1Name: 'Zone A',
    description: 'Zone A in landscape yard',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'mock-user'
  }
];

export interface CreateProjectAreaData {
  projectId: string;
  areaCode: string;
  areaName: string;
  subArea1Code?: string;
  subArea1Name?: string;
  subArea2Code?: string;
  subArea2Name?: string;
  description?: string;
}

export interface SearchAreasParams {
  projectId: string;
  query: string;
  limit?: number;
}

/**
 * Mock search function - simulates database search with fuzzy matching
 */
export async function searchProjectAreas({
  projectId,
  query,
  limit = 10
}: SearchAreasParams): Promise<ProjectArea[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!query.trim()) {
    // Return recent areas if no query
    return mockAreas
      .filter(area => area.projectId === projectId)
      .slice(0, limit);
  }

  // Simulate fuzzy search across all hierarchical levels
  const results = mockAreas
    .filter(area => area.projectId === projectId)
    .filter(area => {
      const queryLower = query.toLowerCase();
      return (
        area.areaName.toLowerCase().includes(queryLower) ||
        area.areaCode.toLowerCase().includes(queryLower) ||
        (area.subArea1Name && area.subArea1Name.toLowerCase().includes(queryLower)) ||
        (area.subArea1Code && area.subArea1Code.toLowerCase().includes(queryLower)) ||
        (area.subArea2Name && area.subArea2Name.toLowerCase().includes(queryLower)) ||
        (area.subArea2Code && area.subArea2Code.toLowerCase().includes(queryLower))
      );
    })
    .slice(0, limit);

  console.log(`[MOCK] Searching areas for "${query}":`, results);
  return results;
}

/**
 * Mock create function - simulates creating new areas
 */
export async function createProjectArea(data: CreateProjectAreaData): Promise<ProjectArea | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if area already exists (mock duplicate prevention)
  const existing = mockAreas.find(area => 
    area.projectId === data.projectId && 
    (area.areaName.toLowerCase() === data.areaName.toLowerCase() ||
     area.areaCode.toLowerCase() === data.areaCode.toLowerCase())
  );

  if (existing) {
    console.log(`[MOCK] Area already exists:`, existing);
    return existing;
  }

  // Create new area
  const newArea: ProjectArea = {
    id: `mock-${Date.now()}`,
    projectId: data.projectId,
    areaCode: data.areaCode,
    areaName: data.areaName,
    description: data.description || `Auto-created area: ${data.areaName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'mock-user'
  };

  // Add to mock storage
  mockAreas.push(newArea);
  
  console.log(`[MOCK] Created new area:`, newArea);
  return newArea;
}

/**
 * Mock get all areas function
 */
export async function getProjectAreas(projectId: string): Promise<ProjectArea[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const areas = mockAreas.filter(area => area.projectId === projectId);
  console.log(`[MOCK] Getting all areas for project ${projectId}:`, areas);
  return areas;
}

/**
 * Mock function to create hierarchical sub areas
 */
export async function createHierarchicalArea(
  projectId: string,
  mainAreaName: string,
  subArea1Name?: string,
  subArea2Name?: string
): Promise<ProjectArea | null> {
  console.log(`[MOCK] Creating hierarchical area: ${mainAreaName} > ${subArea1Name || ''} > ${subArea2Name || ''}`);

  // First check if main area exists (don't create it if it doesn't exist!)
  let mainArea = mockAreas.find(area =>
    area.projectId === projectId &&
    area.areaName.toLowerCase() === mainAreaName.toLowerCase() &&
    !area.subArea1Name && // This is a main area only (no sub areas)
    !area.subArea2Name
  );

  if (!mainArea) {
    console.error(`[MOCK] Main area "${mainAreaName}" does not exist. Cannot create sub areas for non-existent main area.`);
    return null;
  }

  console.log(`[MOCK] Using existing main area:`, mainArea);

  // If only main area requested, return it
  if (!subArea1Name?.trim()) {
    return mainArea;
  }

  // Create or find sub area 1
  const subArea1 = {
    id: `mock-${Date.now()}-sub1`,
    projectId,
    areaCode: mainArea.areaCode,
    areaName: mainAreaName,
    subArea1Code: generateAreaCode(subArea1Name),
    subArea1Name: subArea1Name.trim(),
    description: `Sub area: ${mainAreaName} > ${subArea1Name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'mock-user'
  };

  // Check if this sub area 1 already exists
  const existingSubArea1 = mockAreas.find(area =>
    area.projectId === projectId &&
    area.areaName.toLowerCase() === mainAreaName.toLowerCase() &&
    area.subArea1Name?.toLowerCase() === subArea1Name.toLowerCase() &&
    !area.subArea2Name
  );

  let finalSubArea1: ProjectArea;
  if (!existingSubArea1) {
    mockAreas.push(subArea1);
    finalSubArea1 = subArea1;
    console.log(`[MOCK] Created new sub area 1:`, subArea1);
  } else {
    finalSubArea1 = existingSubArea1;
    console.log(`[MOCK] Found existing sub area 1:`, existingSubArea1);
  }

  // If only sub area 1 requested, return it
  if (!subArea2Name?.trim()) {
    return finalSubArea1;
  }

  // Create sub area 2
  const subArea2 = {
    id: `mock-${Date.now()}-sub2`,
    projectId,
    areaCode: mainArea.areaCode,
    areaName: mainAreaName,
    subArea1Code: finalSubArea1.subArea1Code,
    subArea1Name: finalSubArea1.subArea1Name,
    subArea2Code: generateAreaCode(subArea2Name),
    subArea2Name: subArea2Name.trim(),
    description: `Sub area: ${mainAreaName} > ${subArea1Name} > ${subArea2Name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'mock-user'
  };

  // Check if this sub area 2 already exists
  const existingSubArea2 = mockAreas.find(area =>
    area.projectId === projectId &&
    area.areaName.toLowerCase() === mainAreaName.toLowerCase() &&
    area.subArea1Name?.toLowerCase() === subArea1Name.toLowerCase() &&
    area.subArea2Name?.toLowerCase() === subArea2Name.toLowerCase()
  );

  if (!existingSubArea2) {
    mockAreas.push(subArea2);
    console.log(`[MOCK] Created new sub area 2:`, subArea2);
    return subArea2;
  } else {
    console.log(`[MOCK] Found existing sub area 2:`, existingSubArea2);
    return existingSubArea2;
  }
}

/**
 * Mock find or create function - this is the key function for auto-creation
 */
export async function findOrCreateProjectArea(
  projectId: string,
  areaName: string,
  areaCode?: string
): Promise<ProjectArea | null> {
  console.log(`[MOCK] Finding or creating area "${areaName}" for project ${projectId}`);

  // First, try to find existing area by exact name match
  const existingArea = mockAreas.find(area =>
    area.projectId === projectId &&
    area.areaName.toLowerCase() === areaName.toLowerCase()
  );

  if (existingArea) {
    console.log(`[MOCK] Found existing area:`, existingArea);
    return existingArea;
  }

  // If not found, create a new area
  const generatedCode = areaCode || generateAreaCode(areaName);
  
  return await createProjectArea({
    projectId,
    areaCode: generatedCode,
    areaName: areaName.trim(),
    description: `Auto-created area: ${areaName}`
  });
}

/**
 * Generate area code from area name
 */
function generateAreaCode(areaName: string): string {
  // Extract numbers from the area name (e.g., "Area 311" -> "311")
  const numbers = areaName.match(/\d+/);
  if (numbers) {
    return numbers[0];
  }
  
  // If no numbers, create code from first letters
  const words = areaName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  // Take first letter of each word, max 4 characters
  return words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4);
}

/**
 * Mock update function
 */
export async function updateProjectArea(
  areaId: string,
  updates: Partial<CreateProjectAreaData>
): Promise<ProjectArea | null> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const areaIndex = mockAreas.findIndex(area => area.id === areaId);
  if (areaIndex === -1) {
    console.log(`[MOCK] Area not found for update: ${areaId}`);
    return null;
  }

  // Update the area
  mockAreas[areaIndex] = {
    ...mockAreas[areaIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  console.log(`[MOCK] Updated area:`, mockAreas[areaIndex]);
  return mockAreas[areaIndex];
}

/**
 * Mock delete function
 */
export async function deleteProjectArea(areaId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const areaIndex = mockAreas.findIndex(area => area.id === areaId);
  if (areaIndex === -1) {
    console.log(`[MOCK] Area not found for deletion: ${areaId}`);
    return false;
  }

  const deletedArea = mockAreas.splice(areaIndex, 1)[0];
  console.log(`[MOCK] Deleted area:`, deletedArea);
  return true;
}

/**
 * Debug function to clean up duplicate areas
 */
export async function cleanupDuplicateAreas(projectId: string): Promise<void> {
  console.log(`[MOCK] Cleaning up duplicate areas for project ${projectId}`);
  
  // Group ALL areas by their key characteristics
  const areaGroups = new Map<string, ProjectArea[]>();
  
  mockAreas
    .filter(area => area.projectId === projectId)
    .forEach(area => {
      // Create a unique key for each area type
      let key: string;
      if (area.subArea2Name) {
        key = `${area.areaName}|${area.subArea1Name}|${area.subArea2Name}`;
      } else if (area.subArea1Name) {
        key = `${area.areaName}|${area.subArea1Name}|_SUB1_`;
      } else {
        key = `${area.areaName}|_MAIN_`;
      }
      
      if (!areaGroups.has(key)) {
        areaGroups.set(key, []);
      }
      areaGroups.get(key)!.push(area);
    });
  
  // Remove duplicates, keep the oldest one
  let removedCount = 0;
  areaGroups.forEach((areas, key) => {
    if (areas.length > 1) {
      console.log(`[MOCK] Found ${areas.length} duplicates for key: ${key}`);
      
      // Sort by creation date, keep the first one
      areas.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Remove duplicates
      for (let i = 1; i < areas.length; i++) {
        const index = mockAreas.findIndex(area => area.id === areas[i].id);
        if (index !== -1) {
          mockAreas.splice(index, 1);
          removedCount++;
          console.log(`[MOCK] Removed duplicate area:`, {
            id: areas[i].id,
            name: areas[i].areaName,
            subArea1: areas[i].subArea1Name || 'none',
            subArea2: areas[i].subArea2Name || 'none'
          });
        }
      }
    }
  });
  
  console.log(`[MOCK] Cleanup complete. Removed ${removedCount} duplicate areas.`);
}

// Auto-cleanup on import (development only)
if (process.env.NODE_ENV === 'development') {
  // Clean up duplicates when the module loads - for all projects
  setTimeout(async () => {
    // Get unique project IDs from existing areas
    const projectIds = [...new Set(mockAreas.map(area => area.projectId))];
    for (const projectId of projectIds) {
      await cleanupDuplicateAreas(projectId);
    }
  }, 1000);
}
