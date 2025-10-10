-- Safety Patrol Complete Schema 
-- This schema matches the SafetyPatrolFormData and SafetyPatrol interfaces

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS public.patrol_photos CASCADE;
DROP TABLE IF EXISTS public.patrol_risk_categories CASCADE;
DROP TABLE IF EXISTS public.patrol_risk_items CASCADE;
DROP TABLE IF EXISTS public.corrective_actions CASCADE;
DROP TABLE IF EXISTS public.progress_updates CASCADE;
DROP TABLE IF EXISTS public.patrol_witnesses CASCADE;
DROP TABLE IF EXISTS public.safety_patrols CASCADE;

-- Ensure enums exist (create if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patrol_type') THEN
        CREATE TYPE public.patrol_type AS ENUM ('scheduled', 'unscheduled', 'follow_up', 'inspection');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patrol_status') THEN
        CREATE TYPE public.patrol_status AS ENUM ('draft', 'in_progress', 'completed', 'under_review', 'closed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'extremely_high');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommended_action') THEN
        CREATE TYPE public.recommended_action AS ENUM ('monitor', 'control', 'mitigate', 'stop_work');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_type') THEN
        CREATE TYPE public.photo_type AS ENUM ('issue', 'before', 'after', 'evidence');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE public.action_type AS ENUM ('immediate', 'short_term', 'long_term', 'preventive');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
        CREATE TYPE public.action_status AS ENUM ('assigned', 'in_progress', 'completed', 'verified', 'overdue');
    END IF;
END $$;

-- Risk Categories table (keep existing if present)
CREATE TABLE IF NOT EXISTS public.risk_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Items table (keep existing if present)
CREATE TABLE IF NOT EXISTS public.risk_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50), -- 'equipment', 'procedure', 'environmental'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hierarchical Areas Tables for Project Structure
-- Note: These tables should already exist from normalized_areas_schema.sql
-- We'll create them only if they don't exist to maintain compatibility

CREATE TABLE IF NOT EXISTS public.main_areas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    main_area_name VARCHAR(255) NOT NULL,
    description TEXT,
    area_code VARCHAR(50), -- Area code like "BLDG-A", "ZONE-1"
    area_type VARCHAR(50) DEFAULT 'building',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT main_areas_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sub_areas_1 (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    main_area_id uuid NOT NULL REFERENCES public.main_areas(id) ON DELETE CASCADE,
    sub_area1_name VARCHAR(255) NOT NULL,
    description TEXT,
    sub_area1_code VARCHAR(50), -- Sub-area code like "FLR-1", "SEC-A"
    area_type VARCHAR(50) DEFAULT 'floor',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT sub_areas_1_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sub_areas_2 (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sub_area1_id uuid NOT NULL REFERENCES public.sub_areas_1(id) ON DELETE CASCADE,
    sub_area2_name VARCHAR(255) NOT NULL,
    description TEXT,
    sub_area2_code VARCHAR(50), -- Detail area code like "RM-101", "BAY-3"
    area_type VARCHAR(50) DEFAULT 'room',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT sub_areas_2_pkey PRIMARY KEY (id)
);

-- Main safety patrols table
CREATE TABLE public.safety_patrols (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_number character varying NOT NULL UNIQUE,
  
  -- Basic Information
  title character varying NOT NULL,
  description text,
  patrol_type patrol_type NOT NULL DEFAULT 'scheduled',
  patrol_date date NOT NULL DEFAULT CURRENT_DATE,
  status patrol_status NOT NULL DEFAULT 'draft',
  
  -- Project and Location
  project_id uuid,
  
  -- Normalized location fields (hierarchical areas)
  main_area_id uuid REFERENCES public.main_areas(id),
  sub_area1_id uuid REFERENCES public.sub_areas_1(id), 
  sub_area2_id uuid REFERENCES public.sub_areas_2(id),
  
  -- Legacy area fields (backward compatibility)
  main_area character varying,
  sub_area1 character varying,
  sub_area2 character varying,
  specific_location text,
  area_info jsonb, -- Store full area object for complex data
  
  -- Risk Assessment
  likelihood integer NOT NULL CHECK (likelihood BETWEEN 1 AND 4),
  severity integer NOT NULL CHECK (severity BETWEEN 1 AND 4),
  risk_level risk_level NOT NULL,
  recommended_action recommended_action,
  
  -- Safety Flags
  immediate_hazard boolean NOT NULL DEFAULT false,
  work_stopped boolean NOT NULL DEFAULT false,
  legal_requirement boolean NOT NULL DEFAULT false,
  
  -- References
  contractor_id uuid,
  regulation_reference text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  
  CONSTRAINT safety_patrols_pkey PRIMARY KEY (id)
);

-- Junction table for patrol-risk category relationships
CREATE TABLE public.patrol_risk_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid NOT NULL REFERENCES public.safety_patrols(id) ON DELETE CASCADE,
  risk_category_id integer NOT NULL REFERENCES public.risk_categories(id),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT patrol_risk_categories_pkey PRIMARY KEY (id),
  CONSTRAINT patrol_risk_categories_unique UNIQUE (patrol_id, risk_category_id)
);

