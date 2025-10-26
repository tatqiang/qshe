# User List Job Title Display Fix

## Problem
The Team Members list was showing "No Position" for all users instead of displaying their actual job titles from the `job_title` field in the database.

## Root Cause
The `displayUser` object mapping in `UserManagement.tsx` was not checking the `job_title` field from the database, only checking:
- `position_title` (old field)
- `positionTitle` (Redux state format)
- `position` (fallback)

## Solution
Updated the field mapping to include `job_title` as the primary source:

```typescript
positionTitle: user.job_title || user.position_title || user.positionTitle || user.position
```

## Changes Made

### File: `src/components/features/users/UserManagement.tsx`

**Line 487** - Updated displayUser mapping:
```typescript
// Before
positionTitle: user.position_title || user.positionTitle || user.position,

// After
positionTitle: user.job_title || user.position_title || user.positionTitle || user.position,
```

## Field Priority Order
1. `job_title` - Database field (PRIMARY)
2. `position_title` - Legacy field
3. `positionTitle` - Redux/state format
4. `position` - Fallback

## Testing
✅ Users with `job_title` in database will now display correctly
✅ "No Position" badge only shows if none of the fields have a value
✅ Backward compatible with existing position field names

## Example
**Before:**
```
Nithat Suksomboonlert
nithat.su@th.jec.com
No Position  ❌
```

**After:**
```
Nithat Suksomboonlert
nithat.su@th.jec.com
Senior Manager - QSHE  ✅
```

## Database Field
The `job_title` field should contain the user's job position/title:
- Example: "Senior Manager - QSHE"
- Example: "Safety Officer"
- Example: "Construction Worker"

## Related Components
This fix affects:
- ✅ `UserManagement.tsx` - Team Members list
- ℹ️ `UserProfile.tsx` - Already uses `positionTitle` field
- ℹ️ `UserProfileModal.tsx` - Already uses `positionTitle` field

## Notes
- The fix maintains backward compatibility by checking all possible field names
- If you need to update job titles in bulk, update the `job_title` column in the users table
- The position badge will show green with the job title, or gray with "No Position" if empty
