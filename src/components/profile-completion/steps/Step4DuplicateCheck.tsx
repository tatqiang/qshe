import React from 'react';
import type { StepProps } from '../types/profile-completion.types';

export const Step4DuplicateCheck: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Duplicate Check</h2>
      <p className="text-gray-600 mb-6">This step will handle duplicate face detection and confirmation.</p>
      
      <div className="flex space-x-4 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ 
            matches: [], 
            confirmed: true, 
            selectedAction: 'proceed' 
          })}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Complete Profile
        </button>
      </div>
    </div>
  );
};
