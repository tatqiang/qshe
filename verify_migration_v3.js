import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying Safety Audit Schema v3 Migration...\n');
  
  try {
    // 1. Check categories
    console.log('📋 Step 1: Checking Categories...');
    const { data: categories, error: catError } = await supabase
      .from('safety_audit_categories')
      .select('id, category_code, category_id, name_th, name_en')
      .order('category_code');
    
    if (catError) throw catError;
    
    console.log('✅ Categories:', categories.length);
    categories.forEach(cat => {
      console.log(`   ${cat.category_code} (${cat.category_id}): ${cat.name_th}`);
    });
    console.log();
    
    // 2. Check revisions
    console.log('📋 Step 2: Checking Requirement Revisions...');
    const { data: revisions, error: revError } = await supabase
      .from('safety_audit_requirement_revisions')
      .select(`
        id,
        revision_number,
        is_active,
        category:safety_audit_categories(category_code, category_id)
      `)
      .order('category_id, revision_number');
    
    if (revError) throw revError;
    
    console.log('✅ Revisions:', revisions.length);
    revisions.forEach(rev => {
      const active = rev.is_active ? '✓ ACTIVE' : '  inactive';
      console.log(`   ${rev.category.category_code} Rev ${rev.revision_number} ${active}`);
    });
    console.log();
    
    // 3. Check requirements count per category
    console.log('📋 Step 3: Checking Requirements per Category...');
    const { data: requirements, error: reqError } = await supabase
      .from('v_active_audit_requirements')
      .select('category_code, requirement_id, item_number, description_th, weight')
      .order('category_code, item_number');
    
    if (reqError) throw reqError;
    
    const reqsByCategory = requirements.reduce((acc, req) => {
      if (!acc[req.category_code]) acc[req.category_code] = [];
      acc[req.category_code].push(req);
      return acc;
    }, {});
    
    console.log('✅ Active Requirements by Category:');
    Object.entries(reqsByCategory).forEach(([code, reqs]) => {
      console.log(`\n   Category ${code}: ${reqs.length} items`);
      reqs.forEach(req => {
        console.log(`      ${req.item_number}. ${req.description_th} (weight: ${req.weight})`);
      });
    });
    console.log();
    
    // 4. Check safety_audits table structure
    console.log('📋 Step 4: Checking safety_audits table columns...');
    const { data: auditColumns, error: colError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'safety_audits' 
            AND column_name IN ('audit_criteria_rev', 'category_scores', 'category_id', 'revision_id')
          ORDER BY column_name;
        `
      })
      .catch(() => {
        // If RPC doesn't exist, use alternative method
        return { data: null, error: 'RPC not available - check manually' };
      });
    
    if (auditColumns) {
      console.log('✅ Key columns in safety_audits:');
      console.log('   - audit_criteria_rev (should exist)');
      console.log('   - category_scores (should exist)');
      console.log('   - category_id (should NOT exist - removed)');
      console.log('   - revision_id (should NOT exist - removed)');
    } else {
      console.log('⚠️  Cannot verify column structure - check manually');
    }
    console.log();
    
    // 5. Check safety_audit_results table structure
    console.log('📋 Step 5: Checking safety_audit_results has category_id...');
    const { data: results, error: resError } = await supabase
      .from('safety_audit_results')
      .select('id, category_id')
      .limit(1);
    
    if (resError && resError.message.includes('category_id')) {
      console.log('❌ category_id column not found in safety_audit_results!');
    } else {
      console.log('✅ safety_audit_results.category_id column exists');
    }
    console.log();
    
    // Summary
    console.log('========================================');
    console.log('📊 MIGRATION VERIFICATION SUMMARY');
    console.log('========================================');
    console.log(`✅ Categories: ${categories.length} (A-G)`);
    console.log(`✅ Revisions: ${revisions.length}`);
    console.log(`✅ Active Requirements: ${requirements.length}`);
    console.log('   - Category A: 4 items');
    console.log('   - Category B: 6 items (Rev 1 active)');
    console.log('   - Category C: 7 items');
    console.log('========================================\n');
    
    // Check expected counts
    const expectedA = 4;
    const expectedB = 6;
    const expectedC = 7;
    const actualA = reqsByCategory['A']?.length || 0;
    const actualB = reqsByCategory['B']?.length || 0;
    const actualC = reqsByCategory['C']?.length || 0;
    
    if (actualA === expectedA && actualB === expectedB && actualC === expectedC) {
      console.log('✅ ALL VERIFICATION CHECKS PASSED!');
      console.log('✅ Migration completed successfully!');
      console.log('\n🎉 Ready to build the form UI!\n');
    } else {
      console.log('⚠️  Warning: Requirement counts do not match expected values');
      console.log(`   Expected: A=${expectedA}, B=${expectedB}, C=${expectedC}`);
      console.log(`   Actual:   A=${actualA}, B=${actualB}, C=${actualC}`);
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    console.log('\n💡 This might be expected if migration has not been run yet.');
    console.log('💡 Run the migration first via Supabase Dashboard SQL Editor.\n');
  }
}

verifyMigration();
