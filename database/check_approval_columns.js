// Simple migration to add approval columns using direct Supabase SQL execution
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4ODc1NiwiZXhwIjoyMDcyOTY0NzU2fQ.vU-s7SLN6UVbgm0kbJGRdz9-A3hkGbwbL8HhKTvdj_w'; // Service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addApprovalColumns() {
  console.log('🔄 Adding approval columns to corrective_actions table...');

  try {
    // Test if we can access the table first
    const { data: testData, error: testError } = await supabase
      .from('corrective_actions')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Cannot access corrective_actions table:', testError);
      return;
    }

    console.log('✅ Can access corrective_actions table');

    // Try to update a record to see current structure
    console.log('🔍 Checking current table structure...');
    
    // Get one record to see its structure
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('corrective_actions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error getting sample record:', sampleError);
    } else {
      console.log('📋 Current columns:', Object.keys(sampleRecord[0] || {}));
    }

    // The issue is we need to add columns via SQL DDL, but we can't execute raw SQL
    // Let's check if the columns already exist by trying to select them
    console.log('🔍 Testing if approval columns exist...');
    
    const { data: approvalTest, error: approvalError } = await supabase
      .from('corrective_actions')
      .select('id, approved_by, approved_at, rejected_by, rejected_at')
      .limit(1);

    if (approvalError) {
      console.log('❌ Approval columns missing:', approvalError.message);
      console.log('');
      console.log('🔧 MANUAL ACTION REQUIRED:');
      console.log('The approval columns need to be added manually via Supabase Dashboard.');
      console.log('');
      console.log('Please go to Supabase Dashboard > Table Editor > corrective_actions');
      console.log('And add these columns:');
      console.log('1. approved_by (uuid, nullable, foreign key to users.id)');
      console.log('2. approved_at (timestamptz, nullable)');
      console.log('3. rejected_by (uuid, nullable, foreign key to users.id)');
      console.log('4. rejected_at (timestamptz, nullable)');
      console.log('5. rejection_reason (text, nullable)');
      console.log('6. verification_notes (text, nullable)');
      console.log('');
      console.log('After adding these columns, the approval functionality will work.');
    } else {
      console.log('✅ Approval columns already exist!');
      console.log('📋 Approval columns found:', Object.keys(approvalTest[0] || {}));
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

addApprovalColumns();