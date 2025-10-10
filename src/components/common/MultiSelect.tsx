import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Option {
  id: number | string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  category?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: (number | string)[];
  onChange: (selectedIds: (number | string)[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  maxHeight?: string;
  showCategories?: boolean;
  allowSelectAll?: boolean;
  searchable?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = "Select options...",
  label,
  disabled = false,
  maxHeight = "max-h-60",
  showCategories = false,
  allowSelectAll = false,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group options by category if showCategories is true
  const groupedOptions = showCategories
    ? filteredOptions.reduce((groups, option) => {
        const category = option.category || 'Other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(option);
        return groups;
      }, {} as Record<string, Option[]>)
    : { '': filteredOptions };

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  const handleOptionToggle = (optionId: number | string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    onChange(newSelectedIds);
  };

  const handleSelectAll = () => {
    const allIds = filteredOptions.map(option => option.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const removeOption = (optionId: number | string) => {
    onChange(selectedIds.filter(id => id !== optionId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Selected Options Display */}
      <div
        className={`
          min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selectedOptions.map(option => (
                <span
                  key={option.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  style={option.color ? { backgroundColor: `${option.color}20`, color: option.color } : {}}
                >
                  {option.icon && <span className="mr-1">{option.icon}</span>}
                  {option.name}
                  <button
                    type="button"
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.id);
                    }}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${maxHeight} overflow-hidden`}>
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Select All / Deselect All */}
          {allowSelectAll && (
            <div className="p-2 border-b border-gray-200 flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Deselect All
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {Object.keys(groupedOptions).length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category}>
                  {/* Category Header */}
                  {showCategories && category && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                      {category}
                    </div>
                  )}

                  {/* Options */}
                  {categoryOptions.map(option => {
                    const isSelected = selectedIds.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        className={`
                          px-3 py-2 cursor-pointer hover:bg-gray-50
                          ${isSelected ? 'bg-blue-50' : ''}
                        `}
                        onClick={() => handleOptionToggle(option.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by onClick
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              {option.icon && (
                                <span className="mr-2 text-lg">{option.icon}</span>
                              )}
                              {option.color && (
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: option.color }}
                                />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {option.name}
                              </span>
                            </div>
                            {option.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
