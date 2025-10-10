import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { ProjectArea, MainArea, SubArea1, SubArea2 } from '../../types';
import { searchProjectAreas } from '../../lib/api/projectAreasApi.mock';
import { 
  getMainAreas, 
  createMainArea, 
  getSubAreas1, 
  createSubArea1, 
  getSubAreas2, 
  createSubArea2 
} from '../../lib/api/hierarchicalAreasApi';

// Utility function to generate area code from name
function generateAreaCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
}

interface HierarchicalAreaInputProps {
  projectId: string;
  mainArea: string;
  subArea1?: string;
  subArea2?: string;
  onMainAreaChange: (areaName: string, area?: ProjectArea | MainArea) => void;
  onSubArea1Change?: (subAreaName: string, subArea?: SubArea1) => void;
  onSubArea2Change?: (subAreaName: string, subArea?: SubArea2) => void;
  onAreaSelected?: (area: ProjectArea | MainArea) => void;
  onLocationIdsChange?: (locationIds: {
    project_id: string;
    main_area_id?: string;
    sub_area1_id?: string;
    sub_area2_id?: string;
  }) => void;
  className?: string;
  disabled?: boolean;
}

export function HierarchicalAreaInput({
  projectId,
  mainArea,
  subArea1,
  subArea2,
  onMainAreaChange,
  onSubArea1Change,
  onSubArea2Change,
  onAreaSelected,
  onLocationIdsChange,
  className = "",
  disabled = false
}: HierarchicalAreaInputProps) {
  // Debug: Log props when they change (reduced frequency)
  useEffect(() => {
    console.log('[AREA_INPUT_DEBUG] Props updated:', {
      mainArea,
      subArea1,
      subArea2
    });
  }, [mainArea, subArea1, subArea2]);

  const [isMainAreaOpen, setIsMainAreaOpen] = useState(false);
  const [isSubArea1Open, setIsSubArea1Open] = useState(false);
  const [isSubArea2Open, setIsSubArea2Open] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState<string | null>(null);
  
  // Updated state for normalized schema
  const [mainAreaSuggestions, setMainAreaSuggestions] = useState<MainArea[]>([]);
  const [subArea1Suggestions, setSubArea1Suggestions] = useState<SubArea1[]>([]);
  const [subArea2Suggestions, setSubArea2Suggestions] = useState<SubArea2[]>([]);
  
  // Keep legacy support for backward compatibility
  const [legacyMainAreaSuggestions, setLegacyMainAreaSuggestions] = useState<ProjectArea[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Track current selected IDs for normalized schema
  const [selectedMainAreaId, setSelectedMainAreaId] = useState<string | undefined>();
  const [selectedSubArea1Id, setSelectedSubArea1Id] = useState<string | undefined>();
  const [selectedSubArea2Id, setSelectedSubArea2Id] = useState<string | undefined>();
  
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const subArea1Ref = useRef<HTMLDivElement>(null);
  const subArea2Ref = useRef<HTMLDivElement>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search main areas using normalized API
  const searchMainAreas = async (query: string) => {
    setIsLoading(true);
    try {
      // Use the new normalized API
      const results = await getMainAreas(projectId);
      
      // Filter by query if provided
      const filteredResults = query.trim() 
        ? results.filter(area => 
            area.name.toLowerCase().includes(query.toLowerCase())
          )
        : results;
      
      setMainAreaSuggestions(filteredResults);
    } catch (error) {
      console.error('Error searching main areas:', error);
      // Fallback to legacy API
      try {
        const legacyResults = await searchProjectAreas({ 
          projectId, 
          query: query.trim() || ''
        });
        setLegacyMainAreaSuggestions(legacyResults);
      } catch (legacyError) {
        console.error('Legacy API also failed:', legacyError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Search sub areas using normalized API
  const searchSubAreas = async (mainAreaName: string, subArea1Name?: string) => {
    try {
      // Find the main area first
      const mainAreas = await getMainAreas(projectId);
      const selectedMainArea = mainAreas.find(area => 
        area.name.toLowerCase() === mainAreaName.toLowerCase()
      );
      
      if (selectedMainArea) {
        // Get sub areas 1 for this main area
        const subAreas1 = await getSubAreas1(projectId, selectedMainArea.id);
        
        // Filter by query if provided
        const filteredSubAreas1 = subArea1Name?.trim()
          ? subAreas1.filter(area => 
              area.name.toLowerCase().includes(subArea1Name.toLowerCase())
            )
          : subAreas1;
        
        setSubArea1Suggestions(filteredSubAreas1);
        
        // If we have a selected sub area 1, get sub areas 2
        if (subArea1Name?.trim()) {
          const selectedSubArea1 = subAreas1.find(area =>
            area.name.toLowerCase() === subArea1Name.toLowerCase()
          );
          
          if (selectedSubArea1) {
            const subAreas2 = await getSubAreas2(projectId, selectedSubArea1.id);
            setSubArea2Suggestions(subAreas2);
          } else {
            setSubArea2Suggestions([]);
          }
        } else {
          setSubArea2Suggestions([]);
        }
      } else {
        // Clear sub areas if main area not found
        setSubArea1Suggestions([]);
        setSubArea2Suggestions([]);
      }
    } catch (error) {
      console.error('Error searching sub areas:', error);
      // Clear suggestions on error
      setSubArea1Suggestions([]);
      setSubArea2Suggestions([]);
    }
  };

  // Debounced search for main areas
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchMainAreas(mainArea);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [mainArea, projectId]);

  // Search sub areas when main area or sub area 1 changes (cascading)
  useEffect(() => {
    if (mainArea.trim()) {
      searchSubAreas(mainArea, subArea1);
    } else {
      setSubArea1Suggestions([]);
      setSubArea2Suggestions([]);
    }
  }, [mainArea, subArea1, projectId]);

  // Handle main area selection
  const handleMainAreaSelect = async (selectedArea: MainArea | ProjectArea | string) => {
    if (typeof selectedArea === 'string') {
      // Create new area using normalized API
      setIsCreating(true);
      try {
        const newMainArea = await createMainArea({
          project_id: projectId,
          name: selectedArea,
          code: generateAreaCode(selectedArea),
          description: `Main area: ${selectedArea}`
        });
        if (newMainArea) {
          console.log('[MAIN_AREA] Created new main area:', newMainArea);
          setSelectedMainAreaId(newMainArea.id);
          onMainAreaChange(selectedArea, newMainArea);
          onAreaSelected?.(newMainArea);
          
          // Update location IDs
          onLocationIdsChange?.({
            project_id: projectId,
            main_area_id: newMainArea.id,
            sub_area1_id: undefined,
            sub_area2_id: undefined
          });
        } else {
          onMainAreaChange(selectedArea);
        }
      } catch (error) {
        console.error('Error creating main area:', error);
        onMainAreaChange(selectedArea);
      } finally {
        setIsCreating(false);
      }
    } else if ('name' in selectedArea) {
      // MainArea selected
      console.log('[MAIN_AREA] Selected existing main area:', selectedArea);
      setSelectedMainAreaId(selectedArea.id);
      onMainAreaChange(selectedArea.name, selectedArea);
      onAreaSelected?.(selectedArea);
      
      // Update location IDs
      onLocationIdsChange?.({
        project_id: projectId,
        main_area_id: selectedArea.id,
        sub_area1_id: undefined,
        sub_area2_id: undefined
      });
    } else {
      // Legacy ProjectArea
      console.log('[MAIN_AREA] Selected legacy project area:', selectedArea);
      onMainAreaChange(selectedArea.areaName, selectedArea);
      onAreaSelected?.(selectedArea);
    }
    
    // Clear sub areas when main area changes
    setSelectedSubArea1Id(undefined);
    setSelectedSubArea2Id(undefined);
    onSubArea1Change?.('');
    onSubArea2Change?.('');
    
    setIsMainAreaOpen(false);
  };

  // Handle sub area 1 selection
  const handleSubArea1Select = async (selectedValue: string | SubArea1) => {
    try {
      const areaName = typeof selectedValue === 'string' ? selectedValue : selectedValue.name;
      console.log(`[SUB_AREA_1] Creating/selecting: "${areaName}"`);
      
      // Check if we need to create new sub area
      const existingArea = subArea1Suggestions.find(area => 
        area.name.toLowerCase() === areaName.toLowerCase()
      );
      
      if (!existingArea && areaName.trim()) {
        console.log(`[SUB_AREA_1] Creating new sub area in database: "${areaName}"`);
        setIsCreating(true);
        
        try {
          // Get the selected main area first
          const mainAreas = await getMainAreas(projectId);
          const selectedMainArea = mainAreas.find(area => 
            area.name.toLowerCase() === mainArea.toLowerCase()
          );
          
          if (selectedMainArea) {
            const newSubArea1 = await createSubArea1({
              project_id: projectId,
              main_area_id: selectedMainArea.id,
              name: areaName.trim(),
              code: generateAreaCode(areaName),
              description: `Sub area 1: ${areaName}`
            });
            
            console.log(`[SUB_AREA_1] Successfully created sub area:`, newSubArea1);
            setSelectedSubArea1Id(newSubArea1.id);
            
            // Update location IDs
            onLocationIdsChange?.({
              project_id: projectId,
              main_area_id: selectedMainArea.id,
              sub_area1_id: newSubArea1.id,
              sub_area2_id: undefined
            });
            
            // Update parent component
            onSubArea1Change?.(areaName, newSubArea1);
          } else {
            console.error('[SUB_AREA_1] Main area not found');
            onSubArea1Change?.(areaName);
          }
          
          // Refresh the suggestions
          setTimeout(() => {
            searchSubAreas(mainArea);
          }, 100);
          
        } catch (error) {
          console.error(`[SUB_AREA_1] Error creating sub area:`, error);
          onSubArea1Change?.(areaName);
        } finally {
          setIsCreating(false);
        }
      } else {
        // Existing area or string selection
        if (existingArea) {
          setSelectedSubArea1Id(existingArea.id);
          
          // Update location IDs
          const mainAreas = await getMainAreas(projectId);
          const selectedMainArea = mainAreas.find(area => 
            area.name.toLowerCase() === mainArea.toLowerCase()
          );
          
          if (selectedMainArea) {
            onLocationIdsChange?.({
              project_id: projectId,
              main_area_id: selectedMainArea.id,
              sub_area1_id: existingArea.id,
              sub_area2_id: undefined
            });
          }
          
          onSubArea1Change?.(areaName, existingArea);
        } else {
          onSubArea1Change?.(areaName);
        }
      }
      
      // Clear sub area 2 when sub area 1 changes
      setSelectedSubArea2Id(undefined);
      onSubArea2Change?.('');
      
      setIsSubArea1Open(false);
      
      console.log(`[SUB_AREA_1] Successfully selected: "${areaName}"`);
      
      // Show success indicator
      setRecentlyCreated(`Sub Area 1: "${areaName}"`);
      setTimeout(() => setRecentlyCreated(null), 3000);
      
    } catch (error) {
      console.error('[SUB_AREA_1] Error selecting sub area:', error);
      const areaName = typeof selectedValue === 'string' ? selectedValue : selectedValue.name;
      onSubArea1Change?.(areaName);
      setIsSubArea1Open(false);
      onSubArea2Change?.('');
    }
  };

  // Handle sub area 2 selection
  const handleSubArea2Select = async (selectedValue: string | SubArea2) => {
    try {
      const areaName = typeof selectedValue === 'string' ? selectedValue : selectedValue.name;
      console.log(`[SUB_AREA_2] Creating/selecting: "${areaName}"`);
      
      // Check if we need to create new sub area
      const existingArea = subArea2Suggestions.find(area => 
        area.name.toLowerCase() === areaName.toLowerCase()
      );
      
      if (!existingArea && areaName.trim()) {
        console.log(`[SUB_AREA_2] Creating new sub area in database: "${areaName}"`);
        setIsCreating(true);
        
        try {
          // Get the selected sub area 1 first
          const mainAreas = await getMainAreas(projectId);
          const selectedMainArea = mainAreas.find(area => 
            area.name.toLowerCase() === mainArea.toLowerCase()
          );
          
          if (selectedMainArea) {
            const subAreas1 = await getSubAreas1(projectId, selectedMainArea.id);
            const selectedSubArea1 = subAreas1.find(area =>
              area.name.toLowerCase() === subArea1?.toLowerCase()
            );
            
            if (selectedSubArea1) {
              const newSubArea2 = await createSubArea2({
                project_id: projectId,
                main_area_id: selectedMainArea.id,
                sub_area1_id: selectedSubArea1.id,
                name: areaName.trim(),
                code: generateAreaCode(areaName),
                description: `Sub area 2: ${areaName}`
              });
              
              console.log(`[SUB_AREA_2] Successfully created sub area:`, newSubArea2);
              setSelectedSubArea2Id(newSubArea2.id);
              
              // Update location IDs
              onLocationIdsChange?.({
                project_id: projectId,
                main_area_id: selectedMainArea.id,
                sub_area1_id: selectedSubArea1.id,
                sub_area2_id: newSubArea2.id
              });
              
              // Update parent component
              onSubArea2Change?.(areaName, newSubArea2);
            } else {
              console.error('[SUB_AREA_2] Sub area 1 not found');
              onSubArea2Change?.(areaName);
            }
          } else {
            console.error('[SUB_AREA_2] Main area not found');
            onSubArea2Change?.(areaName);
          }
          
          // Refresh the suggestions
          setTimeout(() => {
            searchSubAreas(mainArea, subArea1);
          }, 100);
          
        } catch (error) {
          console.error(`[SUB_AREA_2] Error creating sub area:`, error);
          onSubArea2Change?.(areaName);
        } finally {
          setIsCreating(false);
        }
      } else {
        // Existing area or string selection
        if (existingArea) {
          setSelectedSubArea2Id(existingArea.id);
          
          // Update location IDs
          const mainAreas = await getMainAreas(projectId);
          const selectedMainArea = mainAreas.find(area => 
            area.name.toLowerCase() === mainArea.toLowerCase()
          );
          
          if (selectedMainArea) {
            const subAreas1 = await getSubAreas1(projectId, selectedMainArea.id);
            const selectedSubArea1 = subAreas1.find(area =>
              area.name.toLowerCase() === subArea1?.toLowerCase()
            );
            
            if (selectedSubArea1) {
              onLocationIdsChange?.({
                project_id: projectId,
                main_area_id: selectedMainArea.id,
                sub_area1_id: selectedSubArea1.id,
                sub_area2_id: existingArea.id
              });
            }
          }
          
          onSubArea2Change?.(areaName, existingArea);
        } else {
          onSubArea2Change?.(areaName);
        }
      }
      
      setIsSubArea2Open(false);
      
      console.log(`[SUB_AREA_2] Successfully selected: "${areaName}"`);
      
      // Show success indicator
      setRecentlyCreated(`Sub Area 2: "${areaName}"`);
      setTimeout(() => setRecentlyCreated(null), 3000);
    } catch (error) {
      console.error('[SUB_AREA_2] Error selecting sub area:', error);
      const areaName = typeof selectedValue === 'string' ? selectedValue : selectedValue.name;
      onSubArea2Change?.(areaName);
      setIsSubArea2Open(false);
    }
  };

  // Generate area code suggestions
  const generateAreaCode = (name: string): string => {
    // Extract numbers first
    const numbers = name.match(/\d+/g);
    if (numbers) {
      return numbers.join('');
    }
    
    // Extract initials from words
    const words = name.split(/\s+/).filter(word => word.length > 0);
    if (words.length > 1) {
      return words.map(word => word.charAt(0).toUpperCase()).join('');
    }
    
    // Single word - take first 3 characters
    return name.substring(0, 3).toUpperCase();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mainAreaRef.current && !mainAreaRef.current.contains(event.target as Node)) {
        setIsMainAreaOpen(false);
      }
      if (subArea1Ref.current && !subArea1Ref.current.contains(event.target as Node)) {
        setIsSubArea1Open(false);
      }
      if (subArea2Ref.current && !subArea2Ref.current.contains(event.target as Node)) {
        setIsSubArea2Open(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Success Indicator */}
      {recentlyCreated && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-2 text-sm">
          ✓ Created: {recentlyCreated}
        </div>
      )}

      {/* Main Area Input */}
      <div className="relative" ref={mainAreaRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <BuildingOfficeIcon className="w-4 h-4 inline-block mr-1" />
          Main Area *
          <span className="text-gray-500 text-xs ml-1">(e.g., Building A, Landscape Yard)</span>
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={mainArea}
            onChange={(e) => {
              onMainAreaChange(e.target.value);
              setIsMainAreaOpen(true);
            }}
            onFocus={() => {
              setIsMainAreaOpen(true);
              // Load all areas when focused
              if (mainAreaSuggestions.length === 0) {
                searchMainAreas('');
              }
            }}
            placeholder="Enter or search main area..."
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          
          <button
            type="button"
            onClick={() => setIsMainAreaOpen(!isMainAreaOpen)}
            disabled={disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isMainAreaOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Main Area Dropdown */}
        {isMainAreaOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                <span className="block mt-1 text-sm">Searching...</span>
              </div>
            ) : (
              <>
                {mainAreaSuggestions.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleMainAreaSelect(area)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="font-medium">{area.name}</div>
                    <div className="text-xs text-gray-500">Code: {area.code}</div>
                  </button>
                ))}
                
                {mainArea.trim() && !mainAreaSuggestions.find(a => a.name.toLowerCase() === mainArea.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleMainAreaSelect(mainArea)}
                    disabled={isCreating}
                    className="w-full px-3 py-2 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-t border-gray-200"
                  >
                    <div className="flex items-center text-green-600">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      <span className="font-medium">Create "{mainArea}"</span>
                      {isCreating && <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>}
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      Code will be: {generateAreaCode(mainArea)}
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub Area 1 Input */}
      <div className="relative" ref={subArea1Ref}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub Area 1
          <span className="text-gray-500 text-xs ml-1">(e.g., Room 101, Office A) - Optional</span>
          {!mainArea.trim() && (
            <span className="text-red-500 text-xs ml-1"> - Requires Main Area</span>
          )}
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={subArea1 || ''}
            onChange={(e) => {
              if (!mainArea.trim()) return; // Prevent input without main area
              onSubArea1Change?.(e.target.value);
              setIsSubArea1Open(true);
            }}
            onFocus={() => {
              if (mainArea.trim()) {
                setIsSubArea1Open(true);
                // Load sub areas when focused
                if (subArea1Suggestions.length === 0) {
                  searchSubAreas(mainArea);
                }
              }
            }}
            placeholder={mainArea.trim() ? "Enter sub area 1 (optional)..." : "Select main area first"}
            disabled={disabled || !mainArea.trim()}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !mainArea.trim() 
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 bg-white'
            } disabled:bg-gray-100`}
          />
          
          {mainArea.trim() && (
            <button
              type="button"
              onClick={() => setIsSubArea1Open(!isSubArea1Open)}
              disabled={disabled || !mainArea.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSubArea1Open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Sub Area 1 Dropdown */}
        {isSubArea1Open && mainArea.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
            {isCreating ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
                <span className="block mt-1 text-sm">Creating sub area...</span>
              </div>
            ) : subArea1Suggestions.length > 0 ? (
              subArea1Suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSubArea1Select(suggestion)}
                  disabled={isCreating}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-blue-50 focus:outline-none disabled:opacity-50"
                >
                  {suggestion.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No existing sub areas found. Type to create a new one.
              </div>
            )}
            
            {/* Add new sub area 1 option */}
            {subArea1 && subArea1.trim() && !subArea1Suggestions.find(s => s.name.toLowerCase() === subArea1.toLowerCase()) && !isCreating && (
              <button
                type="button"
                onClick={() => handleSubArea1Select(subArea1)}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-t border-gray-200 disabled:opacity-50"
              >
                <div className="flex items-center text-green-600">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  <span className="font-medium">Create "{subArea1}"</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub Area 2 Input */}
      <div className="relative" ref={subArea2Ref}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub Area 2
          <span className="text-gray-500 text-xs ml-1">(e.g., Workstation 1, Zone A) - Optional</span>
          {(!mainArea.trim() || !subArea1?.trim()) && (
            <span className="text-red-500 text-xs ml-1"> - Requires Sub Area 1</span>
          )}
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={subArea2 || ''}
            onChange={(e) => {
              if (!mainArea.trim() || !subArea1?.trim()) return; // Prevent input without sub area 1
              onSubArea2Change?.(e.target.value);
              setIsSubArea2Open(true);
            }}
            onFocus={() => {
              if (mainArea.trim() && subArea1?.trim()) {
                setIsSubArea2Open(true);
                // Load sub area 2 options when focused
                if (subArea2Suggestions.length === 0) {
                  searchSubAreas(mainArea, subArea1);
                }
              }
            }}
            placeholder={
              !mainArea.trim() ? "Select main area first" :
              !subArea1?.trim() ? "Select sub area 1 first" :
              "Enter sub area 2 (optional)..."
            }
            disabled={disabled || !mainArea.trim() || !subArea1?.trim()}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              (!mainArea.trim() || !subArea1?.trim())
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 bg-white'
            } disabled:bg-gray-100`}
          />
          
          {mainArea.trim() && subArea1?.trim() && (
            <button
              type="button"
              onClick={() => setIsSubArea2Open(!isSubArea2Open)}
              disabled={disabled || !mainArea.trim() || !subArea1?.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSubArea2Open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Sub Area 2 Dropdown */}
        {isSubArea2Open && mainArea.trim() && subArea1?.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
            {isCreating ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
                <span className="block mt-1 text-sm">Creating sub area...</span>
              </div>
            ) : subArea2Suggestions.length > 0 ? (
              subArea2Suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSubArea2Select(suggestion)}
                  disabled={isCreating}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-blue-50 focus:outline-none disabled:opacity-50"
                >
                  {suggestion.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No existing sub areas found. Type to create a new one.
              </div>
            )}
            
            {/* Add new sub area 2 option */}
            {subArea2 && subArea2.trim() && !subArea2Suggestions.find(s => s.name.toLowerCase() === subArea2.toLowerCase()) && !isCreating && (
              <button
                type="button"
                onClick={() => handleSubArea2Select(subArea2)}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-t border-gray-200 disabled:opacity-50"
              >
                <div className="flex items-center text-green-600">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  <span className="font-medium">Create "{subArea2}"</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Area Preview */}
      {mainArea && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border">
          <div className="text-sm text-gray-600">
            <strong>Complete Area:</strong> {mainArea}
            {subArea1 && ` > ${subArea1}`}
            {subArea2 && ` > ${subArea2}`}
          </div>
        </div>
      )}
    </div>
  );
}
