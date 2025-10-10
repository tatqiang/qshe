// Test script for profile completion refresh persistence
// Run this in browser console to test the localStorage functionality

console.log('=== Profile Completion Refresh Test ===');

// 1. Check current URL and token
const currentUrl = window.location.href;
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');

console.log('1. Current page state:', {
  url: currentUrl,
  hasUrlToken: !!urlToken,
  isCompleteProfilePage: window.location.pathname.includes('complete-profile')
});

// 2. Check localStorage for profile completion sessions
const storageKeys = Object.keys(localStorage).filter(key => 
  key.startsWith('profileCompletion_') && !key.endsWith('_default')
);

console.log('2. Storage sessions found:', storageKeys.length);

storageKeys.forEach((key, index) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    console.log(`   Session ${index + 1}:`, {
      key: key.replace('profileCompletion_', ''),
      currentStep: data.currentStep,
      hasPasswordData: !!data.passwordData,
      hasPhotoData: !!data.photoData,
      hasFaceData: !!data.faceData,
      lastSaved: data.lastSaved ? new Date(data.lastSaved).toLocaleString() : 'Never',
      tokenMatch: data.token === urlToken
    });
  } catch (e) {
    console.log(`   Session ${index + 1}: Invalid data`);
  }
});

// 3. Test AuthWrapper bypass logic
const isPublicRoute = ['/invite/', '/register/', '/complete-profile', '/reset-password']
  .some(route => window.location.pathname.startsWith(route));

console.log('3. AuthWrapper bypass check:', {
  isPublicRoute,
  shouldBypassAuth: isPublicRoute || (
    window.location.pathname.startsWith('/complete-profile') && 
    urlToken && 
    localStorage.getItem(`profileCompletion_${urlToken}`)
  )
});

// 4. Instructions for testing
console.log('=== Test Instructions ===');
console.log('1. Fill out profile completion step 1');
console.log('2. Move to step 2');
console.log('3. Refresh the page (F5)');
console.log('4. Check if you stay on profile completion page');
console.log('5. Run this script again to see state');

// 5. Quick recovery function
window.recoverProfileSession = () => {
  if (storageKeys.length > 0) {
    const latestSession = storageKeys[0];
    const data = JSON.parse(localStorage.getItem(latestSession) || '{}');
    if (data.token) {
      const recoveryUrl = `/complete-profile?token=${encodeURIComponent(data.token)}`;
      console.log('🔄 Recovering session:', recoveryUrl);
      window.location.href = recoveryUrl;
    }
  } else {
    console.log('❌ No sessions to recover');
  }
};

console.log('💡 Run recoverProfileSession() to recover latest session');