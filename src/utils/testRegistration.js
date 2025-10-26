// Test Auto-Registration with Different User Types
// Add this to browser console to simulate different users logging in

// Function to simulate user registration with different roles
window.testUserRegistration = async (userType) => {
  const { userRegistrationService } = await import('/src/lib/api/userRegistrationSimplified.ts');
  
  const testUsers = {
    member: {
      id: 'test-member-001',
      displayName: 'John Engineer',
      givenName: 'John',
      surname: 'Engineer', 
      mail: 'john.engineer@th.jec.com',
      userPrincipalName: 'john.engineer@th.jec.com',
      jobTitle: 'Senior Engineer',  // Should get 'registrant' by default
      department: 'Engineering'
    },
    admin: {
      id: 'test-admin-001', 
      displayName: 'Sarah Manager',
      givenName: 'Sarah',
      surname: 'Manager',
      mail: 'sarah.manager@th.jec.com', 
      userPrincipalName: 'sarah.manager@th.jec.com',
      jobTitle: 'Safety Manager',  // Should get 'admin' role
      department: 'QSHE'
    },
    registrant: {
      id: 'test-registrant-001',
      displayName: 'Mike Staff', 
      givenName: 'Mike',
      surname: 'Staff',
      mail: 'mike.staff@th.jec.com',
      userPrincipalName: 'mike.staff@th.jec.com', 
      jobTitle: 'Staff',  // Should get 'registrant' role
      department: 'General'
    }
  };

  const userData = testUsers[userType];
  if (!userData) {
    console.error('❌ Invalid user type. Use: member, admin, or registrant');
    return;
  }

  console.log(`🧪 Testing auto-registration for ${userType}:`, userData);
  
  try {
    const result = await userRegistrationService.registerOrUpdateUser(userData);
    console.log(`✅ ${userType} user registered:`, result);
    console.log(`🎯 Assigned role: ${result.role}`);
    return result;
  } catch (error) {
    console.error(`❌ Registration failed for ${userType}:`, error);
  }
};

// Usage instructions
console.log('🔧 Test functions loaded:');
console.log('📝 testUserRegistration("member") - Test member role assignment');
console.log('📝 testUserRegistration("admin") - Test admin role assignment'); 
console.log('📝 testUserRegistration("registrant") - Test registrant role assignment');
console.log('📊 showUsers() - View all registered users');
console.log('🗑️ clearUsers() - Clear all users');