// Simple database table test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickTest() {
  console.log('🔍 Quick database test...');
  
  // Test 1: Check if we can access projects
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(3);
    
    console.log('✅ Projects:', projects?.length || 0, 'records');
    if (projects && projects.length > 0) {
      console.log('📋 Sample project:', projects[0]);
    }
  } catch (err) {
    console.log('❌ Projects error:', err);
  }

  // Test 2: Check if we can access patrols
  try {
    const { data: patrols, error } = await supabase
      .from('patrols')
      .select('*')
      .limit(3);
    
    console.log('✅ Patrols:', patrols?.length || 0, 'records');
    if (patrols && patrols.length > 0) {
      console.log('📋 Sample patrol:', patrols[0]);
    }
  } catch (err) {
    console.log('❌ Patrols error:', err);
  }

  // Test 3: Try to create a simple patrol
  try {
    const { data, error } = await supabase
      .from('patrols')
      .insert({
        title: 'Test Patrol',
        date: new Date().toISOString().split('T')[0],
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Insert error:', error.message);
    } else {
      console.log('✅ Test patrol created:', data);
    }
  } catch (err) {
    console.log('❌ Insert exception:', err);
  }
}

quickTest();
