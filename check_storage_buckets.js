// ============================================
// CHECK SUPABASE STORAGE BUCKETS
// ============================================
// Run this to see what storage buckets exist
// node check_storage_buckets.js
// ============================================

import { createClient } from '@supabase/supabase-js';

// Get your Supabase credentials from .env or hardcode temporarily
const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY_HERE'; // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log('🔍 Checking Supabase Storage Buckets...\n');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('⚠️  No buckets found!');
      return;
    }
    
    console.log(`✅ Found ${buckets.length} bucket(s):\n`);
    
    buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. Bucket: "${bucket.name}"`);
      console.log(`   ID: ${bucket.id}`);
      console.log(`   Public: ${bucket.public}`);
      console.log(`   Created: ${bucket.created_at}`);
      console.log('');
    });
    
    console.log('\n📝 Update your code to use the correct bucket name from above.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkBuckets();
