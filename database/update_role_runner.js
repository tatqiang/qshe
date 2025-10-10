// Script to update Supabase role field to only allow 4 roles
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4ODc1NiwiZXhwIjoyMDcyOTY0NzU2fQ.kM6TlFEL0lQWI6J3_Ng4YqvPZhAi1sTn0mJVj9eCGaE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRoleField() {
  try {
    console.log('🔧 Updating Supabase role field to only allow 4 roles...');
    
    // Step 1: Update existing users with old roles
    console.log('1️⃣ Updating existing users with old roles...');
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .in('role', ['project_manager', 'site_manager', 'qshe_manager', 'supervisor']);
    
    if (updateError) {
      console.log('⚠️ Update existing users error (might be expected):', updateError.message);
    } else {
      console.log('✅ Updated existing users with old roles to admin');
    }

    // Step 2: Check current role distribution
    console.log('2️⃣ Checking current role distribution...');
    const { data: roleDistribution, error: roleError } = await supabase
      .from('users')
      .select('role')
      .not('role', 'is', null);
    
    if (roleError) {
      console.log('❌ Error fetching roles:', roleError.message);
    } else {
      const roleCounts = roleDistribution.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Current role distribution:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count} users`);
      });
    }

    console.log('3️⃣ Database constraint update needed...');
    console.log('🔍 To complete the update, run this SQL manually in Supabase Dashboard:');
    console.log(`
-- Add CHECK constraint to enforce only 4 roles
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('system_admin', 'admin', 'member', 'worker'));

-- Update column comment
COMMENT ON COLUMN public.users.role IS 'User role: system_admin, admin, member, or worker';
    `);

    console.log('✅ Role field update preparation completed!');
    console.log('📝 Manual step required: Run the SQL constraint in Supabase Dashboard SQL Editor');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateRoleField();
