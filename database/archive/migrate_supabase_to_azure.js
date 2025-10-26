// Data Migration Script: Supabase → Azure SQL Database
// Export 823 users from Supabase and import to Azure
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Supabase configuration
const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Company mapping for Jardine Engineering
const JARDINE_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440100';
const JARDINE_DOMAIN = 'th.jec.com';

async function exportAllUsers() {
  console.log('🔄 Starting migration of 823 users from Supabase to Azure...');
  
  try {
    // Fetch all users from Supabase
    console.log('📊 Fetching all users from Supabase...');
    const { data: supabaseUsers, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users from Supabase:', error);
      return;
    }

    console.log(`✅ Found ${supabaseUsers.length} users in Supabase`);

    // Transform users to Azure SQL schema
    const azureUsers = supabaseUsers.map((user, index) => {
      // Determine if user is internal (company staff) or external
      const isInternal = user.email?.includes('@th.jec.com') || user.email?.includes('@jec.com');
      
      // Map Supabase role to Azure authority_level
      const authorityLevelMap = {
        'system_admin': 'system_admin',
        'admin': 'admin', 
        'manager': 'manager',
        'member': 'user',
        'registrant': 'user',
        'worker': 'user'
      };

      // Map Supabase user_type to Azure user_type
      const userTypeMap = {
        'internal': 'admin',
        'external': 'registrant',
        'admin': 'admin',
        'safety_officer': 'safety_officer',
        'project_manager': 'project_manager',
        'system_admin': 'system_admin'
      };

      // Generate new UUID for Azure (or keep existing if valid)
      const azureId = user.id || `550e8400-e29b-41d4-a716-${String(446655440000 + index).padStart(12, '0')}`;

      return {
        id: azureId,
        email: user.email,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        thai_first_name: user.first_name_thai || null,
        thai_last_name: user.last_name_thai || null,
        position_title: user.position || 'Staff',
        phone_number: user.phone_number || null,
        employee_id: user.employee_id || `EMP${String(index + 1).padStart(4, '0')}`,
        department: user.department || 'General',
        authority_level: authorityLevelMap[user.role] || 'user',
        user_type: userTypeMap[user.user_type] || 'registrant',
        verification_date: user.status === 'active' ? user.updated_at : null,
        profile_photo_url: user.profile_photo_url || null,
        is_active: user.status === 'active' ? 1 : 0,
        created_at: user.created_at,
        updated_at: user.updated_at,
        
        // Multi-company fields
        primary_company_id: isInternal ? JARDINE_COMPANY_ID : null,
        worker_type: isInternal ? 'internal' : 'contractor',
        verification_status: user.status === 'active' ? 'verified' : 
                           user.status === 'pending_completion' ? 'pending' : 'unverified',
        external_worker_id: !isInternal ? `EXT${String(index + 1).padStart(4, '0')}` : null,
        nationality: user.nationality || 'Thai',
        passport_number: null,
        work_permit_number: null
      };
    });

    // Save to JSON file for review
    fs.writeFileSync('database/supabase_users_export.json', JSON.stringify(azureUsers, null, 2));
    console.log(`💾 Exported ${azureUsers.length} users to database/supabase_users_export.json`);

    // Generate SQL INSERT statements
    console.log('🔄 Generating Azure SQL INSERT statements...');
    
    let sqlInserts = `-- Migration: ${azureUsers.length} users from Supabase to Azure SQL
-- Generated on ${new Date().toISOString()}
-- Total users: ${azureUsers.length}

-- Clear existing users (CAREFUL!)
-- DELETE FROM dbo.users WHERE email NOT IN ('nithat.su@th.jec.com');

-- Insert migrated users
`;

    for (const user of azureUsers) {
      const values = [
        `'${user.id}'`,
        `'${user.email.replace(/'/g, "''")}'`,
        `'${user.full_name.replace(/'/g, "''")}'`,
        user.thai_first_name ? `'${user.thai_first_name.replace(/'/g, "''")}'` : 'NULL',
        user.thai_last_name ? `'${user.thai_last_name.replace(/'/g, "''")}'` : 'NULL',
        user.position_title ? `'${user.position_title.replace(/'/g, "''")}'` : 'NULL',
        user.phone_number ? `'${user.phone_number.replace(/'/g, "''")}'` : 'NULL',
        user.employee_id ? `'${user.employee_id.replace(/'/g, "''")}'` : 'NULL',
        user.department ? `'${user.department.replace(/'/g, "''")}'` : 'NULL',
        `'${user.authority_level}'`,
        `'${user.user_type}'`,
        user.verification_date ? `'${user.verification_date}'` : 'NULL',
        user.profile_photo_url ? `'${user.profile_photo_url.replace(/'/g, "''")}'` : 'NULL',
        user.is_active,
        `'${user.created_at}'`,
        `'${user.updated_at}'`,
        user.primary_company_id ? `'${user.primary_company_id}'` : 'NULL',
        `'${user.worker_type}'`,
        `'${user.verification_status}'`,
        user.external_worker_id ? `'${user.external_worker_id}'` : 'NULL',
        user.nationality ? `'${user.nationality.replace(/'/g, "''")}'` : 'NULL',
        'NULL', // passport_number
        'NULL'  // work_permit_number
      ];

      sqlInserts += `INSERT INTO dbo.users (
  id, email, full_name, thai_first_name, thai_last_name, position_title, 
  phone_number, employee_id, department, authority_level, user_type, 
  verification_date, profile_photo_url, is_active, created_at, updated_at,
  primary_company_id, worker_type, verification_status, external_worker_id,
  nationality, passport_number, work_permit_number
) VALUES (${values.join(', ')});
`;
    }

    // Save SQL file
    fs.writeFileSync('database/azure_migration_insert.sql', sqlInserts);
    console.log(`💾 Generated SQL migration file: database/azure_migration_insert.sql`);

    // Generate statistics
    const stats = {
      total: azureUsers.length,
      internal: azureUsers.filter(u => u.worker_type === 'internal').length,
      external: azureUsers.filter(u => u.worker_type === 'contractor').length,
      active: azureUsers.filter(u => u.is_active === 1).length,
      verified: azureUsers.filter(u => u.verification_status === 'verified').length,
      system_admins: azureUsers.filter(u => u.authority_level === 'system_admin').length,
      admins: azureUsers.filter(u => u.authority_level === 'admin').length,
      managers: azureUsers.filter(u => u.authority_level === 'manager').length,
      users: azureUsers.filter(u => u.authority_level === 'user').length
    };

    console.log('\n📊 Migration Statistics:');
    console.log(`Total Users: ${stats.total}`);
    console.log(`Internal (@th.jec.com): ${stats.internal}`);
    console.log(`External/Contractors: ${stats.external}`);
    console.log(`Active Users: ${stats.active}`);
    console.log(`Verified Users: ${stats.verified}`);
    console.log(`System Admins: ${stats.system_admins}`);
    console.log(`Admins: ${stats.admins}`);
    console.log(`Managers: ${stats.managers}`);
    console.log(`Regular Users: ${stats.users}`);

    // Save statistics
    fs.writeFileSync('database/migration_statistics.json', JSON.stringify(stats, null, 2));

    console.log('\n✅ Migration export completed!');
    console.log('\nNext steps:');
    console.log('1. Review: database/supabase_users_export.json');
    console.log('2. Execute: database/azure_migration_insert.sql in Azure Portal');
    console.log('3. Test with all 823 users in your PWA');

    return azureUsers;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  exportAllUsers()
    .then(() => {
      console.log('🎉 Migration export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { exportAllUsers };