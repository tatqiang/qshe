/**
 * Risk Items Multi-Select Filter Component
 * 
 * This demonstrates how to implement your two requirements for Risk Items:
 * 1. Item name changes won't affect existing patrol records (handled by junction table)
 * 2. Efficient multi-select filtering for patrol lists with category grouping
 */

import React, { useState, useEffect } from 'react';

// Type definitions for risk items (from your enhanced types)
interface RiskItem {
  id: number;
  itemName: string;
  itemNameTh?: string;
  itemNameEn?: string;
  itemCode?: string;
  color: string;
  icon?: string;
  category: 'equipment' | 'procedure' | 'environmental';
  isHighPriority: boolean;
  requiresImmediateAttention: boolean;
  escalationLevel: 'none' | 'supervisor' | 'manager' | 'executive';
  sortOrder: number;
  itemGroup?: string;
  isActive: boolean;
}

interface SafetyPatrolWithRiskItems {
  id: string;
  title: string;
  description: string;
  riskScore: number;
  status: 'open' | 'in_progress' | 'verified' | 'closed';
  riskItems: any[];
  riskItemIds: number[];
  highPriorityItemsCount: number;
  createdAt: string;
}

interface MultiSelectRiskItemFilterProps {
  onFilterChange: (itemIds: number[]) => void;
  selectedItemIds: number[];
  className?: string;
  showCategoryGroups?: boolean;
}

