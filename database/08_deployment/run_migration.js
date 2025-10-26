// Database migration script to add project_code and sample projects
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');

    // Step 1: Check if projects table exists and has data
    console.log('📝 Step 1: Checking existing projects...');
    const { data: existingProjects, error: selectError } = await supabase
      .from('projects')
      .select('*');

    if (selectError) {
      console.error('❌ Error fetching projects:', selectError);
      return;
    }

    console.log('� Existing projects:', existingProjects?.length || 0);

    // Step 2: Insert sample projects
    console.log('📝 Step 2: Inserting sample projects...');
    const { error: insertError } = await supabase
      .from('projects')
      .upsert([
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
        },
        {
          project_code: 'GG-U001',
          name: 'Underground Utility Tunnel',
          description: 'Construction of underground utility corridor for city infrastructure',
          status: 'active'
        }
      ], { 
        onConflict: 'project_code',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('❌ Error inserting sample projects:', insertError);
      // Try without upsert, just insert
      console.log('📝 Trying simple insert...');
      for (const project of [
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
        }
      ]) {
        const { error: singleInsertError } = await supabase
          .from('projects')
          .insert(project);
        
        if (singleInsertError) {
          console.error(`❌ Error inserting project ${project.project_code}:`, singleInsertError);
        } else {
          console.log(`✅ Inserted project ${project.project_code}`);
        }
      }
    } else {
      console.log('✅ Sample projects inserted successfully!');
    }

    // Step 3: Verify projects were inserted
    console.log('📝 Step 3: Verifying projects...');
    const { data: projects, error: finalSelectError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (finalSelectError) {
      console.error('❌ Error fetching final projects:', finalSelectError);
      return;
    }

    console.log('✅ Migration completed!');
    console.log('📋 Active projects:', projects);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
