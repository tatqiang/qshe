import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

export interface User {
  id: string;
  email: string;
  full_name: string;
  position_title?: string;
  department?: string;
  employee_id?: string;
  _source?: string;
}

interface UserSelectProps {
  value?: string;
  onChange: (userId: string, user?: User) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  users?: User[];
  allowClear?: boolean;
  className?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  placeholder = "Select a user...",
  error,
  disabled = false,
  required = false,
  label,
  users = [],
  allowClear = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

  const selectedUser = users.find(user => user.id === value);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSelect = (user: User) => {
    onChange(user.id, user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Selected Value Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full min-h-[2.5rem] px-3 py-2 text-left bg-white border rounded-md shadow-sm
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {selectedUser ? (
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {selectedUser.full_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {selectedUser.position_title} • {selectedUser.department}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {selectedUser && allowClear && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Clear selection</span>
                  ×
                </button>
              )}
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={`
                      w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                      ${user.id === value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {user.full_name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.position_title} • {user.department}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {user.email} • ID: {user.employee_id}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};