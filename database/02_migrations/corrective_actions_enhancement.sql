-- Enhanced Corrective Actions with Approval Workflow and Photo Support
-- Building on existing safety_patrol_schema.sql

-- First, ensure we have the needed enums for the enhanced workflow
DO $$ 
BEGIN
    -- Enhance action_status enum to include approval workflow
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status_enhanced') THEN
        CREATE TYPE public.action_status_enhanced AS ENUM (
            'draft',           -- Initial creation
            'submitted',       -- Submitted for approval
            'approved',        -- Approved, ready for execution
            'rejected',        -- Rejected, needs revision
            'in_progress',     -- Being worked on
            'pending_review',  -- Work completed, pending verification
            'completed',       -- Verified and completed
            'overdue',         -- Past due date
            'cancelled'        -- Cancelled action
        );
    END IF;
    
    -- Approval levels enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_level') THEN
        CREATE TYPE public.approval_level AS ENUM (
            'supervisor',      -- Direct supervisor approval
            'manager',         -- Department manager approval
            'safety_officer',  -- Safety officer approval
            'executive'        -- Executive level approval
        );
    END IF;
    
    -- Photo categories for corrective actions
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_photo_type') THEN
        CREATE TYPE public.action_photo_type AS ENUM (
            'planning',        -- Planning phase photos
            'before',          -- Before implementation
            'during',          -- During implementation
            'after',           -- After implementation
            'evidence',        -- Evidence of completion
            'verification'     -- Verification photos
        );
    END IF;
END $$;

-- =============================================================================
-- CORRECTIVE ACTION APPROVAL WORKFLOW
-- =============================================================================

-- Table to track approval workflow for corrective actions
CREATE TABLE IF NOT EXISTS public.corrective_action_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    
    -- Approval Flow
    approval_level approval_level NOT NULL,
    required_approver_role VARCHAR(50), -- Role that needs to approve (supervisor, manager, etc.)
    approver_id UUID,                   -- Who approved/rejected
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    
    -- Approval Details
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,
    approval_notes TEXT,
    conditions TEXT,                    -- Any conditions attached to approval
    
    -- Workflow Order
    sequence_order INTEGER NOT NULL,    -- Order in approval workflow
    is_final_approval BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(action_id, sequence_order)
);

-- =============================================================================
-- ENHANCED CORRECTIVE ACTION PHOTOS
-- =============================================================================

-- Table for photos associated with corrective actions at different phases
CREATE TABLE IF NOT EXISTS public.corrective_action_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    
    -- R2 Storage information
    r2_bucket VARCHAR(255) NOT NULL DEFAULT 'qshe-corrective-actions',
    r2_key TEXT NOT NULL,               -- The key/path in R2 bucket
    r2_url TEXT NOT NULL,               -- Full public URL to access the image
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Photo classification
    photo_type action_photo_type NOT NULL DEFAULT 'evidence',
    phase VARCHAR(50),                  -- Which phase: planning, execution, completion, verification
    
    -- Photo information
    caption TEXT,
    location_description TEXT,          -- Where the photo was taken
    
    -- Workflow context
    sequence_order INTEGER DEFAULT 0,
    taken_by UUID,                      -- Who took the photo
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID,                   -- Who approved this photo (for verification photos)
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ACTION WORKFLOW TRACKING
-- =============================================================================

-- Table to track the complete workflow status of each action
CREATE TABLE IF NOT EXISTS public.corrective_action_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    
    -- Current Status
    current_status action_status_enhanced NOT NULL DEFAULT 'draft',
    current_stage VARCHAR(100),          -- Human readable current stage
    next_required_action TEXT,           -- What needs to happen next
    
    -- Workflow Progress
    submission_date TIMESTAMPTZ,         -- When submitted for approval
    approval_started_date TIMESTAMPTZ,   -- When approval process started
    approval_completed_date TIMESTAMPTZ, -- When all approvals completed
    work_started_date TIMESTAMPTZ,       -- When actual work started
    work_completed_date TIMESTAMPTZ,     -- When work was completed
    verification_date TIMESTAMPTZ,       -- When work was verified
    
    -- Automated Flags
    requires_safety_approval BOOLEAN DEFAULT false,
    requires_manager_approval BOOLEAN DEFAULT false,
    requires_executive_approval BOOLEAN DEFAULT false,
    high_risk_action BOOLEAN DEFAULT false,
    
    -- SLA Tracking
    days_in_approval INTEGER DEFAULT 0,
    days_in_progress INTEGER DEFAULT 0,
    is_overdue BOOLEAN DEFAULT false,
    escalation_level INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(action_id)
);

-- =============================================================================
-- NOTIFICATION AND ESCALATION SYSTEM
-- =============================================================================

