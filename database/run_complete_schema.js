// Complete database schema migration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODg3NTYsImV4cCI6MjA3Mjk2NDc1Nn0.71IzjwK1phEHmquzWg5vty-51w9GvysiUrM404qL1Yg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runCompleteSchema() {
  try {
    console.log('🚀 Starting complete database schema migration...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'database', 'complete_patrol_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements (basic split on semicolons)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '$$');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement || statement.length < 10) continue; // Skip very short statements
      
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`⚠️ Statement ${i + 1} failed:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️ Statement ${i + 1} error:`, err);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎯 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    // Test the schema by querying some tables
    console.log('\n🔍 Testing schema by querying tables...');
    
    const tests = [
      { name: 'projects', query: 'SELECT COUNT(*) as count FROM projects' },
      { name: 'areas', query: 'SELECT COUNT(*) as count FROM areas' },
      { name: 'risk_categories', query: 'SELECT COUNT(*) as count FROM risk_categories' },
      { name: 'risk_items', query: 'SELECT COUNT(*) as count FROM risk_items' }
    ];

    for (const test of tests) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: test.query });
        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: Available`);
        }
      } catch (err) {
        console.log(`❌ ${test.name}: ${err.message}`);
      }
    }

    // Test the utility functions
    console.log('\n🔧 Testing utility functions...');
    try {
      const { data: projectAreas, error: areaError } = await supabase.rpc('get_project_with_areas', {
        p_project_code: 'AIC'
      });
      
      if (areaError) {
        console.log('❌ get_project_with_areas function:', areaError.message);
      } else {
        console.log(`✅ get_project_with_areas function works: ${projectAreas?.length || 0} results`);
      }
    } catch (err) {
      console.log('❌ get_project_with_areas function error:', err.message);
    }

    try {
      const { data: riskData, error: riskError } = await supabase.rpc('get_risk_categories_with_items');
      
      if (riskError) {
        console.log('❌ get_risk_categories_with_items function:', riskError.message);
      } else {
        console.log(`✅ get_risk_categories_with_items function works: ${riskData?.length || 0} results`);
      }
    } catch (err) {
      console.log('❌ get_risk_categories_with_items function error:', err.message);
    }

    console.log('\n🎉 Complete schema migration finished!');
    console.log('💡 Next steps:');
    console.log('   1. Update the SafetyPatrolService to use the new schema');
    console.log('   2. Create area selection components');
    console.log('   3. Create risk assessment components');
    console.log('   4. Implement R2 photo upload');

  } catch (error) {
    console.error('❌ Schema migration failed:', error);
  }
}

runCompleteSchema();
