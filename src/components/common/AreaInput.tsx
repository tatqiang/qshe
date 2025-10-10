import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { ProjectArea } from '../../types';
import { searchProjectAreas, findOrCreateProjectArea } from '../../lib/api/projectAreasApi.mock';

interface AreaInputProps {
  projectId: string;
  value: string;
  onChange: (areaName: string, area?: ProjectArea) => void;
  onAreaSelected?: (area: ProjectArea) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function AreaInput({
  projectId,
  value,
  onChange,
  onAreaSelected,
  placeholder = "Enter or search area name...",
  className = "",
  required = false,
  disabled = false
}: AreaInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ProjectArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (value.trim() && projectId) {
        setIsLoading(true);
        try {
          const results = await searchProjectAreas({
            projectId,
            query: value.trim(),
            limit: 8
          });
          setSuggestions(results);
        } catch (error) {
          console.error('Error searching areas:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [value, projectId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSuggestionClick = (area: ProjectArea) => {
    onChange(area.areaName, area);
    onAreaSelected?.(area);
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    if (!value.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newArea = await findOrCreateProjectArea(projectId, value.trim());
      if (newArea) {
        onChange(newArea.areaName, newArea);
        onAreaSelected?.(newArea);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error creating area:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isOpen && suggestions.length === 0 && value.trim()) {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const showCreateOption = value.trim() && 
    !suggestions.some(s => s.areaName.toLowerCase() === value.trim().toLowerCase()) &&
    !isLoading;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Searching areas...
            </div>
          )}

          {/* Existing suggestions */}
          {suggestions.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSuggestionClick(area)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{area.areaName}</div>
                  <div className="text-xs text-gray-500">Code: {area.areaCode}</div>
                </div>
                <div className="text-xs text-gray-400">Existing</div>
              </div>
            </button>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={isCreating}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t border-gray-100"
            >
              <div className="flex items-center text-blue-600">
                {isCreating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                ) : (
                  <PlusIcon className="w-4 h-4 mr-2" />
                )}
                <div>
                  <div className="font-medium">Create "{value.trim()}"</div>
                  <div className="text-xs text-blue-500">Add as new area</div>
                </div>
              </div>
            </button>
          )}

          {/* No results */}
          {!isLoading && suggestions.length === 0 && !showCreateOption && value.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No areas found matching "{value.trim()}"
            </div>
          )}

          {/* Empty state */}
          {!value.trim() && suggestions.length === 0 && !isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Start typing to search or create areas...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
