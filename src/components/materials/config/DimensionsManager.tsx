import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/api/supabase';
import { getDimensionGroups, formatDimensionDisplay } from '../../../lib/api/materialSystem';
import type { Dimension, DimensionGroup } from '../../../types/materialSystem';

export const DimensionsManager: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [dimensionGroups, setDimensionGroups] = useState<DimensionGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDimension, setEditingDimension] = useState<Dimension | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    dimension_group_id: '',
    size_1: '',
    size_2: '',
    size_3: '',
    dimension_type: 'common' as 'common' | 'custom',
    display_order: 1,
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDimensions();
  }, [selectedGroupFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const groupsData = await getDimensionGroups();
      setDimensionGroups(groupsData);
      await loadDimensions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDimensions = async () => {
    try {
      let query = supabase
        .from('dimensions')
        .select(`
          *,
          dimension_group:dimension_groups(group_name)
        `)
        .order('display_order', { ascending: true });

      if (selectedGroupFilter) {
        query = query.eq('dimension_group_id', selectedGroupFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDimensions(data || []);
    } catch (error) {
      console.error('Error loading dimensions:', error);
    }
  };

  const handleAdd = () => {
    setEditingDimension(null);
    setFormData({
      dimension_group_id: selectedGroupFilter || '',
      size_1: '',
      size_2: '',
      size_3: '',
      dimension_type: 'common',
      display_order: dimensions.length + 1,
      remark: '',
    });
    setShowModal(true);
  };

  const handleEdit = (dimension: Dimension) => {
    setEditingDimension(dimension);
    setFormData({
      dimension_group_id: dimension.dimension_group_id.toString(),
      size_1: dimension.size_1 || '',
      size_2: dimension.size_2 || '',
      size_3: dimension.size_3 || '',
      dimension_type: dimension.dimension_type,
      display_order: dimension.display_order || 1,
      remark: dimension.remark || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dimension?')) return;

    try {
      const { error } = await (supabase as any)
        .from('dimensions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadDimensions();
      alert('Dimension deleted successfully');
    } catch (error) {
      console.error('Error deleting dimension:', error);
      alert('Failed to delete dimension');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        dimension_group_id: parseInt(formData.dimension_group_id),
        size_1: formData.size_1 || null,
        size_2: formData.size_2 || null,
        size_3: formData.size_3 || null,
        dimension_type: formData.dimension_type,
        display_order: formData.display_order,
        remark: formData.remark || null,
      };

      if (editingDimension) {
        const { error } = await (supabase as any)
          .from('dimensions')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingDimension.id);

        if (error) throw error;
        alert('Dimension updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('dimensions')
          .insert({ ...payload, is_active: true });

        if (error) throw error;
        alert('Dimension created successfully');
      }

      setShowModal(false);
      loadDimensions();
    } catch (error) {
      console.error('Error saving dimension:', error);
      alert('Failed to save dimension');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dimensions</h2>
          <p className="text-sm text-gray-600 mt-1">Individual sizes (1/2", 3/4") with common/custom filtering</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Groups</option>
            {dimensionGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.group_name}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Add Dimension
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimension
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remark
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dimensions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No dimensions found. Click "Add Dimension" to create one.
                </td>
              </tr>
            ) : (
              dimensions.map((dimension) => (
                <tr key={dimension.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(dimension.dimension_group as any)?.group_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dimension.dimension_type === 'common'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {dimension.dimension_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatDimensionDisplay(dimension)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dimension.remark || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dimension.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dimension.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dimension.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(dimension)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dimension.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDimension ? 'Edit Dimension' : 'Add Dimension'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimension Group *
                  </label>
                  <select
                    value={formData.dimension_group_id}
                    onChange={(e) => setFormData({ ...formData, dimension_group_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Group</option>
                    {dimensionGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.group_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size 1 (e.g., "1/2 inch")
                  </label>
                  <input
                    type="text"
                    value={formData.size_1}
                    onChange={(e) => setFormData({ ...formData, size_1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size 2 (e.g., "15 mm")
                  </label>
                  <input
                    type="text"
                    value={formData.size_2}
                    onChange={(e) => setFormData({ ...formData, size_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size 3 (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.size_3}
                    onChange={(e) => setFormData({ ...formData, size_3: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimension Type *
                  </label>
                  <select
                    value={formData.dimension_type}
                    onChange={(e) => setFormData({ ...formData, dimension_type: e.target.value as 'common' | 'custom' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="common">Common (Standard)</option>
                    <option value="custom">Custom (Special Order)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remark
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDimension ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
