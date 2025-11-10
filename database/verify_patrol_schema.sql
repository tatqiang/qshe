-- Verify and add missing columns for Patrol feature
-- Run this in Supabase SQL Editor to ensure all required columns exist

-- =============================================================================
-- 1. ADD MISSING COLUMNS TO safety_patrols TABLE
-- =============================================================================

DO $$ 
BEGIN 
    -- Add inspector_id if not exists (who conducted the patrol)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'safety_patrols' AND column_name = 'inspector_id') THEN
        ALTER TABLE safety_patrols ADD COLUMN inspector_id UUID;
        CREATE INDEX IF NOT EXISTS idx_safety_patrols_inspector_id ON safety_patrols(inspector_id);
    END IF;
    
    -- Add priority column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'safety_patrols' AND column_name = 'priority') THEN
        ALTER TABLE safety_patrols ADD COLUMN priority VARCHAR(20) 
        CHECK (priority IN ('immediate', 'high', 'medium', 'low')) DEFAULT 'medium';
    END IF;
    
    -- Add due_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'safety_patrols' AND column_name = 'due_date') THEN
        ALTER TABLE safety_patrols ADD COLUMN due_date DATE;
    END IF;
    
    -- Add remark column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'safety_patrols' AND column_name = 'remark') THEN
        ALTER TABLE safety_patrols ADD COLUMN remark TEXT;
    END IF;
    
    -- Add risk_score column if not exists (calculated: likelihood * severity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'safety_patrols' AND column_name = 'risk_score') THEN
        ALTER TABLE safety_patrols ADD COLUMN risk_score INTEGER;
    END IF;
END $$;

-- =============================================================================
-- 2. ADD MISSING COLUMNS TO patrol_photos TABLE
-- =============================================================================

DO $$ 
BEGIN 
    -- Add uploaded_by column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrol_photos' AND column_name = 'uploaded_by') THEN
        ALTER TABLE patrol_photos ADD COLUMN uploaded_by UUID;
        CREATE INDEX IF NOT EXISTS idx_patrol_photos_uploaded_by ON patrol_photos(uploaded_by);
    END IF;
END $$;

-- =============================================================================
-- 3. ADD MISSING COLUMNS TO corrective_actions TABLE
-- =============================================================================

DO $$ 
BEGIN 
    -- Add approved_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'corrective_actions' AND column_name = 'approved_at') THEN
        ALTER TABLE corrective_actions ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
    
    -- Add rejected_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'corrective_actions' AND column_name = 'rejected_at') THEN
        ALTER TABLE corrective_actions ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
    
    -- Add rejection_reason column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'corrective_actions' AND column_name = 'rejection_reason') THEN
        ALTER TABLE corrective_actions ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- =============================================================================
-- 4. VERIFY TABLES EXIST
-- =============================================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'safety_patrols',
            'patrol_photos', 
            'corrective_actions',
            'progress_updates',
            'patrol_risk_categories',
            'patrol_risk_items',
            'patrol_witnesses'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'safety_patrols',
    'patrol_photos',
    'corrective_actions', 
    'progress_updates',
    'patrol_risk_categories',
    'patrol_risk_items',
    'patrol_witnesses'
  )
ORDER BY table_name;

-- =============================================================================
-- 5. VERIFY COLUMNS IN safety_patrols
-- =============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'safety_patrols'
ORDER BY ordinal_position;

RAISE NOTICE 'Patrol schema verification complete! ✅';
