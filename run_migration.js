const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the migration script
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'database', 'update_patrol_status_lifecycle.sql'), 
  'utf8'
);

async function runMigration() {
  const supabase = createClient(
    'https://tqqzjivzhlfaolmwhvie.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcXpqaXZ6aGxmYW9sbXdodmllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI5NDY3MSwiZXhwIjoyMDQzODcwNjcxfQ.bPUYiZIztsoSk9hqSQlEGT1Pt26nJHfJdaFIW2rOLVw'
  );

  try {
    console.log('🚀 Running patrol status lifecycle migration...');
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 New patrol status lifecycle:');
    console.log('  - open: When patrol is first created');
    console.log('  - pending_action: When corrective actions need response');
    console.log('  - pending_verification: When actions need verification');
    console.log('  - completed: When all actions are verified');
    console.log('  - closed: Administrative closure');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

runMigration();