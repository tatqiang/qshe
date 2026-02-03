-- Migration: Add Construction Tasks Table
-- Description: Creates construction_tasks table for project planning with Gantt chart support
-- Date: 2026-01-29

-- Run the schema creation
\i 'database/schema/schema_construction_tasks'

-- Verify table was created
SELECT 'Construction tasks table created successfully!' as status;

-- Show table structure
\d construction_tasks;
