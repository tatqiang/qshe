import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/api/supabase';
import { getMaterialGroups, getDimensionGroups, generateTemplatePreview } from '../../../lib/api/materialSystem';
import type { MaterialTemplate, MaterialGroup, DimensionGroup } from '../../../types/materialSystem';

export const MaterialTemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<MaterialTemplate[]>([]);
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [dimensionGroups, setDimensionGroups] = useState<DimensionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MaterialTemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    material_group_id: '',
    title_1: '',
    title_2: '',
    title_3: '',
    title_4: '',
    title_5: '',
    dimension_group_id: '',
    sort_order: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, groupsData, dimGroupsData] = await Promise.all([
        loadTemplates(),
        getMaterialGroups(),
        getDimensionGroups(),
      ]);
      setMaterialGroups(groupsData);
      setDimensionGroups(dimGroupsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('material_templates')
      .select(`
        *,
        material_group:material_groups(group_name),
        dimension_group:dimension_groups(group_name)
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    setTemplates(data || []);
    return data || [];
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormData({
      material_group_id: '',
      title_1: '',
      title_2: '',
      title_3: '',
      title_4: '',
      title_5: '',
      dimension_group_id: '',
      sort_order: templates.length + 1,
    });
    setShowModal(true);
  };

  const handleEdit = (template: MaterialTemplate) => {
    setEditingTemplate(template);
    setFormData({
      material_group_id: template.material_group_id.toString(),
      title_1: template.title_1 || '',
      title_2: template.title_2 || '',
      title_3: template.title_3 || '',
      title_4: template.title_4 || '',
      title_5: template.title_5 || '',
      dimension_group_id: template.dimension_group_id?.toString() || '',
      sort_order: template.sort_order || 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material template?')) return;

    try {
      const { error } = await (supabase as any)
        .from('material_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadTemplates();
      alert('Material template deleted successfully');
    } catch (error) {
      console.error('Error deleting material template:', error);
      alert('Failed to delete material template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        material_group_id: parseInt(formData.material_group_id),
        title_1: formData.title_1 || null,
        title_2: formData.title_2 || null,
        title_3: formData.title_3 || null,
        title_4: formData.title_4 || null,
        title_5: formData.title_5 || null,
        dimension_group_id: formData.dimension_group_id ? parseInt(formData.dimension_group_id) : null,
        sort_order: formData.sort_order,
      };

      if (editingTemplate) {
        const { error } = await (supabase as any)
          .from('material_templates')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        alert('Material template updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('material_templates')
          .insert({ ...payload, is_active: true });

        if (error) throw error;
        alert('Material template created successfully');
      }

      setShowModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving material template:', error);
      alert('Failed to save material template');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Material Templates</h2>
          <p className="text-sm text-gray-600 mt-1">5-column flexible classification templates</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Template
        </button>
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
                Template Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimension Group
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
            {templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No material templates found. Click "Add Template" to create one.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(template.material_group as any)?.group_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{generateTemplatePreview(template)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(template.dimension_group as any)?.group_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? 'Edit Material Template' : 'Add Material Template'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Group *
                    </label>
                    <select
                      value={formData.material_group_id}
                      onChange={(e) => setFormData({ ...formData, material_group_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Group</option>
                      {materialGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.group_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimension Group
                    </label>
                    <select
                      value={formData.dimension_group_id}
                      onChange={(e) => setFormData({ ...formData, dimension_group_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {dimensionGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.group_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title 1 (e.g., "Black Steel")
                  </label>
                  <input
                    type="text"
                    value={formData.title_1}
                    onChange={(e) => setFormData({ ...formData, title_1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title 2 (e.g., "ERW")
                  </label>
                  <input
                    type="text"
                    value={formData.title_2}
                    onChange={(e) => setFormData({ ...formData, title_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title 3 (e.g., "Sch 40, Grade A")
                  </label>
                  <input
                    type="text"
                    value={formData.title_3}
                    onChange={(e) => setFormData({ ...formData, title_3: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title 4 (e.g., "Pipe" or "Elbow 45")
                  </label>
                  <input
                    type="text"
                    value={formData.title_4}
                    onChange={(e) => setFormData({ ...formData, title_4: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title 5 (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title_5}
                    onChange={(e) => setFormData({ ...formData, title_5: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
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
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
