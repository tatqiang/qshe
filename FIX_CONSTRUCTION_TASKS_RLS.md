# Fix Construction Tasks RLS Error

## Problem
Getting error: `new row violates row-level security policy for table "construction_tasks"`

## Solution
The `construction_tasks` table has RLS enabled but the policies are too restrictive. Run the migration to add proper policies.

## Steps to Fix

### Option 1: Run in Supabase Dashboard (Recommended)

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy and paste the content of: `database/migrations/add_construction_tasks_rls.sql`
4. Click **Run** button
5. Refresh your app - it should work now!

### Option 2: Quick Fix (Temporary)

If you need immediate access, run this in Supabase SQL Editor:

```sql
-- Quick fix: Allow all authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated users to view construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete construction tasks" ON public.construction_tasks;

CREATE POLICY "Allow all authenticated" ON public.construction_tasks
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

## What Changed

**Before:**
```sql
-- Restrictive policy that only checked auth
CREATE POLICY "Authenticated users can insert construction tasks"
  ON public.construction_tasks
  FOR INSERT
  WITH CHECK (auth.uid() is not null);
```

**After:**
```sql
-- Permissive policy for all authenticated users
CREATE POLICY "Allow authenticated users to insert construction tasks"
ON public.construction_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);
```

## Verify It Works

After running the SQL:

1. Refresh your QSHE app
2. Navigate to Project Planning
3. Click "Create Default Tasks"
4. Tasks should now be created successfully!

## Why This Happened

- RLS was enabled on the table
- The old policies didn't properly grant INSERT permissions
- The `WITH CHECK (auth.uid() is not null)` alone isn't sufficient in Supabase
- Need explicit `TO authenticated` role specification

## Future: Project-Based Access Control

If you want to restrict tasks to only specific projects later:

```sql
CREATE POLICY "Users can only manage tasks for their assigned projects"
ON public.construction_tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_users
    WHERE project_users.project_id = construction_tasks.project_id
    AND project_users.user_id = auth.uid()
  )
);
```

But for now, the permissive policy works for your internal team.
