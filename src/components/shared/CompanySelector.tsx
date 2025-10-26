import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/api/supabase';

interface Company {
  id: string;
  name: string;
  name_th?: string;
  address?: string;
}

interface CompanySelectorProps {
  value?: string; // Selected company ID
  onChange: (companyId: string, company: Company) => void;
  onCreateNew?: (companyName: string) => Promise<Company | null>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search or select company...',
  required = false,
  error,
  disabled = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load companies
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load selected company details
  useEffect(() => {
    if (value && !selectedCompany) {
      loadSelectedCompany(value);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, name_th, address')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, name_th, address')
        .eq('id', companyId)
        .single<Company>();

      if (error) throw error;
      if (data) {
        setSelectedCompany(data);
        setSearchTerm(data.name_th || data.name);
      }
    } catch (err) {
      console.error('Error loading selected company:', err);
    }
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter((company) => {
    const search = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(search) ||
      company.name_th?.toLowerCase().includes(search) ||
      false
    );
  });

  // Check if search term exactly matches existing company
  const exactMatch = companies.find(
    (c) =>
      c.name.toLowerCase() === searchTerm.toLowerCase() ||
      c.name_th?.toLowerCase() === searchTerm.toLowerCase()
  );

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setSearchTerm(company.name_th || company.name);
    setShowDropdown(false);
    onChange(company.id, company);
  };

  const handleCreateCompany = async () => {
    if (!onCreateNew || !searchTerm.trim()) return;

    setLoading(true);
    try {
      const newCompany = await onCreateNew(searchTerm.trim());
      if (newCompany) {
        // Reload companies list
        await loadCompanies();
        // Select the new company
        handleCompanySelect(newCompany);
      }
    } catch (err) {
      console.error('Error creating company:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);

    // Clear selection if search term is empty
    if (value === '') {
      setSelectedCompany(null);
      onChange('', {} as Company);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && !disabled && !loading && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md border border-gray-300 overflow-auto">
            {/* Existing companies */}
            {filteredCompanies.length > 0 && (
              <>
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-600"
                  >
                    <div className="font-medium">{company.name_th || company.name}</div>
                    {company.name_th && company.name !== company.name_th && (
                      <div className="text-xs text-gray-500">{company.name}</div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Create new company option */}
            {onCreateNew && searchTerm.trim() && !exactMatch && searchTerm.trim().length >= 2 && (
              <div
                onClick={handleCreateCompany}
                className="cursor-pointer px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add new company "{searchTerm.trim()}"
              </div>
            )}

            {/* No results message */}
            {filteredCompanies.length === 0 && !searchTerm.trim() && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Type to search companies{onCreateNew ? ' or create new one' : ''}
              </div>
            )}

            {/* No results and can't create */}
            {filteredCompanies.length === 0 && searchTerm.trim() && !onCreateNew && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No companies found matching "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Required indicator */}
      {required && !error && (
        <p className="mt-1 text-xs text-gray-500">Required</p>
      )}
    </div>
  );
};
