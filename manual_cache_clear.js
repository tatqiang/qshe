// Manual Browser Cache Clear for Azure AD
// Run this in the browser console to force clear all Azure/MSAL data

console.log('🧹 Starting manual cache clear...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('msal') || key.includes('azure') || key.includes('tenant') || key.includes('618098ec')) {
    localStorage.removeItem(key);
    console.log('Removed localStorage:', key);
  }
});

// Clear sessionStorage  
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('msal') || key.includes('azure') || key.includes('tenant')) {
    sessionStorage.removeItem(key);
    console.log('Removed sessionStorage:', key);
  }
});

console.log('✅ Manual cache clear complete! Refresh the page now.');