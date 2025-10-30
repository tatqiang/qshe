import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CubeIcon, FolderIcon, TagIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import { MaterialGroupsManager } from '../../components/materials/config/MaterialGroupsManager';
import { MaterialTemplatesManager } from '../../components/materials/config/MaterialTemplatesManager';
import { DimensionGroupsManager } from '../../components/materials/config/DimensionGroupsManager';
import { DimensionsManager } from '../../components/materials/config/DimensionsManager';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const MaterialConfigPage: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    { name: 'Material Groups', icon: FolderIcon, description: 'Top-level categories (Pipes, Valves, etc.)' },
    { name: 'Material Templates', icon: TagIcon, description: '5-column flexible classification templates' },
    { name: 'Dimension Groups', icon: RectangleGroupIcon, description: 'Size categories (Nominal Pipe, Copper Pipe)' },
    { name: 'Dimensions', icon: CubeIcon, description: 'Individual sizes (1/2", 3/4") with common/custom filtering' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <CubeIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Configuration</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage material groups, templates, dimension groups, and dimensions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {/* Material Groups Panel */}
            <Tab.Panel className={classNames('rounded-xl bg-white p-4 sm:p-6', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2')}>
              <MaterialGroupsManager />
            </Tab.Panel>

            {/* Material Templates Panel */}
            <Tab.Panel className={classNames('rounded-xl bg-white p-4 sm:p-6', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2')}>
              <MaterialTemplatesManager />
            </Tab.Panel>

            {/* Dimension Groups Panel */}
            <Tab.Panel className={classNames('rounded-xl bg-white p-4 sm:p-6', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2')}>
              <DimensionGroupsManager />
            </Tab.Panel>

            {/* Dimensions Panel */}
            <Tab.Panel className={classNames('rounded-xl bg-white p-4 sm:p-6', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2')}>
              <DimensionsManager />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default MaterialConfigPage;
