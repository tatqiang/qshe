-- =====================================================
-- Migration: Add Sub Area 2 field to construction_itrs
-- Description: Add sub_area_2_id column for additional location granularity
-- Date: 2026-02-01
-- =====================================================

-- Add sub_area_2_id column to construction_itrs table
ALTER TABLE construction_itrs 
ADD COLUMN IF NOT EXISTS sub_area_2_id UUID REFERENCES sub_areas_2(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_construction_itrs_sub_area_2_id ON construction_itrs(sub_area_2_id);

-- Add comment
COMMENT ON COLUMN construction_itrs.sub_area_2_id IS 'Reference to Sub Area 2 (e.g., Room 201, Workstation A) - Optional third level of location hierarchy';
