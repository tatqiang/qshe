import React, { useState, useEffect } from 'react';
import { 
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import MultiSelect from '../../common/MultiSelect';
import { MultiSelectRiskItemFilter } from '../../common/MultiSelectRiskItemFilter';
import type { 
  SafetyPatrol, 
  SafetyPatrolFilters, 
  SafetyPatrolSort,
  RiskLevel,
  PatrolStatus,
  RiskCategory
} from '../../../types/safetyPatrol';

interface SafetyPatrolListProps {
  patrols: SafetyPatrol[];
  loading?: boolean;
  onCreateNew: () => void;
  onView: (patrol: SafetyPatrol) => void;
  riskCategories: RiskCategory[];
}

const SafetyPatrolList: React.FC<SafetyPatrolListProps> = ({
  patrols,
  loading = false,
  onCreateNew,
  onView,
  riskCategories
}) => {
  const [filters, setFilters] = useState<SafetyPatrolFilters>({});
  const [sort, setSort] = useState<SafetyPatrolSort>({ field: 'patrolDate', direction: 'desc' });
  const [filteredPatrols, setFilteredPatrols] = useState<SafetyPatrol[]>(patrols);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...patrols];

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(patrol => filters.status!.includes(patrol.status));
    }

    if (filters.riskLevel && filters.riskLevel.length > 0) {
      filtered = filtered.filter(patrol => filters.riskLevel!.includes(patrol.riskLevel));
    }

    if (filters.riskCategories && filters.riskCategories.length > 0) {
      filtered = filtered.filter(patrol => 
        (patrol.riskCategories || []).some(cat => filters.riskCategories!.includes(cat.id))
      );
    }

    if (filters.riskItems && filters.riskItems.length > 0) {
      filtered = filtered.filter(patrol => 
        (patrol.riskItems || []).some(item => filters.riskItems!.includes(item.id))
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(patrol => patrol.patrolDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(patrol => patrol.patrolDate <= filters.dateTo!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (sort.field === 'riskLevel') {
        const riskOrder = { 'low': 1, 'medium': 2, 'high': 3, 'extremely_high': 4 };
        aValue = riskOrder[a.riskLevel];
        bValue = riskOrder[b.riskLevel];
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPatrols(filtered);
  }, [patrols, filters, sort]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'extremely_high': 'bg-red-100 text-red-800'
    };
    return colors[level];
  };

  const getStatusColor = (status: PatrolStatus): string => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-600 text-white'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: PatrolStatus) => {
    const icons = {
      'open': <ExclamationTriangleIcon className="h-4 w-4" />,
      'pending_verification': <ClockIcon className="h-4 w-4" />,
      'closed': <CheckCircleIcon className="h-4 w-4" />,
      'rejected': <XCircleIcon className="h-4 w-4" />
    };
    return icons[status];
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Patrol Count Info */}
      <div className="text-sm text-gray-600">
        {filteredPatrols.length} of {patrols.length} patrols
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <MultiSelect
              label="Risk Categories"
              options={riskCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                color: cat.color,
                icon: cat.icon
              }))}
              selectedIds={filters.riskCategories || []}
              onChange={(ids) => setFilters(prev => ({ ...prev, riskCategories: ids as number[] }))}
              placeholder="All categories"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Items</label>
            <MultiSelectRiskItemFilter
              selectedItemIds={filters.riskItems || []}
              onFilterChange={(ids) => setFilters(prev => ({ ...prev, riskItems: ids }))}
              showCategoryGroups={true}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="mm/dd/yyyy"
              />
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="mm/dd/yyyy"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status?.[0] || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ 
                  ...prev, 
                  status: value ? [value as any] : [] 
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSort({ field: field as any, direction: direction as any });
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="patrolDate-desc">Date (Newest)</option>
              <option value="patrolDate-asc">Date (Oldest)</option>
              <option value="riskLevel-desc">Risk Level (High to Low)</option>
              <option value="riskLevel-asc">Risk Level (Low to High)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="title-asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Patrol List */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading patrols...</span>
          </div>
        </Card>
      ) : filteredPatrols.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patrols found</h3>
            <p className="text-gray-600 mb-4">
              {patrols.length === 0 
                ? "No safety patrols have been created yet." 
                : "No patrols match your current filters."
              }
            </p>
            {patrols.length === 0 ? (
              <Button onClick={onCreateNew}>
                Create your first patrol
              </Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPatrols.map((patrol) => (
            <Card key={patrol.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title section - full width */}
                  <div className="mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight sm:leading-normal">{patrol.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {new Date(patrol.patrolDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Badges section - responsive layout */}
                  <div className="flex flex-wrap gap-2 mb-2 sm:justify-start">
                    {/* Risk Level Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(patrol.riskLevel)}`}>
                      {patrol.riskLevel.replace('_', ' ').toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(patrol.status)}`}>
                      {getStatusIcon(patrol.status)}
                      <span className="ml-1">{patrol.status.replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2 leading-relaxed sm:leading-normal">{patrol.description}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>Risk Score: {patrol.riskScore || 'N/A'}</span>
                    <span>Location: {patrol.location || 'Not specified'}</span>
                  </div>

                  {/* Risk Categories */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(patrol.riskCategories || []).slice(0, 3).map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${category.color}20`, 
                          color: category.color 
                        }}
                      >
                        {category.icon && <span className="mr-1">{category.icon}</span>}
                        {category.name}
                      </span>
                    ))}
                    {(patrol.riskCategories || []).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{(patrol.riskCategories || []).length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Corrective Actions Summary */}
                  {patrol.correctiveActions.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{patrol.correctiveActions.length} corrective action{patrol.correctiveActions.length !== 1 ? 's' : ''}</span>
                      {patrol.correctiveActions.some(action => action.status === 'overdue') && (
                        <XCircleIcon className="h-4 w-4 ml-2 text-red-500" />
                      )}
                    </div>
                  )}

                  {/* Immediate Hazard Indicators */}
                  {(patrol.immediateHazard || patrol.workStopped) && (
                    <div className="flex items-center space-x-2 mt-2">
                      {patrol.immediateHazard && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Immediate Hazard
                        </span>
                      )}
                      {patrol.workStopped && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          Work Stopped
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(patrol)}
                    title="View Patrol Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SafetyPatrolList;