-- Table to track notifications and escalations for corrective actions
CREATE TABLE IF NOT EXISTS public.corrective_action_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- reminder, escalation, approval_request, etc.
    recipient_id UUID NOT NULL,             -- Who should receive the notification
    recipient_role VARCHAR(50),             -- Role of the recipient
    
    -- Message Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery Status
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,              -- When to send
    auto_escalate_after INTERVAL,           -- Auto-escalate if not acknowledged
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for corrective action approvals
CREATE INDEX IF NOT EXISTS idx_ca_approvals_action_id ON corrective_action_approvals(action_id);
CREATE INDEX IF NOT EXISTS idx_ca_approvals_approver_id ON corrective_action_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_ca_approvals_status ON corrective_action_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_ca_approvals_level ON corrective_action_approvals(approval_level);

-- Indexes for corrective action photos
CREATE INDEX IF NOT EXISTS idx_ca_photos_action_id ON corrective_action_photos(action_id);
CREATE INDEX IF NOT EXISTS idx_ca_photos_type ON corrective_action_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_ca_photos_taken_by ON corrective_action_photos(taken_by);
CREATE INDEX IF NOT EXISTS idx_ca_photos_phase ON corrective_action_photos(phase);

-- Indexes for workflow tracking
CREATE INDEX IF NOT EXISTS idx_ca_workflow_action_id ON corrective_action_workflow(action_id);
CREATE INDEX IF NOT EXISTS idx_ca_workflow_status ON corrective_action_workflow(current_status);
CREATE INDEX IF NOT EXISTS idx_ca_workflow_overdue ON corrective_action_workflow(is_overdue);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_ca_notifications_action_id ON corrective_action_notifications(action_id);
CREATE INDEX IF NOT EXISTS idx_ca_notifications_recipient ON corrective_action_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_ca_notifications_scheduled ON corrective_action_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_ca_notifications_sent ON corrective_action_notifications(sent_at);

-- =============================================================================
-- ENHANCED FUNCTIONS FOR WORKFLOW MANAGEMENT
-- =============================================================================

-- Function to automatically determine required approval levels based on action
CREATE OR REPLACE FUNCTION determine_approval_requirements(
    p_action_id UUID,
    p_estimated_cost NUMERIC DEFAULT 0,
    p_risk_level VARCHAR DEFAULT 'medium'
)
RETURNS TABLE (
    approval_level approval_level,
    sequence_order INTEGER,
    required_role VARCHAR
) AS $$
BEGIN
    -- Basic supervisor approval always required
    RETURN QUERY 
    SELECT 'supervisor'::approval_level, 1, 'supervisor'::VARCHAR;
    
    -- Manager approval for medium cost or high risk
    IF p_estimated_cost > 10000 OR p_risk_level IN ('high', 'extremely_high') THEN
        RETURN QUERY 
        SELECT 'manager'::approval_level, 2, 'manager'::VARCHAR;
    END IF;
    
    -- Safety officer approval for safety-related high risk
    IF p_risk_level IN ('high', 'extremely_high') THEN
        RETURN QUERY 
        SELECT 'safety_officer'::approval_level, 3, 'safety_officer'::VARCHAR;
    END IF;
    
    -- Executive approval for very high cost
    IF p_estimated_cost > 50000 THEN
        RETURN QUERY 
        SELECT 'executive'::approval_level, 4, 'executive'::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to submit corrective action for approval
