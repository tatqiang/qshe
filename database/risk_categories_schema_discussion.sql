-- Risk Categories Schema Discussion
-- Comparing different approaches for risk category management

-- =================================================================
-- OPTION 1: Your Proposed Solution (Recommended)
-- =================================================================

-- Risk Categories Master Table
CREATE TABLE risk_categories (
    id SERIAL PRIMARY KEY,  -- Auto-incrementing integer (1,2,3,...)
    
    -- Category identification
    category_name VARCHAR(255) NOT NULL,
    category_code VARCHAR(50), -- Optional short code like 'HW', 'ELEC'
    
    -- Internationalization support (for future)
    category_name_th VARCHAR(255), -- Thai name
    category_name_en VARCHAR(255), -- English name
    
    -- Visual properties
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50) DEFAULT '⚠️', -- Emoji or icon class
    background_color VARCHAR(7), -- Background color for badges
    
    -- Category properties
    description TEXT,
    is_high_risk BOOLEAN DEFAULT FALSE,
    requires_immediate_action BOOLEAN DEFAULT FALSE,
    escalation_level VARCHAR(20) DEFAULT 'supervisor', -- 'none', 'supervisor', 'manager', 'executive'
    
    -- Ordering and grouping
    sort_order INTEGER DEFAULT 0,
    category_group VARCHAR(100), -- Group like 'Equipment', 'Procedure', 'Environmental'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(category_name),
    UNIQUE(category_code)
);

-- Index for performance
CREATE INDEX idx_risk_categories_active ON risk_categories(is_active);
CREATE INDEX idx_risk_categories_group ON risk_categories(category_group);
CREATE INDEX idx_risk_categories_sort ON risk_categories(sort_order);

-- =================================================================
-- STORAGE OPTIONS FOR PATROL RECORDS
-- =================================================================

-- Option 1A: JSON Array (Your suggestion - Good for flexibility)
ALTER TABLE safety_patrols ADD COLUMN risk_category_ids JSONB;
-- Example data: [1, 3, 5] or {"categories": [1, 3, 5], "primary": 1}

-- Option 1B: Many-to-Many Junction Table (Best for complex queries)
CREATE TABLE patrol_risk_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patrol_id UUID NOT NULL REFERENCES safety_patrols(id) ON DELETE CASCADE,
    risk_category_id INTEGER NOT NULL REFERENCES risk_categories(id),
    
    -- Additional fields for relationship
    is_primary BOOLEAN DEFAULT FALSE, -- Mark the main category
    severity_level INTEGER, -- Category-specific severity (1-4)
    notes TEXT, -- Category-specific notes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(patrol_id, risk_category_id) -- Prevent duplicates
);

-- Indexes for junction table
CREATE INDEX idx_patrol_risk_categories_patrol ON patrol_risk_categories(patrol_id);
CREATE INDEX idx_patrol_risk_categories_category ON patrol_risk_categories(risk_category_id);
CREATE INDEX idx_patrol_risk_categories_primary ON patrol_risk_categories(is_primary);

-- Option 1C: PostgreSQL Array (Simple and efficient)
ALTER TABLE safety_patrols ADD COLUMN risk_category_ids INTEGER[];
-- Example data: ARRAY[1, 3, 5]

-- =================================================================
-- COMPARISON OF STORAGE OPTIONS
-- =================================================================

/*
+------------------+------------------+------------------+------------------+
| Aspect           | JSON Array       | Junction Table   | PostgreSQL Array |
+------------------+------------------+------------------+------------------+
| Flexibility      | High             | Highest          | Medium           |
| Query Performance| Medium           | Highest          | High             |
| Relationship Data| Limited          | Full Support     | None             |
| Standard SQL     | No (PostgreSQL)  | Yes              | No (PostgreSQL)  |
| Complex Filtering| Medium           | Easy             | Medium           |
| Data Integrity   | Manual           | Automatic (FK)   | Manual           |
| Storage Size     | Medium           | Larger           | Smallest         |
+------------------+------------------+------------------+------------------+
*/

-- =================================================================
-- RECOMMENDED FUNCTIONS FOR EACH APPROACH
-- =================================================================

