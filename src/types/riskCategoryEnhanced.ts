/**
 * TypeScript interfaces for the recommended junction table approach
 * 
 * This design ensures:
 * 1. Category name changes won't affect existing patrol records
 * 2. Multi-select filtering is optimized and efficient
 * 3. Proper normalization with foreign key relationships
 */

export interface RiskCategory {
  id: number;                    // Auto-incrementing primary key
  categoryName: string;          // Current display name
  categoryNameTh?: string;       // Thai name (future i18n)
  categoryNameEn?: string;       // English name (future i18n)
  categoryCode?: string;         // Short code like 'HW', 'ELEC'
  color: string;                 // Hex color for UI
  icon?: string;                 // Emoji or icon class
  backgroundColor?: string;      // Background color for badges
  description?: string;
  isHighRisk: boolean;
  requiresImmediateAction: boolean;
  escalationLevel: 'none' | 'supervisor' | 'manager' | 'executive';
  sortOrder: number;
  categoryGroup?: string;        // 'Equipment', 'Procedure', 'Environmental'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolRiskCategory {
  id: string;
  patrolId: string;
  riskCategoryId: number;
  isPrimary: boolean;            // Mark the main category
  severityLevel?: number;        // Category-specific severity (1-4)
  notes?: string;               // Category-specific notes
  createdAt: string;
}

// Enhanced SafetyPatrol interface
export interface SafetyPatrolWithCategories {
  id: string;
  title: string;
  location: string;
  description: string;
  riskScore: number;
  status: 'open' | 'in_progress' | 'closed';
  
  // Risk category relationships
  riskCategories: RiskCategory[];           // Populated from junction table
  primaryRiskCategory?: RiskCategory;       // The main category
  riskCategoryIds: number[];               // For easy filtering
  
  createdAt: string;
  updatedAt: string;
}

// API functions for risk categories
export interface RiskCategoryAPI {
  // Get all active categories
  getActiveCategories(): Promise<RiskCategory[]>;
  
  // Get categories by group
  getCategoriesByGroup(group: string): Promise<RiskCategory[]>;
  
  // Create new category
  createCategory(category: Omit<RiskCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskCategory>;
  
  // Update category (name changes won't affect existing patrols)
  updateCategory(id: number, updates: Partial<RiskCategory>): Promise<RiskCategory>;
  
  // Get patrols by category filter
  getPatrolsByCategories(categoryIds: number[]): Promise<SafetyPatrolWithCategories[]>;
}

// Frontend filtering implementation
export class PatrolFilter {
  // Multi-select category filter (your requirement #2)
  static filterPatrolsByCategories(
    patrols: SafetyPatrolWithCategories[], 
    categoryIds: number[]
  ): SafetyPatrolWithCategories[] {
    if (categoryIds.length === 0) return patrols;
    
    return patrols.filter(patrol => 
      patrol.riskCategoryIds.some(id => categoryIds.includes(id))
    );
  }
  
  // Category management that won't affect existing records (your requirement #1)
  static async updateCategoryName(
    api: RiskCategoryAPI, 
    categoryId: number, 
    newName: string
  ): Promise<RiskCategory> {
    // This only updates the master table - existing patrol records unaffected
    return await api.updateCategory(categoryId, { categoryName: newName });
  }
}

// Sample data with proper typing
export const sampleRiskCategories: Omit<RiskCategory, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 1,
    categoryName: "High Work",           // Can change to "งานที่ความสูง" later
    categoryNameTh: "งานที่ความสูง",
    categoryNameEn: "High Work", 
    categoryCode: "HW",
    color: "#3B82F6",
    icon: "🏗️",
    categoryGroup: "Equipment",
    isHighRisk: true,
    requiresImmediateAction: false,
    escalationLevel: "manager",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    categoryName: "Electricity",         // Can change to "ไฟฟ้า" later
    categoryNameTh: "ไฟฟ้า",
    categoryNameEn: "Electricity",
    categoryCode: "ELEC",
    color: "#EAB308",
    icon: "⚡",
    categoryGroup: "Equipment",
    isHighRisk: true,
    requiresImmediateAction: true,
    escalationLevel: "executive",
    sortOrder: 2,
    isActive: true,
  }
];

// Example patrol with categories (junction table populated)
export const samplePatrolWithCategories: Omit<SafetyPatrolWithCategories, 'createdAt' | 'updatedAt'> = {
  id: "patrol-123",
  title: "Electrical work inspection",
  location: "Building A - Floor 3",
  description: "Routine electrical safety check",
  riskScore: 12,
  status: "open",
  
  // These are populated from the junction table join
  riskCategories: [], // Would be populated with full RiskCategory objects
  primaryRiskCategory: undefined, // Would be the main category
  riskCategoryIds: [1, 2], // For easy filtering
};

// Filter options interface for UI components
export interface CategoryFilterOption {
  id: number;
  name: string;
  color: string;
  icon?: string;
  count?: number; // Number of patrols with this category
}

// Utility functions for frontend
export class RiskCategoryUtils {
  static toCategoryFilterOptions(categories: RiskCategory[]): CategoryFilterOption[] {
    return categories.map(cat => ({
      id: cat.id,
      name: cat.categoryName, // This can change without affecting patrols!
      color: cat.color,
      icon: cat.icon
    }));
  }
  
  static getHighRiskCategories(categories: RiskCategory[]): RiskCategory[] {
    return categories.filter(cat => cat.isHighRisk);
  }
  
  static getCategoriesByGroup(categories: RiskCategory[], group: string): RiskCategory[] {
    return categories.filter(cat => cat.categoryGroup === group);
  }
}
