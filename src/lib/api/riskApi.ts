/**
 * Risk Categories and Risk Items API
 * These are global reference data, not project-specific
 */

import { supabase } from './supabase';
import type { RiskCategory, RiskItem } from '../../types/safetyPatrol';

// ==================== RISK CATEGORIES API ====================

export async function getRiskCategories(): Promise<RiskCategory[]> {
  try {
    const { data, error } = await supabase
      .from('risk_categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    // Map database fields to our RiskCategory type
    const riskCategories: RiskCategory[] = (data || []).map((cat: any) => {
      // Create a mapping for common risk category icons
      const iconMap: { [key: string]: string } = {
        'elevation': '🏗️',
        'high work': '🏗️', 
        'electrical': '⚡',
        'electricity': '⚡',
        'crane': '🏗️',
        'crane operations': '🏗️',
        'lock': '🔒',
        'loto': '🔒',
        'chemical': '🧪',
        'hot work': '🔥',
        'confined space': '🚪',
        'noise': '🔊',
        'air quality': '💨',
        'temperature': '🌡️',
        'lifting': '📦',
        'machinery': '🚜'
      };

      const categoryName = cat.category_name || cat.name || '';
      const iconFromMap = iconMap[categoryName.toLowerCase()] || cat.icon || '⚠️';

      return {
        id: cat.id,
        name: categoryName,
        description: cat.description,
        color: cat.color || '#6366f1',
        icon: iconFromMap,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at
      };
    });

    console.log(`[RISK_API] Retrieved ${riskCategories.length} risk categories`);
    console.log(`[RISK_API] Raw database data:`, data?.[0]);
    console.log(`[RISK_API] Sample category:`, riskCategories[0]);
    console.log(`[RISK_API] All categories with icons:`, riskCategories.map(c => ({ name: c.name, icon: c.icon })));
    return riskCategories;
  } catch (error) {
    console.error('Error fetching risk categories:', error);
    return [];
  }
}

export async function createRiskCategory(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<RiskCategory | null> {
  try {
    const newCategory = {
      name: data.name,
      description: data.description,
      color: data.color || '#6366f1',
      icon: data.icon || '⚠️',
    };

    const { data: inserted, error } = await supabase
      .from('risk_categories')
      .insert(newCategory as any)
      .select()
      .single();

    if (error) throw error;

    const riskCategory: RiskCategory = {
      id: (inserted as any).id,
      name: (inserted as any).name,
      description: (inserted as any).description,
      color: (inserted as any).color || (inserted as any).color_code || '#6366f1',
      icon: (inserted as any).icon || '⚠️',
      createdAt: (inserted as any).created_at,
      updatedAt: (inserted as any).updated_at
    };

    console.log(`[RISK_API] Created risk category:`, riskCategory);
    return riskCategory;
  } catch (error) {
    console.error('Error creating risk category:', error);
    return null;
  }
}

// ==================== RISK ITEMS API ====================

export async function getRiskItems(): Promise<RiskItem[]> {
  try {
    const { data, error } = await supabase
      .from('risk_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Map database fields to our RiskItem type
    const riskItems: RiskItem[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'procedure', // Default category
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    console.log(`[RISK_API] Retrieved ${riskItems.length} risk items`);
    return riskItems;
  } catch (error) {
    console.error('Error fetching risk items:', error);
    return [];
  }
}

export async function createRiskItem(data: {
  name: string;
  category: 'equipment' | 'procedure' | 'environmental';
  description?: string;
}): Promise<RiskItem | null> {
  try {
    const newItem = {
      name: data.name,
      category: data.category,
      description: data.description,
    };

    const { data: inserted, error } = await supabase
      .from('risk_items')
      .insert(newItem as any)
      .select()
      .single();

    if (error) throw error;

    const riskItem: RiskItem = {
      id: (inserted as any).id,
      name: (inserted as any).name,
      category: (inserted as any).category || 'procedure',
      description: (inserted as any).description,
      createdAt: (inserted as any).created_at,
      updatedAt: (inserted as any).updated_at
    };

    console.log(`[RISK_API] Created risk item:`, riskItem);
    return riskItem;
  } catch (error) {
    console.error('Error creating risk item:', error);
    return null;
  }
}

// ==================== COMBINED API ====================

export async function getRiskCategoriesWithItems(): Promise<{ categories: RiskCategory[], items: RiskItem[] }> {
  try {
    const [categories, items] = await Promise.all([
      getRiskCategories(),
      getRiskItems()
    ]);

    return { categories, items };
  } catch (error) {
    console.error('Error fetching risk data:', error);
    return { categories: [], items: [] };
  }
}
