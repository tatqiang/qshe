/**
 * Risk Category Multi-Select Filter Component
 * 
 * This demonstrates how to implement your two requirements:
 * 1. Category name changes won't affect existing patrol records (handled by junction table)
 * 2. Efficient multi-select filtering for patrol lists
 */

import React, { useState, useEffect } from 'react';

// Type definitions for risk categories (from your enhanced types)
interface RiskCategory {
  id: number;
  categoryName: string;
  categoryNameTh?: string;
  categoryNameEn?: string;
  categoryCode?: string;
  color: string;
  icon?: string;
  backgroundColor?: string;
  isHighRisk: boolean;
  requiresImmediateAction: boolean;
  escalationLevel: 'none' | 'supervisor' | 'manager' | 'executive';
  sortOrder: number;
  categoryGroup?: string;
  isActive: boolean;
}

interface SafetyPatrolWithCategories {
  id: string;
  title: string;
  description: string;
  riskScore: number;
  status: 'open' | 'in_progress' | 'closed';
  riskCategories: any[];
  riskCategoryIds: number[];
  createdAt: string;
}

interface MultiSelectRiskCategoryFilterProps {
  onFilterChange: (categoryIds: number[]) => void;
  selectedCategoryIds: number[];
  className?: string;
}

export const MultiSelectRiskCategoryFilter: React.FC<MultiSelectRiskCategoryFilterProps> = ({
  onFilterChange,
  selectedCategoryIds,
  className = ""
}) => {
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load risk categories on component mount
  useEffect(() => {
    loadRiskCategories();
  }, []);

  const loadRiskCategories = async () => {
    try {
      // Demo data for now - replace with real Supabase call later
      const demoRiskCategories = [
        { 
          id: 1, 
          categoryCode: 'EQ', 
          categoryName: 'Equipment Safety', 
          categoryNameTh: 'ความปลอดภัยเครื่องมือ', 
          color: '#FF6B6B',
          isHighRisk: true,
          requiresImmediateAction: true,
          escalationLevel: 'supervisor' as const,
          sortOrder: 1,
          isActive: true
        },
        { 
          id: 2, 
          categoryCode: 'PR', 
          categoryName: 'Procedure Safety', 
          categoryNameTh: 'ความปลอดภัยขั้นตอน', 
          color: '#4ECDC4',
          isHighRisk: false,
          requiresImmediateAction: false,
          escalationLevel: 'none' as const,
          sortOrder: 2,
          isActive: true
        },
        { 
          id: 3, 
          categoryCode: 'EN', 
          categoryName: 'Environmental Safety', 
          categoryNameTh: 'ความปลอดภัยสิ่งแวดล้อม', 
          color: '#45B7D1',
          isHighRisk: false,
          requiresImmediateAction: false,
          escalationLevel: 'manager' as const,
          sortOrder: 3,
          isActive: true
        },
        { 
          id: 4, 
          categoryCode: 'WH', 
          categoryName: 'Work at Height', 
          categoryNameTh: 'การทำงานในที่สูง', 
          color: '#96CEB4',
          isHighRisk: true,
          requiresImmediateAction: true,
          escalationLevel: 'executive' as const,
          sortOrder: 4,
          isActive: true
        },
        { 
          id: 5, 
          categoryCode: 'EL', 
          categoryName: 'Electrical Safety', 
          categoryNameTh: 'ความปลอดภัยไฟฟ้า', 
          color: '#FFEAA7',
          isHighRisk: true,
          requiresImmediateAction: true,
          escalationLevel: 'executive' as const,
          sortOrder: 5,
          isActive: true
        }
      ];
      
      setCategories(demoRiskCategories);
      console.log('✅ Demo risk categories loaded:', demoRiskCategories.length);
    } catch (error) {
      console.error('Error loading risk categories:', error);
    }
  };

  // Filter categories by search term
  const filteredCategories = categories.filter(category =>
    category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.categoryNameTh && category.categoryNameTh.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category.categoryCode && category.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle category selection toggle
  const toggleCategory = (categoryId: number) => {
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    onFilterChange(newSelectedIds);
  };

  // Clear all selections
  const clearAll = () => {
    onFilterChange([]);
  };

  // Select all visible categories
  const selectAll = () => {
    const allVisibleIds = filteredCategories.map(cat => cat.id);
    const newSelectedIds = [...new Set([...selectedCategoryIds, ...allVisibleIds])];
    onFilterChange(newSelectedIds);
  };

  // Get selected category names for display
  const getSelectedNames = () => {
    if (selectedCategoryIds.length === 0) return 'All Categories';
    if (selectedCategoryIds.length === 1) {
      const category = categories.find(cat => cat.id === selectedCategoryIds[0]);
      return category?.categoryName || 'Unknown';
    }
    return `${selectedCategoryIds.length} categories selected`;
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
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected count badge */}
      {selectedCategoryIds.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {selectedCategoryIds.length}
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between p-2 border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Select All Visible
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Categories List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No categories found
              </div>
            ) : (
              filteredCategories
                .sort((a, b) => a.sortOrder - b.sortOrder || a.categoryName.localeCompare(b.categoryName))
                .map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  
                  return (
                    <label
                      key={category.id}
                      className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(category.id)}
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      {/* Category Icon */}
                      {category.icon && (
                        <span className="mr-2 text-lg">{category.icon}</span>
                      )}
                      
                      {/* Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      />
                      
                      {/* Category Name */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{category.categoryName}</div>
                        {category.categoryNameTh && category.categoryNameTh !== category.categoryName && (
                          <div className="truncate text-xs text-gray-500">{category.categoryNameTh}</div>
                        )}
                      </div>
                      
                      {/* Category Code */}
                      {category.categoryCode && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                          {category.categoryCode}
                        </span>
                      )}
                      
                      {/* High Risk Indicator */}
                      {category.isHighRisk && (
                        <span className="ml-1 text-red-500 text-xs font-bold">⚠️</span>
                      )}
                    </label>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// USAGE EXAMPLE: SafetyPatrolList with Category Filtering
// =====================================================================

interface SafetyPatrolListWithFilterProps {
  patrols: SafetyPatrolWithCategories[];
  onPatrolSelect?: (patrol: SafetyPatrolWithCategories) => void;
}

export const SafetyPatrolListWithFilter: React.FC<SafetyPatrolListWithFilterProps> = ({
  patrols,
  onPatrolSelect
}) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [filteredPatrols, setFilteredPatrols] = useState<SafetyPatrolWithCategories[]>(patrols);

  // Update filtered patrols when categories or patrols change
  useEffect(() => {
    if (selectedCategoryIds.length === 0) {
      setFilteredPatrols(patrols);
    } else {
      // Efficient filtering using the pre-computed riskCategoryIds array
      const filtered = patrols.filter((patrol: SafetyPatrolWithCategories) =>
        patrol.riskCategoryIds.some((id: number) => selectedCategoryIds.includes(id))
      );
      setFilteredPatrols(filtered);
    }
  }, [selectedCategoryIds, patrols]);

  const handleCategoryFilterChange = (categoryIds: number[]) => {
    setSelectedCategoryIds(categoryIds);
  };

  // Get unique categories from all patrols for statistics
  const getCategoryStats = () => {
    const categoryCount = new Map<number, number>();
    patrols.forEach(patrol => {
      patrol.riskCategoryIds.forEach((categoryId: number) => {
        categoryCount.set(categoryId, (categoryCount.get(categoryId) || 0) + 1);
      });
    });
    return categoryCount;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Safety Patrols</h3>
            <p className="text-sm text-gray-500">
              Showing {filteredPatrols.length} of {patrols.length} patrols
              {selectedCategoryIds.length > 0 && ` • Filtered by ${selectedCategoryIds.length} categories`}
            </p>
          </div>
          
          {/* Category Filter */}
          <div className="w-full sm:w-64">
            <MultiSelectRiskCategoryFilter
              selectedCategoryIds={selectedCategoryIds}
              onFilterChange={handleCategoryFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Patrol List */}
      <div className="space-y-3">
        {filteredPatrols.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedCategoryIds.length > 0 
              ? 'No patrols found with the selected categories'
              : 'No patrols available'
            }
          </div>
        ) : (
          filteredPatrols.map((patrol) => (
            <PatrolCard
              key={patrol.id}
              patrol={patrol}
              onClick={() => onPatrolSelect?.(patrol)}
              highlightedCategoryIds={selectedCategoryIds}
            />
          ))
        )}
      </div>
    </div>
  );
};

