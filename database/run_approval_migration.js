// Migration script to add approval workflow columns to corrective_actions table
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runApprovalColumnsMigration() {
  try {
    console.log('🔄 Starting approval columns migration...');

    // Read the SQL migration file
    const sqlPath = join(process.cwd(), 'add_approval_columns.sql');
    const migrationSQL = readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing approval columns migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute each statement separately
      console.log('🔄 Trying alternative approach with individual statements...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
          try {
            const { error: stmtError } = await supabase.rpc('execute_sql', {
              sql_query: statement + ';'
            });
            
            if (stmtError) {
              console.warn(`⚠️ Statement warning: ${statement.substring(0, 50)}...`, stmtError.message);
            } else {
              console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
            }
          } catch (err) {
            console.warn(`⚠️ Statement error: ${statement.substring(0, 50)}...`, err.message);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully:', data);
    }

    // Verify the columns were added
    console.log('🔍 Verifying columns were added...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'corrective_actions')
      .eq('table_schema', 'public')
      .in('column_name', ['approved_by', 'approved_at', 'rejected_by', 'rejected_at']);

    if (infoError) {
      console.error('❌ Error checking columns:', infoError);
    } else {
      console.log('✅ Found columns:', tableInfo?.map(col => col.column_name) || []);
    }

    console.log('🎉 Approval columns migration completed!');

  } catch (error) {
    console.error('💥 Migration failed with error:', error);
  }
}

// Run the migration
runApprovalColumnsMigration();