export const MultiSelectRiskItemFilter: React.FC<MultiSelectRiskItemFilterProps> = ({
  onFilterChange,
  selectedItemIds,
  className = "",
  showCategoryGroups = true
}) => {
  const [items, setItems] = useState<RiskItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'equipment' | 'procedure' | 'environmental'>('all');

  // Load risk items on component mount
  useEffect(() => {
    loadRiskItems();
  }, []);

  const loadRiskItems = async () => {
    try {
      // Demo data for now - replace with real Supabase call later
      const demoRiskItems = [
        { 
          id: 1, 
          itemCode: 'EQ001', 
          itemName: 'Safety harness not used', 
          itemNameTh: 'ไม่ใช้สายรัดนิรภัย', 
          color: '#FF6B6B',
          category: 'equipment' as const,
          isHighPriority: true,
          requiresImmediateAttention: true,
          escalationLevel: 'supervisor' as const,
          sortOrder: 1,
          isActive: true
        },
        { 
          id: 2, 
          itemCode: 'EQ002', 
          itemName: 'Damaged scaffolding', 
          itemNameTh: 'นั่งร้านชำรุด', 
          color: '#FF8E53',
          category: 'equipment' as const,
          isHighPriority: true,
          requiresImmediateAttention: false,
          escalationLevel: 'manager' as const,
          sortOrder: 2,
          isActive: true
        },
        { 
          id: 3, 
          itemCode: 'EL001', 
          itemName: 'Exposed wiring', 
          itemNameTh: 'สายไฟเปิดออก', 
          color: '#4ECDC4',
          category: 'equipment' as const,
          isHighPriority: true,
          requiresImmediateAttention: true,
          escalationLevel: 'executive' as const,
          sortOrder: 3,
          isActive: true
        },
        { 
          id: 4, 
          itemCode: 'PR001', 
          itemName: 'No safety briefing', 
          itemNameTh: 'ไม่มีการบรีฟความปลอดภัย', 
          color: '#45B7D1',
          category: 'procedure' as const,
          isHighPriority: false,
          requiresImmediateAttention: false,
          escalationLevel: 'supervisor' as const,
          sortOrder: 4,
          isActive: true
        },
        { 
          id: 5, 
          itemCode: 'PR002', 
          itemName: 'Improper lifting technique', 
          itemNameTh: 'เทคนิคการยกของไม่ถูกต้อง', 
          color: '#96CEB4',
          category: 'procedure' as const,
          isHighPriority: false,
          requiresImmediateAttention: false,
          escalationLevel: 'none' as const,
          sortOrder: 5,
          isActive: true
        },
        { 
          id: 6, 
          itemCode: 'EN001', 
          itemName: 'Poor ventilation', 
          itemNameTh: 'การระบายอากาศไม่ดี', 
          color: '#FFEAA7',
          category: 'environmental' as const,
          isHighPriority: false,
          requiresImmediateAttention: false,
          escalationLevel: 'manager' as const,
          sortOrder: 6,
          isActive: true
        },
        { 
          id: 7, 
          itemCode: 'EN002', 
          itemName: 'Extreme temperatures', 
          itemNameTh: 'อุณหภูมิสูงเกินไป', 
          color: '#DDA0DD',
          category: 'environmental' as const,
          isHighPriority: false,
          requiresImmediateAttention: false,
          escalationLevel: 'none' as const,
          sortOrder: 7,
          isActive: true
        },
        { 
          id: 8, 
          itemCode: 'EN003', 
          itemName: 'Chemical exposure risk', 
          itemNameTh: 'ความเสี่ยงสัมผัสสารเคมี', 
          color: '#FDA7DF',
          category: 'environmental' as const,
          isHighPriority: true,
          requiresImmediateAttention: true,
          escalationLevel: 'executive' as const,
          sortOrder: 8,
          isActive: true
        }
      ];
      
      setItems(demoRiskItems);
      console.log('✅ Demo risk items loaded:', demoRiskItems.length);
    } catch (error) {
      console.error('Error loading risk items:', error);
    }
  };

  // Filter items by search term and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemNameTh && item.itemNameTh.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.itemGroup && item.itemGroup.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group items by category for better organization
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, RiskItem[]>);

  // Handle item selection toggle
  const toggleItem = (itemId: number) => {
    const newSelectedIds = selectedItemIds.includes(itemId)
      ? selectedItemIds.filter(id => id !== itemId)
      : [...selectedItemIds, itemId];
    
    onFilterChange(newSelectedIds);
  };

  // Clear all selections
  const clearAll = () => {
    onFilterChange([]);
  };

  // Select all visible items
  const selectAll = () => {
    const allVisibleIds = filteredItems.map(item => item.id);
    const newSelectedIds = [...new Set([...selectedItemIds, ...allVisibleIds])];
    onFilterChange(newSelectedIds);
  };

  // Select all high priority items
  const selectHighPriority = () => {
    const highPriorityIds = items.filter(item => item.isHighPriority).map(item => item.id);
    const newSelectedIds = [...new Set([...selectedItemIds, ...highPriorityIds])];
    onFilterChange(newSelectedIds);
  };

  // Get selected item names for display
  const getSelectedNames = () => {
    if (selectedItemIds.length === 0) return 'All Risk Items';
    if (selectedItemIds.length === 1) {
      const item = items.find(item => item.id === selectedItemIds[0]);
      return item?.itemName || 'Unknown';
    }
    return `${selectedItemIds.length} items selected`;
  };

  // Category display names
  const categoryNames = {
    equipment: 'Equipment',
    procedure: 'Procedure', 
    environmental: 'Environmental'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="block truncate text-sm">
          {getSelectedNames()}
        </span>
        <div className="flex items-center space-x-2">
          {/* High priority indicator */}
          {selectedItemIds.some(id => items.find(item => item.id === id)?.isHighPriority) && (
            <span className="text-red-500 text-xs font-bold">⚠️</span>
          )}
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Selected count badge */}
      {selectedItemIds.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {selectedItemIds.length}
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search risk items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Category Filter */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {(['equipment', 'procedure', 'environmental'] as const).map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2 py-1 text-xs rounded capitalize ${
                    selectedCategory === category 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {categoryNames[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between p-2 border-b border-gray-200 bg-gray-50">
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All Visible
              </button>
              <button
                type="button"
                onClick={selectHighPriority}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                High Priority
              </button>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No risk items found
              </div>
            ) : showCategoryGroups ? (
              // Grouped by category
              Object.entries(groupedItems)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, categoryItems]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {categoryNames[category as keyof typeof categoryNames]} ({categoryItems.length})
                    </div>
                    
                    {/* Category Items */}
                    {categoryItems
                      .sort((a, b) => a.sortOrder - b.sortOrder || a.itemName.localeCompare(b.itemName))
                      .map((item) => (
                        <RiskItemOption
                          key={item.id}
                          item={item}
                          isSelected={selectedItemIds.includes(item.id)}
                          onToggle={toggleItem}
                        />
                      ))}
                  </div>
                ))
            ) : (
              // Flat list
              filteredItems
                .sort((a, b) => a.sortOrder - b.sortOrder || a.itemName.localeCompare(b.itemName))
                .map((item) => (
                  <RiskItemOption
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggle={toggleItem}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual risk item option component
interface RiskItemOptionProps {
  item: RiskItem;
  isSelected: boolean;
  onToggle: (itemId: number) => void;
}

const RiskItemOption: React.FC<RiskItemOptionProps> = ({
  item,
  isSelected,
  onToggle
}) => {
  return (
    <label
      className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(item.id)}
        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      
      {/* Item Icon */}
      {item.icon && (
        <span className="mr-2 text-lg">{item.icon}</span>
      )}
      
      {/* Color Indicator */}
      <div
        className="w-3 h-3 rounded-full mr-2 border border-gray-300"
        style={{ backgroundColor: item.color }}
      />
      
      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="truncate font-medium">{item.itemName}</span>
          {item.isHighPriority && (
            <span className="ml-2 text-red-500 text-xs font-bold">⚠️</span>
          )}
          {item.requiresImmediateAttention && (
            <span className="ml-1 text-orange-500 text-xs">🚨</span>
          )}
        </div>
        
        {/* Thai name if different */}
        {item.itemNameTh && item.itemNameTh !== item.itemName && (
          <div className="truncate text-xs text-gray-500">{item.itemNameTh}</div>
        )}
        
        {/* Item group */}
        {item.itemGroup && (
          <div className="truncate text-xs text-gray-400">{item.itemGroup}</div>
        )}
      </div>
      
      {/* Item Code */}
      {item.itemCode && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
          {item.itemCode}
        </span>
      )}
    </label>
  );
};

export default MultiSelectRiskItemFilter;
