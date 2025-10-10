// Debug utility for wizard state persistence
export const debugWizardState = () => {
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('profileCompletion_') || key.startsWith('profileEdit_')
  );
  
  console.log('🔍 Wizard State Debug:', {
    storedKeys: keys,
    states: keys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return {
          key,
          currentStep: data.currentStep,
          hasPasswordData: !!data.passwordData,
          hasPhotoData: !!data.photoData,
          hasFaceData: !!data.faceData,
          lastSaved: data.lastSaved ? new Date(data.lastSaved).toISOString() : 'unknown',
          age: data.lastSaved ? Math.round((Date.now() - data.lastSaved) / 1000) + 's' : 'unknown'
        };
      } catch {
        return { key, error: 'Invalid JSON' };
      }
    })
  });
};

// Add to window for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).debugWizardState = debugWizardState;
}