-- Junction table for patrol-risk item relationships  
CREATE TABLE public.patrol_risk_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid NOT NULL REFERENCES public.safety_patrols(id) ON DELETE CASCADE,
  risk_item_id integer NOT NULL REFERENCES public.risk_items(id),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT patrol_risk_items_pkey PRIMARY KEY (id),
  CONSTRAINT patrol_risk_items_unique UNIQUE (patrol_id, risk_item_id)
);

-- Patrol witnesses table
CREATE TABLE public.patrol_witnesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid NOT NULL REFERENCES public.safety_patrols(id) ON DELETE CASCADE,
  witness_name character varying NOT NULL,
  witness_role character varying,
  witness_company character varying,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT patrol_witnesses_pkey PRIMARY KEY (id)
);

-- Photos table for patrol evidence
CREATE TABLE public.patrol_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid REFERENCES public.safety_patrols(id) ON DELETE CASCADE,
  action_id uuid, -- References corrective_actions if photo belongs to an action
  
  -- File Information
  file_path text NOT NULL,
  file_name character varying NOT NULL,
  file_size bigint,
  photo_type photo_type NOT NULL DEFAULT 'issue',
  
  -- Photo Details
  caption text,
  taken_at timestamp with time zone DEFAULT now(),
  taken_by uuid,
  
  -- Storage (for base64 data URLs during development)
  photo_data text, -- Store base64 data URL for demo/development
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT patrol_photos_pkey PRIMARY KEY (id)
);

-- Corrective actions table
CREATE TABLE public.corrective_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid NOT NULL REFERENCES public.safety_patrols(id) ON DELETE CASCADE,
  action_number character varying NOT NULL,
  
  -- Action Details
  description text NOT NULL,
  action_type action_type NOT NULL,
  root_cause_analysis text,
  
  -- Responsibility & Timeline
  assigned_to uuid,
  assigned_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  
  -- Progress Tracking
  status action_status NOT NULL DEFAULT 'assigned',
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Verification
  verified_by uuid,
  verification_date date,
  verification_notes text,
  
  -- Cost & Resources
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  resources_required text[], -- Array of required resources
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  
  CONSTRAINT corrective_actions_pkey PRIMARY KEY (id)
);

-- Progress updates for corrective actions
CREATE TABLE public.progress_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
  
  -- Update Details
  update_text text NOT NULL,
  progress_percentage integer NOT NULL CHECK (progress_percentage BETWEEN 0 AND 100),
  update_date date DEFAULT CURRENT_DATE,
  
  -- Metadata
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT progress_updates_pkey PRIMARY KEY (id)
);

