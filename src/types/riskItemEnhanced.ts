/**
 * Enhanced TypeScript interfaces for Risk Items with Junction Table approach
 * 
 * This design ensures:
 * 1. Risk item name changes won't affect existing patrol records
 * 2. Multi-select filtering is optimized and efficient
 * 3. Proper normalization with foreign key relationships
 * 4. Individual risk assessment per item within each patrol
 */

export interface RiskItem {
  id: number;                    // Auto-incrementing primary key
  itemName: string;              // Current display name
  itemNameTh?: string;           // Thai name (future i18n)
  itemNameEn?: string;           // English name (future i18n)
  itemCode?: string;             // Short code like 'SCAFFOLD', 'ELEC_PANEL'
  color: string;                 // Hex color for UI
  icon?: string;                 // Emoji or icon class
  backgroundColor?: string;      // Background color for badges
  description?: string;
  category: 'equipment' | 'procedure' | 'environmental';
  isHighPriority: boolean;
  requiresImmediateAttention: boolean;
  escalationLevel: 'none' | 'supervisor' | 'manager' | 'executive';
  sortOrder: number;
  itemGroup?: string;            // Sub-grouping within categories
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolRiskItem {
  id: string;
  patrolId: string;
  riskItemId: number;
  isPrimary: boolean;            // Mark the main item
  severityLevel?: number;        // Item-specific severity (1-4)
  likelihoodLevel?: number;      // Item-specific likelihood (1-4)
  riskScore?: number;            // Calculated: severity × likelihood
  notes?: string;               // Item-specific notes
  actionRequired?: string;       // Specific action for this item
  createdAt: string;
}

// Enhanced SafetyPatrol interface with risk items
export interface SafetyPatrolWithRiskItems {
  id: string;
  title: string;
  description: string;
  patrolNumber: string;
  patrolDate: string;
  riskScore: number;
  status: 'open' | 'in_progress' | 'verified' | 'closed';
  
  // Risk item relationships
  riskItems: RiskItemInPatrol[];        // Populated from junction table
  primaryRiskItem?: RiskItemInPatrol;   // The main item
  riskItemIds: number[];               // For easy filtering
  highPriorityItemsCount: number;      // Count of high priority items
  
  // Location data
  locationMainAreaId?: number;
  locationSubArea1Id?: number;
  locationSubArea2Id?: number;
  
  createdAt: string;
  updatedAt: string;
}

// Risk item with patrol-specific data
export interface RiskItemInPatrol extends RiskItem {
  // Junction table data
  isPrimary: boolean;
  severityLevel?: number;
  likelihoodLevel?: number;
  riskScore?: number;
  notes?: string;
  actionRequired?: string;
}

// API functions for risk items
export interface RiskItemAPI {
  // Get all active items
  getActiveRiskItems(): Promise<RiskItem[]>;
  
  // Get items by category
  getRiskItemsByCategory(category: 'equipment' | 'procedure' | 'environmental'): Promise<RiskItem[]>;
  
  // Create new item
  createRiskItem(item: Omit<RiskItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskItem>;
  
  // Update item (name changes won't affect existing patrols)
  updateRiskItem(id: number, updates: Partial<RiskItem>): Promise<RiskItem>;
  
  // Get patrols by item filter
  getPatrolsByRiskItems(itemIds: number[]): Promise<SafetyPatrolWithRiskItems[]>;
  
  // Add items to patrol
  addRiskItemsToPatrol(patrolId: string, itemIds: number[], primaryItemId?: number): Promise<void>;
  
  // Update risk assessment for specific item in patrol
  updatePatrolRiskItemAssessment(
    patrolId: string, 
    riskItemId: number, 
    assessment: {
      severityLevel: number;
      likelihoodLevel: number;
      notes?: string;
      actionRequired?: string;
    }
  ): Promise<void>;
}

// Frontend filtering implementation
export class RiskItemFilter {
  // Multi-select item filter (requirement #2)
  static filterPatrolsByRiskItems(
    patrols: SafetyPatrolWithRiskItems[], 
    itemIds: number[]
  ): SafetyPatrolWithRiskItems[] {
    if (itemIds.length === 0) return patrols;
    
    return patrols.filter(patrol => 
      patrol.riskItemIds.some(id => itemIds.includes(id))
    );
  }
  
  // Filter by category
  static filterPatrolsByItemCategory(
    patrols: SafetyPatrolWithRiskItems[],
    category: 'equipment' | 'procedure' | 'environmental'
  ): SafetyPatrolWithRiskItems[] {
    return patrols.filter(patrol =>
      patrol.riskItems.some(item => item.category === category)
    );
  }
  
  // Filter by high priority items
  static filterPatrolsByHighPriorityItems(
    patrols: SafetyPatrolWithRiskItems[]
  ): SafetyPatrolWithRiskItems[] {
    return patrols.filter(patrol => patrol.highPriorityItemsCount > 0);
  }
  
  // Filter by risk score threshold
  static filterPatrolsByRiskScore(
    patrols: SafetyPatrolWithRiskItems[],
    minRiskScore: number
  ): SafetyPatrolWithRiskItems[] {
    return patrols.filter(patrol =>
      patrol.riskItems.some(item => (item.riskScore || 0) >= minRiskScore)
    );
  }
  
