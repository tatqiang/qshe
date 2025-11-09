-- Rename sub_area columns to use underscores for consistency
-- This makes the column names match the form field names

-- 1. Rename columns in safety_patrols table (if not already renamed)
DO $$ 
BEGIN
  -- Only rename if old column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'safety_patrols' 
    AND column_name = 'sub_area1'
  ) THEN
    ALTER TABLE public.safety_patrols RENAME COLUMN sub_area1 TO sub_area_1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'safety_patrols' 
    AND column_name = 'sub_area2'
  ) THEN
    ALTER TABLE public.safety_patrols RENAME COLUMN sub_area2 TO sub_area_2;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'safety_patrols' 
    AND column_name = 'sub_area1_id'
  ) THEN
    ALTER TABLE public.safety_patrols RENAME COLUMN sub_area1_id TO sub_area_1_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'safety_patrols' 
    AND column_name = 'sub_area2_id'
  ) THEN
    ALTER TABLE public.safety_patrols RENAME COLUMN sub_area2_id TO sub_area_2_id;
  END IF;
END $$;

-- 2. Rename columns in sub_areas_1 table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_areas_1' 
    AND column_name = 'sub_area1_name'
  ) THEN
    ALTER TABLE public.sub_areas_1 RENAME COLUMN sub_area1_name TO sub_area_1_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_areas_1' 
    AND column_name = 'sub_area1_code'
  ) THEN
    ALTER TABLE public.sub_areas_1 RENAME COLUMN sub_area1_code TO sub_area_1_code;
  END IF;
END $$;

-- 3. Rename columns in sub_areas_2 table
DO $$ 
BEGIN
  -- Rename the foreign key column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_areas_2' 
    AND column_name = 'sub_area1_id'
  ) THEN
    ALTER TABLE public.sub_areas_2 RENAME COLUMN sub_area1_id TO sub_area_1_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_areas_2' 
    AND column_name = 'sub_area2_name'
  ) THEN
    ALTER TABLE public.sub_areas_2 RENAME COLUMN sub_area2_name TO sub_area_2_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_areas_2' 
    AND column_name = 'sub_area2_code'
  ) THEN
    ALTER TABLE public.sub_areas_2 RENAME COLUMN sub_area2_code TO sub_area_2_code;
  END IF;
END $$;
