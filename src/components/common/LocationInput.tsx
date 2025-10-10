import React, { useState } from 'react';
import { HierarchicalAreaInput } from './HierarchicalAreaInput';
import { Input } from './Input';

interface LocationData {
  mainArea: string;
  subArea1?: string;
  subArea2?: string;
  specificLocation?: string;
  areaId?: string;
}

interface LocationInputProps {
  // Current values
  mainArea: string;
  subArea1?: string;
  subArea2?: string;
  specificLocation?: string;
  
  // Handlers
  onLocationChange: (location: LocationData) => void;
  
  // Configuration
  projectId: string;
  disabled?: boolean;
  className?: string;
  
  // Labels (customizable for different features)
  labels?: {
    mainArea?: string;
    subArea1?: string;
    subArea2?: string;
    specificLocation?: string;
  };
  
  // Placeholders
  placeholders?: {
    mainArea?: string;
    subArea1?: string;
    subArea2?: string;
    specificLocation?: string;
  };
}

export function LocationInput({
  mainArea,
  subArea1,
  subArea2,
  specificLocation,
  onLocationChange,
  projectId,
  disabled = false,
  className = '',
  labels = {},
  placeholders = {}
}: LocationInputProps) {
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const defaultLabels = {
    mainArea: 'Main Area',
    subArea1: 'Sub Area 1',
    subArea2: 'Sub Area 2',
    specificLocation: 'Specific Location',
    ...labels
  };

  const defaultPlaceholders = {
    mainArea: 'Enter or search main area...',
    subArea1: 'Enter sub area 1...',
    subArea2: 'Enter sub area 2...',
    specificLocation: 'e.g., North wall, near column A1',
    ...placeholders
  };

  const handleAreaChange = (newMainArea: string, area?: any) => {
    const newLocation: LocationData = {
      mainArea: newMainArea,
      subArea1: '',
      subArea2: '',
      specificLocation: specificLocation || '',
      areaId: area?.id
    };
    setSelectedArea(area);
    onLocationChange(newLocation);
  };

  const handleSubArea1Change = (newSubArea1: string) => {
    const newLocation: LocationData = {
      mainArea,
      subArea1: newSubArea1,
      subArea2: '',
      specificLocation: specificLocation || '',
      areaId: selectedArea?.id
    };
    onLocationChange(newLocation);
  };

  const handleSubArea2Change = (newSubArea2: string) => {
    const newLocation: LocationData = {
      mainArea,
      subArea1,
      subArea2: newSubArea2,
      specificLocation: specificLocation || '',
      areaId: selectedArea?.id
    };
    onLocationChange(newLocation);
  };

  const handleSpecificLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation: LocationData = {
      mainArea,
      subArea1,
      subArea2,
      specificLocation: event.target.value,
      areaId: selectedArea?.id
    };
    onLocationChange(newLocation);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hierarchical Area Input */}
      <HierarchicalAreaInput
        projectId={projectId}
        mainArea={mainArea}
        subArea1={subArea1}
        subArea2={subArea2}
        onMainAreaChange={handleAreaChange}
        onSubArea1Change={handleSubArea1Change}
        onSubArea2Change={handleSubArea2Change}
        onAreaSelected={(area) => setSelectedArea(area)}
        disabled={disabled}
      />

      {/* Specific Location */}
      <div>
        <Input
          label={defaultLabels.specificLocation}
          value={specificLocation || ''}
          onChange={handleSpecificLocationChange}
          placeholder={defaultPlaceholders.specificLocation}
          disabled={disabled}
        />
      </div>

      {/* Area Selection Feedback */}
      {selectedArea && (
        <p className="text-xs text-green-600">
          ✓ Area "{selectedArea.areaName}" (Code: {selectedArea.areaCode})
        </p>
      )}
    </div>
  );
}

// Export the interface for use in other components
export type { LocationData, LocationInputProps };
