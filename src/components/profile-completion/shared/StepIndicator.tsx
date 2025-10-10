import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  userRole?: string; // Use role instead of userType to determine flow
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, userRole }) => {
  // Different step configurations for different user roles
  const getSteps = () => {
    if (userRole === 'registrant') {
      // Registrants skip password step - only 3 steps
      return [
        { number: 2, title: 'Photo', displayNumber: 1 },
        { number: 3, title: 'Face Recognition', displayNumber: 2 },
        { number: 4, title: 'Verification', displayNumber: 3 },
      ];
    } else {
      // Normal flow - 4 steps
      return [
        { number: 1, title: 'Password', displayNumber: 1 },
        { number: 2, title: 'Photo', displayNumber: 2 },
        { number: 3, title: 'Face Recognition', displayNumber: 3 },
        { number: 4, title: 'Verification', displayNumber: 4 },
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  ${currentStep === step.number 
                    ? 'bg-blue-600 text-white' 
                    : currentStep > step.number 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                  }
                `}
              >
                {currentStep > step.number ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.displayNumber
                )}
              </div>
              <span 
                className={`
                  mt-2 text-xs font-medium hidden sm:block
                  ${currentStep === step.number ? 'text-blue-600' : 'text-gray-500'}
                `}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-16 h-0.5 mx-2
                  ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
