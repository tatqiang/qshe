-- Add approval workflow columns to existing corrective_actions table
-- This fixes the "Could not find the 'approved_at' column" error

-- Add approval workflow columns
ALTER TABLE public.corrective_actions 
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corrective_actions_approved_by ON public.corrective_actions(approved_by);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_approved_at ON public.corrective_actions(approved_at);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_rejected_by ON public.corrective_actions(rejected_by);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_rejected_at ON public.corrective_actions(rejected_at);

-- Add foreign key constraints if users table exists
DO $$ 
BEGIN
    -- Add foreign key constraint for approved_by if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_corrective_actions_approved_by' 
                      AND table_name = 'corrective_actions') THEN
            ALTER TABLE public.corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_approved_by 
            FOREIGN KEY (approved_by) REFERENCES public.users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_corrective_actions_rejected_by' 
                      AND table_name = 'corrective_actions') THEN
            ALTER TABLE public.corrective_actions 
            ADD CONSTRAINT fk_corrective_actions_rejected_by 
            FOREIGN KEY (rejected_by) REFERENCES public.users(id);
        END IF;
    END IF;
END $$;

-- Update any existing records to have proper status if needed
UPDATE public.corrective_actions 
SET status = 'assigned' 
WHERE status IS NULL;

COMMENT ON COLUMN public.corrective_actions.approved_by IS 'User who approved this corrective action';
COMMENT ON COLUMN public.corrective_actions.approved_at IS 'Timestamp when action was approved';
COMMENT ON COLUMN public.corrective_actions.rejected_by IS 'User who rejected this corrective action';
COMMENT ON COLUMN public.corrective_actions.rejected_at IS 'Timestamp when action was rejected';
COMMENT ON COLUMN public.corrective_actions.rejection_reason IS 'Reason provided for rejection';
COMMENT ON COLUMN public.corrective_actions.verification_notes IS 'Notes from verification process';