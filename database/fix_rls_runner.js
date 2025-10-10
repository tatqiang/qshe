// Simple script to run RLS policy fixes
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4ODc1NiwiZXhwIjoyMDcyOTY0NzU2fQ.kM6TlFEL0lQWI6J3_Ng4YqvPZhAi1sTn0mJVj9eCGaE'; // Use service role for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for user authentication...');

    // Read the SQL file
    const sqlContent = readFileSync('./database/fix_authentication_rls.sql', 'utf8');
    
    // Split by statement (simple approach)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT') && !s.startsWith('SELECT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`\n▶️  Executing statement ${i + 1}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    // Now check the policies
    console.log('\n🔍 Checking current RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, roles, cmd')
      .eq('tablename', 'users');

    if (policiesError) {
      console.log('❌ Could not fetch policies:', policiesError.message);
    } else {
      console.log('📋 Current policies on users table:');
      policies.forEach(p => {
        console.log(`  - ${p.policyname} (${p.cmd}) for ${p.roles}`);
      });
    }

    console.log('\n✅ RLS policy fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRLSPolicies();
