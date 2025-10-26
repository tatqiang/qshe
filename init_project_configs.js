// ============================================
// Initialize Project Form Configuration
// ============================================
// This script creates initial project_form_configs and project_field_configs
// for all existing projects

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeProjectConfigs() {
  try {
    console.log('============================================');
    console.log('Initialize Project Form Configuration');
    console.log('============================================\n');

    // Step 1: Load the SQL script
    console.log('📝 Reading SQL script...');
    const sql = readFileSync('./database/init_project_form_configs.sql', 'utf8');
    
    // Step 2: Execute the SQL
    console.log('🚀 Executing initialization...\n');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct query execution instead
      console.log('⚠️  RPC not available, trying direct query...\n');
      
      // Split into statements and execute
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.error('Error executing statement:', stmtError);
          }
        }
      }
    }

    // Step 3: Verify results
    console.log('📊 Checking results...\n');
    
    const { data: configs, error: configError } = await supabase
      .from('project_form_configs')
      .select('id, project_id, form_template_id, projects(name), form_templates(name_th)');
    
    if (configError) {
      console.error('❌ Error fetching configs:', configError);
    } else {
      console.log(`✅ Project Form Configs: ${configs.length} records`);
      configs.forEach(c => {
        console.log(`   - ${c.projects?.name}: ${c.form_templates?.name_th}`);
      });
    }

    const { count: fieldCount } = await supabase
      .from('project_field_configs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Project Field Configs: ${fieldCount} records\n`);

    console.log('============================================');
    console.log('✅ Initialization complete!');
    console.log('============================================\n');
    
    console.log('Now you can:');
    console.log('1. Go to /admin/project-form-config');
    console.log('2. Select "Under Test" project');
    console.log('3. Configure which fields to show');
    console.log('4. Drag to reorder fields\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeProjectConfigs();
