import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import type { RiskCategory, RiskItem } from '../../../types/safetyPatrol';

interface RiskManagementProps {
  riskCategories: RiskCategory[];
  riskItems: RiskItem[];
  onUpdateCategories: (categories: RiskCategory[]) => void;
  onUpdateItems: (items: RiskItem[]) => void;
}

const RiskManagement: React.FC<RiskManagementProps> = ({
  riskCategories,
  riskItems,
  onUpdateCategories,
  onUpdateItems
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [editingCategory, setEditingCategory] = useState<RiskCategory | null>(null);
  const [editingItem, setEditingItem] = useState<RiskItem | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🏗️'
  });

  // Item form
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: 'equipment' as 'equipment' | 'procedure' | 'environmental'
  });

  const handleSaveCategory = () => {
    const newCategory: RiskCategory = {
      id: editingCategory?.id || Date.now(),
      ...categoryForm,
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingCategory) {
      onUpdateCategories(riskCategories.map(cat => 
        cat.id === editingCategory.id ? newCategory : cat
      ));
    } else {
      onUpdateCategories([...riskCategories, newCategory]);
    }

    resetCategoryForm();
  };

  const handleSaveItem = () => {
    const newItem: RiskItem = {
      id: editingItem?.id || Date.now(),
      ...itemForm,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      onUpdateItems(riskItems.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
    } else {
      onUpdateItems([...riskItems, newItem]);
    }

    resetItemForm();
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', color: '#3B82F6', icon: '🏗️' });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetItemForm = () => {
    setItemForm({ name: '', description: '', category: 'equipment' });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const editCategory = (category: RiskCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const editItem = (item: RiskItem) => {
    setItemForm({
      name: item.name,
      description: item.description || '',
      category: item.category
    });
    setEditingItem(item);
    setShowItemForm(true);
  };

  const deleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      onUpdateCategories(riskCategories.filter(cat => cat.id !== id));
    }
  };

  const deleteItem = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      onUpdateItems(riskItems.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Risk Categories ({riskCategories.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Risk Items ({riskItems.length})
          </button>
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Risk Categories</h3>
            <Button onClick={() => setShowCategoryForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <Card title={editingCategory ? 'Edit Category' : 'Add New Category'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={categoryForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Work"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={categoryForm.icon}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="🏗️"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Brief description of this risk category..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-20 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">{categoryForm.color}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSaveCategory}>
                    {editingCategory ? 'Update' : 'Add'} Category
                  </Button>
                  <Button variant="outline" onClick={resetCategoryForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskCategories.map((category) => (
              <Card key={category.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => editCategory(category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Risk Items</h3>
            <Button onClick={() => setShowItemForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Item Form */}
          {showItemForm && (
            <Card title={editingItem ? 'Edit Item' : 'Add New Item'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={itemForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., PPE not worn"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="equipment">Equipment</option>
                      <option value="procedure">Procedure</option>
                      <option value="environmental">Environmental</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Detailed description of this risk item..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSaveItem}>
                    {editingItem ? 'Update' : 'Add'} Item
                  </Button>
                  <Button variant="outline" onClick={resetItemForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Items List - Card View */}
          {riskItems.length === 0 ? (
            <Card padding="sm" className="sm:p-8 text-center">
              <p className="text-gray-500 text-sm sm:text-base">
                No risk items found. Add the first one above.
              </p>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {riskItems.map((item) => (
                <Card key={item.id} padding="sm" className="sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        {item.name}
                      </h4>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.category === 'equipment' ? 'bg-blue-100 text-blue-800' :
                        item.category === 'procedure' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
                      <button
                        onClick={() => editItem(item)}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      {item.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskManagement;
