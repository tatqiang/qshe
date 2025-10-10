// Simplified schema setup - insert sample data directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBasicData() {
  try {
    console.log('🚀 Setting up basic schema data...');

    // 1. First, let's see what tables already exist
    console.log('\n📋 Checking existing tables...');
    
    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message);
    } else {
      console.log(`✅ Projects table exists: ${projects?.length || 0} records`);
    }

    // Check patrols
    const { data: patrols, error: patrolsError } = await supabase
      .from('patrols')
      .select('*')
      .limit(5);
    
    if (patrolsError) {
      console.log('❌ Patrols table error:', patrolsError.message);
    } else {
      console.log(`✅ Patrols table exists: ${patrols?.length || 0} records`);
    }

    // 2. Try to insert sample projects (these should work if projects table exists)
    console.log('\n📝 Inserting sample projects...');
    const sampleProjects = [
      {
        project_code: 'AIC',
        name: 'Downtown Office Complex',
        description: 'Construction of 25-story office building with underground parking',
        status: 'active'
      },
      {
        project_code: 'RM1',
        name: 'Highway Bridge Construction', 
        description: 'Construction of 2.5km bridge spanning the Chao Phraya River',
        status: 'active'
      },
      {
        project_code: 'MEGA',
        name: 'Mega Shopping Mall Project',
        description: 'Development of large-scale retail complex with entertainment facilities',
        status: 'active'
      }
    ];

    for (const project of sampleProjects) {
      const { error } = await supabase
        .from('projects')
        .upsert(project, { 
          onConflict: 'project_code',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.log(`❌ Error inserting project ${project.project_code}:`, error.message);
      } else {
        console.log(`✅ Project ${project.project_code} inserted/updated`);
      }
    }

    // 3. Check if areas table exists and create some test data
    console.log('\n🏗️ Checking areas table...');
    try {
      const { data: areas, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .limit(1);
      
      if (areasError) {
        console.log('❌ Areas table does not exist or is not accessible:', areasError.message);
      } else {
        console.log(`✅ Areas table exists: ${areas?.length || 0} records`);
      }
    } catch (err) {
      console.log('❌ Areas table not accessible');
    }

    // 4. Check if risk_categories table exists
    console.log('\n🎯 Checking risk_categories table...');
    try {
      const { data: riskCategories, error: riskError } = await supabase
        .from('risk_categories')
        .select('*')
        .limit(1);
      
      if (riskError) {
        console.log('❌ Risk categories table does not exist:', riskError.message);
      } else {
        console.log(`✅ Risk categories table exists: ${riskCategories?.length || 0} records`);
      }
    } catch (err) {
      console.log('❌ Risk categories table not accessible');
    }

    // 5. Final verification - check projects with project_code
    console.log('\n🔍 Final verification - querying projects by project_code...');
    const { data: aicProject, error: aicError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_code', 'AIC')
      .single();
    
    if (aicError) {
      console.log('❌ Cannot query AIC project by project_code:', aicError.message);
      console.log('💡 This means project_code column might not exist yet');
    } else {
      console.log('✅ AIC project found by project_code:', aicProject);
    }

    console.log('\n🎉 Basic setup completed!');
    console.log('\n💡 Summary:');
    console.log('   - If project_code queries work: Database is ready for patrol creation');
    console.log('   - If project_code queries fail: Need to run schema migration manually in Supabase');
    console.log('   - Missing tables (areas, risk_categories) need to be created manually');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupBasicData();
