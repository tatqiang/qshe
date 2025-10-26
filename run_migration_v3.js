import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Safety Audit Schema v3 Migration...\n');
    
    // Read SQL file
    const sqlPath = join(__dirname, 'database', 'migrations', 'safety_audit_schema_v3_multi_category.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL file loaded successfully');
    console.log('📄 File size:', (sql.length / 1024).toFixed(2), 'KB\n');
    
    // Split SQL into individual statements (rough split by semicolons)
    // Note: This is a simple approach; for production, use a proper SQL parser
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements\n`);
    
    // Execute via Supabase RPC (if you have a function to execute raw SQL)
    // Alternative: Use psql command-line tool
    console.log('⚠️  Note: Executing complex migrations with DDL changes...');
    console.log('⚠️  This requires direct database access via psql or Supabase Dashboard.\n');
    
    // Option 1: Use Supabase Dashboard SQL Editor
    console.log('📋 OPTION 1: Use Supabase Dashboard');
    console.log('   1. Go to: https://supabase.com/dashboard/project/wbzzvchjdqtzxwwquogl/sql');
    console.log('   2. Copy the SQL from: database/migrations/safety_audit_schema_v3_multi_category.sql');
    console.log('   3. Paste and execute in SQL Editor\n');
    
    // Option 2: Use psql command-line
    console.log('📋 OPTION 2: Use psql Command-Line');
    console.log('   Run this command:');
    console.log('   psql -h db.wbzzvchjdqtzxwwquogl.supabase.co -U postgres -d postgres -f database/migrations/safety_audit_schema_v3_multi_category.sql\n');
    
    // For demonstration, let's test a simple query
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('safety_audit_categories')
      .select('id, category_code, name_th')
      .limit(5);
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Current categories:', data);
    }
    
    console.log('\n✨ Please run the migration manually using one of the options above.');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();
