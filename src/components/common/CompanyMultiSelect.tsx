// ============================================
// COMPANY MULTI-SELECT COMPONENT
// ============================================
// Searchable multi-select dropdown with ability to add new companies
// Used in Safety Audit form for company selection
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

interface CompanyMultiSelectProps {
  selectedCompanyIds: string[];
  onSelectionChange: (companyIds: string[]) => void;
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
      setCompanyNameTh(''); // Start empty for Thai name
    }
  }, [isOpen, initialCompanyName]);

  const handleConfirm = () => {
    if (!companyName.trim()) {
      alert('Please enter company name in English');
      return;
    }
    onConfirm(companyName.trim(), companyNameTh.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Create New Company
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
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !companyName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CompanyMultiSelect: React.FC<CompanyMultiSelectProps> = ({
  selectedCompanyIds,
  onSelectionChange,
  placeholder = 'Search or add companies...',
  label = 'Companies',
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
      
      // Check auth session first
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔍 Auth Session Check:', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
        userEmail: sessionData.session?.user?.email,
        role: sessionData.session?.user?.role
      });
      
      console.log('🔍 Fetching companies from Supabase (authenticated session)...');
      
      // Use shared authenticated Supabase client (includes user session)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching companies:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('✅ Query successful - Loaded companies:', data?.length || 0);
      console.log('📋 Company data:', data);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No companies found in database!');
        console.warn('🔍 Debugging info:');
        console.warn('- RLS policies may be blocking access');
        console.warn('- User may not have authenticated role');
        console.warn('- Table may be empty');
        console.warn('- Check Supabase dashboard for data');
      }
      
      setCompanies(data || []);
    } catch (error) {
      console.error('❌ Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
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

  // Get selected companies for display
  const selectedCompanies = companies.filter((company) =>
    selectedCompanyIds.includes(company.id)
  );

  // ============================================
  // HANDLE COMPANY SELECTION
  // ============================================

  const handleSelectCompany = (company: Company) => {
    if (!selectedCompanyIds.includes(company.id)) {
      onSelectionChange([...selectedCompanyIds, company.id]);
    }
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemoveCompany = (companyId: string) => {
    onSelectionChange(selectedCompanyIds.filter((id) => id !== companyId));
  };

  // ============================================
  // CREATE NEW COMPANY
  // ============================================

  const handleCreateCompanyRequest = () => {
    if (!searchTerm.trim()) return;
    setPendingCompanyName(searchTerm.trim());
    setShowConfirmation(true);
    setShowDropdown(false);
  };

  const confirmCreateCompany = async (companyName: string, companyNameTh: string) => {
    if (!companyName.trim()) return;

    try {
      setIsCreatingCompany(true);

      // Prepare company data
      const companyData = {
        name: companyName.trim(),
        name_th: companyNameTh.trim() || null,
        status: 'active' as const,
      };

      console.log('📝 Creating company with data:', companyData);

      // Use shared authenticated Supabase client (includes user session)
      const { data: newCompany, error } = await (supabase
        .from('companies') as any)
        .insert([companyData])
        .select()
        .single();

      if (error) {
        // Handle RLS policy error
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
        setCompanies((prev) => [...prev, newCompany]);
        
        // Auto-select the new company
        onSelectionChange([...selectedCompanyIds, newCompany.id]);
        
        // Clear search
        setSearchTerm('');
        setPendingCompanyName('');
        setShowConfirmation(false);
        
        // Focus input for more selections
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Failed to create company. Please try again.');
    } finally {
      setIsCreatingCompany(false);
    }
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

      {/* Selected Companies (Tags) */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCompanies.map((company) => (
            <div
              key={company.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              <span>{company.name_th || company.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveCompany(company.id)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
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
          placeholder={placeholder}
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
                const isSelected = selectedCompanyIds.includes(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    disabled={isSelected}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      isSelected
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{company.name_th || company.name}</span>
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
              No companies match "{searchTerm}"
              <div className="text-xs mt-1">
                {companies.length} companies available
              </div>
            </div>
          )}

          {/* Add New Company Option */}
          {searchTerm.trim() && !exactMatch && !isLoading && (
            <button
              type="button"
              onClick={handleCreateCompanyRequest}
              className="w-full text-left px-4 py-2 border-t border-gray-200 hover:bg-blue-50 transition-colors text-blue-600 font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add new company "{searchTerm.trim()}"
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        initialCompanyName={pendingCompanyName}
        onConfirm={confirmCreateCompany}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingCompanyName('');
        }}
        isLoading={isCreatingCompany}
      />
    </div>
  );
};
