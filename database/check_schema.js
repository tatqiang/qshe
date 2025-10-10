// Check actual database structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking database structure...');

    // Check projects table
    console.log('📋 Checking projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
    } else {
      console.log('✅ Projects table structure:', projects);
    }

    // Check patrols table
    console.log('📋 Checking patrols table...');
    const { data: patrols, error: patrolsError } = await supabase
      .from('patrols')
      .select('*')
      .limit(1);

    if (patrolsError) {
      console.error('❌ Error fetching patrols:', patrolsError);
    } else {
      console.log('✅ Patrols table structure:', patrols);
    }

    // Check if get_active_projects RPC exists
    console.log('📋 Checking get_active_projects RPC...');
    const { data: rpcProjects, error: rpcError } = await supabase.rpc('get_active_projects');

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC get_active_projects works:', rpcProjects);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();