-- For JSON Array Approach
CREATE OR REPLACE FUNCTION get_patrols_by_risk_categories_json(
    p_category_ids INTEGER[]
)
RETURNS TABLE (
    patrol_id UUID,
    title VARCHAR,
    risk_categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.title,
        sp.risk_category_ids
    FROM safety_patrols sp
    WHERE sp.risk_category_ids ?| ARRAY(SELECT category_id::text FROM unnest(p_category_ids) AS category_id);
END;
$$ LANGUAGE plpgsql;

-- For Junction Table Approach (RECOMMENDED)
CREATE OR REPLACE FUNCTION get_patrols_by_risk_categories_junction(
    p_category_ids INTEGER[]
)
RETURNS TABLE (
    patrol_id UUID,
    title VARCHAR,
    category_names TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.title,
        string_agg(rc.category_name, ', ' ORDER BY rc.category_name) as category_names
    FROM safety_patrols sp
    JOIN patrol_risk_categories prc ON sp.id = prc.patrol_id
    JOIN risk_categories rc ON prc.risk_category_id = rc.id
    WHERE prc.risk_category_id = ANY(p_category_ids)
    AND rc.is_active = TRUE
    GROUP BY sp.id, sp.title;
END;
$$ LANGUAGE plpgsql;

-- For PostgreSQL Array Approach
CREATE OR REPLACE FUNCTION get_patrols_by_risk_categories_array(
    p_category_ids INTEGER[]
)
RETURNS TABLE (
    patrol_id UUID,
    title VARCHAR,
    risk_category_ids INTEGER[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.title,
        sp.risk_category_ids
    FROM safety_patrols sp
    WHERE sp.risk_category_ids && p_category_ids; -- Array overlap operator
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- SAMPLE DATA
-- =================================================================

INSERT INTO risk_categories (
    category_name, 
    category_name_th, 
    category_name_en, 
    category_code, 
    color, 
    icon, 
    category_group,
    description,
    sort_order
) VALUES
('High Work', 'งานที่ความสูง', 'High Work', 'HW', '#3B82F6', '🏗️', 'Equipment', 'Work at height activities', 1),
('Electricity', 'ไฟฟ้า', 'Electricity', 'ELEC', '#EAB308', '⚡', 'Equipment', 'Electrical work and equipment', 2),
('Crane Operations', 'งานเครน', 'Crane Operations', 'CRANE', '#F97316', '🏗️', 'Equipment', 'Crane and lifting operations', 3),
('LOTO', 'ล็อคเอาท์แท็กเอาท์', 'Lock Out Tag Out', 'LOTO', '#EF4444', '🔒', 'Procedure', 'Lock Out Tag Out procedures', 4),
('Chemical Handling', 'การจัดการสารเคมี', 'Chemical Handling', 'CHEM', '#8B5CF6', '🧪', 'Environmental', 'Chemical storage and handling', 5),
('Confined Space', 'พื้นที่อับอากาศ', 'Confined Space', 'CS', '#EC4899', '🚧', 'Environmental', 'Confined space entry', 6),
('Personal Protective Equipment', 'อุปกรณ์ป้องกันส่วนบุคคล', 'PPE', 'PPE', '#10B981', '🦺', 'Procedure', 'Personal protective equipment usage', 7),
('Fire Safety', 'ความปลอดภัยด้านไฟ', 'Fire Safety', 'FIRE', '#DC2626', '🔥', 'Environmental', 'Fire prevention and response', 8);

-- =================================================================
-- MY RECOMMENDATION
-- =================================================================

/*
RECOMMENDED APPROACH: Junction Table (Option 1B)

WHY?
1. ✅ Best Performance: Optimized for complex queries and filtering
2. ✅ Full Relationship Support: Can store additional metadata per category
3. ✅ Data Integrity: Foreign key constraints prevent orphaned records
4. ✅ Standard SQL: Works with any database system
5. ✅ Flexible Filtering: Easy to implement multi-select filters
6. ✅ Reporting Friendly: Easy aggregations and analytics
7. ✅ Audit Trail: Can track when categories were added/removed

WHEN TO USE ALTERNATIVES:
- JSON Array: If you need very flexible, schema-less category data
- PostgreSQL Array: If you want simplicity and don't need relationship metadata

FRONTEND BENEFITS:
- Easy multi-select filtering: WHERE category_id IN (1,3,5)
- Rich category display: Show category name, color, icon
- Internationalization: Switch between Thai/English names
- Category analytics: Count patrols per category easily
*/

-- =================================================================
-- MIGRATION STRATEGY (if moving from current system)
-- =================================================================

-- Step 1: Create new tables
-- (Run the CREATE TABLE statements above)

-- Step 2: Migrate existing data
INSERT INTO patrol_risk_categories (patrol_id, risk_category_id, is_primary)
SELECT 
    sp.id as patrol_id,
    rc.id as risk_category_id,
    TRUE as is_primary -- Mark first category as primary
FROM safety_patrols sp
JOIN risk_categories rc ON rc.category_name = sp.old_risk_category_name -- Assuming old column exists
WHERE sp.old_risk_category_name IS NOT NULL;

-- Step 3: Verify data integrity
SELECT 
    'Patrols without categories' as check_type,
    COUNT(*) as count
FROM safety_patrols sp
LEFT JOIN patrol_risk_categories prc ON sp.id = prc.patrol_id
WHERE prc.patrol_id IS NULL

UNION ALL

SELECT 
    'Categories not used' as check_type,
    COUNT(*) as count
FROM risk_categories rc
LEFT JOIN patrol_risk_categories prc ON rc.id = prc.risk_category_id
WHERE prc.risk_category_id IS NULL;

-- Step 4: Drop old columns (after verification)
-- ALTER TABLE safety_patrols DROP COLUMN old_risk_category_name;
