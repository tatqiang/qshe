/**
 * Force Refresh Users Data
 * 
 * Run this in browser console to reload user data from database
 * This will pick up the new job_title field mapping
 */

// Method 1: Simple page reload (easiest)
console.log('🔄 Reloading page to refresh user data...');
window.location.reload();

// Method 2: Dispatch Redux action (if you want to avoid full reload)
// Uncomment and run this instead:
// import { store } from './src/store';
// import { fetchUsers } from './src/store/usersSlice';
// store.dispatch(fetchUsers());
// console.log('✅ Users data refreshed!');
