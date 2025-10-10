// Test script to debug localStorage persistence issues
// Run this in browser console after filling out step 1

console.log('=== Wizard State Debug Test ===');

// 1. Check what's in localStorage
const storageKey = 'profile_completion_state_test@example.com'; // Replace with actual user email
const stored = localStorage.getItem(storageKey);
console.log('1. Raw localStorage data:', stored);

if (stored) {
  try {
    const parsed = JSON.parse(stored);
    console.log('2. Parsed localStorage data:', parsed);
    console.log('3. Password data in storage:', parsed.data?.passwordData);
    console.log('4. Current step in storage:', parsed.data?.currentStep);
  } catch (e) {
    console.error('Failed to parse stored data:', e);
  }
}

// 2. Check current React state (if available)
// This would need to be run in the context where the state is available
console.log('=== Instructions ===');
console.log('1. Fill out the password form in step 1');
console.log('2. Click Next to save data');
console.log('3. Refresh the page');
console.log('4. Check if form data is restored');
console.log('5. Run this script again to see storage contents');