CREATE OR REPLACE FUNCTION submit_corrective_action_for_approval(
    p_action_id UUID,
    p_submitted_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_action_exists BOOLEAN;
    v_estimated_cost NUMERIC;
    v_risk_level VARCHAR;
    v_approval_req RECORD;
BEGIN
    -- Check if action exists and get details
    SELECT 
        (COUNT(*) > 0),
        COALESCE(MAX(estimated_cost), 0),
        CASE 
            WHEN EXISTS(
                SELECT 1 FROM safety_patrols sp 
                JOIN corrective_actions ca ON sp.id = ca.patrol_id 
                WHERE ca.id = p_action_id AND sp.risk_level IN ('high', 'extremely_high')
            ) THEN 'high'
            ELSE 'medium'
        END
    INTO v_action_exists, v_estimated_cost, v_risk_level
    FROM corrective_actions 
    WHERE id = p_action_id;
    
    IF NOT v_action_exists THEN
        RAISE EXCEPTION 'Corrective action not found: %', p_action_id;
    END IF;
    
    -- Create approval workflow records
    FOR v_approval_req IN 
        SELECT * FROM determine_approval_requirements(p_action_id, v_estimated_cost, v_risk_level)
    LOOP
        INSERT INTO corrective_action_approvals (
            action_id,
            approval_level,
            required_approver_role,
            sequence_order,
            is_final_approval
        ) VALUES (
            p_action_id,
            v_approval_req.approval_level,
            v_approval_req.required_role,
            v_approval_req.sequence_order,
            v_approval_req.sequence_order = (
                SELECT MAX(sequence_order) 
                FROM determine_approval_requirements(p_action_id, v_estimated_cost, v_risk_level)
            )
        );
    END LOOP;
    
    -- Update workflow status
    INSERT INTO corrective_action_workflow (
        action_id,
        current_status,
        current_stage,
        next_required_action,
        submission_date,
        requires_safety_approval,
        requires_manager_approval,
        requires_executive_approval,
        high_risk_action
    ) VALUES (
        p_action_id,
        'submitted',
        'Pending Approval',
        'Waiting for supervisor approval',
        NOW(),
        v_risk_level IN ('high', 'extremely_high'),
        v_estimated_cost > 10000 OR v_risk_level IN ('high', 'extremely_high'),
        v_estimated_cost > 50000,
        v_risk_level IN ('high', 'extremely_high')
    )
    ON CONFLICT (action_id) DO UPDATE SET
        current_status = 'submitted',
        current_stage = 'Pending Approval',
        next_required_action = 'Waiting for supervisor approval',
        submission_date = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to approve/reject corrective action at a specific level
CREATE OR REPLACE FUNCTION process_corrective_action_approval(
    p_action_id UUID,
    p_approver_id UUID,
    p_approval_level approval_level,
    p_decision VARCHAR, -- 'approved' or 'rejected'
    p_notes TEXT DEFAULT NULL,
    p_conditions TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_next_sequence INTEGER;
    v_is_final BOOLEAN;
    v_all_approved BOOLEAN;
BEGIN
    -- Validate decision
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision: %. Must be approved or rejected', p_decision;
    END IF;
    
    -- Update the approval record
    UPDATE corrective_action_approvals SET
        approver_id = p_approver_id,
        approval_status = p_decision,
        approval_date = NOW(),
        approval_notes = p_notes,
        conditions = p_conditions,
        rejection_reason = CASE WHEN p_decision = 'rejected' THEN p_rejection_reason END,
        updated_at = NOW()
    WHERE action_id = p_action_id 
    AND approval_level = p_approval_level
    AND approval_status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No pending approval found for action % at level %', p_action_id, p_approval_level;
    END IF;
    
    -- If rejected, update workflow and stop
    IF p_decision = 'rejected' THEN
        UPDATE corrective_action_workflow SET
            current_status = 'rejected',
            current_stage = 'Rejected - Needs Revision',
            next_required_action = 'Revise action based on feedback and resubmit',
            updated_at = NOW()
        WHERE action_id = p_action_id;
        
        RETURN TRUE;
    END IF;
    
    -- If approved, check if this was the final approval
    SELECT is_final_approval INTO v_is_final
    FROM corrective_action_approvals
    WHERE action_id = p_action_id AND approval_level = p_approval_level;
    
    IF v_is_final THEN
        -- All approvals complete
        UPDATE corrective_action_workflow SET
            current_status = 'approved',
            current_stage = 'Approved - Ready for Implementation',
            next_required_action = 'Begin implementation work',
            approval_completed_date = NOW(),
            updated_at = NOW()
        WHERE action_id = p_action_id;
    ELSE
        -- Find next approval needed
        SELECT sequence_order INTO v_next_sequence
        FROM corrective_action_approvals
        WHERE action_id = p_action_id 
        AND approval_status = 'pending'
        ORDER BY sequence_order
        LIMIT 1;
        
        UPDATE corrective_action_workflow SET
            current_status = 'submitted',
            current_stage = 'Pending Higher Level Approval',
            next_required_action = 'Waiting for next level approval',
            updated_at = NOW()
        WHERE action_id = p_action_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE corrective_action_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_action_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_action_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_action_notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies for authenticated users - Drop existing first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action approvals" ON corrective_action_approvals;
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action workflow" ON corrective_action_workflow;
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action notifications" ON corrective_action_notifications;

CREATE POLICY "Allow authenticated users full access to corrective action approvals" 
ON corrective_action_approvals FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users full access to corrective action photos" 
ON corrective_action_photos FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users full access to corrective action workflow" 
ON corrective_action_workflow FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users full access to corrective action notifications" 
ON corrective_action_notifications FOR ALL TO authenticated USING (true);

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Summary comment
COMMENT ON TABLE corrective_action_approvals IS 'Approval workflow tracking for corrective actions';
COMMENT ON TABLE corrective_action_photos IS 'Photos associated with corrective actions at different workflow phases';
COMMENT ON TABLE corrective_action_workflow IS 'Overall workflow status and progress tracking for corrective actions';
COMMENT ON TABLE corrective_action_notifications IS 'Notification system for corrective action workflow events';

SELECT 'Enhanced corrective action workflow schema created successfully!' as status;
