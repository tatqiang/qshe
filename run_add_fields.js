import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  console.log('\n============================================');
  console.log('Adding Title and Gender Fields');
  console.log('============================================\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'database', 'add_title_and_gender_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded successfully');
    console.log('🔄 Executing SQL...\n');

    // Execute the SQL using Supabase RPC or direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
      // If RPC doesn't exist, we'll need to use the REST API directly
      return { data: null, error: null };
    });

    if (error) {
      console.log('⚠️  RPC method not available, please run SQL manually via Supabase Dashboard\n');
      console.log('📍 File location: database\\add_title_and_gender_fields.sql\n');
      console.log('📝 Instructions:');
      console.log('   1. Go to your Supabase Dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the SQL from the file above');
      console.log('   4. Click Run or press Ctrl+Enter\n');
      return;
    }

    console.log('✅ SQL executed successfully!\n');
    
    // Verify the fields were added
    console.log('🔍 Verifying new fields...\n');
    
    const { data: fields, error: verifyError } = await supabase
      .from('form_fields')
      .select('field_key, label_th, field_type, display_order, section')
      .in('field_key', ['title_name', 'gender'])
      .eq('section', 'personal_info');

    if (verifyError) {
      console.error('❌ Error verifying fields:', verifyError);
      return;
    }

    if (fields && fields.length > 0) {
      console.log('✅ Fields verified successfully:');
      fields.forEach(field => {
        console.log(`   - ${field.label_th} (${field.field_key}): ${field.field_type}, order: ${field.display_order}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Fields not found. Please run SQL manually.\n');
    }

    console.log('============================================');
    console.log('✅ Done!');
    console.log('============================================\n');
    console.log('Next steps:');
    console.log('1. Open http://localhost:5173/admin/project-form-config');
    console.log('2. Select your project and form template');
    console.log('3. You should see the new fields in ข้อมูลส่วนตัว section\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Please run the SQL manually via Supabase Dashboard');
    console.log('File: database\\add_title_and_gender_fields.sql\n');
  }
}

runSQL();