// =====================================================================
// PATROL CARD COMPONENT
// =====================================================================

interface PatrolCardProps {
  patrol: SafetyPatrolWithCategories;
  onClick?: () => void;
  highlightedCategoryIds?: number[];
}

const PatrolCard: React.FC<PatrolCardProps> = ({
  patrol,
  onClick,
  highlightedCategoryIds = []
}) => {
  const getRiskScoreColor = (score: number) => {
    if (score >= 16) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 12) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-medium text-gray-900 truncate">
            {patrol.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {patrol.description}
          </p>
        </div>
        
        {/* Risk Score Badge */}
        <div className={`ml-3 px-2 py-1 rounded text-sm font-medium border ${getRiskScoreColor(patrol.riskScore)}`}>
          Risk: {patrol.riskScore}
        </div>
      </div>

      {/* Risk Categories */}
      <div className="flex flex-wrap gap-2 mb-3">
        {patrol.riskCategories.map((category: any) => {
          const isHighlighted = highlightedCategoryIds.includes(category.id);
          
          return (
            <span
              key={category.id}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                isHighlighted
                  ? 'bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
              style={!isHighlighted ? { 
                backgroundColor: category.backgroundColor || `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`
              } : {}}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.categoryName}
              {category.isPrimary && <span className="ml-1 text-yellow-500">★</span>}
            </span>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Status: {patrol.status}</span>
        <span>{new Date(patrol.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default MultiSelectRiskCategoryFilter;
