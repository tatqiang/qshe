// ============================================
// COMPANY SINGLE-SELECT COMPONENT (with Bilingual Modal)
// ============================================
// Based on CompanyMultiSelect but for single selection
// Used in Token Management for selecting ONE company
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/api/supabase';

// ============================================
// TYPES
// ============================================

interface Company {
  id: string;
  name: string;
  name_th?: string;
}

interface CompanySingleSelectProps {
  selectedCompanyId: string;
  onSelectionChange: (companyId: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

// ============================================
// CONFIRMATION MODAL
// ============================================

interface ConfirmationModalProps {
  isOpen: boolean;
  initialCompanyName: string;
  onConfirm: (companyName: string, companyNameTh: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  initialCompanyName,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const [companyName, setCompanyName] = React.useState('');
  const [companyNameTh, setCompanyNameTh] = React.useState('');

  // Initialize fields when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCompanyName(initialCompanyName);
      setCompanyNameTh('');
    }
  }, [isOpen, initialCompanyName]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (companyName.trim()) {
      onConfirm(companyName.trim(), companyNameTh.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onCancel} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Company
          </h3>

          {/* Company Name (English) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., ABC Construction Co., Ltd."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Company Name (Thai) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (Thai) <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={companyNameTh}
              onChange={(e) => setCompanyNameTh(e.target.value)}
              placeholder="เช่น บริษัท เอบีซี ก่อสร้าง จำกัด"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !companyName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Create Company
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CompanySingleSelect: React.FC<CompanySingleSelectProps> = ({
  selectedCompanyId,
  onSelectionChange,
  placeholder = 'Search or add company...',
  label = 'Company',
  required = false,
}) => {
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingCompanyName, setPendingCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FETCH COMPANIES FROM SUPABASE
  // ============================================

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching companies:', error);
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} companies`);
      setCompanies(data || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // CREATE NEW COMPANY
  // ============================================

  const handleCreateCompanyClick = () => {
    setPendingCompanyName(searchTerm.trim());
    setShowConfirmation(true);
  };

  const handleConfirmCreateCompany = async (companyName: string, companyNameTh: string) => {
    try {
      setIsCreatingCompany(true);

      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert([
          {
            name: companyName,
            name_th: companyNameTh || null,
            status: 'active',
          } as any,
        ] as any)
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          alert('Unable to create company due to database permissions. Please contact your administrator.');
          console.error('RLS policy error:', error);
        } else {
          alert(`Failed to create company: ${error.message}`);
          console.error('Error creating company:', error);
        }
        return;
      }

      if (newCompany) {
        console.log('✅ Created new company:', newCompany);
        
        // Add to companies list
        setCompanies((prev) => [...prev, newCompany as Company]);
        
        // Select the new company
        onSelectionChange((newCompany as Company).id);
        
        // Clear search and close modal
        setSearchTerm('');
        setPendingCompanyName('');
        setShowConfirmation(false);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Failed to create company. Please try again.');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  // ============================================
  // FILTER COMPANIES
  // ============================================

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.name_th && company.name_th.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if search term exactly matches an existing company
  const exactMatch = companies.some(
    (company) =>
      company.name.toLowerCase() === searchTerm.toLowerCase() ||
      (company.name_th && company.name_th.toLowerCase() === searchTerm.toLowerCase())
  );

  // Get selected company for display
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);

  // ============================================
  // HANDLE COMPANY SELECTION
  // ============================================

  const handleSelectCompany = (company: Company) => {
    onSelectionChange(company.id);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onSelectionChange('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  // ============================================
  // CLICK OUTSIDE TO CLOSE DROPDOWN
  // ============================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Company Display */}
      {selectedCompany && (
        <div className="mb-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <span>{selectedCompany.name_th || selectedCompany.name}</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={selectedCompany ? 'Search to change company...' : placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <span className="animate-spin text-gray-400">⏳</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Loading State */}
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Loading companies...
            </div>
          ) : companies.length === 0 ? (
            /* No Companies in Database */
            <div className="px-4 py-3 text-sm text-gray-500">
              No companies in database. Type to add a new one.
            </div>
          ) : filteredCompanies.length > 0 ? (
            /* Filtered Companies */
            <div>
              {filteredCompanies.map((company) => {
                const isSelected = selectedCompanyId === company.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{company.name_th || company.name}</span>
                      {isSelected && (
                        <span className="text-xs text-blue-600 font-medium">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    {company.name_th && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {company.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* No Match for Search */
            <div className="px-4 py-3 text-sm text-gray-500">
              {searchTerm.trim().length < 2 ? (
                'Type at least 2 characters to add a new company'
              ) : exactMatch ? (
                'Company already exists in the list above'
              ) : (
                <button
                  type="button"
                  onClick={handleCreateCompanyClick}
                  className="w-full text-left text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add "{searchTerm.trim()}" as new company
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        initialCompanyName={pendingCompanyName}
        onConfirm={handleConfirmCreateCompany}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingCompanyName('');
        }}
        isLoading={isCreatingCompany}
      />
    </div>
  );
};