  // Item management that won't affect existing records (requirement #1)
  static async updateItemName(
    api: RiskItemAPI, 
    itemId: number, 
    newName: string
  ): Promise<RiskItem> {
    // This only updates the master table - existing patrol records unaffected
    return await api.updateRiskItem(itemId, { itemName: newName });
  }
}

// Sample data with proper typing
export const sampleRiskItems: Omit<RiskItem, 'createdAt' | 'updatedAt'>[] = [
  // Equipment - Height Work
  {
    id: 1,
    itemName: "Scaffolding Safety",
    itemNameTh: "ความปลอดภัยนั่งร้าน",
    itemNameEn: "Scaffolding Safety",
    itemCode: "SCAFFOLD",
    color: "#3B82F6",
    icon: "🏗️",
    category: "equipment",
    isHighPriority: true,
    requiresImmediateAttention: false,
    escalationLevel: "supervisor",
    sortOrder: 1,
    itemGroup: "Height Work",
    isActive: true,
  },
  {
    id: 2,
    itemName: "Fall Protection",
    itemNameTh: "อุปกรณ์ป้องกันการตก",
    itemNameEn: "Fall Protection",
    itemCode: "FALL_PROT",
    color: "#8B5CF6",
    icon: "🦺",
    category: "equipment",
    isHighPriority: true,
    requiresImmediateAttention: true,
    escalationLevel: "manager",
    sortOrder: 3,
    itemGroup: "Height Work",
    isActive: true,
  },
  
  // Equipment - Electrical
  {
    id: 4,
    itemName: "Electrical Panel",
    itemNameTh: "ตู้ไฟฟ้า",
    itemNameEn: "Electrical Panel",
    itemCode: "ELEC_PANEL",
    color: "#EAB308",
    icon: "⚡",
    category: "equipment",
    isHighPriority: true,
    requiresImmediateAttention: true,
    escalationLevel: "executive",
    sortOrder: 4,
    itemGroup: "Electrical",
    isActive: true,
  },
  
  // Procedure - Permits
  {
    id: 10,
    itemName: "Hot Work Permit",
    itemNameTh: "ใบอนุญาตงานร้อน",
    itemNameEn: "Hot Work Permit",
    itemCode: "HOT_PERMIT",
    color: "#EA580C",
    icon: "🔥",
    category: "procedure",
    isHighPriority: true,
    requiresImmediateAttention: true,
    escalationLevel: "manager",
    sortOrder: 10,
    itemGroup: "Permits",
    isActive: true,
  },
  {
    id: 11,
    itemName: "Confined Space Entry",
    itemNameTh: "การเข้าพื้นที่จำกัด",
    itemNameEn: "Confined Space Entry",
    itemCode: "CONF_SPACE",
    color: "#7C2D12",
    icon: "🚪",
    category: "procedure",
    isHighPriority: true,
    requiresImmediateAttention: true,
    escalationLevel: "executive",
    sortOrder: 11,
    itemGroup: "Permits",
    isActive: true,
  },
  
  // Environmental
  {
    id: 16,
    itemName: "Noise Levels",
    itemNameTh: "ระดับเสียง",
    itemNameEn: "Noise Levels",
    itemCode: "NOISE",
    color: "#6366F1",
    icon: "🔊",
    category: "environmental",
    isHighPriority: false,
    requiresImmediateAttention: false,
    escalationLevel: "supervisor",
    sortOrder: 16,
    itemGroup: "Exposure",
    isActive: true,
  }
];

// Filter options interface for UI components
export interface RiskItemFilterOption {
  id: number;
  name: string;
  category: 'equipment' | 'procedure' | 'environmental';
  color: string;
  icon?: string;
  isHighPriority: boolean;
  count?: number; // Number of patrols with this item
}

// Utility functions for frontend
export class RiskItemUtils {
  static toItemFilterOptions(items: RiskItem[]): RiskItemFilterOption[] {
    return items.map(item => ({
      id: item.id,
      name: item.itemName, // This can change without affecting patrols!
      category: item.category,
      color: item.color,
      icon: item.icon,
      isHighPriority: item.isHighPriority
    }));
  }
  
  static getHighPriorityItems(items: RiskItem[]): RiskItem[] {
    return items.filter(item => item.isHighPriority);
  }
  
  static getItemsByCategory(items: RiskItem[], category: 'equipment' | 'procedure' | 'environmental'): RiskItem[] {
    return items.filter(item => item.category === category);
  }
  
  static getItemsByGroup(items: RiskItem[], group: string): RiskItem[] {
    return items.filter(item => item.itemGroup === group);
  }
  
  static calculatePatrolRiskScore(patrolItems: RiskItemInPatrol[]): number {
    const itemScores = patrolItems
      .map(item => item.riskScore || 0)
      .filter(score => score > 0);
    
    if (itemScores.length === 0) return 0;
    
    // Return highest individual risk score
    return Math.max(...itemScores);
  }
  
  static getUniqueCategories(items: RiskItem[]): Array<'equipment' | 'procedure' | 'environmental'> {
    const categories = new Set(items.map(item => item.category));
    return Array.from(categories);
  }
  
  static getUniqueGroups(items: RiskItem[]): string[] {
    const groups = new Set(items.map(item => item.itemGroup).filter(Boolean));
    return Array.from(groups) as string[];
  }
}

// Risk assessment helpers
export class RiskAssessmentUtils {
  static calculateRiskScore(severityLevel: number, likelihoodLevel: number): number {
    return severityLevel * likelihoodLevel;
  }
  
  static getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'extremely_high' {
    if (riskScore >= 16) return 'extremely_high';
    if (riskScore >= 12) return 'high';
    if (riskScore >= 6) return 'medium';
    return 'low';
  }
  
  static getRiskColor(riskScore: number): string {
    const level = this.getRiskLevel(riskScore);
    const colors = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#F97316',
      'extremely_high': '#EF4444'
    };
    return colors[level];
  }
  
  static requiresImmediateAction(item: RiskItemInPatrol): boolean {
    return item.requiresImmediateAttention || (item.riskScore || 0) >= 16;
  }
}
