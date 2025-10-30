import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CubeIcon, 
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { CompanySingleSelect } from '../components/common/CompanySingleSelect';
import { 
  getMaterialGroups,
  getMaterialTemplates,
  getDimensionsForTemplate,
  createMaterialsBulk,
  generateTemplatePreview,
  formatDimensionDisplay
} from '../lib/api/materialSystem';
import type {
  MaterialGroup,
  MaterialTemplate,
  Dimension,
  MaterialCreateInput
} from '../types/materialSystem';

export const MaterialsAddPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Master data
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [materialTemplates, setMaterialTemplates] = useState<MaterialTemplate[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<Dimension[]>([]);
  
  // Form selections
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MaterialTemplate | null>(null);
  const [dimensionTypeFilter, setDimensionTypeFilter] = useState<'all' | 'common' | 'custom'>('all');
  const [selectedDimensions, setSelectedDimensions] = useState<number[]>([]);
  
  // Material properties
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('PCS');
  const [requiresLotTracking, setRequiresLotTracking] = useState(false);
  const [requiresSerialTracking, setRequiresSerialTracking] = useState(false);
  const [requiresExpiryTracking, setRequiresExpiryTracking] = useState(false);

  // Load material groups on mount
  useEffect(() => {
    loadMaterialGroups();
  }, []);

  // Load templates when group changes
  useEffect(() => {
    if (selectedGroupId) {
      loadMaterialTemplates(selectedGroupId);
    } else {
      setMaterialTemplates([]);
      setSelectedTemplateId(null);
      setSelectedTemplate(null);
    }
  }, [selectedGroupId]);

  // Load dimensions when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      loadDimensions(selectedTemplateId);
    } else {
      setAvailableDimensions([]);
      setSelectedDimensions([]);
    }
  }, [selectedTemplateId]);

  const loadMaterialGroups = async () => {
    try {
      const data = await getMaterialGroups();
      setMaterialGroups(data);
    } catch (error) {
      console.error('Error loading material groups:', error);
    }
  };

  const loadMaterialTemplates = async (groupId: number) => {
    try {
      const data = await getMaterialTemplates(groupId);
      setMaterialTemplates(data);
    } catch (error) {
      console.error('Error loading material templates:', error);
    }
  };

  const loadDimensions = async (templateId: number) => {
    try {
      const data = await getDimensionsForTemplate(templateId);
      setAvailableDimensions(data);
      setSelectedDimensions([]);
    } catch (error) {
      console.error('Error loading dimensions:', error);
      setAvailableDimensions([]);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplateId(templateId);
    const template = materialTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };

  const handleDimensionToggle = (dimensionId: number) => {
    setSelectedDimensions(prev => 
      prev.includes(dimensionId)
        ? prev.filter(id => id !== dimensionId)
        : [...prev, dimensionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      alert('Please select a material template');
      return;
    }

    if (availableDimensions.length > 0 && selectedDimensions.length === 0) {
      alert('Please select at least one dimension');
      return;
    }

    try {
      setLoading(true);

      const materials: MaterialCreateInput[] = [];

      if (selectedDimensions.length > 0) {
        // Create material for each selected dimension
        selectedDimensions.forEach(dimensionId => {
          materials.push({
            material_template_id: selectedTemplateId,
            dimension_id: dimensionId,
            unit_of_measure: unitOfMeasure,
            requires_lot_tracking: requiresLotTracking,
            requires_serial_tracking: requiresSerialTracking,
            requires_expiry_tracking: requiresExpiryTracking,
            company_id: selectedCompanyId || null,
          });
        });
      } else {
        // Create single material without dimension
        materials.push({
          material_template_id: selectedTemplateId,
          dimension_id: null,
          unit_of_measure: unitOfMeasure,
          requires_lot_tracking: requiresLotTracking,
          requires_serial_tracking: requiresSerialTracking,
          requires_expiry_tracking: requiresExpiryTracking,
          company_id: selectedCompanyId || null,
        });
      }

      await createMaterialsBulk(materials);
      alert(`Successfully created ${materials.length} material(s)`);
      navigate('/materials');
    } catch (error) {
      console.error('Error creating materials:', error);
      alert('Failed to create materials');
    } finally {
      setLoading(false);
    }
  };

  const filteredDimensions = availableDimensions.filter(dim => {
    if (dimensionTypeFilter === 'all') return true;
    return dim.dimension_type === dimensionTypeFilter;
  });

  const templatePreview = selectedTemplate ? generateTemplatePreview(selectedTemplate) : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/materials')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Materials
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CubeIcon className="w-8 h-8" />
            Add New Materials
          </h1>
          <p className="mt-2 text-gray-600">
            Select a material template and dimensions to create materials in bulk
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Company Selection */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <CompanySingleSelect
                  selectedCompanyId={selectedCompanyId}
                  onSelectionChange={setSelectedCompanyId}
                  label="Company (Optional - Leave blank for JEC)"
                  placeholder="Search or add company..."
                  required={false}
                />
              </div>

              {/* Material Selection */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Material Classification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Material Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Group *
                    </label>
                    <select
                      value={selectedGroupId || ''}
                      onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Group</option>
                      {materialGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.group_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit of Measure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit of Measure *
                    </label>
                    <select
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="M">M (Meters)</option>
                      <option value="KG">KG (Kilograms)</option>
                      <option value="L">L (Liters)</option>
                      <option value="SET">SET</option>
                      <option value="BOX">BOX</option>
                      <option value="ROLL">ROLL</option>
                    </select>
                  </div>
                </div>

                {/* Material Template Selection */}
                {selectedGroupId && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Template *
                    </label>
                    <select
                      value={selectedTemplateId || ''}
                      onChange={(e) => handleTemplateChange(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Template</option>
                      {materialTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {generateTemplatePreview(template)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Template Preview */}
                {templatePreview && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Template Preview:
                    </p>
                    <p className="text-lg text-blue-700 font-semibold">
                      {templatePreview}
                    </p>
                  </div>
                )}
              </div>

              {/* Dimension Selection */}
              {availableDimensions.length > 0 && (
                <div className="border-b pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Select Dimensions/Sizes *
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedDimensions.length} dimension(s) selected
                      </p>
                    </div>
                    
                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Filter:</label>
                      <select
                        value={dimensionTypeFilter}
                        onChange={(e) => setDimensionTypeFilter(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="common">Common Only</option>
                        <option value="custom">Custom Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left">
                              <input
                                type="checkbox"
                                checked={selectedDimensions.length === filteredDimensions.length && filteredDimensions.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDimensions(filteredDimensions.map(d => d.id));
                                  } else {
                                    setSelectedDimensions([]);
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Dimension
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remark
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredDimensions.map((dim) => (
                            <tr key={dim.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedDimensions.includes(dim.id)}
                                  onChange={() => handleDimensionToggle(dim.id)}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  dim.dimension_type === 'common'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {dim.dimension_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {formatDimensionDisplay(dim)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {dim.remark || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Options */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Options</h2>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requiresLotTracking}
                      onChange={(e) => setRequiresLotTracking(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Lot Tracking</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requiresSerialTracking}
                      onChange={(e) => setRequiresSerialTracking(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Serial Tracking</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requiresExpiryTracking}
                      onChange={(e) => setRequiresExpiryTracking(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Expiry Tracking</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/materials')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                {loading ? 'Creating...' : `Create ${selectedDimensions.length || 1} Material(s)`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
