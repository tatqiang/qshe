import React from 'react';
import { useAuthorityLevels } from '../../hooks/usePositions';
import type { AuthorityLevel } from '../../types';

interface AuthorityLevelSelectorProps {
  value?: AuthorityLevel;
  onChange: (level: AuthorityLevel) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  excludeLevels?: AuthorityLevel[]; // Exclude certain levels (e.g., system_admin)
}

export const AuthorityLevelSelector: React.FC<AuthorityLevelSelectorProps> = ({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  excludeLevels = [],
}) => {
  const { authorityLevels } = useAuthorityLevels();

  const filteredLevels = authorityLevels.filter(
    level => !excludeLevels.includes(level.value as AuthorityLevel)
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as AuthorityLevel);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Authority Level {required && <span className="text-red-500">*</span>}
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
        <option value="">Select authority level...</option>
        {filteredLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-gray-500">
          {filteredLevels.find(l => l.value === value)?.description}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
