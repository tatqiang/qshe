import React, { useState } from 'react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { HierarchicalAreaInput } from '../../common/HierarchicalAreaInput';
import { MultiPhotoUpload } from '../../common/MultiPhotoUpload';
import { UserAvatar } from '../../common/UserAvatar';
import type { ProjectArea, PunchListItem, User } from '../../../types';

interface PunchListFormProps {
  projectId: string;
  currentUser: User; // Must be logged in user who is issuing the defect
  onSubmit: (data: any) => Promise<void>; // Using any for demo flexibility
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormData {
  title: string;
  description: string;
  mainArea: string;
  subArea1: string;
  subArea2: string;
  severity: 'high' | 'medium' | 'low';
  location: string;
  assigneeId: string;
  photos: string[];
}

export function PunchListForm({
  projectId,
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting = false
}: PunchListFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    mainArea: '',
    subArea1: '',
    subArea2: '',
    severity: 'medium',
    location: '',
    assigneeId: '',
    photos: []
  });

  const [selectedArea, setSelectedArea] = useState<ProjectArea | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.mainArea.trim()) {
      newErrors.mainArea = 'Main area is required';
    }

    // Description is optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // For demo, pass the form data directly
      const formDataToSubmit = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        mainArea: formData.mainArea.trim(),
        subArea1: formData.subArea1.trim() || undefined,
        subArea2: formData.subArea2.trim() || undefined,
        location: formData.location.trim() || undefined,
        severity: formData.severity,
        areaId: selectedArea?.id,
        assigneeId: formData.assigneeId || undefined,
        issuedBy: currentUser.id,
        photos: formData.photos,
        status: 'open' as const,
      };

      await onSubmit(formDataToSubmit);
    } catch (error) {
      console.error('Error submitting punch list form:', error);
    }
  };

  const handleAreaChange = (mainArea: string, area?: ProjectArea) => {
    setFormData(prev => ({ 
      ...prev, 
      mainArea,
      // Clear sub areas when main area changes
      subArea1: '',
      subArea2: ''
    }));
    setSelectedArea(area || null);
    if (errors.mainArea) {
      setErrors(prev => ({ ...prev, mainArea: undefined }));
    }
  };

  const handleSubArea1Change = (subArea1: string) => {
    setFormData(prev => ({ 
      ...prev, 
      subArea1,
      // Clear sub area 2 when sub area 1 changes
      subArea2: ''
    }));
  };

  const handleSubArea2Change = (subArea2: string) => {
    setFormData(prev => ({ ...prev, subArea2 }));
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoUpload = (photoUrls: string[]) => {
    setFormData(prev => ({ ...prev, photos: photoUrls }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">New Punch List Item</h2>
        <p className="text-gray-600">Record a construction defect with photos and details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title *
          </label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange('title')}
            placeholder="Brief description of the issue"
            error={errors.title}
            required
          />
        </div>

        {/* Issued By User Display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issued By
          </label>
          <UserAvatar user={currentUser} size="md" showName={true} />
          <p className="text-xs text-gray-500 mt-2">
            This defect will be reported under your account
          </p>
        </div>

        {/* Hierarchical Area Input */}
        <HierarchicalAreaInput
          projectId={projectId}
          mainArea={formData.mainArea}
          subArea1={formData.subArea1}
          subArea2={formData.subArea2}
          onMainAreaChange={handleAreaChange}
          onSubArea1Change={handleSubArea1Change}
          onSubArea2Change={handleSubArea2Change}
          onAreaSelected={(area) => setSelectedArea(area as ProjectArea)}
        />
        {errors.mainArea && (
          <p className="mt-1 text-sm text-red-600">{errors.mainArea}</p>
        )}
        {selectedArea && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Area "{selectedArea.areaName}" (Code: {selectedArea.areaCode})
          </p>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="Detailed description of the defect or issue (optional)"
            rows={4}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.description ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Location (optional) */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Specific Location
          </label>
          <Input
            id="location"
            type="text"
            value={formData.location}
            onChange={handleInputChange('location')}
            placeholder="e.g., North wall, near column A1"
          />
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select
            id="severity"
            value={formData.severity}
            onChange={handleInputChange('severity')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low - Minor cosmetic issues</option>
            <option value="medium">Medium - Standard defects</option>
            <option value="high">High - Safety or structural concerns</option>
          </select>
        </div>

        {/* Issue Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Photos
          </label>
          <MultiPhotoUpload
            onPhotosUploaded={handlePhotoUpload}
            maxPhotos={5}
            showPreview
            className="border-2 border-dashed border-gray-300 rounded-lg p-4"
          />
          <p className="mt-1 text-xs text-gray-500">
            Take photos showing the defect clearly. You can add up to 5 photos.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Punch List Item'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">📝 Tips for better punch list items:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use clear, specific titles (e.g., "Damaged drywall corner" vs "Wall issue")</li>
          <li>• Include specific location details when possible</li>
          <li>• Take photos from multiple angles showing the full context</li>
          <li>• Areas will be automatically created if they don't exist</li>
        </ul>
      </div>
    </div>
  );
}
