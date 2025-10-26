# Safety Audit Score Calculation Architecture

## Database Design

### Tables
1. **safety_audits** - Main audit record with aggregate scores
2. **safety_audit_results** - Individual requirement scores (one row per requirement)

### Automatic Score Calculation via Triggers

The database has **TWO TRIGGERS** that automatically calculate scores:

```sql
-- Trigger 1: After any change to safety_audit_results
create trigger trigger_calculate_audit_scores
after INSERT or DELETE or UPDATE on safety_audit_results 
for EACH row
execute FUNCTION trigger_calculate_audit_scores();

-- Trigger 2: Updates category scores
create trigger trg_update_audit_scores
after INSERT or DELETE or UPDATE on safety_audit_results 
for EACH row
execute FUNCTION update_audit_category_scores();
```

### How It Works

**The CORRECT workflow:**
1. ✅ Insert audit record into `safety_audits` (scores can be 0 or calculated)
2. ✅ Insert individual requirement scores into `safety_audit_results`
3. ✅ Database triggers automatically recalculate scores in `safety_audits`
4. ✅ Scores are now correct in the database

**The PROBLEM we had:**
- Client-side was calculating scores correctly
- But we were trying to save them BEFORE the results were inserted
- Database triggers would overwrite our calculated scores with 0
- Solution: Let the database triggers do the calculation

## Current Implementation (Fixed)

### Client-Side (Form)
- **Purpose**: Display scores in real-time to user
- **Location**: `SafetyAuditForm.tsx` - `calculatedScores` useMemo
- **NOT saved**: These are for UI display only

### Database-Side (Triggers)
- **Purpose**: Official source of truth for scores
- **Location**: Database functions `trigger_calculate_audit_scores()` and `update_audit_category_scores()`
- **SAVED**: These are what actually get stored

### Data Flow

```
User fills form with requirement scores
  ↓
Form calculates scores for display (client-side)
  ↓
Dashboard saves audit + results to database
  ↓
  1. Insert into safety_audits (scores = 0 or calculated)
  2. Insert into safety_audit_results (requirement scores)
  ↓
Database triggers fire automatically
  ↓
Triggers recalculate scores based on safety_audit_results
  ↓
safety_audits.total_score, weighted_average, etc. updated
  ↓
Dashboard fetches updated audit to see final scores
```

## Debugging Steps

If scores are still 0.00, check these console logs:

1. **"📊 Calculated scores:"** - Form calculates scores (for display)
2. **"📝 Submitting audit with user info and scores:"** - Wrapper preserves data
3. **"📊 Dashboard received scores:"** - Dashboard gets scores
4. **"💾 About to insert results:"** - Check if results array has data
5. **"✅ Saved X audit results"** - Results inserted (triggers fire here)
6. **"🔄 AFTER triggers fired:"** - Database scores after recalculation

### Key Questions to Answer:

- **Q1**: Are requirement scores being selected in the form?
  - Look for: `resultsByCategory` should have scores (0, 1, 2, or 3)
  
- **Q2**: Are results being inserted into safety_audit_results?
  - Look for: "Saved X audit results" where X > 0
  
- **Q3**: Do the triggers actually fire?
  - Look for: "AFTER triggers fired" log with updated scores

## Solution Summary

**What We Changed:**
1. ✅ Fixed `SafetyAuditFormWithUser` wrapper to preserve score data
2. ✅ Added comprehensive logging at every step
3. ✅ Added post-insert fetch to see trigger results
4. ✅ Let database triggers calculate the official scores

**What To Test:**
1. Create new audit
2. **Select scores** for at least some requirements (0, 1, 2, or 3)
3. Submit form
4. Check console logs for the 6 key messages above
5. Check database - scores should be calculated by triggers

**Expected Result:**
- Scores display correctly in form (client calculation)
- Results save to `safety_audit_results` table
- Triggers recalculate scores in `safety_audits` table
- Both client and database show matching scores
