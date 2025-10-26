// Debug utility to view auto-registered users
// Run this in browser console to see registered users

export const debugRegisteredUsers = () => {
  try {
    const users = JSON.parse(localStorage.getItem('azure_registered_users') || '[]');
    console.log('🔍 Auto-Registered Users:', users);
    console.log('📊 Total Users:', users.length);
    
    if (users.length > 0) {
      console.table(users.map(user => ({
        email: user.email,
        name: user.display_name,
        role: user.role,
        department: user.department,
        created: user.created_at
      })));
    }
    
    return users;
  } catch (error) {
    console.error('❌ Error reading registered users:', error);
    return [];
  }
};

export const clearRegisteredUsers = () => {
  localStorage.removeItem('azure_registered_users');
  console.log('🗑️ Cleared all registered users');
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).debugRegisteredUsers = debugRegisteredUsers;
  (window as any).clearRegisteredUsers = clearRegisteredUsers;
  console.log('🔧 Debug functions loaded: debugRegisteredUsers(), clearRegisteredUsers()');
}