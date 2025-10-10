import React, { useState, useEffect } from 'react';
import { 
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  CogIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { AdminOnly } from '../../common/RoleGuard';
import RiskManagement from '../safety/RiskManagement';
import { getRiskCategories, getRiskItems } from '../../../lib/api/riskApi';
import { useAppContext } from '../../../contexts/AppContext';

import type { RiskCategory, RiskItem } from '../../../types/safetyPatrol';

export const SystemSettings: React.FC = () => {
  const { project } = useAppContext();
  const [activeTab, setActiveTab] = useState<'risk-management' | 'system' | 'users'>('risk-management');
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load risk data when component mounts
  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      const [categories, items] = await Promise.all([
        getRiskCategories(),
        getRiskItems()
      ]);
      setRiskCategories(categories || []);
      setRiskItems(items || []);
    } catch (error) {
      console.error('Failed to load risk data:', error);
      setRiskCategories([]);
      setRiskItems([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'risk-management' as const,
      label: 'Risk Management',
      icon: ShieldCheckIcon,
      description: 'Manage risk categories and risk items for safety patrols'
    },
    {
      id: 'system' as const,
      label: 'System Configuration',
      icon: CogIcon,
      description: 'Configure system settings and parameters'
    },
    {
      id: 'users' as const,
      label: 'User Settings',
      icon: UserGroupIcon,
      description: 'Manage user roles and permissions'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'risk-management':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Risk Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage risk categories and risk items that are available for safety patrol assessments.
                Changes here will affect all future safety patrols.
              </p>
              {project && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <strong>Current Project:</strong> {project.name} ({project.project_code})
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading risk data...</span>
              </div>
            ) : (
              <RiskManagement 
                riskCategories={riskCategories}
                riskItems={riskItems}
                onUpdateCategories={setRiskCategories}
                onUpdateItems={setRiskItems}
              />
            )}
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure global system settings and parameters.
              </p>
            </div>
            
            <div className="text-center py-12">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Configuration</h3>
              <p className="text-gray-600">
                System configuration features will be available in a future update.
              </p>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">User Settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage user roles, permissions, and access controls.
              </p>
            </div>
            
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Settings</h3>
              <p className="text-gray-600 mb-4">
                Advanced user management features will be available in a future update.
              </p>
              <p className="text-sm text-gray-500">
                For now, you can manage users through the Users page in the main navigation.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">
                  Manage system-wide configuration and administrative features
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Card>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                        ${isActive 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {renderTabContent()}
            </div>
          </Card>
        </div>
      </div>
    </AdminOnly>
  );
};

export default SystemSettings;