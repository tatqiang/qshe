// Database migration script to add remark column to safety_patrols table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addRemarkColumn() {
  try {
    console.log('🔄 Starting remark column check...');

    // Try to select from safety_patrols with remark column to see if it exists
    console.log('📝 Testing if remark column exists by querying it...');
    const { data: testData, error: testError } = await supabase
      .from('safety_patrols')
      .select('id, remark')
      .limit(1);

    if (testError) {
      console.error('❌ Remark column does not exist:', testError.message);
      console.log('⚠️  You need to manually add the remark column to the database.');
      console.log('� Please run this SQL in your Supabase SQL editor:');
      console.log('');
      console.log('ALTER TABLE safety_patrols ADD COLUMN remark TEXT;');
      console.log('');
      return;
    }

    console.log('✅ Remark column exists! Found data:', testData);
    console.log('🎉 No migration needed!');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
  }
}

// Run the check
addRemarkColumn();