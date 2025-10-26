-- Update patrol status enum to support improved workflow
-- This migration adds the new status values for better patrol lifecycle management

-- First, check if we need to update the enum
DO $$
BEGIN
    -- Check if the new enum values already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'patrol_status'::regtype 
        AND enumlabel = 'open'
    ) THEN
        -- Drop the existing enum constraint temporarily
        ALTER TABLE safety_patrols ALTER COLUMN status DROP DEFAULT;
        
        -- Add new enum values
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'open';
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'pending_action';
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'pending_verification';
        -- Keep existing 'completed' 
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'closed';
        
        -- Update default value
        ALTER TABLE safety_patrols ALTER COLUMN status SET DEFAULT 'open';
        
        -- Update existing 'draft' records to 'open'
        UPDATE safety_patrols SET status = 'open' WHERE status = 'draft';
        
        -- Update existing 'in_progress' records to 'pending_action' if they have corrective actions
        UPDATE safety_patrols 
        SET status = 'pending_action' 
        WHERE status = 'in_progress' 
        AND id IN (
            SELECT DISTINCT patrol_id 
            FROM corrective_actions 
            WHERE status IN ('assigned', 'in_progress')
        );
        
        -- Update patrols to 'pending_verification' if they have completed actions needing verification
        UPDATE safety_patrols 
        SET status = 'pending_verification' 
        WHERE status = 'in_progress' 
        AND id IN (
            SELECT DISTINCT patrol_id 
            FROM corrective_actions 
            WHERE status = 'completed' 
            AND (verification_notes IS NULL OR verification_notes = '')
        );
        
        -- Update patrols to 'completed' if all actions are verified
        UPDATE safety_patrols 
        SET status = 'completed' 
        WHERE id IN (
            SELECT p.id 
            FROM safety_patrols p
            LEFT JOIN corrective_actions ca ON p.id = ca.patrol_id
            GROUP BY p.id
            HAVING COUNT(ca.id) > 0 
            AND COUNT(CASE WHEN ca.verification_notes IS NOT NULL AND ca.verification_notes != '' THEN 1 END) = COUNT(ca.id)
        );
        
        RAISE NOTICE 'Successfully updated patrol_status enum with new lifecycle values';
    ELSE
        RAISE NOTICE 'Patrol status enum already contains new values';
    END IF;
END $$;

-- Create helper function to automatically update patrol status
CREATE OR REPLACE FUNCTION update_patrol_status(patrol_id_param UUID)
RETURNS VOID AS $$
DECLARE
    action_count INTEGER;
    completed_count INTEGER;
    verified_count INTEGER;
    new_status patrol_status;
BEGIN
    -- Count corrective actions for this patrol
    SELECT COUNT(*) INTO action_count
    FROM corrective_actions 
    WHERE patrol_id = patrol_id_param;
    
    -- If no corrective actions, status should be 'open'
    IF action_count = 0 THEN
        new_status := 'open';
    ELSE
        -- Count completed actions
        SELECT COUNT(*) INTO completed_count
        FROM corrective_actions 
        WHERE patrol_id = patrol_id_param 
        AND status = 'completed';
        
        -- Count verified actions (have verification notes)
        SELECT COUNT(*) INTO verified_count
        FROM corrective_actions 
        WHERE patrol_id = patrol_id_param 
        AND verification_notes IS NOT NULL 
        AND verification_notes != '';
        
        -- Determine status based on action states
        IF verified_count = action_count THEN
            -- All actions are verified
            new_status := 'completed';
        ELSIF completed_count > verified_count THEN
            -- Some actions completed but not all verified
            new_status := 'pending_verification';
        ELSE
            -- Actions exist but not all completed
            new_status := 'pending_action';
        END IF;
    END IF;
    
    -- Update the patrol status
    UPDATE safety_patrols 
    SET status = new_status, updated_at = NOW()
    WHERE id = patrol_id_param;
    
    RAISE NOTICE 'Updated patrol % status to %', patrol_id_param, new_status;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-update patrol status when corrective actions change
CREATE OR REPLACE FUNCTION trigger_update_patrol_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update patrol status when corrective action is inserted, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        PERFORM update_patrol_status(OLD.patrol_id);
        RETURN OLD;
    ELSE
        PERFORM update_patrol_status(NEW.patrol_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on corrective_actions table
DROP TRIGGER IF EXISTS trigger_patrol_status_on_action_change ON corrective_actions;
CREATE TRIGGER trigger_patrol_status_on_action_change
    AFTER INSERT OR UPDATE OR DELETE ON corrective_actions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_patrol_status();

COMMENT ON FUNCTION update_patrol_status(UUID) IS 'Updates patrol status based on corrective action lifecycle';
COMMENT ON FUNCTION trigger_update_patrol_status() IS 'Trigger function to automatically update patrol status when corrective actions change';