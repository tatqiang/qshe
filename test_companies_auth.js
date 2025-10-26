// Test script to verify companies table access with authentication
// Run this in browser console to debug RLS issues

async function testCompaniesAccess() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING COMPANIES TABLE ACCESS');
  console.log('='.repeat(60));
  
  // Import the shared Supabase client
  const { supabase } = await import('./src/lib/api/supabase.ts');
  
  // Step 1: Check authentication status
  console.log('\n1️⃣ Checking authentication session...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError);
    return;
  }
  
  if (!sessionData.session) {
    console.error('❌ NO AUTHENTICATED SESSION FOUND!');
    console.error('   Please log in to the application first.');
    return;
  }
  
  console.log('✅ Authenticated session found:');
  console.log('   User ID:', sessionData.session.user.id);
  console.log('   Email:', sessionData.session.user.email);
  console.log('   Role:', sessionData.session.user.role);
  
  // Step 2: Try to fetch companies
  console.log('\n2️⃣ Attempting to fetch companies...');
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('❌ Query failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    console.error('\n📌 This likely means RLS policies are blocking access.');
    console.error('   Check that:');
    console.error('   1. RLS policies exist for "authenticated" role');
    console.error('   2. User has "authenticated" role (not anon)');
    console.error('   3. Policies have correct permissions');
    return;
  }
  
  console.log('✅ Query successful!');
  console.log('   Companies found:', data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\n📋 Company list:');
    data.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.name_th || 'no Thai name'})`);
      console.log(`      ID: ${company.id}`);
      console.log(`      Status: ${company.status}`);
    });
  } else {
    console.warn('\n⚠️ No companies found in database!');
    console.warn('   Possible reasons:');
    console.warn('   1. Table is empty (add data in Supabase dashboard)');
    console.warn('   2. RLS policies are too restrictive');
    console.warn('   3. User doesn\'t have access to any rows');
  }
  
  // Step 3: Try to count total rows (bypasses RLS if service_role)
  console.log('\n3️⃣ Checking total rows in table...');
  const { count, error: countError } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Count query failed:', countError.message);
  } else {
    console.log(`   Total accessible rows: ${count}`);
    if (count === 0) {
      console.warn('   ⚠️ User can access 0 rows - RLS is blocking everything!');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run the test
testCompaniesAccess().catch(err => {
  console.error('❌ Test failed with exception:', err);
});
