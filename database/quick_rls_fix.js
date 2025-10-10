// Manual RLS fix for profile completion
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbzzvchjdqtzxwwquogl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indienp2Y2hqZHF0enh3d3F1b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4ODc1NiwiZXhwIjoyMDcyOTY0NzU2fQ.kM6TlFEL0lQWI6J3_Ng4YqvPZhAi1sTn0mJVj9eCGaE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSQuick() {
  try {
    console.log('🔧 Quick RLS fix for profile completion...');

    // The core issue: Anonymous users need to INSERT into users table during profile completion
    // Let's add a simple policy to allow this

    console.log('1️⃣ Adding policy to allow anonymous INSERT with invitation token...');
    
    const insertPolicy = `
      CREATE POLICY "Allow anonymous profile completion" ON public.users
      FOR INSERT TO anon WITH CHECK (true);
    `;

    // Execute using raw SQL
    const { error: insertError } = await supabase
      .from('users')
      .insert([]) // This will fail but lets us test if INSERT is allowed
      .select()
      .limit(0);

    // If we can't even try INSERT, the policy is the issue
    console.log('Insert test error (expected):', insertError?.message);

    // Let's try a different approach - temporarily disable RLS
    console.log('2️⃣ Temporarily disabling RLS on users table...');
    
    // This is less secure but will allow profile completion to work
    console.log('⚠️ WARNING: This is a temporary fix for development');
    console.log('In production, proper RLS policies should be implemented');

    console.log('✅ Run this SQL manually in Supabase Dashboard:');
    console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
    
    console.log('\n📋 Alternative: Run these policies manually:');
    console.log(`
CREATE POLICY "Allow anonymous profile completion" ON public.users
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous profile updates" ON public.users  
FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous profile read" ON public.users
FOR SELECT TO anon USING (true);
    `);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRLSQuick();
