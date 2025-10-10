import React from 'react';
import { usePositions } from '../../hooks/usePositions';

interface PositionSelectorProps {
  userType: 'internal' | 'external' | 'worker';
  value?: number;
  onChange: (positionId: number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const PositionSelector: React.FC<PositionSelectorProps> = ({
  userType,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  const { positions, isLoading, error: fetchError } = usePositions({ userType });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const positionId = parseInt(e.target.value);
    if (!isNaN(positionId)) {
      onChange(positionId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Position {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
          Loading positions...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Position {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600">
          Error loading positions: {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Position {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
        required={required}
      >
        <option value="">Select a position...</option>
        {positions.map((position) => (
          <option key={position.id} value={position.id}>
            {position.positionTitle} ({position.code})
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {positions.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500">
          No positions available for {userType} users
        </p>
      )}
    </div>
  );
};
