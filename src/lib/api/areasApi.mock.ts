import type { MainArea, SubArea1, SubArea2 } from '../../types';

// Mock data storage - Updated to use real project IDs from database
const mockMainAreas: MainArea[] = [
  {
    id: 'main-1',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    name: 'Building A',
    code: 'BA',
    description: 'Main office building',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  },
  {
    id: 'main-2',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    name: 'Building B',
    code: 'BB',
    description: 'Secondary office building',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  },
  {
    id: 'main-3',
    project_id: '956f0ecb-1eb5-45a2-b961-f7db9d4ebee5', // Underground Utility Tunnel
    name: 'Warehouse',
    code: 'WH',
    description: 'Storage and logistics area',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  }
];

const mockSubAreas1: SubArea1[] = [
  {
    id: 'sub1-1',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    main_area_id: 'main-1',
    name: 'Floor 1',
    code: 'F1',
    description: 'Ground floor of Building A',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  },
  {
    id: 'sub1-2',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    main_area_id: 'main-1',
    name: 'Floor 2',
    code: 'F2',
    description: 'Second floor of Building A',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  }
];

const mockSubAreas2: SubArea2[] = [
  {
    id: 'sub2-1',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    main_area_id: 'main-1',
    sub_area1_id: 'sub1-1',
    name: 'Room 101',
    code: '101',
    description: 'Office room 101',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  },
  {
    id: 'sub2-2',
    project_id: '4e8bdada-960e-4cde-a94c-ccfa94a133d7', // Downtown Office Complex
    main_area_id: 'main-1',
    sub_area1_id: 'sub1-1',
    name: 'Room 102',
    code: '102',
    description: 'Office room 102',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'mock-user'
  }
];

// Utility function to generate area codes
function generateAreaCode(name: string): string {
  // Extract numbers first
  const numbers = name.match(/\d+/g);
  if (numbers) {
    return numbers.join('');
  }
  
  // Extract initials from words
  const words = name.split(/\s+/).filter(word => word.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  return words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 4);
}

// ==================== MAIN AREAS API ====================

export async function getMainAreas(projectId: string): Promise<MainArea[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const areas = mockMainAreas.filter(area => area.project_id === projectId);
  console.log(`[AREAS_API] Getting main areas for project ${projectId}:`, areas.length);
  return areas;
}

export async function searchMainAreas(projectId: string, query: string = ''): Promise<MainArea[]> {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  let areas = mockMainAreas.filter(area => area.project_id === projectId);
  
  if (query.trim()) {
    areas = areas.filter(area => 
      area.name.toLowerCase().includes(query.toLowerCase()) ||
      area.code?.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  console.log(`[AREAS_API] Searching main areas for "${query}":`, areas.length);
  return areas;
}

export async function createMainArea(data: {
  project_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<MainArea> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Check if area already exists
  const existingArea = mockMainAreas.find(area =>
    area.project_id === data.project_id &&
    area.name.toLowerCase() === data.name.toLowerCase()
  );
  
  if (existingArea) {
    console.log(`[AREAS_API] Main area "${data.name}" already exists:`, existingArea);
    return existingArea;
  }
  
  const newArea: MainArea = {
    id: `main-${Date.now()}`,
    project_id: data.project_id,
    name: data.name.trim(),
    code: data.code || generateAreaCode(data.name),
    description: data.description || `Main area: ${data.name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'mock-user'
  };
  
  mockMainAreas.push(newArea);
  console.log(`[AREAS_API] Created main area:`, newArea);
  return newArea;
}

// ==================== SUB AREAS 1 API ====================

export async function getSubAreas1(projectId: string, mainAreaId?: string): Promise<SubArea1[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let areas = mockSubAreas1.filter(area => area.project_id === projectId);
  
  if (mainAreaId) {
    areas = areas.filter(area => area.main_area_id === mainAreaId);
  }
  
  console.log(`[AREAS_API] Getting sub areas 1 for project ${projectId}, main area ${mainAreaId}:`, areas.length);
  return areas;
}

export async function createSubArea1(data: {
  project_id: string;
  main_area_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<SubArea1> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Check if sub area already exists
  const existingArea = mockSubAreas1.find(area =>
    area.main_area_id === data.main_area_id &&
    area.name.toLowerCase() === data.name.toLowerCase()
  );
  
  if (existingArea) {
    console.log(`[AREAS_API] Sub area 1 "${data.name}" already exists:`, existingArea);
    return existingArea;
  }
  
  const newArea: SubArea1 = {
    id: `sub1-${Date.now()}`,
    project_id: data.project_id,
    main_area_id: data.main_area_id,
    name: data.name.trim(),
    code: data.code || generateAreaCode(data.name),
    description: data.description || `Sub area 1: ${data.name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'mock-user'
  };
  
  mockSubAreas1.push(newArea);
  console.log(`[AREAS_API] Created sub area 1:`, newArea);
  return newArea;
}

// ==================== SUB AREAS 2 API ====================

export async function getSubAreas2(projectId: string, subArea1Id?: string): Promise<SubArea2[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let areas = mockSubAreas2.filter(area => area.project_id === projectId);
  
  if (subArea1Id) {
    areas = areas.filter(area => area.sub_area1_id === subArea1Id);
  }
  
  console.log(`[AREAS_API] Getting sub areas 2 for project ${projectId}, sub area 1 ${subArea1Id}:`, areas.length);
  return areas;
}

export async function createSubArea2(data: {
  project_id: string;
  main_area_id: string;
  sub_area1_id: string;
  name: string;
  code?: string;
  description?: string;
}): Promise<SubArea2> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Check if sub area already exists
  const existingArea = mockSubAreas2.find(area =>
    area.sub_area1_id === data.sub_area1_id &&
    area.name.toLowerCase() === data.name.toLowerCase()
  );
  
  if (existingArea) {
    console.log(`[AREAS_API] Sub area 2 "${data.name}" already exists:`, existingArea);
    return existingArea;
  }
  
  const newArea: SubArea2 = {
    id: `sub2-${Date.now()}`,
    project_id: data.project_id,
    main_area_id: data.main_area_id,
    sub_area1_id: data.sub_area1_id,
    name: data.name.trim(),
    code: data.code || generateAreaCode(data.name),
    description: data.description || `Sub area 2: ${data.name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'mock-user'
  };
  
  mockSubAreas2.push(newArea);
  console.log(`[AREAS_API] Created sub area 2:`, newArea);
  return newArea;
}

// ==================== CLEANUP FUNCTIONS ====================

export async function cleanupDuplicateAreas(projectId: string): Promise<void> {
  console.log(`[AREAS_API] Cleaning up duplicates for project ${projectId}`);
  
  // Clean main areas
  const mainAreaGroups = new Map<string, MainArea[]>();
  mockMainAreas.filter(area => area.project_id === projectId).forEach(area => {
    const key = area.name.toLowerCase();
    if (!mainAreaGroups.has(key)) mainAreaGroups.set(key, []);
    mainAreaGroups.get(key)!.push(area);
  });
  
  let removedCount = 0;
  mainAreaGroups.forEach(areas => {
    if (areas.length > 1) {
      areas.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 1; i < areas.length; i++) {
        const index = mockMainAreas.findIndex(area => area.id === areas[i].id);
        if (index !== -1) {
          mockMainAreas.splice(index, 1);
          removedCount++;
        }
      }
    }
  });
  
  console.log(`[AREAS_API] Cleanup complete. Removed ${removedCount} duplicates.`);
}
