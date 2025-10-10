import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';
import type { 
  CorrectiveActionFormDataEnhanced
} from '../../../types/correctiveActionsEnhanced';
import type { ActionType } from '../../../types/safetyPatrol';

interface CorrectiveActionFormProps {
  onSubmit: (data: CorrectiveActionFormDataEnhanced) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CorrectiveActionFormDataEnhanced>;
}

const CorrectiveActionForm: React.FC<CorrectiveActionFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<CorrectiveActionFormDataEnhanced>({
    defaultValues: {
      description: initialData?.description || '',
      actionType: initialData?.actionType || 'immediate',
      rootCauseAnalysis: initialData?.rootCauseAnalysis || '',
      assignedTo: initialData?.assignedTo || '',
      dueDate: initialData?.dueDate || '',
      estimatedCost: initialData?.estimatedCost || undefined,
      resourcesRequired: initialData?.resourcesRequired || [],
      riskLevel: initialData?.riskLevel || 'medium',
      requiresImmediateAction: initialData?.requiresImmediateAction || false
    }
  });

  const watchedActionType = watch('actionType');
  const watchedEstimatedCost = watch('estimatedCost');

  const actionTypeOptions: Array<{ value: ActionType; label: string; description: string }> = [
    { 
      value: 'immediate', 
      label: 'Immediate Action', 
      description: 'Must be completed within 24 hours' 
    },
    { 
      value: 'short_term', 
      label: 'Short Term Action', 
      description: 'To be completed within 1-4 weeks' 
    },
    { 
      value: 'long_term', 
      label: 'Long Term Action', 
      description: 'To be completed within 1-6 months' 
    },
    { 
      value: 'preventive', 
      label: 'Preventive Action', 
      description: 'Prevent recurrence of the issue' 
    }
  ];

  const riskLevelOptions = [
    { value: 'low', label: 'Low Risk', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Risk', color: 'text-yellow-600' },
    { value: 'high', label: 'High Risk', color: 'text-red-600' },
    { value: 'extremely_high', label: 'Extremely High Risk', color: 'text-red-800' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleFormSubmit = async (data: CorrectiveActionFormDataEnhanced) => {
    try {
      setLoading(true);
      
      // Add selected files to form data
      const formDataWithFiles = {
        ...data,
        planningPhotos: selectedFiles.length > 0 ? selectedFiles : undefined
      };
      
      await onSubmit(formDataWithFiles);
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinDueDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum tomorrow
    return today.toISOString().split('T')[0];
  };

  const getRecommendedDueDate = () => {
    const today = new Date();
    const daysToAdd = watchedActionType === 'immediate' ? 1 
                   : watchedActionType === 'short_term' ? 14 
                   : watchedActionType === 'long_term' ? 90 
                   : 30;
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };

  const getApprovalRequirements = () => {
    const cost = watchedEstimatedCost || 0;
    const requirements = ['Supervisor approval'];
    
    if (cost > 10000) {
      requirements.push('Manager approval');
    }
    
    if (cost > 50000) {
      requirements.push('Executive approval');
    }
    
    return requirements;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Action Description */}
      <Card title="Action Details" className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Description *
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Action description is required' }}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the corrective action to be taken..."
                />
              )}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type *
              </label>
              <Controller
                name="actionType"
                control={control}
                rules={{ required: 'Action type is required' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {actionTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {watchedActionType && (
                <p className="text-sm text-gray-600 mt-1">
                  {actionTypeOptions.find(opt => opt.value === watchedActionType)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level *
              </label>
              <Controller
                name="riskLevel"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {riskLevelOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Cause Analysis
            </label>
            <Controller
              name="rootCauseAnalysis"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Analyze the root cause of the issue that led to this corrective action..."
                />
              )}
            />
          </div>
        </div>
      </Card>

      {/* Assignment and Timeline */}
      <Card title="Assignment & Timeline" className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Assigned To *
              </label>
              <Controller
                name="assignedTo"
                control={control}
                rules={{ required: 'Assignee is required' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Assignee</option>
                    <option value="user1">John Doe (Supervisor)</option>
                    <option value="user2">Jane Smith (Safety Officer)</option>
                    <option value="user3">Mike Johnson (Maintenance)</option>
                    {/* TODO: Load actual users from API */}
                  </select>
                )}
              />
              {errors.assignedTo && (
                <p className="text-red-600 text-sm mt-1">{errors.assignedTo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Due Date *
              </label>
              <Controller
                name="dueDate"
                control={control}
                rules={{ required: 'Due date is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    min={getMinDueDate()}
                    className="w-full"
                  />
                )}
              />
              {errors.dueDate && (
                <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Recommended: {new Date(getRecommendedDueDate()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <Controller
              name="requiresImmediateAction"
              control={control}
              render={({ field }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    This action requires immediate attention (high priority)
                  </span>
                </label>
              )}
            />
          </div>
        </div>
      </Card>

      {/* Resources and Cost */}
      <Card title="Resources & Cost" className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Estimated Cost
            </label>
            <Controller
              name="estimatedCost"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Input
                  {...field}
                  type="number"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter estimated cost in USD"
                  className="w-full"
                />
              )}
            />
            {watchedEstimatedCost && watchedEstimatedCost > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-medium">Approval Requirements:</p>
                <ul className="text-sm text-blue-700 mt-1">
                  {getApprovalRequirements().map((req, index) => (
                    <li key={index}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resources Required
            </label>
            <Controller
              name="resourcesRequired"
              control={control}
              render={({ field: { value, onChange } }) => (
                <textarea
                  value={value?.join('\n') || ''}
                  onChange={(e) => onChange(e.target.value.split('\n').filter(line => line.trim()))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter each resource on a new line (e.g., tools, materials, personnel, etc.)"
                />
              )}
            />
            <p className="text-sm text-gray-600 mt-1">
              List required resources, one per line
            </p>
          </div>
        </div>
      </Card>

      {/* Planning Photos */}
      <Card title="Planning Documentation" className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhotoIcon className="h-4 w-4 inline mr-1" />
              Planning Photos (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              Upload photos that help illustrate the planned corrective action
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
              <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
        >
          Create Corrective Action
        </Button>
      </div>
    </form>
  );
};

export default CorrectiveActionForm;