-- Indexes for performance
CREATE INDEX idx_safety_patrols_project_id ON public.safety_patrols(project_id);
CREATE INDEX idx_safety_patrols_date ON public.safety_patrols(patrol_date);
CREATE INDEX idx_safety_patrols_status ON public.safety_patrols(status);
CREATE INDEX idx_safety_patrols_risk_level ON public.safety_patrols(risk_level);
CREATE INDEX idx_safety_patrols_created_by ON public.safety_patrols(created_by);
CREATE INDEX IF NOT EXISTS idx_safety_patrols_main_area ON public.safety_patrols(main_area_id);
CREATE INDEX IF NOT EXISTS idx_safety_patrols_sub_area1 ON public.safety_patrols(sub_area1_id);
CREATE INDEX IF NOT EXISTS idx_safety_patrols_sub_area2 ON public.safety_patrols(sub_area2_id);
CREATE INDEX IF NOT EXISTS idx_patrol_photos_patrol_id ON public.patrol_photos(patrol_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_patrol_id ON public.corrective_actions(patrol_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_assigned_to ON public.corrective_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_due_date ON public.corrective_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_main_areas_project_id ON public.main_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_areas_1_main_area ON public.sub_areas_1(main_area_id);
CREATE INDEX IF NOT EXISTS idx_sub_areas_2_sub_area1 ON public.sub_areas_2(sub_area1_id);

-- Functions to automatically calculate risk level
CREATE OR REPLACE FUNCTION calculate_risk_level(likelihood_val integer, severity_val integer)
RETURNS risk_level AS $$
BEGIN
  CASE likelihood_val * severity_val
    WHEN 1, 2 THEN RETURN 'low';
    WHEN 3, 4, 6, 8 THEN RETURN 'medium';
    WHEN 9 THEN RETURN 'high';
    WHEN 12, 16 THEN RETURN 'extremely_high';
    ELSE RETURN 'medium';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set recommended action
CREATE OR REPLACE FUNCTION get_recommended_action(likelihood_val integer, severity_val integer)
RETURNS recommended_action AS $$
BEGIN
  CASE likelihood_val * severity_val
    WHEN 1, 2 THEN RETURN 'monitor';
    WHEN 3, 4, 6, 8 THEN RETURN 'control';
    WHEN 9 THEN RETURN 'mitigate';
    WHEN 12, 16 THEN RETURN 'stop_work';
    ELSE RETURN 'control';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate risk level and recommended action
CREATE OR REPLACE FUNCTION update_risk_calculations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.risk_level := calculate_risk_level(NEW.likelihood, NEW.severity);
  NEW.recommended_action := get_recommended_action(NEW.likelihood, NEW.severity);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_risk_calculations
  BEFORE INSERT OR UPDATE OF likelihood, severity ON public.safety_patrols
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_calculations();

-- Function to generate patrol numbers
CREATE OR REPLACE FUNCTION generate_patrol_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the current date in YYYYMMDD format
  SELECT TO_CHAR(CURRENT_DATE, 'YYYYMMDD') INTO new_number;
  
  -- Count existing patrols for today
  SELECT COUNT(*) + 1 INTO counter
  FROM public.safety_patrols 
  WHERE patrol_number LIKE 'SP-' || new_number || '-%';
  
  -- Generate format: SP-YYYYMMDD-001
  new_number := 'SP-' || new_number || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate patrol number
CREATE OR REPLACE FUNCTION set_patrol_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patrol_number IS NULL OR NEW.patrol_number = '' THEN
    NEW.patrol_number := generate_patrol_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_patrol_number
  BEFORE INSERT ON public.safety_patrols
  FOR EACH ROW
  EXECUTE FUNCTION set_patrol_number();

-- Insert sample risk categories if they don't exist
INSERT INTO public.risk_categories (name, description, color, icon) 
VALUES 
  ('High Work', 'Work at height including scaffolding, ladders, etc.', '#EF4444', 'elevation'),
  ('Electricity', 'Electrical hazards and electrical work', '#F59E0B', 'electrical'),
  ('Crane Operations', 'Crane and lifting operations', '#8B5CF6', 'crane'),
  ('LOTO', 'Lock Out Tag Out procedures', '#10B981', 'lock'),
  ('Hot Work', 'Welding, cutting, grinding operations', '#F97316', 'fire'),
  ('Confined Space', 'Confined space entry and work', '#6366F1', 'space')
ON CONFLICT (name) DO NOTHING;

-- Insert sample risk items if they don't exist  
INSERT INTO public.risk_items (name, category, description)
VALUES
  ('Welding Machine', 'equipment', 'Arc welding equipment and tools'),
  ('Welder Certification', 'procedure', 'Qualified welder certification'),
  ('Grinder', 'equipment', 'Angle grinder for cutting/grinding'),
  ('Drill', 'equipment', 'Power drill equipment'),
  ('PTW Hot Work', 'procedure', 'Permit to Work for hot work activities'),
  ('PPE Check', 'procedure', 'Personal Protective Equipment verification'),
  ('Ventilation', 'environmental', 'Adequate ventilation systems'),
  ('Fire Watch', 'procedure', 'Fire watch personnel assignment')
ON CONFLICT (name) DO NOTHING;

-- Note: Area hierarchy data already exists from normalized_areas_schema.sql
-- The safety patrol tables will reference the existing main_areas, sub_areas_1, and sub_areas_2 tables
-- No need to insert duplicate area data since the tables already contain:
-- - Building A, Building B (for project 4e8bdada-960e-4cde-a94c-ccfa94a133d7)
-- - Warehouse (for project 956f0ecb-1eb5-45a2-b961-f7db9d4ebee5)
-- - Yard Area (for project a9b6708a-bad2-4d6b-9ff8-01815a106820)
-- - Sub areas and specific locations for each building

/*
-- The following INSERT statements are commented out to avoid duplicate key violations
-- since the area data already exists from normalized_areas_schema.sql

INSERT INTO public.main_areas (id, project_id, main_area_name, description, area_code, area_type, created_by) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', '4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Building A', 'Main office building', 'BLDG-A', 'building', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0000-000000000002', '4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Building B', 'Manufacturing facility', 'BLDG-B', 'building', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0000-000000000003', '956f0ecb-1eb5-45a2-b961-f7db9d4ebee5', 'Warehouse', 'Storage and logistics area', 'WHSE', 'warehouse', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0000-000000000004', 'a9b6708a-bad2-4d6b-9ff8-01815a106820', 'Yard Area', 'External work areas', 'YARD', 'outdoor', '29a51712-ca8a-494e-bdcd-73ee7cb666bc')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sub_areas_1 (id, main_area_id, sub_area1_name, description, sub_area1_code, area_type, created_by)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Ground Floor', 'Building A ground floor', 'GF', 'floor', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'First Floor', 'Building A first floor', '1F', 'floor', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000002', 'Production Line 1', 'Manufacturing line 1', 'PL1', 'zone', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000002', 'Production Line 2', 'Manufacturing line 2', 'PL2', 'zone', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000003', 'Zone A', 'Warehouse zone A', 'ZA', 'zone', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000003', 'Zone B', 'Warehouse zone B', 'ZB', 'zone', '29a51712-ca8a-494e-bdcd-73ee7cb666bc')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sub_areas_2 (id, sub_area1_id, sub_area2_name, description, sub_area2_code, area_type, created_by)
VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Reception', 'Main reception area', 'RCP', 'office', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Cafeteria', 'Staff dining area', 'CAF', 'room', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'Meeting Rooms', 'Conference facilities', 'MTG', 'office', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000003', 'Welding Bay', 'Welding operations area', 'WLD', 'workstation', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000003', 'Assembly Bay', 'Assembly operations', 'ASM', 'workstation', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000005', 'Loading Dock', 'Truck loading area', 'DOCK', 'storage', '29a51712-ca8a-494e-bdcd-73ee7cb666bc')
ON CONFLICT (id) DO NOTHING;
*/

COMMENT ON TABLE public.safety_patrols IS 'Main table for safety patrol records with comprehensive risk assessment data';
COMMENT ON TABLE public.patrol_photos IS 'Photos associated with safety patrols and corrective actions';
COMMENT ON TABLE public.corrective_actions IS 'Corrective actions arising from safety patrol findings';
COMMENT ON COLUMN public.safety_patrols.area_info IS 'JSON object containing full hierarchical area information';
COMMENT ON COLUMN public.patrol_photos.photo_data IS 'Base64 data URL for development/demo purposes';
