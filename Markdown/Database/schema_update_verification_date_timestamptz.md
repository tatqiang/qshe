-- Updated Corrective Actions Schema - verification_date field fix
-- Applied: October 8, 2025
-- Change: verification_date field type changed from 'date' to 'timestamptz'

-- BEFORE: verification_date date (only stored date, defaulted to 00:00:00 timezone)
-- AFTER:  verification_date timestamptz (stores full timestamp with timezone)

-- This change allows proper storage of verification timestamps including:
-- - Exact time when verification was performed
-- - Timezone information for accurate display
-- - Proper time-based validations (60-minute edit window)

-- Example values now stored:
-- OLD: 2025-10-08 (would display as 7:00 AM due to timezone conversion)
-- NEW: 2025-10-08 09:40:20.042+00 (displays actual verification time)

-- Impact on application:
-- ✅ Verification times now show actual time instead of 7:00 AM default
-- ✅ 60-minute edit window validation now works correctly
-- ✅ Time-based business logic functions properly
-- ✅ Better audit trail with precise timestamps

-- Database field definition:
-- Column: verification_date
-- Type: timestamptz (timestamp with time zone)
-- Nullable: true
-- Purpose: Records exact timestamp when corrective action was verified

-- Related fields:
-- - verification_notes: TEXT (stores APPROVED:/REJECTED: prefix + notes)
-- - verified_by: UUID (references user who performed verification)
-- - updated_at: timestamptz (general record update timestamp)

COMMENT ON COLUMN corrective_actions.verification_date IS 'Timestamp when corrective action was verified (includes timezone)';