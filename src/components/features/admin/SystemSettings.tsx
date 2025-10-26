import React, { useState, useEffect } from 'react';
import { 
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  CogIcon,
  UserGroupIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { AdminOnly } from '../../common/RoleGuard';
import RiskManagement from '../safety/RiskManagement';
import ProjectManagement from '../projects/ProjectManagement';
import { getRiskCategories, getRiskItems } from '../../../lib/api/riskApi';
import { useAppContext } from '../../../contexts/AppContext';

import type { RiskCategory, RiskItem } from '../../../types/safetyPatrol';

export const SystemSettings: React.FC = () => {
  const { project } = useAppContext();
  const [activeTab, setActiveTab] = useState<'projects' | 'risk-management' | 'system' | 'users'>('projects');
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
      id: 'projects' as const,
      label: 'Project Management',
      icon: FolderIcon,
      description: 'Create and manage projects from Supabase database'
    },
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
      case 'projects':
        return (
          <div className="space-y-6">
            <ProjectManagement />
          </div>
        );
      case 'risk-management':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Risk Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage risk categories and risk items that are available for safety patrol assessments.
                Changes here will affect all future safety patrols.
              </p>
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
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="space-y-3 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <WrenchScrewdriverIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage system-wide configuration and administrative features
                </p>
              </div>
            </div>
          </div>

          {/* Tabs - Outside Card */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4 md:gap-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-[10px] sm:text-xs md:text-sm
                      ${isActive 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-0.5 sm:mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="inline sm:hidden truncate max-w-[60px]">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Card */}
          <Card padding="sm" className="sm:p-6">
            {renderTabContent()}
          </Card>
        </div>
      </div>
    </AdminOnly>
  );
};

export default SystemSettings;