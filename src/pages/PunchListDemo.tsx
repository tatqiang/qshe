import { useState } from 'react';
import { PunchListForm } from '../components/features/punch-list/PunchListForm';
import { ImageGallery } from '../components/common/ImageGallery';
import type { PunchListItem, User } from '../types';

interface DemoFormData {
  title: string;
  description?: string;
  mainArea: string;
  subArea1?: string;
  subArea2?: string;
  severity: 'high' | 'medium' | 'low';
  location?: string;
  assigneeId?: string;
  photos: string[]; // Base64 data URLs for demo
}

export function PunchListDemo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [submittedData, setSubmittedData] = useState<DemoFormData | null>(null);

  // Mock project ID and current user - in real app these would come from auth/routing context
  const mockProjectId = 'project-123';
  const mockCurrentUser: User = {
    id: 'user-123',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'internal',
    status: 'active',
    role: 'qshe_manager',
    profilePhotoUrl: undefined, // This would be a real URL in production
    companyId: 'company-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    // Simulate API call
    console.log('Submitting punch list item:', formData);
    
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store the submitted data to show in success view
      setSubmittedData({
        title: formData.title || '',
        description: formData.description,
        mainArea: formData.mainArea || '',
        subArea1: formData.subArea1,
        subArea2: formData.subArea2,
        severity: formData.severity || 'medium',
        location: formData.location,
        assigneeId: formData.assigneeId,
        photos: formData.photos || []
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating punch list item:', error);
      alert('Error creating punch list item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleShowForm = () => {
    setShowForm(true);
    setSubmittedData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            QSHE Punch List Demo
          </h1>
          <p className="text-gray-600">
            Test the new <strong>Quality Control punch list</strong> feature with auto-complete areas and optimized photo compression
          </p>
        </div>

        {showForm ? (
          <PunchListForm
            projectId={mockProjectId}
            currentUser={mockCurrentUser}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Punch List Item Created!
            </h2>
            <p className="text-gray-600 mb-6">
              Your QC punch list item has been successfully recorded.
            </p>

            {/* Show submitted details */}
            {submittedData && (
              <div className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Submitted Details:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {submittedData.title}</div>
                  <div><strong>Area:</strong> {submittedData.mainArea}
                    {submittedData.subArea1 && ` > ${submittedData.subArea1}`}
                    {submittedData.subArea2 && ` > ${submittedData.subArea2}`}
                  </div>
                  {submittedData.description && (
                    <div><strong>Description:</strong> {submittedData.description}</div>
                  )}
                  <div><strong>Severity:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                      submittedData.severity === 'high' ? 'bg-red-100 text-red-800' :
                      submittedData.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {submittedData.severity.toUpperCase()}
                    </span>
                  </div>
                  <div><strong>Photos:</strong> {submittedData.photos.length} evidence photos</div>
                </div>
              </div>
            )}

            {/* Show submitted photos if any */}
            {submittedData?.photos && submittedData.photos.length > 0 && (
              <div className="mb-6">
                <ImageGallery
                  images={submittedData.photos}
                  title="Evidence Photos Submitted"
                  columns={3}
                  className="bg-gray-50 p-4 rounded-lg"
                />
              </div>
            )}

            <button
              onClick={handleShowForm}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Another Item
            </button>
          </div>
        )}

        {/* Demo Instructions */}
        <div className="mt-8 max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">🧪 QC Punch List Demo Features:</h3>
          <div className="space-y-3 text-blue-800">
            <div>
              <strong>Area Auto-Complete:</strong>
              <ul className="ml-4 mt-1 text-sm">
                <li>• Type "311" or "312" to see existing areas</li>
                <li>• Type "Basement" to create a new QC area</li>
                <li>• Areas are automatically created for Quality Control tracking</li>
              </ul>
            </div>
            <div>
              <strong>Evidence Photo Management:</strong>
              <ul className="ml-4 mt-1 text-sm">
                <li>• Photos automatically resized to 1200x1200px (optimal for defect documentation)</li>
                <li>• High-quality compression (85%) for clear evidence</li>
                <li>• <strong>Click any photo to open full-size preview modal</strong></li>
                <li>• Navigate between photos with arrow keys or buttons</li>
                <li>• Zoom in/out with + and - keys or buttons</li>
                <li>• Pan zoomed images by dragging</li>
                <li>• Thumbnail strip for quick navigation</li>
                <li>• Up to 5 photos per punch list item</li>
              </ul>
            </div>
            <div>
              <strong>QC Form Features:</strong>
              <ul className="ml-4 mt-1 text-sm">
                <li>• Title and Area are required</li>
                <li>• Description is optional (as requested)</li>
                <li>• Severity levels for defect prioritization</li>
                <li>• Separate from Safety Patrol (this is for Quality Control)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
